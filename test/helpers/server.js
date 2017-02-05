import { fakeServer } from 'sinon'

export default const {
  setup: () => {
    this.server = fakeServer.create()
  },

  add: (method, path, body, status = 404, headers = {}) => {
    this.server.respondWith(method, path, [
      status, headers, body
    ])
  },

  get: (path, body) => {
    this.server.respondWith('GET', path, body)
  },

  post: (path, body) => {
    this.server.respondWith('POST', path, body)
  },

  put: (path, body) => {
    this.server.respondWith('PUT', path, body)
  },

  delete: (path) => {
    this.server.respondWith('DELETE', path)
  },

  respond: () => {
    this.server.respond()
  },

  destroy: () => {
    this.server.restore()
  }
}
