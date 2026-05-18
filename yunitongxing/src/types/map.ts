export interface MapState {
  center: [number, number];
  zoom: number;
}

export interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  type: string;
  name: string;
  icon: string;
  color: string;
  segment: string;
  order: number;
}

export interface PolylineData {
  id: string;
  positions: [number, number][];
  color: string;
  segment: string;
  walkingInfo: { distance: number; duration: number } | null;
}
