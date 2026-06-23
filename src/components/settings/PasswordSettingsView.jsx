import { useState } from 'react';
import { settingsService } from '../../services/settingsService';

export default function PasswordSettingsView() {
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setSaveSuccess(false);
    setSaveError('');
  }

  function validate() {
    const errors = {};
    if (!form.password) {
      errors.password = 'New password is required.';
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);
    if (!validate()) return;
    setIsSaving(true);
    try {
      await settingsService.updateSettings({ password: form.password });
      setForm({ password: '', confirmPassword: '' });
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err.message || 'Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} noValidate>
      <div>
        <label htmlFor="password">New Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          disabled={isSaving}
        />
        {fieldErrors.password && <span role="alert">{fieldErrors.password}</span>}
      </div>

      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          disabled={isSaving}
        />
        {fieldErrors.confirmPassword && <span role="alert">{fieldErrors.confirmPassword}</span>}
      </div>

      <div className="password-settings-footer">
        {saveError && <p role="alert">{saveError}</p>}
        {saveSuccess && <p>Password updated successfully.</p>}
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Update Password'}
        </button>
      </div>
    </form>
  );
}