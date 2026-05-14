import type { BuildingResult, PlacementStrategy } from '../types';
import { BuildingSection } from './BuildingSection';

interface Props {
  result: BuildingResult;
  placementStrategy: PlacementStrategy;
  onPlacementStrategyChange: (s: PlacementStrategy) => void;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export function ResultsPanel({ result, placementStrategy, onPlacementStrategyChange }: Props) {
  const totalTypeArea = result.types.reduce((s, t) => s + t.totalArea, 0);

  return (
    <div className="flex flex-col gap-6">

      {result.warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {result.warnings.map((w, i) => (
            <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700 flex gap-2 items-start">
              <span className="shrink-0">⚠</span><span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="סה״כ דירות" value={result.totalApartments.toString()} />
        <StatCard label="מספר קומות" value={result.numFloors.toString()} />
        <StatCard label="דירות בקומה" value={result.apartmentsPerFloor.toString()} />
        <StatCard label='שטח ממוצע ליח"ד' value={`${result.avgAreaPerApartment.toFixed(1)} מ"ר`} />
        <StatCard
          label='שטח תכסית קומה'
          value={`${result.floorFootprint.toFixed(0)} מ"ר`}
          sub={`מבואה: ${result.lobbyAreaPerFloor.toFixed(0)} מ"ר`}
        />
        <StatCard
          label='שטח נטו / קומה'
          value={`${result.netFloorArea.toFixed(0)} מ"ר`}
          sub={`ניצולת: ${(result.utilizationRate * 100).toFixed(0)}%`}
        />
        <StatCard label='סה"כ שטח נטו' value={`${result.totalNetArea.toFixed(0)} מ"ר`} />
        <StatCard label='סה"כ שטח בניין' value={`${result.totalBuildingArea.toFixed(0)} מ"ר`} />
        {result.buildingCoverageRatio !== null && (
          <StatCard label='תכסית' value={`${(result.buildingCoverageRatio * 100).toFixed(1)}%`} />
        )}
        {result.far !== null && (
          <StatCard label='מקדם ניצול (FAR)' value={result.far.toFixed(2)} />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-slate-700">התפלגות תמהיל</h3>
        <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
          {result.types.filter(t => t.count > 0).map(t => (
            <div
              key={t.id}
              className="h-full transition-all"
              style={{ flex: t.count, background: t.color }}
              title={`${t.label}: ${t.count} דירות (${t.percentage.toFixed(1)}%)`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {result.types.map(t => (
            <div key={t.id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: t.color }} />
              <span className="text-slate-600">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-slate-700">פירוט לפי סוג</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right px-3 py-2.5 font-medium text-slate-600">סוג</th>
                <th className="text-center px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">טווח (מ"ר)</th>
                <th className="text-center px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">ממוצע</th>
                <th className="text-center px-3 py-2.5 font-medium text-slate-600">מספר</th>
                <th className="text-center px-3 py-2.5 font-medium text-slate-600">אחוז</th>
                <th className="text-center px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">שטח כולל</th>
              </tr>
            </thead>
            <tbody>
              {result.types.map((t, i) => (
                <tr key={t.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                      <span className="font-medium text-slate-700">{t.label}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-slate-600">{t.minArea}–{t.maxArea}</td>
                  <td className="px-3 py-2.5 text-center text-slate-600">{t.avgArea.toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-center font-semibold text-slate-800">{t.count}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: t.color + '20', color: t.color }}>
                      {t.percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-slate-600">{t.totalArea.toFixed(0)} מ"ר</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-semibold border-t border-slate-200">
                <td className="px-3 py-2.5 text-slate-700">סה"כ</td>
                <td />
                <td className="px-3 py-2.5 text-center text-slate-700">{result.avgAreaPerApartment.toFixed(1)}</td>
                <td className="px-3 py-2.5 text-center text-slate-800">{result.totalApartments}</td>
                <td className="px-3 py-2.5 text-center text-slate-700">100%</td>
                <td className="px-3 py-2.5 text-center text-slate-700">{totalTypeArea.toFixed(0)} מ"ר</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-slate-700">חתך בניין סכמטי</h3>
        <BuildingSection
          result={result}
          strategy={placementStrategy}
          onStrategyChange={onPlacementStrategyChange}
        />
      </div>
    </div>
  );
}
