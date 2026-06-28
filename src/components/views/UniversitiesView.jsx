import CardModal from '../ui/CardModal';
import CarouselGrid from '../ui/CarouselGrid';
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Card from '../ui/Card';
import ConfirmDialog from '../ui/ConfirmDialog';

const SORT_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'location', label: 'Location' },
  { key: 'departmentCount', label: 'Department Count' }
];

function normalize(str) {
  return String(str ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const emptyForm = { name: '', location: '', websiteUrl: '', description: '' };

function UniversityFormModal({ title, form, onChange, onSubmit, onClose, error, saving }) {
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="card-modal-overlay" onClick={onClose}>
      <div className="card-modal user-edit-modal" onClick={(e) => e.stopPropagation()}>
        <button className="card-modal__close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="card-modal__title">{title}</h2>
        <form onSubmit={onSubmit} noValidate className="user-edit-form">
          <div className="user-edit-form__field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => onChange('name', e.target.value)} disabled={saving} required />
          </div>
          <div className="user-edit-form__field">
            <label>Location</label>
            <input value={form.location} onChange={(e) => onChange('location', e.target.value)} disabled={saving} required />
          </div>
          <div className="user-edit-form__field">
            <label>Website URL</label>
            <input type="url" value={form.websiteUrl} onChange={(e) => onChange('websiteUrl', e.target.value)} disabled={saving} />
          </div>
          <div className="user-edit-form__field">
            <label>Description</label>
            <input value={form.description} onChange={(e) => onChange('description', e.target.value)} disabled={saving} />
          </div>
          {error && <p role="alert">{error}</p>}
          <div className="user-edit-form__actions">
            <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : title}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

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
  const [currentPage, setCurrentPage] = useState(1);
  const [slideDir, setSlideDir] = useState('right');
  const PAGE_SIZE = 8;

  function goToPage(next) { setSlideDir(next > currentPage ? 'right' : 'left'); setCurrentPage(next); }
  function handleSearchChange(e) { setSearchQuery(e.target.value); setSlideDir('right'); setCurrentPage(1); }
  function handleSortField(e)    { setSortField(e.target.value);   setSlideDir('right'); setCurrentPage(1); }
  function handleSortDir(e)      { setSortDirection(e.target.value); setSlideDir('right'); setCurrentPage(1); }

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [isAdding, setIsAdding] = useState(false);
  const [addFormError, setAddFormError] = useState('');

  // Edit state
  const [editModalTarget, setEditModalTarget] = useState(null); // the uni being edited
  const [editForm, setEditForm] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete state
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [modalTarget, setModalTarget] = useState(null);
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
    setEditModalTarget(uni);
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
      await updateUniversity(editModalTarget.universityId, editForm);
      setEditModalTarget(null);
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

  const totalPages = Math.max(1, Math.ceil(sortedUniversities.length / PAGE_SIZE));
  const pagedUniversities = sortedUniversities.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
          onChange={handleSearchChange}
        />
        <label>
          Sort by:{' '}
          <select value={sortField} onChange={handleSortField}>
            <option value="none">None</option>
            {SORT_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </label>
        {sortField !== 'none' && (
          <label>
            Direction:{' '}
            <select value={sortDirection} onChange={handleSortDir}>
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
          </label>
        )}
      </div>

      {/* Add University — admin/editor only */}
      {canManage && (
        <div className="admin-controls">
          <button type="button" onClick={() => { setAddForm(emptyForm); setAddFormError(''); setShowAddForm(true); }}>
            + Add University
          </button>
        </div>
      )}

      {showAddForm && (
        <UniversityFormModal
          title="Add University"
          form={addForm}
          onChange={(key, val) => setAddForm(p => ({ ...p, [key]: val }))}
          onSubmit={handleCreate}
          onClose={() => setShowAddForm(false)}
          error={addFormError}
          saving={isAdding}
        />
      )}

      {editModalTarget && (
        <UniversityFormModal
          title="Edit University"
          form={editForm}
          onChange={(key, val) => setEditForm(p => ({ ...p, [key]: val }))}
          onSubmit={handleSaveEdit}
          onClose={() => setEditModalTarget(null)}
          error={editError}
          saving={isSavingEdit}
        />
      )}

      {deleteError && <p role="alert">{deleteError}</p>}

      {/* University cards */}
      <CarouselGrid page={currentPage} dir={slideDir}>
      <div className="card-grid">
        {sortedUniversities.length === 0 ? (
          <p>No universities match your search.</p>
        ) : (
          pagedUniversities.map((uni) => {
            return (
              <Card
                key={uni.universityId}
                logo={uni.logoUrl}
                title={uni.name}
                subtitle={uni.location}
                description={uni.description}
                onClick={() => setModalTarget(uni)}
                footer={uni.websiteUrl && (
                  <a href={uni.websiteUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    🔗 Visit website
                  </a>
                )}
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
                    {canManage && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); startEdit(uni); }}>
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        disabled={deletingId === uni.universityId}
                        onClick={(e) => { e.stopPropagation(); setConfirmTarget({ id: uni.universityId, label: uni.name }); }}
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
      </CarouselGrid>

      {modalTarget && (
        <CardModal
          logo={modalTarget.logoUrl}
          title={modalTarget.name}
          subtitle={modalTarget.location}
          description={modalTarget.description}
          onClose={() => setModalTarget(null)}
          footer={modalTarget.websiteUrl && (
            <a href={modalTarget.websiteUrl} target="_blank" rel="noreferrer">🔗 Visit website</a>
          )}
          actions={
            <>
              {topDepartments(modalTarget.universityId).length > 0 && (
                <details open>
                  <summary>Departments ({departmentCount(modalTarget.universityId)} total)</summary>
                  <ul>
                    {topDepartments(modalTarget.universityId).map((dept) => (
                      <li key={dept.departmentId}>{dept.majorName}</li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          }
        />
      )}

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