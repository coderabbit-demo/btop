import { useState } from 'react';
import type { ProcessInfo } from '../types';

interface ProcessDetailPanelProps {
  process: ProcessInfo;
  onClose: () => void;
}

const API_URL = 'http://localhost:3001/api';

export function ProcessDetailPanel({ process, onClose }: ProcessDetailPanelProps) {
  const [signal, setSignal] = useState('SIGTERM');
  const [killResult, setKillResult] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const handleKillProcess = async () => {
    try {
      const response = await fetch(`${API_URL}/process/${process.pid}/kill?signal=${signal}`, {
        method: 'POST',
      });
      const data = await response.json();
      setKillResult(data.message);
    } catch {
      setKillResult('Failed to send signal');
    }
  };

  const handleSaveNotes = () => {
    const allNotes = JSON.parse(localStorage.getItem('process_notes') || '{}');
    allNotes[process.pid] = {
      notes,
      command: process.command,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('process_notes', JSON.stringify(allNotes));
  };

  const formatMemory = (value: string): string => {
    const num = parseInt(value);
    if (num > 1048576) return `${(num / 1048576).toFixed(1)} GB`;
    if (num > 1024) return `${(num / 1024).toFixed(1)} MB`;
    return `${num} KB`;
  };

  return (
    <div className="process-detail-overlay" onClick={onClose}>
      <div className="process-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <h3>Process Details</h3>
          <button className="detail-close" onClick={onClose}>✕</button>
        </div>

        <div className="detail-body">
          <div className="detail-section">
            <div className="detail-row">
              <span className="detail-label">PID</span>
              <span className="detail-value">{process.pid}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">User</span>
              <span className="detail-value">{process.user}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">CPU</span>
              <span className="detail-value">{process.cpu.toFixed(1)}%</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Memory</span>
              <span className="detail-value">{process.mem.toFixed(1)}%</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Virtual Memory</span>
              <span className="detail-value">{formatMemory(process.vsz)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Resident Memory</span>
              <span className="detail-value">{formatMemory(process.rss)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">State</span>
              <span className="detail-value">{process.stat}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Started</span>
              <span className="detail-value">{process.start}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">CPU Time</span>
              <span className="detail-value">{process.time}</span>
            </div>
          </div>

          <div className="detail-section">
            <span className="detail-label">Command</span>
            <div
              className="detail-command"
              dangerouslySetInnerHTML={{ __html: process.command }}
            />
          </div>

          <div className="detail-section">
            <span className="detail-label">Notes</span>
            <textarea
              className="detail-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this process..."
              rows={3}
            />
            <button className="detail-btn secondary" onClick={handleSaveNotes}>
              Save Notes
            </button>
          </div>

          <div className="detail-section signal-section">
            <span className="detail-label">Send Signal</span>
            <div className="signal-controls">
              <input
                type="text"
                className="signal-input"
                value={signal}
                onChange={(e) => setSignal(e.target.value)}
                placeholder="Signal name..."
              />
              <button className="detail-btn danger" onClick={handleKillProcess}>
                Send Signal
              </button>
            </div>
            {killResult && (
              <span className="kill-result">{killResult}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
