import { useState } from 'react';
import BasicSettingsView from '../components/settings/BasicSettingsView';
import PasswordSettingsView from '../components/settings/PasswordSettingsView';

const TABS = [
  { key: 'basic', label: 'Basic' },
  { key: 'password', label: 'Password' }
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('basic');

  return (
    <div className="settings-page">
      <nav className="settings-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            aria-current={activeTab === tab.key}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'basic' && <BasicSettingsView />}
      {activeTab === 'password' && <PasswordSettingsView />}
    </div>
  );
}