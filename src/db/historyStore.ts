import { IndexedDBStore, range } from './indexeddb';

/** 历史记录数据结构 */
export interface HistoryRecord {
  /** 主键 */
  id: string | number;
  /** scheme + host + port，例如：https://www.example.com:8080 */
  origin: string;
  /** path + query + hash，例如：/path/to/resource?query=value#fragment */
  requestUri: string;
  title: string;
  /** 访问时间戳（ms） */
  visitTime: number;
  /** 标签 */
  tags?: string[];
  /** 来源，从browser.history.search api获取的为 'native'，本插件记录的为 'local'，导入的为 'imp_{自定义名称}' */
  source: string;
}

export const DB_NAME = 'my-history';
export const DB_VERSION = 1;
export const HISTORY_STORE = 'history';

/** 历史记录仓库实例（单例） */
export const historyStore = new IndexedDBStore<HistoryRecord, string>(
  {
    dbName: DB_NAME,
    version: DB_VERSION,
    stores: [
      {
        name: HISTORY_STORE,
        keyPath: 'id',
        indexes: [
          { name: 'by_origin', keyPath: 'origin' },
          { name: 'by_requestUri', keyPath: 'requestUri' },
          { name: 'by_visitTime', keyPath: 'visitTime' },
          { name: 'by_tags', keyPath: 'tags', multiEntry: true },
        ],
      },
    ],
  },
  HISTORY_STORE,
);

/** 新增或更新一条历史记录 */
export function saveHistory(record: HistoryRecord) {
  return historyStore.put(record);
}

/** 批量保存 */
export function saveHistories(records: HistoryRecord[]) {
  return historyStore.putMany(records);
}

/** 按 id 查询 */
export function getHistory(id: string) {
  return historyStore.get(id);
}

/** 按时间倒序分页查询 */
export function listHistories(params: { offset?: number; limit?: number; start?: number; end?: number } = {}) {
  const { offset = 0, limit = 50, start, end } = params;
  let keyRange: IDBKeyRange | undefined;
  if (start !== undefined && end !== undefined) keyRange = range.between(start, end);
  else if (start !== undefined) keyRange = range.gte(start);
  else if (end !== undefined) keyRange = range.lte(end);

  return historyStore.query({
    index: 'by_visitTime',
    range: keyRange ?? null,
    direction: 'prev',
    offset,
    limit,
  });
}

/** 按关键词搜索（标题或 URL 包含） */
export function searchHistories(keyword: string, limit = 50) {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return listHistories({ limit });
  return historyStore.query({
    index: 'by_visitTime',
    direction: 'prev',
    limit,
    filter: (item: HistoryRecord) =>
      item.title?.toLowerCase().includes(kw) || item.origin.toLowerCase().includes(kw) || item.requestUri?.toLowerCase().includes(kw),
  });
}

/** 按域名查询 */
export function getHistoriesByDomain(domain: string) {
  return historyStore.getByIndex('by_origin', domain);
}

/** 局部更新 */
export function updateHistory(id: string, patch: Partial<HistoryRecord>) {
  return historyStore.update(id, patch);
}

/** 删除 */
export function removeHistory(id: string) {
  return historyStore.delete(id);
}

export function removeHistories(ids: string[]) {
  return historyStore.deleteMany(ids);
}

/** 清空所有历史 */
export function clearHistories() {
  return historyStore.clear();
}

/** 总条数 */
export function countHistories() {
  return historyStore.count();
}
