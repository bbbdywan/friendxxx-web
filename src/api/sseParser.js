/**
 * SSE 纯解析函数（无浏览器/config 依赖，可单测）。
 */

/**
 * 解析 SSE 文本行（处理跨 chunk 的半行）。
 * @param {string} buffer 累积的文本缓冲
 * @param {string} chunk   新到达的文本块
 * @returns {{frames: string[], buffer: string}} 完整事件data数组 + 剩余缓冲
 */
export function parseSseBuffer(buffer, chunk) {
  const frames = []
  let combined = buffer + chunk
  // SSE 帧以 \n\n 或 \r\n\r\n 分隔
  const pattern = /\r?\n\r?\n/
  let match
  while ((match = pattern.exec(combined)) !== null) {
    const frame = combined.slice(0, match.index)
    combined = combined.slice(match.index + match[0].length)
    frames.push(frame)
  }
  return { frames, buffer: combined }
}

/**
 * 从单个 SSE 帧中提取 data 行内容（支持多个 data: 行，忽略 : 注释）。
 * @param {string} frame
 * @returns {string} 拼接后的 data 内容（可能为 null）
 */
export function extractSseData(frame) {
  if (!frame) return null
  const dataLines = []
  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }
  if (dataLines.length === 0) return null
  return dataLines.join('\n')
}

/**
 * 将 data 字符串解析为事件对象，供调用方分发。
 */
export function parseSseEvent(data) {
  if (data == null || data === '[DONE]') return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}
