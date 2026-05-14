import type {
  BuildingInputs, BuildingResult, ApartmentTypeResult,
  FloorResult, FloorApartment, ApartmentType, BuildingDef,
  ProjectResult
} from './types';

function midpoint(min: number, max: number) { return (min + max) / 2; }

function getPredefinedLobbyKey(numFloors: number): number {
  if (numFloors <= 3) return 8;
  if (numFloors <= 6) return 12;
  if (numFloors <= 12) return 16;
  if (numFloors <= 20) return 20;
  return 25;
}

const DEFAULT_STRATEGY_TYPES: Record<string, ApartmentType[]> = {
  equal: [
    { id: 'small', label: 'קטנה', minArea: 35, maxArea: 55, percentage: 33, color: '#3b82f6' },
    { id: 'medium', label: 'בינונית', minArea: 60, maxArea: 85, percentage: 34, color: '#10b981' },
    { id: 'large', label: 'גדולה', minArea: 90, maxArea: 130, percentage: 33, color: '#f59e0b' },
  ],
  'maximize-large': [
    { id: 'small', label: 'קטנה', minArea: 35, maxArea: 55, percentage: 10, color: '#3b82f6' },
    { id: 'medium', label: 'בינונית', minArea: 60, maxArea: 85, percentage: 20, color: '#10b981' },
    { id: 'large', label: 'גדולה', minArea: 90, maxArea: 130, percentage: 70, color: '#f59e0b' },
  ],
  'maximize-small': [
    { id: 'small', label: 'קטנה', minArea: 35, maxArea: 55, percentage: 60, color: '#3b82f6' },
    { id: 'medium', label: 'בינונית', minArea: 60, maxArea: 85, percentage: 30, color: '#10b981' },
    { id: 'large', label: 'גדולה', minArea: 90, maxArea: 130, percentage: 10, color: '#f59e0b' },
  ],
};

function distributeToFloors(
  types: ApartmentTypeResult[],
  floorCapacities: number[],
  strategy: string
): FloorApartment[][] {
  const all: FloorApartment[] = [];
  for (const t of types) {
    for (let i = 0; i < t.count; i++) {
      all.push({ typeId: t.id, typeLabel: t.label, area: t.avgArea, color: t.color });
    }
  }

  if (all.length === 0) {
    return floorCapacities.map(() => []);
  }

  if (strategy === 'uniform') {
    const total = all.length;
    const interleaved: FloorApartment[] = [];
    const errors = types.map(() => 0);
    const remaining = types.map(t => t.count);
    for (let step = 0; step < total; step++) {
      for (let j = 0; j < types.length; j++) errors[j] += types[j].count;
      let best = -1, bestErr = -Infinity;
      for (let j = 0; j < types.length; j++) {
        if (remaining[j] > 0 && errors[j] > bestErr) { bestErr = errors[j]; best = j; }
      }
      if (best === -1) break;
      const t = types[best];
      interleaved.push({ typeId: t.id, typeLabel: t.label, area: t.avgArea, color: t.color });
      errors[best] -= total;
      remaining[best]--;
    }
    const result: FloorApartment[][] = [];
    let idx = 0;
    for (const cap of floorCapacities) { result.push(interleaved.slice(idx, idx + cap)); idx += cap; }
    return result;
  }

  if (strategy === 'large-top' || strategy === 'small-bottom') {
    all.sort((a, b) => a.area - b.area);
  } else if (strategy === 'large-bottom') {
    all.sort((a, b) => b.area - a.area);
  }

  const result: FloorApartment[][] = [];
  let idx = 0;
  for (const cap of floorCapacities) { result.push(all.slice(idx, idx + cap)); idx += cap; }
  return result;
}

function distributeByPercentage(types: ApartmentType[], N: number): number[] {
  const rawCounts = types.map(t => (t.percentage / 100) * N);
  const flooredCounts = rawCounts.map(c => Math.floor(c));
  const remainder = N - flooredCounts.reduce((s, c) => s + c, 0);
  const fractionals = rawCounts.map((c, i) => ({ i, frac: c - flooredCounts[i] }));
  fractionals.sort((a, b) => b.frac - a.frac);
  const counts = [...flooredCounts];
  for (let k = 0; k < remainder; k++) counts[fractionals[k].i]++;
  return counts;
}

