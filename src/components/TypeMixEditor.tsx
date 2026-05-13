import type { ApartmentType } from '../types';

interface Props {
  types: ApartmentType[];
  onChange: (types: ApartmentType[]) => void;
}

export function TypeMixEditor({ types, onChange }: Props) {
  const totalPct = types.reduce((s, t) => s + t.percentage, 0);
  const pctOk = Math.abs(totalPct - 100) < 0.5;

  function update(id: string, field: keyof ApartmentType, raw: string) {
    const num = raw === '' ? 0 : Number(raw);
    onChange(types.map(t => t.id === id ? { ...t, [field]: num } : t));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">סוגי דירות</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pctOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          סה"כ: {totalPct.toFixed(0)}%
        </span>
      </div>

      <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-x-2 gap-y-1 items-center text-xs text-slate-500 px-1">
        <span></span>
        <span className="text-center">מינ' (מ"ר)</span>
        <span className="text-center">מקס' (מ"ר)</span>
        <span className="text-center">אחוז</span>
        <span></span>
      </div>

      {types.map(t => (
        <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
            <span className="font-medium text-slate-700 text-sm">{t.label}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-slate-400">מינימום (מ"ר)</label>
              <input
                type="number"
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-full outline-none focus:border-blue-400 text-center"
                value={t.minArea}
                min={1}
                onChange={e => update(t.id, 'minArea', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-slate-400">מקסימום (מ"ר)</label>
              <input
                type="number"
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-full outline-none focus:border-blue-400 text-center"
                value={t.maxArea}
                min={1}
                onChange={e => update(t.id, 'maxArea', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-slate-400">אחוז מהסך</label>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:border-blue-400">
                <input
                  type="number"
                  className="flex-1 px-2 py-1.5 text-sm outline-none text-center min-w-0"
                  value={t.percentage}
                  min={0}
                  max={100}
                  onChange={e => update(t.id, 'percentage', e.target.value)}
                />
                <span className="text-xs text-slate-400 px-1">%</span>
              </div>
            </div>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(t.percentage, 100)}%`, background: t.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
