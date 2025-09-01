// ==================== 通用响应类型 ====================

/**
 * API响应基础结构
 */
export const ApiResponse = {
  code: 0,
  data: null,
  message: ''
}

// ==================== 用户相关类型 ====================

/**
 * 登录参数接口
 */
export const LoginParams = {
  userAccount: '', // 用户名
  userpassword: '' // 密码
}

/**
 * 登录响应接口
 */
export const LoginRes = {
  code: 0,
  data: {
    age: 0,           // 年龄
    avatar: '',       // 头像
    background: '',   // 背景图
    gender: 0,        // 性别 (0-女 1-男)
    id: 0,           // 主键值
    signature: '',    // 个性签名
    tags: '',        // 标签 (JSON字符串)
    token: '',       // jwt令牌
    userAccount: '', // 账号
    userName: ''     // 用户名
  },
  message: ''
}

/**
 * 用户信息接口
 */
export const UserInfo = {
  id: 0,
  userAccount: '',
  userName: '',
  avatar: '',
  age: 0,
  gender: 0,
  signature: '',
  tags: '',
  background: '',
  createTime: '',
  updateTime: ''
}

/**
 * 更新用户信息参数
 */
export const UpdateUserParams = {
  userName: '',
  avatar: '',
  age: 0,
  gender: 0,
  signature: '',
  tags: '',
  background: ''
}

// ==================== 匹配相关类型 ====================

/**
 * 推荐用户参数
 */
export const RecommendParams = {
  pageNum: 1,
  pageSize: 10,
  minAge: 18,
  maxAge: 50,
  gender: null, // null-不限 0-女 1-男
  distance: 100 // 距离范围(km)
}

/**
 * 推荐用户响应
 */
export const RecommendRes = {
  code: 0,
  data: {
    records: [], // 用户列表
    total: 0,    // 总数
    current: 1,  // 当前页
    size: 10     // 每页大小
  },
  message: ''
}

/**
 * 匹配操作参数
 */
export const MatchParams = {
  targetUserId: 0, // 目标用户ID
  action: 0        // 操作类型 (0-拒绝 1-喜欢 2-超级喜欢)
}

// ==================== 聊天相关类型 ====================

/**
 * 聊天列表响应
 */
export const ChatListRes = {
  code: 0,
  data: [
    {
      id: 0,
      userId: 0,        // 对方用户ID
      userName: '',     // 对方用户名
      avatar: '',       // 对方头像
      lastMessage: '',  // 最后一条消息
      lastMessageTime: '', // 最后消息时间
      unreadCount: 0,   // 未读数量
      isOnline: false   // 是否在线
    }
  ],
  message: ''
}

/**
 * 发送消息参数
 */
export const SendMessageParams = {
  receiverId: 0,    // 接收者ID
  content: '',      // 消息内容
  messageType: 0    // 消息类型 (0-文本 1-图片 2-语音 3-视频)
}

/**
 * 消息记录响应
 */
export const MessageHistoryRes = {
  code: 0,
  data: {
    records: [
      {
        id: 0,
        senderId: 0,      // 发送者ID
        receiverId: 0,    // 接收者ID
        content: '',      // 消息内容
        messageType: 0,   // 消息类型
        createTime: '',   // 发送时间
        isRead: false     // 是否已读
      }
    ],
    total: 0,
    current: 1,
    size: 20
  },
  message: ''
}

// ==================== 动态相关类型 ====================

/**
 * 动态列表参数
 */
export const MomentListParams = {
  pageNum: 1,
  pageSize: 10,
  userId: null // 指定用户ID，null为获取所有动态
}

/**
 * 发布动态参数
 */
export const PublishMomentParams = {
  content: '',      // 动态内容
  images: [],       // 图片列表
  location: ''      // 位置信息
}

/**
 * 动态响应
 */
export const MomentRes = {
  code: 0,
  data: {
    records: [
      {
        id: 0,
        userId: 0,
        userName: '',
        avatar: '',
        content: '',
        images: [],
        location: '',
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
        createTime: ''
      }
    ],
    total: 0,
    current: 1,
    size: 10
  },
  message: ''
}

// ==================== 文件上传类型 ====================

/**
 * 文件上传响应
 */
export const UploadRes = {
  code: 0,
  data: {
    url: '',      // 文件访问URL
    filename: '', // 文件名
    size: 0       // 文件大小
  },
  message: ''
}

// ==================== 工具函数 ====================

/**
 * 解析标签字符串为数组
 * @param {string} tagsStr - 标签JSON字符串
 * @returns {Array} 标签数组
 */
export function parseTags(tagsStr) {
  try {
    // 如果为空或null，返回空数组
    if (!tagsStr) {
      return []
    }

    // 如果已经是数组，直接返回
    if (Array.isArray(tagsStr)) {
      return tagsStr
    }

    // 如果是字符串，尝试不同的解析方式
    if (typeof tagsStr === 'string') {
      // 去除首尾空白
      tagsStr = tagsStr.trim()

      // 尝试JSON解析
      try {
        const parsed = JSON.parse(tagsStr)

        // 如果解析结果是数组，直接返回
        if (Array.isArray(parsed)) {
          return parsed
        }

        // 如果解析结果是对象，提取值作为标签
        if (typeof parsed === 'object' && parsed !== null) {
          return Object.values(parsed).filter(value =>
            typeof value === 'string' && value.trim() !== ''
          )
        }
      } catch (jsonError) {
        // JSON解析失败，尝试其他方式
      }

      // 尝试逗号分隔的字符串
      if (tagsStr.includes(',')) {
        return tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
      }

      // 如果是单个标签，返回包含该标签的数组
      return [tagsStr]
    }

    // 其他情况返回空数组
    return []
  } catch (error) {
    console.error('解析标签失败:', error, '原始数据:', tagsStr)
    return []
  }
}

/**
 * 将标签数组转换为字符串
 * @param {Array} tagsArray - 标签数组
 * @returns {string} 标签JSON字符串
 */
export function stringifyTags(tagsArray) {
  try {
    return JSON.stringify(tagsArray || [])
  } catch (error) {
    console.error('序列化标签失败:', error)
    return '[]'
  }
}

/**
 * 格式化时间
 * @param {string} timeStr - 时间字符串
 * @returns {string} 格式化后的时间
 */
export function formatTime(timeStr) {
  if (!timeStr) return ''
  
  const time = new Date(timeStr)
  const now = new Date()
  const diff = now - time
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return time.toLocaleDateString()
}

/**
 * 获取发送者响应接口
 */
export const GetsenderRes = {
  code: 0,
  data: [
    {
      senderId: 0,    // 发送者ID
      content: '',    // 最近消息内容
      createTime: ''  // 消息创建时间
    }
  ],
  message: ''
}



