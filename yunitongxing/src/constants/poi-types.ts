export const POI_TYPES = {
  playground: { label: '亲子乐园', icon: '🎠', color: '#FF9A56' },
  museum: { label: '博物馆', icon: '🏛️', color: '#7EC8E3' },
  restaurant: { label: '亲子餐厅', icon: '🍽️', color: '#FFD166' },
  nursery: { label: '母婴室', icon: '🍼', color: '#FF8EBF' },
  parking: { label: '亲子停车场', icon: '🅿️', color: '#A0C4A8' },
  restroom: { label: '儿童卫生间', icon: '🚻', color: '#C4A8D0' },
  'water-fountain': { label: '饮水处', icon: '💧', color: '#88C9E8' },
  'indoor-play': { label: '室内游乐', icon: '🏰', color: '#FFB347' },
  'science-center': { label: '科技馆', icon: '🔬', color: '#7EC8E3' },
} as const;

export const FACILITY_TYPES = ['nursery', 'restroom', 'water-fountain', 'restaurant'] as const;

export const MARKER_SVG_PATHS: Record<string, string> = {
  playground: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z',
  museum: 'M12 2L2 7v2h2v9H3v2h18v-2h-1v-9h2V7l-10-5zm0 2.18L19 9H5l7-4.82z',
  restaurant: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3l1.42-1.42L16 3.17V2h-2v1.17l-1.42 1.41L14 6h2z',
  nursery: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-6h2v2h-2zm0-8h2v6h-2z',
  parking: 'M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z',
};

export function getPoiLabel(type: string): string {
  return (POI_TYPES as Record<string, {label: string}>)[type]?.label || type;
}

export function getPoiColor(type: string): string {
  return (POI_TYPES as Record<string, {color: string}>)[type]?.color || '#FFD166';
}

export function getPoiIcon(type: string): string {
  return (POI_TYPES as Record<string, {icon: string}>)[type]?.icon || '📍';
}
