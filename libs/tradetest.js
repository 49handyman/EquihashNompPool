// Sample public call
var TradeOgre = require('tradeogre-api');
var tradeOgre = new TradeOgre();

tradeOgre.getMarkets( function(err, resp) {
  if (!err) {
    console.log(resp.body)
  } else {
    console.log(err)
  }
});
/*
// Sample private call
var TradeOgre = require('tradeogre-api');
var tradeOgre = new TradeOgre( '8e523ad4519d2855c1a694ac4d418abb', '48512b86064206001395a7d7bb1e68d3' );

tradeOgre.getBalance('BTC', function(err, resp) {
  if (!err) {
    console.log(resp.body)
  } else {
    console.log(err)
  }
});
tradeOgre.getOrders('BTC-ARRR', function(err, resp) {
    if (!err) {
      console.log(resp.body)
    } else {
      console.log(err)
    }
  });

  */