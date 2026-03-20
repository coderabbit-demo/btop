import { useState, useEffect } from 'react';

interface LogViewerProps {
  visible: boolean;
}

export function LogViewer({ visible }: LogViewerProps) {
  const [logPath, setLogPath] = useState('system.log');
  const [logPathDraft, setLogPathDraft] = useState('system.log');
  const [logContent, setLogContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/logs?file=${encodeURIComponent(logPath)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setLogContent(data.lines);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else if (typeof err === 'string') setError(err);
      else setError('An unexpected error occurred');
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

  const applyPath = () => {
    setLogPath(logPathDraft);
  };

  if (!visible) return null;

  return (
    <div className="log-viewer">
      <div className="log-header">
        <span className="log-title">System Logs</span>
        <div className="log-controls">
          <input
            type="text"
            className="log-path-input"
            value={logPathDraft}
            onChange={(e) => setLogPathDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyPath(); }}
            placeholder="Log file path..."
          />
          <button className="log-refresh-btn" onClick={applyPath}>
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
