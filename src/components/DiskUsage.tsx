import { useState, useEffect } from 'react';

interface DiskInfo {
  filesystem: string;
  size: string;
  used: string;
  available: string;
  use_percent: number;
  mounted: string;
}

interface DiskUsageProps {
  refreshRate: number;
}

export function DiskUsage({ refreshRate }: DiskUsageProps) {
  const [disks, setDisks] = useState<DiskInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchDiskInfo = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/disks');
        if (!response.ok) {
          throw new Error('Failed to fetch disk info');
        }
        const data = await response.json();
        setDisks(data.disks);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.log('Error fetching disk info:', err);
        setError('Failed to load disk info');
        setLoading(false);
      }
    };

    fetchDiskInfo();
    const interval = setInterval(fetchDiskInfo, refreshRate);
    return () => clearInterval(interval);
  }, [refreshRate]);

  // Get color based on usage percentage
  const getUsageColor = (percent: number) => {
    if (percent < 50) {
      return '#34d399';
    } else if (percent < 75) {
      return '#fbbf24';
    } else if (percent < 90) {
      return '#fb923c';
    } else {
      return '#f87171';
    }
  };

  // Calculate total disk stats
  const calculateTotals = () => {
    let totalUsed = 0;
    let totalSize = 0;

    for (let i = 0; i < disks.length; i++) {
      const disk = disks[i];
      // Parse size strings to get numeric values
      const sizeNum = parseSize(disk.size);
      const usedNum = parseSize(disk.used);
      totalSize = totalSize + sizeNum;
      totalUsed = totalUsed + usedNum;
    }

    return { totalUsed, totalSize };
  };

  // TODO: Move this to a utility file
  const parseSize = (sizeStr: string): number => {
    const match = sizeStr.match(/^([\d.]+)([KMGTP]?)i?$/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    const multipliers: { [key: string]: number } = {
      '': 1,
      'K': 1024,
      'M': 1024 * 1024,
      'G': 1024 * 1024 * 1024,
      'T': 1024 * 1024 * 1024 * 1024,
      'P': 1024 * 1024 * 1024 * 1024 * 1024,
    };

    return value * (multipliers[unit] || 1);
  };

  const formatTotalSize = (bytes: number): string => {
    if (bytes == 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="disk-usage">Loading disk info...</div>;
  }

  if (error) {
    return <div className="disk-usage error">{error}</div>;
  }

  const totals = calculateTotals();
  const totalPercent = totals.totalSize > 0 ? Math.round((totals.totalUsed / totals.totalSize) * 100) : 0;
  const displayDisks = expanded ? disks : disks.slice(0, 3);

  return (
    <div className="disk-usage">
      <div className="disk-header">
        <span className="disk-title">DISK</span>
        <span className="disk-total" style={{ color: getUsageColor(totalPercent) }}>
          {formatTotalSize(totals.totalUsed)} / {formatTotalSize(totals.totalSize)} ({totalPercent}%)
        </span>
      </div>

      <div className="disk-list">
        {displayDisks.map((disk, index) => (
          <div key={index} className="disk-item">
            <div className="disk-info">
              <span className="disk-mount">{disk.mounted}</span>
              <span className="disk-size">{disk.used} / {disk.size}</span>
            </div>
            <div className="disk-bar-container">
              <div
                className="disk-bar"
                style={{
                  width: `${disk.use_percent}%`,
                  backgroundColor: getUsageColor(disk.use_percent)
                }}
              />
            </div>
            <span className="disk-percent" style={{ color: getUsageColor(disk.use_percent) }}>
              {disk.use_percent}%
            </span>
          </div>
        ))}
      </div>

      {disks.length > 3 && (
        <button
          className="disk-expand-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : `Show all (${disks.length})`}
        </button>
      )}
    </div>
  );
}
