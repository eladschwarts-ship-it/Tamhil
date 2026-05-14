import { useState, useMemo, useCallback } from 'react';
import type { BuildingInputs, PlacementStrategy, MixStrategy } from './types';
import { optimize } from './optimizer';
import { NumberInput } from './components/NumberInput';
import { TypeMixEditor } from './components/TypeMixEditor';
import { ResultsPanel } from './components/ResultsPanel';
import './index.css';

const DEFAULT_INPUTS: BuildingInputs = {
  projectName: 'פרויקט חדש',
  totalApartments: null,
  numFloors: 8,
  apartmentsPerFloor: null,
  groundFloorApartments: null,
  roofApartments: null,
  plotArea: null,
  floorFootprint: 600,
  totalBuildingArea: null,
  lobbyAreaMode: 'fixed',
  lobbyArea: 20,
  lobbyKey: null,
  types: [
    { id: 'small', label: 'קטנה', minArea: 35, maxArea: 55, percentage: 30, color: '#3b82f6' },
    { id: 'medium', label: 'בינונית', minArea: 60, maxArea: 85, percentage: 50, color: '#10b981' },
    { id: 'large', label: 'גדולה', minArea: 90, maxArea: 130, percentage: 20, color: '#f59e0b' },
  ],
  mixStrategy: null,
  placementStrategy: 'uniform',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
      <h2 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 m-0">{title}</h2>
      {children}
    </div>
  );
}

function formatDate(d: Date) {
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  const [inputs, setInputs] = useState<BuildingInputs>(DEFAULT_INPUTS);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const update = useCallback(<K extends keyof BuildingInputs>(key: K, value: BuildingInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
    setLastUpdated(new Date());
  }, []);

  const result = useMemo(() => optimize(inputs), [inputs]);

  const totalPct = inputs.types.reduce((s, t) => s + t.percentage, 0);
  const pctOk = inputs.types.length === 0 || Math.abs(totalPct - 100) < 0.5;

  const netFloorInfo = inputs.floorFootprint && inputs.lobbyAreaMode === 'fixed' && inputs.lobbyArea
    ? inputs.floorFootprint - inputs.lobbyArea
    : null;

  return (
    <div style={{ minHeight: '100svh', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-slate-400 font-medium">שם הפרויקט</label>
              <input
                className="text-2xl font-bold text-slate-800 bg-transparent border-b-2 border-transparent hover:border-slate-200 focus:border-blue-400 outline-none transition-colors"
                value={inputs.projectName}
                onChange={e => update('projectName', e.target.value)}
                placeholder="שם הפרויקט"
              />
            </div>
            <div className="text-xs text-slate-400 text-left shrink-0">
              <div>עדכון אחרון</div>
              <div className="font-medium text-slate-500">{formatDate(lastUpdated)}</div>
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-2">הגדר את הנתונים הידועים — המערכת תחשב את השאר אוטומטית</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">

          <div className="flex flex-col gap-4">

            <Section title="נתוני בניין">
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="מספר קומות" value={inputs.numFloors} onChange={v => update('numFloors', v)} min={1} max={50} />
                <NumberInput label="דירות בקומה" value={inputs.apartmentsPerFloor} onChange={v => update('apartmentsPerFloor', v)} min={1} max={20} placeholder="אוטומטי" />
                <NumberInput label="דירות קומת קרקע" value={inputs.groundFloorApartments} onChange={v => update('groundFloorApartments', v)} min={0} max={20} placeholder="כמו קומה רגילה" />
                <NumberInput label="דירות גג" value={inputs.roofApartments} onChange={v => update('roofApartments', v)} min={0} max={20} placeholder="כמו קומה רגילה" />
                <div className="col-span-2">
                  <NumberInput label='סה״כ דירות' value={inputs.totalApartments} onChange={v => update('totalApartments', v)} min={1} placeholder="אוטומטי" />
                </div>
              </div>
            </Section>

            <Section title='שטחים'>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label='שטח מגרש (מ"ר)' value={inputs.plotArea} onChange={v => update('plotArea', v)} unit='מ"ר' min={0} placeholder="אופציונלי" />
                <NumberInput label='שטח קומה ברוטו (מ"ר)' value={inputs.floorFootprint} onChange={v => update('floorFootprint', v)} unit='מ"ר' min={50} />
                <div className="col-span-2">
                  <NumberInput label='שטח בנייה כולל (מ"ר)' value={inputs.totalBuildingArea} onChange={v => update('totalBuildingArea', v)} unit='מ"ר' min={0} placeholder="אוטומטי" />
                </div>
              </div>
            </Section>

            <Section title='שטח מבואה לקומה'>
              <div className="flex gap-2 mb-1">
                {(['fixed', 'key'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => update('lobbyAreaMode', mode)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      inputs.lobbyAreaMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mode === 'fixed' ? 'שטח קבוע' : 'מפתח ליח"ד'}
                  </button>
                ))}
              </div>
              {inputs.lobbyAreaMode === 'fixed' ? (
                <NumberInput label='שטח מבואה (מ"ר)' value={inputs.lobbyArea} onChange={v => update('lobbyArea', v)} unit='מ"ר' min={0} />
              ) : (
                <div className="flex flex-col gap-2">
                  <NumberInput
                    label='מפתח מבואה (מ"ר ליח"ד)'
                    value={inputs.lobbyKey}
                    onChange={v => update('lobbyKey', v)}
                    unit='מ"ר'
                    min={0}
                    placeholder="אוטומטי לפי קומות"
                  />
                  <p className="text-xs text-slate-400">
                    ברירת מחדל לפי מספר קומות: עד 3 = 8, עד 6 = 12, עד 12 = 16, עד 20 = 20, מעל 20 = 25 מ"ר ליח"ד
                  </p>
                </div>
              )}
              {netFloorInfo !== null && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm text-blue-700">
                  שטח נטו לדירות: <strong>{netFloorInfo.toFixed(0)} מ"ר</strong>
                </div>
              )}
            </Section>

            <Section title="תמהיל סוגי דירות">
              <TypeMixEditor
                types={inputs.types}
                mixStrategy={inputs.mixStrategy}
                onChange={types => update('types', types)}
                onStrategyChange={(s: MixStrategy) => update('mixStrategy', s)}
              />
              {inputs.types.length > 0 && !pctOk && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600 flex items-center gap-2">
                  <span>⚠</span>
                  <span>סכום האחוזים צריך להיות 100% (כרגע: {totalPct.toFixed(0)}%)</span>
                </div>
              )}
            </Section>

            <div className="bg-slate-100 rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed">
              <strong className="text-slate-600">אסטרטגיית חישוב:</strong> שימוש בנקודת האמצע של כל טווח. חלוקת יתרה לפי שבר מירבי. נתונים חסרים נגזרים מהנתונים הקיימים.
            </div>
          </div>

          <div>
            <Section title="תוצאות ותמהיל מיטבי">
              <ResultsPanel
                result={result}
                placementStrategy={inputs.placementStrategy}
                onPlacementStrategyChange={(s: PlacementStrategy) => update('placementStrategy', s)}
              />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
