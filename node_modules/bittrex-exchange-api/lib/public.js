const path        = require('path');
const _           = require('underscore');
const HTTP        = require(path.join(__dirname, 'http'));
const querystring = require('querystring');

module.exports = HTTP.extend(function(options) {
  _.extend(this, options);
  this.api_endpoint = '/api/v1.1/public/';
}).methods({

  url: function(method, query) {
    var u = [this.host, this.api_endpoint, method].join('')
    if (query != undefined && _.keys(query).length > 0) {
      u = u + "?"+querystring.stringify(query);
    }
    return u;
  },

  getMarkets: function(then) {
    this.get({url: this.url('getmarkets')}, then);
  },

  getCurrencies: function(then) {
    this.get({url: this.url('getcurrencies')}, then);
  },

  getTickers: function(options, then) {
    if (typeof options == 'function') {
      then = options;
      options = {};
    }
    this.get({url: this.url('gettickers', options)}, then);
  },

  getMarketSummaries: function(then) {
    this.get({url: this.url('getmarketsummaries')}, then);
  },

  getMarketSummary: function(options, then) {
    this.get({url: this.url('getmarketsummary', options)}, then);
  },

  getOrderbook: function(options, then) {
    this.get({url: this.url('getorderbook', options)}, then);
  },

  getMarketHistory: function(options, then) {
    this.get({url: this.url('getmarkethistory', options)}, then);
  }


}) 
