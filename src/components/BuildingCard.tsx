import { useState } from 'react';
import type { BuildingDef, ApartmentType, MixStrategy, PlacementStrategy } from '../types';
import { NumberInput } from './NumberInput';
import { TypeMixEditor } from './TypeMixEditor';

interface Props {
  building: BuildingDef;
  onChange: (b: BuildingDef) => void;
  onDelete: () => void;
  globalTypes: ApartmentType[];
  globalMixStrategy: MixStrategy | null;
}

export function BuildingCard({ building, onChange, onDelete, globalTypes, globalMixStrategy: _globalMixStrategy }: Props) {
  const [open, setOpen] = useState(true);

  function set<K extends keyof BuildingDef>(key: K, value: BuildingDef[K]) {
    onChange({ ...building, [key]: value });
  }

  const lobbyKeyHint = `אוטומטי לפי קומות: עד 3=8, עד 6=12, עד 12=16, עד 20=20, מעל 20=25 מ"ר`;

  const netArea = building.lobbyAreaMode === 'fixed' && building.floorFootprint && building.lobbyArea !== null
    ? building.floorFootprint - building.lobbyArea
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
        <button type="button" onClick={() => setOpen(o => !o)} className="text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none shrink-0">
          {open ? '▾' : '▸'}
        </button>
        <input
          className="flex-1 font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-400 outline-none text-sm"
          value={building.name}
          onChange={e => set('name', e.target.value)}
        />
        <button type="button" onClick={onDelete} className="text-slate-300 hover:text-red-400 transition-colors text-sm shrink-0">מחק</button>
      </div>

      {open && (
        <div className="p-4 flex flex-col gap-4">

          {/* Floors */}
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="מספר קומות" value={building.numFloors} onChange={v => set('numFloors', v)} min={1} max={50} />
            <NumberInput label="דירות בקומה" value={building.apartmentsPerFloor} onChange={v => set('apartmentsPerFloor', v)} min={1} max={20} placeholder="אוטומטי" />
            <NumberInput label="דירות קומת קרקע" value={building.groundFloorApartments} onChange={v => set('groundFloorApartments', v)} min={0} max={30} placeholder="כמו קומה רגילה" />
            <NumberInput label="דירות גג" value={building.roofApartments} onChange={v => set('roofApartments', v)} min={0} max={30} placeholder="כמו קומה רגילה" />
          </div>

          {/* Floor footprint */}
          <div>
            <NumberInput label='שטח תכסית קומה (מ"ר)' value={building.floorFootprint} onChange={v => set('floorFootprint', v)} unit='מ"ר' min={50} placeholder="לא הוגדר" />
          </div>

          {/* Lobby */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {(['fixed', 'key'] as const).map(mode => (
                <button key={mode} type="button" onClick={() => set('lobbyAreaMode', mode)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${building.lobbyAreaMode === mode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {mode === 'fixed' ? 'מבואה קבוע' : 'מפתח ליח"ד'}
                </button>
              ))}
            </div>
            {building.lobbyAreaMode === 'fixed' ? (
              <NumberInput label='שטח מבואה (מ"ר)' value={building.lobbyArea} onChange={v => set('lobbyArea', v)} unit='מ"ר' min={0} />
            ) : (
              <div className="flex flex-col gap-1">
                <NumberInput label='מפתח מבואה (מ"ר ליח"ד)' value={building.lobbyKey} onChange={v => set('lobbyKey', v)} unit='מ"ר' min={0} placeholder="אוטומטי" />
                <p className="text-xs text-slate-400">{lobbyKeyHint}</p>
              </div>
            )}
            {netArea !== null && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 text-xs text-blue-700">
                שטח נטו: <strong>{netArea.toFixed(0)} מ"ר</strong>
              </div>
            )}
          </div>

          {/* Mix */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">תמהיל</span>
              <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={building.useProjectMix}
                  onChange={e => set('useProjectMix', e.target.checked)}
                  className="rounded"
                />
                לפי תמהיל פרויקט
              </label>
            </div>
            {!building.useProjectMix && (
              <TypeMixEditor
                types={building.types}
                mixStrategy={building.mixStrategy}
                onChange={types => set('types', types)}
                onStrategyChange={(s: MixStrategy) => set('mixStrategy', s)}
              />
            )}
            {building.useProjectMix && globalTypes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {globalTypes.map(t => (
                  <span key={t.id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: t.color + '20', color: t.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                    {t.label} {t.percentage}%
                  </span>
                ))}
              </div>
            )}
            {building.useProjectMix && globalTypes.length === 0 && (
              <p className="text-xs text-slate-400">לא הוגדר תמהיל כללי — יחושב לפי אסטרטגיית הפרויקט</p>
            )}

            {/* Placement strategy (only if not using project mix) */}
            {!building.useProjectMix && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">מיקום דירות בחתך</span>
                <div className="flex flex-wrap gap-1">
                  {(['uniform', 'large-top', 'small-bottom', 'large-bottom'] as PlacementStrategy[]).map(s => (
                    <button key={s} type="button" onClick={() => set('placementStrategy', s)}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${building.placementStrategy === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {{ uniform: 'אחיד', 'large-top': 'גדולות למעלה', 'small-bottom': 'קטנות למטה', 'large-bottom': 'גדולות למטה' }[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
