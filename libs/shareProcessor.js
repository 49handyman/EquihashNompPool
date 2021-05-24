var redis = require('redis');
var Stratum = require('stratum-pool');

const loggerFactory = require('./logger.js');

const logger = loggerFactory.getLogger('Shares', 'system');
/*
This module deals with handling shares when in internal payment processing mode. It connects to a redis
database and inserts shares with the database structure of:

key: coin_name + ':' + block_height + ':' + Date.now()/1000
value: a hash with..
        key:

 */


module.exports = function(logger, poolConfig) {

    var redisConfig = poolConfig.redis;
    var coin = poolConfig.coin.name;
    var forkId = process.env.forkId;
    var connection = redis.createClient(redisConfig.port, redisConfig.host);
    var client = redis.createClient(redisConfig.port, redisConfig.host);
    connection.on('ready', function() {
        logger.debug('Share processing setup with redis (' + redisConfig.host +
            ':' + redisConfig.port + ')');
    });
    connection.on('error', function(err) {
        logger.error(logSystem, logComponent, logSubCat, 'Redis client had an error: ' + JSON.stringify(err))
    });
    connection.on('end', function() {
        logger.error(logSystem, logComponent, logSubCat, 'Connection to redis database has been ended');
    });

    connection.info(function(error, response) {
        if (error) {
            logger.error(logSystem, logComponent, logSubCat, 'Redis version check failed');
            return;
        }
        var parts = response.split('\r\n');
        var version;
        var versionString;
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].indexOf(':') !== -1) {
                var valParts = parts[i].split(':');
                if (valParts[0] === 'redis_version') {
                    versionString = valParts[1];
                    version = parseFloat(versionString);
                    break;
                }
            }
        }
        if (!version) {
            logger.error(logSystem, logComponent, logSubCat, 'Could not detect redis version - but be super old or broken');
        } else if (version < 2.6) {
            logger.error(logSystem, logComponent, logSubCat, "You're using redis version " + versionString + " the minimum required version is 2.6. Follow the damn usage instructions...");
        }
        var startTime = [];
        startTime.push(['hset', coin + ':stats', 'poolStartTime', Date.now() / 1000]);
        connection.multi(startTime).exec(function(err, replies) {
            if (err)
                logger.error(logSystem, logComponent, logSubCat, 'Error with share processor multi ' + JSON.stringify(err));
        });
    });


    this.handleShare = function(isValidShare, isValidBlock, shareData) {
//   redisClient.hincrby([coin + ':bigDiff', workerStr, 1]);
        var redisCommands = [];
        if (isValidShare) {
            redisCommands.push(['hincrbyfloat', coin + ':shares:roundCurrent', shareData.worker, shareData.difficulty]);
            redisCommands.push(['hincrby', coin + ':stats', 'validShares', 1]);
        } else {
            redisCommands.push(['hincrby', coin + ':stats', 'invalidShares', 1]);
        }
        /* Stores share diff, worker, and unique value with a score that is the timestamp. Unique value ensures it
           doesn't overwrite an existing entry, and timestamp as score lets us query shares from last X minutes to
           generate hashrate for each worker and pool. */
        var dateNow = Date.now();
        var hashrateData = [isValidShare ? shareData.difficulty : -shareData.difficulty, shareData.worker, dateNow];
        redisCommands.push(['zadd', coin + ':hashrate', dateNow / 1000 | 0, hashrateData.join(':')]);

        if (isValidBlock) {
            redisCommands.push(['rename', coin + ':shares:roundCurrent', coin + ':shares:round' + shareData.height]);
	    redisCommands.push(['rename', coin + ':shares:timesCurrent', coin + ':shares:times' + shareData.height]);
            redisCommands.push(['sadd', coin + ':blocksPending', [shareData.blockHash, shareData.txHash, shareData.height, dateNow / 1000, shareData.worker].join(':')]);
            redisCommands.push(['zadd', coin + ':lastBlock', dateNow / 1000 | 0, [shareData.blockHash, shareData.txHash, shareData.worker, shareData.height, dateNow / 1000 | 0].join(':')]);
            redisCommands.push(['zadd', coin + ':lastBlockTime', dateNow / 1000, [shareData.height, dateNow / 1000, shareData.worker].join(':')]);
            redisCommands.push(['hincrby', coin + ':stats', 'validBlocks', 1]);
            redisCommands.push(['hincrby', coin + ':blocksFound', shareData.worker, 1]);
            console.log('\u0007'+ 'bell..');
        } else if (shareData.blockHash) {
            console.log('\u0007'+ 'bell..');
            redisCommands.push(['hincrby', coin + ':stats', 'invalidBlocks', 1]);
	        redisCommands.push(['sadd', coin + ':blocksRejected', [shareData.blockHash, shareData.txHash, shareData.height, dateNow / 1000, shareData.worker].join(':')]);
        }
        connection.multi(redisCommands).exec(function(err, replies) {
            if (err)
                logger.error(logSystem, logComponent, logSubCat, 'Error with share processor multi ' + JSON.stringify(err));
        });

/*

var poolLuck =  parseFloat(parseInt(timeSinceLastBlock)  * 1000 / 
	parseInt(stats.pools[poolName].poolStats.networkSols) / 
	parseInt(stats.pools[poolName].hashrate*2/1000000) * 
	parseInt(stats.pools[poolName].blockTime)*1000 * 100).toFixed(12)

*/
    };

};
