import { browser, type Browser } from 'wxt/browser';
import {
  clearHistories,
  createRecord,
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
    for (const url of removed.urls ?? []) {
      await removeHistoriesByUrl(url);
    }
  } catch (err) {
    console.error('[history] onVisitRemoved 删除失败', err);
  }
}

/** 标题常常晚于 onVisited 才确定，提供一个补写标题的入口 */
export async function patchTitles(records: HistoryRecord[]) {
  if (records.length) await saveHistories(records);
}
