import { useState, useMemo } from 'react';
import Card from './Card';
import ConfirmDialog from './ConfirmDialog';

const SORT_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'location', label: 'Location' },
  { key: 'departmentCount', label: 'Department Count' }
];

function normalize(str) {
  return String(str ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const emptyForm = { name: '', location: '', websiteUrl: '', description: '' };

export default function UniversitiesView({
  user,
  universities,
  departments,
  createUniversity,
  updateUniversity,
  deleteUniversity
}) {
  const canManage = user.userRole === 'admin' || user.userRole === 'editor';
  const canDelete = user.userRole === 'admin';

  const [sortField, setSortField] = useState('none');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [isAdding, setIsAdding] = useState(false);
  const [addFormError, setAddFormError] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete state
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    setAddFormError('');
    setIsAdding(true);
    try {
      await createUniversity(addForm);
      setAddForm(emptyForm);
      setShowAddForm(false);
    } catch (err) {
      setAddFormError(err.message || 'Failed to create university.');
    } finally {
      setIsAdding(false);
    }
  }

  function startEdit(uni) {
    setEditingId(uni.universityId);
    setEditForm({
      name: uni.name,
      location: uni.location,
      websiteUrl: uni.websiteUrl || '',
      description: uni.description || ''
    });
    setEditError('');
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setEditError('');
    setIsSavingEdit(true);
    try {
      await updateUniversity(editingId, editForm);
      setEditingId(null);
    } catch (err) {
      setEditError(err.message || 'Failed to update university.');
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
      await deleteUniversity(id);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete university.');
    } finally {
      setDeletingId(null);
    }
  }

  function departmentCount(universityId) {
    return departments.filter((d) => d.universityId === universityId).length;
  }

  function topDepartments(universityId) {
    return departments.filter((d) => d.universityId === universityId).slice(0, 5);
  }

  const sortedUniversities = useMemo(() => {
    const query = normalize(searchQuery);
    let result = query
      ? universities.filter((uni) =>
          normalize(uni.name).includes(query) ||
          normalize(uni.location).includes(query)
        )
      : universities;

    if (sortField === 'none') return result;

    return [...result].sort((a, b) => {
      let valA, valB;
      if (sortField === 'departmentCount') {
        valA = departmentCount(a.universityId);
        valB = departmentCount(b.universityId);
        const cmp = valA - valB;
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      valA = a[sortField] ?? '';
      valB = b[sortField] ?? '';
      const cmp = String(valA).localeCompare(String(valB));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [universities, departments, searchQuery, sortField, sortDirection]);

  if (universities.length === 0) return <p>No universities available.</p>;

  return (
    <div className="universities-view">

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
          placeholder="Search by name or location..."
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

      {/* Add University form — admin/editor only */}
      {canManage && (
        <div className="admin-controls">
          <button type="button" onClick={() => setShowAddForm((v) => !v)}>
            {showAddForm ? 'Cancel' : '+ Add University'}
          </button>

          {showAddForm && (
            <form onSubmit={handleCreate}>
              <label>
                Name
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </label>
              <label>
                Location
                <input
                  type="text"
                  value={addForm.location}
                  onChange={(e) => setAddForm((p) => ({ ...p, location: e.target.value }))}
                  required
                />
              </label>
              <label>
                Website URL
                <input
                  type="url"
                  value={addForm.websiteUrl}
                  onChange={(e) => setAddForm((p) => ({ ...p, websiteUrl: e.target.value }))}
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
                {isAdding ? 'Adding...' : 'Add University'}
              </button>
            </form>
          )}
        </div>
      )}

      {deleteError && <p role="alert">{deleteError}</p>}

      {/* University cards */}
      <div className="card-grid">
        {sortedUniversities.length === 0 ? (
          <p>No universities match your search.</p>
        ) : (
          sortedUniversities.map((uni) => {
            const isEditing = editingId === uni.universityId;

            if (isEditing) {
              return (
                <div key={uni.universityId} className="card">
                  <form onSubmit={handleSaveEdit}>
                    <label>
                      Name
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Location
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Website URL
                      <input
                        type="url"
                        value={editForm.websiteUrl}
                        onChange={(e) => setEditForm((p) => ({ ...p, websiteUrl: e.target.value }))}
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

            return (
              <Card
                key={uni.universityId}
                title={uni.name}
                subtitle={uni.location}
                description={uni.description}
                actions={
                  <>
                    {topDepartments(uni.universityId).length > 0 && (
                      <details>
                        <summary>Departments ({departmentCount(uni.universityId)} total)</summary>
                        <ul>
                          {topDepartments(uni.universityId).map((dept) => (
                            <li key={dept.departmentId}>{dept.majorName}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                    {uni.websiteUrl && (
                      <a href={uni.websiteUrl} target="_blank" rel="noreferrer">
                        Visit website
                      </a>
                    )}
                    {canManage && (
                      <button type="button" onClick={() => startEdit(uni)}>
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        disabled={deletingId === uni.universityId}
                        onClick={() => setConfirmTarget({ id: uni.universityId, label: uni.name })}
                      >
                        {deletingId === uni.universityId ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
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