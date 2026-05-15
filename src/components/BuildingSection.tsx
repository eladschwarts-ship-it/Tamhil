import { useState } from 'react';
import type { BuildingResult, PlacementStrategy } from '../types';

interface Props {
  result: BuildingResult;
  strategy: PlacementStrategy;
  onStrategyChange: (s: PlacementStrategy) => void;
}

const PLACEMENT_STRATEGIES: { id: PlacementStrategy; label: string }[] = [
  { id: 'uniform', label: 'חלוקה אחידה' },
  { id: 'large-top', label: 'גדולות למעלה' },
  { id: 'small-bottom', label: 'קטנות למטה' },
  { id: 'large-bottom', label: 'גדולות למטה' },
];

export function BuildingSection({ result, strategy, onStrategyChange }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const floors = [...result.floors].reverse();
  const maxNetArea = Math.max(...result.floors.map(f => f.grossArea), 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PLACEMENT_STRATEGIES.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => onStrategyChange(s.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              strategy === s.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {result.numFloors > 12 && (
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="text-xs text-blue-500 hover:text-blue-700 text-right"
        >
          {collapsed ? `הצג את כל ${result.numFloors} הקומות` : 'כווץ תצוגה'}
        </button>
      )}

      <div className="overflow-x-auto">
        <div className="flex flex-col gap-0.5 min-w-[340px]">
          {floors
            .filter((_, i) => !collapsed || i < 5 || i >= floors.length - 2)
            .map((floor, displayIdx) => {
              if (collapsed && displayIdx === 5) {
                return (
                  <div key="ellipsis" className="flex items-center gap-2 px-2 py-1 text-xs text-slate-400">
                    <span className="flex-1 border-t border-dashed border-slate-200" />
                    <span>... {result.numFloors - 7} קומות נוספות ...</span>
                    <span className="flex-1 border-t border-dashed border-slate-200" />
                  </div>
                );
              }
              return (
                <FloorRow
                  key={floor.floorIndex}
                  floor={floor}
                  maxArea={maxNetArea}
                />
              );
            })}
        </div>
      </div>
    </div>
  );
}

function FloorRow({ floor, maxArea }: { floor: import('../types').FloorResult; maxArea: number }) {
  const isSpecial = floor.isGround || floor.isRoof;
  const totalWidth = 380;
  const lobbyWidth = Math.max(24, Math.round((floor.lobbyArea / maxArea) * totalWidth * 0.15));
  const aptWidth = totalWidth - lobbyWidth - 4;

  return (
    <div className={`flex items-center gap-1 ${isSpecial ? 'opacity-95' : ''}`}>
      <div
        className={`text-xs font-medium shrink-0 text-right w-16 ${
          isSpecial ? 'text-blue-700 font-bold' : 'text-slate-500'
        }`}
      >
        {floor.label}
      </div>

      <div
        className="bg-slate-100 border border-slate-300 rounded-sm flex items-center justify-center shrink-0"
        style={{ width: lobbyWidth, height: 36 }}
        title={`מבואה: ${floor.lobbyArea.toFixed(0)} מ"ר`}
      >
        <span className="text-[9px] text-slate-400 rotate-0">מב</span>
      </div>

      <div className="flex gap-0.5 overflow-hidden" style={{ width: aptWidth }}>
        {floor.apartments.length === 0 ? (
          <div className="flex-1 bg-slate-50 border border-dashed border-slate-200 rounded-sm" style={{ height: 36 }} />
        ) : (
          floor.apartments.map((apt, i) => {
            const totalAptArea = floor.apartments.reduce((s, a) => s + a.area, 0) || 1;
            const w = Math.max(28, Math.round((apt.area / totalAptArea) * aptWidth) - 1);
            return (
              <div
                key={i}
                className="rounded-sm flex flex-col items-center justify-center shrink-0 border"
                style={{
                  width: w,
                  height: 36,
                  background: apt.color + '28',
                  borderColor: apt.color + '80',
                }}
                title={`${apt.typeLabel} — ${apt.area.toFixed(0)} מ"ר`}
              >
                <span className="text-[9px] font-bold leading-tight" style={{ color: apt.color }}>
                  {apt.area.toFixed(0)}
                </span>
                <span className="text-[8px] leading-tight opacity-70" style={{ color: apt.color }}>
                  מ"ר
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="text-[10px] text-slate-400 shrink-0 w-12 text-left">
        {(floor.netArea + floor.lobbyArea).toFixed(0)} מ"ר
      </div>
    </div>
  );
}
