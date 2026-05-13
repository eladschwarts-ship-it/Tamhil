import { useState, useMemo } from 'react';
import type { BuildingInputs } from './types';
import { optimize } from './optimizer';
import { NumberInput } from './components/NumberInput';
import { TypeMixEditor } from './components/TypeMixEditor';
import { ResultsPanel } from './components/ResultsPanel';
import './index.css';

const DEFAULT_INPUTS: BuildingInputs = {
  totalApartments: null,
  numFloors: 8,
  apartmentsPerFloor: null,
  floorFootprint: 600,
  lobbyArea: 20,
  types: [
    { id: 'small', label: 'קטנה', minArea: 35, maxArea: 55, percentage: 30, color: '#3b82f6' },
    { id: 'medium', label: 'בינונית', minArea: 60, maxArea: 85, percentage: 50, color: '#10b981' },
    { id: 'large', label: 'גדולה', minArea: 90, maxArea: 130, percentage: 20, color: '#f59e0b' },
  ],
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
      <h2 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 m-0">{title}</h2>
      {children}
    </div>
  );
}

export default function App() {
  const [inputs, setInputs] = useState<BuildingInputs>(DEFAULT_INPUTS);

  function set<K extends keyof BuildingInputs>(key: K, value: BuildingInputs[K]) {
    setInputs(prev => ({ ...prev, [key]: value }));
  }

  const result = useMemo(() => optimize(inputs), [inputs]);

  const totalPct = inputs.types.reduce((s, t) => s + t.percentage, 0);
  const pctOk = Math.abs(totalPct - 100) < 0.5;

  return (
    <div style={{ minHeight: '100svh', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>תכנון תמהיל יח"ד</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            הגדר את הנתונים הידועים — המערכת תחשב את השאר אוטומטית
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">

          {/* LEFT: Inputs */}
          <div className="flex flex-col gap-4">

            <Section title="נתוני בניין">
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  label="מספר קומות"
                  value={inputs.numFloors}
                  onChange={v => set('numFloors', v)}
                  min={1}
                  max={50}
                />
                <NumberInput
                  label="דירות בקומה"
                  value={inputs.apartmentsPerFloor}
                  onChange={v => set('apartmentsPerFloor', v)}
                  min={1}
                  max={20}
                  placeholder="אוטומטי"
                />
                <div className="col-span-2">
                  <NumberInput
                    label="סה״כ דירות"
                    value={inputs.totalApartments}
                    onChange={v => set('totalApartments', v)}
                    min={1}
                    placeholder="אוטומטי"
                  />
                </div>
              </div>
            </Section>

            <Section title='שטח תכסית קומה'>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  label='שטח קומה ברוטו (מ"ר)'
                  value={inputs.floorFootprint}
                  onChange={v => set('floorFootprint', v)}
                  unit='מ"ר'
                  min={50}
                />
                <NumberInput
                  label='שטח מבואה (מ"ר)'
                  value={inputs.lobbyArea}
                  onChange={v => set('lobbyArea', v)}
                  unit='מ"ר'
                  min={0}
                />
              </div>
              {inputs.floorFootprint !== null && inputs.lobbyArea !== null && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm text-blue-700">
                  שטח נטו לדירות: <strong>{(inputs.floorFootprint - inputs.lobbyArea).toFixed(0)} מ"ר</strong>
                </div>
              )}
            </Section>

            <Section title="תמהיל סוגי דירות">
              <TypeMixEditor
                types={inputs.types}
                onChange={types => set('types', types)}
              />
              {!pctOk && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600 flex items-center gap-2">
                  <span>⚠</span>
                  <span>סכום האחוזים צריך להיות 100% (כרגע: {totalPct.toFixed(0)}%)</span>
                </div>
              )}
            </Section>

            <div className="bg-slate-100 rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed">
              <strong className="text-slate-600">אסטרטגיית חישוב:</strong> המערכת משתמשת בנקודת האמצע של טווח כל סוג דירה כשטח ממוצע, ומחלקת את כלל הדירות לפי האחוזים שהוגדרו. נתונים חסרים מחושבים אוטומטית מהנתונים הקיימים.
            </div>
          </div>

          {/* RIGHT: Results */}
          <div>
            <Section title="תוצאות ותמהיל מיטבי">
              <ResultsPanel result={result} />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
