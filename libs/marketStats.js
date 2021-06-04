var fs = require('fs');
require('dotenv').config();
const api_key = process.env.tradeOgre_api_key
const api_secret = process.env.tradeOgre_api_secret
var request = require('request');
var redis = require('redis');
var async = require('async');
var Stratum = require('stratum-pool');
var util = require('stratum-pool/lib/util.js');
var TradeOgre = require('tradeogre-api')
const loggerFactory = require('./logger.js');
let componentStr = `\u001b[33mMarketStats\u001b[0m`;
let logger = loggerFactory.getLogger(componentStr, 'system');
var PoolLogger = require('./logUtil.js');
const CoinbasePro = require('coinbase-pro');
const publicClient = new CoinbasePro.PublicClient();

var portalConfig = JSON.parse(fs.readFileSync("config.json", {encoding: 'utf8'}));

var exchange = 'TradeOgre';
var logger2 = new PoolLogger({
    logColors: true
});

module.exports = function(){
    logger2.debug('MarketStats',' ' , "started")
    logger2.debug('MarketStats',' ' , 'tradeOgre key: '+api_key+' secret: '+api_secret)
    var poolConfigs = JSON.parse(process.env.pools);
    var enabledPools = [];

    Object.keys(poolConfigs).forEach(function(coin) {
        var poolOptions = poolConfigs[coin];
        if (poolOptions.marketStats){
        enabledPools.push(coin);
        }
    });
    async.filter(enabledPools, function(coin, callback){
        SetupForStats(logger, poolConfigs[coin], function(setupResults){
            logger2.debug('MarketStats', coin , 'setupResults :'+
            setupResults)
            callback(null, setupResults);
        });
    }, function(err, results){
        results.forEach(function(coin){

            var poolOptions = poolConfigs[coin];
            var daemonConfig = poolOptions.daemons[0];

            logger2.debug('MarketStats', coin , 'Local Wallet stats setup with daemon ('
                + daemonConfig.user + '@' + daemonConfig.host + ':' + daemonConfig.port
                + ') and redis (' + poolOptions.redis.host + ':' + poolOptions.redis.port + ')');
        });
    });
};


