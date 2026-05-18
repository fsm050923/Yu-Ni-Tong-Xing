export interface NearbyFacility {
  id: string;
  name: string;
  type: 'nursery' | 'restroom' | 'water-fountain' | 'restaurant' | 'parking';
  lat: number;
  lng: number;
  distance: number;
  childFriendlinessRating: 1 | 2 | 3 | 4 | 5;
}

export interface PoiSearchResult {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address: string;
  rating: number;
  childFriendly: boolean;
  hasNursery: boolean;
  indoor: boolean;
}
