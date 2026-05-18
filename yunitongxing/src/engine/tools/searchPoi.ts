import type { TripNode } from '../../types/trip'

// Mock POI database keyed by destination
const POI_DB: Record<string, Array<Partial<TripNode> & { keywords: string[] }>> = {
  '北京': [
    { name: '北京动物园', poiType: 'playground', lat: 39.942, lng: 116.337, childFriendlinessRating: 5, crowdLevel: 3, indoor: false, keywords: ['户外', '动物', '亲子'] },
    { name: '中国科技馆', poiType: 'science-center', lat: 39.999, lng: 116.393, childFriendlinessRating: 5, crowdLevel: 2, indoor: true, keywords: ['室内', '科学', '互动'] },
    { name: '自然博物馆', poiType: 'museum', lat: 39.882, lng: 116.393, childFriendlinessRating: 4, crowdLevel: 2, indoor: true, keywords: ['室内', '恐龙', '自然'] },
    { name: '蓝港儿童乐园', poiType: 'indoor-play', lat: 39.953, lng: 116.474, childFriendlinessRating: 5, crowdLevel: 3, indoor: true, keywords: ['室内', '游乐', '商场'] },
    { name: '朝阳公园', poiType: 'playground', lat: 39.945, lng: 116.481, childFriendlinessRating: 4, crowdLevel: 1, indoor: false, keywords: ['户外', '草坪', '野餐'] },
    { name: '奥林匹克公园', poiType: 'playground', lat: 39.993, lng: 116.392, childFriendlinessRating: 4, crowdLevel: 1, indoor: false, keywords: ['户外', '运动', '开阔'] },
    { name: '亲子餐厅小绿洲', poiType: 'restaurant', lat: 39.96, lng: 116.42, childFriendlinessRating: 4, crowdLevel: 2, indoor: true, keywords: ['餐厅', '儿童餐', '游乐区'] },
    { name: '水立方嬉水乐园', poiType: 'indoor-play', lat: 39.991, lng: 116.386, childFriendlinessRating: 5, crowdLevel: 3, indoor: true, keywords: ['室内', '水上', '亲子'] },
  ],
  '大连': [
    { name: '大连圣亚海洋世界', poiType: 'museum', lat: 38.887, lng: 121.586, childFriendlinessRating: 5, crowdLevel: 3, indoor: true, keywords: ['室内', '海洋', '表演'] },
    { name: '金石滩黄金海岸', poiType: 'playground', lat: 39.081, lng: 121.621, childFriendlinessRating: 5, crowdLevel: 2, indoor: false, keywords: ['户外', '沙滩', '玩沙'] },
    { name: '大连森林动物园', poiType: 'playground', lat: 38.882, lng: 121.63, childFriendlinessRating: 5, crowdLevel: 3, indoor: false, keywords: ['户外', '动物', '观光车'] },
    { name: '大连自然博物馆', poiType: 'museum', lat: 38.868, lng: 121.592, childFriendlinessRating: 4, crowdLevel: 1, indoor: true, keywords: ['室内', '免费', '恐龙'] },
    { name: '发现王国主题公园', poiType: 'playground', lat: 39.095, lng: 121.698, childFriendlinessRating: 4, crowdLevel: 4, indoor: false, keywords: ['户外', '游乐', '刺激'] },
    { name: '老虎滩海洋公园', poiType: 'museum', lat: 38.873, lng: 121.678, childFriendlinessRating: 5, crowdLevel: 3, indoor: false, keywords: ['户外', '海洋', '表演'] },
    { name: '星海广场', poiType: 'playground', lat: 38.883, lng: 121.585, childFriendlinessRating: 5, crowdLevel: 2, indoor: false, keywords: ['户外', '广场', '开阔'] },
    { name: '大连恒隆广场儿童区', poiType: 'indoor-play', lat: 38.897, lng: 121.59, childFriendlinessRating: 4, crowdLevel: 2, indoor: true, keywords: ['室内', '商场', '游乐'] },
  ],
}

export interface SearchPoiArgs {
  location: string
  keyword?: string
  radius?: number
  childAge: number
}

export async function searchPoi(args: SearchPoiArgs) {
  const matchedCity = Object.keys(POI_DB).find((c) => args.location.includes(c)) || '大连'
  const pois = POI_DB[matchedCity] || []

  let results = pois

  // Filter by indoor/outdoor keyword
  if (args.keyword) {
    const kw = args.keyword.toLowerCase()
    if (kw.includes('室内')) results = results.filter((p) => p.indoor)
    if (kw.includes('户外')) results = results.filter((p) => !p.indoor)
    if (kw.includes('博物馆')) results = results.filter((p) => p.poiType === 'museum')
    if (kw.includes('乐园') || kw.includes('游乐')) results = results.filter((p) => p.poiType === 'playground' || p.poiType === 'indoor-play')
  }

  // Age-appropriate filtering
  if (args.childAge <= 3) {
    results = results.filter((p) => p.crowdLevel! <= 2 && p.childFriendlinessRating! >= 4)
  }

  return {
    location: args.location,
    results: results.map((p) => ({
      name: p.name,
      poiType: p.poiType,
      lat: p.lat,
      lng: p.lng,
      indoor: p.indoor,
      rating: p.childFriendlinessRating,
      crowdLevel: p.crowdLevel,
    })),
    total: results.length,
  }
}
