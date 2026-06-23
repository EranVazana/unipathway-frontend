import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { academicScoresService } from '../services/academicScoresService';

const MANDATORY_SUBJECTS = [
  'bibleStudies', 'literature', 'hebrewExpression',
  'history', 'civics', 'mathematics', 'english'
];

const MANDATORY_MIN_UNITS = {
  bibleStudies: 2, literature: 2, hebrewExpression: 2,
  history: 2, civics: 2, mathematics: 3, english: 3
};

const SUBJECT_LABELS = {
  bibleStudies: 'Bible Studies', literature: 'Literature',
  hebrewExpression: 'Hebrew Expression', history: 'History',
  civics: 'Civics', mathematics: 'Mathematics', english: 'English',
  computerScience: 'Computer Science', physics: 'Physics',
  psychology: 'Psychology', arabic: 'Arabic', biology: 'Biology',
  chemistry: 'Chemistry', art: 'Art', music: 'Music'
};

const SUBJECT_ICONS = {
  bibleStudies: '📖', literature: '📚', hebrewExpression: '✍️',
  history: '🏛️', civics: '⚖️', mathematics: '📐', english: '🇬🇧',
  computerScience: '💻', physics: '⚛️', psychology: '🧠',
  arabic: '🌙', biology: '🧬', chemistry: '🧪', art: '🎨', music: '🎵'
};

const PSYCHOMETRIC_ICONS = { verbal: '💬', quantitative: '📊', english: '🇬🇧' };

const OPTIONAL_SUBJECTS = Object.keys(SUBJECT_LABELS).filter(
  (k) => !MANDATORY_SUBJECTS.includes(k)
);

function subjectLabel(key) {
  return SUBJECT_LABELS[key] || key;
}

function emptyPsychometric() {
  return { verbal: '', quantitative: '', english: '' };
}

function buildInitialBagrut(bagrutScores) {
  const result = {};
  for (const subj of MANDATORY_SUBJECTS) {
    const existing = bagrutScores?.[subj];
    result[subj] = {
      grade: existing ? String(existing.grade) : '',
      units: existing ? String(existing.units) : String(MANDATORY_MIN_UNITS[subj])
    };
  }
  if (bagrutScores) {
    for (const [subj, val] of Object.entries(bagrutScores)) {
      if (!MANDATORY_SUBJECTS.includes(subj)) {
        result[subj] = { grade: String(val.grade), units: String(val.units) };
      }
    }
  }
  return result;
}

