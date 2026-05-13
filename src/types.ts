export type ApartmentCategory = 'small' | 'medium' | 'large';

export interface ApartmentType {
  id: ApartmentCategory;
  label: string;
  minArea: number;
  maxArea: number;
  percentage: number; // 0-100
  color: string;
}

export interface BuildingInputs {
  totalApartments: number | null;
  numFloors: number | null;
  apartmentsPerFloor: number | null;
  floorFootprint: number | null; // total sqm including lobby
  lobbyArea: number | null;
  types: ApartmentType[];
}

export interface ApartmentTypeResult {
  id: ApartmentCategory;
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
  floorFootprint: number;
  lobbyArea: number;
  netFloorArea: number;
  totalBuildingArea: number;
  totalNetArea: number;
  avgAreaPerApartment: number;
  utilizationRate: number; // net/gross
  types: ApartmentTypeResult[];
  warnings: string[];
}

export type LockedField = 'totalApartments' | 'numFloors' | 'apartmentsPerFloor' | 'floorFootprint';
