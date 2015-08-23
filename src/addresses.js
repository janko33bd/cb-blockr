var async = require('async')
var utils = require('./utils')
var bitcoinjs = require('bitcoinjs-lib')

function Addresses(url, txEndpoint) {
  this.url = url
  this.txEndpoint = txEndpoint
}

Addresses.prototype.summary = function(addresses, callback) {
  var uri = this.url

  validateAddresses(addresses, function(err) {
    if(err) return callback(err)

    utils.batchRequest(uri, addresses, null, function(err, data) {
      if(err) return callback(err);

      var results = data.map(function(address) {
        return {
          address: address.addStr,
          balance: address.balance,
          totalReceived: address.totalReceived,
          txCount: address.transactions.length
        }
      })

      callback(null, Array.isArray(addresses) ? results : results[0])
    })
  })
}

Addresses.prototype.transactions = function(addresses, blockHeight, done) {
  // optional blockHeight
  if ('function' === typeof blockHeight) {
    done = blockHeight
    blockHeight = 0
  }

  if (blockHeight > 0) {
    console.warn('blockHeight can be done, but not needed now')
  }

  var url = this.url.substring(0,this.url.length - 'multiaddrs/'.length) + 'addrs/'
  var txIds = {}

  var self = this
  validateAddresses(addresses, function(err) {
    if(err) return done(err)

    async.parallel([
      // confirmed transactions
      function(callback) {
        utils.batchRequest(url, addresses, 'txs', function(err, data) {
          if (err) return callback(err)

          data.forEach(function(address) {
            address.items.forEach(function(tx) {
              txIds[tx.txid] = true
            })
          })

          callback()
        })
      }
    ], function(err) {
      if (err) return done(err)

      self.txEndpoint.get(Object.keys(txIds), done)
    })
  })
}

Addresses.prototype.unspents = function(addresses, callback) {
  var uri = this.url.substring(0,this.url.length - 'multiaddrs/'.length) + 'addrs/'

  validateAddresses(addresses, function(err) {
    if(err) return callback(err)

    utils.batchRequest(uri, addresses, function(err, data) {
      if (err) return callback(err)

      var unspents = [].concat(data)
      var results = unspents.map(function(unspent) {
        return {
          address: unspent.address,
          confirmations: unspent.confirmations,
          vout: unspent.vout,
          txId: unspent.txid,
          value: unspent.amount
        }
      })

      callback(null, results)
    })
  })
}

function validateAddresses(addresses, callback) {
  addresses = [].concat(addresses)
  var invalidAddresses = addresses.filter(function(address) {
    try {
      bitcoinjs.Address.fromBase58Check(address)
    } catch(e) {
      return true
    }
  })

  if(invalidAddresses.length > 0) {
    return callback(new Error("There are " + invalidAddresses.length + " invalid addresses: " + invalidAddresses.join(', ')))
  }

  callback(null)
}

module.exports = Addresses
