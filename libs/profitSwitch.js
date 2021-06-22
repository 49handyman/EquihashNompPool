var async = require('async');
var net = require('net');
var bignum = require('bignum');
var algos = require('stratum-pool/lib/algoProperties.js');
var util = require('stratum-pool/lib/util.js');
require('dotenv').config();
const tradeOgre_api_key = process.env.tradeOgre_api_key
const tradeOgre_api_secret = process.env.tradeOgre_api_secret
const bittrex_api_key = process.env.bittrex_api_key
const bittrex_api_secret = process.env.bittrex_api_secret
const poloniex_api_key = process.env.poloniex_api_key
const poloniex_api_secret = process.env.poloniex_api_secret



var Poloniex = require('./apiPoloniex.js');
//var tradeOgre = require('./apiTradeOgre.js');
var TradeOgre = require('tradeogre-api');
var Bittrex = require('./apiBittrex.js');
var Stratum = require('stratum-pool');

var PoolLogger = require('./logUtil.js');

const loggerFactory = require('./logger.js');
let componentStr = `ProfitSwitch`;
let logger = loggerFactory.getLogger(componentStr, 'system');

module.exports = function() {
//logger.debug('profit swtich called')
    var _this = this;
    var portalConfig = JSON.parse(process.env.portalConfig);
    var poolConfigs = JSON.parse(process.env.pools);

    //
    // build status tracker for collecting coin market information
    //
    var profitStatus = {};
    var symbolToAlgorithmMap = {};
    Object.keys(poolConfigs).forEach(function(coin) {

        var poolConfig = poolConfigs[coin];
        var algo = poolConfig.coin.algorithm;

        if (!profitStatus.hasOwnProperty(algo)) {
            profitStatus[algo] = {};
        }
        var coinStatus = {
            name: poolConfig.coin.name,
            symbol: poolConfig.coin.symbol,
            difficulty: 0,
            reward: 0,
            exchangeInfo: {}
        };
  //      logger.debug('coinStatus: '+JSON.stringify(coinStatus))
        profitStatus[algo][poolConfig.coin.symbol] = coinStatus;
        symbolToAlgorithmMap[poolConfig.coin.symbol] = algo;
  //      logger.debug('algo: '+JSON.stringify(algo))
    });


    //
    // ensure we have something to switch
    //
    Object.keys(profitStatus).forEach(function(algo) {
        if (Object.keys(profitStatus[algo]).length <= 1) {
  //          logger.debug('profitStatus[algo]: '+JSON.stringify(profitStatus[algo]))
            delete profitStatus[algo];
            Object.keys(symbolToAlgorithmMap).forEach(function(symbol) {
  //              logger.debug('symbolToAlgorithmMap[symbol] : '+JSON.stringify(symbolToAlgorithmMap[symbol] ))
                if (symbolToAlgorithmMap[symbol] === algo)
                    delete symbolToAlgorithmMap[symbol];
            });
        }
    });
    if (Object.keys(profitStatus).length == 0) {
//        logger.error('Config, No alternative coins to switch to in current config, switching disabled.');
//        logger.error('profitStatus keys called...' + JSON.stringify(profitStatus))
        return;
    }
// Helper methods
function joinCurrencies(currencyA, currencyB) {
    return currencyA + '-' + currencyB;
}

    // 
    // setup APIs
    //
    var poloApi = new Poloniex(
         poloniex_api_key,
         poloniex_api_secret
    );
  
    var tradeOgreApi = new TradeOgre(
        tradeOgre_api_key,
        tradeOgre_api_secret
    );

    var bittrexApi = new Bittrex(
        bittrex_api_key,
        bittrex_api_secret
    );
//    logger.debug('profitSwitch Called...');
    // 
    // market data collection from Poloniex
    //
    this.getProfitDataPoloniex = function(callback) {
        async.series([
            function(taskCallback) {
                poloApi.getTicker(function(err, data) {
//                    logger.debug('getProfitDataPoloniex called...'+err)
                    if (err) {
                        taskCallback(err);
                        return;
                    }

                    Object.keys(symbolToAlgorithmMap).forEach(function(symbol) {
                        var exchangeInfo = profitStatus[symbolToAlgorithmMap[symbol]][symbol].exchangeInfo;
//                        logger.debug('exchangeInfo called...'+JSON.stringify(exchangeInfo))
                        if (!exchangeInfo.hasOwnProperty('Poloniex'))
                            exchangeInfo['Poloniex'] = {};
                        var marketData = exchangeInfo['Poloniex'];

                        if (data.hasOwnProperty('BTC_' + symbol)) {
                            if (!marketData.hasOwnProperty('BTC'))
                                marketData['BTC'] = {};

                            var btcData = data['BTC_' + symbol];
                            marketData['BTC'].ask = new Number(btcData.lowestAsk);
                            marketData['BTC'].bid = new Number(btcData.highestBid);
                            marketData['BTC'].last = new Number(btcData.last);
                            marketData['BTC'].baseVolume = new Number(btcData.baseVolume);
                            marketData['BTC'].quoteVolume = new Number(btcData.quoteVolume);
                        }
                        if (data.hasOwnProperty('LTC_' + symbol)) {
                            if (!marketData.hasOwnProperty('LTC'))
                                marketData['LTC'] = {};

                            var ltcData = data['LTC_' + symbol];
                            marketData['LTC'].ask = new Number(ltcData.lowestAsk);
                            marketData['LTC'].bid = new Number(ltcData.highestBid);
                            marketData['LTC'].last = new Number(ltcData.last);
                            marketData['LTC'].baseVolume = new Number(ltcData.baseVolume);
                            marketData['LTC'].quoteVolume = new Number(ltcData.quoteVolume);
                        }
                        // save LTC to BTC exchange rate
                        if (marketData.hasOwnProperty('LTC') && data.hasOwnProperty('BTC_LTC')) {
                            var btcLtc = data['BTC_LTC'];
                            marketData['LTC'].ltcToBtc = new Number(btcLtc.highestBid);
                        }
                    });

                    taskCallback();
                });
            },
            function(taskCallback) {
                var depthTasks = [];
                Object.keys(symbolToAlgorithmMap).forEach(function(symbol) {
                    var marketData = profitStatus[symbolToAlgorithmMap[symbol]][symbol].exchangeInfo['Poloniex'];
                    if (marketData.hasOwnProperty('BTC') && marketData['BTC'].bid > 0) {
                        depthTasks.push(function(callback) {
                            _this.getMarketDepthFromPoloniex('BTC', symbol, marketData['BTC'].bid, callback)
                        });
                    }
                    if (marketData.hasOwnProperty('LTC') && marketData['LTC'].bid > 0) {
                        depthTasks.push(function(callback) {
                            _this.getMarketDepthFromPoloniex('LTC', symbol, marketData['LTC'].bid, callback)
                        });
                    }
                });

                if (!depthTasks.length) {
                    taskCallback();
                    return;
                }
                async.series(depthTasks, function(err) {
                    if (err) {
                        taskCallback(err);
                        return;
                    }
                    taskCallback();
                });
            }
        ], function(err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });

    };
    this.getMarketDepthFromPoloniex = function(symbolA, symbolB, coinPrice, callback) {
        poloApi.getOrderBook(symbolA, symbolB, function(err, data) {
//            logger.debug('getMarketDepthFromPoloniex called...'+err)
            if (err) {
                callback(err);
                return;
            }
            var depth = new Number(0);
            var totalQty = new Number(0);
            if (data.hasOwnProperty('bids')) {
                data['bids'].forEach(function(order) {
                    var price = new Number(order[0]);
                    var limit = new Number(coinPrice * portalConfig.profitSwitch.depth);
                    var qty = new Number(order[1]);
                    // only measure the depth down to configured depth
                    if (price >= limit) {
                        depth += (qty * price);
                        totalQty += qty;
                    }
                });
            }

            var marketData = profitStatus[symbolToAlgorithmMap[symbolB]][symbolB].exchangeInfo['Poloniex'];
            marketData[symbolA].depth = depth;
            if (totalQty > 0)
                marketData[symbolA].weightedBid = new Number(depth / totalQty);
            callback();
        });
    };



    this.getProfitDatatradeOgre = function(callback) {
//        logger.debug('getProfitData tradeOgre called...')
        async.series([
            function(taskCallback) {
                tradeOgreApi.getTicker(joinCurrencies(symbolA,symbolB), function(err, response) {
//                    logger.debug('tradeOgre getTicker called...'+err+response)
                    if (err || !response.result) {
                        taskCallback(err);
                        return;
                    }

                    Object.keys(symbolToAlgorithmMap).forEach(function(symbol) {
                        response.result.forEach(function(market) {
                            var exchangeInfo = profitStatus[symbolToAlgorithmMap[symbol]][symbol].exchangeInfo;
                            if (!exchangeInfo.hasOwnProperty('tradeOgre'))
                                exchangeInfo['tradeOgre'] = {};
                            var marketData = exchangeInfo['tradeOgre'];
                            var marketPair = market.MarketName.match(/([\w]+)-([\w-_]+)/)
                            market.exchange = marketPair[1]
                            market.code = marketPair[2]
                            if (market.exchange == 'BTC' && market.code == symbol) {
                                if (!marketData.hasOwnProperty('BTC'))
                                    marketData['BTC'] = {};

                                marketData['BTC'].last = new Number(market.Last);
                                marketData['BTC'].baseVolume = new Number(market.BaseVolume);
                                marketData['BTC'].quoteVolume = new Number(market.BaseVolume / market.Last);
                                marketData['BTC'].ask = new Number(market.Ask);
                                marketData['BTC'].bid = new Number(market.Bid);
                            }

                            if (market.exchange == 'LTC' && market.code == symbol) {
                                if (!marketData.hasOwnProperty('LTC'))
                                    marketData['LTC'] = {};

                                marketData['LTC'].last = new Number(market.Last);
                                marketData['LTC'].baseVolume = new Number(market.BaseVolume);
                                marketData['LTC'].quoteVolume = new Number(market.BaseVolume / market.Last);
                                marketData['LTC'].ask = new Number(market.Ask);
                                marketData['LTC'].bid = new Number(market.Bid);
                            }

                        });
                    });
                    taskCallback();
                });
            },
            function(taskCallback) {
                var depthTasks = [];
                Object.keys(symbolToAlgorithmMap).forEach(function(symbol) {
                    var marketData = profitStatus[symbolToAlgorithmMap[symbol]][symbol].exchangeInfo['tradeOgre'];
                    if (marketData.hasOwnProperty('BTC') && marketData['BTC'].bid > 0) {
                        depthTasks.push(function(callback) {
                            _this.getMarketDepthFromBittrex('BTC', symbol, marketData['BTC'].bid, callback)
                        });
                    }
                    if (marketData.hasOwnProperty('LTC') && marketData['LTC'].bid > 0) {
                        depthTasks.push(function(callback) {
                            _this.getMarketDepthFromBittrex('LTC', symbol, marketData['LTC'].bid, callback)
                        });
                    }
                });

                if (!depthTasks.length) {
                    taskCallback();
                    return;
                }
                async.series(depthTasks, function(err) {
                    if (err) {
                        taskCallback(err);
                        return;
                    }
                    taskCallback();
                });
            } 
        ], function(err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });
    };
    this.getMarketDepthFromtradeOgre = function(symbolA, symbolB, coinPrice, callback) {

        tradeOgreApi.getOrderBook(joinCurrencies(symbolA,symbolB), function(err, response) {
//            logger.debug('tradeOgre  getOrderBook called...'+err + response)
            if (err) {
                callback(err);
                return;
            }
            var depth = new Number(0);
            if (response.hasOwnProperty('result')) {
                var totalQty = new Number(0);
                response['result'].forEach(function(order) {
                    var price = new Number(order.Rate);
                    var limit = new Number(coinPrice * portalConfig.profitSwitch.depth);
                    var qty = new Number(order.Quantity);
                    // only measure the depth down to configured depth
                    if (price >= limit) {
                        depth += (qty * price);
                        totalQty += qty;
                    }
                });
            }

            var marketData = profitStatus[symbolToAlgorithmMap[symbolB]][symbolB].exchangeInfo['tradeOgre'];
            marketData[symbolA].depth = depth;
            if (totalQty > 0)
                marketData[symbolA].weightedBid = new Number(depth / totalQty);
            callback();
        });
    };

   

    this.getProfitDataBittrex = function(callback) {
  //      logger.debug('getProfitDataBittrex called...')
        async.series([
            function(taskCallback) {
                bittrexApi.getTicker(function(err, response) {
//                    logger.debug('getProfitDataBittrex called...'+JSON.stringify(err))
                    if (err || !response.result) {
                        taskCallback(err);
                        return;
                    }

                    Object.keys(symbolToAlgorithmMap).forEach(function(symbol) {
                        response.result.forEach(function(market) {
                            var exchangeInfo = profitStatus[symbolToAlgorithmMap[symbol]][symbol].exchangeInfo;
                            if (!exchangeInfo.hasOwnProperty('Bittrex'))
                                exchangeInfo['Bittrex'] = {};
                            var marketData = exchangeInfo['Bittrex'];
                            var marketPair = market.MarketName.match(/([\w]+)-([\w-_]+)/)
                            market.exchange = marketPair[1]
                            market.code = marketPair[2]
                            if (market.exchange == 'BTC' && market.code == symbol) {
                                if (!marketData.hasOwnProperty('BTC'))
                                    marketData['BTC'] = {};

                                marketData['BTC'].last = new Number(market.Last);
                                marketData['BTC'].baseVolume = new Number(market.BaseVolume);
                                marketData['BTC'].quoteVolume = new Number(market.BaseVolume / market.Last);
                                marketData['BTC'].ask = new Number(market.Ask);
                                marketData['BTC'].bid = new Number(market.Bid);
                            }

                            if (market.exchange == 'LTC' && market.code == symbol) {
                                if (!marketData.hasOwnProperty('LTC'))
                                    marketData['LTC'] = {};

                                marketData['LTC'].last = new Number(market.Last);
                                marketData['LTC'].baseVolume = new Number(market.BaseVolume);
                                marketData['LTC'].quoteVolume = new Number(market.BaseVolume / market.Last);
                                marketData['LTC'].ask = new Number(market.Ask);
                                marketData['LTC'].bid = new Number(market.Bid);
                            }

                        });
                    });
                    taskCallback();
                });
            },
            function(taskCallback) {
                var depthTasks = [];
                Object.keys(symbolToAlgorithmMap).forEach(function(symbol) {
                    var marketData = profitStatus[symbolToAlgorithmMap[symbol]][symbol].exchangeInfo['Bittrex'];
                    if (marketData.hasOwnProperty('BTC') && marketData['BTC'].bid > 0) {
                        depthTasks.push(function(callback) {
                            _this.getMarketDepthFromBittrex('BTC', symbol, marketData['BTC'].bid, callback)
                        });
                    }
                    if (marketData.hasOwnProperty('LTC') && marketData['LTC'].bid > 0) {
                        depthTasks.push(function(callback) {
                            _this.getMarketDepthFromBittrex('LTC', symbol, marketData['LTC'].bid, callback)
                        });
                    }
                });

                if (!depthTasks.length) {
                    taskCallback();
                    return;
                }
                async.series(depthTasks, function(err) {
                    if (err) {
                        taskCallback(err);
                        return;
                    }
                    taskCallback();
                });
            }
        ], function(err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });
    };
    this.getMarketDepthFromBittrex = function(symbolA, symbolB, coinPrice, callback) {

        bittrexApi.getOrderBook(symbolA, symbolB, function(err, response) {
//            logger.debug('getProfitDataBittrex called...'+JSON.stringify(err))
            if (err) {
                callback(err);
                return;
            }
            var depth = new Number(0);
            if (response.hasOwnProperty('result')) {
                var totalQty = new Number(0);
                response['result'].forEach(function(order) {
                    var price = new Number(order.Rate);
                    var limit = new Number(coinPrice * portalConfig.profitSwitch.depth);
                    var qty = new Number(order.Quantity);
                    // only measure the depth down to configured depth
                    if (price >= limit) {
                        depth += (qty * price);
                        totalQty += qty;
                    }
                });
            }

            var marketData = profitStatus[symbolToAlgorithmMap[symbolB]][symbolB].exchangeInfo['Bittrex'];
            marketData[symbolA].depth = depth;
            if (totalQty > 0)
                marketData[symbolA].weightedBid = new Number(depth / totalQty);
            callback();
        });
    };


    this.getCoindDaemonInfo = function(callback) {
        var daemonTasks = [];
        Object.keys(profitStatus).forEach(function(algo) {
            Object.keys(profitStatus[algo]).forEach(function(symbol) {
                var coinName = profitStatus[algo][symbol].name;
                var poolConfig = poolConfigs[coinName];
                var daemonConfig = poolConfig.paymentProcessing.daemon;
                daemonTasks.push(function(callback) {
                    _this.getDaemonInfoForCoin(symbol, daemonConfig, callback)
                });
            });
        });

        if (daemonTasks.length == 0) {
            callback();
            return;
        }
        async.series(daemonTasks, function(err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });
    };
    this.getDaemonInfoForCoin = function(symbol, cfg, callback) {
        var daemon = new Stratum.daemon.interface([cfg], function(severity, message) {
            logger[severity](logSystem, symbol, message);

//            logger.debug('getDaemonInfoForCoin called ...', daemon, symbol, cfg, message);
            callback(null); // fail gracefully for each coin
        });

        daemon.cmd('getblocktemplate', [{
            "capabilities": ["coinbasetxn", "workid", "coinbase/append"]
        }], function(result) {
            if (result[0].error != null) {
                logger.debug(symbol, 'Error while reading daemon info: ' + JSON.stringify(result[0]));
                callback(null); // fail gracefully for each coin
                return;
            }
            var coinStatus = profitStatus[symbolToAlgorithmMap[symbol]][symbol];
            var response = result[0].response;
//logger.warn('response: '+JSON.stringify(response));
            // some shitcoins dont provide target, only bits, so we need to deal with both
            var target = response.target ? bignum(response.target, 16) : util.bignumFromBitsHex(response.bits);
            coinStatus.difficulty = parseFloat((diff1 / target.toNumber()).toFixed(9)/2);
            logger.debug(symbol, 'difficulty is ' + coinStatus.difficulty);

            coinStatus.reward = response.coinbasetxn.coinbasevalue / 100000000;
logger.warn('reward: ' + response.coinbasetxn.coinbasevalue)
            callback(null);
        });
    };


    this.getMiningRate = function(callback) {
        var daemonTasks = [];
        Object.keys(profitStatus).forEach(function(algo) {
            Object.keys(profitStatus[algo]).forEach(function(symbol) {
                var coinStatus = profitStatus[symbolToAlgorithmMap[symbol]][symbol];
                coinStatus.blocksPerMhPerHour = 86400 / ((coinStatus.difficulty * Math.pow(2, 32)) / (1 * 1000 * 1000));
coinStatus.blocksPerMhPerDay = 14400 / ((coinStatus.difficulty * Math.pow(2, 32)) / (1 * 1000 * 1000));
//logger.warn('symbol: '+symbol +'  blocksPerDay: '+ coinStatus.blocksPerMhPerDay) ;
                coinStatus.coinsPerMhPerHour = coinStatus.reward * coinStatus.blocksPerMhPerHour;
// logger.warn('symbol: '+symbol +'  '+' coinStatus: ' + JSON.stringify(coinStatus));
            });
        });
        callback(null);
    };


    this.switchToMostProfitableCoins = function() {
        Object.keys(profitStatus).forEach(function(algo) {
            var algoStatus = profitStatus[algo];

            var bestExchange;
            var bestCoin;
            var bestBtcPerMhPerHour = 0;

            Object.keys(profitStatus[algo]).forEach(function(symbol) {
                var coinStatus = profitStatus[algo][symbol];

                Object.keys(coinStatus.exchangeInfo).forEach(function(exchange) {
                    var exchangeData = coinStatus.exchangeInfo[exchange];
                  //  if (exchangeData.hasOwnProperty('BTC') && exchangeData['BTC'].hasOwnProperty('weightedBid')) {
                  //      var btcPerMhPerHour = exchangeData['BTC'].weightedBid * coinStatus.coinsPerMhPerHour;


if (symbol == 'kmd'){var btcPerMhPerHour =  0.00002767 * coinStatus.coinsPerMhPerHour;}
if (symbol == 'arrr'){var btcPerMhPerHour = 0.00010827 * coinStatus.coinsPerMhPerHour;}
//logger.warn('symbol: '+ symbol + ' btcPerMhPerHour: '+ btcPerMhPerHour);
var btcPerMhPerHour = 0.00010827 * coinStatus.coinsPerMhPerHour;
                        if (btcPerMhPerHour > bestBtcPerMhPerHour) {
                            bestBtcPerMhPerHour = btcPerMhPerHour;
                            bestExchange = exchange;
                            bestCoin = profitStatus[algo][symbol].name;
                        }
                        coinStatus.btcPerMhPerHour = btcPerMhPerHour;
// logger.warn('bestcoin: '+bestCoin +' symbol: '+ symbol + ' coin profit: '+ 0.00010827 * coinStatus.coinsPerMhPerHour);
//                        logger.debug('CALC', 'BTC/' + symbol + ' on ' + exchange + ' with ' + coinStatus.btcPerMhPerHour.toFixed(8) + ' BTC/day per Mh/s');
                   // }
                });
            });
            logger.debug('RESULT', 'Best coin for ' + algo + ' is ' + bestCoin + ' on ' + bestExchange + ' with ' + bestBtcPerMhPerHour.toFixed(8) + ' BTC/day per Mh/s');


            var client = net.connect(portalConfig.cliPort, function() {
                client.write(JSON.stringify({
                    command: 'coinswitch',
                    params: [bestCoin],
                    options: {
                        algorithm: algo
                    }
                }) + '\n');
            }).on('error', function(error) {
                if (error.code === 'ECONNREFUSED')
                    logger.error('CLI: Could not connect to NOMP instance on port ' + portalConfig.cliPort);
                else
                    logger.error('CLI: Socket error ' + JSON.stringify(error));
            });

        });
    };


    var checkProfitability = function() {
//        logger.info('Check: Collecting profitability data.');

        profitabilityTasks = [];
        if (portalConfig.profitSwitch.usePoloniex)
            profitabilityTasks.push(_this.getProfitDataPoloniex);

        if (portalConfig.profitSwitch.useCryptsy)
            profitabilityTasks.push(_this.getProfitDataCryptsy);

        if (portalConfig.profitSwitch.usetradeOgre)
            profitabilityTasks.push(_this.getProfitDatatradeOgre);

        if (portalConfig.profitSwitch.useBittrex)
            profitabilityTasks.push(_this.getProfitDataBittrex);

        profitabilityTasks.push(_this.getCoindDaemonInfo);
        profitabilityTasks.push(_this.getMiningRate);

        // has to be series 
        async.series(profitabilityTasks, function(err) {
            if (err) {
                logger.error('Check: Error while checking profitability: ' + JSON.stringify(err));
                return;
            }
            //
            // TODO offer support for a userConfigurable function for deciding on coin to override the default
            // 
            _this.switchToMostProfitableCoins();
        });
    };
    setInterval(checkProfitability, portalConfig.profitSwitch.updateInterval * 1000);

};
