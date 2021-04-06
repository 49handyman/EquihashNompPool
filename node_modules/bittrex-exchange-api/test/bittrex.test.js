var path    = require('path');
var mockery = require('mockery');
var should  = require('chai').should();
var request = require('request-mockery');
var assert  = require('assert');
var _       = require('underscore');
const url   = require('url');
const querystring = require('querystring');

describe('Bittrex', function() {
    var Bittrex, keys;
    before(function(){
      mockery.enable({
	warnOnReplace: false,
	warnOnUnregistered: false,
	useCleanCache: true
      });
      // request.verbosity(true)
      mockery.registerMock('request', request);
      keys = {
        "key": "test",
        "secret": "test"
      }
      Bittrex = require(path.join(__dirname, '..', 'index'));
      
    });

  after(function(){
    mockery.disable();
  }); 

  describe('Public', function() {
    it('getmarkets', function(done) {
      
      var bittrex = new Bittrex(keys)
      bittrex.getMarkets(function(err, result) {
        assert.equal(result.method, 'GET');
        assert.equal(result.url, 'https://bittrex.com/api/v1.1/public/getmarkets')
        done();
      })
    });
    it('getcurrencies', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.getCurrencies(function(err, result) {
        assert.equal(result.method, 'GET');
        assert.equal(result.url, 'https://bittrex.com/api/v1.1/public/getcurrencies')
        done();
      })
    });
    it('getticker', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.getTicker(function(err, result) {
        assert.equal(result.method, 'GET');
        assert.equal(result.url, 'https://bittrex.com/api/v1.1/public/gettickers')
        done();
      })
    });
    it('getmarketsummaries', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.getMarketSummaries(function(err, result) {
        assert.equal(result.method, 'GET');
        assert.equal(result.url, 'https://bittrex.com/api/v1.1/public/getmarketsummaries')
        done();
      })
   
    });
    it('getmarketsummary', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.getMarketSummary({market: 'ETH-BTC'}, function(err, result) {
        assert.equal(result.method, 'GET');
        assert.equal(result.url, 'https://bittrex.com/api/v1.1/public/getmarketsummary?market=ETH-BTC')
        done();
      })   
    });
    it('getorderbook', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.getOrderbook({market: 'ETH-BTC'}, function(err, result) {
        assert.equal(result.method, 'GET');
        assert.equal(result.url, 'https://bittrex.com/api/v1.1/public/getorderbook?market=ETH-BTC')
        done();
      })   
    });
    it('getmarkethistory', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.getMarketHistory({market: 'ETH-BTC'}, function(err, result) {
        assert.equal(result.method, 'GET');
        assert.equal(result.url, 'https://bittrex.com/api/v1.1/public/getmarkethistory?market=ETH-BTC')
        done();
      })   
    });
  });

  describe('Market', function() {
    it('buylimit', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.buy({market: 'ETH-BTC', quantity: 1, rate: 0.115}, function(err, result) {
        assert.equal(result.method, 'GET');
        var parsed = {};
        parsed.url = url.parse(result.url);
        parsed.query = querystring.parse(parsed.url.query);
        assert.equal(parsed.url.pathname, '/api/v1.1/market/buylimit')
        assert.equal(parsed.query.market, 'ETH-BTC');
        assert.equal(parsed.query.quantity, '1');
        assert.equal(parsed.query.rate, '0.115');
        assert.equal(parsed.query.apikey, 'test');       
        assert.equal(_.first(_.keys(result.headers)), 'apisign');
        done();
      })   
    });
    it('selllimit', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.sell({market: 'ETH-BTC', quantity: 1, rate: 0.115}, function(err, result) {
        assert.equal(result.method, 'GET');
        var parsed = {};
        parsed.url = url.parse(result.url);
        parsed.query = querystring.parse(parsed.url.query);
        assert.equal(parsed.url.pathname, '/api/v1.1/market/selllimit')
        assert.equal(parsed.query.market, 'ETH-BTC');
        assert.equal(parsed.query.quantity, '1');
        assert.equal(parsed.query.rate, '0.115');
        assert.equal(parsed.query.apikey, 'test');       
 
        assert.equal(_.first(_.keys(result.headers)), 'apisign');
        done();
      })   
    });
    it('cancel', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.cancel({uuid: 'test'}, function(err, result) {
        assert.equal(result.method, 'GET');
        var parsed = {};
        parsed.url = url.parse(result.url);
        parsed.query = querystring.parse(parsed.url.query);
        assert.equal(parsed.url.pathname, '/api/v1.1/market/cancel')
        assert.equal(parsed.query.uuid, 'test');
        assert.equal(parsed.query.apikey, 'test');       
        assert.equal(_.first(_.keys(result.headers)), 'apisign');
        done();
      })   
    });
    it('getopenorders', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.getOpenOrders(function(err, result) {
        assert.equal(result.method, 'GET');
        var parsed = {};
        parsed.url = url.parse(result.url);
        parsed.query = querystring.parse(parsed.url.query);
        assert.equal(parsed.url.pathname, '/api/v1.1/market/getopenorders')
        assert.equal(parsed.query.apikey, 'test');       
        assert.equal(_.first(_.keys(result.headers)), 'apisign');
        done();
      })   
    });
  
  });

  describe('Account', function() {
    it('getbalances', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.getBalances(function(err, result) {
        assert.equal(result.method, 'GET');
        var parsed = {};
        parsed.url = url.parse(result.url);
        parsed.query = querystring.parse(parsed.url.query);
        assert.equal(parsed.query.apikey, 'test');              
        assert.equal(parsed.url.pathname, '/api/v1.1/account/getbalances')
        assert.equal(_.first(_.keys(result.headers)), 'apisign');
        done();
      })   
    });
    it('getbalance', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.getBalance({currency: 'ETH'}, function(err, result) {
        assert.equal(result.method, 'GET');
        var parsed = {};
        parsed.url = url.parse(result.url);
        parsed.query = querystring.parse(parsed.url.query);
        assert.equal(parsed.url.pathname, '/api/v1.1/account/getbalance')       
        assert.equal(parsed.query.currency, 'ETH');
        assert.equal(parsed.query.apikey, 'test');              
        assert.equal(_.first(_.keys(result.headers)), 'apisign');
        done();
      })   
    });
    it('getdepositaddress', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.getDepositAddress({currency: 'ETH'}, function(err, result) {
        assert.equal(result.method, 'GET');
        var parsed = {};
        parsed.url = url.parse(result.url);
        parsed.query = querystring.parse(parsed.url.query);
        assert.equal(parsed.url.pathname, '/api/v1.1/account/getdepositaddress')       
        assert.equal(parsed.query.currency, 'ETH');
        assert.equal(parsed.query.apikey, 'test');              
        assert.equal(_.first(_.keys(result.headers)), 'apisign');
        done();
      })  
      
    });
    it('withdraw', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.withdraw({currency: 'ETH', quantity: 1, address: 'test_address'}, function(err, result) {
        assert.equal(result.method, 'GET');
        var parsed = {};
        parsed.url = url.parse(result.url);
        parsed.query = querystring.parse(parsed.url.query);
        assert.equal(parsed.url.pathname, '/api/v1.1/account/withdraw')       
        assert.equal(parsed.query.currency, 'ETH');
        assert.equal(parsed.query.quantity, '1');
        assert.equal(parsed.query.address, 'test_address');  
        assert.equal(parsed.query.apikey, 'test');       
        assert.equal(_.first(_.keys(result.headers)), 'apisign');
        done();
      }) 
    });
    it('getorder', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.getOrder({uuid: 'test'}, function(err, result) {
        assert.equal(result.method, 'GET');
        var parsed = {};
        parsed.url = url.parse(result.url);
        parsed.query = querystring.parse(parsed.url.query);
        assert.equal(parsed.url.pathname, '/api/v1.1/account/getorder')       
        assert.equal(parsed.query.uuid, 'test');
        assert.equal(parsed.query.apikey, 'test');       
        assert.equal(_.first(_.keys(result.headers)), 'apisign');
        done();
      }) 
    });
    it('getorderhistory', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.getOrderHistory({market: 'test'}, function(err, result) {
        assert.equal(result.method, 'GET');
        var parsed = {};
        parsed.url = url.parse(result.url);
        parsed.query = querystring.parse(parsed.url.query);
        assert.equal(parsed.url.pathname, '/api/v1.1/account/getorderhistory')       
        assert.equal(parsed.query.market, 'test');
        assert.equal(parsed.query.apikey, 'test');       
        assert.equal(_.first(_.keys(result.headers)), 'apisign');
        done();
      }) 
    });
    it('getwithdrawalhistory', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.getWithdrawalHistory({currency: 'test'}, function(err, result) {
        assert.equal(result.method, 'GET');
        var parsed = {};
        parsed.url = url.parse(result.url);
        parsed.query = querystring.parse(parsed.url.query);
        assert.equal(parsed.url.pathname, '/api/v1.1/account/getwithdrawalhistory')       
        assert.equal(parsed.query.currency, 'test');
        assert.equal(parsed.query.apikey, 'test');       
        assert.equal(_.first(_.keys(result.headers)), 'apisign');
        done();
      }) 
    });
    it('getdeposithistory', function(done) {
      var bittrex = new Bittrex(keys)
      bittrex.getDepositHistory({currency: 'test'}, function(err, result) {
        assert.equal(result.method, 'GET');
        var parsed = {};
        parsed.url = url.parse(result.url);
        parsed.query = querystring.parse(parsed.url.query);
        assert.equal(parsed.url.pathname, '/api/v1.1/account/getdeposithistory')       
        assert.equal(parsed.query.currency, 'test');
        assert.equal(parsed.query.apikey, 'test');       
        assert.equal(_.first(_.keys(result.headers)), 'apisign');
        done();
      }) 
    });










  });
});
