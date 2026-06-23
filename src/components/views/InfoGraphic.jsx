import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { academicScoresService } from '../../services/academicScoresService';

const C = {
  primary: '#1a3a6b',
  accent:  '#c9a84c',
  pass:    '#2f7d5d',
  fail:    '#b3402f',
  neutral: '#828c9b',
  blue2:   '#2f5d9e',
};

const STATUS_LABEL = {
  'passed-required-acceptance-score': 'Passed',
  'below-required-acceptance-score':  'Below Score',
  'failed-required-acceptance-score': 'Below Score',
  'no-threshold-data':               'No Data',
  'no-sekem-data':                   'No Sekem',
};
const STATUS_COLOR_MAP = { 'Passed': C.pass, 'Below Score': C.fail, 'No Data': C.neutral, 'No Sekem': C.neutral };

const SUBJECT_LABELS = {
  bibleStudies:'Bible', literature:'Literature', hebrewExpression:'Hebrew',
  history:'History', civics:'Civics', mathematics:'Math', english:'English',
  computerScience:'CS', physics:'Physics', psychology:'Psychology',
  arabic:'Arabic', biology:'Biology', chemistry:'Chemistry', art:'Art', music:'Music'
};

function Card({ title, wide, children }) {
  return (
    <div className={`infographic-card${wide ? ' infographic-card--wide' : ''}`}>
      <p className="infographic-section__title">{title}</p>
      {children}
    </div>
  );
}
function Empty({ msg = 'No data available.' }) {
  return <p className="infographic-empty">{msg}</p>;
}

/* ── Gauge ──────────────────────────────────────────────────────────────── */
function SingleGauge({ label, value, max }) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  // Semicircle: starts at 180deg (left), ends at 0deg (right)
  // needle angle: 180 at pct=0, 0 at pct=1
  const needleDeg = 180 - pct * 180;

  const cx = 100; const cy = 95; const r = 70;

  // Arc from left (180°) to angle, in SVG: x=cx+r*cos(a), y=cy-r*sin(a) — note minus because SVG y is flipped
  const arcX = (a) => cx + r * Math.cos((a * Math.PI) / 180);
  const arcY = (a) => cy - r * Math.sin((a * Math.PI) / 180);

  // Full background arc: 0° to 180°
  const bgStart = { x: arcX(0), y: arcY(0) };
  const bgEnd   = { x: arcX(180), y: arcY(180) };

  // Fill arc from 180° down to needleDeg
  const fillEnd = { x: arcX(needleDeg), y: arcY(needleDeg) };
  const fillLarge = (180 - needleDeg) > 180 ? 1 : 0;

  // Needle tip

  const fillColor = pct > 0.85 ? C.pass : pct > 0.55 ? C.accent : C.primary;

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <svg viewBox="0 0 200 120" style={{ width: '100%', maxWidth: 240, display: 'block', margin: '0 auto' }}>
        {/* Background track */}
        <path d={`M${bgStart.x},${bgStart.y} A${r},${r},0,0,0,${bgEnd.x},${bgEnd.y}`}
          fill="none" stroke="#e3e7ee" strokeWidth={14} strokeLinecap="round"/>
        {/* Filled arc */}
        <path
          d={`M${arcX(180)},${arcY(180)} A${r},${r},0,${fillLarge},1,${fillEnd.x},${fillEnd.y}`}
          fill="none" stroke={fillColor} strokeWidth={14} strokeLinecap="round"
          strokeDasharray={`${Math.PI * r}`}
          strokeDashoffset={`${Math.PI * r * (1 - pct)}`}
          style={{ animation: 'gaugeArcIn 1s cubic-bezier(.4,0,.2,1) both' }}
        />
        {/* Score */}
        <text x={cx} y={cy + 20} textAnchor="middle" fontSize={20} fontWeight={700} fill="#1c2530">{value.toFixed(0)}</text>
        {/* Scale */}
        <text x={22}  y={cy + 8} textAnchor="middle" fontSize={8} fill="#bbb">0</text>
        <text x={178} y={cy + 8} textAnchor="middle" fontSize={8} fill="#bbb">{max}</text>
      </svg>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: C.neutral, marginTop: 2 }}>{label}</p>
    </div>
  );
}

