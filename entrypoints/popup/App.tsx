import React, { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from '@/src/i18n';
import { Icon } from '@/src/components/Icon';

interface HistoryItem {
  id: string;
  url?: string;
  title?: string;
  lastVisitTime?: number;
  visitCount?: number;
}

export default function App() {
  const intl = useIntl();

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const fetchHistory = async (query: string = '') => {
    setLoading(true);
    try {
      const results: Browser.history.HistoryItem[] = await browser.history.search({
        text: query,
        maxResults: 50,
        startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
      });
      setHistoryItems(results as HistoryItem[]);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(searchText);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return intl.formatMessage({ id: 'history.unknownTime' });
    return new Date(timestamp).toLocaleString(intl.locale);
  };

  return (
    <div className="popup-container">
      <header className="page-header popup-header">
        <h1 className="popup-header__title">
          <Icon name="history" size={18} style={{ marginRight: 6 }} />
          <FormattedMessage id="app.title" />
        </h1>
        <div className="popup-header__actions">
          <button
            className="btn btn--ghost-white btn--sm"
            onClick={() => browser.tabs.create({ url: browser.runtime.getURL('/calendar.html') })}
          >
            <Icon name="calendar" size={14} />
            <FormattedMessage id="app.openCalendar" />
          </button>
          <button
            // className="btn btn--icon-ghost btn--sm"
            className="btn btn--ghost btn--sm"
            onClick={() => browser.runtime.openOptionsPage()}
            title={intl.formatMessage({ id: 'app.openOptions' })}
          >
            <Icon name="settings" size={14} />
            <FormattedMessage id="app.openOptions" />
          </button>
        </div>
      </header>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder={intl.formatMessage({ id: 'search.placeholder' })}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="input"
        />
        <button type="submit" className="btn btn--primary">
          <FormattedMessage id="search.button" />
        </button>
      </form>

      <main className="history-content">
        {loading ? (
          <div className="status-placeholder">
            <FormattedMessage id="status.loading" />
          </div>
        ) : historyItems.length === 0 ? (
          <div className="status-placeholder">
            <FormattedMessage id="status.empty" />
          </div>
        ) : (
          <ul className="history-list">
            {historyItems.map((item) => (
              <li key={item.id} className="history-item">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="history-link"
                  title={item.url}
                >
                  <span className="history-title">{item.title || item.url}</span>
                  <span className="history-url">{item.url}</span>
                </a>
                <span className="history-time">{formatDate(item.lastVisitTime)}</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
