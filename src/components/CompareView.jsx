import { useState, useMemo, useEffect } from 'react';
import { academicScoresService } from '../services/academicScoresService';

const MAX_COMPARE = 3;

// Calculate Sekem score from academic scores + threshold weights
function calcSekem(academicScores, threshold) {
  if (!academicScores || !threshold?.sekemWeights) return null;
  const { bagrutWeight, psychometricWeight } = threshold.sekemWeights;
  const bagrut = academicScores.bagrutScores || {};
  const psycho = academicScores.psychometricScores || {};

  const bagrutGrades = Object.values(bagrut).map((v) => v.grade).filter(Boolean);
  if (!bagrutGrades.length) return null;
  const bagrutAvg = bagrutGrades.reduce((s, g) => s + g, 0) / bagrutGrades.length;

  const psychoVals = Object.values(psycho).filter(Boolean);
  if (!psychoVals.length) return null;
  const psychoAvg = psychoVals.reduce((s, v) => s + v, 0) / psychoVals.length;

  return bagrutAvg * bagrutWeight + psychoAvg * psychometricWeight;
}

const DEGREE_COLORS = {
  'B.Sc': '#2f5d9e', 'B.A': '#9b59b6', 'LL.B': '#e07b39',
  'B.Ed': '#16a085', 'B.Arch': '#c9a84c', 'M.Sc': '#1a3a6b',
  'M.A': '#8e44ad', 'Ph.D': '#2f7d5d'
};

