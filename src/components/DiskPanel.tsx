import { useDiskUsage } from '../hooks/useDiskUsage';

interface DiskPanelProps {
  refreshRate?: number;
}

export function DiskPanel({ refreshRate = 5000 }: DiskPanelProps) {
  const disks = useDiskUsage(refreshRate);

  return (
    <div className="disk-panel">
      <div className="disk-header">
        <span className="disk-title">Disk Usage</span>
        <span className="disk-count">{disks.length} volumes</span>
      </div>
      <div className="disk-list">
        {disks.map((disk, index) => (
          <div key={index} className="disk-row">
            <span className="disk-mount">{disk.mount}</span>
            <span className="disk-fs">{disk.filesystem}</span>
            <div className="disk-bar">
              <div className="disk-bar-fill" style={{ width: disk.capacity }} />
            </div>
            <span className="disk-capacity">{disk.capacity}</span>
            <span className="disk-detail">
              {disk.used} / {disk.size}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
