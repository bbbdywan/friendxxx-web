import { toApiError, apiErrorMessage } from './apiError.js'

/**
 * 统一错误信息提取（页面 catch 用）。
 * 兼容：axios 错误、ApiError、业务响应对象、AbortError、网络异常。
 *
 * @param {*} error 任意错误
 * @param {string} fallback 兜底文案
 * @returns {string}
 */
export function getApiErrorMessage(error, fallback = '操作失败') {
  return apiErrorMessage(error, fallback)
}

/**
 * 从错误中提取字段错误映射 { field: message }（表单展示用）。
 * @param {*} error
 * @returns {object|null}
 */
export function getApiFieldErrors(error) {
  const e = toApiError(error)
  return e.fieldErrors || null
}
