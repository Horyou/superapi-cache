'use strict'

import readCache from '../../lib/read-cache'
import test from 'blue-tape'
import Request from '../helpers/req'
import debug from 'debug'

const log = debug('readCache')

test('readCache closure', t => {
  const closure = readCache({})

  t.equals(typeof closure, 'function', 'reading from cache should return a closure')
  t.end()
})

test('readCache closure is a promise', t => {
  return new Promise(resolve => {
    const closure = readCache({})

    const p = closure()
      .catch(function (err) {
        // it should throw as this test is only meant to test the closure is returning a Promise
        if (err.reason !== 'cache-miss') {
          throw new Error('Behavior not expected')
        }
      })

    t.ok(p instanceof Promise, 'reading from cache should return a promise')
    resolve()
  })
})

test('readCache cache success', t => {
  const value = {
    expires: 0,
    data: {
      body: {
        responseType: 'text',
        responseText: 'Hello world',
        status: 200,
        statusText: 'OK'
      },
      headers: 'content-type: text/plain'
    }
  }

  const req = new Request()

  return new Promise(resolve => {
    readCache(req, log)(value)
      .then(res => {
        t.equals(res.body, value.data.body.responseText, 'response should be defined')

        resolve()
      })
      .catch(err => {
        // add test in case of error
        t.error(err, 'hydration should not throw')

        resolve()
      })
  })
})

test('readCache cache miss', t => {
  const req = new Request()

  return new Promise(resolve => {
    readCache(req, log)(false)
      .then(res => {
        t.error('response should not be defined on cache miss')

        resolve()
      })
      .catch(err => {
        // add test in case of error
        t.equals(err.reason, 'cache-miss', 'reading from cache should throw on cache miss')

        resolve()
      })
  })
})

test('readCache cache stale', t => {
  const req = new Request()

  const value = {
    expires: -1,
    data: {
      body: {
        responseType: 'text',
        responseText: 'Hello world',
        status: 200,
        statusText: 'OK'
      },
      headers: 'content-type: text/plain'
    }
  }

  return new Promise(resolve => {
    readCache(req, log)(value)
      .then(res => {
        t.error('response should not be defined on cache stale')

        resolve()
      })
      .catch(err => {
        // add test in case of error
        t.equals(err.reason, 'cache-stale', 'reading a stale value from cache should throw')

        resolve()
      })
  })
})
