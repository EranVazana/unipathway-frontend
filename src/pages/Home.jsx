import PageSpinner from './../components/ui/PageSpinner';
import PageError from './../components/ui/PageError';
import { useState } from 'react';
import { useAcademicData } from '../hooks/useAcademicData';
import DepartmentsView from '../components/views/DepartmentsView';
import UniversitiesView from '../components/views/UniversitiesView';
import CompareView from '../components/views/CompareView';

const TABS = [
  { key: 'universities', label: 'Universities' },
  { key: 'departments',  label: 'Departments' },
  { key: 'compare',      label: '⚖️ Compare' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('universities');
  const data = useAcademicData();

  if (data.isLoading) return <PageSpinner />;
  if (data.error) return <PageError message={data.error} />;

  return (
    <div className="home-page">

      <nav className="home-tabs">
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

      {activeTab === 'departments' && (
        <DepartmentsView
          user={data.user}
          departments={data.departments}
          universities={data.universities}
          universityName={data.universityName}
          latestThreshold={data.latestThreshold}
          thresholds={data.thresholds}
          isWatchlisted={data.isWatchlisted}
          addToWatchlist={data.addToWatchlist}
          createDepartment={data.createDepartment}
          updateDepartment={data.updateDepartment}
          deleteDepartment={data.deleteDepartment}
          createThreshold={data.createThreshold}
          updateThreshold={data.updateThreshold}
          deleteThreshold={data.deleteThreshold}
        />
      )}

      {activeTab === 'universities' && (
        <UniversitiesView
          universities={data.universities}
          departments={data.departments}
          createUniversity={data.createUniversity}
          updateUniversity={data.updateUniversity}
          deleteUniversity={data.deleteUniversity}
          user={data.user}
        />
      )}
      {activeTab === 'compare' && (
        <CompareView
          departments={data.departments}
          universities={data.universities}
          universityName={data.universityName}
          latestThreshold={data.latestThreshold}
          user={data.user}
          isWatchlisted={data.isWatchlisted}
          addToWatchlist={data.addToWatchlist}
          watchlist={data.watchlist}
        />
      )}
    </div>
  );
}