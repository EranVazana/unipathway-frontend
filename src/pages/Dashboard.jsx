import { useState } from 'react';
import { useAcademicData } from '../hooks/useAcademicData';
import WatchlistView from '../components/WatchlistView';
import AcademicScoresView from '../components/AcademicScoresView';

const TABS = [
  { key: 'watchlist', label: 'My Watchlist' },
  { key: 'academic', label: 'Academic Scores' }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('watchlist');
  const data = useAcademicData();

  if (data.isLoading) return <p>Loading dashboard...</p>;
  if (data.error) return <p role="alert">{data.error}</p>;

  return (
    <div className="dashboard-page">
      <h1>{data.user.firstName}'s Dashboard</h1>

      <nav className="dashboard-tabs">
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

      {activeTab === 'watchlist' && (
        <WatchlistView
          watchlist={data.watchlist}
          departments={data.departments}
          universityName={data.universityName}
          departmentName={data.departmentName}
          latestThreshold={data.latestThreshold}
          updateWatchlistStatus={data.updateWatchlistStatus}
          removeFromWatchlist={data.removeFromWatchlist}
        />
      )}

      {activeTab === 'academic' && <AcademicScoresView />}
    </div>
  );
}