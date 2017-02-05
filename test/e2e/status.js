'use strict'

import test from 'blue-tape'
import { spy } from 'sinon'

import debug from 'debug'
const log = debug('cache')

import superapiCache from '../../lib/index.js'
import MemoryStore from '../../lib/memory.js'

import Request from '../helpers/req'

test('should not cached 1xx reponse', t => {
  return new Promise(resolve => {
    const store = new MemoryStore()

    const options = {
      store: store,
      log: log
    }

    const req = new Request()

    req.method = 'get'
    req.url = '/api/foo'
    req.set('response', {
      body: {
        responseText: '',
        responseType: 'text',
        status: 100,
        statusText: 'OK'
      },
      headers: 'content-type: type/text\ncontent-length: 1234'
    })

    const next = spy(() => {
      return Promise.resolve(req.response())
    })

    return superapiCache(options)(req, next, {})
      .then(data => {
        return store.getItem(req.url)
      })
      .then(data => {
        t.equal(data, null, 'should not have cached response')

        resolve()
      })
      .catch(err => { // eslint-disable-line handle-callback-err
        t.fail('should not throw error')
        resolve()
      })
  })
})
