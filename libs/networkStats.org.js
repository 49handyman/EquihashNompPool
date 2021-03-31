var fs = require('fs');
var request = require('request');

var redis = require('redis');
var async = require('async');

var Stratum = require('stratum-pool');
var util = require('stratum-pool/lib/util.js');

 const loggerFactory = require('./logger.js');
  
   JSON.minify = JSON.minify || require("node-json-minify");
   var portalConfig = JSON.parse(fs.readFileSync("config.json", {encoding: 'utf8'}));
   var poolConfigs = []; // filled later, here to make it global :)
// console.log('\u001b[33mMaster portalConfig networkStats.js called...\u001b[37m', portalConfig, poolConfigs);

    async.filter(enabledPools, function(coin, callback){
        SetupForStats(logger, poolConfigs[coin], function(setupResults){
console.log('async. SetupForStats Called...', poolOptions, setupResults);
            callback(null, setupResults);
        });
    }, function(err, results){
        results.forEach(function(coin){

            var poolOptions = poolConfigs[coin];
            var daemonConfig = poolOptions.daemons[0];
console.log('async. SetupForStats Results Called...', daemonConfig, poolOptions, setupResults);
            var logSystem = 'Payments';
            var logComponent = coin;

            logger.info(logSystem, logComponent, 'Network stats setup with daemon ('
                + daemonConfig.user + '@' + daemonConfig.host + ':' + daemonConfig.port
                + ') and redis (' + poolOptions.redis.host + ':' + poolOptions.redis.port + ')');
        });
    });
//};
//SetupForStats();
console.log('\u001b[33m End module.exports called...poolConfigs\u001b[37m', poolConfigs);
function SetupForStats(logger,  setupFinished) {
 console.log('\u001b[33mMaster SetupForStats called...\u001b[37m');

//    var coin = poolOptions.coin.name ;
var coin = 'komodo';
//console.log('poolOptions ', poolOptions);
//    var daemonConfig = poolOptions.daemons[0];

//    var getMarketStats = poolOptions.coin.marketStats == true; // doug ===
// console.log('getMarketStats ' + getMarketStats);
    var logSystem = 'MarketStats';
    var logComponent = coin;

//    var daemon = new Stratum.daemon.interface([daemonConfig], function(severity, message){
//        logger[severity](logSystem, logComponent, message);
// console.log('daemon called... ', daemon);
//    });

    var redisClient = redis.createClient();
    // redis auth if enabled
//cacheMarketStats();
    function cacheMarketStats() {
 console.log('\u001b[33mMaster cacheMarketStats called...\u001b[37m');
        var marketStatsUpdate = [];
  //      var coin = logComponent.replace('_testnet', '').toLowerCase();
  //      if (coin == 'zen')
  //          coin = 'zencash';
coin = 'KMD'
console.log('calling request');
var nomics =       request('https://api.nomics.com/v1/currencies/ticker?key=a61001570699a5ab9a3b1830cf0e9839&ids=KMD&interval=0d', function (error, response, body) {
console.log('waiting for request response ' + JSON.stringify(response) + JSON.stringify(body));
                logger.error(logSystem, logComponent, 'Error with http request to https://min-api.cryptocompare.com/ ' + JSON.stringify(error));
                        var data = JSON.parse(body);
				 logger.info(logSystem, logComponent, 'coinmarketcap', JSON.stringify(data));
                            marketStatsUpdate.push(['hset', logComponent, 'coinmarketcap', JSON.stringify(data)]);
                            redisClient.multi(marketStatsUpdate).exec(function(err, results){
                                if (err){
                                    logger.error(logSystem, logComponent, 'Error with redis during call to cacheMarketStats() ' + JSON.stringify(error));
                                    return;
                                }
                            });

            
        });
    }

    // network stats caching every 58 seconds
//    var stats_interval = 40 * 1000;
//console.log('Waiting..',stats_interval);
//    var statsInterval = setInterval(function() {
        // update network stats using coin daemon
//         SetupForStats();
//cacheMarketStats();
//}, stats_interval);

}
