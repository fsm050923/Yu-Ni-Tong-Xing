export const COLORS = {
  warmYellow: '#FFD166',
  warmOrange: '#FF9A56',
  skyBlue: '#7EC8E3',
  softPink: '#FF8EBF',
  mintGreen: '#A0C4A8',
  softPurple: '#C4A8D0',
  warmBg: '#FFF8F0',
  cardBg: '#FFFFFF',
  textPrimary: '#4A3728',
  textSecondary: '#8B7355',
  textMuted: '#B0A090',
} as const;

export const POI_COLORS: Record<string, string> = {
  playground: '#FF9A56',
  restaurant: '#FFD166',
  nursery: '#FF8EBF',
  museum: '#7EC8E3',
  parking: '#A0C4A8',
  'water-fountain': '#88C9E8',
  restroom: '#C4A8D0',
  'indoor-play': '#FFB347',
  'science-center': '#7EC8E3',
};

export const SEGMENT_COLORS = {
  morning: '#FFB347',
  afternoon: '#FF6B6B',
  evening: '#7B68EE',
} as const;

export const MODE_COLORS = {
  standard: '#FFD166',
  relaxed: '#7EC8E3',
  compact: '#FF9A56',
} as const;
