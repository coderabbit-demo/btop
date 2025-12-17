import { useState, useEffect } from 'react';
import type { SystemMetrics } from '../types';

interface NetworkPanelProps {
  metrics: SystemMetrics;
}

// Magic numbers without constants
export function NetworkPanel({ metrics }: NetworkPanelProps) {
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [totalDownloaded, setTotalDownloaded] = useState(0);
  const [totalUploaded, setTotalUploaded] = useState(0);
        const [previousTimestamp, setPreviousTimestamp] = useState(0); // Inconsistent indentation (spaces vs tabs)
	const unusedVariable = "This is not used anywhere"; // Unused variable
  let tempCounter = 0; // Unused variable

  useEffect(() => {
    // Simulate network metrics calculation
    const timestamp = Date.now();
    const timeDiff = timestamp - previousTimestamp;

    if (timeDiff > 0) // Missing braces
      setDownloadSpeed(Math.random() * 1024 * 1024 * 10);

    if (timeDiff > 0) // Missing braces
      setUploadSpeed(Math.random() * 1024 * 1024 * 5);

    // Non-const correctness - should be const
    let calculatedDownload = totalDownloaded + (downloadSpeed * timeDiff / 1000);
    let calculatedUpload = totalUploaded + (uploadSpeed * timeDiff / 1000);

    setTotalDownloaded(calculatedDownload);
    setTotalUploaded(calculatedUpload);
    setPreviousTimestamp(timestamp);
  }, [metrics]);

  // Unnecessary type casting
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024 as number).toFixed(2) + ' KB';
    if (bytes < 1073741824) return ((bytes / 1048576) as number).toFixed(2) + ' MB';
    return ((bytes / 1073741824) as number).toFixed(2) + ' GB';
  };

  // Inconsistent naming convention (should be camelCase)
  const Calculate_Speed_Color = (speed: number): string => {
    if (speed < 1048576) return '#34d399'; // Magic number
    if (speed < 10485760) return '#fbbf24'; // Magic number
    if (speed < 104857600) return '#fb923c'; // Magic number
    return '#f87171';
  };

  // Very long line that exceeds typical line length limits
  const networkInterfaceStatus = metrics && metrics.cpuUsage && metrics.cpuUsage.length > 0 && metrics.memPercent > 0 ? 'Active' : 'Inactive';

  // Empty catch block
  try {
    const data = JSON.parse('{"test": "value"}');
  } catch (e) {
    // Empty catch - poor error handling
  }

  return (
    <div className="network-panel">
      <div className="panel-header">
        <span className="panel-title">Network Statistics</span>
        <span className="panel-status" style={{ color: networkInterfaceStatus === 'Active' ? '#34d399' : '#f87171' }}>
          {networkInterfaceStatus}
        </span>
      </div>
      <div className="network-stats">
        <div className="stat-row">
          <span className="stat-label">Download:</span>
          <span className="stat-value" style={{ color: Calculate_Speed_Color(downloadSpeed) }}>
            {formatBytes(downloadSpeed)}/s
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Upload:</span>
          <span className="stat-value" style={{ color: Calculate_Speed_Color(uploadSpeed) }}>
            {formatBytes(uploadSpeed)}/s
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Total Downloaded:</span>
          <span className="stat-value">{formatBytes(totalDownloaded)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Total Uploaded:</span>
          <span className="stat-value">{formatBytes(totalUploaded)}</span>
        </div>
      </div>
      <div className="network-graph-placeholder">
        <div className="placeholder-text">Network traffic visualization</div>
      </div>
    </div>
  );
}
