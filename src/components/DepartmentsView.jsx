import { useState, useMemo } from 'react';
import Card from './Card';
import ConfirmDialog from './ConfirmDialog';

const SORT_FIELDS = [
  { key: 'majorName', label: 'Name' },
  { key: 'university', label: 'University' },
  { key: 'faculty', label: 'Faculty' },
  { key: 'minSekem', label: 'Min Sekem' }
];

const DEGREE_TYPES = ['B.Sc', 'B.A', 'LL.B', 'B.Ed', 'B.Arch', 'M.Sc', 'M.A', 'Ph.D'];

function normalize(str) {
  return String(str ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function emptyForm(universities) {
  return {
    universityId: universities[0]?.universityId || '',
    majorName: '',
    degreeType: 'B.Sc',
    faculty: '',
    description: ''
  };
}

export default function DepartmentsView({
  user,
  departments,
  universities,
  universityName,
  latestThreshold,
  isWatchlisted,
  addToWatchlist,
  createDepartment,
  updateDepartment,
  deleteDepartment
}) {
  const canManage = user.userRole === 'admin' || user.userRole === 'editor';
  const canDelete = user.userRole === 'admin';

  const [pendingDepartmentId, setPendingDepartmentId] = useState(null);
  const [addErrors, setAddErrors] = useState({});
  const [sortField, setSortField] = useState('none');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(() => emptyForm(universities));
  const [isAdding, setIsAdding] = useState(false);
  const [addFormError, setAddFormError] = useState('');

  // Edit state: key is departmentId, value is form data
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete state
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, label }
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  async function handleAddToWatchlist(departmentId) {
    setAddErrors((prev) => ({ ...prev, [departmentId]: '' }));
    setPendingDepartmentId(departmentId);
    try {
      await addToWatchlist(departmentId);
    } catch (err) {
      setAddErrors((prev) => ({ ...prev, [departmentId]: err.message || 'Failed to add to watchlist.' }));
    } finally {
      setPendingDepartmentId(null);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setAddFormError('');
    setIsAdding(true);
    try {
      await createDepartment({ ...addForm, universityId: Number(addForm.universityId) });
      setAddForm(emptyForm(universities));
      setShowAddForm(false);
    } catch (err) {
      setAddFormError(err.message || 'Failed to create department.');
    } finally {
      setIsAdding(false);
    }
  }

  function startEdit(dept) {
    setEditingId(dept.departmentId);
    setEditForm({
      universityId: dept.universityId,
      majorName: dept.majorName,
      degreeType: dept.degreeType,
      faculty: dept.faculty,
      description: dept.description || ''
    });
    setEditError('');
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setEditError('');
    setIsSavingEdit(true);
    try {
      await updateDepartment(editingId, { ...editForm, universityId: Number(editForm.universityId) });
      setEditingId(null);
    } catch (err) {
      setEditError(err.message || 'Failed to update department.');
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDelete() {
    const { id } = confirmTarget;
    setConfirmTarget(null);
    setDeleteError('');
    setDeletingId(id);
    try {
      await deleteDepartment(id);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete department.');
    } finally {
      setDeletingId(null);
    }
  }

  const sortedDepartments = useMemo(() => {
    const query = normalize(searchQuery);
    let result = query
      ? departments.filter((dept) =>
          normalize(dept.majorName).includes(query) ||
          normalize(universityName(dept.universityId)).includes(query) ||
          normalize(dept.faculty).includes(query) ||
          normalize(dept.degreeType).includes(query)
        )
      : departments;

    if (sortField === 'none') return result;

    return [...result].sort((a, b) => {
      let valA, valB;
      if (sortField === 'university') {
        valA = universityName(a.universityId);
        valB = universityName(b.universityId);
      } else if (sortField === 'minSekem') {
        const tA = latestThreshold(a.departmentId);
        const tB = latestThreshold(b.departmentId);
        valA = tA ? tA.minSekem : -Infinity;
        valB = tB ? tB.minSekem : -Infinity;
        const cmp = valA - valB;
        return sortDirection === 'asc' ? cmp : -cmp;
      } else {
        valA = a[sortField] ?? '';
        valB = b[sortField] ?? '';
      }
      const cmp = String(valA).localeCompare(String(valB));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [departments, searchQuery, sortField, sortDirection, universityName, latestThreshold]);

  if (departments.length === 0) return <p>No departments available.</p>;

  return (
    <div className="departments-view">

      {confirmTarget && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${confirmTarget.label}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {/* Search + Sort controls */}
      <div className="sort-controls">
        <input
          type="text"
          placeholder="Search by name, university, faculty or degree type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <label>
          Sort by:{' '}
          <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
            <option value="none">None</option>
            {SORT_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
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

      {/* Add Department form — admin/editor only */}
      {canManage && (
        <div className="admin-controls">
          <button type="button" onClick={() => setShowAddForm((v) => !v)}>
            {showAddForm ? 'Cancel' : '+ Add Department'}
          </button>

          {showAddForm && (
            <form onSubmit={handleCreate}>
              <label>
                University
                <select
                  value={addForm.universityId}
                  onChange={(e) => setAddForm((p) => ({ ...p, universityId: e.target.value }))}
                  required
                >
                  {universities.map((u) => (
                    <option key={u.universityId} value={u.universityId}>{u.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Major Name
                <input
                  type="text"
                  value={addForm.majorName}
                  onChange={(e) => setAddForm((p) => ({ ...p, majorName: e.target.value }))}
                  required
                />
              </label>
              <label>
                Degree Type
                <select
                  value={addForm.degreeType}
                  onChange={(e) => setAddForm((p) => ({ ...p, degreeType: e.target.value }))}
                >
                  {DEGREE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label>
                Faculty
                <input
                  type="text"
                  value={addForm.faculty}
                  onChange={(e) => setAddForm((p) => ({ ...p, faculty: e.target.value }))}
                  required
                />
              </label>
              <label>
                Description
                <input
                  type="text"
                  value={addForm.description}
                  onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))}
                />
              </label>
              {addFormError && <p role="alert">{addFormError}</p>}
              <button type="submit" disabled={isAdding}>
                {isAdding ? 'Adding...' : 'Add Department'}
              </button>
            </form>
          )}
        </div>
      )}

      {deleteError && <p role="alert">{deleteError}</p>}

      {/* Department cards */}
      <div className="card-grid">
        {sortedDepartments.length === 0 ? (
          <p>No departments match your search.</p>
        ) : (
          sortedDepartments.map((dept) => {
            const threshold = latestThreshold(dept.departmentId);
            const isEditing = editingId === dept.departmentId;

            if (isEditing) {
              return (
                <div key={dept.departmentId} className="card">
                  <form onSubmit={handleSaveEdit}>
                    <label>
                      University
                      <select
                        value={editForm.universityId}
                        onChange={(e) => setEditForm((p) => ({ ...p, universityId: e.target.value }))}
                        required
                      >
                        {universities.map((u) => (
                          <option key={u.universityId} value={u.universityId}>{u.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Major Name
                      <input
                        type="text"
                        value={editForm.majorName}
                        onChange={(e) => setEditForm((p) => ({ ...p, majorName: e.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Degree Type
                      <select
                        value={editForm.degreeType}
                        onChange={(e) => setEditForm((p) => ({ ...p, degreeType: e.target.value }))}
                      >
                        {DEGREE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </label>
                    <label>
                      Faculty
                      <input
                        type="text"
                        value={editForm.faculty}
                        onChange={(e) => setEditForm((p) => ({ ...p, faculty: e.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Description
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                      />
                    </label>
                    {editError && <p role="alert">{editError}</p>}
                    <button type="submit" disabled={isSavingEdit}>
                      {isSavingEdit ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} disabled={isSavingEdit}>
                      Cancel
                    </button>
                  </form>
                </div>
              );
            }

            const alreadyWatchlisted = isWatchlisted(dept.departmentId);
            const canUseWatchlist = user.userRole === 'user';
            const isPending = pendingDepartmentId === dept.departmentId;
            const addError = addErrors[dept.departmentId];

            return (
              <Card
                key={dept.departmentId}
                title={dept.majorName}
                subtitle={universityName(dept.universityId)}
                meta={`${dept.degreeType} · ${dept.faculty}`}
                description={dept.description}
                actions={
                  <>
                    {threshold ? (
                      <p>Min Sekem: {threshold.minSekem} ({threshold.sekemType}, {threshold.year})</p>
                    ) : (
                      <p>No admission threshold on record.</p>
                    )}

                    {canUseWatchlist && (
                      <button
                        type="button"
                        disabled={alreadyWatchlisted || isPending}
                        onClick={() => handleAddToWatchlist(dept.departmentId)}
                      >
                        {alreadyWatchlisted ? 'Already in Watchlist' : isPending ? 'Adding...' : 'Add to Watchlist'}
                      </button>
                    )}

                    {canManage && (
                      <button type="button" onClick={() => startEdit(dept)}>
                        Edit
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        disabled={deletingId === dept.departmentId}
                        onClick={() => setConfirmTarget({ id: dept.departmentId, label: dept.majorName })}
                      >
                        {deletingId === dept.departmentId ? 'Deleting...' : 'Delete'}
                      </button>
                    )}

                    {addError && <p role="alert">{addError}</p>}
                  </>
                }
              />
            );
          })
        )}
      </div>
    </div>
  );
}