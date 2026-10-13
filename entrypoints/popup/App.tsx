import React, { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from '@/src/i18n';

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
      const results = await browser.history.search({
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
    <div className="container">
      <header className="header">
        <h1>📜 <FormattedMessage id="app.title" /></h1>
        <button
          className="calendar-btn"
          onClick={() => browser.tabs.create({ url: browser.runtime.getURL('/calendar.html') })}
        >
          📅 <FormattedMessage id="app.openCalendar" />
        </button>
      </header>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder={intl.formatMessage({ id: 'search.placeholder' })}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-btn">
          <FormattedMessage id="search.button" />
        </button>
      </form>

      <main className="content">
        {loading ? (
          <div className="loading">
            <FormattedMessage id="status.loading" />
          </div>
        ) : historyItems.length === 0 ? (
          <div className="empty">
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
