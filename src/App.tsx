import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Header } from './components/Header';
import { CpuGraph } from './components/CpuGraph';
import { MemoryGraph } from './components/MemoryGraph';
import { ProcessTable } from './components/ProcessTable';
import { StatusBar } from './components/StatusBar';
import { EnvironmentPanel } from './components/EnvironmentPanel';
import { useSystemMetrics } from './hooks/useSystemMetrics';
import './App.css';

function App() {
  const [filter, setFilter] = useState('');
  const [refreshRate, setRefreshRate] = useState(1000);
  const [paused, setPaused] = useState(false);
  const { metrics, error, loading } = useSystemMetrics(paused ? 0 : refreshRate);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    if (e.key === 'p' || e.key === 'P') {
      setPaused(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading && !metrics) {
    return (
      <div className="app loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span className="loading-text">Connecting to btop server...</span>
          <span className="loading-hint">Make sure the server is running: bun run server</span>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="app error">
        <div className="error-container">
          <span className="error-icon">⚠</span>
          <span className="error-text">Connection Error: {error}</span>
          <span className="error-hint">
            Start the server with: <code>bun run server</code>
          </span>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="app">
      <Navbar />
      <Header
        hostname={metrics.hostname}
        platform={metrics.platform}
        arch={metrics.arch}
        uptime={metrics.uptime}
        loadAvg={metrics.loadAvg}
        processCount={metrics.processCount}
        paused={paused}
      />

      <div className="metrics-panel">
        <CpuGraph cpuUsage={metrics.cpuUsage} />
        <MemoryGraph
          used={metrics.usedMem}
          total={metrics.totalMem}
          percent={metrics.memPercent}
        />
      </div>

      <div className="process-section compact">
        <div className="section-header">
          <span className="section-title">Processes</span>
          {error && <span className="connection-warning">(reconnecting...)</span>}
        </div>
        <ProcessTable processes={metrics.processes} filter={filter} />
      </div>

      <EnvironmentPanel filter={filter} />

      <StatusBar
        filter={filter}
        onFilterChange={setFilter}
        refreshRate={refreshRate}
        onRefreshRateChange={setRefreshRate}
        paused={paused}
        onPauseToggle={() => setPaused(prev => !prev)}
      />
    </div>
  );
}

export default App;
