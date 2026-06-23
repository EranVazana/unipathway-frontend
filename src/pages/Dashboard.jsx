import PageSpinner from './../components/ui/PageSpinner';
import PageError from './../components/ui/PageError';
import { useState } from 'react';
import { useAcademicData } from '../hooks/useAcademicData';
import WatchlistView from '../components/views/WatchlistView';
import AcademicScoresView from '../components/views/AcademicScoresView';
import InfoGraphic from '../components/views/InfoGraphic';
import TopRecommendations from '../components/views/TopRecommendations';

const TABS = [
  { key: 'watchlist',       label: 'My Watchlist' },
  { key: 'academic',        label: 'Academic Scores' },
  { key: 'recommendations', label: '🎯 Recommendations' },
  { key: 'infographic',     label: '📊 InfoGraphic' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('watchlist');
  const data = useAcademicData();

  if (data.isLoading) return <PageSpinner />;
  if (data.error) return <PageError message={data.error} />;

  return (
    <div className="dashboard-page">
      <h1>{data.user.firstName}&apos;s Dashboard</h1>

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

      {activeTab === 'academic' && <AcademicScoresView onSaved={data.refreshWatchlist} />}

      {activeTab === 'recommendations' && (
        <TopRecommendations
          watchlist={data.watchlist}
          departments={data.departments}
          universityName={data.universityName}
          latestThreshold={data.latestThreshold}
          user={data.user}
        />
      )}

      {activeTab === 'infographic' && (
        <InfoGraphic
          watchlist={data.watchlist}
          departments={data.departments}
          universityName={data.universityName}
          departmentName={data.departmentName}
          latestThreshold={data.latestThreshold}
          user={data.user}
        />
      )}
    </div>
  );
}