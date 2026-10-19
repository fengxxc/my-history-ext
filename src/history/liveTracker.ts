import { browser, type Browser } from 'wxt/browser';
import {
  clearHistories,
  createRecord,
  joinUrl,
  listHistories,
  removeHistoriesByUrl,
  saveHistories,
  saveHistory,
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

    const record: HistoryRecord = createRecord({
      url: item.url,
      title: item.title,
      visitTime: last?.visitTime ?? item.lastVisitTime ?? Date.now(),
      source: 'local',
      visitId: last?.visitId,
      referringVisitId: last?.referringVisitId,
      transition: last?.transition,
    });

    await saveHistory(record);
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
