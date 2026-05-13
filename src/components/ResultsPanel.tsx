import type { BuildingResult } from '../types';

interface Props {
  result: BuildingResult;
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

export function ResultsPanel({ result }: Props) {
  const totalTypeArea = result.types.reduce((s, t) => s + t.totalArea, 0);

  return (
    <div className="flex flex-col gap-6">

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {result.warnings.map((w, i) => (
            <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700 flex gap-2 items-start">
              <span className="shrink-0">⚠</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="סה״כ דירות" value={result.totalApartments.toString()} />
        <StatCard label="מספר קומות" value={result.numFloors.toString()} />
        <StatCard label="דירות בקומה" value={result.apartmentsPerFloor.toString()} />
        <StatCard
          label="שטח ממוצע לדירה"
          value={`${result.avgAreaPerApartment.toFixed(1)} מ"ר`}
        />
        <StatCard
          label="שטח תכסית קומה"
          value={`${result.floorFootprint.toFixed(0)} מ"ר`}
          sub={`מתוכם מבואה: ${result.lobbyArea.toFixed(0)} מ"ר`}
        />
        <StatCard
          label="שטח נטו לדירות / קומה"
          value={`${result.netFloorArea.toFixed(0)} מ"ר`}
          sub={`ניצולת: ${(result.utilizationRate * 100).toFixed(0)}%`}
        />
        <StatCard
          label='סה"כ שטח נטו'
          value={`${result.totalNetArea.toFixed(0)} מ"ר`}
        />
        <StatCard
          label='סה"כ שטח בניין'
          value={`${result.totalBuildingArea.toFixed(0)} מ"ר`}
        />
      </div>

      {/* Donut summary bar */}
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

      {/* Type breakdown table */}
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-slate-700">פירוט לפי סוג</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">סוג</th>
                <th className="text-center px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">טווח (מ"ר)</th>
                <th className="text-center px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">ממוצע (מ"ר)</th>
                <th className="text-center px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">מספר</th>
                <th className="text-center px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">אחוז</th>
                <th className="text-center px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">שטח כולל</th>
                <th className="text-right px-3 py-2.5 font-medium text-slate-600">מהנטו</th>
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
                  <td className="px-3 py-2.5 text-right text-slate-500 text-xs">
                    {totalTypeArea > 0 ? ((t.totalArea / totalTypeArea) * 100).toFixed(0) : 0}%
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-semibold border-t border-slate-200">
                <td className="px-3 py-2.5 text-slate-700">סה"כ</td>
                <td></td>
                <td className="px-3 py-2.5 text-center text-slate-700">{result.avgAreaPerApartment.toFixed(1)}</td>
                <td className="px-3 py-2.5 text-center text-slate-800">{result.totalApartments}</td>
                <td className="px-3 py-2.5 text-center text-slate-700">100%</td>
                <td className="px-3 py-2.5 text-center text-slate-700">{result.totalNetArea.toFixed(0)} מ"ר</td>
                <td className="px-3 py-2.5 text-right text-slate-700">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Floor layout visualization */}
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-slate-700">מבנה קומה (תרשים סכמטי)</h3>
        <FloorDiagram result={result} />
      </div>
    </div>
  );
}

function FloorDiagram({ result }: { result: BuildingResult }) {
  const apf = result.apartmentsPerFloor;
  const netArea = result.netFloorArea;

  // Create apartment list for one representative floor by distributing types
  const apts: { color: string; label: string; area: number }[] = [];
  let remaining = apf;
  const typeQueue = result.types
    .filter(t => t.count > 0)
    .flatMap(t => {
      const perFloor = Math.max(1, Math.round((t.count / result.totalApartments) * apf));
      return Array(perFloor).fill({ color: t.color, label: t.label, area: t.avgArea });
    });

  // fill up to apf
  for (let i = 0; i < apf && i < typeQueue.length; i++) {
    apts.push(typeQueue[i]);
    remaining--;
  }
  if (remaining > 0 && result.types[0]) {
    const t = result.types[0];
    for (let i = 0; i < remaining; i++) {
      apts.push({ color: t.color, label: t.label, area: t.avgArea });
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>קומה טיפוסית — {apf} דירות | {netArea.toFixed(0)} מ"ר נטו</span>
        <span>מבואה: {result.lobbyArea.toFixed(0)} מ"ר</span>
      </div>
      <div className="flex gap-1 items-end flex-wrap">
        {/* Lobby */}
        <div
          className="bg-slate-100 border-2 border-slate-300 rounded-md flex items-center justify-center text-xs text-slate-500 font-medium shrink-0"
          style={{ width: 48, height: 40 }}
        >
          מבואה
        </div>
        {/* Apartments */}
        {apts.map((a, i) => {
          const widthPx = clampPx(Math.round((a.area / netArea) * 400), 32, 100);
          return (
            <div
              key={i}
              className="rounded-md flex flex-col items-center justify-center text-xs font-medium border-2"
              style={{
                width: widthPx,
                height: 48,
                background: a.color + '25',
                borderColor: a.color,
                color: a.color,
              }}
              title={`${a.label} – ${a.area.toFixed(0)} מ"ר`}
            >
              <span>{a.area.toFixed(0)}</span>
              <span className="opacity-70 text-[10px]">מ"ר</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function clampPx(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}
