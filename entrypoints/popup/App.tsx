import React, { useEffect, useState } from 'react';

interface HistoryItem {
  id: string;
  url?: string;
  title?: string;
  lastVisitTime?: number;
  visitCount?: number;
}

export default function App() {
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
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container">
      <header className="header">
        <h1>📜 My History</h1>
        <button
          className="calendar-btn"
          onClick={() => browser.tabs.create({ url: browser.runtime.getURL('/calendar.html') })}
        >
          📅 Calendar
        </button>
      </header>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search history..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-btn">Search</button>
      </form>

      <main className="content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : historyItems.length === 0 ? (
          <div className="empty">No history found.</div>
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
