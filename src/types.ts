export type MixStrategy = 'equal' | 'maximize-large' | 'maximize-small';
export type PlacementStrategy = 'large-top' | 'small-bottom' | 'uniform' | 'large-bottom';
export type TotalAreaMode = 'manual' | 'by-avg-area' | 'by-plot-pct';

export interface ApartmentType {
  id: string;
  label: string;
  minArea: number;
  maxArea: number;
  percentage: number;
  color: string;
}

export interface BuildingDef {
  id: string;
  name: string;
  numFloors: number | null;
  apartmentsPerFloor: number | null;
  groundFloorApartments: number | null;
  roofApartments: number | null;
  floorFootprint: number | null;
  lobbyAreaMode: 'fixed' | 'key';
  lobbyArea: number | null;
  lobbyKey: number | null;
  useProjectMix: boolean;
  types: ApartmentType[];
  mixStrategy: MixStrategy | null;
  placementStrategy: PlacementStrategy;
}

export interface BuildingInputs {
  projectName: string;

  // Project-level targets
  totalApartments: number | null;

  // Area settings
  plotArea: number | null;
  totalAreaMode: TotalAreaMode;
  totalBuildingArea: number | null;
  avgAreaTarget: number | null;   // for 'by-avg-area'
  plotPct: number | null;         // for 'by-plot-pct' (0-100)

  // Global mix
  types: ApartmentType[];
  mixStrategy: MixStrategy | null;
  placementStrategy: PlacementStrategy;

  // Buildings
  buildings: BuildingDef[];
}

export interface FloorApartment {
  typeId: string;
  typeLabel: string;
  area: number;
  color: string;
}

export interface FloorResult {
  floorIndex: number;
  label: string;
  apartments: FloorApartment[];
  grossArea: number;
  netArea: number;
  lobbyArea: number;
  isGround: boolean;
  isRoof: boolean;
}

export interface ApartmentTypeResult {
  id: string;
  label: string;
  count: number;
  percentage: number;
  avgArea: number;
  minArea: number;
  maxArea: number;
  totalArea: number;
  color: string;
}

export interface BuildingResult {
  buildingId: string;
  buildingName: string;
  totalApartments: number;
  numFloors: number;
  apartmentsPerFloor: number;
  groundFloorApartments: number;
  roofApartments: number;
  plotArea: number | null;
  floorFootprint: number;
  totalBuildingArea: number;
  totalNetArea: number;
  avgAreaPerApartment: number;
  lobbyAreaPerFloor: number;
  netFloorArea: number;
  utilizationRate: number;
  buildingCoverageRatio: number | null;
  far: number | null;
  types: ApartmentTypeResult[];
  floors: FloorResult[];
  warnings: string[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  title: string;
  message: string;
  suggestion: string;
  buildingId?: string;
}

export interface ProjectResult {
  buildingResults: BuildingResult[];
  totalApartments: number;
  totalBuildingArea: number;
  totalNetArea: number;
  avgAreaPerApartment: number;
  plotArea: number | null;
  far: number | null;
  buildingCoverageRatio: number | null;
  types: ApartmentTypeResult[];
  issues: ValidationIssue[];
}
