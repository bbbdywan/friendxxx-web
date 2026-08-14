import request from './request.js'

export const getnews = () => request.get('/search/news')