export function optimizeBuilding(
  bDef: BuildingDef,
  globalTypes: ApartmentType[],
  globalMixStrategy: string | null,
  globalPlacementStrategy: string
): BuildingResult {
  const warnings: string[] = [];

  const effectiveTypes = bDef.useProjectMix
    ? (globalTypes.length > 0 ? globalTypes : DEFAULT_STRATEGY_TYPES[globalMixStrategy ?? 'equal'])
    : (bDef.types.length > 0 ? bDef.types : DEFAULT_STRATEGY_TYPES[bDef.mixStrategy ?? globalMixStrategy ?? 'equal']);

  const placementStrategy = bDef.useProjectMix ? globalPlacementStrategy : bDef.placementStrategy;

  const weightedAvgArea = effectiveTypes.reduce(
    (s, t) => s + midpoint(t.minArea, t.maxArea) * (t.percentage / 100), 0
  ) || 70;

  let N: number | null = null;
  let F: number | null = bDef.numFloors;
  let APF: number | null = bDef.apartmentsPerFloor;

  const floorFootprint = bDef.floorFootprint ?? null;
  let lobbyPerFloor: number;
  if (bDef.lobbyAreaMode === 'fixed') {
    lobbyPerFloor = bDef.lobbyArea ?? 20;
  } else {
    const key = bDef.lobbyKey ?? getPredefinedLobbyKey(F ?? 8);
    lobbyPerFloor = key * (APF ?? 4);
  }
  const netFloorArea = floorFootprint ? floorFootprint - lobbyPerFloor : null;

  if (F !== null && APF !== null) { N = F * APF; }
  else if (F !== null && APF === null && netFloorArea !== null) {
    APF = Math.max(1, Math.round(netFloorArea / weightedAvgArea));
    N = F * APF;
  } else if (F === null && APF !== null && netFloorArea !== null) {
    F = Math.max(1, Math.round(netFloorArea / (APF * weightedAvgArea) * 10));
    N = F * APF;
  } else {
    F = F ?? 8; APF = APF ?? 4; N = F * APF;
    warnings.push('חלק מהנתונים הוגדרו לברירת מחדל');
  }

  if (bDef.lobbyAreaMode === 'key') {
    const key = bDef.lobbyKey ?? getPredefinedLobbyKey(F);
    lobbyPerFloor = key * APF;
  }

  const resolvedNetFloor = floorFootprint ? floorFootprint - lobbyPerFloor : weightedAvgArea * APF;
  const resolvedFootprint = floorFootprint ?? (resolvedNetFloor + lobbyPerFloor);
  const groundApts = bDef.groundFloorApartments ?? APF;
  const roofApts = F >= 2 ? (bDef.roofApartments ?? APF) : groundApts;

  const counts = distributeByPercentage(effectiveTypes, N);
  const typeResults: ApartmentTypeResult[] = effectiveTypes.map((t, i) => {
    const count = counts[i];
    const avgArea = midpoint(t.minArea, t.maxArea);
    return { id: t.id, label: t.label, count, percentage: N! > 0 ? (count / N!) * 100 : 0, avgArea, minArea: t.minArea, maxArea: t.maxArea, totalArea: count * avgArea, color: t.color };
  });

  const totalNetArea = typeResults.reduce((s, t) => s + t.totalArea, 0);
  const avgAreaPerApartment = N > 0 ? totalNetArea / N : 0;
  const totalBuildingArea = resolvedFootprint * F;
  const utilizationRate = totalBuildingArea > 0 ? totalNetArea / totalBuildingArea : 0;

  const floorCapacities: number[] = [];
  for (let i = 0; i < F; i++) {
    if (i === 0) floorCapacities.push(groundApts);
    else if (i === F - 1 && F > 1) floorCapacities.push(roofApts);
    else floorCapacities.push(APF);
  }

  const floorAssignments = distributeToFloors(typeResults, floorCapacities, placementStrategy);
  const floorResults: FloorResult[] = [];
  for (let i = 0; i < F; i++) {
    const isGround = i === 0;
    const isRoof = i === F - 1 && F > 1;
    const label = isGround ? 'ק. קרקע' : isRoof ? 'גג' : `קומה ${i}`;
    const apts = floorAssignments[i] ?? [];
    floorResults.push({ floorIndex: i, label, apartments: apts, grossArea: resolvedFootprint, netArea: apts.reduce((s, a) => s + a.area, 0), lobbyArea: lobbyPerFloor, isGround, isRoof });
  }

  if (resolvedNetFloor > 0 && APF > 0 && avgAreaPerApartment * APF > resolvedNetFloor * 1.1) {
    warnings.push(`שטח נטו לקומה (${resolvedNetFloor.toFixed(0)} מ"ר) קטן מהנדרש (${(avgAreaPerApartment * APF).toFixed(0)} מ"ר)`);
  }

  return {
    buildingId: bDef.id, buildingName: bDef.name,
    totalApartments: N, numFloors: F, apartmentsPerFloor: APF,
    groundFloorApartments: groundApts, roofApartments: roofApts,
    plotArea: null, floorFootprint: resolvedFootprint,
    totalBuildingArea, totalNetArea, avgAreaPerApartment,
    lobbyAreaPerFloor: lobbyPerFloor, netFloorArea: resolvedNetFloor,
    utilizationRate, buildingCoverageRatio: null, far: null,
    types: typeResults, floors: floorResults, warnings,
  };
}