export default function CompareView({ departments, universities, universityName, latestThreshold, user, isWatchlisted, addToWatchlist, watchlist = [] }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]); // array of departmentIds
  const [addingId, setAddingId] = useState(null);
  const [academicScores, setAcademicScores] = useState(null);

  useEffect(() => {
    if (!user?.userId) return;
    let ok = true;
    academicScoresService.getByUser(user.userId)
      .then((data) => { if (ok) setAcademicScores(data[0] || null); })
      .catch(() => {});
    return () => { ok = false; };
  }, [user?.userId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return departments;
    return departments.filter((d) =>
      d.majorName.toLowerCase().includes(q) ||
      universityName(d.universityId).toLowerCase().includes(q) ||
      d.faculty?.toLowerCase().includes(q)
    );
  }, [search, departments, universityName]);

  function toggle(id) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }

  async function handleWatchlist(departmentId) {
    setAddingId(departmentId);
    try { await addToWatchlist(departmentId); } catch {}
    finally { setAddingId(null); }
  }

  const compareDepts = selected.map((id) => {
    const dept = departments.find((d) => d.departmentId === id);
    const threshold = latestThreshold(id);
    return { dept, threshold };
  }).filter((r) => r.dept);

  return (
    <div className="compare-view">

      {/* Search + picker */}
      <div className="compare-picker">
        <div className="compare-picker__header">
          <h3>Select up to {MAX_COMPARE} departments to compare</h3>
          {selected.length > 0 && (
            <button type="button" className="btn-ghost btn-sm" onClick={() => setSelected([])}>Clear all</button>
          )}
        </div>
        <input
          type="text"
          className="compare-picker__search"
          placeholder="Search by name, university or faculty…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="compare-picker__list">
          {filtered.map((d) => {
            const isSelected = selected.includes(d.departmentId);
            const disabled = !isSelected && selected.length >= MAX_COMPARE;
            return (
              <button
                key={d.departmentId}
                type="button"
                className={`compare-picker__item${isSelected ? ' compare-picker__item--selected' : ''}${disabled ? ' compare-picker__item--disabled' : ''}`}
                onClick={() => !disabled && toggle(d.departmentId)}
              >
                <span className="compare-picker__item-name">{d.majorName}</span>
                <span className="compare-picker__item-uni">{universityName(d.universityId)}</span>
                {isSelected && <span className="compare-picker__item-check">✓</span>}
              </button>
            );
          })}
          {filtered.length === 0 && <p className="compare-empty-hint">No departments match your search.</p>}
        </div>
      </div>

      {/* Comparison table */}
      {compareDepts.length > 0 && (
        <div className="compare-table-wrap">
          <table className="compare-table">
            <colgroup>
              <col style={{ width: '120px' }} />
              {compareDepts.map(({ dept }) => (
                <col key={dept.departmentId} style={{ width: `${(100 - 10) / compareDepts.length}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="compare-table__label-col"></th>
                {compareDepts.map(({ dept }) => (
                  <th key={dept.departmentId}>
                    <div className="compare-table__dept-header">
                      <button type="button" className="compare-table__remove" onClick={() => toggle(dept.departmentId)}>✕</button>
                      <span className="compare-table__dept-name" title={dept.majorName}>
                        {dept.majorName.length > 15 ? dept.majorName.slice(0, 15) + '…' : dept.majorName}
                      </span>
                      <span className="compare-table__dept-uni" title={universityName(dept.universityId)}>
                        {universityName(dept.universityId).length > 18 ? universityName(dept.universityId).slice(0, 18) + '…' : universityName(dept.universityId)}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="compare-table__label">Degree</td>
                {compareDepts.map(({ dept }) => (
                  <td key={dept.departmentId}>
                    <span className="compare-badge" style={{ background: DEGREE_COLORS[dept.degreeType] + '22', color: DEGREE_COLORS[dept.degreeType], border: `1px solid ${DEGREE_COLORS[dept.degreeType]}44` }}>
                      {dept.degreeType}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="compare-table__label">Faculty</td>
                {compareDepts.map(({ dept }) => (
                  <td key={dept.departmentId}>{dept.faculty || '—'}</td>
                ))}
              </tr>
              <tr>
                <td className="compare-table__label">Min Sekem</td>
                {compareDepts.map(({ dept, threshold }) => {
                  const vals = compareDepts.map((r) => r.threshold?.minSekem).filter(Boolean);
                  const min = Math.min(...vals);
                  const isLowest = threshold?.minSekem === min && vals.length > 1;
                  return (
                    <td key={dept.departmentId} className={isLowest ? 'compare-table__cell--best' : ''}>
                      {threshold ? <strong>{threshold.minSekem}</strong> : '—'}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="compare-table__label">Sekem Type</td>
                {compareDepts.map(({ dept, threshold }) => (
                  <td key={dept.departmentId}>{threshold?.sekemType || '—'}</td>
                ))}
              </tr>
              <tr>
                <td className="compare-table__label">Year</td>
                {compareDepts.map(({ dept, threshold }) => (
                  <td key={dept.departmentId}>{threshold?.year || '—'}</td>
                ))}
              </tr>
              {user?.userRole === 'user' && (
                <tr>
                  <td className="compare-table__label">Your Sekem</td>
                  {compareDepts.map(({ dept, threshold }) => {
                    const watchlistEntry = watchlist.find((w) => w.departmentId === dept.departmentId);
                    const userSekem = watchlistEntry?.userSekem ?? (academicScores ? calcSekem(academicScores, threshold) : null);
                    const minSekem = threshold?.minSekem;
                    const passed = userSekem && minSekem && userSekem >= minSekem;
                    return (
                      <td key={dept.departmentId} className={passed ? 'compare-table__cell--best' : ''}>
                        {userSekem ? (
                          <span style={{ fontWeight: 600 }}>
                            {userSekem.toFixed(1)}
                            {minSekem && <span style={{ fontSize: '0.75rem', color: passed ? 'var(--success-600)' : 'var(--danger-600)', marginLeft: 4 }}>
                              {passed ? `(+${(userSekem - minSekem).toFixed(0)})` : `(${(userSekem - minSekem).toFixed(0)})`}
                            </span>}
                          </span>
                        ) : '—'}
                      </td>
                    );
                  })}
                </tr>
              )}
              <tr>
                <td className="compare-table__label">Description</td>
                {compareDepts.map(({ dept }) => (
                  <td key={dept.departmentId} className="compare-table__desc">{dept.description || '—'}</td>
                ))}
              </tr>
              {user?.userRole === 'user' && (
                <tr>
                  <td className="compare-table__label"></td>
                  {compareDepts.map(({ dept }) => (
                    <td key={dept.departmentId}>
                      <button
                        type="button"
                        className={isWatchlisted(dept.departmentId) ? 'btn-secondary btn-sm' : 'btn-accent btn-sm'}
                        disabled={isWatchlisted(dept.departmentId) || addingId === dept.departmentId}
                        onClick={() => handleWatchlist(dept.departmentId)}
                      >
                        {isWatchlisted(dept.departmentId) ? '✓ In Watchlist' : addingId === dept.departmentId ? 'Adding…' : '+ Watchlist'}
                      </button>
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected.length === 0 && (
        <div className="compare-empty">
          <p>👆 Select 2 or 3 departments above to compare them side by side.</p>
        </div>
      )}
    </div>
  );
}