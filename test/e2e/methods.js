'use strict'

import test from 'blue-tape'
import { spy } from 'sinon'

import debug from 'debug'
const log = debug('cache')

import superapiCache from '../../lib/index.js'
import MemoryStore from '../../lib/memory.js'
import hydrate from '../../lib/hydrate.js'

import Request from '../helpers/req'

test('ignore cache for non supported method', t => {
  return new Promise(resolve => {
    const fixtures = require('../fixtures/hello')
    const options = {
      store: new MemoryStore(),
      log: log,
      wrappedData: false
    }

    const req = new Request()

    req.method = 'post'
    req.url = '/api/foo'
    req.xhr = hydrate(fixtures.data)

    const fetchNetwork = spy(req, 'response')
    const next = () => {
      return Promise.resolve(req.response())
    }

    return superapiCache(options)(req, next, {})
      .then(res => {
        t.equal(res, null, 'should have no response in cache')
        return next()
      })
      .then(res => {
        t.ok(fetchNetwork.called, 'should fetch response from network')
        t.equal(fixtures.data.body.status, res.status, 'should retrieve the status from network')
        t.equal(fixtures.data.body.responseText, res.responseText, 'should retrieve the response text from network')

        return options.store.getItem(req.url)
      })
      .then(data => {
        t.equal(data, null, 'should not have cached response')

        req.response.restore()

        resolve()
      })
      .catch(err => { // eslint-disable-line handle-callback-err
        t.fail('should not throw error')

        req.response.restore()
        resolve()
      })
  })
})

test('should use cache for supported methods', t => {
  return new Promise(resolve => {
    const fixtures = require('../fixtures/hello')
    const store = new MemoryStore()

    store._store['/api/foo'] = fixtures

    const options = {
      store: store,
      methods: ['get', 'post'],
      wrappedData: false
    }

    const next = spy(() => {
      return Promise.resolve()
    })

    const req = new Request()

    req.method = 'post'
    req.url = '/api/foo'

    return superapiCache(options)(req, next, {})
      .then(res => {
        t.notOk(next.called, 'next should not be called')
        t.equal(fixtures.data.body.status, res.status, 'should retrieve the same status from cache')
        t.equal(fixtures.data.body.responseText, res.responseText, 'should retrieve the same responseText from cache')

        return options.store.getItem(req.url)
      })
      .then(res => {
        t.equal(res.data, fixtures.data, 'should have cached response')

        resolve()
      })
      .catch(err => { // eslint-disable-line handle-callback-err
        t.fail('should not throw error')

        req.response.restore()
        resolve()
      })
  })
})
