const path          = require('path');
const _             = require('underscore');
const Authenticated = require(path.join(__dirname, 'authenticated'));

module.exports = Authenticated.extend(function(options) {
  _.extend(this, options);
  this.api_endpoint = '/api/v1.1/market/';
}).methods({

  buy: function(options, then) {
    this.authenticated({url: this.url('buylimit', options)}, then)  
  },

  sell: function(options, then) {
    this.authenticated({url: this.url('selllimit', options)}, then)  
  },

  cancel: function(options, then) {
    this.authenticated({url: this.url('cancel', options)}, then)  
  },

  getOpenOrders: function(options, then) {
    if (typeof options == 'function') {
      then = options;
      options = {};
    }
    
    this.authenticated({url: this.url('getopenorders', options)}, then)  
  }
  

}) 