export function optimizeProject(inputs: BuildingInputs): ProjectResult {
  const buildingResults = inputs.buildings.map(b =>
    optimizeBuilding(b, inputs.types, inputs.mixStrategy, inputs.placementStrategy)
  );

  const totalApartments = buildingResults.reduce((s, r) => s + r.totalApartments, 0);
  const totalBuildingArea = buildingResults.reduce((s, r) => s + r.totalBuildingArea, 0);
  const totalNetArea = buildingResults.reduce((s, r) => s + r.totalNetArea, 0);
  const avgAreaPerApartment = totalApartments > 0 ? totalNetArea / totalApartments : 0;

  const plotArea = inputs.plotArea ?? null;
  const far = plotArea && plotArea > 0 ? totalBuildingArea / plotArea : null;
  const maxFootprint = Math.max(...buildingResults.map(r => r.floorFootprint), 0);
  const buildingCoverageRatio = plotArea && plotArea > 0 ? maxFootprint / plotArea : null;

  // Aggregate types across buildings
  const typeMap = new Map<string, ApartmentTypeResult>();
  for (const br of buildingResults) {
    for (const t of br.types) {
      const existing = typeMap.get(t.id);
      if (existing) {
        typeMap.set(t.id, { ...existing, count: existing.count + t.count, totalArea: existing.totalArea + t.totalArea });
      } else {
        typeMap.set(t.id, { ...t });
      }
    }
  }
  const aggregatedTypes = Array.from(typeMap.values()).map(t => ({
    ...t,
    percentage: totalApartments > 0 ? (t.count / totalApartments) * 100 : 0,
    avgArea: t.count > 0 ? t.totalArea / t.count : 0,
  }));

  const issues = validateProject(inputs, buildingResults, { totalApartments, totalBuildingArea, totalNetArea, avgAreaPerApartment, plotArea, far });

  return { buildingResults, totalApartments, totalBuildingArea, totalNetArea, avgAreaPerApartment, plotArea, far, buildingCoverageRatio, types: aggregatedTypes, issues };
}

// Legacy single-building optimize (keeps backward compatibility if needed)
export function optimize(inputs: BuildingInputs): BuildingResult {
  if (inputs.buildings.length > 0) {
    return optimizeBuilding(inputs.buildings[0], inputs.types, inputs.mixStrategy, inputs.placementStrategy);
  }
  // fallback
  return optimizeBuilding({
    id: 'default', name: 'בניין 1',
    numFloors: null, apartmentsPerFloor: null,
    groundFloorApartments: null, roofApartments: null,
    floorFootprint: null, lobbyAreaMode: 'fixed', lobbyArea: 20, lobbyKey: null,
    useProjectMix: true, types: [], mixStrategy: null, placementStrategy: 'uniform',
  }, inputs.types, inputs.mixStrategy, inputs.placementStrategy);
}

