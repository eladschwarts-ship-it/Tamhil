import type { ApartmentType, MixStrategy } from '../types';

const COLOR_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#84cc16', '#6366f1',
];

interface Props {
  types: ApartmentType[];
  mixStrategy: MixStrategy | null;
  onChange: (types: ApartmentType[]) => void;
  onStrategyChange: (s: MixStrategy) => void;
}

const STRATEGIES: { id: MixStrategy; label: string; desc: string }[] = [
  { id: 'equal', label: 'חלוקה שווה', desc: '33% / 34% / 33%' },
  { id: 'maximize-large', label: 'מקסום דירות גדולות', desc: '10% / 20% / 70%' },
  { id: 'maximize-small', label: 'מקסום דירות קטנות', desc: '60% / 30% / 10%' },
];

export function TypeMixEditor({ types, mixStrategy, onChange, onStrategyChange }: Props) {
  const totalPct = types.reduce((s, t) => s + t.percentage, 0);
  const pctOk = types.length === 0 || Math.abs(totalPct - 100) < 0.5;

  function update(id: string, field: keyof ApartmentType, raw: string | number) {
    const num = typeof raw === 'string' ? (raw === '' ? 0 : Number(raw)) : raw;
    onChange(types.map(t => t.id === id ? { ...t, [field]: num } : t));
  }

  function addType() {
    const usedColors = new Set(types.map(t => t.color));
    const color = COLOR_PALETTE.find(c => !usedColors.has(c)) ?? COLOR_PALETTE[types.length % COLOR_PALETTE.length];
    const newType: ApartmentType = {
      id: `type-${Date.now()}`,
      label: `סוג ${types.length + 1}`,
      minArea: 40,
      maxArea: 80,
      percentage: 0,
      color,
    };
    onChange([...types, newType]);
  }

  function removeType(id: string) {
    onChange(types.filter(t => t.id !== id));
  }

  function updateLabel(id: string, label: string) {
    onChange(types.map(t => t.id === id ? { ...t, label } : t));
  }

  if (types.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-slate-500">לא הוגדר תמהיל — בחר אסטרטגיה אוטומטית:</p>
        <div className="flex flex-col gap-2">
          {STRATEGIES.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => onStrategyChange(s.id)}
              className={`text-right px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                mixStrategy === s.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold">{s.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={addType}
          className="mt-1 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          <span>הוסף סוג דירה</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">סוגי דירות</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pctOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          סה"כ: {totalPct.toFixed(0)}%
        </span>
      </div>

      {types.map(t => (
        <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
            <input
              className="flex-1 font-medium text-slate-700 text-sm border-b border-transparent hover:border-slate-200 focus:border-blue-400 outline-none bg-transparent"
              value={t.label}
              onChange={e => updateLabel(t.id, e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeType(t.id)}
              className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
            >×</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['minArea', 'maxArea'] as const).map(field => (
              <div key={field} className="flex flex-col gap-0.5">
                <label className="text-xs text-slate-400">{field === 'minArea' ? 'מינ\' (מ"ר)' : 'מקס\' (מ"ר)'}</label>
                <input
                  type="number"
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-full outline-none focus:border-blue-400 text-center"
                  value={t[field]}
                  min={1}
                  onChange={e => update(t.id, field, e.target.value)}
                />
              </div>
            ))}
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-slate-400">אחוז</label>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:border-blue-400">
                <input
                  type="number"
                  className="flex-1 px-2 py-1.5 text-sm outline-none text-center min-w-0"
                  value={t.percentage}
                  min={0} max={100}
                  onChange={e => update(t.id, 'percentage', e.target.value)}
                />
                <span className="text-xs text-slate-400 px-1">%</span>
              </div>
            </div>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(t.percentage, 100)}%`, background: t.color }} />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addType}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors py-1"
      >
        <span className="text-lg leading-none">+</span>
        <span>הוסף סוג דירה</span>
      </button>
    </div>
  );
}
