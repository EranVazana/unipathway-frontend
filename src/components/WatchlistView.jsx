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
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  function goToPage(next) { setCurrentPage(next); }
  function resetPage() { setCurrentPage(1); }

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
    {
      key: 'department',
      label: 'Department',
      render: (row) => {
        const dept = departments.find((d) => d.departmentId === row.departmentId);
        const uni = dept ? universityName(dept.universityId) : '';
        return (
          <div className="watchlist-dept-cell">
            <span className="watchlist-dept-cell__name">{departmentName(row.departmentId)}</span>
            {uni && <span className="watchlist-dept-cell__uni">{uni}</span>}
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <select
            className={`status-select status-${row.status.toLowerCase()}`}
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
            className="btn-danger btn-sm watchlist-remove-btn"
            disabled={pendingWatchlistId === row.watchlistId}
            onClick={() => setConfirmTarget({ id: row.watchlistId, label: departmentName(row.departmentId) })}
          >
            {pendingWatchlistId === row.watchlistId ? '…' : '✕'}
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

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
  const pagedRows = visibleRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
                      <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
            >
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
                      <select
              className="form-select"
              value={sortField}
              onChange={(e) => { setSortField(e.target.value); resetPage(); }}
            >
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
                          <select
                className="form-select"
                value={sortDirection}
                onChange={(e) => { setSortDirection(e.target.value); resetPage(); }}
              >
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
          </label>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={pagedRows.map((w) => ({ ...w, id: w.watchlistId }))}
        emptyMessage={
          statusFilter === 'All'
            ? "You haven't added any departments to your watchlist yet. Switch to the Departments tab to add some."
            : `No watchlist entries with status "${statusFilter}".`
        }
        minRows={PAGE_SIZE}
      />

      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="pagination__btn"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹ Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              className={`pagination__btn${page === currentPage ? ' pagination__btn--active' : ''}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            className="pagination__btn"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}