function SekemGauge({ watchlist, latestThreshold }) {
  const ALL_TYPES = ['quantitative', 'verbal', 'general'];
  const DEFAULT_VALUE = 0;
  const DEFAULT_MAX = 800;

  const byType = {};
  for (const w of watchlist) {
    if (!w.userSekem) continue;
    const t = latestThreshold(w.departmentId);
    const type = t?.sekemType ?? 'general';
    if (!byType[type]) byType[type] = { vals: [], maxMin: 0 };
    byType[type].vals.push(w.userSekem);
    if (t?.minSekem) byType[type].maxMin = Math.max(byType[type].maxMin, t.minSekem);
  }

  const TYPE_COLOR = { quantitative: C.primary, verbal: C.blue2, general: C.accent };

  return (
    <>
      {ALL_TYPES.map((type) => {
        const data = byType[type];
        const avg = data ? data.vals.reduce((s, v) => s + v, 0) / data.vals.length : DEFAULT_VALUE;
        const max = data ? Math.ceil(Math.max(data.maxMin, avg) / 100) * 100 : DEFAULT_MAX;
        const label = data ? `Avg ${data.vals.length} Dept${data.vals.length !== 1 ? 's' : ''}` : 'No Data';
        return (
          <Card key={type} title={`Sekem — ${type.charAt(0).toUpperCase() + type.slice(1)}`}>
            <SingleGauge
              label={label}
              value={avg}
              max={max}
              color={TYPE_COLOR[type] ?? C.neutral}
            />
          </Card>
        );
      })}
    </>
  );
}

