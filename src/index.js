var assert = require('assert')

var Addresses = require('./addresses')
var Blocks = require('./blocks')
var Transactions = require('./transactions')
var utils = require('./utils')

var NETWORKS = {
  testnet: "tbtc",
  bitcoin: "btc",
  blackcoin: "blk",
  litecoin: "ltc"
}

function Blockr(network, proxyURL) {
  network = network || 'blackcoin'
  assert(network in NETWORKS, 'Unknown network: ' + network)
  var BASE_URL = 'http://localhost:3000/api/'

  // end points
  this.transactions = new Transactions(BASE_URL + 'rawmultitx/')
  this.addresses = new Addresses(BASE_URL + 'multiaddrs/', this.transactions)
  this.blocks = new Blocks(BASE_URL + 'blockheader/', this.transactions)

  this.network = network

  utils.setProxyURL(proxyURL)
  this.proxyURL = proxyURL
}

Blockr.Addresses = Addresses
Blockr.Blocks = Blocks
Blockr.Transactions = Transactions

Blockr.prototype.getNetwork = function() { return this.network }
Blockr.prototype.getProxyURL = function() { return this.proxyURL }

module.exports = Blockr
