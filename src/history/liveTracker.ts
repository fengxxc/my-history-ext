import { browser, type Browser } from 'wxt/browser';
import {
  clearHistories,
  createRecord,
  getHistoriesByUrl,
  joinUrl,
  listHistories,
  removeHistoriesByUrl,
  saveHistories,
  saveHistory,
  updateHistory,
  type HistoryRecord,
} from '../db';

let registered = false;

/**
 * 监听浏览器访问 / 删除事件，实时写入数据库（source = 'local'）。
 * 必须在 background 顶层同步调用，保证 service worker 被唤醒时事件不丢失。
 */
export function registerHistoryListeners() {
  if (registered) return;
  registered = true;

  browser.history.onVisited.addListener((item) => {
    void handleVisited(item);
  });

  browser.history.onVisitRemoved.addListener((removed) => {
    void handleVisitRemoved(removed);
  });

  // 方案 1：浏览器确定/更新标题时会触发 onTitleChanged（Chrome 88+ / Firefox 78+）
  const onTitleChanged = (browser.history as any).onTitleChanged;
  onTitleChanged?.addListener((info: { url: string; title: string }) => {
    void backfillTitle(info.url, info.title);
  });

  // 方案 2：兜底，标签页标题就绪时补写（某些内核不触发 onTitleChanged 或触发过早）
  browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    const title = changeInfo.title ?? (changeInfo.status === 'complete' ? tab.title : undefined);
    if (title && tab.url) void backfillTitle(tab.url, title);
  });
}

/** 补写标题时允许回溯的时间窗口（ms）：只修补最近这段时间内、标题为空的记录 */
const TITLE_BACKFILL_WINDOW = 5 * 60 * 1000;

/**
 * 把 url 对应的、标题为空（或等于 url）的近期记录补上标题。
 * 幂等：已有标题的记录不会被覆盖。
 */
export async function backfillTitle(url: string, title?: string) {
  const t = title?.trim();
  if (!url || !t) return;

  try {
    const records = await getHistoriesByUrl(url);
    const now = Date.now();
    const targets = records.filter(
      (r) =>
        now - r.visitTime <= TITLE_BACKFILL_WINDOW &&
        (!r.title || r.title === url || r.title === joinUrl(r)),
    );
    for (const r of targets) {
      await updateHistory(String(r.id), { title: t });
    }
  } catch (err) {
    console.error('[history] 补写标题失败', url, err);
  }
}

/** 从已打开的标签页里找该 url 的标题（onVisited 时标题常常还没解析出来） */
async function titleFromTabs(url: string): Promise<string | undefined> {
  try {
    // 不用 query({ url })：url 是 match pattern，带 query/hash 的地址匹配不可靠
    const tabs = await browser.tabs.query({});
    const hit = tabs.find((t) => t.url === url && t.title && t.title !== url);
    return hit?.title ?? undefined;
  } catch {
    return undefined;
  }
}

/** 向 history API 反查标题（浏览器自身的标题通常稍后才写入） */
async function titleFromHistory(url: string): Promise<string | undefined> {
  try {
    const items = await browser.history.search({ text: url, startTime: 0, maxResults: 20 });
    const hit = items.find((i) => i.url === url && i.title);
    return hit?.title ?? undefined;
  } catch {
    return undefined;
  }
}

/** 延迟重试补标题（MV3 service worker 可能被回收，所以只做短时重试，长链路交给事件监听） */
function scheduleTitleRetry(url: string, delays = [500, 1500, 4000]) {
  delays.forEach((ms) => {
    setTimeout(async () => {
      const title = (await titleFromTabs(url)) ?? (await titleFromHistory(url));
      if (title) await backfillTitle(url, title);
    }, ms);
  });
}

/** 新增访问 */
export async function handleVisited(item: Browser.history.HistoryItem) {
  if (!item.url) return;

  /* ignore calendar page visits */
  const calendarUrl = browser.runtime.getURL("/calendar.html");
  const browserId = browser.runtime.id;
  // console.log('[history] calendarUrl', calendarUrl, 'browserId', browserId);
  if (item.url === calendarUrl || item.url.startsWith(`moz-extension://${browserId}/calendar.html`)) {
    return;
  }


  try {
    // onVisited 只给到 lastVisitTime，再调 getVisits 取最后一次访问的明细（visitId / transition）
    const visits = await browser.history.getVisits({ url: item.url }).catch(() => []);
    const last = visits.length ? visits[visits.length - 1] : undefined;

    // onVisited 回调里 title 往往还是空的（文档尚未解析出 <title>）：
    // 先尝试从当前标签页取，再退回 history.search，最后交给延迟重试 / onTitleChanged 补写。
    const title =
      item.title?.trim() || (await titleFromTabs(item.url)) || (await titleFromHistory(item.url));

    const record: HistoryRecord = createRecord({
      url: item.url,
      title,
      visitTime: last?.visitTime ?? item.lastVisitTime ?? Date.now(),
      source: 'local',
      visitId: last?.visitId,
      referringVisitId: last?.referringVisitId,
      transition: last?.transition,
    });

    await saveHistory(record);

    if (!record.title) scheduleTitleRetry(item.url);
  } catch (err) {
    console.error('[history] onVisited 写入失败', item.url, err);
  }
}

/** 删除访问：allHistory = true 表示清空全部，否则按 urls 删除 */
export async function handleVisitRemoved(removed: Browser.history.RemovedResult) {
  try {
    if (removed.allHistory) {
      await clearHistories();
      return;
    }

    if (removed.urls && removed.urls.length > 0) {
      for (const url of removed.urls) {
        await removeHistoriesByUrl(url);
      }
      return;
    }

    // Chrome / Firefox 共有行为：
    // 当用户在浏览器自带历史页（chrome://history 或 about:history）删除记录时，
    // 浏览器内部走的是 C++ ExpireHistoryBetween() 时间范围路径（DeletionInfo::ForRange），
    // 而非扩展侧的 deleteUrl() 路径（DeletionInfo::ForUrls）。
    // 前者不枚举具体 URL 列表，导致扩展收到 { allHistory: false, urls: [] }。
    // 此时无法从事件中得知哪些 URL 被删，需做一次对账。
    // console.warn('[history] onVisitRemoved: urls 为空且 allHistory=false，触发对账清理（浏览器 UI 时间范围删除路径）');
    await reconcileWithBrowser();
  } catch (err) {
    console.error('[history] onVisitRemoved 删除失败', err);
  }
}

/**
 * 对账：将本地 DB 中浏览器已删除的记录清理掉。
 * 分批读取 DB 记录，逐一调用 browser.history.getVisits() 确认是否仍存在。
 */
async function reconcileWithBrowser() {
  const PAGE = 500;
  let offset = 0;
  let total = 0;

  while (true) {
    const records = await listHistories({ offset, limit: PAGE });
    if (records.length === 0) break;

    // 对本批次去重，避免对同一 URL 重复查询
    const urlSet = new Set(records.map((r) => joinUrl(r)));
    for (const url of urlSet) {
      const visits = await browser.history.getVisits({ url }).catch(() => [] as Browser.history.VisitItem[]);
      if (visits.length === 0) {
        await removeHistoriesByUrl(url);
        total++;
      }
    }

    if (records.length < PAGE) break;
    offset += PAGE;
  }

  // console.log(`[history] 对账完成，共清理 ${total} 条 URL 的记录`);
}

/** 标题常常晚于 onVisited 才确定，提供一个补写标题的入口 */
export async function patchTitles(records: HistoryRecord[]) {
  if (records.length) await saveHistories(records);
}
