var assert = require('assert')
var request = require('httpify')
var async = require('async')
var proxyURL;

function handleJSend(callback) {
  return function(err, response) {
    if (err) return callback(err)
    callback(null, response.body)
  }
}

function batchRequest(uri, items, suffix, callback) {
  if(typeof suffix === 'function') {
    callback = suffix
    suffix = null
  }
  items = [].concat(items)

  var itemsPerBatch = 20

  var batches = []
  while(items.length > itemsPerBatch){
    var batch = items.splice(0, itemsPerBatch)
    batches.push(batch)
  }

  if(items.length > 0) batches.push(items)


  var requests = batches.map(function(batch) {
    return function(cb) {
      makeRequest(uri + batch.join(','), suffix, cb)
    }
  })

  var consolidated = []
  async.parallel(requests, function(err, results) {
    if(err) return callback(err)

    results.forEach(function(r) {
      consolidated = consolidated.concat(r)
    })

    callback(null, consolidated)
  })
}

function makeRequest(uri, suffix, callback){
  if(suffix){
    uri +=  '/' + suffix
  }
  
  if(proxyURL) {
    uri = proxyURL + encodeURIComponent(uri)
  }
  console.info("uri: " + uri)
  request({
    uri: uri,
    method: 'GET',
    type: 'json',
    timeout: 20000
  }, handleJSend(callback))
}

function makePostRequest(uri, form, callback){
  if(proxyURL) {
    uri = proxyURL + encodeURIComponent(uri)
  }

  request({
    url: uri,
    method: 'POST',
    type: 'text',
    timeout: 10000,
    form: form
  }, handleJSend(callback))
}

function setProxyURL(url) {
  proxyURL = url
}

module.exports = {
  handleJSend: handleJSend,
  batchRequest: batchRequest,
  makeRequest: makeRequest,
  makePostRequest: makePostRequest,
  setProxyURL: setProxyURL
}
