'use strict'

import readCache from './read-cache'
import serialize from './serialize'
import memoryStore from './memory'
import exclude from './exclude'

function bypass () {
  return Promise.resolve(null)
}

function cache (config = {}) {
  config.store = config.store || memoryStore
  const key = config.key || cache.key

  config.maxAge = config.maxAge || 0
  config.readCache = config.readCache || readCache
  config.serialize = config.serialize || serialize
  config.clearOnStale = config.clearOnStale !== undefined ? config.clearOnStale : true

  config.exclude = config.exclude || {}
  config.exclude.query = config.exclude.query || true
  config.exclude.paths = config.exclude.paths || []
  config.exclude.filter = null

  config.methods = config.methods || ['get']

  if (config.log !== false) {
    config.log = typeof config.log === 'function' ? config.log : function noop () {}
  }

  return (req, next, service = {}) => {
    if (exclude(req, service, config.exclude)) {
      return bypass()
    }

    const uuid = key(req)
    const options = service.cache || {}

    // clear cache if non supported method
    // Always exclude HEAD (no body to keep in cache)
    const method = req.method.toLowerCase()

    if (method === 'head' || config.methods.indexOf(method) === -1) {
      return bypass()
    }

    const f = () => {
      return next()
        .then(res => {
          const type = res.status / 100 | 0

          // only cache 2xx response
          if (type !== 2) {
            return res
          }

          // exclude binary response from cache
          if (['arraybuffer', 'blob'].indexOf(res.responseType) > -1) {
            return res
          }

          let expiration = config.maxAge === 0 ? 0 : Date.now() + config.maxAge
          const hasServiceExpiration =
            options.expiration !== undefined

          if (hasServiceExpiration) {
            expiration = Date.now() + options.expiration
            config.log('override expiration to use ' + expiration)
          }

          return config.store.setItem(uuid, {
            expires: expiration,
            data: config.serialize(req, res)
          })
        })
    }

    return config.store.getItem(uuid).then(value => {
      return config.readCache(req, config.log)(value)
        .catch(err => {
          // clean up cache if stale
          return config.clearOnStale && err.reason === 'cache-stale' ? config.store.removeItem(uuid).then(f) : f()
        })
    })
  }
}

cache.readCache = readCache
cache.serialize = serialize

cache.key = function (req) {
  return req.url
}

export default cache
