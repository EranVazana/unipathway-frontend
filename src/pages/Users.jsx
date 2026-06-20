import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usersService } from '../services/usersService';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';

const VALID_ROLES = ['admin', 'editor', 'user'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function Users() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let isMounted = true;
    usersService.getAll()
      .then((data) => { if (isMounted) setUsers(data); })
      .catch((err) => { if (isMounted) setLoadError(err.message || 'Failed to load users.'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  function startEdit(user) {
    setEditingId(user.userId);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      userRole: user.userRole,
      email: user.email || '',
      username: user.username || '',
      newPassword: ''
    });
    setEditError('');
  }

  function validateEditForm() {
    if (!editForm.firstName.trim()) return 'First name is required.';
    if (!editForm.lastName.trim()) return 'Last name is required.';
    if (!editForm.userRole) return 'Role is required.';
    if (!editForm.email.trim()) return 'Email is required.';
    if (!EMAIL_REGEX.test(editForm.email)) return 'Enter a valid email address.';
    if (!editForm.username.trim()) return 'Username is required.';
    if (!USERNAME_REGEX.test(editForm.username)) return 'Username must be 3–20 characters: letters, numbers, underscores only.';
    if (editForm.newPassword && editForm.newPassword.length < 6) return 'New password must be at least 6 characters.';
    return null;
  }

  async function handleSaveEdit(userId) {
    const error = validateEditForm();
    if (error) { setEditError(error); return; }

    setEditError('');
    setIsSavingEdit(true);
    try {
      // Two separate calls: identity fields to PUT /users/:id,
      // credentials to PUT /users/:id/settings
      const identityPayload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        userRole: editForm.userRole
      };
      const settingsPayload = { email: editForm.email, username: editForm.username };
      if (editForm.newPassword) settingsPayload.password = editForm.newPassword;

      await Promise.all([
        usersService.update(userId, identityPayload),
        usersService.updateSettings(userId, settingsPayload)
      ]);

      // Re-fetch from server to get accurate data including any backend transformations
      const updated = await usersService.getAll();
      setUsers(updated);
      setEditingId(null);
    } catch (err) {
      setEditError(err.message || 'Failed to update user.');
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
      await usersService.delete(id);
      setUsers((prev) => prev.filter((u) => u.userId !== id));
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  }

  function field(key, type = 'text') {
    return (row) =>
      editingId === row.userId ? (
        <input
          type={type}
          value={editForm[key]}
          onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
          disabled={isSavingEdit}
        />
      ) : (type === 'password' ? '••••••' : row[key]);
  }

  const columns = [
    { key: 'firstName',  label: 'First Name',  render: field('firstName') },
    { key: 'lastName',   label: 'Last Name',   render: field('lastName') },
    { key: 'email',      label: 'Email',       render: field('email', 'email') },
    { key: 'username',   label: 'Username',    render: field('username') },
    {
      key: 'userRole',
      label: 'Role',
      render: (row) =>
        editingId === row.userId ? (
          <select
            value={editForm.userRole}
            onChange={(e) => setEditForm((p) => ({ ...p, userRole: e.target.value }))}
            disabled={isSavingEdit}
          >
            {VALID_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        ) : row.userRole
    },
    {
      key: 'newPassword',
      label: 'New Password',
      render: (row) =>
        editingId === row.userId ? (
          <input
            type="password"
            placeholder="Leave blank to keep current"
            value={editForm.newPassword}
            onChange={(e) => setEditForm((p) => ({ ...p, newPassword: e.target.value }))}
            disabled={isSavingEdit}
          />
        ) : null
    },
    {
      key: 'actions',
      label: '',
      render: (row) => {
        const isSelf = row.userId === currentUser.userId;
        const isAdmin = currentUser.userRole === 'admin';
        if (editingId === row.userId) {
          return (
            <>
              <button type="button" onClick={() => handleSaveEdit(row.userId)} disabled={isSavingEdit}>
                {isSavingEdit ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setEditingId(null)} disabled={isSavingEdit}>
                Cancel
              </button>
              {editError && <p role="alert">{editError}</p>}
            </>
          );
        }
        return (
          <>
            {(isAdmin || isSelf) && (
              <button type="button" onClick={() => startEdit(row)}>Edit</button>
            )}
            {isAdmin && (
              <>
                <button type="button" onClick={() => navigate(`/users/${row.userId}/academic-scores`)}>
                  Academic Scores
                </button>
                <button type="button" onClick={() => navigate(`/users/${row.userId}/watchlist`)}>
                  Watchlist
                </button>
              </>
            )}
            {isAdmin && !isSelf && (
              <button
                type="button"
                disabled={deletingId === row.userId}
                onClick={() => setConfirmTarget({ id: row.userId, label: `${row.firstName} ${row.lastName}` })}
              >
                {deletingId === row.userId ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </>
        );
      }
    }
  ];

  if (isLoading) return <p>Loading users...</p>;
  if (loadError) return <p role="alert">{loadError}</p>;

  return (
    <div className="users-page">
      <h1>Users</h1>
      {confirmTarget && (
        <ConfirmDialog
          message={`Are you sure you want to delete user "${confirmTarget.label}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
      {deleteError && <p role="alert">{deleteError}</p>}
      <DataTable
        columns={columns}
        rows={users.map((u) => ({ ...u, id: u.userId }))}
        emptyMessage="No users found."
      />
    </div>
  );
}