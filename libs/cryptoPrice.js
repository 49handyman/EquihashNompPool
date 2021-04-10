var fs = require('fs');
var redis = require('redis');
var async = require('async');
var request = require('request');
var Stratum = require('stratum-pool');
var util = require('stratum-pool/lib/util.js');
const BigNumber = require('bignumber.js');
const loggerFactory = require('./logger.js');
JSON.minify = JSON.minify || require("node-json-minify");

// GLOBAL VARIABLES
var portalConfig = JSON.parse(fs.readFileSync("config.json", {
    encoding: 'utf8'
}));
module.exports = function() {
    var logger = loggerFactory.getLogger('Crypto price caching', 'system');
    poolConfigs = JSON.parse(process.env.pools);

    var enabledPools = [];
    Object.keys(poolConfigs).forEach(function(coin) {
        var poolOptions = poolConfigs[coin];
        if (poolOptions.paymentProcessing &&
            poolOptions.paymentProcessing.enabled) {
            enabledPools.push(coin);
            logger.info("CRYPTO> Price caching", coin);
        }
    });

    async.filter(enabledPools, function(coin, callback) {
            SetupForPool(poolConfigs[coin], function(setupResults) {
                // Log successfull and
                logger.debug("CRYPTO> Price caching initialized. Setup results %s", setupResults);
                callback(null, setupResults);
            });
        },
        function(err, coins) {
            if (err) {
                logger.error('CRYPTO>ERROR> Error processing enabled pools in the config') // TODO: ASYNC LIB was updated, need to report a better error
            } else {
                coins.forEach(function(coin) {
                    var poolOptions = poolConfigs[coin];
                    var processingConfig = poolOptions.paymentProcessing;
                    var tmpInterval = getCoinPayInterval(coin);
                    logger.info('CRYPTO> Price caching  setup to run every %s second(s) with daemon (%s@%s:%s) and redis (%s:%s)',
                        tmpInterval,
                        processingConfig.daemon.user,
                        processingConfig.daemon.host,
                        processingConfig.daemon.port,
                        poolOptions.redis.host,
                        poolOptions.redis.port);
                }); //end of coins.foreach(function(coin)
            } //end of if (err) else
        }); //end of async filter
}; //end of modulevar poolConfigs = []; // filled later, here to make it global :)

function SetupForPool(poolOptions, setupFinished) {
    var coin = poolOptions.coin.name;
    const logger = loggerFactory.getLogger('CRYPTO', coin);

    var processingConfig = poolOptions.paymentProcessing;
    var daemon = new Stratum.daemon.interface([processingConfig.daemon], loggerFactory.getLogger('CoinDaemon', coin));
    var redisClient = redis.createClient(poolOptions.redis.port, poolOptions.redis.host);

    var getMarketStats = poolOptions.coin.getMarketStats === true; //doug

    var totalCoinFees = getTotalFees(coin);
    logger.debug('PP> FEE % = %s', coin.toUpperCase(), totalCoinFees.toString(10));
    var coinPrecision = getCoinPrecision(coin);

    var minPayment = getCoinPayMinimum(coin);
    logger.debug('PP> minPayment = %s', coin.toUpperCase(), minPayment.toString(10));
    var paymentInterval = getCoinPayInterval(coin);

    async.parallel([
                function(callback) {
                    daemon.cmd('validateaddress', [poolOptions.address], function(result) {
                        if (result.error) {
                            logger.error('PP>ERROR> Error with payment processing daemon %s', JSON.stringify(result.error));
                            callback(true);
                        } else if (!result.response || !result.response.ismine) {
                            logger.error('PP>ERROR> Daemon does not own pool address - payment processing can not be done with this daemon, %s', JSON.stringify(result.response));
                            callback(true);
                        } else {
                            callback()
                        }
                    }, true);
                },

                // Set interval for prices();
                setInterval(function() {
                    try {
                        processPayments();
                    } catch (e) {
                        logger.error("PP>ERROR> There was error during payment processor setup %s", JSON.stringify(e));
                        throw e;
                    }
                }, paymentInterval * 1000)

            };

            var cacheNetworkStats = function() {
                var params = null;
                daemon.cmd('getmininginfo', params,
                    function(result) {
                        if (!result || result.error || result[0].error || !result[0].response) {
                            logger.error('PP>ERROR> Error with RPC call getmininginfo ' + JSON.stringify(result[0].error));
                            return;
                        }
                        var coin = poolOptions.coin.name;
                        var finalRedisCommands = [];
                        if (result[0].response.blocks !== null) {
                            finalRedisCommands.push(['hset', coin + ':stats', 'networkBlocks', result[0].response.blocks]);
                        }
                        if (result[0].response.difficulty !== null) {
                            finalRedisCommands.push(['hset', coin + ':stats', 'networkDiff', result[0].response.difficulty]);
                        }
                        if (result[0].response.networkhashps !== null) {
                            finalRedisCommands.push(['hset', coin + ':stats', 'networkSols', result[0].response.networkhashps]);
                        }
                        daemon.cmd('getnetworkinfo', params,
                            function(result) {
                                if (!result || result.error || result[0].error || !result[0].response) {
                                    logger.error('PP>ERROR> Error with RPC call getnetworkinfo ' + JSON.stringify(result[0].error));
                                    return;
                                }
                                if (result[0].response.connections !== null) {
                                    finalRedisCommands.push(['hset', coin + ':stats', 'networkConnections', result[0].response.connections]);
                                }
                                if (result[0].response.version !== null) {
                                    finalRedisCommands.push(['hset', coin + ':stats', 'networkVersion', result[0].response.version]);
                                }
                                if (result[0].response.subversion !== null) {
                                    finalRedisCommands.push(['hset', coin + ':stats', 'networkSubVersion', result[0].response.subversion]);
                                }
                                if (result[0].response.protocolversion !== null) {
                                    finalRedisCommands.push(['hset', coin + ':stats', 'networkProtocolVersion', result[0].response.protocolversion]);
                                }
                                if (finalRedisCommands.length <= 0)
                                    return;
                                redisClient.multi(finalRedisCommands).exec(function(error, results) {
                                    if (error) {
                                        logger.error('PP>ERROR> Error with redis during call to cacheNetworkStats() ' + JSON.stringify(error));
                                        return;
                                    }
                                });
                            }
                        );
                    }
                );
            }
            // network stats caching every 58 seconds
            var stats_interval = 58 * 1000;
            var statsInterval = setInterval(function() {
                // update network stats using coin daemon
                cacheNetworkStats();
            }, stats_interval);




            var processPayments = function() {

                var startPaymentProcess = Date.now();








            };