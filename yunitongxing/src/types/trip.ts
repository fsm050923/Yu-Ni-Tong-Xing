// ============ Trip Types ============

export type AgeGroup = 'infant' | 'preschool' | 'school';
export type TripMode = 'standard' | 'relaxed' | 'compact';
export type DaySegment = 'morning' | 'afternoon' | 'evening';

export interface TicketInfo {
  adultPrice: number;
  childPrice: number;
  hasChildTicket: boolean;
  bookingUrl: string;
  openTime: string;
  closeTime: string;
}

export interface WalkingInfo {
  distance: number;        // meters
  duration: number;        // minutes
  childFriendly: boolean;
}

export interface TripNode {
  id: string;
  type: 'attraction' | 'restaurant' | 'rest' | 'facility' | 'transport';
  poiType: 'playground' | 'museum' | 'restaurant' | 'nursery' | 'parking' | 'restroom' | 'water-fountain' | 'indoor-play' | 'science-center';
  name: string;
  address: string;
  lat: number;
  lng: number;
  startTime: string;       // "09:00"
  endTime: string;         // "10:30"
  duration: number;        // minutes
  dayIndex: number;        // 0, 1, ...
  segment: DaySegment;
  walkingFromPrev: WalkingInfo | null;
  ticketInfo: TicketInfo | null;
  childFriendlinessRating: 1 | 2 | 3 | 4 | 5;
  crowdLevel: 1 | 2 | 3 | 4;
  tips: string[];
  indoor: boolean;
}

export interface DaySegments {
  morning: TripNode[];
  afternoon: TripNode[];
  evening: TripNode[];
}

export interface TripDay {
  date: string;
  dayIndex: number;
  segments: DaySegments;
}

export type WeatherPlan = 'sunny' | 'rainy';

export interface Trip {
  id: string;
  title: string;
  destination: string;
  destinationCoords: [number, number];
  childAge: number;
  ageGroup: AgeGroup;
  mode: TripMode;
  days: TripDay[];
  weatherPlan: WeatherPlan;
  createdAt: number;
  updatedAt: number;
}

export interface TripSummary {
  totalDuration: number;
  totalWalkDistance: number;
  attractionCount: number;
  restaurantCount: number;
  facilityCount: number;
}
