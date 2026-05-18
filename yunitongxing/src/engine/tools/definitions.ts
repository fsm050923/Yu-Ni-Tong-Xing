export const AGENT_TOOL_DEFINITIONS = [
  {
    name: 'searchPoi',
    description: '搜索指定位置附近的亲子友好POI，根据孩子年龄筛选合适的目的地',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: '搜索位置，如城市名或经纬度' },
        keyword: { type: 'string', description: '搜索关键词，如"室内""亲子""博物馆"' },
        radius: { type: 'number', description: '搜索半径，单位米' },
        childAge: { type: 'number', description: '孩子年龄' },
      },
      required: ['location', 'childAge'],
    },
  },
  {
    name: 'getWeather',
    description: '获取目的地天气预报，用于判断是否需要生成室内备选方案',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: '目的地城市名' },
        date: { type: 'string', description: '日期 YYYY-MM-DD' },
      },
      required: ['location', 'date'],
    },
  },
  {
    name: 'generateTripPlan',
    description: '根据用户需求生成完整的亲子出行行程方案，包含景点、时间、路线、亲子设施',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: '目的地' },
        date: { type: 'string', description: '出行日期' },
        childAge: { type: 'number', description: '孩子年龄' },
        duration: { type: 'number', description: '出行天数' },
        preferences: { type: 'string', description: '用户偏好描述' },
      },
      required: ['destination', 'childAge'],
    },
  },
  {
    name: 'adjustTrip',
    description: '实时调整当前行程：替换景点、修改时间安排、插入休息节点、删除节点',
    parameters: {
      type: 'object',
      properties: {
        adjustmentType: { type: 'string', enum: ['replace', 'insert', 'delete', 'reschedule'] },
        description: { type: 'string', description: '调整描述' },
        nodeId: { type: 'string', description: '要调整的节点ID' },
      },
      required: ['adjustmentType', 'description'],
    },
  },
  {
    name: 'findNearbyFacility',
    description: '查找当前路线附近的亲子刚需设施：母婴室、儿童饮水处、亲子卫生间等',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number' },
        lng: { type: 'number' },
        facilityType: { type: 'string', enum: ['nursery', 'restroom', 'water-fountain', 'restaurant'] },
        maxDistance: { type: 'number', description: '最大搜索距离，默认200米' },
      },
      required: ['lat', 'lng', 'facilityType'],
    },
  },
  {
    name: 'checkTicketInfo',
    description: '查询景点的儿童票政策、开放时间、是否需要预约',
    parameters: {
      type: 'object',
      properties: {
        attractionName: { type: 'string' },
        childAge: { type: 'number' },
      },
      required: ['attractionName', 'childAge'],
    },
  },
  {
    name: 'generateAlternativePlan',
    description: '根据天气变化自动生成室内备用方案',
    parameters: {
      type: 'object',
      properties: {
        weatherCondition: { type: 'string', enum: ['rainy', 'hot', 'cold', 'storm'] },
        childAge: { type: 'number' },
      },
      required: ['weatherCondition', 'childAge'],
    },
  },
  {
    name: 'suggestRestSpot',
    description: '根据孩子年龄和当前已游玩时长，主动建议附近的休息点',
    parameters: {
      type: 'object',
      properties: {
        childAge: { type: 'number' },
        elapsedMinutes: { type: 'number', description: '已游玩时长(分钟)' },
        lat: { type: 'number' },
        lng: { type: 'number' },
      },
      required: ['childAge', 'elapsedMinutes', 'lat', 'lng'],
    },
  },
  {
    name: 'saveToMemory',
    description: '将用户偏好、孩子信息、出行评价保存到长期记忆',
    parameters: {
      type: 'object',
      properties: {
        memoryType: { type: 'string', enum: ['preference', 'trip_review', 'child_info'] },
        content: { type: 'string' },
      },
      required: ['memoryType', 'content'],
    },
  },
  {
    name: 'queryMemory',
    description: '从记忆系统检索相关历史和偏好，用于个性化规划',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        memoryType: { type: 'string', enum: ['preference', 'trip', 'child'] },
      },
      required: ['query'],
    },
  },
]
