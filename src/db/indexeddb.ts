/**
 * 基于 IndexedDB 的轻量级封装，提供 Promise 风格的增删改查能力。
 *
 * 使用方式：
 *   const db = new IndexedDBStore<HistoryItem>({
 *     dbName: 'my-history',
 *     version: 1,
 *     stores: [
 *       { name: 'history', keyPath: 'id', autoIncrement: false,
 *         indexes: [{ name: 'by_visitTime', keyPath: 'visitTime' }] },
 *     ],
 *   }, 'history');
 */

export interface IndexSchema {
  /** 索引名称 */
  name: string;
  /** 索引字段，支持复合索引 */
  keyPath: string | string[];
  /** 是否唯一 */
  unique?: boolean;
  /** 数组字段是否为每个元素建立索引 */
  multiEntry?: boolean;
}

export interface StoreSchema {
  /** 对象仓库名称 */
  name: string;
  /** 主键字段 */
  keyPath?: string | string[];
  /** 是否自增主键 */
  autoIncrement?: boolean;
  /** 索引定义 */
  indexes?: IndexSchema[];
}

export interface DBSchema {
  dbName: string;
  version?: number;
  stores: StoreSchema[];
}

export type QueryRange = IDBKeyRange | IDBValidKey | null;

export interface QueryOptions {
  /** 使用的索引名称，不传则使用主键 */
  index?: string;
  /** 查询范围 */
  range?: QueryRange;
  /** 遍历方向 */
  direction?: IDBCursorDirection;
  /** 跳过的条数 */
  offset?: number;
  /** 返回的最大条数 */
  limit?: number;
  /** 自定义过滤器 */
  filter?: (value: any) => boolean;
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function promisifyTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export class IndexedDBStore<T = any, K extends IDBValidKey = IDBValidKey> {
  private readonly schema: DBSchema;
  private readonly storeName!: string;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(schema: DBSchema, storeName?: string) {
    this.schema = schema;
    const name = storeName ?? schema.stores[0]?.name;
    if (!name) {
      throw new Error('[IndexedDBStore] 必须指定至少一个 store');
    }
    this.storeName = name;
  }

  /** 打开（并在需要时升级）数据库 */
  open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('[IndexedDBStore] 当前环境不支持 IndexedDB'));
        return;
      }

      const request = indexedDB.open(this.schema.dbName, this.schema.version ?? 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        for (const store of this.schema.stores) {
          let objectStore: IDBObjectStore;
          if (db.objectStoreNames.contains(store.name)) {
            objectStore = request.transaction!.objectStore(store.name);
          } else {
            objectStore = db.createObjectStore(store.name, {
              keyPath: store.keyPath,
              autoIncrement: store.autoIncrement ?? false,
            });
          }
          for (const index of store.indexes ?? []) {
            if (!objectStore.indexNames.contains(index.name)) {
              objectStore.createIndex(index.name, index.keyPath, {
                unique: index.unique ?? false,
                multiEntry: index.multiEntry ?? false,
              });
            }
          }
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        // 其他页面触发版本升级时，主动关闭当前连接，避免阻塞
        db.onversionchange = () => {
          db.close();
          this.dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('[IndexedDBStore] 数据库升级被其他连接阻塞'));
    });

    return this.dbPromise;
  }

  /** 关闭数据库连接 */
  async close(): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    db.close();
    this.dbPromise = null;
  }

  /** 获取事务中的 objectStore，供自定义操作使用 */
  async withStore<R>(
    mode: IDBTransactionMode,
    handler: (store: IDBObjectStore) => R | Promise<R>,
  ): Promise<R> {
    const db = await this.open();
    const tx = db.transaction(this.storeName, mode);
    const store = tx.objectStore(this.storeName);
    const result = await handler(store);
    await promisifyTransaction(tx);
    return result;
  }

  // ------------------------------ 增 ------------------------------

  /** 新增一条记录，主键重复时报错 */
  add(value: T, key?: K): Promise<K> {
    return this.withStore('readwrite', (store) =>
      promisifyRequest(store.add(value, key)) as Promise<K>,
    );
  }

  /** 批量新增 */
  addMany(values: T[]): Promise<K[]> {
    return this.withStore('readwrite', (store) =>
      Promise.all(values.map((v) => promisifyRequest(store.add(v)) as Promise<K>)),
    );
  }

  // ------------------------------ 改 ------------------------------

  /** 新增或覆盖一条记录 */
  put(value: T, key?: K): Promise<K> {
    return this.withStore('readwrite', (store) =>
      promisifyRequest(store.put(value, key)) as Promise<K>,
    );
  }

  /** 批量新增或覆盖 */
  putMany(values: T[]): Promise<K[]> {
    return this.withStore('readwrite', (store) =>
      Promise.all(values.map((v) => promisifyRequest(store.put(v)) as Promise<K>)),
    );
  }

  /** 局部更新：读取后合并字段再写回，记录不存在返回 null */
  update(key: K, patch: Partial<T> | ((old: T) => T)): Promise<T | null> {
    return this.withStore('readwrite', async (store) => {
      const old = await promisifyRequest<T | undefined>(store.get(key));
      if (old === undefined) return null;
      const next = typeof patch === 'function' ? (patch as (o: T) => T)(old) : { ...old, ...patch };
      await promisifyRequest(store.put(next));
      return next;
    });
  }

  // ------------------------------ 删 ------------------------------

  /** 按主键删除 */
  delete(key: K | IDBKeyRange): Promise<void> {
    return this.withStore('readwrite', (store) => promisifyRequest(store.delete(key)));
  }

  /** 批量删除 */
  deleteMany(keys: K[]): Promise<void> {
    return this.withStore('readwrite', async (store) => {
      await Promise.all(keys.map((k) => promisifyRequest(store.delete(k))));
    });
  }

  /** 按索引值删除所有匹配记录，返回删除条数 */
  deleteByIndex(indexName: string, value: IDBValidKey | IDBKeyRange): Promise<number> {
    return this.withStore('readwrite', (store) => {
      const request = store.index(indexName).openCursor(value);
      return new Promise<number>((resolve, reject) => {
        let deleted = 0;
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) {
            resolve(deleted);
            return;
          }
          cursor.delete();
          deleted += 1;
          cursor.continue();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  /** 清空当前 store */
  clear(): Promise<void> {
    return this.withStore('readwrite', (store) => promisifyRequest(store.clear()));
  }

  /** 删除整个数据库 */
  async destroy(): Promise<void> {
    await this.close();
    await promisifyRequest(indexedDB.deleteDatabase(this.schema.dbName) as unknown as IDBRequest);
  }

  // ------------------------------ 查 ------------------------------

  /** 按主键获取 */
  async get(key: K): Promise<T | undefined> {
    return this.withStore('readonly', (store) => promisifyRequest<T | undefined>(store.get(key)));
  }

  /** 获取全部（或指定范围）记录 */
  getAll(range?: QueryRange, count?: number): Promise<T[]> {
    return this.withStore('readonly', (store) =>
      promisifyRequest<T[]>(store.getAll(range ?? undefined, count)),
    );
  }

  /** 获取全部主键 */
  getAllKeys(range?: QueryRange, count?: number): Promise<K[]> {
    return this.withStore('readonly', (store) =>
      promisifyRequest<K[]>(store.getAllKeys(range ?? undefined, count) as unknown as IDBRequest<K[]>),
    );
  }

  /** 按索引精确查询 */
  getByIndex(indexName: string, value: IDBValidKey | IDBKeyRange): Promise<T[]> {
    return this.withStore('readonly', (store) =>
      promisifyRequest<T[]>(store.index(indexName).getAll(value)),
    );
  }

  /** 按索引获取主键列表 */
  getAllKeysByIndex(indexName: string, value?: IDBValidKey | IDBKeyRange): Promise<K[]> {
    return this.withStore('readonly', (store) =>
      promisifyRequest(
        store.index(indexName).getAllKeys(value) as unknown as IDBRequest<K[]>,
      ),
    );
  }

  /** 按索引查询第一条 */
  getOneByIndex(indexName: string, value: IDBValidKey | IDBKeyRange): Promise<T | undefined> {
    return this.withStore('readonly', (store) =>
      promisifyRequest<T | undefined>(store.index(indexName).get(value)),
    );
  }

  /** 统计条数 */
  count(range?: QueryRange, indexName?: string): Promise<number> {
    return this.withStore('readonly', (store) => {
      const source = indexName ? store.index(indexName) : store;
      return promisifyRequest<number>(source.count(range ?? undefined));
    });
  }

  /** 是否存在指定主键 */
  async has(key: K): Promise<boolean> {
    return (await this.count(key)) > 0;
  }

  /** 游标分页/过滤查询 */
  query(options: QueryOptions = {}): Promise<T[]> {
    const { index, range, direction = 'next', offset = 0, limit = Infinity, filter } = options;

    return this.withStore('readonly', (store) => {
      const source = index ? store.index(index) : store;
      const request = source.openCursor(
        (range ?? undefined) as IDBKeyRange | IDBValidKey | undefined,
        direction,
      );

      return new Promise<T[]>((resolve, reject) => {
        const result: T[] = [];
        let advanced = offset === 0;

        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor || result.length >= limit) {
            resolve(result);
            return;
          }
          if (!advanced) {
            advanced = true;
            if (offset > 0) {
              cursor.advance(offset);
              return;
            }
          }
          const value = cursor.value as T;
          if (!filter || filter(value)) {
            result.push(value);
          }
          if (result.length >= limit) {
            resolve(result);
            return;
          }
          cursor.continue();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  /** 遍历所有记录，回调返回 false 时停止 */
  each(callback: (value: T, key: IDBValidKey) => boolean | void, options: QueryOptions = {}): Promise<void> {
    const { index, range, direction = 'next' } = options;
    return this.withStore('readonly', (store) => {
      const source = index ? store.index(index) : store;
      const request = source.openCursor(
        (range ?? undefined) as IDBKeyRange | IDBValidKey | undefined,
        direction,
      );
      return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) {
            resolve();
            return;
          }
          if (callback(cursor.value as T, cursor.key) === false) {
            resolve();
            return;
          }
          cursor.continue();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }
}

/** 区间辅助函数 */
export const range = {
  only: (value: IDBValidKey) => IDBKeyRange.only(value),
  gte: (value: IDBValidKey) => IDBKeyRange.lowerBound(value),
  gt: (value: IDBValidKey) => IDBKeyRange.lowerBound(value, true),
  lte: (value: IDBValidKey) => IDBKeyRange.upperBound(value),
  lt: (value: IDBValidKey) => IDBKeyRange.upperBound(value, true),
  between: (lower: IDBValidKey, upper: IDBValidKey, openLower = false, openUpper = false) =>
    IDBKeyRange.bound(lower, upper, openLower, openUpper),
};
