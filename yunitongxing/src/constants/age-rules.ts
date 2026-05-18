import type { AgeGroup } from '../types/trip';

export interface AgeRuleSet {
  ageGroup: AgeGroup;
  ageRange: [number, number];
  maxHoursPerDay: number;
  maxWalkDistanceMeters: number;
  breakIntervalMinutes: number;
  indoorPriority: boolean;
  requireNap: boolean;
  napStart: string;
  napEnd: string;
  requireNearbyNursery: boolean;
  nurseryMaxDistance: number;
  avoidCrowds: boolean;
  preferInteractive: boolean;
  preferEducational: boolean;
  suitablePoiTypes: string[];
  avoidPoiTypes: string[];
  childWalkSpeedMetersPerMinute: number;
  description: string;
}

export const AGE_RULES: Record<AgeGroup, AgeRuleSet> = {
  infant: {
    ageGroup: 'infant',
    ageRange: [0, 3],
    maxHoursPerDay: 4,
    maxWalkDistanceMeters: 800,
    breakIntervalMinutes: 60,
    indoorPriority: true,
    requireNap: true,
    napStart: '12:00',
    napEnd: '14:00',
    requireNearbyNursery: true,
    nurseryMaxDistance: 500,
    avoidCrowds: true,
    preferInteractive: false,
    preferEducational: false,
    suitablePoiTypes: ['indoor-play', 'restaurant', 'nursery', 'parking'],
    avoidPoiTypes: ['museum', 'science-center'],
    childWalkSpeedMetersPerMinute: 30,
    description: '0-3岁婴幼儿模式：以安全+舒适为最高优先级，行程缓慢，环境要求严格',
  },
  preschool: {
    ageGroup: 'preschool',
    ageRange: [4, 6],
    maxHoursPerDay: 6,
    maxWalkDistanceMeters: 1500,
    breakIntervalMinutes: 45,
    indoorPriority: false,
    requireNap: false,
    napStart: '',
    napEnd: '',
    requireNearbyNursery: false,
    nurseryMaxDistance: 300,
    avoidCrowds: false,
    preferInteractive: true,
    preferEducational: false,
    suitablePoiTypes: ['playground', 'museum', 'indoor-play', 'restaurant', 'parking'],
    avoidPoiTypes: [],
    childWalkSpeedMetersPerMinute: 50,
    description: '4-6岁学龄前模式：以探索+互动为核心，激发好奇心与创造力',
  },
  school: {
    ageGroup: 'school',
    ageRange: [7, 12],
    maxHoursPerDay: 10,
    maxWalkDistanceMeters: 3000,
    breakIntervalMinutes: 90,
    indoorPriority: false,
    requireNap: false,
    napStart: '',
    napEnd: '',
    requireNearbyNursery: false,
    nurseryMaxDistance: 500,
    avoidCrowds: false,
    preferInteractive: false,
    preferEducational: true,
    suitablePoiTypes: ['museum', 'science-center', 'playground', 'restaurant', 'parking'],
    avoidPoiTypes: [],
    childWalkSpeedMetersPerMinute: 70,
    description: '7-12岁学龄模式：以学习+挑战为导向，融入知识与成长元素',
  },
};

export function getAgeGroup(age: number): AgeGroup {
  if (age <= 3) return 'infant';
  if (age <= 6) return 'preschool';
  return 'school';
}

export function getRulesForAge(age: number): AgeRuleSet {
  return AGE_RULES[getAgeGroup(age)];
}
