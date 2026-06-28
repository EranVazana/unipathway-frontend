import PageSpinner from './../components/ui/PageSpinner';
import PageError from './../components/ui/PageError';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { usersService } from '../services/usersService';
import { watchlistService } from '../services/watchlistService';
import { departmentsService } from '../services/departmentsService';
import { universitiesService } from '../services/universitiesService';
import { admissionThresholdsService } from '../services/admissionThresholdsService';
import DataTable from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function UserWatchlist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = Number(id);

  const [targetUser, setTargetUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      usersService.getAll(),
      watchlistService.getByUser(userId),
      departmentsService.getAll(),
      universitiesService.getAll(),
      admissionThresholdsService.getAll()
    ])
      .then(([users, watchlistData, depts, unis, thresh]) => {
        if (!isMounted) return;
        const found = users.find((u) => u.userId === userId);
        if (!found) { setError(`User ${id} not found.`); return; }
        setTargetUser(found);
        setWatchlist(watchlistData);
        setDepartments(depts);
        setUniversities(unis);
        setThresholds(thresh);
      })
      .catch((err) => { if (isMounted) setError(err.message || 'Failed to load data.'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [id, userId]);

  function universityName(universityId) {
    return universities.find((u) => u.universityId === universityId)?.name || 'Unknown university';
  }

  function departmentName(departmentId) {
    return departments.find((d) => d.departmentId === departmentId)?.majorName || 'Unknown department';
  }

  function latestThreshold(departmentId) {
    const matches = thresholds.filter((t) => t.departmentId === departmentId);
    if (matches.length === 0) return null;
    return matches.reduce((latest, current) => (current.year > latest.year ? current : latest));
  }

  async function handleDelete() {
    const { id: watchlistId } = confirmTarget;
    setConfirmTarget(null);
    setDeletingId(watchlistId);
    try {
      await watchlistService.remove(watchlistId);
      setWatchlist((prev) => prev.filter((w) => w.watchlistId !== watchlistId));
    } catch (err) {
      setDeleteError(err.message || 'Failed to remove entry.');
    } finally {
      setDeletingId(null);
    }
  }

  const columns = [
    { key: 'department', label: 'Department', render: (row) => departmentName(row.departmentId) },
    {
      key: 'university', label: 'University',
      render: (row) => {
        const dept = departments.find((d) => d.departmentId === row.departmentId);
        return dept ? universityName(dept.universityId) : '—';
      }
    },
    { key: 'status', label: 'Status' },
    {
      key: 'sekemStatus', label: 'Sekem Status',
      render: (row) => {
        const dept = departments.find((d) => d.departmentId === row.departmentId);
        const threshold = dept ? latestThreshold(dept.departmentId) : null;
        const raw = row.sekemStatus || '';
        const LABELS = {
          'passed-required-acceptance-score': 'Passed ✓',
          'failed-required-acceptance-score': 'Below Score',
          'below-required-acceptance-score':  'Below Score',
          'no-threshold-data':               'No Data',
          'no-sekem-data':                   'No Sekem',
        };
        const CLASSES = {
          'passed-required-acceptance-score': 'sekem-badge sekem-badge--pass',
          'failed-required-acceptance-score': 'sekem-badge sekem-badge--fail',
          'below-required-acceptance-score':  'sekem-badge sekem-badge--fail',
          'no-threshold-data':               'sekem-badge sekem-badge--neutral',
          'no-sekem-data':                   'sekem-badge sekem-badge--neutral',
        };
        const label = LABELS[raw] ?? raw;
        const cls   = CLASSES[raw] ?? 'sekem-badge sekem-badge--neutral';
        const type  = threshold?.sekemType;
        return (
          <span className={cls}>
            {label}{type ? <span className="sekem-badge__type">{type}</span> : null}
          </span>
        );
      }
    },
    { key: 'userSekem', label: 'Sekem Score', render: (row) => row.userSekem?.toFixed(2) ?? '—' },
    {
      key: 'minSekem', label: 'Min Sekem',
      render: (row) => {
        const dept = departments.find((d) => d.departmentId === row.departmentId);
        const threshold = dept ? latestThreshold(dept.departmentId) : null;
        return threshold ? threshold.minSekem : '—';
      }
    },
    {
      key: 'actions', label: '',
      render: (row) => (
        <button
          type="button"
          disabled={deletingId === row.watchlistId}
          onClick={() => setConfirmTarget({ id: row.watchlistId, label: departmentName(row.departmentId) })}
        >
          {deletingId === row.watchlistId ? 'Removing...' : 'Remove'}
        </button>
      )
    }
  ];

  if (isLoading) return <PageSpinner />;
  if (error) return <PageError message={error} />;

  return (
    <div className="user-watchlist-page">
      <button type="button" onClick={() => navigate('/users')}>← Back to Users</button>
      <h1>Watchlist — {targetUser.firstName} {targetUser.lastName}</h1>

      {confirmTarget && (
        <ConfirmDialog
          message={`Remove "${confirmTarget.label}" from ${targetUser.firstName}'s watchlist?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
      {deleteError && <p role="alert">{deleteError}</p>}

      <DataTable
        columns={columns}
        rows={watchlist.map((w) => ({ ...w, id: w.watchlistId }))}
        emptyMessage={`${targetUser.firstName} has no departments in their watchlist.`}
      />
    </div>
  );
}