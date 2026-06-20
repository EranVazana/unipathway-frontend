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

function subjectLabel(key) {
  return SUBJECT_LABELS[key] || key;
}

function emptyPsychometric() {
  return { verbal: '', quantitative: '', english: '' };
}

function emptyBagrutSubject(minUnits = 1) {
  return { grade: '', units: String(minUnits) };
}

function buildInitialBagrut(bagrutScores) {
  const result = {};
  // Seed mandatory subjects first
  for (const subj of MANDATORY_SUBJECTS) {
    const existing = bagrutScores?.[subj];
    result[subj] = {
      grade: existing ? String(existing.grade) : '',
      units: existing ? String(existing.units) : String(MANDATORY_MIN_UNITS[subj])
    };
  }
  // Carry over any optional subjects that were already saved
  if (bagrutScores) {
    for (const [subj, val] of Object.entries(bagrutScores)) {
      if (!MANDATORY_SUBJECTS.includes(subj)) {
        result[subj] = { grade: String(val.grade), units: String(val.units) };
      }
    }
  }
  return result;
}

export default function AcademicScoresView({ targetUserId } = {}) {
  const { user } = useAuth();

  // If targetUserId is provided, we're in admin mode viewing another user's scores
  const effectiveUserId = targetUserId ?? user.userId;
  const isAdminView = Boolean(targetUserId);

  const [academicScoresId, setAcademicScoresId] = useState(null);
  const [psychometric, setPsychometric] = useState(emptyPsychometric());
  const [bagrut, setBagrut] = useState(buildInitialBagrut(null));
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectGrade, setNewSubjectGrade] = useState('56');
  const [newSubjectUnits, setNewSubjectUnits] = useState('1');
  const [newSubjectError, setNewSubjectError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // In normal Settings context, only 'user' role has academic scores
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

  function handleAddSubject() {
    const key = newSubjectName.trim();
    if (!key) {
      setNewSubjectError('Subject name is required.');
      return;
    }
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(key)) {
      setNewSubjectError('Subject name must start with a letter and contain only letters and numbers (e.g. computerScience).');
      return;
    }
    if (bagrut[key]) {
      setNewSubjectError(`"${key}" is already in your scores.`);
      return;
    }
    setBagrut((prev) => ({ ...prev, [key]: { grade: newSubjectGrade, units: newSubjectUnits } }));
    setNewSubjectName('');
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
    const pFields = [
      { name: 'verbal', value: Number(p.verbal) },
      { name: 'quantitative', value: Number(p.quantitative) },
      { name: 'english', value: Number(p.english) }
    ];
    for (const f of pFields) {
      if (isNaN(f.value) || f.value < 50 || f.value > 150) {
        setSaveError(`Psychometric ${f.name} must be a number between 50 and 150.`);
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

  if (!academicScoresId) {
    return <p>No academic scores on record for this user.</p>;
  }

  return (
    <form onSubmit={handleSave} noValidate>

      <h3>Psychometric Scores</h3>
      <p>Each score must be between 50 and 150.</p>
      {['verbal', 'quantitative', 'english'].map((field) => (
        <div key={field}>
          <label htmlFor={`psych-${field}`} style={{ textTransform: 'capitalize' }}>{field}</label>
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
      ))}

      <h3>Bagrut Scores</h3>
      <p>Grade: 0–100. Units: at least the minimum shown.</p>
      {Object.keys(bagrut).map((subj) => {
        const minUnits = MANDATORY_MIN_UNITS[subj] ?? 1;
        const isOptional = !MANDATORY_SUBJECTS.includes(subj);
        return (
          <div key={subj}>
            <strong>{subjectLabel(subj)}</strong>
            {isOptional && (
              <button
                type="button"
                onClick={() => handleRemoveSubject(subj)}
                disabled={isSaving}
              >
                Remove
              </button>
            )}
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
        );
      })}

      <div>
        <h4>Add a Subject</h4>
        <input
          type="text"
          placeholder="e.g. computerScience, physics, arabic"
          value={newSubjectName}
          onChange={(e) => { setNewSubjectName(e.target.value); setNewSubjectError(''); }}
          disabled={isSaving}
        />
        <label>Grade</label>
        <input
          type="number"
          min={0}
          max={100}
          value={newSubjectGrade}
          onChange={(e) => setNewSubjectGrade(e.target.value)}
          disabled={isSaving}
        />
        <label>Units</label>
        <input
          type="number"
          min={1}
          max={5}
          value={newSubjectUnits}
          onChange={(e) => setNewSubjectUnits(e.target.value)}
          disabled={isSaving}
        />
        <button type="button" onClick={handleAddSubject} disabled={isSaving}>
          Add Subject
        </button>
        {newSubjectError && <span role="alert">{newSubjectError}</span>}
      </div>

      {saveError && <p role="alert">{saveError}</p>}
      {saveSuccess && <p>Academic scores saved. Your watchlist Sekem statuses have been recalculated.</p>}

      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Academic Scores'}
      </button>
    </form>
  );
}