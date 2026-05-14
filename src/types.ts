export type MixStrategy = 'equal' | 'maximize-large' | 'maximize-small';
export type PlacementStrategy = 'large-top' | 'small-bottom' | 'uniform' | 'large-bottom';

export interface ApartmentType {
  id: string;
  label: string;
  minArea: number;
  maxArea: number;
  percentage: number;
  color: string;
}

export interface BuildingInputs {
  projectName: string;

  totalApartments: number | null;
  numFloors: number | null;
  apartmentsPerFloor: number | null;
  groundFloorApartments: number | null;
  roofApartments: number | null;

  plotArea: number | null;
  floorFootprint: number | null;
  totalBuildingArea: number | null;

  lobbyAreaMode: 'fixed' | 'key';
  lobbyArea: number | null;
  lobbyKey: number | null;

  types: ApartmentType[];
  mixStrategy: MixStrategy | null;
  placementStrategy: PlacementStrategy;
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
