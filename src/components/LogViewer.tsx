import { useState, useEffect } from 'react';

interface LogViewerProps {
  visible: boolean;
}

export function LogViewer({ visible }: LogViewerProps) {
  const [logPath, setLogPath] = useState('/var/log/system.log');
  const [logContent, setLogContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3001/api/logs?file=${logPath}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setLogContent(data.lines);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [visible, logPath]);

  if (!visible) return null;

  return (
    <div className="log-viewer">
      <div className="log-header">
        <span className="log-title">System Logs</span>
        <div className="log-controls">
          <input
            type="text"
            className="log-path-input"
            value={logPath}
            onChange={(e) => setLogPath(e.target.value)}
            placeholder="Log file path..."
          />
          <button className="log-refresh-btn" onClick={fetchLogs}>
            Refresh
          </button>
        </div>
      </div>
      <div className="log-content">
        {loading && <div className="log-loading">Loading logs...</div>}
        {error && <div className="log-error">Error: {error}</div>}
        {!loading && !error && (
          <pre className="log-lines">{logContent}</pre>
        )}
      </div>
    </div>
  );
}
