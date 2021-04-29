var fs = require('fs');
var request = require('request');
var redis = require('redis');
var async = require('async');
var Stratum = require('stratum-pool');
var util = require('stratum-pool/lib/util.js');
var TradeOgre = require('tradeogre-api')

var exchange = 'TradeOgre';

const loggerFactory = require('./logger.js');

const logger = loggerFactory.getLogger('wallet', 'system');

var api_key = '';
var api_secret = '';

module.exports = function(logger){

    
    var forkId = process.env.forkId;
   
    var poolConfigs = JSON.parse(process.env.pools);

    var enabledPools = [];

    Object.keys(poolConfigs).forEach(function(coin) {
        enabledPools.push(coin);
    });
    

    async.filter(enabledPools, function(coin, callback){
        SetupForStats(logger, poolConfigs[coin], function(setupResults){
            console.log('setupResults :'+setupResults)
            callback(null, setupResults);
        });
    }, function(err, results){
        results.forEach(function(coin){

            var poolOptions = poolConfigs[coin];
            var daemonConfig = poolOptions.daemons[0];


            console.log( 'Wallet stats setup with daemon ('
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
  //  console.log('-------------------------------------------------------')
  //  console.log('SetupForStats.coin: '+ coin)
  //  console.log('SetupForStats.symbol: '+ symbol)
  //  console.log('SetupForStats.exchangeCoinPair: '+ exchangeCoinPair)
  //  console.log('SetupForStats.exchangeToCoin: '+ exchangeToCoin)

    var getMarketStats = poolOptions.coin.getMarketStats === true;

    var logSystem = 'Wallet';
    var logComponent = coin;

    var daemon = new Stratum.daemon.interface([daemonConfig], function(severity, message){
     logger[severity](logSystem, logComponent, message);
    });

    var redisClient = redis.createClient(poolOptions.redis.port, poolOptions.redis.host);
    // redis auth if enabled
    if (poolOptions.redis.password) {
        redisClient.auth(poolOptions.redis.password);
    }
//    console.log('---------------walletBalance() call--------------------------')
    walletBalance();
//    console.log('---------------cacheMarketStats() call--------------------')
  cacheMarketStats()
  
    function walletBalance () {
        var params = null;
        daemon.cmd('z_gettotalbalance', params,
            function (result) {
                if (!result || result.error || result[0].error || !result[0].response) {
                    console.log('Error with RPC call z_gettotalbalance '+JSON.stringify(result[0].error));
                    return;
                }

                var coin = logComponent;
                var finalRedisCommands = [];
            //    console.log('------------------get local wallet balance----------------------')
            //    console.log(JSON.stringify(result))
                // parsedData.time = Date.now()/1000;
                if (result[0].response.transparent !== null) {
                    finalRedisCommands.push(['hset', coin + ':wallet', 'localMiningWallet', symbol]);
                }
                if (result[0].response.transparent !== null) {
                    finalRedisCommands.push(['hset', coin + ':wallet', 'time', Date.now()/1000]);
                }
                if (result[0].response.transparent !== null) {
                    finalRedisCommands.push(['hset', coin + ':wallet', 'transparent', result[0].response.transparent]);
                }
                if (result[0].response.interest !== null) {
                    finalRedisCommands.push(['hset', coin + ':wallet', 'interest', result[0].response.interest]);
                }
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
                        console.log('Error with redis during call to cacheNetworkStats() ' + JSON.stringify(error));
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

      //  console.log('---------------cacheMarketStats() started-------------------------')
      //  console.log('coin: '+ coin)
      //  console.log('symbol: '+ symbol)
        


       
        var tradeOgre = new TradeOgre()
        var tradeOgrePrivate = new TradeOgre( api_key, api_secret )

          
        tradeOgre.getTicker(exchangeCoinPair, function (error, response) {
            console.log('-----------'+exchangeCoinPair+'----getTicker started-------------------------')
            if (error) {
                console.log('Error with http request to tradeOgre Ticker ' + JSON.stringify(error));
                return;
            }
            
                if (!response || response.error || response.error || !response.response) {

                if (response.statusCode == 200) {
                    if (response.body) {
                        var data = response.body;
                        if (response.body.length > 0) {
                            var parsedData = JSON.parse(response.body)
                        //    console.log('getTicker.parsedData:'+parsedData)
                            
                            parsedData.time = Date.now()/1000;
                            parsedData.coin = symbol;
                            parsedData.exchange = exchange;
                        //    console.log('getTicker.parsedData w/time' + JSON.stringify(parsedData))
                            marketStatsUpdate.push(['hset', coin + ':wallet', 'exchangeTicker', JSON.stringify(parsedData)]);
                            redisClient.multi(marketStatsUpdate).exec(function(err, results){
                                if (err){
                                    console.log('Error with redis during call to cacheMarketStats() ' + JSON.stringify(error));
                                    return;
                                }
                            });
                        }
                    }
                } else {
                    console.log('Error, unexpected http status code during call to cacheMarketStats() ' + JSON.stringify(response.statusCode));
                }
            }
        });

        tradeOgre.getTicker(exchangeToCoin, function (error, response) {
            console.log('-----USDT-BTC----'+exchangeToCoin+'------getTicker USDT-BTC coin ticker started-------------------------')
            if (error) {
                console.log('Error with http request to tradeOgre Ticker ' + JSON.stringify(error));
                return;
            }
            
                if (!response || response.error || response.error || !response.response) {

                if (response.statusCode == 200) {
                    if (response.body) {
                        var data = response.body;
                        if (response.body.length > 0) {
                            var parsedData = JSON.parse(response.body)
                        //    console.log('getTicker.parsedData:'+parsedData)
                            
                            parsedData.time = Date.now()/1000;
                            parsedData.coin = exchangeToCoin;
                            parsedData.exchange = exchange;
                        //    console.log('getTicker.parsedData w/time' + JSON.stringify(parsedData))
                            marketStatsUpdate.push(['hset', coin + ':wallet', 'exchangeToCoinTicker', JSON.stringify(parsedData)]);
                            redisClient.multi(marketStatsUpdate).exec(function(err, results){
                                if (err){
                                    console.log('Error with redis during call to cacheMarketStats() ' + JSON.stringify(error));
                                    return;
                                }
                            });
                        }
                    }
                } else {
                    console.log('Error, unexpected http status code during call to cacheMarketStats() ' + JSON.stringify(response.statusCode));
                }
            }
        });
        
        tradeOgrePrivate.getBalance(exchangeToCoinWallet, function (error, response) {

            console.log('------BTC----'+exchangeToCoinWallet+'--- tradeOgrePrivate.getBalance exchangeToCoinWallet started --------------')
            var exchangeToCoin = poolOptions.exchangeToCoin.toUpperCase();
          //  console.log('getBalance.response.body:'+ JSON.stringify(response.body))
            if (error) {
                console.log('Error with http request to tradeOgre Private call getBalance ' + JSON.stringify(error));
                return;
            }
            // if (response && response.statusCode) {
                if (!response || response.error || response.error || !response.response) {
                if (response.statusCode == 200) {
                    
                    if (response.body) {
                        var data = response.body;
                     //   console.log('getBalance.data:'+ data)
                        data.time = Date.now()/1000;
                        data.exchange = exchange;
                     //   console.log('getBalance.parsed.data:'+ data)
                     //   console.log('getBalance.stringify.data:'+ JSON.stringify(response.body))
                        
                        
                            var parsedData = data
                        //    console.log('getBalance.parsedData:'+parsedData)
                        //    console.log('getBalance.parsedData.success:'+parsedData.success)
                            parsedData.time = Date.now()/1000;
                            parsedData.wallet = exchangeToCoinWallet;
                            parsedData.exchange = exchange;
                           // console.log('-------------------------------------------------');
                            //console.log('getBalance.response1:'+ JSON.stringify(data));
                            data.time = Date.now()/1000;
                           marketStatsUpdate.push(['hset', coin + ':wallet', 'exchangeWalletConverted', JSON.stringify(data)]);
                            redisClient.multi(marketStatsUpdate).exec(function(err, results){
                                if (err){
                                    console.log('Error with redis during call to getBalance cacheMarketStats() ' + JSON.stringify(error));
                                    return;
                                }
                            });
                        
                    }
                } else {
                    console.log('Error, unexpected http status code during call to cacheMarketStats() ' + JSON.stringify(response.statusCode));
                }
            }
        });


        tradeOgrePrivate.getBalance(symbol, function (error, response) {
            console.log('----ARRR---'+symbol+'------tradeOgrePrivate.getBalance started-------------------------')
          //  console.log('getBalance.response.body:'+ JSON.stringify(response.body))
            if (error) {
                console.log('Error with http request to tradeOgre Private call getBalance ' + JSON.stringify(error));
                return;
            }
            // if (response && response.statusCode) {
                if (!response || response.error || response.error || !response.response) {
                if (response.statusCode == 200) {
                    
                    if (response.body) {
                        var data = response.body;
                        console.log('getBalance.data:'+ data)
                        data.time = Date.now()/1000;
                        data.exchange = exchange;
                    //    console.log('getBalance.parsed.data:'+ data)
                     //   console.log('getBalance.stringify.data:'+ JSON.stringify(response.body))
                        
                        
                            var parsedData = data
                          //  console.log('getBalance.parsedData:'+parsedData)
                          //  console.log('getBalance.parsedData.success:'+parsedData.success)
                            parsedData.time = Date.now()/1000;
                            parsedData.wallet = symbol;
                            parsedData.exchange = exchange;
                           // console.log('-------------------------------------------------');
                          //  console.log('getBalance.response1:'+ JSON.stringify(data));
                            data.time = Date.now()/1000;
                           marketStatsUpdate.push(['hset', coin + ':wallet', 'exchangeWallet', JSON.stringify(data)]);
                            redisClient.multi(marketStatsUpdate).exec(function(err, results){
                                if (err){
                                    console.log('Error with redis during call to getBalance cacheMarketStats() ' + JSON.stringify(error));
                                    return;
                                }
                            });
                        
                    }
                } else {
                    console.log('Error, unexpected http status code during call to cacheMarketStats() ' + JSON.stringify(response.statusCode));
                }
            }
        });
    }

    
    var stats_interval = 65 * 1000;
    var statsInterval = setInterval(function() {
        // update 
        walletBalance();
    }, stats_interval);

    // market stats caching every 5 minutes
    if (getMarketStats === true) {
        var market_stats_interval = 65 * 1000;
        var marketStatsInterval = setInterval(function() {
            // update market stats 
            cacheMarketStats();
        }, market_stats_interval);
    }
}
