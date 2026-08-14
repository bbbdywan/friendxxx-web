import { describe, it, expect } from 'vitest'
import { parseSseBuffer, extractSseData, parseSseEvent } from '../sseParser.js'

describe('parseSseBuffer', () => {
  it('半个 JSON 跨 chunk 能正确拼接', () => {
    let { frames, buffer } = parseSseBuffer('', 'data: {"type":"delta","data":{"con')
    expect(frames).toEqual([])
    expect(buffer).toContain('con')

    ;({ frames, buffer } = parseSseBuffer(buffer, 'tent":"你好"}}\n\n'))
    expect(frames).toHaveLength(1)
    expect(frames[0]).toContain('你好')
    expect(buffer).toBe('')
  })

  it('一个 chunk 包含多个 SSE 事件', () => {
    const { frames, buffer } = parseSseBuffer('',
      'data: {"type":"delta","data":{"content":"a"}}\n\ndata: {"type":"delta","data":{"content":"b"}}\n\n')
    expect(frames).toHaveLength(2)
    expect(buffer).toBe('')
  })

  it('支持多行 data:', () => {
    const { frames } = parseSseBuffer('',
      'data: line1\ndata: line2\n\n')
    expect(frames).toHaveLength(1)
    expect(extractSseData(frames[0])).toBe('line1\nline2')
  })

  it('中文内容跨 chunk 不丢字符', () => {
    let { frames, buffer } = parseSseBuffer('', 'data: {"content":"你')
    expect(frames).toEqual([])
    ;({ frames, buffer } = parseSseBuffer(buffer, '好"}\n\n'))
    expect(frames).toHaveLength(1)
    expect(frames[0]).toContain('你好')
  })

  it('支持 CRLF 分隔', () => {
    const { frames, buffer } = parseSseBuffer('', 'data: {"a":1}\r\n\r\n')
    expect(frames).toHaveLength(1)
    expect(buffer).toBe('')
  })

  it('忽略心跳注释行', () => {
    const frame = ': keepalive\ndata: {"type":"done"}\n\n'
    const { frames } = parseSseBuffer('', frame)
    expect(frames).toHaveLength(1)
    expect(extractSseData(frames[0])).toBe('{"type":"done"}')
  })
})

describe('extractSseData', () => {
  it('提取 data: 前缀内容', () => {
    expect(extractSseData('data: {"a":1}')).toBe('{"a":1}')
  })

  it('返回 null 当无 data 行', () => {
    expect(extractSseData('event: ping')).toBeNull()
    expect(extractSseData('')).toBeNull()
    expect(extractSseData(null)).toBeNull()
  })

  it('处理 [DONE]', () => {
    expect(extractSseData('data: [DONE]')).toBe('[DONE]')
  })
})

describe('parseSseEvent', () => {
  it('解析 JSON 事件', () => {
    expect(parseSseEvent('{"type":"delta","data":{"content":"x"}}').type).toBe('delta')
  })

  it('忽略 [DONE] 与非法 JSON', () => {
    expect(parseSseEvent('[DONE]')).toBeNull()
    expect(parseSseEvent('not json')).toBeNull()
    expect(parseSseEvent(null)).toBeNull()
  })
})
