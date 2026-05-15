import { useState, useMemo, useCallback, useRef } from 'react';
import type { BuildingInputs, BuildingDef, PlacementStrategy, MixStrategy, RemainderStrategy } from './types';
import { optimizeProject } from './optimizer';
import { NumberInput } from './components/NumberInput';
import { TypeMixEditor } from './components/TypeMixEditor';
import { BuildingCard } from './components/BuildingCard';
import { ProjectResults } from './components/ProjectResults';
import './index.css';

function newBuilding(n: number): BuildingDef {
  return {
    id: `building-${Date.now()}-${n}`,
    name: `בניין ${n}`,
    numFloors: 8,
    apartmentsPerFloor: null,
    groundFloorApartments: null,
    roofApartments: null,
    floorFootprint: 600,
    lobbyAreaMode: 'fixed',
    lobbyArea: 20,
    lobbyKey: null,
    useProjectMix: true,
    types: [],
    mixStrategy: null,
    remainderStrategy: null,
    placementStrategy: 'uniform',
  };
}

const DEFAULT_INPUTS: BuildingInputs = {
  projectName: 'פרויקט חדש',
  totalApartments: null,
  plotArea: null,
  totalAreaMode: 'manual',
  totalBuildingArea: null,
  avgAreaTarget: null,
  plotPct: null,
  types: [
    { id: 'small', label: 'קטנה', minArea: 35, maxArea: 55, percentage: 30, color: '#3b82f6' },
    { id: 'medium', label: 'בינונית', minArea: 60, maxArea: 85, percentage: 50, color: '#10b981' },
    { id: 'large', label: 'גדולה', minArea: 90, maxArea: 130, percentage: 20, color: '#f59e0b' },
  ],
  mixStrategy: null,
  remainderStrategy: null,
  placementStrategy: 'uniform',
  buildings: [newBuilding(1)],
};

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="font-bold text-slate-800 text-base m-0">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function formatDate(d: Date) {
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  const [pending, setPending] = useState<BuildingInputs>(DEFAULT_INPUTS);
  const [committed, setCommitted] = useState<BuildingInputs>(DEFAULT_INPUTS);
  const [isDirty, setIsDirty] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const buildingCountRef = useRef(1);

  const result = useMemo(() => optimizeProject(committed), [committed]);

  const update = useCallback(<K extends keyof BuildingInputs>(key: K, value: BuildingInputs[K]) => {
    setPending(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  function handleRefresh() {
    setCommitted(pending);
    setIsDirty(false);
    setLastUpdated(new Date());
  }

  function addBuilding() {
    buildingCountRef.current += 1;
    const b = newBuilding(buildingCountRef.current);
    update('buildings', [...pending.buildings, b]);
  }

  function updateBuilding(id: string, updated: BuildingDef) {
    update('buildings', pending.buildings.map(b => b.id === id ? updated : b));
  }

  function deleteBuilding(id: string) {
    if (pending.buildings.length <= 1) return;
    update('buildings', pending.buildings.filter(b => b.id !== id));
  }

  const totalPct = pending.types.reduce((s, t) => s + t.percentage, 0);
  const pctOk = pending.types.length === 0 || Math.abs(totalPct - 100) < 0.5;

  // Derived total building area based on mode
  const derivedTotalArea = useMemo(() => {
    if (pending.totalAreaMode === 'by-avg-area' && pending.avgAreaTarget && pending.totalApartments) {
      return pending.avgAreaTarget * pending.totalApartments;
    }
    if (pending.totalAreaMode === 'by-plot-pct' && pending.plotArea && pending.plotPct) {
      return pending.plotArea * (pending.plotPct / 100);
    }
    return pending.totalBuildingArea;
  }, [pending]);

  return (
    <div style={{ minHeight: '100svh', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-slate-400 font-medium">שם הפרויקט</label>
              <input
                className="text-2xl font-bold text-slate-800 bg-transparent border-b-2 border-transparent hover:border-slate-200 focus:border-blue-400 outline-none transition-colors"
                value={pending.projectName}
                onChange={e => update('projectName', e.target.value)}
                placeholder="שם הפרויקט"
              />
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="text-xs text-slate-400 text-left">
                <div>עדכון אחרון</div>
                <div className="font-medium text-slate-500">{formatDate(lastUpdated)}</div>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all ${
                  isDirty
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200'
                    : 'bg-slate-100 text-slate-400 cursor-default'
                }`}
              >
                {isDirty ? '⟳ חשב מחדש' : '✓ מעודכן'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">

          {/* LEFT */}
          <div className="flex flex-col gap-4">

            {/* Project totals */}
            <Section title="נתוני פרויקט">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <NumberInput label='סה"כ יח"ד יעד' value={pending.totalApartments} onChange={v => update('totalApartments', v)} min={1} placeholder="אוטומטי" />
                </div>
                <NumberInput label='שטח מגרש (מ"ר)' value={pending.plotArea} onChange={v => update('plotArea', v)} unit='מ"ר' min={0} placeholder="אופציונלי" />
              </div>

              {/* Total building area mode */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-600">שטח בנייה כולל</label>
                <div className="flex gap-2 flex-wrap">
                  {([['manual', 'ידני'], ['by-avg-area', 'לפי שטח ממוצע'], ['by-plot-pct', 'לפי % מגרש']] as const).map(([mode, label]) => (
                    <button key={mode} type="button" onClick={() => update('totalAreaMode', mode)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${pending.totalAreaMode === mode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                {pending.totalAreaMode === 'manual' && (
                  <NumberInput label='שטח בנייה כולל (מ"ר)' value={pending.totalBuildingArea} onChange={v => update('totalBuildingArea', v)} unit='מ"ר' min={0} placeholder="אוטומטי" />
                )}
                {pending.totalAreaMode === 'by-avg-area' && (
                  <div className="grid grid-cols-2 gap-3">
                    <NumberInput label='שטח ממוצע ליח"ד (מ"ר)' value={pending.avgAreaTarget} onChange={v => update('avgAreaTarget', v)} unit='מ"ר' min={20} />
                    {derivedTotalArea !== null && (
                      <div className="flex flex-col gap-0.5 justify-end">
                        <p className="text-xs text-slate-400">שטח בנייה מחושב</p>
                        <p className="text-sm font-bold text-blue-700">{derivedTotalArea.toFixed(0)} מ"ר</p>
                      </div>
                    )}
                  </div>
                )}
                {pending.totalAreaMode === 'by-plot-pct' && (
                  <div className="grid grid-cols-2 gap-3">
                    <NumberInput label='אחוז משטח מגרש (%)' value={pending.plotPct} onChange={v => update('plotPct', v)} unit='%' min={1} max={1000} />
                    {derivedTotalArea !== null && (
                      <div className="flex flex-col gap-0.5 justify-end">
                        <p className="text-xs text-slate-400">שטח בנייה מחושב</p>
                        <p className="text-sm font-bold text-blue-700">{derivedTotalArea.toFixed(0)} מ"ר</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Section>

            {/* Global type mix */}
            <Section title='תמהיל יח"ד'>
              <TypeMixEditor
                types={pending.types}
                mixStrategy={pending.mixStrategy}
                remainderStrategy={pending.remainderStrategy}
                onChange={types => update('types', types)}
                onStrategyChange={(s: MixStrategy) => update('mixStrategy', s)}
                onRemainderStrategyChange={(s: RemainderStrategy) => update('remainderStrategy', s)}
              />
              {pending.types.length > 0 && !pctOk && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600 flex items-center gap-2">
                  <span>⚠</span>
                  <span>סכום האחוזים: {totalPct.toFixed(0)}% — נדרש 100%</span>
                </div>
              )}
            </Section>

            {/* Buildings */}
            <Section
              title="בניינים"
              action={
                <button type="button" onClick={addBuilding}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                  <span className="text-lg leading-none">+</span> הוסף בניין
                </button>
              }
            >
              {pending.buildings.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">לא הוגדרו בניינים — לחץ "הוסף בניין"</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {pending.buildings.map(b => (
                    <BuildingCard
                      key={b.id}
                      building={b}
                      onChange={updated => updateBuilding(b.id, updated)}
                      onDelete={() => deleteBuilding(b.id)}
                      globalTypes={pending.types}
                      globalMixStrategy={pending.mixStrategy}
                    />
                  ))}
                </div>
              )}
            </Section>

            <div className="bg-slate-100 rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed">
              <strong className="text-slate-600">אסטרטגיית חישוב:</strong> נקודת אמצע של טווח שטח לכל סוג. חלוקה לפי שבר מירבי (largest remainder). נתונים חסרים נגזרים מהנתונים הקיימים.
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-4">
            {isDirty && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-amber-700">יש שינויים שטרם חושבו</span>
                <button type="button" onClick={handleRefresh}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  חשב מחדש
                </button>
              </div>
            )}
            <Section title="תוצאות ואדריכל הפרויקט">
              <ProjectResults
                result={result}
                placementStrategy={committed.placementStrategy}
                onPlacementStrategyChange={(s: PlacementStrategy) => {
                  update('placementStrategy', s);
                  setCommitted(prev => ({ ...prev, placementStrategy: s }));
                }}
              />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
