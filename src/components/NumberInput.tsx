interface Props {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  derived?: boolean;
}

export function NumberInput({ label, value, onChange, unit, min = 0, max, step = 1, placeholder, derived }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-600">{label}</label>
      <div className={`flex items-center border rounded-lg overflow-hidden transition-colors ${derived ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-300 focus-within:border-blue-500'}`}>
        <input
          type="number"
          className="flex-1 px-3 py-2 text-sm outline-none bg-transparent text-slate-800 min-w-0"
          value={value ?? ''}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder ?? (derived ? 'מחושב אוטומטית' : '—')}
          onChange={e => {
            const v = e.target.value === '' ? null : Number(e.target.value);
            onChange(v);
          }}
        />
        {unit && <span className="px-2 text-xs text-slate-400 shrink-0">{unit}</span>}
      </div>
      {derived && <p className="text-xs text-blue-500">מחושב אוטומטית</p>}
    </div>
  );
}
