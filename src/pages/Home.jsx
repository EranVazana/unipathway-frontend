import { useState } from 'react';
import { useAcademicData } from '../hooks/useAcademicData';
import DepartmentsView from '../components/DepartmentsView';
import UniversitiesView from '../components/UniversitiesView';

const TABS = [
  { key: 'departments', label: 'Departments' },
  { key: 'universities', label: 'Universities' }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('departments');
  const data = useAcademicData();

  if (data.isLoading) return <p>Loading...</p>;
  if (data.error) return <p role="alert">{data.error}</p>;

  return (
    <div className="home-page">
      <h1>UniPathway</h1>

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
          isWatchlisted={data.isWatchlisted}
          addToWatchlist={data.addToWatchlist}
          createDepartment={data.createDepartment}
          updateDepartment={data.updateDepartment}
          deleteDepartment={data.deleteDepartment}
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
    </div>
  );
}