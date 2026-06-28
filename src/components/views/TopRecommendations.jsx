import { useEffect, useState } from 'react';
import { academicScoresService } from '../../services/academicScoresService';

export default function TopRecommendations({ watchlist, departments, universityName, latestThreshold, user }) {
  const [academicScores, setAcademicScores] = useState(null);

  useEffect(() => {
    let ok = true;
    academicScoresService.getByUser(user.userId)
      .then(data => { if (ok) setAcademicScores(data[0] || null); })
      .catch(() => {});
    return () => { ok = false; };
  }, [user.userId]);

  // Build enriched rows with gap info
  const rows = watchlist
    .map((w) => {
      const dept = departments.find((d) => d.departmentId === w.departmentId);
      const threshold = latestThreshold(w.departmentId);
      if (!dept || !threshold?.minSekem || !w.userSekem) return null;

      const bagrutScores = academicScores?.bagrutScores || null;
      const { effectiveMin, totalBonus, bonuses } = calcEffectiveMin(threshold, bagrutScores);

      const gap = w.userSekem - effectiveMin;
      const pct = Math.min(w.userSekem / effectiveMin, 1);
      const passed = gap >= 0;

      return {
        departmentId: w.departmentId,
        majorName: dept.majorName,
        faculty: dept.faculty,
        university: universityName(dept.universityId),
        userSekem: w.userSekem,
        minSekem: threshold.minSekem,
        effectiveMin,
        totalBonus,
        bonuses,
        sekemType: threshold.sekemType,
        sekemWeights: threshold.sekemWeights,
        gap, pct, passed,
      };
    })
    .filter(Boolean);

  const passing      = rows.filter((r) => r.passed).sort((a, b) => b.gap - a.gap);
  const almostThere  = rows.filter((r) => !r.passed && r.gap >= -30).sort((a, b) => b.gap - a.gap);
  const dontQualify  = rows.filter((r) => !r.passed && r.gap < -30).sort((a, b) => b.gap - a.gap);

  if (!rows.length) {
    return (
      <div className="recommendations-empty">
        <p>📋 Add departments to your watchlist to see recommendations.</p>
      </div>
    );
  }

  return (
    <div className="recommendations-page">

      {almostThere.length > 0 && (
        <section className="recommendations-section">
          <h3 className="recommendations-section__title">🎯 Almost There</h3>
          <p className="recommendations-section__hint">You&apos;re just below the threshold — a small boost could get you in.</p>
          <div className="rec-list">
            {almostThere.map((r) => (
              <RecommendationCard key={r.departmentId} row={r} academicScores={academicScores} />
            ))}
          </div>
        </section>
      )}

      {dontQualify.length > 0 && (
        <section className="recommendations-section">
          <h3 className="recommendations-section__title">❌ Don&apos;t Qualify</h3>
          <p className="recommendations-section__hint">You&apos;re significantly below the threshold. Here&apos;s what you&apos;d need to improve.</p>
          <div className="rec-list">
            {dontQualify.map((r) => (
              <RecommendationCard key={r.departmentId} row={r} academicScores={academicScores} showImprovement />
            ))}
          </div>
        </section>
      )}

      {passing.length > 0 && (
        <section className="recommendations-section">
          <h3 className="recommendations-section__title">✅ You Qualify</h3>
          <p className="recommendations-section__hint">Your Sekem meets or exceeds the minimum — sorted by how comfortably you pass.</p>
          <div className="rec-list">
            {passing.map((r) => (
              <RecommendationCard key={r.departmentId} row={r} academicScores={academicScores} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Check if user qualifies for a bonus condition based on their bagrut scores
function qualifiesForBonus(condition, bagrutScores) {
  if (!bagrutScores || !condition) return false;
  const c = condition.toLowerCase();

  // Pattern: "X-unit SubjectName" e.g. "5-unit english", "4-unit mathematics"
  const unitMatch = c.match(/(\d+)-unit\s+(.+)/);
  if (unitMatch) {
    const requiredUnits = parseInt(unitMatch[1]);
    const subjectName = unitMatch[2].trim();
    const SUBJECT_MAP = {
      english: 'english', math: 'mathematics', mathematics: 'mathematics',
      physics: 'physics', 'computer science': 'computerScience', cs: 'computerScience',
      biology: 'biology', chemistry: 'chemistry', arabic: 'arabic',
      history: 'history', literature: 'literature', civics: 'civics',
    };
    const key = SUBJECT_MAP[subjectName] || subjectName;
    const subject = bagrutScores[key];
    return subject && subject.units >= requiredUnits;
  }
  return false;
}

function calcEffectiveMin(threshold, bagrutScores) {
  const bonuses = threshold.sekemBonuses || [];
  const totalBonus = bonuses.reduce((sum, b) => {
    return sum + (qualifiesForBonus(b.condition, bagrutScores) ? b.points : 0);
  }, 0);
  return { effectiveMin: threshold.minSekem - totalBonus, totalBonus, bonuses };
}

function computeImprovement(row, academicScores) {
  if (!academicScores || !row.sekemWeights) return null;
  const needed = row.effectiveMin - row.userSekem;
  const bw = row.sekemWeights.bagrutWeight ?? 0.5;
  const pw = row.sekemWeights.psychometricWeight ?? 0.5;
  const bagrutScores = academicScores.bagrutScores || {};
  const psycho = academicScores.psychometricScores || {};

  // Bonus opportunities — bonuses the user doesn't yet qualify for
  const missedBonuses = (row.bonuses || []).filter(
    (b) => !qualifiesForBonus(b.condition, bagrutScores)
  );

  // Weakest psychometric section
  const weakestPsycho = Object.entries(psycho)
    .sort(([, a], [, b]) => a - b)[0];

  // Weakest bagrut subjects (fallback if no bonus conditions)
  const weakest = Object.entries(bagrutScores)
    .sort(([, a], [, b]) => a.grade - b.grade)
    .slice(0, 2)
    .map(([subj, val]) => ({ subj, grade: val.grade }));

  return { needed: needed.toFixed(1), bw, pw, missedBonuses, weakestPsycho, weakest };
}

function RecommendationCard({ row, academicScores, showImprovement }) {
  const barPct = Math.min(row.pct * 100, 100);
  const gap = row.gap;
  const gapLabel = gap >= 0 ? `+${gap.toFixed(1)} above min` : `${Math.abs(gap).toFixed(1)} pts below min`;
  const improvement = showImprovement ? computeImprovement(row, academicScores) : null;

  const SUBJECT_LABELS = {
    bibleStudies:'Bible Studies', literature:'Literature', hebrewExpression:'Hebrew Expression',
    history:'History', civics:'Civics', mathematics:'Mathematics', english:'English',
    computerScience:'Computer Science', physics:'Physics', psychology:'Psychology',
    arabic:'Arabic', biology:'Biology', chemistry:'Chemistry', art:'Art', music:'Music',
    verbal:'Verbal', quantitative:'Quantitative',
  };

  return (
    <div className={`rec-card${row.passed ? ' rec-card--pass' : row.gap >= -30 ? ' rec-card--fail' : ' rec-card--fail'}`}>
      <div className="rec-card__header">
        <div className="rec-card__info">
          <span className="rec-card__name">{row.majorName}</span>
          <span className="rec-card__sub">{row.university} · {row.faculty}</span>
        </div>
        <div className="rec-card__scores">
          <span className="rec-card__sekem">{row.userSekem.toFixed(0)}</span>
          <span className="rec-card__min">
            / {row.effectiveMin} min
            {row.totalBonus > 0 && (
              <span className="rec-card__bonus" title={row.bonuses.map(b => `${b.condition}: −${b.points}`).join(', ')}>
                {' '}(−{row.totalBonus} bonus ✓)
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="rec-card__bar-wrap">
        <div className="rec-card__bar-track">
          <div
            className={`rec-card__bar-fill ${row.passed ? 'rec-card__bar-fill--pass' : row.gap >= -30 ? 'rec-card__bar-fill--fail' : 'rec-card__bar-fill--fail'}`}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <span className={`rec-card__gap ${row.passed ? 'rec-card__gap--pass' : row.gap >= -30 ? 'rec-card__gap--fail' : 'rec-card__gap--fail'}`}>
          {gapLabel}
        </span>
      </div>

      {improvement && (
        <div className="rec-improvement">
          <p className="rec-improvement__title">To qualify you need <strong>{improvement.needed}</strong> more Sekem points:</p>
          <div className="rec-improvement__options">
            {improvement.missedBonuses.length > 0 && (
              <div className="rec-improvement__option">
                <span className="rec-improvement__icon">🎁</span>
                <div>
                  <strong>Unlock Bonus Points</strong>
                  {improvement.missedBonuses.map((b) => (
                    <p key={b.condition} className="rec-improvement__bonus-row">
                      <span className="rec-improvement__dot">•</span>
                      <span>Meet <em>{b.condition}</em> — <span className="rec-improvement__pts">+{b.points} pts</span></span>
                    </p>
                  ))}
                </div>
              </div>
            )}
            {improvement.missedBonuses.length === 0 && improvement.weakest.length > 0 && (
              <div className="rec-improvement__option">
                <span className="rec-improvement__icon">📚</span>
                <div>
                  <strong>Improve Bagrut</strong>
                  <p>Your weakest subjects: <em>{improvement.weakest.map(w => `${SUBJECT_LABELS[w.subj] || w.subj} (${w.grade})`).join(', ')}</em>.</p>
                  <p className="rec-improvement__hint">Bagrut contributes {(improvement.bw * 100).toFixed(0)}% of your Sekem.</p>
                </div>
              </div>
            )}
            {improvement.weakestPsycho && (
              <div className="rec-improvement__option">
                <span className="rec-improvement__icon">🧠</span>
                <div>
                  <strong>Improve Psychometric</strong>
                  <p>Your weakest section is <em>{SUBJECT_LABELS[improvement.weakestPsycho[0]] || improvement.weakestPsycho[0]} ({improvement.weakestPsycho[1]})</em>.</p>
                  <p className="rec-improvement__hint">Psychometric contributes {(improvement.pw * 100).toFixed(0)}% of your Sekem.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rec-card__type">{row.sekemType}</div>
    </div>
  );
}