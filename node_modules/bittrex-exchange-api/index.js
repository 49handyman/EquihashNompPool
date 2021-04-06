const path        = require('path');
const klass       = require('klass');
var Public        = require(path.join(__dirname, 'lib', 'public'));
var Market        = require(path.join(__dirname, 'lib', 'market'));
var Account       = require(path.join(__dirname, 'lib', 'account'));
var api = {};

module.exports = klass(function(options) {
  if (options == undefined) {
    options = {};
  }

  if (options.verbose == undefined) {
    this.verbose = options.verbose;
  } else {
    this.verbose = false;
  }

  api.public   = new Public();
  api.account  = new Account(options);
  api.market   = new Market(options);

}).methods({

  getMarkets: function(then) {
    api.public.getMarkets(then);
  },
  
  getCurrencies: function(then) {
    api.public.getCurrencies(then);
  },
  
  getTicker: function(options, then) {
    api.public.getTickers(options, then)
  },
  
  getMarketSummaries: function(then) {
    api.public.getMarketSummaries(then);
  },
  
  getMarketSummary: function(market, then) {
    api.public.getMarketSummary(market, then);
  },
  
  getOrderbook: function(options, then) {
    api.public.getOrderbook(options, then);
  },
  
  getMarketHistory: function(market, then) {
    api.public.getMarketHistory(market, then);
  },
  
  buy: function(options, then) {
    api.market.buy(options, then);
  },
  
  sell: function(options, then) {
    api.market.sell(options, then);
  },
  
  cancel: function(options, then) {
    api.market.cancel(options, then);
  },
  
  getOpenOrders: function(options, then) {
    api.market.getOpenOrders(options, then);
  },
  
  getBalances: function(then) {
    api.account.getBalances(then); 
  },
  
  getBalance: function(options, then) {
    api.account.getBalance(options, then);
  },
  
  getDepositAddress: function(options, then) {
    api.account.getDepositAddress(options, then);
  },
  
  withdraw: function(currency, then) {
    api.account.withdraw(currency, then);
  },
  
  getOrder: function(uuid, then) {
    api.account.getOrder(uuid, then)
  },
  
  getOrderHistory: function(options, then) {
    api.account.getOrderHistory(options, then);
  },
  
  getWithdrawalHistory: function(options, then) {
    api.account.getWithdrawalHistory(options, then)
  },
  
  getDepositHistory: function(options, then) {
    api.account.getDepositHistory(options, then);
  }

}) 
