import {
  RESUME_ALARM,
  importNativeHistory,
  registerHistoryListeners,
  resumeImportIfNeeded,
} from '@/src/history';

export default defineBackground(() => {
  console.log('My History background started.', { id: browser.runtime.id });

  // 1) 实时监听必须在顶层同步注册
  registerHistoryListeners();

  // 2) 首次安装：导入过去 90 天历史（后台分片执行，不阻塞）
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      void importNativeHistory();
    } else {
      void resumeImportIfNeeded();
    }
  });

  // 3) 浏览器启动 / worker 唤醒时续跑未完成的导入
  browser.runtime.onStartup?.addListener(() => {
    void resumeImportIfNeeded();
  });

  browser.alarms?.onAlarm.addListener((alarm) => {
    if (alarm.name === RESUME_ALARM) void resumeImportIfNeeded();
  });
});
