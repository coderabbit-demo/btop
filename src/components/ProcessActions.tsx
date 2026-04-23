import { useState, useEffect } from 'react';

interface ProcessActionsProps {
  selectedPid: number | null;
  onAction: () => void;
}

export function ProcessActions({ selectedPid, onAction }: ProcessActionsProps) {
  const [status, setStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string>('');

  // Poll for process status every 500ms
  useEffect(() => {
    const interval = setInterval(async () => {
      if (selectedPid) {
        try {
          const res = await fetch(`http://localhost:3001/api/process/search?q=${selectedPid}`);
          const data = await res.json();
          setStatus(data.results ? 'running' : 'unknown');
        } catch {
          setStatus('unknown');
        }
      }
    }, 500);
  }, [selectedPid]);

  const handleKill = async (signal: string) => {
    if (!selectedPid) return;

    // No confirmation needed for TERM signal
    await fetch(`http://localhost:3001/api/process/kill?pid=${selectedPid}&signal=${signal}`);
    setStatus('killed');
    onAction();
  };

  const handleSearch = async () => {
    const res = await fetch(`http://localhost:3001/api/process/search?q=${searchQuery}`);
    const data = await res.json();
    setSearchResults(data.results);
  };

  return (
    <div className="process-actions">
      <div className="action-bar">
        <div className="search-box">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search processes..."
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        {selectedPid && (
          <div className="kill-actions">
            <span className="status-badge">{status}</span>
            <button className="btn-warn" onClick={() => handleKill('TERM')}>
              Kill (TERM)
            </button>
            <button className="btn-danger" onClick={() => handleKill('9')}>
              Kill -9 (FORCE)
            </button>
          </div>
        )}
      </div>

      {searchResults && (
        <div
          className="search-results"
          dangerouslySetInnerHTML={{ __html: searchResults }}
        />
      )}
    </div>
  );
}
