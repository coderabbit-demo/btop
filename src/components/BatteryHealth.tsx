import type { BatteryInfo } from '../types';

interface BatteryHealthProps {
  battery: BatteryInfo;
}

function formatTimeRemaining(minutes: number | null): string {
  if (minutes === null || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function getHealthColor(pct: number): string {
  if (pct >= 90) return '#34d399';
  if (pct >= 75) return '#a78bfa';
  if (pct >= 60) return '#fbbf24';
  if (pct >= 40) return '#fb923c';
  return '#f87171';
}

function getChargeColor(pct: number, charging: boolean): string {
  if (charging) return '#22d3ee';
  if (pct > 50) return '#34d399';
  if (pct > 20) return '#fbbf24';
  return '#f87171';
}

export function BatteryHealth({ battery }: BatteryHealthProps) {
  if (!battery.hasBattery) {
    return (
      <div className="battery-health">
        <div className="graph-header">
          <span className="graph-title">Battery</span>
          <span className="graph-value" style={{ color: '#64748b', fontSize: 14 }}>
            No battery detected
          </span>
        </div>
        <div className="battery-empty-hint">
          Running on AC power or no battery is present on this device.
        </div>
      </div>
    );
  }

  const chargeColor = getChargeColor(battery.percent, battery.charging);
  const healthPct = battery.healthPercent ?? 100;
  const healthColor = getHealthColor(healthPct);

  const status = battery.charging
    ? 'Charging'
    : battery.acPowered
    ? 'AC · Not charging'
    : 'On battery';

  return (
    <div className="battery-health">
      <div className="graph-header">
        <span className="graph-title">Battery</span>
        <span className="graph-value" style={{ color: chargeColor }}>
          {battery.percent}%
        </span>
      </div>

      <div className="battery-charge-row">
        <div className="battery-icon" aria-hidden>
          <div className="battery-icon-shell">
            <div
              className="battery-icon-fill"
              style={{
                width: `${Math.max(2, Math.min(100, battery.percent))}%`,
                background: chargeColor,
                boxShadow: `0 0 12px ${chargeColor}88`,
              }}
            />
          </div>
          <div className="battery-icon-cap" />
        </div>
        <div className="battery-status-text">
          <span className="battery-status-label">{battery.charging ? '⚡' : battery.acPowered ? '🔌' : '🔋'} {status}</span>
          <span className="battery-status-time">
            {battery.charging
              ? `Time to full: ${formatTimeRemaining(battery.timeRemainingMin)}`
              : `Time remaining: ${formatTimeRemaining(battery.timeRemainingMin)}`}
          </span>
        </div>
      </div>

      <div className="battery-health-section">
        <div className="battery-health-header">
          <span className="battery-section-label">Health</span>
          <span className="battery-section-value" style={{ color: healthColor }}>
            {battery.healthPercent !== null ? `${battery.healthPercent}%` : '—'}
            {battery.condition && (
              <span className="battery-condition"> · {battery.condition}</span>
            )}
          </span>
        </div>
        <div className="battery-bar-container">
          <div
            className="battery-bar-fill"
            style={{
              width: `${healthPct}%`,
              background: `linear-gradient(90deg, ${healthColor} 0%, ${healthColor}88 100%)`,
              boxShadow: `0 0 16px ${healthColor}55`,
            }}
          />
        </div>
      </div>

      <div className="battery-stats">
        <div className="battery-stat">
          <span className="stat-label">Cycles</span>
          <span className="stat-value">
            {battery.cycleCount !== null ? battery.cycleCount.toLocaleString() : '—'}
          </span>
        </div>
        <div className="battery-stat">
          <span className="stat-label">Capacity</span>
          <span className="stat-value">
            {battery.maxCapacity !== null && battery.designCapacity !== null
              ? `${battery.maxCapacity.toLocaleString()} / ${battery.designCapacity.toLocaleString()} mAh`
              : '—'}
          </span>
        </div>
        <div className="battery-stat">
          <span className="stat-label">Temp</span>
          <span className="stat-value">
            {battery.temperatureC !== null ? `${battery.temperatureC.toFixed(1)}°C` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