function SetupForStats(logger, poolOptions, setupFinished) {

    var coin = poolOptions.coin.name;
    var symbol = poolOptions.coin.symbol.toUpperCase();
    var exchangeCoinPair = poolOptions.exchangeCoinPair.toUpperCase();
    var exchangeToCoin = poolOptions.exchangeToCoin.toUpperCase();
    var daemonConfig = poolOptions.daemons[0];
    var getMarketStats = poolOptions.coin.getMarketStats === true;
    var MarketStatsInterval  = poolOptions.MarketStatsInterval * 1000 || 120 * 1000;
    var walletInterval  = poolOptions.walletInterval * 1000 || 120 * 1000;
    var exchangeCoinbaseProEnabled  = poolOptions.exchangeCoinbaseProEnabled;
    var exchangeCoinbaseProQuote  = poolOptions.exchangeCoinbaseProQuote;
    var exchangeEnabled  = poolOptions.exchangeEnabled;
    var exchangeWalletAddress  = poolOptions.exchangeWalletAddress;
    var exchangeCoinPair  = poolOptions.exchangeCoinPair;
    var exchangeToCoin  = poolOptions.exchangeToCoin;
    var exchangeToCoinWallet  = poolOptions.exchangeToCoinWallet;

    logger2.debug('MarketStats', coin , ' MarketStatsInterval: ' + MarketStatsInterval);
    logger2.debug('MarketStats', coin , ' walletInterval: ' + walletInterval);
    logger2.debug('MarketStats', coin , ' getMarketStats: ' + getMarketStats);
    logger2.debug('MarketStats', coin , ' daemonConfig: ' + JSON.stringify(daemonConfig));
    logger2.debug('MarketStats', coin , ' exchangeEnabled: ' + exchangeEnabled);


    var daemon = new Stratum.daemon.interface([daemonConfig], function(severity, message){
        logger2.debug('MarketStats', coin ,  message);
    });

    var redisClient = redis.createClient(poolOptions.redis.port, poolOptions.redis.host);
    if (poolOptions.redis.password) {
        redisClient.auth(poolOptions.redis.password);
    }

    walletBalance();
    cacheMarketStats();

    
  
    function walletBalance () {
        var params = null;
        daemon.cmd('z_gettotalbalance', params,
            function (result) {
                if (!result || result.error || result[0].error || !result[0].response) {
                    logger2.debug('MarketStats', coin , ' Error with RPC call z_gettotalbalance '+JSON.stringify(result[0].error));
                    return;
                }

               
                var finalRedisCommands = [];
                logger2.debug('MarketStats', coin , 'Local wallet balance: '+ symbol + ' Total: '+result[0].response.total)
                if (result[0].response.transparent !== null) {
                    finalRedisCommands.push(['hset', coin + ':wallet', 'localMiningWallet', symbol]);
                }
                if (result[0].response.transparent !== null) {
                    finalRedisCommands.push(['hset', coin + ':wallet', 'time', Date.now()/1000]);
                }
                if (result[0].response.transparent !== null) {
                    finalRedisCommands.push(['hset', coin + ':wallet', 'transparent', result[0].response.transparent]);
                }
                //if (result[0].response.interest !== null) {
                //    finalRedisCommands.push(['hset', coin + ':wallet', 'interest', result[0].response.interest]);
                //}
                if (result[0].response.private !== null) {
                    finalRedisCommands.push(['hset', coin + ':wallet', 'private', result[0].response.private]);
                }
                if (result[0].response.total !== null) {
                    finalRedisCommands.push(['hset', coin + ':wallet', 'total', result[0].response.total]);
                }
                if (finalRedisCommands.length <= 0)
                            return;

                redisClient.multi(finalRedisCommands).exec(function(error, results){
                    if (error){
                        logger2.debug('MarketStats', coin , 'Error with redis during call to cacheNetworkStats() ' + JSON.stringify(error));
                            return;
                     }
                });
            }
        );
    }

           

    function cacheMarketStats() {
        var marketStatsUpdate = [];
        var exchangeCoinPair = poolOptions.exchangeCoinPair.toUpperCase();
        var exchangeToCoin = poolOptions.exchangeToCoin.toUpperCase();
        var exchangeToCoinWallet = poolOptions.exchangeToCoinWallet.toUpperCase();
        var coin = poolOptions.coin.name;
        var symbol = poolOptions.coin.symbol.toUpperCase();
        
        var tradeOgre = new TradeOgre()
        var tradeOgrePrivate = new TradeOgre( api_key, api_secret )

        publicClient.getProductTicker(exchangeCoinbaseProQuote).then((response) => {
            var marketStatsUpdate = [];
            logger2.debug('MarketStats', coin, 'Coinbase Pro BTC Live Ticker for Pool: '+coin+' BTC Price: '+response.price+' Volume: '+response.volume+' Bid: '+response.bid+' Ask: '+response.ask)
            marketStatsUpdate.push(['hset', coin + ':wallet', 'btcusd', JSON.stringify(response)]);
                                redisClient.multi(marketStatsUpdate).exec(function(err, results){
                                    if (err){
                                        logger2.debug('MarketStats', coin , 'Error with redis during call to cacheMarketStats() ' + JSON.stringify(error));
                                        return;
                                    }
                                });
//            logger2.debug('MarketStats', coin , response);
          }).catch((error) => {
            logger2.error('MarketStats', coin , error);
          });

          publicClient.getProductTicker('ETH-USD').then((response) => {
            var marketStatsUpdate = [];
            logger2.debug('MarketStats', coin, 'Coinbase Pro ETH Live Ticker for Pool: '+coin+' BTC Price: '+response.price+' Volume: '+response.volume+' Bid: '+response.bid+' Ask: '+response.ask)
            marketStatsUpdate.push(['hset', coin + ':wallet', 'ethusd', JSON.stringify(response)]);
                                redisClient.multi(marketStatsUpdate).exec(function(err, results){
                                    if (err){
                                        logger2.error('MarketStats', coin , 'Error with redis during call to cacheMarketStats() ' + JSON.stringify(error));
                                        return;
                                    }
                                });
//            logger2.debug('MarketStats', coin , response);
          }).catch((error) => {
            logger2.debug('MarketStats', coin , error);
          });

          publicClient.getProduct24HrStats(exchangeCoinbaseProQuote).then((response) => {
            var marketStatsUpdate = [];
            var parsedData = JSON.stringify(response) //response already parsed
          //  logger2.debug('MarketStats', coin , 'Coinbase Pro Data: '+parsedData+' Response: '+ response.open)
          logger2.debug('MarketStats', coin, 'Coinbase Pro Data 24Hr Stats BTC Ticker Open: '+response.open+' High: '+response.high+' Low: '+response.low)
            marketStatsUpdate.push(['hset', coin + ':wallet', 'btcusd24hr', JSON.stringify(response)]);
                                redisClient.multi(marketStatsUpdate).exec(function(err, results){
                                    if (err){
                                        logger2.error('MarketStats', coin , 'Error with redis during call to getProduct24HrStats ' + JSON.stringify(error));
                                        return;
                                    }
                                });;
          }).catch((error) => {
            logger2.error('MarketStats', coin , error);
          });


        tradeOgre.getTicker(exchangeCoinPair, function (error, response) {
            logger2.debug('MarketStats', coin, 'Exchange Ticker Update: '+exchangeCoinPair+' TradeOgre')
            if (error) {
                logger2.error('MarketStats', coin , 'Error with http request to tradeOgre Ticker ' + JSON.stringify(error));
                return;
            }
            
            if (!response || response.error || response.error || !response.response) {

                if (response.statusCode == 200) {
                    if (response.body) {
                        var data = response.body;
                        if (response.body.length > 0) {
                            var parsedData = JSON.parse(response.body)
                            parsedData.time = Date.now()/1000;
                            parsedData.coin = symbol;
                            parsedData.exchange = exchange;
                            logger2.debug('MarketStats', coin, 'Exchange exchangeCoinPair Ticker Update: '+parsedData.coin+' '+parsedData.price)
                            marketStatsUpdate.push(['hset', coin + ':wallet', 'exchangeTicker', JSON.stringify(parsedData)]);
                            redisClient.multi(marketStatsUpdate).exec(function(err, results){
                                if (err){
                                    logger2.error('MarketStats', coin , 'Error with redis during call to cacheMarketStats() ' + JSON.stringify(error));
                                    return;
                                }
                            });
                        }
                    }
                } else {
                    logger2.error('MarketStats', coin , 'Error, unexpected http status code during call to cacheMarketStats() ' + JSON.stringify(response.statusCode));
                }
            }
        });

        tradeOgre.getTicker(exchangeToCoin, function (error, response) {
            logger2.debug('MarketStats', coin, 'Exchange: '+exchangeToCoin+' Updated')
            if (error) {
                logger2.error('MarketStats', coin , 'Error with http request to tradeOgre Ticker ' + JSON.stringify(error));
                return;
            }
            
                if (!response || response.error || response.error || !response.response) {

                if (response.statusCode == 200) {
                    if (response.body) {
                        var data = response.body;
                        if (response.body.length > 0) {
                            var parsedData = JSON.parse(response.body)
                            parsedData.time = Date.now()/1000;
                            parsedData.coin = exchangeToCoin;
                            parsedData.exchange = exchange;
                            logger2.debug('MarketStats', coin, 'Exchange exchangeToCoin Tricker Update: '+ coin + ' Exchange: '+ parsedData.exchange + ' Coin: ' + exchangeToCoin+' Price: '+parsedData.price)
                            marketStatsUpdate.push(['hset', coin + ':wallet', 'exchangeToCoinTicker', JSON.stringify(parsedData)]);
                            redisClient.multi(marketStatsUpdate).exec(function(err, results){
                                if (err){
                                    logger2.error('MarketStats', coin , 'Error with redis during call to cacheMarketStats() ' + JSON.stringify(error));
                                    return;
                                }
                            });
                        }
                    }
                } else {
                    logger2.error('MarketStats', coin , 'Error, unexpected http status code during call to cacheMarketStats() ' + JSON.stringify(response.statusCode));
                }
            }
        });
        
        tradeOgrePrivate.getBalance(exchangeToCoinWallet, function (error, response) {

            logger2.debug('MarketStats', coin, 'Exchange Wallet Balance: '+exchangeToCoinWallet)
            var exchangeToCoin = poolOptions.exchangeToCoin.toUpperCase();
            if (error) {
                logger2.error('MarketStats', coin , 'Error with http request to tradeOgre Private call getBalance ' + JSON.stringify(error));
                return;
            }

                if (!response || response.error || response.error || !response.response) {
                    if (response.statusCode == 200) {
                    
                        if (response.body) {
                            var data = response.body;
                            data.time = Date.now()/1000;
                            data.exchange = exchange;
                            var parsedData = data
                            parsedData.time = Date.now()/1000;
                            parsedData.wallet = exchangeToCoinWallet;
                            parsedData.exchange = exchange;
                            data.time = Date.now()/1000;
                            logger2.debug('MarketStats', coin, 'Exchange: '+ parsedData.exchange + ' Wallet: '+parsedData.wallet +' Balance: '+parsedData.balance)
                            marketStatsUpdate.push(['hset', coin + ':wallet', 'exchangeWalletConverted', JSON.stringify(data)]);
                            redisClient.multi(marketStatsUpdate).exec(function(err, results){
                                if (err){
                                    logger2.error('MarketStats', coin , 'Error with redis during call to getBalance cacheMarketStats() ' + JSON.stringify(error));
                                    return;
                                }
                            });
                        }
                } else {
                    logger2.error('MarketStats', coin , 'Error, unexpected http status code during call to cacheMarketStats() ' + JSON.stringify(response.statusCode));
                }
            }
        });


        tradeOgrePrivate.getBalance(symbol, function (error, response) {
            logger2.debug('MarketStats', coin, 'Exchange Private Wallet Balance: '+symbol)
            if (error) {
                logger2.error('MarketStats', coin , 'Error with http request to tradeOgre Private call getBalance ' + JSON.stringify(error));
                return;
            }
                if (!response || response.error || response.error || !response.response) {
                  if (response.statusCode == 200) {
                    
                    if (response.body) {
                        var data = response.body;
                        data.time = Date.now()/1000;
                        data.exchange = exchange;
                        var parsedData = data
                        parsedData.time = Date.now()/1000;
                        parsedData.wallet = symbol;
                        parsedData.exchange = exchange;
                        data.time = Date.now()/1000;
                        logger2.debug('MarketStats', coin, 'Exchange Wallet: '+ parsedData.exchange + ' Wallet: '+parsedData.wallet +' Balance: '+parsedData.balance)
                           
                        marketStatsUpdate.push(['hset', coin + ':wallet', 'exchangeWallet', JSON.stringify(data)]);
                        redisClient.multi(marketStatsUpdate).exec(function(err, results){
                                if (err){
                                    logger2.error('MarketStats', coin , 'Error with redis during call to getBalance cacheMarketStats() ' + JSON.stringify(error));
                                    return;
                                }
                            });
                        }
                  } else {
                    logger2.error('MarketStats', coin , 'Error, unexpected http status code during call to cacheMarketStats() ' + JSON.stringify(response.statusCode));
                }
            }
        });
    }

    
    //var walletInterval = walletInterval * 1000;
     walletInterval = setInterval(function() {
        // update 
        walletBalance();
      //  cacheMarketStats();
    }, walletInterval);

    // market stats caching every 5 seconds
    if (getMarketStats === true) {
     //   MarketStatsInterval = MarketStatsInterval * 1000;
        MarketStatsInterval = setInterval(function() {
            // update market stats 
            cacheMarketStats();
        }, MarketStatsInterval);
    }
}
