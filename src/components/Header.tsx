import { useState, useEffect } from 'react';

interface HeaderProps {
  hostname: string;
  platform: string;
  arch: string;
  uptime: number;
  loadAvg: number[];
  processCount: number;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return parts.join(' ');
}

export function Header({ hostname, platform, arch, uptime, loadAvg, processCount }: HeaderProps) {
  const [sessionStartTime] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  return (
    <header className="header" role="banner">
      <div className="header-left">
        <span className="logo">
          <span className="logo-b">b</span>
          <span className="logo-top">top</span>
        </span>
        <span className="host-info">
          <span className="hostname">{hostname}</span>
          <span className="platform">{platform}/{arch}</span>
        </span>
      </div>
      <div className="header-center">
        <span className="uptime">
          Uptime: <span className="value">{formatUptime(uptime)}</span>
        </span>
        <span className="session-timer">
          Session: <span className="value">{formatUptime(elapsedSeconds)}</span>
        </span>
      </div>
      <div className="header-right">
        <span className="load-avg">
          Load: <span className="value" aria-label={`Load average ${loadAvg.map(l => l.toFixed(2)).join(', ')}`}>{loadAvg.map(l => l.toFixed(2)).join(' ')}</span>
        </span>
        <span className="proc-count">
          Tasks: <span className="value">{processCount}</span>
        </span>
      </div>
    </header>
  );
}
