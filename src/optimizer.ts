import type {
  BuildingInputs, BuildingResult, ApartmentTypeResult,
  FloorResult, FloorApartment, ApartmentType
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

export function optimize(inputs: BuildingInputs): BuildingResult {
  const warnings: string[] = [];

  const effectiveTypes = inputs.types.length > 0
    ? inputs.types
    : DEFAULT_STRATEGY_TYPES[inputs.mixStrategy ?? 'equal'];

  const totalPercentage = effectiveTypes.reduce((s, t) => s + t.percentage, 0);
  if (inputs.types.length > 0 && Math.abs(totalPercentage - 100) > 0.5) {
    warnings.push(`סכום האחוזים הוא ${totalPercentage.toFixed(1)}% — צריך להיות 100%`);
  }

  const weightedAvgArea = effectiveTypes.reduce(
    (s, t) => s + midpoint(t.minArea, t.maxArea) * (t.percentage / 100),
    0
  ) || 70;

  let N = inputs.totalApartments;
  let F = inputs.numFloors;
  let APF = inputs.apartmentsPerFloor;

  const floorFootprint = inputs.floorFootprint ?? null;
  let lobbyPerFloor: number;
  if (inputs.lobbyAreaMode === 'fixed') {
    lobbyPerFloor = inputs.lobbyArea ?? 20;
  } else {
    const key = inputs.lobbyKey ?? getPredefinedLobbyKey(F ?? 8);
    lobbyPerFloor = key * (APF ?? 4);
  }
  const netFloorArea = floorFootprint ? floorFootprint - lobbyPerFloor : null;

  if (N !== null && F !== null && APF === null) {
    APF = Math.max(1, Math.round(N / F));
  } else if (N !== null && APF !== null && F === null) {
    F = Math.max(1, Math.round(N / APF));
  } else if (F !== null && APF !== null && N === null) {
    N = F * APF;
  } else if (N === null && F !== null && APF === null && netFloorArea !== null) {
    APF = Math.max(1, Math.round(netFloorArea / weightedAvgArea));
    N = F * APF;
  } else if (N === null && F === null && APF === null) {
    if (netFloorArea !== null) {
      APF = Math.max(1, Math.round(netFloorArea / weightedAvgArea));
      F = 8;
      N = F * APF;
      warnings.push('מספר הקומות הוגדר לברירת מחדל 8 — ניתן לשנות');
    } else {
      N = 24; F = 8; APF = 3;
      warnings.push('לא הוגדרו נתונים — הוצגו ערכי ברירת מחדל');
    }
  }

  if (N !== null && F !== null && APF !== null) {
    const expected = Math.max(1, Math.round(N / F));
    if (expected !== APF) { APF = expected; }
  }

  N = N ?? 24; F = F ?? 8; APF = APF ?? Math.max(1, Math.round(N / F));

  if (inputs.lobbyAreaMode === 'key') {
    const key = inputs.lobbyKey ?? getPredefinedLobbyKey(F);
    lobbyPerFloor = key * APF;
  }
  const resolvedNetFloor = floorFootprint ? floorFootprint - lobbyPerFloor : weightedAvgArea * APF;
  const resolvedFootprint = floorFootprint ?? (resolvedNetFloor + lobbyPerFloor);

  const groundApts = inputs.groundFloorApartments ?? APF;
  const roofApts = F >= 2 ? (inputs.roofApartments ?? APF) : groundApts;

  const rawCounts = effectiveTypes.map(t => (t.percentage / 100) * N!);
  const flooredCounts = rawCounts.map(c => Math.floor(c));
  const remainder = N! - flooredCounts.reduce((s, c) => s + c, 0);
  const fractionals = rawCounts.map((c, i) => ({ i, frac: c - flooredCounts[i] }));
  fractionals.sort((a, b) => b.frac - a.frac);
  const counts = [...flooredCounts];
  for (let k = 0; k < remainder; k++) counts[fractionals[k].i]++;

  const typeResults: ApartmentTypeResult[] = effectiveTypes.map((t, i) => {
    const count = counts[i];
    const avgArea = midpoint(t.minArea, t.maxArea);
    return {
      id: t.id, label: t.label, count,
      percentage: N! > 0 ? (count / N!) * 100 : 0,
      avgArea, minArea: t.minArea, maxArea: t.maxArea,
      totalArea: count * avgArea, color: t.color,
    };
  });

  const totalNetArea = typeResults.reduce((s, t) => s + t.totalArea, 0);
  const avgAreaPerApartment = N! > 0 ? totalNetArea / N! : 0;
  const totalBuildingArea = resolvedFootprint * F;
  const utilizationRate = totalBuildingArea > 0 ? totalNetArea / totalBuildingArea : 0;

  const floorCapacities: number[] = [];
  for (let i = 0; i < F; i++) {
    if (i === 0) floorCapacities.push(groundApts);
    else if (i === F - 1 && F > 1) floorCapacities.push(roofApts);
    else floorCapacities.push(APF);
  }

  const floorAssignments = distributeToFloors(typeResults, floorCapacities, inputs.placementStrategy);

  const floorResults: FloorResult[] = [];
  for (let i = 0; i < F; i++) {
    const isGround = i === 0;
    const isRoof = i === F - 1 && F > 1;
    const label = isGround ? 'ק. קרקע' : isRoof ? 'גג' : `קומה ${i}`;
    const apts = floorAssignments[i] ?? [];
    const netArea = apts.reduce((s, a) => s + a.area, 0);
    floorResults.push({
      floorIndex: i,
      label,
      apartments: apts,
      grossArea: resolvedFootprint,
      netArea,
      lobbyArea: lobbyPerFloor,
      isGround,
      isRoof,
    });
  }

  if (resolvedNetFloor > 0 && APF > 0) {
    const neededPerFloor = avgAreaPerApartment * APF;
    if (neededPerFloor > resolvedNetFloor * 1.1) {
      warnings.push(`שטח נטו לקומה (${resolvedNetFloor.toFixed(0)} מ"ר) קטן מהנדרש (${neededPerFloor.toFixed(0)} מ"ר)`);
    }
  }

  const plotArea = inputs.plotArea ?? null;
  const buildingCoverageRatio = plotArea ? resolvedFootprint / plotArea : null;
  const far = plotArea ? totalBuildingArea / plotArea : null;

  if (buildingCoverageRatio !== null && buildingCoverageRatio > 0.6) {
    warnings.push(`תכסית גבוהה: ${(buildingCoverageRatio * 100).toFixed(0)}% — בדוק תקנות תכנון`);
  }

  return {
    totalApartments: N!, numFloors: F, apartmentsPerFloor: APF,
    groundFloorApartments: groundApts, roofApartments: roofApts,
    plotArea, floorFootprint: resolvedFootprint,
    totalBuildingArea, totalNetArea, avgAreaPerApartment,
    lobbyAreaPerFloor: lobbyPerFloor, netFloorArea: resolvedNetFloor,
    utilizationRate, buildingCoverageRatio, far,
    types: typeResults, floors: floorResults, warnings,
  };
}
