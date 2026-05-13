import type { BuildingInputs, BuildingResult, ApartmentTypeResult } from './types';

function midpoint(min: number, max: number) {
  return (min + max) / 2;
}

/**
 * Optimization strategy:
 * 1. Determine totalApartments, numFloors, apartmentsPerFloor from available inputs.
 *    Priority: use locked values first, derive missing ones.
 * 2. Distribute apartments by percentage → counts (round to integers, fix remainder).
 * 3. Use midpoint of each type's range as default average area.
 * 4. If floor footprint is given, back-calculate net area per floor and check fit.
 * 5. If avg area is over/under range, clamp to range and warn.
 */
export function optimize(inputs: BuildingInputs): BuildingResult {
  const warnings: string[] = [];

  const totalPercentage = inputs.types.reduce((s, t) => s + t.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.5) {
    warnings.push(`סכום האחוזים הוא ${totalPercentage.toFixed(1)}% — צריך להיות 100%`);
  }

  // --- Resolve N, F, APF ---
  let N = inputs.totalApartments;
  let F = inputs.numFloors;
  let APF = inputs.apartmentsPerFloor;

  // Weighted average area from type mix
  const weightedAvgArea = inputs.types.reduce(
    (s, t) => s + midpoint(t.minArea, t.maxArea) * (t.percentage / 100),
    0
  );

  // Net floor area available for apartments (footprint minus lobby)
  const lobbyArea = inputs.lobbyArea ?? 15;
  const floorFootprint = inputs.floorFootprint ?? null;
  const netFloorArea = floorFootprint ? floorFootprint - lobbyArea : null;

  if (N !== null && F !== null && APF === null) {
    APF = Math.round(N / F);
  } else if (N !== null && APF !== null && F === null) {
    F = Math.round(N / APF);
  } else if (F !== null && APF !== null && N === null) {
    N = F * APF;
  } else if (N === null && F !== null && APF === null && netFloorArea !== null) {
    APF = Math.max(1, Math.round(netFloorArea / weightedAvgArea));
    N = F * APF;
  } else if (N === null && APF !== null && F === null && netFloorArea !== null) {
    F = Math.max(1, Math.round(netFloorArea / (APF * weightedAvgArea) * 10));
    N = F * APF;
  } else if (N === null && F === null && APF === null) {
    // Fully derive from footprint if available
    if (netFloorArea !== null) {
      APF = Math.max(1, Math.round(netFloorArea / weightedAvgArea));
      F = 8; // default
      N = F * APF;
      warnings.push('מספר הקומות הוגדר לברירת מחדל 8 — ניתן לשנות');
    } else {
      // Pure default
      N = 24;
      F = 8;
      APF = 3;
      warnings.push('לא הוגדרו נתונים — הוצגו ערכי ברירת מחדל');
    }
  }

  // Ensure consistency: if all three given, trust N and F, recalc APF
  if (N !== null && F !== null && APF !== null) {
    const expected = Math.round(N / F);
    if (expected !== APF) {
      APF = expected;
      warnings.push(`מספר דירות בקומה עודכן ל-${APF} לשמירת עקביות`);
    }
  }

  N = N ?? 24;
  F = F ?? 8;
  APF = APF ?? Math.round(N / F);

  // --- Distribute apartment counts by percentage ---
  const rawCounts = inputs.types.map(t => (t.percentage / 100) * N!);
  const flooredCounts = rawCounts.map(c => Math.floor(c));
  const remainder = N! - flooredCounts.reduce((s, c) => s + c, 0);

  // Give remainder to the types with highest fractional parts
  const fractionals = rawCounts.map((c, i) => ({ i, frac: c - flooredCounts[i] }));
  fractionals.sort((a, b) => b.frac - a.frac);
  const counts = [...flooredCounts];
  for (let k = 0; k < remainder; k++) {
    counts[fractionals[k].i]++;
  }

  // --- Build type results ---
  const typeResults: ApartmentTypeResult[] = inputs.types.map((t, i) => {
    const count = counts[i];
    const avgArea = midpoint(t.minArea, t.maxArea);
    const totalArea = count * avgArea;
    return {
      id: t.id,
      label: t.label,
      count,
      percentage: N! > 0 ? (count / N!) * 100 : 0,
      avgArea,
      minArea: t.minArea,
      maxArea: t.maxArea,
      totalArea,
      color: t.color,
    };
  });

  const totalNetArea = typeResults.reduce((s, t) => s + t.totalArea, 0);
  const avgAreaPerApartment = N! > 0 ? totalNetArea / N! : 0;
  const totalBuildingArea = floorFootprint ? floorFootprint * F : (netFloorArea ?? avgAreaPerApartment * APF) * F + lobbyArea * F;
  const totalNetAreaBuilding = totalNetArea;
  const utilizationRate = totalBuildingArea > 0 ? totalNetAreaBuilding / totalBuildingArea : 0;

  // Check if apartments fit in floor footprint
  if (netFloorArea !== null && APF > 0) {
    const neededPerFloor = avgAreaPerApartment * APF;
    if (neededPerFloor > netFloorArea * 1.05) {
      warnings.push(
        `שטח נטו לקומה (${netFloorArea.toFixed(0)} מ"ר) קטן מהנדרש (${neededPerFloor.toFixed(0)} מ"ר) — שקול הפחתת מספר דירות בקומה`
      );
    }
  }

  return {
    totalApartments: N!,
    numFloors: F,
    apartmentsPerFloor: APF,
    floorFootprint: floorFootprint ?? (netFloorArea ? netFloorArea + lobbyArea : avgAreaPerApartment * APF + lobbyArea),
    lobbyArea,
    netFloorArea: netFloorArea ?? avgAreaPerApartment * APF,
    totalBuildingArea,
    totalNetArea: totalNetAreaBuilding,
    avgAreaPerApartment,
    utilizationRate,
    types: typeResults,
    warnings,
  };
}