/* ── Donut ──────────────────────────────────────────────────────────────── */
function StatusDonut({ watchlist }) {
  const counts = {};
  for (const w of watchlist) {
    const label = STATUS_LABEL[w.sekemStatus] ?? 'Unknown';
    counts[label] = (counts[label] || 0) + 1;
  }
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
  if (!data.length) return <Card title="Watchlist Status Breakdown"><Empty /></Card>;

  return (
    <Card title="Watchlist Status Breakdown">
      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie data={data} cx="50%" cy="45%" innerRadius={55} outerRadius={85}
            paddingAngle={3} dataKey="value"
            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
            labelLine={false}>
            {data.map(e => <Cell key={e.name} fill={STATUS_COLOR_MAP[e.name] ?? C.neutral} />)}
          </Pie>
          <Tooltip formatter={(v, n) => [`${v} dept${v !== 1 ? 's' : ''}`, n]} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* ── Radar ──────────────────────────────────────────────────────────────── */
function BagrutRadar({ userId }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let ok = true;
    academicScoresService.getByUser(userId)
      .then(res => {
        if (!ok) return;
        const scores = res[0]?.bagrutScores;
        if (scores) setData(Object.entries(scores).map(([k, v]) => ({ subject: SUBJECT_LABELS[k] || k, grade: v.grade })));
        else setData([]);
      }).catch(() => setData([]));
    return () => { ok = false; };
  }, [userId]);

  if (!data) return <Card title="Bagrut Grades Radar"><Empty msg="Loading…" /></Card>;
  if (!data.length) return <Card title="Bagrut Grades Radar"><Empty /></Card>;

  return (
    <Card title="Bagrut Grades Radar">
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#e3e7ee" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#5b6675' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#bbb' }} tickCount={4} />
          <Radar dataKey="grade" stroke={C.primary} fill={C.primary} fillOpacity={0.25} />
          <Tooltip formatter={v => [`${v}`, 'Grade']} />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* ── Sekem vs Min per dept ──────────────────────────────────────────────── */
function SekemComparisonBar({ watchlist, departmentName, latestThreshold }) {
  const data = watchlist
    .map(w => {
      const t = latestThreshold(w.departmentId);
      if (!w.userSekem || !t?.minSekem) return null;
      return {
        name: departmentName(w.departmentId),
        yours: parseFloat(w.userSekem.toFixed(1)),
        minimum: t.minSekem
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.minimum - a.minimum)
    .slice(0, 10);

  if (!data.length) return <Card title="Your Sekem vs Min Required" wide><Empty msg="No departments with both your Sekem and a threshold on record." /></Card>;

  return (
    <Card title="Your Sekem vs Minimum Required" wide>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 70 }} barCategoryGap="15%" barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ee" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#5b6675' }} angle={-35} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 11, fill: '#5b6675' }} domain={['auto', 'auto']} width={40} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} verticalAlign="top" align="right" />
          <Bar dataKey="yours" name="Your Sekem" fill={C.primary} radius={[4,4,0,0]} />
          <Bar dataKey="minimum" name="Min Required" fill={C.accent} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* ── Sekem by university ────────────────────────────────────────────────── */
function SekemByUniversity({ watchlist, universityName, departments, latestThreshold }) {
  const uniMap = {};
  for (const w of watchlist) {
    if (!w.userSekem) continue;
    const dept = departments.find(d => d.departmentId === w.departmentId);
    if (!dept) continue;
    const uni = universityName(dept.universityId);
    const t = latestThreshold(w.departmentId);
    if (!uniMap[uni]) uniMap[uni] = { total: 0, count: 0, minSum: 0, minCount: 0 };
    uniMap[uni].total += w.userSekem;
    uniMap[uni].count += 1;
    if (t?.minSekem) { uniMap[uni].minSum += t.minSekem; uniMap[uni].minCount += 1; }
  }
  const data = Object.entries(uniMap)
    .map(([name, v]) => ({
      name,
      avgSekem: parseFloat((v.total / v.count).toFixed(1)),
      minRequired: v.minCount ? parseFloat((v.minSum / v.minCount).toFixed(1)) : null
    }))
    .sort((a, b) => b.avgSekem - a.avgSekem);

  if (!data.length) return <Card title="Your Sekem by University" wide><Empty /></Card>;

  return (
    <Card title="Your Sekem by University" wide>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 70 }} barCategoryGap="15%" barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ee" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#5b6675' }} angle={-35} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 11, fill: '#5b6675' }} domain={['auto', 'auto']} width={40} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} verticalAlign="top" align="right" />
          <Bar dataKey="avgSekem" name="Your Avg Sekem" fill={C.blue2} radius={[4,4,0,0]} />
          <Bar dataKey="minRequired" name="Avg Min Required" fill={C.accent} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* ── Main ───────────────────────────────────────────────────────────────── */
/* ── Faculty Pie ────────────────────────────────────────────────────────── */
const FACULTY_COLORS = [
  C.primary, C.accent, C.pass, C.blue2, '#9b59b6', '#e07b39', '#16a085', '#8e44ad', '#d35400', '#27ae60'
];

function FacultyPie({ watchlist, departments }) {
  const counts = {};
  for (const w of watchlist) {
    const dept = departments.find(d => d.departmentId === w.departmentId);
    const faculty = dept?.faculty ?? 'Unknown';
    counts[faculty] = (counts[faculty] || 0) + 1;
  }
  const data = Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (!data.length) return <Card title="Watchlist by Faculty"><Empty /></Card>;

  return (
    <Card title="Watchlist by Faculty">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} cx="50%" cy="42%" outerRadius={70} paddingAngle={2} dataKey="value"
            label={({ name, percent }) => percent > 0.07 ? `${(percent * 100).toFixed(0)}%` : ''}
            labelLine={false}>
            {data.map((_, i) => <Cell key={i} fill={FACULTY_COLORS[i % FACULTY_COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v, n) => [`${v} dept${v !== 1 ? 's' : ''}`, n]} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default function InfoGraphic({ watchlist, departments, universityName, departmentName, latestThreshold, user }) {
  return (
    <div className="infographic-page">
      <div className="infographic-grid">
        <SekemGauge watchlist={watchlist} latestThreshold={latestThreshold} />
        <StatusDonut watchlist={watchlist} />
        <BagrutRadar userId={user.userId} />
        <FacultyPie watchlist={watchlist} departments={departments} />
        <SekemComparisonBar watchlist={watchlist} departmentName={departmentName} latestThreshold={latestThreshold} />
        <SekemByUniversity watchlist={watchlist} universityName={universityName} departments={departments} latestThreshold={latestThreshold} />
      </div>
    </div>
  );
}