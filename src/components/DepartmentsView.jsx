import CardModal from './CardModal';
import CarouselGrid from './CarouselGrid';
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

function DepartmentFormModal({ title, form, onChange, onSubmit, onClose, error, saving, universities, dept, thresholds, createThreshold, updateThreshold, deleteThreshold }) {
  const [uniSearch, setUniSearch] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  // Threshold tab state
  const deptThresholds = dept ? thresholds.filter((t) => t.departmentId === dept.departmentId) : [];
  const [thresholdForm, setThresholdForm] = useState({
    minSekem: '',
    sekemType: 'quantitative',
    sekemWeights: { bagrutWeight: 0.5, psychometricWeight: 0.5 },
    year: new Date().getFullYear()
  });
  const [addThreshold, setAddThreshold] = useState({
    minSekem: '',
    sekemType: 'quantitative',
    sekemWeights: { bagrutWeight: 0.5, psychometricWeight: 0.5 },
    year: new Date().getFullYear()
  });
  const [editingThresholdId, setEditingThresholdId] = useState(null);
  const [thresholdError, setThresholdError] = useState('');
  const [thresholdSaving, setThresholdSaving] = useState(false);
  const [deletingThresholdId, setDeletingThresholdId] = useState(null);

  const weights = thresholdForm.sekemWeights ?? { bagrutWeight: 0.5, psychometricWeight: 0.5 };
  const filteredUniversities = universities.filter((u) =>
    u.name.toLowerCase().includes(uniSearch.toLowerCase())
  );

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function startEditThreshold(t) {
    setEditingThresholdId(t.thresholdId);
    setThresholdForm({
      minSekem: t.minSekem,
      sekemType: t.sekemType,
      sekemWeights: t.sekemWeights || { bagrutWeight: 0.5, psychometricWeight: 0.5 },
      year: t.year
    });
    setThresholdError('');
  }

  async function handleSaveThreshold(e) {
    e.preventDefault();
    setThresholdError('');
    const minSekem = Number(thresholdForm.minSekem);
    const year = Number(thresholdForm.year);
    if (!minSekem || minSekem < 0) { setThresholdError('Min Sekem must be a positive number.'); return; }
    if (!year || year < 2000 || year > 2100) { setThresholdError('Year must be between 2000 and 2100.'); return; }
    const basePayload = { departmentId: dept.departmentId, minSekem, sekemType: thresholdForm.sekemType, sekemWeights: weights, year };
    console.log('Sending threshold payload:', JSON.stringify(basePayload));
    setThresholdSaving(true);
    try {
      if (editingThresholdId) {
        await updateThreshold(editingThresholdId, basePayload);
        setEditingThresholdId(null);
      } else {
        await createThreshold(basePayload);
      }
      setThresholdForm({ minSekem: '', sekemType: 'quantitative', year: new Date().getFullYear() });
    } catch (err) {
      setThresholdError(err.message || 'Failed to save threshold.');
    } finally {
      setThresholdSaving(false);
    }
  }

  async function handleDeleteThreshold(id) {
    setDeletingThresholdId(id);
    try { await deleteThreshold(id); } catch (err) { setThresholdError(err.message || 'Failed to delete.'); }
    finally { setDeletingThresholdId(null); }
  }

  return createPortal(
    <div className="card-modal-overlay" onClick={onClose}>
      <div className={`card-modal user-edit-modal${!dept ? ' user-edit-modal--wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="card-modal__close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="card-modal__title">{title}</h2>

        {/* Tabs — only show threshold tab when editing */}
        {dept && (
          <div className="dept-modal-tabs">
            <button type="button" className={activeTab === 'details' ? 'dept-modal-tab--active' : ''} onClick={() => setActiveTab('details')}>Details</button>
            <button type="button" className={activeTab === 'thresholds' ? 'dept-modal-tab--active' : ''} onClick={() => setActiveTab('thresholds')}>Admission Thresholds</button>
          </div>
        )}

        {/* ── Details tab ── */}
        {activeTab === 'details' && (
          <form onSubmit={(e) => onSubmit(e, !dept ? addThreshold : undefined)} noValidate className={`user-edit-form${!dept ? ' user-edit-form--horizontal' : ''}`}>
            <div className={!dept ? 'dept-form-left' : ''}>
              <div className="user-edit-form__field">
                <label>University</label>
                <input type="text" placeholder="Search university..." value={uniSearch} onChange={(e) => setUniSearch(e.target.value)} disabled={saving} className="uni-search-input" />
                <select value={form.universityId} onChange={(e) => onChange('universityId', e.target.value)} disabled={saving}>
                  {filteredUniversities.map((u) => (
                    <option key={u.universityId} value={u.universityId}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="user-edit-form__row">
                <div className="user-edit-form__field">
                  <label>Major Name</label>
                  <input value={form.majorName} onChange={(e) => onChange('majorName', e.target.value)} disabled={saving} required />
                </div>
                <div className="user-edit-form__field">
                  <label>Degree Type</label>
                  <select value={form.degreeType} onChange={(e) => onChange('degreeType', e.target.value)} disabled={saving}>
                    {DEGREE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="user-edit-form__field">
                <label>Faculty</label>
                <input value={form.faculty} onChange={(e) => onChange('faculty', e.target.value)} disabled={saving} required />
              </div>
              <div className="user-edit-form__field">
                <label>Description</label>
                <input value={form.description} onChange={(e) => onChange('description', e.target.value)} disabled={saving} />
              </div>
            </div>

            {/* Threshold section — only on Add, shown as right column */}
            {!dept && (
              <div className="dept-form-right">
                <p className="dept-form-right__label">Initial Admission Threshold</p>
                <div className="user-edit-form__field">
                  <label>Min Sekem</label>
                  <input type="number" value={addThreshold.minSekem} onChange={(e) => setAddThreshold(p => ({ ...p, minSekem: e.target.value }))} placeholder="e.g. 480" disabled={saving} required />
                </div>
                <div className="user-edit-form__field">
                  <label>Type</label>
                  <select value={addThreshold.sekemType} onChange={(e) => setAddThreshold(p => ({ ...p, sekemType: e.target.value }))} disabled={saving}>
                    <option value="quantitative">Quantitative</option>
                    <option value="verbal">Verbal</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div className="user-edit-form__field">
                  <label>Year</label>
                  <input type="number" value={addThreshold.year} onChange={(e) => setAddThreshold(p => ({ ...p, year: e.target.value }))} disabled={saving} />
                </div>
                <div className="user-edit-form__field">
                  <label>Bagrut Weight</label>
                  <input type="number" step="0.01" min="0" max="1" value={addThreshold.sekemWeights.bagrutWeight}
                    onChange={(e) => setAddThreshold(p => ({ ...p, sekemWeights: { bagrutWeight: Number(e.target.value), psychometricWeight: Math.round((1 - Number(e.target.value)) * 1000) / 1000 } }))}
                    disabled={saving} />
                </div>
                <div className="user-edit-form__field">
                  <label>Psychometric Weight</label>
                  <input type="number" step="0.01" min="0" max="1" value={addThreshold.sekemWeights.psychometricWeight}
                    onChange={(e) => setAddThreshold(p => ({ ...p, sekemWeights: { psychometricWeight: Number(e.target.value), bagrutWeight: Math.round((1 - Number(e.target.value)) * 1000) / 1000 } }))}
                    disabled={saving} />
                </div>
              </div>
            )}

            {error && <p role="alert">{error}</p>}
            <div className="user-edit-form__actions">
              <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : title}</button>
            </div>
          </form>
        )}

        {/* ── Thresholds tab ── */}
        {activeTab === 'thresholds' && (
          <div className="threshold-tab">

            {/* Existing thresholds */}
            {deptThresholds.length === 0 ? (
              <p className="threshold-tab__empty">No thresholds on record.</p>
            ) : (
              <div className="threshold-list">
                {deptThresholds.sort((a, b) => b.year - a.year).map((t) => (
                  <div key={t.thresholdId} className={`threshold-row${editingThresholdId === t.thresholdId ? ' threshold-row--editing' : ''}`}>
                    {editingThresholdId === t.thresholdId ? (
                      <form onSubmit={handleSaveThreshold} className="threshold-inline-form">
                        <input type="number" value={thresholdForm.minSekem} onChange={(e) => setThresholdForm(p => ({ ...p, minSekem: e.target.value }))} placeholder="Min Sekem" disabled={thresholdSaving} />
                        <select value={thresholdForm.sekemType} onChange={(e) => setThresholdForm(p => ({ ...p, sekemType: e.target.value }))} disabled={thresholdSaving}>
                          <option value="quantitative">Quantitative</option>
                          <option value="verbal">Verbal</option>
                          <option value="general">General</option>
                        </select>
                        <input type="number" value={thresholdForm.year} onChange={(e) => setThresholdForm(p => ({ ...p, year: e.target.value }))} placeholder="Year" disabled={thresholdSaving} />
                        <button type="submit" className="btn-primary btn-sm" disabled={thresholdSaving}>{thresholdSaving ? '...' : 'Save'}</button>
                        <button type="button" className="btn-sm" onClick={() => setEditingThresholdId(null)}>Cancel</button>
                      </form>
                    ) : (
                      <>
                        <div className="threshold-row__info">
                          <span className="threshold-row__sekem">{t.minSekem}</span>
                          <span className="threshold-row__meta">{t.sekemType} · {t.year}</span>
                        </div>
                        <div className="threshold-row__actions">
                          <button type="button" className="btn-sm" onClick={() => startEditThreshold(t)}>Edit</button>
                          <button type="button" className="btn-sm btn-danger" disabled={deletingThresholdId === t.thresholdId} onClick={() => handleDeleteThreshold(t.thresholdId)}>
                            {deletingThresholdId === t.thresholdId ? '...' : 'Delete'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add new threshold form */}
            {!editingThresholdId && (
              <form onSubmit={handleSaveThreshold} className="threshold-add-form">
                <h4>Add Threshold</h4>
                <div className="threshold-add-form__row">
                  <div className="user-edit-form__field">
                    <label>Min Sekem</label>
                    <input type="number" value={thresholdForm.minSekem} onChange={(e) => setThresholdForm(p => ({ ...p, minSekem: e.target.value }))} placeholder="e.g. 480" disabled={thresholdSaving} />
                  </div>
                  <div className="user-edit-form__field">
                    <label>Type</label>
                    <select value={thresholdForm.sekemType} onChange={(e) => setThresholdForm(p => ({ ...p, sekemType: e.target.value }))} disabled={thresholdSaving}>
                      <option value="quantitative">Quantitative</option>
                      <option value="verbal">Verbal</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div className="user-edit-form__field">
                    <label>Year</label>
                    <input type="number" value={thresholdForm.year} onChange={(e) => setThresholdForm(p => ({ ...p, year: e.target.value }))} disabled={thresholdSaving} />
                  </div>
                </div>
                <div className="threshold-add-form__row--2">
                  <div className="user-edit-form__field">
                    <label>Bagrut Weight (0–1)</label>
                    <input type="number" step="0.01" min="0" max="1" value={weights.bagrutWeight}
                      onChange={(e) => setThresholdForm(p => ({ ...p, sekemWeights: { bagrutWeight: Number(e.target.value), psychometricWeight: Math.round((1 - Number(e.target.value)) * 1000) / 1000 } }))}
                      disabled={thresholdSaving} />
                  </div>
                  <div className="user-edit-form__field">
                    <label>Psychometric Weight (0–1)</label>
                    <input type="number" step="0.01" min="0" max="1" value={weights.psychometricWeight}
                      onChange={(e) => setThresholdForm(p => ({ ...p, sekemWeights: { psychometricWeight: Number(e.target.value), bagrutWeight: Math.round((1 - Number(e.target.value)) * 1000) / 1000 } }))}
                      disabled={thresholdSaving} />
                  </div>
                </div>
                {thresholdError && <p role="alert">{thresholdError}</p>}
                <button type="submit" className="btn-primary" disabled={thresholdSaving}>{thresholdSaving ? 'Adding...' : '+ Add Threshold'}</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function DepartmentsView({
  user,
  departments,
  universities,
  universityName,
  latestThreshold,
  thresholds = [],
  isWatchlisted,
  addToWatchlist,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createThreshold,
  updateThreshold,
  deleteThreshold
}) {
  const canManage = user.userRole === 'admin' || user.userRole === 'editor';
  const canDelete = user.userRole === 'admin';
  const canUseWatchlist = user.userRole === 'user';

  const [pendingDepartmentId, setPendingDepartmentId] = useState(null);
  const [addErrors, setAddErrors] = useState({});
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

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(() => emptyForm(universities));
  const [isAdding, setIsAdding] = useState(false);
  const [addFormError, setAddFormError] = useState('');

  // Edit state
  const [editModalTarget, setEditModalTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete state
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, label }
  const [modalTarget, setModalTarget] = useState(null);
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

  async function handleCreate(e, thresholdData) {
    e.preventDefault();
    setAddFormError('');
    if (!addForm.universityId) { setAddFormError('University is required.'); return; }
    if (!addForm.majorName?.trim()) { setAddFormError('Major Name is required.'); return; }
    if (!addForm.faculty?.trim()) { setAddFormError('Faculty is required.'); return; }
    if (!thresholdData.minSekem || Number(thresholdData.minSekem) <= 0) {
      setAddFormError('Min Sekem is required and must be a positive number.');
      return;
    }
    const year = Number(thresholdData.year);
    if (!year || year < 2000 || year > 2100) {
      setAddFormError('Year must be between 2000 and 2100.');
      return;
    }
    const tw = thresholdData.sekemWeights ?? { bagrutWeight: 0.5, psychometricWeight: 0.5 };
    setIsAdding(true);
    try {
      const newDept = await createDepartment({ ...addForm, universityId: Number(addForm.universityId) });
      const departmentId = newDept?.departmentId;
      if (departmentId) {
        await createThreshold({
          departmentId,
          minSekem: Number(thresholdData.minSekem),
          sekemType: thresholdData.sekemType,
          sekemWeights: tw,
          year,
        });
      }
      setAddForm(emptyForm(universities));
      setShowAddForm(false);
    } catch (err) {
      setAddFormError(err.message || 'Failed to create department.');
    } finally {
      setIsAdding(false);
    }
  }

  function startEdit(dept) {
    setEditModalTarget(dept);
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
      await updateDepartment(editModalTarget.departmentId, { ...editForm, universityId: Number(editForm.universityId) });
      setEditModalTarget(null);
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

  const totalPages = Math.max(1, Math.ceil(sortedDepartments.length / PAGE_SIZE));
  const pagedDepartments = sortedDepartments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

      {/* Add Department form — admin/editor only */}
      {canManage && (
        <div className="admin-controls">
          <button type="button" onClick={() => { setAddForm(emptyForm(universities)); setAddFormError(''); setShowAddForm(true); }}>
            + Add Department
          </button>
        </div>
      )}

      {showAddForm && (
        <DepartmentFormModal
          title="Add Department"
          form={addForm}
          onChange={(key, val) => setAddForm(p => ({ ...p, [key]: val }))}
          onSubmit={handleCreate}
          onClose={() => setShowAddForm(false)}
          error={addFormError}
          saving={isAdding}
          universities={universities}
        />
      )}

      {editModalTarget && (
        <DepartmentFormModal
          title="Edit Department"
          form={editForm}
          onChange={(key, val) => setEditForm(p => ({ ...p, [key]: val }))}
          onSubmit={handleSaveEdit}
          onClose={() => setEditModalTarget(null)}
          error={editError}
          saving={isSavingEdit}
          universities={universities}
          dept={editModalTarget}
          thresholds={thresholds}
          createThreshold={createThreshold}
          updateThreshold={updateThreshold}
          deleteThreshold={deleteThreshold}
        />
      )}

      {deleteError && <p role="alert">{deleteError}</p>}

      {/* Department cards */}
      <CarouselGrid page={currentPage} dir={slideDir}>
      <div className="card-grid">
        {sortedDepartments.length === 0 ? (
          <p>No departments match your search.</p>
        ) : (
          pagedDepartments.map((dept) => {
            const threshold = latestThreshold(dept.departmentId);

            const alreadyWatchlisted = isWatchlisted(dept.departmentId);
            const isPending = pendingDepartmentId === dept.departmentId;
            const addError = addErrors[dept.departmentId];

            return (
              <Card
                key={dept.departmentId}
                title={dept.majorName}
                subtitle={universityName(dept.universityId)}
                meta={`${dept.degreeType} · ${dept.faculty}`}
                description={dept.description}
                onClick={() => setModalTarget({ dept, alreadyWatchlisted, isPending, addError })}
                actions={
                  <>
                    {threshold ? (
                      <p>Min Sekem: {threshold.minSekem}<br/><span className="threshold-meta">{threshold.sekemType}, {threshold.year}</span></p>
                    ) : (
                      <p>No admission threshold on record.</p>
                    )}

                    {canUseWatchlist && (
                      <button
                        type="button"
                        disabled={alreadyWatchlisted || isPending}
                        onClick={(e) => { e.stopPropagation(); handleAddToWatchlist(dept.departmentId); }}
                      >
                        {alreadyWatchlisted ? 'Already in Watchlist' : isPending ? 'Adding...' : 'Add to Watchlist'}
                      </button>
                    )}

                    {canManage && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); startEdit(dept); }}>
                        Edit
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        disabled={deletingId === dept.departmentId}
                        onClick={(e) => { e.stopPropagation(); setConfirmTarget({ id: dept.departmentId, label: dept.majorName }); }}
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
      </CarouselGrid>

      {modalTarget && (() => {
        const { dept, alreadyWatchlisted: aw, isPending: ip, addError: ae } = modalTarget;
        const deptThresholds = thresholds
          .filter((t) => t.departmentId === dept.departmentId)
          .sort((a, b) => b.year - a.year);
        return (
          <CardModal
            title={dept.majorName}
            subtitle={universityName(dept.universityId)}
            meta={`${dept.degreeType} · ${dept.faculty}`}
            description={dept.description}
            onClose={() => setModalTarget(null)}
            actions={
              <>
                {deptThresholds.length > 0 ? (
                  <div className="modal-thresholds">
                    <p className="modal-thresholds__title">Admission Thresholds</p>
                    <div className="modal-thresholds__list">
                      {deptThresholds.map((t) => (
                        <div key={t.thresholdId} className={`modal-threshold-row${t === deptThresholds[0] ? ' modal-threshold-row--latest' : ''}`}>
                          <span className="modal-threshold-row__sekem">{t.minSekem}</span>
                          <span className="modal-threshold-row__meta">
                            <span className="threshold-meta">{t.sekemType}</span>
                            <span className="modal-threshold-row__year">{t.year}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p>No admission threshold on record.</p>
                )}
                {canUseWatchlist && (
                  <button
                    type="button"
                    disabled={aw || ip}
                    onClick={() => { handleAddToWatchlist(dept.departmentId); setModalTarget(null); }}
                  >
                    {aw ? 'Already in Watchlist' : ip ? 'Adding...' : 'Add to Watchlist'}
                  </button>
                )}
                {ae && <p role="alert">{ae}</p>}
              </>
            }
          />
        );
      })()}

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