import hydrate from './hydrate'

function noop () {}

export default function (req, log) {
  const logger = log || noop

  return function (value) {
    return new Promise((resolve, reject) => {
      if (!value || !value.data) {
        logger('cache-miss', req.url)
        const error = new Error()

        error.reason = 'cache-miss'
        error.message = 'Value not found from cache'
        return reject(error)
      }

      const { expires, data } = value

      if (expires !== 0 && (expires < Date.now())) {
        logger('cache-stale', req.url)
        const error = new Error()

        error.reason = 'cache-stale'
        error.message = 'Value is stale'
        return reject(error)
      }

      // hydrate pseudo xhr from cached value
      req.xhr = hydrate(data)

      // override request end callback
      req.callback = (err, res) => {
        logger('cache-hit', req.url)

        if (err) {
          return reject(err, res)
        }

        resolve(res)
      }

      req.emit('end')
    })
  }
}
