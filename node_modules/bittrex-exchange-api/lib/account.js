const path          = require('path');
const _             = require('underscore');
const Authenticated = require(path.join(__dirname, 'authenticated'));

module.exports = Authenticated.extend(function(options) {
  _.extend(this, options);
  this.api_endpoint = '/api/v1.1/account/';
}).methods({

  getBalances: function(then) {
    this.authenticated({url: this.url('getbalances')}, then)  
  },

  getBalance: function(options, then) {
    this.authenticated({url: this.url('getbalance', options)}, then)  
  },

  getDepositAddress: function(options, then) {
    this.authenticated({url: this.url('getdepositaddress', options)}, then)  
  },

  withdraw: function(options, then) {
    this.authenticated({url: this.url('withdraw', options)}, then)  
  },
  
  getOrder:function(options, then) {
    this.authenticated({url: this.url('getorder', options)}, then)  
  },

  getOrderHistory: function(options, then) {
    if (typeof options == 'function') {
      then = options;
      options = {};
    }
 
    this.authenticated({url: this.url('getorderhistory', options)}, then)  
  },

  getWithdrawalHistory: function(options, then) {
    this.authenticated({url: this.url('getwithdrawalhistory', options)}, then)  
  },

  getDepositHistory: function(options, then) {
    this.authenticated({url: this.url('getdeposithistory', options)}, then)  
  }

}) 

