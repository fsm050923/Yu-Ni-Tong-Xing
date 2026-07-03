import { searchPoi as amapSearchPoi, searchAround, isAmapConfigured } from '../../services/amap'

export interface SearchPoiArgs {
  location: string
  keyword?: string
  radius?: number
  childAge: number
}

export async function searchPoi(args: SearchPoiArgs) {
  const city = args.location || '大连'
  const keyword = args.keyword || '亲子'

  if (!isAmapConfigured()) {
    // Fallback to local mock
    return fallbackSearch(args)
  }

  try {
    // Search for child-friendly POIs near the location
    const result = await amapSearchPoi({
      keywords: keyword,
      city,
      citylimit: false,
      offset: 15,
      children: 1, // Amap child-friendly filter
    })

    const pois = result.pois.map((p) => {
      const [lng, lat] = p.location.split(',').map(Number)
      return {
        name: p.name,
        address: p.address,
        type: p.type,
        lat,
        lng,
        rating: p.biz_ext?.rating ? parseFloat(p.biz_ext.rating) : undefined,
        cost: p.biz_ext?.cost,
        hasChildFacility: (p.children?.length || 0) > 0 || p.childtype === '1',
        tel: p.tel,
        photos: (p.photos || []).slice(0, 3).map((ph) => ph.url),
      }
    })

    return {
      location: city,
      keyword,
      results: pois,
      total: pois.length,
      source: 'amap_live',
    }
  } catch (err) {
    console.warn('[searchPoi] Amap API failed, using fallback:', err)
    return fallbackSearch(args)
  }
}

function fallbackSearch(args: SearchPoiArgs) {
  const mockDB: Record<string, Array<Record<string, unknown>>> = {
    '大连': [
      { name: '大连圣亚海洋世界', type: '海洋馆', lat: 38.887, lng: 121.586, rating: 4.8, address: '沙河口区中山路608号', hasChildFacility: true },
      { name: '大连森林动物园', type: '动物园', lat: 38.882, lng: 121.630, rating: 4.7, address: '', hasChildFacility: true },
      { name: '大连自然博物馆', type: '博物馆', lat: 38.868, lng: 121.592, rating: 4.5, address: '', hasChildFacility: false },
      { name: '金石滩黄金海岸', type: '海滩', lat: 39.081, lng: 121.621, rating: 4.9, address: '', hasChildFacility: false },
      { name: '星海广场', type: '广场', lat: 38.881, lng: 121.583, rating: 4.8, address: '', hasChildFacility: false },
      { name: '老虎滩海洋公园', type: '海洋公园', lat: 38.872, lng: 121.679, rating: 4.7, address: '', hasChildFacility: true },
      { name: '大连儿童公园', type: '公园', lat: 38.913, lng: 121.632, rating: 4.5, address: '', hasChildFacility: true },
      { name: '大连贝壳博物馆', type: '博物馆', lat: 38.885, lng: 121.590, rating: 4.4, address: '', hasChildFacility: false },
      { name: '发现王国主题公园', type: '游乐园', lat: 39.095, lng: 121.698, rating: 4.5, address: '', hasChildFacility: true },
      { name: '傅家庄公园', type: '公园', lat: 38.861, lng: 121.618, rating: 4.4, address: '', hasChildFacility: false },
      { name: '棒棰岛风景区', type: '风景区', lat: 38.903, lng: 121.712, rating: 4.6, address: '', hasChildFacility: false },
      { name: '大连现代博物馆', type: '博物馆', lat: 38.891, lng: 121.596, rating: 4.3, address: '', hasChildFacility: false },
    ],
    '北京': [
      { name: '北京动物园', type: '动物园', lat: 39.942, lng: 116.337, rating: 4.8, address: '', hasChildFacility: true },
      { name: '中国科技馆', type: '科技馆', lat: 39.999, lng: 116.393, rating: 4.9, address: '', hasChildFacility: true },
      { name: '自然博物馆', type: '博物馆', lat: 39.882, lng: 116.393, rating: 4.6, address: '', hasChildFacility: false },
      { name: '蓝港儿童乐园', type: '游乐园', lat: 39.953, lng: 116.474, rating: 4.8, address: '', hasChildFacility: true },
      { name: '朝阳公园', type: '公园', lat: 39.945, lng: 116.481, rating: 4.5, address: '', hasChildFacility: false },
      { name: '奥林匹克公园', type: '公园', lat: 39.993, lng: 116.392, rating: 4.6, address: '', hasChildFacility: true },
      { name: '亲子餐厅小绿洲', type: '餐厅', lat: 39.960, lng: 116.420, rating: 4.4, address: '', hasChildFacility: true },
      { name: '北京天文馆', type: '博物馆', lat: 39.936, lng: 116.335, rating: 4.5, address: '', hasChildFacility: false },
      { name: '颐和园', type: '公园', lat: 39.999, lng: 116.275, rating: 4.8, address: '', hasChildFacility: true },
      { name: '海淀公园', type: '公园', lat: 39.985, lng: 116.293, rating: 4.4, address: '', hasChildFacility: false },
    ],
  }

  const city = Object.keys(mockDB).find((c) => args.location.includes(c)) || '大连'
  let results = mockDB[city] || mockDB['大连']

  if (args.keyword) {
    const kw = args.keyword.toLowerCase()
    if (kw.includes('博物馆')) results = results.filter((p) => p.type === '博物馆')
    if (kw.includes('海洋')) results = results.filter((p) => p.type?.includes('海洋'))
    if (kw.includes('动物')) results = results.filter((p) => p.type === '动物园')
    if (kw.includes('游乐') || kw.includes('乐园')) results = results.filter((p) => p.type === '游乐园' || p.name.includes('乐园'))
  }

  return {
    location: city,
    keyword: args.keyword,
    results: results.map((p) => ({
      name: p.name,
      address: p.address,
      type: p.type,
      lat: p.lat,
      lng: p.lng,
      rating: p.rating,
      hasChildFacility: p.hasChildFacility,
    })),
    total: results.length,
    source: 'local_fallback',
  }
}
