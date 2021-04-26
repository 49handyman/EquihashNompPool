var TradeOgre = require('~doug/rvn/node_modules/tradeogre-api/index.js')

// Public Methods
//var tradeOgre = new TradeOgre()

//tradeOgre.getMarkets(console.log)
//tradeOgre.getOrderBook('BTC-ARRR', console.log)
//tradeOgre.getTicker('BTC-ARRR', console.log)
//tradeOgre.getTradeHistory('BTC-ARRR', console.log)


// Private Methods
var your_api_key = '';
var  your_api_secret = '';

var tradeOgre = new TradeOgre( your_api_key, your_api_secret )

// tradeOgre.buy('BTC-LTC', 1, 0.00000001, console.log)
// tradeOgre.sell('BTC-LTC', 1, 100, console.log)

// var uuid = ''
// tradeOgre.cancelOrder(uuid, console.log)

tradeOgre.getOrders('BTC-ARRR', console.log)
tradeOgre.getBalance('ARRR', console.log)
