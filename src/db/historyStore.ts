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
  /** 本次访问的唯一标识，来自 chrome.history.getVisits */
  visitId?: string;
  /** 来源访问的 visitId，可用于还原跳转链路 */
  referringVisitId?: string;
  /** 跳转类型：link / typed / reload / form_submit ... */
  transition?: string;
}

/** 待补全完整访问列表的 URL 队列项（仅导入阶段使用） */
export interface ImportQueueItem {
  url: string;
  title: string;
  visitCount: number;
}

export const DB_NAME = 'my-history';
export const DB_VERSION = 1;
export const HISTORY_STORE = 'history';
export const IMPORT_QUEUE_STORE = 'import_queue';

const SCHEMA = {
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
        // 新增（用于按 URL 精确删除 / 按来源统计），如不需要请告知
        { name: 'by_url', keyPath: ['origin', 'requestUri'] },
        { name: 'by_source', keyPath: 'source' },
      ],
    },
    {
      name: IMPORT_QUEUE_STORE,
      keyPath: 'url',
    },
  ],
};

/** 历史记录仓库实例（单例） */
export const historyStore = new IndexedDBStore<HistoryRecord, string>(SCHEMA, HISTORY_STORE);

/** 导入队列仓库（单例） */
export const importQueueStore = new IndexedDBStore<ImportQueueItem, string>(
  SCHEMA,
  IMPORT_QUEUE_STORE,
);

// ------------------------------ 工具 ------------------------------

/** 拆分 URL 为 origin + requestUri */
export function splitUrl(url: string): { origin: string; requestUri: string } {
  try {
    const u = new URL(url);
    return { origin: u.origin, requestUri: `${u.pathname}${u.search}${u.hash}` };
  } catch {
    return { origin: '', requestUri: url };
  }
}

/** 还原完整 URL */
export function joinUrl(record: Pick<HistoryRecord, 'origin' | 'requestUri'>): string {
  return `${record.origin}${record.requestUri}`;
}

/** 32 位 FNV-1a 哈希，输出 8 位十六进制 */
function hash32(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * 生成定长主键：`${visitTime}-${hash(url)}`（约 21 字符）。
 * 同一次访问重复写入时幂等；按主键天然就是时间序。
 */
export function makeRecordId(origin: string, requestUri: string, visitTime: number): string {
  return `${Math.round(visitTime)}-${hash32(`${origin}${requestUri}`)}`;
}

/** 构造一条历史记录 */
export function createRecord(input: {
  url: string;
  title?: string;
  visitTime: number;
  source: string;
  tags?: string[];
  visitId?: string;
  referringVisitId?: string;
  transition?: string;
}): HistoryRecord {
  const { origin, requestUri } = splitUrl(input.url);
  const visitTime = Math.round(input.visitTime);
  return {
    id: makeRecordId(origin, requestUri, visitTime),
    origin,
    requestUri,
    title: input.title ?? '',
    visitTime,
    source: input.source,
    tags: input.tags,
    visitId: input.visitId,
    referringVisitId: input.referringVisitId,
    transition: input.transition,
  };
}

// ------------------------------ 增 / 改 ------------------------------

/** 新增或更新一条历史记录 */
export function saveHistory(record: HistoryRecord) {
  return historyStore.put(record);
}

/** 批量保存 */
export function saveHistories(records: HistoryRecord[]) {
  return historyStore.putMany(records);
}

/** 局部更新 */
export function updateHistory(id: string, patch: Partial<HistoryRecord>) {
  return historyStore.update(id, patch);
}

// ------------------------------ 删 ------------------------------

/** 删除 */
export function removeHistory(id: string) {
  return historyStore.delete(id);
}

export function removeHistories(ids: string[]) {
  return historyStore.deleteMany(ids);
}

/** 删除某个 URL 的全部访问记录，返回删除条数 */
export function removeHistoriesByUrl(url: string) {
  const { origin, requestUri } = splitUrl(url);
  return historyStore.deleteByIndex('by_url', IDBKeyRange.only([origin, requestUri]));
}

/** 删除时间区间内的全部访问记录，返回删除条数 */
export function removeHistoriesByTimeRange(start: number, end: number) {
  return historyStore.deleteByIndex('by_visitTime', range.between(start, end));
}

/** 清空所有历史 */
export function clearHistories() {
  return historyStore.clear();
}

// ------------------------------ 查 ------------------------------

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

/** 按完整 URL 查询 */
export function getHistoriesByUrl(url: string) {
  const { origin, requestUri } = splitUrl(url);
  return historyStore.getByIndex('by_url', IDBKeyRange.only([origin, requestUri]));
}

/** 总条数 */
export function countHistories() {
  return historyStore.count();
}

/** 按来源统计 */
export function countHistoriesBySource(source: string) {
  return historyStore.count(source, 'by_source');
}
