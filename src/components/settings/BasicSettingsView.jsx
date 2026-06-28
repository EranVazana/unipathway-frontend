import { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import PageSpinner from '../ui/PageSpinner';
import PageError from '../ui/PageError';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BasicSettingsView() {
  const [form, setForm] = useState({ username: '', email: '', theme: 'light' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    settingsService.getSettings()
      .then((data) => {
        if (!isMounted) return;
        setForm({ username: data.username || '', email: data.email || '', theme: data.theme || 'light' });
      })
      .catch((err) => { if (isMounted) setLoadError(err.message || 'Failed to load settings.'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setSaveSuccess(false);
    setSaveError('');
  }

  function validate() {
    const errors = {};
    if (!form.username.trim()) {
      errors.username = 'Username is required.';
    } else if (!USERNAME_REGEX.test(form.username)) {
      errors.username = 'Username must be 3–20 characters: letters, numbers, and underscores only.';
    }
    if (!form.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(form.email)) {
      errors.email = 'Enter a valid email address.';
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
      await settingsService.updateSettings({ username: form.username, email: form.email, theme: form.theme });
      setSaveSuccess(true);
    } catch (err) {
      if (err.details?.field) {
        setFieldErrors((prev) => ({ ...prev, [err.details.field]: err.message }));
      } else {
        setSaveError(err.message || 'Failed to save settings.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <PageSpinner message="Loading settings..." />;
  if (loadError) return <PageError message={loadError} />;

  return (
    <form onSubmit={handleSave} noValidate>
      <div>
        <label htmlFor="username">Username</label>
        <input id="username" name="username" type="text" value={form.username} onChange={handleChange} disabled={isSaving} />
        {fieldErrors.username && <span role="alert">{fieldErrors.username}</span>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} disabled={isSaving} />
        {fieldErrors.email && <span role="alert">{fieldErrors.email}</span>}
      </div>

      <div>
        <label htmlFor="theme">Theme</label>
        <select id="theme" name="theme" value={form.theme} onChange={handleChange} disabled={isSaving}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      {saveError && <p role="alert">{saveError}</p>}
      {saveSuccess && <p>Settings saved successfully.</p>}

      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
}