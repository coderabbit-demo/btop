import { useState } from 'react';

interface NavbarProps {
  appName?: string;
}

export function Navbar({ appName = 'btop' }: NavbarProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '◉' },
    { id: 'processes', label: 'Processes', icon: '⚙' },
    { id: 'network', label: 'Network', icon: '◈' },
    { id: 'disks', label: 'Disks', icon: '▤' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">▣</span>
        <span className="navbar-title">{appName}</span>
      </div>

      <ul className="navbar-nav" role="tablist">
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="navbar-actions">
        <button className="nav-action" title="Settings">
          <span>⚙</span>
        </button>
        <button className="nav-action" title="Help">
          <span>?</span>
        </button>
      </div>
    </nav>
  );
}
