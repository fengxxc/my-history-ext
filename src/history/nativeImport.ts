import { browser, type Browser } from 'wxt/browser';
import {
  createRecord,
  historyStore,
  importQueueStore,
  type HistoryRecord,
  type ImportQueueItem,
} from '../db';

/** 导入的时间窗口：过去 90 天 */
export const IMPORT_DAYS = 90;
/** search 一次性返回的上限（Chrome 默认只给 100 条，这里显式放开） */
const SEARCH_MAX_RESULTS = 1_000_000;
/** 写入 history 的分片大小 */
const WRITE_CHUNK = 200;
/** 每批处理多少个 URL 的 getVisits */
const VISIT_BATCH = 25;

const STATE_KEY = 'history_import_state';
export const RESUME_ALARM = 'history-import-resume';

export type ImportStatus = 'idle' | 'searching' | 'visits' | 'done' | 'error';

export interface ImportState {
  status: ImportStatus;
  /** 导入窗口起止时间 */
  startTime: number;
  endTime: number;
  /** search 返回的 URL 总数 */
  totalUrls: number;
  /** 需要补全访问明细的 URL 总数 */
  queueTotal: number;
  /** 已补全的 URL 数 */
  queueDone: number;
  /** 已写入的访问记录数 */
  recordCount: number;
  updatedAt: number;
  error?: string;
}

const DEFAULT_STATE: ImportState = {
  status: 'idle',
  startTime: 0,
  endTime: 0,
  totalUrls: 0,
  queueTotal: 0,
  queueDone: 0,
  recordCount: 0,
  updatedAt: 0,
};

/** 当前 worker 内是否已有任务在跑，避免重复触发 */
let running = false;

const sleep = (ms = 0) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function getImportState(): Promise<ImportState> {
  const res = await browser.storage.local.get(STATE_KEY);
  return { ...DEFAULT_STATE, ...((res?.[STATE_KEY] as Partial<ImportState>) ?? {}) };
}

async function setImportState(patch: Partial<ImportState>): Promise<ImportState> {
  const next: ImportState = { ...(await getImportState()), ...patch, updatedAt: Date.now() };
  await browser.storage.local.set({ [STATE_KEY]: next });
  return next;
}

/** 定时唤醒，保证 service worker 被回收后仍能续跑 */
async function ensureResumeAlarm(enabled: boolean) {
  if (!browser.alarms) return;
  if (enabled) {
    const existing = await browser.alarms.get(RESUME_ALARM);
    if (!existing) await browser.alarms.create(RESUME_ALARM, { periodInMinutes: 1 });
  } else {
    await browser.alarms.clear(RESUME_ALARM);
  }
}

/**
 * 首次安装时调用：导入过去 90 天的浏览器历史（source = 'native'）。
 * 整个过程分片 + 让出事件循环，不阻塞 service worker 的其他消息处理。
 */
export async function importNativeHistory(options: { days?: number; force?: boolean } = {}) {
  const { days = IMPORT_DAYS, force = false } = options;
  const state = await getImportState();

  if (!force && state.status === 'done') return state;
  if (running) return state;
  running = true;

  try {
    let startTime = state.startTime;
    let endTime = state.endTime;

    // 1) 拉取 URL 列表 → 写入基础记录 + 构建待补全队列
    if (force || state.status === 'idle' || state.status === 'error') {
      endTime = Date.now();
      startTime = endTime - days * 24 * 60 * 60 * 1000;
      if (force) await importQueueStore.clear();
      await setImportState({
        status: 'searching',
        startTime,
        endTime,
        totalUrls: 0,
        queueTotal: 0,
        queueDone: 0,
        recordCount: 0,
        error: undefined,
      });

      await ensureResumeAlarm(true);
      await importSearchResults(startTime, endTime);
    }

    // 2) 对 visitCount > 1 的 URL 补全完整访问明细
    await ensureResumeAlarm(true);
    await setImportState({ status: 'visits' });
    await processVisitQueue();

    await ensureResumeAlarm(false);
    return await setImportState({ status: 'done' });
  } catch (err) {
    await ensureResumeAlarm(true);
    return await setImportState({
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    running = false;
  }
}

/** 第一阶段：search 结果落库 */
async function importSearchResults(startTime: number, endTime: number) {
  const items = await browser.history.search({
    text: '',
    startTime,
    endTime,
    maxResults: SEARCH_MAX_RESULTS,
  });

  let records: HistoryRecord[] = [];
  let queue: ImportQueueItem[] = [];
  let recordCount = 0;
  let queueTotal = 0;

  const flush = async () => {
    if (records.length) {
      await historyStore.putMany(records);
      recordCount += records.length;
      records = [];
    }
    if (queue.length) {
      await importQueueStore.putMany(queue);
      queueTotal += queue.length;
      queue = [];
    }
    await setImportState({ recordCount, queueTotal, totalUrls: items.length });
    // 让出事件循环，避免长时间占用
    await sleep(0);
  };

  for (const item of items) {
    if (!item.url) continue;
    const visitCount = item.visitCount ?? 1;

    // search 每个 URL 只返回一条，先用 lastVisitTime 落一条记录
    if (item.lastVisitTime && item.lastVisitTime >= startTime) {
      records.push(
        createRecord({
          url: item.url,
          title: item.title,
          visitTime: item.lastVisitTime,
          source: 'native',
        }),
      );
    }

    // 多次访问的 URL 需要调用 getVisits 补全
    if (visitCount > 1) {
      queue.push({ url: item.url, title: item.title ?? '', visitCount });
    }

    if (records.length >= WRITE_CHUNK || queue.length >= WRITE_CHUNK) {
      await flush();
    }
  }

  await flush();
}

/**
 * 第二阶段：逐批消费队列，调用 chrome.history.getVisits 补全访问明细。
 * 每批之间让出事件循环；中断后可从队列继续（幂等）。
 */
export async function processVisitQueue() {
  const { startTime, endTime } = await getImportState();

  for (;;) {
    const batch = await importQueueStore.getAll(null, VISIT_BATCH);
    if (!batch.length) break;

    const results = await Promise.all(
      batch.map(async (item) => {
        try {
          const visits = await browser.history.getVisits({ url: item.url });
          return { item, visits };
        } catch {
          return { item, visits: [] as Browser.history.VisitItem[] };
        }
      }),
    );

    const records: HistoryRecord[] = [];
    for (const { item, visits } of results) {
      for (const visit of visits) {
        const visitTime = visit.visitTime;
        if (!visitTime) continue;
        if (startTime && visitTime < startTime) continue;
        if (endTime && visitTime > endTime) continue;
        records.push(
          createRecord({
            url: item.url,
            title: item.title,
            visitTime,
            source: 'native',
            visitId: visit.visitId,
            referringVisitId: visit.referringVisitId,
            transition: visit.transition,
          }),
        );
      }
    }

    if (records.length) await historyStore.putMany(records);
    await importQueueStore.deleteMany(batch.map((item) => item.url));

    const state = await getImportState();
    await setImportState({
      recordCount: state.recordCount + records.length,
      queueDone: state.queueDone + batch.length,
    });

    // 非阻塞：让出事件循环，给监听器与 UI 消息留出执行机会
    await sleep(0);
  }
}

/** 浏览器重启 / service worker 被唤醒时，续跑未完成的导入 */
export async function resumeImportIfNeeded() {
  const state = await getImportState();
  if (state.status === 'done' || running) return;
  if (state.status === 'idle') return;
  await importNativeHistory();
}
