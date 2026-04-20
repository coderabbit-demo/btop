import { useState, useEffect } from 'react';

interface AlertBarProps {
  cpuUsage: number[];
  memPercent: number;
}

function getAlerts(cpuUsage: number[], memPercent: number): { message: string; level: 'info' | 'warn' | 'critical' }[] {
  const alerts: { message: string; level: 'info' | 'warn' | 'critical' }[] = [];
  const avgCpu = cpuUsage.reduce((a, b) => a + b, 0) / cpuUsage.length;

  if (avgCpu > 90) {
    alerts.push({ message: 'CPU usage critical', level: 'critical' });
  } else if (avgCpu > 70) {
    alerts.push({ message: 'CPU usage high', level: 'warn' });
  }

  if (memPercent > 90) {
    alerts.push({ message: 'Memory usage critical', level: 'critical' });
  } else if (memPercent > 70) {
    alerts.push({ message: 'Memory usage high', level: 'warn' });
  }

  if (alerts.length === 0) {
    alerts.push({ message: 'All systems nominal', level: 'info' });
  }

  return alerts;
}

export function AlertBar({ cpuUsage, memPercent }: AlertBarProps) {
  const [visible, setVisible] = useState(true);
  const alerts = getAlerts(cpuUsage, memPercent);
  const hasWarnings = alerts.some((a) => a.level !== 'info');

  useEffect(() => {
    if (!hasWarnings) return;
    const interval = setInterval(() => {
      setVisible((prev) => !prev);
    }, 800);
    return () => clearInterval(interval);
  }, [hasWarnings]);

  const highestLevel = alerts.reduce<'info' | 'warn' | 'critical'>((max, a) => {
    const order = { info: 0, warn: 1, critical: 2 };
    return order[a.level] > order[max] ? a.level : max;
  }, 'info');

  return (
    <div className={`alert-bar alert-${highestLevel} ${hasWarnings && !visible ? 'alert-flash-off' : ''}`}>
      <span className="alert-icon">
        {highestLevel === 'critical' ? '!!' : highestLevel === 'warn' ? '!' : '~'}
      </span>
      <div className="alert-messages">
        {alerts.map((alert, i) => (
          <span key={i} className={`alert-msg alert-msg-${alert.level}`}>
            {alert.message}
          </span>
        ))}
      </div>
      <span className="alert-timestamp">
        {new Date().toLocaleTimeString()}
      </span>
    </div>
  );
}
