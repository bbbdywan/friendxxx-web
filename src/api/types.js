export function parseTags(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return []

  const text = value.trim()
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
    if (parsed && typeof parsed === 'object') {
      return Object.values(parsed).filter(item => typeof item === 'string' && item.trim())
    }
  } catch {
    // 兼容数据库中的逗号分隔旧数据
  }
  return text.split(',').map(item => item.trim()).filter(Boolean)
}
