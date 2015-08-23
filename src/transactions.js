var async = require('async')
var request = require('superagent')
var utils = require('./utils')

function Transactions(url) {
  this.url = url
}

Transactions.prototype.summary = function(txIds, callback) {
  var uri = this.url + "info/"

  utils.batchRequest(uri, txIds, {params: ["output=hivewallet"]}, function(err, data) {
    if(err) return callback(err)

    var results = data.map(function(d) {
      return {
        txId: d.tx,
        blockId: d.blockhash,
        blockHeight: d.block,
        nInputs: d.vins.length,
        nOutputs: d.vouts.length,
        totalInputValue: -getTotalValue(d.vins),
        totalOutputValue: getTotalValue(d.vouts)
      }
    })

    callback(null, Array.isArray(txIds) ? results : results[0])
  })

  function getTotalValue(inputs) {
    if (!inputs) return 0

    return inputs.reduce(function(memo, input) {
      return memo + Math.round(input.amount * 1e8)
    }, 0)
  }
}

Transactions.prototype.get = function(txIds, callback) {
  var uri = this.url

  var queryTxIds = [].concat(txIds)
  utils.batchRequest(uri, queryTxIds, null, function(err, data) {
    if (err) return callback(err)

    var results = data.map(function(d, i) {
      return {
        txId: queryTxIds[i],
        txHex: d,
        blockId: null,
        blockHeight: null,

        // non-standard
        __blockTimestamp: null,
        __confirmations: 33
      }
    })

    callback(null, Array.isArray(txIds) ? results : results[0])
  })
}

Transactions.prototype.propagate = function(rawTxs, callback) {
  var uri = this.url.substring(0,this.url.length - 'rawmultitx/'.length) + 'tx/'

  if(!Array.isArray(rawTxs)) {
    rawTxs = [rawTxs]
  }

  var requests = rawTxs.map(function(txHex) {
    return function(cb) {
      request.post(uri + 'send').send('rawtx=' + txHex).end(function(res) {
      if (!res.ok) return cb(new Error('non-ok http status code'), res)

      var data = {
        tx: res.body.txid
      }

      cb(null, data)
    })
    }
  })

  async.parallel(requests, callback)
}

module.exports = Transactions
