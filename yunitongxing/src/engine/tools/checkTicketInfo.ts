export interface CheckTicketInfoArgs {
  attractionName: string
  childAge: number
}

const TICKET_DB: Record<string, { adultPrice: number; childPrice: number; freeBelow: number; halfBelow: number; openTime: string; closeTime: string; needBooking: boolean }> = {
  '大连圣亚海洋世界': { adultPrice: 220, childPrice: 110, freeBelow: 1.2, halfBelow: 1.5, openTime: '09:00', closeTime: '17:00', needBooking: true },
  '金石滩黄金海岸': { adultPrice: 0, childPrice: 0, freeBelow: 18, halfBelow: 18, openTime: '全天', closeTime: '全天', needBooking: false },
  '大连森林动物园': { adultPrice: 120, childPrice: 60, freeBelow: 1.2, halfBelow: 1.4, openTime: '08:30', closeTime: '16:30', needBooking: false },
  '大连自然博物馆': { adultPrice: 0, childPrice: 0, freeBelow: 18, halfBelow: 18, openTime: '09:00', closeTime: '16:30', needBooking: true },
  '发现王国主题公园': { adultPrice: 260, childPrice: 130, freeBelow: 1.2, halfBelow: 1.5, openTime: '09:30', closeTime: '21:00', needBooking: true },
  '老虎滩海洋公园': { adultPrice: 210, childPrice: 105, freeBelow: 1.2, halfBelow: 1.5, openTime: '08:00', closeTime: '17:00', needBooking: true },
  '北京动物园': { adultPrice: 15, childPrice: 7.5, freeBelow: 1.2, halfBelow: 1.5, openTime: '07:30', closeTime: '18:00', needBooking: false },
  '中国科技馆': { adultPrice: 30, childPrice: 20, freeBelow: 1.2, halfBelow: 1.5, openTime: '09:30', closeTime: '17:00', needBooking: true },
  '自然博物馆': { adultPrice: 0, childPrice: 0, freeBelow: 18, halfBelow: 18, openTime: '09:00', closeTime: '17:00', needBooking: true },
}

const DEFAULT_TICKET = { adultPrice: 50, childPrice: 25, freeBelow: 1.2, halfBelow: 1.5, openTime: '09:00', closeTime: '17:00', needBooking: false }

export async function checkTicketInfo(args: CheckTicketInfoArgs) {
  const info = TICKET_DB[args.attractionName] || { ...DEFAULT_TICKET }

  const childHeight = args.childAge <= 3 ? 0.95 : args.childAge <= 6 ? 1.15 : 1.35
  const isFree = childHeight < info.freeBelow
  const isHalf = childHeight >= info.freeBelow && childHeight < info.halfBelow

  return {
    attraction: args.attractionName,
    childAge: args.childAge,
    estimatedHeight: childHeight,
    ticket: {
      adult: info.adultPrice,
      child: isFree ? 0 : isHalf ? info.childPrice : info.adultPrice,
      childPolicy: isFree ? '免票' : isHalf ? '半价' : '全价',
    },
    hours: `${info.openTime} - ${info.closeTime}`,
    needBooking: info.needBooking,
    tip: info.needBooking ? '需要提前预约，建议提前1天在公众号预约' : '无需预约，现场购票即可',
  }
}