export default function AcademicScoresView({ targetUserId, onSaved } = {}) {
  const { user } = useAuth();

  const effectiveUserId = targetUserId ?? user.userId;
  const isAdminView = Boolean(targetUserId);

  const [academicScoresId, setAcademicScoresId] = useState(null);
  const [psychometric, setPsychometric] = useState(emptyPsychometric());
  const [bagrut, setBagrut] = useState(buildInitialBagrut(null));

  const [selectedSubject, setSelectedSubject] = useState('');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [newSubjectGrade, setNewSubjectGrade] = useState('56');
  const [newSubjectUnits, setNewSubjectUnits] = useState('1');
  const [newSubjectError, setNewSubjectError] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isAdminView && user.userRole !== 'user') {
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    academicScoresService.getByUser(effectiveUserId)
      .then((data) => {
        if (!isMounted) return;
        const entry = data[0] || null;
        if (entry) {
          setAcademicScoresId(entry.academicScoresId);
          setPsychometric({
            verbal: String(entry.psychometricScores?.verbal ?? ''),
            quantitative: String(entry.psychometricScores?.quantitative ?? ''),
            english: String(entry.psychometricScores?.english ?? '')
          });
          setBagrut(buildInitialBagrut(entry.bagrutScores));
        }
      })
      .catch((err) => { if (isMounted) setLoadError(err.message || 'Failed to load academic scores.'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [effectiveUserId, isAdminView, user]);

  function handlePsychometricChange(e) {
    const { name, value } = e.target;
    setPsychometric((prev) => ({ ...prev, [name]: value }));
    setSaveSuccess(false);
    setSaveError('');
  }

  function handleBagrutChange(subject, field, value) {
    setBagrut((prev) => ({ ...prev, [subject]: { ...prev[subject], [field]: value } }));
    setSaveSuccess(false);
    setSaveError('');
  }

  function availableOptionalSubjects() {
    return OPTIONAL_SUBJECTS.filter((k) => !bagrut[k]);
  }

  function handleAddSubject() {
    const isCustom = selectedSubject === '__custom__';
    const key = isCustom ? customSubjectName.trim() : selectedSubject;

    if (!key) {
      setNewSubjectError('Please select a subject or enter a custom name.');
      return;
    }
    if (isCustom && !/^[a-zA-Z][a-zA-Z0-9]*$/.test(key)) {
      setNewSubjectError('Custom name must start with a letter and contain only letters and numbers (e.g. computerScience).');
      return;
    }
    if (bagrut[key]) {
      setNewSubjectError(`"${subjectLabel(key)}" is already in your scores.`);
      return;
    }

    setBagrut((prev) => ({ ...prev, [key]: { grade: newSubjectGrade, units: newSubjectUnits } }));
    setSelectedSubject('');
    setCustomSubjectName('');
    setNewSubjectGrade('56');
    setNewSubjectUnits('1');
    setNewSubjectError('');
  }

  function handleRemoveSubject(subject) {
    setBagrut((prev) => {
      const updated = { ...prev };
      delete updated[subject];
      return updated;
    });
    setSaveSuccess(false);
    setSaveError('');
  }

  function validate() {
    const p = psychometric;
    for (const name of ['verbal', 'quantitative', 'english']) {
      const val = Number(p[name]);
      if (isNaN(val) || val < 50 || val > 150) {
        setSaveError(`Psychometric ${name} must be a number between 50 and 150.`);
        return false;
      }
    }
    for (const subj of Object.keys(bagrut)) {
      const grade = Number(bagrut[subj].grade);
      const units = Number(bagrut[subj].units);
      const minUnits = MANDATORY_MIN_UNITS[subj] ?? 1;
      if (isNaN(grade) || grade < 0 || grade > 100) {
        setSaveError(`${subjectLabel(subj)}: grade must be between 0 and 100.`);
        return false;
      }
      if (isNaN(units) || units < minUnits) {
        setSaveError(`${subjectLabel(subj)}: units must be at least ${minUnits}.`);
        return false;
      }
    }
    return true;
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = {
        psychometricScores: {
          verbal: Number(psychometric.verbal),
          quantitative: Number(psychometric.quantitative),
          english: Number(psychometric.english)
        },
        bagrutScores: Object.fromEntries(
          Object.entries(bagrut).map(([subj, val]) => [
            subj,
            { grade: Number(val.grade), units: Number(val.units) }
          ])
        )
      };
      await academicScoresService.update(academicScoresId, payload);
      setSaveSuccess(true);
      if (onSaved) onSaved();
    } catch (err) {
      setSaveError(err.message || 'Failed to save academic scores.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!isAdminView && user.userRole !== 'user') {
    return <p>Academic scores are only available for student accounts.</p>;
  }
  if (isLoading) return <p>Loading academic scores...</p>;
  if (loadError) return <p role="alert">{loadError}</p>;
  if (!academicScoresId) return <p>No academic scores on record for this user.</p>;

  const available = availableOptionalSubjects();

  return (
    <form onSubmit={handleSave} noValidate className="academic-scores-form">

      {/* ── Psychometric ── */}
      <section className="scores-section">
        <h3 className="scores-section__title">Psychometric Scores</h3>
        <p className="scores-section__hint">Each score must be between 50 and 150.</p>
        <div className="scores-card-grid scores-card-grid--centered">
          {['verbal', 'quantitative', 'english'].map((field) => (
            <div key={field} className="subject-card">
              <span className="subject-card__name" style={{ textTransform: 'capitalize' }}>
                  {PSYCHOMETRIC_ICONS[field] && <span className="subject-card__icon">{PSYCHOMETRIC_ICONS[field]}</span>}
                  {field}
                </span>
              <div className="subject-card__fields">
                <div className="subject-card__field">
                  <label htmlFor={`psych-${field}`}>Score</label>
                  <input
                    id={`psych-${field}`}
                    name={field}
                    type="number"
                    min={50}
                    max={150}
                    value={psychometric[field]}
                    onChange={handlePsychometricChange}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bagrut ── */}
      <section className="scores-section">
        <h3 className="scores-section__title">Bagrut Scores</h3>
        <p className="scores-section__hint">Grade: 0–100. Units: at least the minimum shown.</p>
        <div className="scores-card-grid">
          {Object.keys(bagrut).map((subj) => {
            const minUnits = MANDATORY_MIN_UNITS[subj] ?? 1;
            const isOptional = !MANDATORY_SUBJECTS.includes(subj);
            return (
              <div key={subj} className={`subject-card${isOptional ? ' subject-card--optional' : ''}`}>
                <div className="subject-card__header">
                  <div className="subject-card__title-group">
                    <span className="subject-card__name">
                      {SUBJECT_ICONS[subj] && <span className="subject-card__icon">{SUBJECT_ICONS[subj]}</span>}
                      {subjectLabel(subj)}
                    </span>
                  </div>
                  {isOptional && (
                    <button
                      type="button"
                      className="btn-ghost btn-sm subject-card__remove"
                      onClick={() => handleRemoveSubject(subj)}
                      disabled={isSaving}
                      aria-label={`Remove ${subjectLabel(subj)}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="subject-card__fields">
                  <div className="subject-card__field">
                    <label htmlFor={`${subj}-grade`}>Grade</label>
                    <input
                      id={`${subj}-grade`}
                      type="number"
                      min={0}
                      max={100}
                      value={bagrut[subj].grade}
                      onChange={(e) => handleBagrutChange(subj, 'grade', e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="subject-card__field">
                    <label htmlFor={`${subj}-units`}>Units (min {minUnits})</label>
                    <input
                      id={`${subj}-units`}
                      type="number"
                      min={minUnits}
                      max={5}
                      value={bagrut[subj].units}
                      onChange={(e) => handleBagrutChange(subj, 'units', e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                </div>
                {isOptional && (
                  <div className="subject-card__badge-row">
                    <span className="subject-card__badge">Optional</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Add Subject ── */}
      <section className="scores-section">
        <h3 className="scores-section__title">Add a Subject</h3>
        <div className="add-subject-card">
          <div className="add-subject-card__row">
            <div className="subject-card__field">
              <label htmlFor="add-subject-select">Subject</label>
              <select
                id="add-subject-select"
                value={selectedSubject}
                onChange={(e) => { setSelectedSubject(e.target.value); setNewSubjectError(''); }}
                disabled={isSaving}
              >
                <option value="">— Select a subject —</option>
                {available.map((k) => (
                  <option key={k} value={k}>{SUBJECT_LABELS[k]}</option>
                ))}
                <option value="__custom__">Other (enter manually)</option>
              </select>
            </div>

            {selectedSubject === '__custom__' && (
              <div className="subject-card__field">
                <label htmlFor="add-subject-custom">Subject key (camelCase)</label>
                <input
                  id="add-subject-custom"
                  type="text"
                  placeholder="e.g. frenchLiterature"
                  value={customSubjectName}
                  onChange={(e) => { setCustomSubjectName(e.target.value); setNewSubjectError(''); }}
                  disabled={isSaving}
                />
              </div>
            )}

            <div className="subject-card__field">
              <label htmlFor="add-subject-grade">Grade</label>
              <input
                id="add-subject-grade"
                type="number"
                min={0}
                max={100}
                value={newSubjectGrade}
                onChange={(e) => setNewSubjectGrade(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="subject-card__field">
              <label htmlFor="add-subject-units">Units</label>
              <input
                id="add-subject-units"
                type="number"
                min={1}
                max={5}
                value={newSubjectUnits}
                onChange={(e) => setNewSubjectUnits(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <button
              type="button"
              className="btn-accent add-subject-card__btn"
              onClick={handleAddSubject}
              disabled={isSaving || !selectedSubject}
            >
              + Add
            </button>
          </div>
          {newSubjectError && <span role="alert">{newSubjectError}</span>}
        </div>
      </section>

      {saveError && <p role="alert">{saveError}</p>}
      {saveSuccess && <p>Academic scores saved. Your watchlist Sekem statuses have been recalculated.</p>}

      <button type="submit" className="btn-primary btn-block" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Academic Scores'}
      </button>
    </form>
  );
}