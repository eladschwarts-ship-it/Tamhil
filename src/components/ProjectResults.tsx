import { useState } from 'react';
import type { ProjectResult, PlacementStrategy } from '../types';
import { BuildingSection } from './BuildingSection';

interface Props {
  result: ProjectResult;
  placementStrategy: PlacementStrategy;
  onPlacementStrategyChange: (s: PlacementStrategy) => void;
}

const SEV_STYLE = {
  error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '✕' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '⚠' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'ℹ' },
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export function ProjectResults({ result, placementStrategy, onPlacementStrategyChange }: Props) {
  const [openBuilding, setOpenBuilding] = useState<string | null>(
    result.buildingResults.length === 1 ? result.buildingResults[0].buildingId : null
  );

  const errors = result.issues.filter(i => i.severity === 'error');
  const warnings = result.issues.filter(i => i.severity === 'warning');
  const infos = result.issues.filter(i => i.severity === 'info');

  const hasBlockingErrors = errors.length > 0;

  return (
    <div className="flex flex-col gap-6">

      {/* Architect validation */}
      {result.issues.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-5 h-5 bg-slate-800 text-white rounded-full text-xs flex items-center justify-center">א</span>
            ביקורת אדריכל
          </h3>
          {[...errors, ...warnings, ...infos].map((issue, i) => {
            const s = SEV_STYLE[issue.severity];
            return (
              <div key={i} className={`${s.bg} border ${s.border} rounded-xl px-4 py-3 flex flex-col gap-1`}>
                <div className={`flex items-center gap-2 font-medium text-sm ${s.text}`}>
                  <span>{s.icon}</span>
                  <span>{issue.title}</span>
                  {issue.buildingId && <span className="text-xs opacity-70">({issue.buildingId})</span>}
                </div>
                <p className={`text-xs ${s.text} opacity-90`}>{issue.message}</p>
                <p className={`text-xs ${s.text} opacity-70`}><strong>המלצה:</strong> {issue.suggestion}</p>
              </div>
            );
          })}
        </div>
      )}

      {hasBlockingErrors && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-center">
          <p className="text-red-700 font-semibold">יש שגיאות קריטיות — ודא תיקון לפני ניתוח מלא</p>
        </div>
      )}

      {/* Project summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label='סה"כ יח"ד בפרויקט' value={result.totalApartments.toString()} />
        <StatCard label='סה"כ בניינים' value={result.buildingResults.length.toString()} />
        <StatCard label='שטח ממוצע ליח"ד' value={`${result.avgAreaPerApartment.toFixed(1)} מ"ר`} />
        <StatCard label='סה"כ שטח נטו' value={`${result.totalNetArea.toFixed(0)} מ"ר`} />
        <StatCard label='סה"כ שטח בנייה' value={`${result.totalBuildingArea.toFixed(0)} מ"ר`} />
        {result.plotArea !== null && <StatCard label='שטח מגרש' value={`${result.plotArea.toFixed(0)} מ"ר`} />}
        {result.far !== null && <StatCard label='מקדם ניצול (FAR)' value={result.far.toFixed(2)} />}
        {result.buildingCoverageRatio !== null && <StatCard label='תכסית' value={`${(result.buildingCoverageRatio * 100).toFixed(1)}%`} />}
      </div>

      {/* Type mix */}
      {result.types.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-slate-700">התפלגות תמהיל כוללת</h3>
          <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
            {result.types.filter(t => t.count > 0).map(t => (
              <div key={t.id} className="h-full transition-all" style={{ flex: t.count, background: t.color }}
                title={`${t.label}: ${t.count} דירות (${t.percentage.toFixed(1)}%)`} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-0 rounded-xl border border-slate-200 overflow-hidden text-sm">
            {result.types.map((t, i) => (
              <div key={t.id} className={`flex items-center gap-3 px-3 py-2 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                <span className="flex-1 text-slate-700">{t.label}</span>
                <span className="text-slate-500">{t.minArea}–{t.maxArea} מ"ר</span>
                <span className="font-semibold text-slate-800 w-8 text-center">{t.count}</span>
                <span className="w-12 text-center" style={{ color: t.color }}>
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ background: t.color + '18' }}>
                    {t.percentage.toFixed(0)}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-building results */}
      <div className="flex flex-col gap-4">
        <h3 className="font-semibold text-slate-700">חתך בניינים</h3>
        <div className="flex flex-wrap gap-2 mb-1">
          {(['uniform', 'large-top', 'small-bottom', 'large-bottom'] as PlacementStrategy[]).map(s => (
            <button key={s} type="button" onClick={() => onPlacementStrategyChange(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${placementStrategy === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {{ uniform: 'חלוקה אחידה', 'large-top': 'גדולות למעלה', 'small-bottom': 'קטנות למטה', 'large-bottom': 'גדולות למטה' }[s]}
            </button>
          ))}
        </div>
        {result.buildingResults.map(br => (
          <div key={br.buildingId} className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenBuilding(o => o === br.buildingId ? null : br.buildingId)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700 text-sm">{br.buildingName}</span>
                <span className="text-xs text-slate-500">{br.numFloors} קומות · {br.totalApartments} יח"ד · {br.avgAreaPerApartment.toFixed(0)} מ"ר ממוצע</span>
              </div>
              <span className="text-slate-400 text-sm">{openBuilding === br.buildingId ? '▾' : '▸'}</span>
            </button>
            {openBuilding === br.buildingId && (
              <div className="p-4">
                {br.warnings.length > 0 && (
                  <div className="flex flex-col gap-1 mb-3">
                    {br.warnings.map((w, i) => (
                      <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-700 flex gap-2">
                        <span>⚠</span><span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
                <BuildingSection result={br} strategy={placementStrategy} onStrategyChange={onPlacementStrategyChange} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
