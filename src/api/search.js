import request from './request.js'

/**
 * search
 * @param {string} query
 * @param {string} type
 * @param {number} page
 * @param {number} size
 * @returns {Promise}
 */
export function search(query, type, page, size) {
  return request.get(`/search?query=${encodeURIComponent(query)}&type=${type}&page=${page}&size=${size}`)
}

/**
 * getnews
 * @returns {Promise}
 */
export function getnews() {
  return request.get(`/search/news`)
}