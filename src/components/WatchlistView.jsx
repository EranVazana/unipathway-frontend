import { useState, useMemo } from 'react';
import DataTable from './DataTable';
import ConfirmDialog from './ConfirmDialog';

const STATUS_OPTIONS = ['Interested', 'Applied', 'Accepted', 'Rejected'];
const SORT_FIELDS = [
  { key: 'department', label: 'Department' },
  { key: 'university', label: 'University' },
  { key: 'status', label: 'Status' },
  { key: 'sekemStatus', label: 'Sekem Status' }
];

export default function WatchlistView({
  watchlist,
  departments,
  universityName,
  departmentName,
  latestThreshold,
  updateWatchlistStatus,
  removeFromWatchlist
}) {
  const [pendingWatchlistId, setPendingWatchlistId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('none');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [confirmTarget, setConfirmTarget] = useState(null);

  async function handleStatusChange(watchlistId, newStatus) {
    setRowErrors((prev) => ({ ...prev, [watchlistId]: '' }));
    setPendingWatchlistId(watchlistId);
    try {
      await updateWatchlistStatus(watchlistId, newStatus);
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [watchlistId]: err.message || 'Failed to update status.' }));
    } finally {
      setPendingWatchlistId(null);
    }
  }

  async function handleRemove() {
    const { id } = confirmTarget;
    setConfirmTarget(null);
    setRowErrors((prev) => ({ ...prev, [id]: '' }));
    setPendingWatchlistId(id);
    try {
      await removeFromWatchlist(id);
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [id]: err.message || 'Failed to remove entry.' }));
    } finally {
      setPendingWatchlistId(null);
    }
  }

  const columns = [
    { key: 'department', label: 'Department', render: (row) => departmentName(row.departmentId) },
    {
      key: 'university',
      label: 'University',
      render: (row) => {
        const dept = departments.find((d) => d.departmentId === row.departmentId);
        return dept ? universityName(dept.universityId) : 'Unknown university';
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <select
          value={row.status}
          disabled={pendingWatchlistId === row.watchlistId}
          onChange={(e) => handleStatusChange(row.watchlistId, e.target.value)}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      )
    },
    {
      key: 'sekemStatus',
      label: 'Sekem Status',
      render: (row) => {
        const dept = departments.find((d) => d.departmentId === row.departmentId);
        const threshold = dept ? latestThreshold(dept.departmentId) : null;
        return threshold ? `${row.sekemStatus} (${threshold.sekemType})` : row.sekemStatus;
      }
    },
    { key: 'userSekem', label: 'Your Sekem', render: (row) => row.userSekem?.toFixed(2) ?? '—' },
    {
      key: 'minSekem',
      label: 'Min Sekem',
      render: (row) => {
        const dept = departments.find((d) => d.departmentId === row.departmentId);
        const threshold = dept ? latestThreshold(dept.departmentId) : null;
        return threshold ? threshold.minSekem : '—';
      }
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <>
          <button
            type="button"
            disabled={pendingWatchlistId === row.watchlistId}
            onClick={() => setConfirmTarget({ id: row.watchlistId, label: departmentName(row.departmentId) })}
          >
            {pendingWatchlistId === row.watchlistId ? 'Working...' : 'Remove'}
          </button>
          {rowErrors[row.watchlistId] && <p role="alert">{rowErrors[row.watchlistId]}</p>}
        </>
      )
    }
  ];

  const visibleRows = useMemo(() => {
    function sortValue(row, field) {
      switch (field) {
        case 'department':
          return departmentName(row.departmentId);
        case 'university': {
          const dept = departments.find((d) => d.departmentId === row.departmentId);
          return dept ? universityName(dept.universityId) : '';
        }
        case 'status':
          return row.status;
        case 'sekemStatus':
          return row.sekemStatus;
        default:
          return '';
      }
    }

    let rows = watchlist;

    if (statusFilter !== 'All') {
      rows = rows.filter((w) => w.status === statusFilter);
    }

    if (sortField !== 'none') {
      rows = [...rows].sort((a, b) => {
        const comparison = sortValue(a, sortField).localeCompare(sortValue(b, sortField));
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return rows;
  }, [watchlist, statusFilter, sortField, sortDirection, departments, departmentName, universityName]);

  return (
    <div className="watchlist-view">
      {confirmTarget && (
        <ConfirmDialog
          message={`Are you sure you want to remove "${confirmTarget.label}" from your watchlist?`}
          onConfirm={handleRemove}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
      <div className="watchlist-controls">
        <label>
          Filter by status:{' '}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sort by:{' '}
          <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
            <option value="none">None</option>
            {SORT_FIELDS.map((field) => (
              <option key={field.key} value={field.key}>
                {field.label}
              </option>
            ))}
          </select>
        </label>

        {sortField !== 'none' && (
          <label>
            Direction:{' '}
            <select value={sortDirection} onChange={(e) => setSortDirection(e.target.value)}>
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
          </label>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={visibleRows.map((w) => ({ ...w, id: w.watchlistId }))}
        emptyMessage={
          statusFilter === 'All'
            ? "You haven't added any departments to your watchlist yet. Switch to the Departments tab to add some."
            : `No watchlist entries with status "${statusFilter}".`
        }
      />
    </div>
  );
}