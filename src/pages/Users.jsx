import PageSpinner from './../components/PageSpinner';
import PageError from './../components/PageError';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usersService } from '../services/usersService';
import ConfirmDialog from '../components/ConfirmDialog';
import { createPortal } from 'react-dom';

const VALID_ROLES = ['admin', 'editor', 'user'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const PAGE_SIZE = 8;

const ROLE_BADGE = {
  admin:  'role-badge role-badge--admin',
  editor: 'role-badge role-badge--editor',
  user:   'role-badge role-badge--user',
};

function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    userRole: user.userRole,
    email: user.email || '',
    username: user.username || '',
    newPassword: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function validate() {
    if (!form.firstName.trim()) return 'First name is required.';
    if (!form.lastName.trim()) return 'Last name is required.';
    if (!form.userRole) return 'Role is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!EMAIL_REGEX.test(form.email)) return 'Enter a valid email address.';
    if (!form.username.trim()) return 'Username is required.';
    if (!USERNAME_REGEX.test(form.username)) return 'Username must be 3–20 chars: letters, numbers, underscores.';
    if (form.newPassword && form.newPassword.length < 6) return 'New password must be at least 6 characters.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(''); setSaving(true);
    try {
      await usersService.update(user.userId, {
        firstName: form.firstName,
        lastName: form.lastName,
        userRole: form.userRole,
      });
      const settingsPayload = {};
      if (form.email !== user.email) settingsPayload.email = form.email;
      if (form.username !== user.username) settingsPayload.username = form.username;
      if (form.newPassword) settingsPayload.password = form.newPassword;
      if (Object.keys(settingsPayload).length > 0) {
        await usersService.updateSettings(user.userId, settingsPayload);
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="card-modal-overlay" onClick={onClose}>
      <div className="card-modal user-edit-modal" onClick={(e) => e.stopPropagation()}>
        <button className="card-modal__close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="card-modal__title">Edit User</h2>
        <p className="card-modal__subtitle">{user.firstName} {user.lastName}</p>

        <form onSubmit={handleSubmit} noValidate className="user-edit-form">
          <div className="user-edit-form__row">
            <div className="user-edit-form__field">
              <label>First Name</label>
              <input value={form.firstName} onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} disabled={saving} />
            </div>
            <div className="user-edit-form__field">
              <label>Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} disabled={saving} />
            </div>
          </div>
          <div className="user-edit-form__field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} disabled={saving} />
          </div>
          <div className="user-edit-form__row">
            <div className="user-edit-form__field">
              <label>Username</label>
              <input value={form.username} onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))} disabled={saving} />
            </div>
            <div className="user-edit-form__field">
              <label>Role</label>
              <select value={form.userRole} onChange={(e) => setForm(p => ({ ...p, userRole: e.target.value }))} disabled={saving}>
                {VALID_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="user-edit-form__field">
            <label>New Password <span className="user-edit-form__optional">(leave blank to keep current)</span></label>
            <input type="password" placeholder="••••••••" value={form.newPassword} onChange={(e) => setForm(p => ({ ...p, newPassword: e.target.value }))} disabled={saving} />
          </div>

          {error && <p role="alert">{error}</p>}

          <div className="user-edit-form__actions">
            <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    usersService.getAll()
      .then((data) => { if (isMounted) setUsers(data); })
      .catch((err) => { if (isMounted) setLoadError(err.message || 'Failed to load users.'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  async function handleSaved() {
    const updated = await usersService.getAll();
    setUsers(updated);
    setEditTarget(null);
  }

  async function handleDelete() {
    const { id } = confirmTarget;
    setConfirmTarget(null);
    setDeleteError('');
    setDeletingId(id);
    try {
      await usersService.delete(id);
      setUsers((prev) => prev.filter((u) => u.userId !== id));
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) return <PageSpinner />;
  if (loadError) return <PageError message={loadError} />;

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const pagedUsers = users.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const isAdmin = currentUser.userRole === 'admin';

  return (
    <div className="users-page">
      <h1>Users</h1>

      {deleteError && <p role="alert">{deleteError}</p>}

      {editTarget && (
        <EditUserModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${confirmTarget.label}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Username</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pagedUsers.map((u) => {
              const isSelf = u.userId === currentUser.userId;
              return (
                <tr key={u.userId}>
                  <td className="users-table__name">
                    <span className="users-table__avatar">
                      {u.firstName[0]}{u.lastName[0]}
                    </span>
                    {u.firstName} {u.lastName}
                  </td>
                  <td>{u.email}</td>
                  <td><code>{u.username}</code></td>
                  <td>
                    <span className={ROLE_BADGE[u.userRole] || 'role-badge'}>
                      {u.userRole}
                    </span>
                  </td>
                  <td className="users-table__actions">
                    {(isAdmin || isSelf) && (
                      <button type="button" onClick={() => setEditTarget(u)}>Edit</button>
                    )}
                    {isAdmin && (
                      <>
                        <button type="button" onClick={() => navigate(`/users/${u.userId}/academic-scores`)}>
                          Scores
                        </button>
                        <button type="button" onClick={() => navigate(`/users/${u.userId}/watchlist`)}>
                          Watchlist
                        </button>
                      </>
                    )}
                    {isAdmin && !isSelf && (
                      <button
                        type="button"
                        className="btn-danger"
                        disabled={deletingId === u.userId}
                        onClick={() => setConfirmTarget({ id: u.userId, label: `${u.firstName} ${u.lastName}` })}
                      >
                        {deletingId === u.userId ? '...' : 'Delete'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button type="button" className="pagination__btn" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>‹ Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button key={page} type="button"
              className={`pagination__btn${page === currentPage ? ' pagination__btn--active' : ''}`}
              onClick={() => setCurrentPage(page)}
            >{page}</button>
          ))}
          <button type="button" className="pagination__btn" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Next ›</button>
        </div>
      )}
    </div>
  );
}