// ─── Architect Validator ────────────────────────────────────────────────────

interface AggregatedStats {
  totalApartments: number;
  totalBuildingArea: number;
  totalNetArea: number;
  avgAreaPerApartment: number;
  plotArea: number | null;
  far: number | null;
}

function validateProject(
  inputs: BuildingInputs,
  results: BuildingResult[],
  stats: AggregatedStats
): import('./types').ValidationIssue[] {
  const issues: import('./types').ValidationIssue[] = [];

  function add(severity: 'error' | 'warning' | 'info', code: string, title: string, message: string, suggestion: string, buildingId?: string) {
    issues.push({ severity, code, title, message, suggestion, buildingId });
  }

  // 1. No buildings
  if (inputs.buildings.length === 0) {
    add('error', 'NO_BUILDINGS', 'אין בניינים', 'לא הוגדר אף בניין לפרויקט.', 'לחץ "הוסף בניין" כדי להגדיר לפחות בניין אחד.');
    return issues;
  }

  // 2. Project mix percentage sum
  if (inputs.types.length > 0) {
    const pct = inputs.types.reduce((s, t) => s + t.percentage, 0);
    if (Math.abs(pct - 100) > 0.5) {
      add('error', 'MIX_PCT_SUM', 'סכום אחוזי תמהיל שגוי', `סכום האחוזים בתמהיל הפרויקט הוא ${pct.toFixed(1)}% במקום 100%.`, 'ודא שסכום האחוזים בתמהיל שווה בדיוק ל-100%.');
    }
  }

  // 3. Type range validity
  for (const t of inputs.types) {
    if (t.minArea >= t.maxArea) {
      add('error', 'TYPE_RANGE', `טווח שגוי: ${t.label}`, `בסוג "${t.label}" השטח המינימלי (${t.minArea}) גדול מהמקסימלי (${t.maxArea}).`, 'ודא שהשטח המינימלי קטן מהשטח המקסימלי.');
    }
    if (t.minArea < 10) {
      add('warning', 'TYPE_SMALL_AREA', `שטח קטן מאוד: ${t.label}`, `שטח מינימלי ${t.minArea} מ"ר לסוג "${t.label}" קטן מאוד.`, 'שטח דירה בישראל מינימלי הוא ~25 מ"ר. בדוק את הנתונים.');
    }
  }

  // 4. Per-building validation
  for (const bDef of inputs.buildings) {
    const result = results.find(r => r.buildingId === bDef.id);
    if (!result) continue;

    const bid = bDef.id;
    const bName = bDef.name;

    // Missing floor data
    if (!bDef.numFloors && !bDef.apartmentsPerFloor) {
      add('warning', 'BUILDING_NO_FLOORS', `${bName}: נתוני קומות חסרים`, 'לא הוגדרו מספר קומות ולא מספר דירות בקומה.', 'הגדר לפחות אחד מהנתונים: מספר קומות, דירות בקומה, או שטח תכסית.', bid);
    }

    // Floor footprint not set
    if (!bDef.floorFootprint) {
      add('info', 'BUILDING_NO_FOOTPRINT', `${bName}: שטח תכסית לא הוגדר`, 'שטח תכסית קומה לא הוגדר — חישובי שטח עלולים להיות לא מדויקים.', 'הגדר שטח תכסית קומה לחישוב מדויק של שטחי הבניין.', bid);
    }

    // Check if apartments fit in floor area
    if (bDef.floorFootprint && result.netFloorArea > 0 && result.apartmentsPerFloor > 0) {
      const needed = result.avgAreaPerApartment * result.apartmentsPerFloor;
      const available = result.netFloorArea;
      if (needed > available * 1.05) {
        add('error', 'FLOOR_OVERFLOW', `${bName}: דירות לא מחמציות בקומה`, `שטח הדירות לקומה (${needed.toFixed(0)} מ"ר) עולה על שטח הנטו הזמין (${available.toFixed(0)} מ"ר).`, `הקטן את מספר הדירות בקומה, הגדל את שטח התכסית, או הקטן את השטח הממוצע ליח"ד.`, bid);
      }
    }

    // Building-specific mix validation
    if (!bDef.useProjectMix && bDef.types.length > 0) {
      const pct = bDef.types.reduce((s, t) => s + t.percentage, 0);
      if (Math.abs(pct - 100) > 0.5) {
        add('error', 'BUILDING_MIX_PCT', `${bName}: סכום אחוזי תמהיל שגוי`, `סכום האחוזים בתמהיל ${bName} הוא ${pct.toFixed(1)}% במקום 100%.`, 'ודא שסכום האחוזים בתמהיל הספציפי לבניין שווה ל-100%.', bid);
      }
    }

    // Very few floors
    if (result.numFloors < 2) {
      add('info', 'SINGLE_FLOOR', `${bName}: בניין חד-קומתי`, 'הבניין הוגדר עם קומה אחת בלבד.', 'אם זו טעות, עדכן את מספר הקומות.', bid);
    }
  }

  // 5. Project total apartments vs. target
  if (inputs.totalApartments !== null) {
    const actualTotal = stats.totalApartments;
    const diff = Math.abs(actualTotal - inputs.totalApartments);
    if (diff > inputs.totalApartments * 0.05 && diff > 2) {
      add('warning', 'TOTAL_MISMATCH', 'סטייה ביעד יח"ד', `יעד הפרויקט: ${inputs.totalApartments} יח"ד, אך הבניינים מכילים ${actualTotal} יח"ד (הפרש: ${diff}).`, 'עדכן את מספר הקומות, דירות בקומה, או יעד הפרויקט לשמירת עקביות.');
    }
  }

  // 6. FAR check
  if (stats.far !== null) {
    if (stats.far > 10) {
      add('error', 'FAR_VERY_HIGH', 'מקדם ניצול גבוה מאוד', `מקדם הניצול (FAR) הוא ${stats.far.toFixed(1)} — גבוה מאוד.`, 'ודא שנתוני שטח המגרש ושטח הבנייה נכונים. FAR > 10 נדיר גם בפרויקטים צפופים.');
    } else if (stats.far > 6) {
      add('warning', 'FAR_HIGH', 'מקדם ניצול גבוה', `מקדם הניצול (FAR) הוא ${stats.far.toFixed(1)} — גבוה יחסית.`, 'בדוק מול תוכנית המתאר המקומית.');
    }
  }

  // 7. Plot area set but no floor footprint
  if (inputs.plotArea && inputs.buildings.every(b => !b.floorFootprint)) {
    add('warning', 'PLOT_NO_FOOTPRINT', 'שטח מגרש ללא תכסית', 'הוגדר שטח מגרש אך לא הוגדר שטח תכסית לאף בניין.', 'הגדר שטח תכסית קומה לחישוב יחס תכסית ומקדם ניצול.');
  }

  // 8. Average area sanity
  if (stats.avgAreaPerApartment > 0) {
    if (stats.avgAreaPerApartment < 25) {
      add('error', 'AVG_AREA_TOO_SMALL', 'שטח ממוצע ליח"ד קטן מדי', `השטח הממוצע ליח"ד הוא ${stats.avgAreaPerApartment.toFixed(1)} מ"ר — נמוך מהמינימום המקובל.`, 'בדוק את טווחי השטח בתמהיל הדירות.');
    } else if (stats.avgAreaPerApartment > 250) {
      add('warning', 'AVG_AREA_LARGE', 'שטח ממוצע ליח"ד גבוה מאוד', `השטח הממוצע ליח"ד הוא ${stats.avgAreaPerApartment.toFixed(1)} מ"ר — גבוה יחסית.`, 'ודא שטווחי השטח בתמהיל הדירות נכונים.');
    }
  }

  return issues;
}
