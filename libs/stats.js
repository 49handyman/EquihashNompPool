var zlib = require('zlib');
var request = require('request');
var redis = require('redis');
var async = require('async');
var os = require('os');
var algos = require('stratum-pool/lib/algoProperties.js');
const logger = require('./logger.js').getLogger('Stats', 'system');
const functions = require('./functions.js');
var price;
var found;

function sortProperties(obj, sortedBy, isNumericSort, reverse) {
     sortedBy = sortedBy || 1; // by default first key
     isNumericSort = isNumericSort || false; // by default text sort
     reverse = reverse || false; // by default no reverse

     var reversed = (reverse) ? -1 : 1;

     var sortable = [];
     for (var key in obj) {
         if (obj.hasOwnProperty(key)) {
             sortable.push([key, obj[key]]);
         }
     }
     if (isNumericSort)
         sortable.sort(function (a, b) {
             return reversed * (a[1][sortedBy] - b[1][sortedBy]);
         });
     else
         sortable.sort(function (a, b) {
             var x = a[1][sortedBy].toLowerCase(),
                 y = b[1][sortedBy].toLowerCase();
             return x < y ? reversed * -1 : x > y ? reversed : 0;
        });
    return sortable; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
}


module.exports = function(portalConfig, poolConfigs) {
    logger.info("Starting Stats Module...");

    var _this = this;
    var redisClients = [];
    var redisStats;
    this.statHistory = [];
    this.statPoolHistory = [];
    this.stats = {};
    this.statsString = '';
    var markets;
    var symbol;
    var marketData = [];
    var marketStats = [];
    var price;
    var retentionTime;
    var found;
    var canDoStats = true;
    setupStatsRedis();

    gatherStatHistory();
    Object.keys(poolConfigs).forEach(function(coin) {
        var poolConfig = poolConfigs[coin];
        var redisConfig = poolConfig.redis;
        for (var i = 0; i < redisClients.length; i++) {
            var client = redisClients[i];
            if (client.client.port === redisConfig.port && client.client.host === redisConfig.host) {
                client.coins.push(coin);
                return;
            }
        }
        redisClients.push({
            coins: [coin],
            client: redis.createClient(redisConfig.port, redisConfig.host)
        });
    });

    function setupStatsRedis() {
        redisStats = redis.createClient(portalConfig.redis.port, portalConfig.redis.host);
        redisStats.on('error', function(err) {
            logger.error('Stats Redis Encountered An Error! Message: %s', JSON.stringify(err));
        });
    }

    function setupMarketRedis() {
        redisMarket = redis.createClient(portalConfig.redis.port, portalConfig.redis.host);
        redisMarket.on('error', function(err) {
            logger.error('SetupMarketRedis Redis Encountered An Error! Message: %s', JSON.stringify(err));
        });
    }

    this.getBlocks = function (cback) {
         var allBlocks = {};
         async.each(_this.stats.pools, function(pool, pcb) {

             if (_this.stats.pools[pool.name].pending && _this.stats.pools[pool.name].pending.blocks) {
                 for (var i=0; i<_this.stats.pools[pool.name].pending.blocks.length; i++) {
                     allBlocks[pool.name+"-"+_this.stats.pools[pool.name].pending.blocks[i].split(':')[2]] = _this.stats.poo$
                 }
             }

             if (_this.stats.pools[pool.name].confirmed && _this.stats.pools[pool.name].confirmed.blocks) {
                 for (var i=0; i<_this.stats.pools[pool.name].confirmed.blocks.length; i++) {
                     allBlocks[pool.name+"-"+_this.stats.pools[pool.name].confirmed.blocks[i].split(':')[2]] = _this.stats.p$
                 }
             }

             pcb();
         }, function(err) {
             cback(allBlocks);
         });
     };



    function gatherStatHistory() {

        var retentionTime = (((Date.now() / 1000) - portalConfig.website.stats.historicalRetention) | 0).toString();
        redisStats.zrangebyscore(['statHistory', retentionTime, '+inf'], function(err, replies) {
            if (err) {
                logger.error('Error When Trying To Grab Historical Stat Data! Message: %s', JSON.stringify(err));
                return;
            }
            for (var i = 0; i < replies.length; i++) {
                _this.statHistory.push(JSON.parse(replies[i]));
            }
            _this.statHistory = _this.statHistory.sort(function(a, b) {
                return a.time - b.time;
            });
            _this.statHistory.forEach(function(stats) {
                addStatPoolHistory(stats);
            });
        });
    }


    function getWorkerStats(address) {
         address = address.split(".")[0];
         if (address.length > 0 && address.startsWith('t')) {
             for (var h in statHistory) {
                 for(var pool in statHistory[h].pools) {

                     statHistory[h].pools[pool].workers.sort(sortWorkersByHashrate);

                     for(var w in statHistory[h].pools[pool].workers){
                         if (w.startsWith(address)) {
                             if (history[w] == null) {
                                 history[w] = [];
                             }
                             if (workers[w] == null && stats.pools[pool].workers[w] != null) {
                                 workers[w] = stats.pools[pool].workers[w];
                             }
                             if (statHistory[h].pools[pool].workers[w].hashrate) {
                                 history[w].push({time: statHistory[h].time, hashrate:statHistory[h].pools[pool].workers[w].hashrate});
                             }
                         }
                     }
                 }
             }
             return JSON.stringify({"workers": workers, "history": history});
         }
         return null;
     }





    function addStatPoolHistory(stats) { // add itmes here for pool_stats data history stream
        var data = {
            time: stats.time,
            pools: {}
        };
        for (var pool in stats.pools) {
            data.pools[pool] = {
                hashrate: stats.pools[pool].hashrate,
		poolLuck: stats.pools[pool].luckDays,
                workerCount: stats.pools[pool].workerCount,
                blocks: stats.pools[pool].blocks,
		networkDiff:  stats.pools[pool].poolStats.networkDiff,
		networkSols: stats.pools[pool].poolStats.networkSols
            }
        }
        _this.statPoolHistory.push(data);
    }

    var magnitude = 100000000;
    var coinPrecision = magnitude.toString().length - 1;

    function coinsRound(number) {
        return roundTo(number, coinPrecision);
    }

    function readableSeconds(t) {
        var seconds = Math.round(t);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        var days = Math.floor(hours / 24);
        hours = hours - (days * 24);
        minutes = minutes - (days * 24 * 60) - (hours * 60);
        seconds = seconds - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);
        if (days > 0) {
            return (days + "d " + hours + "h " + minutes + "m " + seconds + "s");
        }
        if (hours > 0) {
            return (hours + "h " + minutes + "m " + seconds + "s");
        }
        if (minutes > 0) {
            return (minutes + "m " + seconds + "s");
        }
        return (seconds + "s");
    }

    this.getCoins = function(cback){
         _this.stats.coins = redisClients[0].coins;
         cback();
     };

     this.getPayout = function(address, cback){
         async.waterfall([
             function(callback){
                 _this.getBalanceByAddress(address, function(){
                     callback(null, 'test');
                 });
             }
         ], function(err, total){
             cback(coinsRound(total).toFixed(8));
         });
    };

    function roundTo(n, digits) {
        if (digits === undefined) {
            digits = 0;
        }
        var multiplicator = Math.pow(10, digits);
        n = parseFloat((n * multiplicator).toFixed(11));
        var test = (Math.round(n) / multiplicator);
        return +(test.toFixed(digits));
    }

    var satoshisToCoins = function(satoshis) {
        return roundTo((satoshis / magnitude), coinPrecision);
    };

    var coinsToSatoshies = function(coins) {
        return Math.round(coins * magnitude);
    };

    this.getTotalSharesByAddress = function(address, cback) {
        var a = address.split(".")[0];
        var client = redisClients[0].client,
            coins = redisClients[0].coins,
            shares = [];

        var pindex = parseInt(0);
        var totalShares = parseFloat(0);
        async.each(_this.stats.pools, function(pool, pcb) {
            pindex++;
            var coin = String(_this.stats.pools[pool.name].name);
            client.hscan(coin + ':shares:roundCurrent', 0, "match", a + "*", "count", 1000, function(error, result) {
                if (error) {
                    pcb(error);
                    return;
                }
                var workerName = "";
                var shares = 0;
                for (var i in result[1]) {
                    if (Math.abs(i % 2) != 1) {
                        workerName = String(result[1][i]);
                    } else {
                        shares += parseFloat(result[1][i]);
                    }
                }
                if (shares > 0) {
                    totalShares = shares;
                }
                pcb();
            });
        }, function(err) {
            if (err) {
                cback(0);
                return;
            }
            if (totalShares > 0 || (pindex >= Object.keys(_this.stats.pools).length)) {
                cback(totalShares);
                return;
            }
        });
    };
    /*

     add getBlocksFoundByAddress


    */
    this.getBalanceByAddress = function(address, cback) {

        var a = address.split(".")[0];

        var client = redisClients[0].client,
            coins = redisClients[0].coins,
            balances = [];
        var totalHeld = parseFloat(0);
        var totalPaid = parseFloat(0);
        var totalImmature = parseFloat(0);

        //    logger.debug("STATS>BEGIN> STATS BEING CALCULATED...");

        async.each(_this.stats.pools, function(pool, pcb) {
            var coin = String(_this.stats.pools[pool.name].name);

            client.hscan(coin + ':blocksFound', 0, "match", a + "*", "count", 1000, function(error, found) { // pexacoin:blocksPending

                // get all immature balances from address
                client.hscan(coin + ':immature', 0, "match", a + "*", "count", 10000, function(pendserr, pends) {
                    // get all balances from address
                    client.hscan(coin + ':balances', 0, "match", a + "*", "count", 10000, function(balserr, bals) {
                        // get all payouts from address
                        client.hscan(coin + ':payouts', 0, "match", a + "*", "count", 10000, function(payserr, pays) {

                            //            logger.debug("STATS> pendserr: [%s] balserr: [%s] payserr: [%s]", pendserr, balserr, payserr);

                            var workerName = "";
                            var balAmount = 0;
                            var paidAmount = 0;
                            var pendingAmount = 0;
                            var workers = {};

                            for (var i in pays[1]) {
                                if (Math.abs(i % 2) != 1) {
                                    workerName = String(pays[1][i]);
                                    workers[workerName] = (workers[workerName] || {});
                                } else {
                                    paidAmount = parseFloat(pays[1][i]);
                                    workers[workerName].paid = coinsRound(paidAmount);
                                    totalPaid += paidAmount;
                                }
                            }
                            for (var b in bals[1]) {
                                if (Math.abs(b % 2) != 1) {
                                    workerName = String(bals[1][b]);
                                    workers[workerName] = (workers[workerName] || {});
                                } else {
                                    balAmount = parseFloat(bals[1][b]);
                                    workers[workerName].balance = coinsRound(balAmount);
                                    totalHeld += balAmount;
                                }
                            }

                            totalImmature = 0;

                            //            logger.debug("STATS>PENDS> " + JSON.stringify(pends));            

                            for (var b in pends[1]) {
                                if (Math.abs(b % 2) != 1) {
                                    workerName = String(pends[1][b]);
                                    workers[workerName] = (workers[workerName] || {});
                                } else {
                                    pendingAmount = parseFloat(pends[1][b]);
                                    workers[workerName].immature = coinsRound(pendingAmount);
                                    totalImmature += pendingAmount;
                                }
                            }

                            for (var w in workers) {
                                balances.push({
                                    worker: String(w) || "",
                                    balance: workers[w].balance || 0,
                                    paid: workers[w].paid || 0,
                                    immature: workers[w].immature || 0
                                });
                            }

                            pcb();

                        });

                    });

                });
            });


        }, function(err) {
            if (err) {
                callback("STATS> There Was An Error Getting Balances!");
                return;
            }

            _this.stats.balances = balances;
            _this.stats.address = address;

            cback({
                totalHeld: coinsRound(totalHeld),
                totalPaid: coinsRound(totalPaid),
                totalImmature: satoshisToCoins(totalImmature),
                balances
            });
        });
    };


    this.getGlobalStats = function(callback) { // stats data add here second
        var statGatherTime = Date.now() / 1000 | 0;
        var allCoinStats = {};
        async.each(redisClients, function(client, callback) {
            var windowTime = (((Date.now() / 1000) - portalConfig.website.stats.hashrateWindow) | 0).toString();
            var redisCommands = [];
            var redisCommandTemplates = [
                ['zremrangebyscore', ':hashrate', '-inf', '(' + windowTime],
                ['zrangebyscore', ':hashrate', windowTime, '+inf'],
                ['hgetall', ':stats'],
                ['scard', ':blocksPending'],
                ['scard', ':blocksConfirmed'],
                ['scard', ':blocksOrphaned'],
                ['smembers', ':blocksConfirmed'],
                ['zrange', ':payments', -100, -1],
                ['hgetall', ':shares:roundCurrent'],
                ['smembers', ':blocksConfirmed'],
                ['hgetall', ':blocksPendingConfirms'],
                ['smembers', ':blocksConfirmed'],
                ['zremrangebyscore', ':marketStats', '-inf', '(' + windowTime],
                ['zrangebyscore', ':marketStats', windowTime, '+inf'],
                ['zremrangebyscore', ':marketStats', '-inf', '(' + windowTime],
                ['zrangebyscore', ':marketStats', windowTime, '+inf'],
                ['hgetall', ':blocksFound'],
                ['scard', ':blocksKicked'],  // 17
                ['zrevrange', ':lastBlock', 0, 0],  //18
                ['zrevrange', ':lastBlockTime', 0, 0],  //19
		['zremrangebyscore', 'lastBblock', '-inf', '(' + retentionTime],  //20
		['scard', ':blocksRejected'],  // 21
		['scard', ':blocksDuplicate'],  // 22
		['hgetall', ':bigDiff'],  // 23
		['hgetall', ':shares:timesCurrent'] //24
          ];
            var commandsPerCoin = redisCommandTemplates.length;
            client.coins.map(function(coin) {
                redisCommandTemplates.map(function(t) {
                    var clonedTemplates = t.slice(0);
                    clonedTemplates[1] = coin + clonedTemplates[1];
                    redisCommands.push(clonedTemplates);
                });
            });

            client.client.multi(redisCommands).exec(function(err, replies) {
                if (err) {
                    logger.error('STATS> Error with getting global stats, err = %s', JSON.stringify(err));
                    callback(err);
                } else {
                    for (var i = 0; i < replies.length; i += commandsPerCoin) {
                        var coinName = client.coins[i / commandsPerCoin | 0];
                        var marketStats = {};
                        if (replies[i + 2]) {
                            if (replies[i + 2].coinmarketcap) {
                                marketStats = replies[i + 2] ? (JSON.parse(replies[i + 2].coinmarketcap)[0] || 0) : 0;
                            }
                        }
                        var coinStats = {
                            name: coinName,
                            explorerGetBlock: poolConfigs[coinName].coin.explorerGetBlock,
                            blockTime: poolConfigs[coinName].coin.blockTime,
                            blockChange: poolConfigs[coinName].coin.blockChange,
			    blockReward:  poolConfigs[coinName].coin.blockReward,
                            explorerGetBlockJSON: poolConfigs[coinName].coin.explorerGetBlockJSON,
                            explorerGetTX: poolConfigs[coinName].coin.explorerGetTX,
                            symbol: poolConfigs[coinName].coin.symbol.toUpperCase(),
                            algorithm: poolConfigs[coinName].coin.algorithm,
			    PaymentInterval: poolConfigs[coinName].paymentInterval,
			    minimumPayment: poolConfigs[coinName].minimumPayment,
                            hashrates: replies[i + 1],
                            rewardRecipients: poolConfigs[coinName].rewardRecipients,
                            poolStats: {
                                validShares: replies[i + 2] ? (replies[i + 2].validShares || 0) : 0,
                                validBlocks: replies[i + 2] ? (replies[i + 2].validBlocks || 0) : 0,
                                invalidShares: replies[i + 2] ? (replies[i + 2].invalidShares || 0) : 0,
                                totalPaid: replies[i + 2] ? (replies[i + 2].totalPaid || 0) : 0,
                                networkBlocks: replies[i + 2] ? (replies[i + 2].networkBlocks || 0) : 0,
                                networkSols: replies[i + 2] ? (replies[i + 2].networkSols || 0) : 0,
                                networkSolsString: _this.getReadableNetworkHashRateString(replies[i + 2] ? (replies[i + 2].networkSols || 0) : 0),
                                networkDiff: replies[i + 2] ? (replies[i + 2].networkDiff || 0) : 0,
                                networkConnections: replies[i + 2] ? (replies[i + 2].networkConnections || 0) : 0,
                                networkVersion: replies[i + 2] ? (replies[i + 2].networkSubVersion || 0) : 0,
                                networkProtocolVersion: replies[i + 2] ? (replies[i + 2].networkProtocolVersion || 0) : 0,
                                poolStartTime: replies[i + 2] ? (replies[i + 2].poolStartTime || 0) : 0,
				coinMarketCap: replies[i + 2] ? (replies[i + 2].coinMarketCap || 0) : 0
                            },
			    marketStats: marketStats,
			    networkDiff: replies[i + 2] ? (replies[i + 2].networkDiff || 0) : 0,
			    networkSols: replies[i + 2] ? (replies[i + 2].networkSols || 0) : 0,
                            blocks: {
                                pending: replies[i + 3],
                                confirmed: replies[i + 4],
                                orphaned: replies[i + 5],
                                kicked: replies[i + 17],
                                blocksFound: replies[i + 16],
                                lastBlock: replies[i + 18],
                                lastBlockTime: replies[i + 19],
				blocksRejected: replies[i + 21],
				blocksDuplicate: replies[i + 22],
				bigDiff: replies[i + 23]
				
                            },
                            pending: {
                                blocks: replies[i + 9].sort(sortBlocks),
                                confirms: (replies[i + 10] || {})
                            },
                            confirmed: {
                                blocks: replies[i + 11].sort(sortBlocks).slice(0, 50)
                            },
                            payments: [],
                            currentRoundShares: (replies[i + 8] || {}),
			    currentRoundTimes: (replies[i + 24] || {}),
			    maxRoundTime: 0,
			    shareCount: 0,
			    shareSort: replies[i + 2] ? (replies[i + 2].validShares || 0) : 0
                        };
                        for (var j = replies[i + 7].length; j > 0; j--) {
                            var jsonObj;
                            try {
                                jsonObj = JSON.parse(replies[i + 7][j - 1]);
                            } catch (e) {
                                jsonObj = null;
                            }
                            if (jsonObj !== null) {
                                coinStats.payments.push(jsonObj);
                            }
                        }
                        allCoinStats[coinStats.name] = (coinStats);
                    }
		    allCoinStats = sortPoolsByShares(allCoinStats);
                    callback();
                }
            });
        }, function(err) {
            if (err) {
                logger.error('STATS> Error getting all stats, err = %s', JSON.stringify(err));
                callback();
                return;
            }

            var portalStats = {
                time: statGatherTime,
                global: {
                    workers: 0,
                    hashrate: 0,
                },
                algos: {},
                pools: allCoinStats
            };

            Object.keys(allCoinStats).forEach(function(coin) {
                var coinStats = allCoinStats[coin];
                coinStats.workers = {};
                coinStats.miners = {};
                coinStats.shares = 0;
                coinStats.hashrates.forEach(function(ins) {
                    var parts = ins.split(':');
                    var workerShares = parseFloat(parts[0]);
                    var miner = parts[1].split('.')[0];
                    var worker = parts[1];
                    var diff = Math.round(parts[0] * 8192);
                    if (workerShares > 0) {
                        coinStats.shares += workerShares;
                        if (worker in coinStats.workers) {
                            coinStats.workers[worker].shares += workerShares;
                            coinStats.workers[worker].diff = diff;
                        } else {
                            coinStats.workers[worker] = {
                                lastShare: 0,
                                name: worker,
                                shares: workerShares,
                                diff: diff,
                                invalidshares: 0,
                                currRoundShares: 0,
                                currRoundTime: 0,
                                hashrateString: null,
                                luckDays: null,
                                luckHours: null,
                                paid: 0,
                                balance: 0,
                                blocksFound: 0 // doug
                            };
                        }
                    } else {
                        if (worker in coinStats.workers) {
                            coinStats.workers[worker].invalidshares -= workerShares; // workerShares is negative number!
                            coinStats.workers[worker].diff = diff;
//			    coinStats.workers[worker].blocks=coinStats.blocks.blocksFound[worker];
//			    coinStats.workers[worker].blocksFound=coinStats.blocks.blocksFound[worker];
                            //	coinStats.workers[worker].blocks = blocks  // doug
                        } else {
                            coinStats.workers[worker] = {
                                lastShare: 0,
                                name: worker,
                                shares: 0,
                                diff: diff,
                                currRoundShares: 0,
                                currRoundTime: 0,
                                invalidshares: -workerShares,
                                hashrateString: null,
                                luckDays: null,
                                luckHours: null,
                                paid: 0,
                                balance: 0,
				blocksFound:0
                            };
                        }
                    }
                });

                var shareMultiplier = Math.pow(2, 32) / algos[coinStats.algorithm].multiplier;
                coinStats.hashrate = shareMultiplier * coinStats.shares / portalConfig.website.stats.hashrateWindow;
                var _blocktime = coinStats.blockTime || 60;
                var _networkHashRate = parseFloat(coinStats.poolStats.networkSols) * 1.2;
                var _myHashRate = (coinStats.hashrate / 1000000) * 2;
                coinStats.luckDays = ((_networkHashRate / _myHashRate * _blocktime) / (24 * 60 * 60)).toFixed(3);
                coinStats.luckHours = ((_networkHashRate / _myHashRate * _blocktime) / (60 * 60)).toFixed(3);
                coinStats.timeToFind = readableSeconds(_networkHashRate / _myHashRate * _blocktime);
		var timeSinceLastBlock = (Date.now() - coinStats.lastBlockTime)
		var poolLuck = (parseInt(timeSinceLastBlock)  * 1000 / parseInt(coinStats.poolStats.networkSols) / parseInt(coinStats.hashrate*2/1000000)  * parseInt(coinStats.lastblockTime*1000 * 100)).toFixed(2)
		parseFloat(poolLuck);
		coinStats.poolLuck = poolLuck;
                coinStats.workerCount = Object.keys(coinStats.workers).length;
                portalStats.global.workers += coinStats.workerCount;
                portalStats.global.hashrate += coinStats.hashrate;
                /* algorithm specific global stats */
                var algo = coinStats.algorithm;
                if (!portalStats.algos.hasOwnProperty(algo)) {
                    portalStats.algos[algo] = {
                        workers: 0,
                        hashrate: 0,
                        hashrateString: null
                    };
                }
                portalStats.algos[algo].hashrate += coinStats.hashrate;
                portalStats.algos[algo].workers += Object.keys(coinStats.workers).length;
                var _shareTotal = parseFloat(0);
                for (var worker in coinStats.currentRoundShares) {
                    var miner = worker.split(".")[0];
                    if (worker in coinStats.workers) {
                        coinStats.workers[worker].currRoundShares += parseFloat(coinStats.currentRoundShares[worker]);
                    }
                    _shareTotal += parseFloat(coinStats.currentRoundShares[worker]);
                }

                for (var worker in coinStats.workers) {
                    coinStats.workers[worker].hashrateString = _this.getReadableHashRateString(shareMultiplier * coinStats.workers[worker].shares / portalConfig.website.stats.hashrateWindow);
                    var _workerRate = shareMultiplier * coinStats.workers[worker].shares / portalConfig.website.stats.hashrateWindow;
                    var _wHashRate = (_workerRate / 1000000) * 2;
                    coinStats.workers[worker].luckDays = ((_networkHashRate / _wHashRate * _blocktime) / (24 * 60 * 60)).toFixed(3);
                    coinStats.workers[worker].luckHours = ((_networkHashRate / _wHashRate * _blocktime) / (60 * 60)).toFixed(3);
                    coinStats.workers[worker].hashrate = _workerRate;
                    coinStats.workers[worker].hashrateString = _this.getReadableHashRateString(_workerRate);
                }

                delete coinStats.hashrates;
                delete coinStats.shares;
                coinStats.hashrateString = _this.getReadableHashRateString(coinStats.hashrate);
            });

            Object.keys(portalStats.algos).forEach(function(algo) {
                var algoStats = portalStats.algos[algo];
                algoStats.hashrateString = _this.getReadableHashRateString(algoStats.hashrate);
            });

            _this.stats = portalStats;
            _this.statsString = JSON.stringify(portalStats);

            _this.statHistory.push(portalStats);
            addStatPoolHistory(portalStats);

            var retentionTime = (((Date.now() / 1000) - portalConfig.website.stats.historicalRetention) | 0);

            for (var i = 0; i < _this.statHistory.length; i++) {
                if (retentionTime < _this.statHistory[i].time) {
                    if (i > 0) {
                        _this.statHistory = _this.statHistory.slice(i);
                        _this.statPoolHistory = _this.statPoolHistory.slice(i);
                    }
                    break;
                }
            }

            redisStats.multi([
                ['zadd', 'statHistory', statGatherTime, _this.statsString],
                ['zremrangebyscore', 'statHistory', '-inf', '(' + retentionTime]
            ]).exec(function(err, replies) {
                if (err)
                    logger.error('STATS> Error adding stats to historics, err = %s', JSON.stringify(err));
            });
            callback();
        });

    };

    function sortPoolsByName(objects) {
        var newObject = {};
        var sortedArray = sortProperties(objects, 'name', false, false);
        for (var i = 0; i < sortedArray.length; i++) {
            var key = sortedArray[i][0];
            var value = sortedArray[i][1];
            newObject[key] = value;
        }
        return newObject;
    }

    function sortPoolsByHashrate(objects) {
         var newObject = {};
         var sortedArray = sortProperties(objects, 'hashrate', true, true);
         for (var i = 0; i < sortedArray.length; i++) {
             var key = sortedArray[i][0];
             var value = sortedArray[i][1];
             newObject[key] = value;
         }
         return newObject;
     }

    function sortPoolsByShares(objects) {
         var newObject = {};
         var sortedArray = sortProperties(objects, 'shareSort', true, true);
         for (var i = 0; i < sortedArray.length; i++) {
             var key = sortedArray[i][0];
             var value = sortedArray[i][1];
             newObject[key] = value;
         }
         return newObject;
    }


    function sortBlocks(a, b) {
        var as = parseInt(a.split(":")[2]);
        var bs = parseInt(b.split(":")[2]);
        if (as > bs) return -1;
        if (as < bs) return 1;
        return 0;
    }

    this.getPoolStats = function(coin, cback) {
        if (coin.length > 0) {
            _this.stats.coin = coin;
            cback({
                name: coin
            });
        }
    };

    function sortWorkersByName(objects) {
        var newObject = {};
        var sortedArray = sortProperties(objects, 'name', false, false);
        for (var i = 0; i < sortedArray.length; i++) {
            var key = sortedArray[i][0];
            var value = sortedArray[i][1];
            newObject[key] = value;
        }
        return newObject;
    }

    function sortMinersByHashrate(objects) {
         var newObject = {};
         var sortedArray = sortProperties(objects, 'hashrate', true, true);
         for (var i = 0; i < sortedArray.length; i++) {
             var key = sortedArray[i][0];
             var value = sortedArray[i][1];
             newObject[key] = value;
         }
         return newObject;
    }


    function sortWorkersByHashrate(a, b) {
        if (a.hashrate === b.hashrate) {
            return 0;
        } else {
            return (a.hashrate < b.hashrate) ? -1 : 1;
        }
    }

   this.getReadableHashRateString = function(hashrate){
         hashrate = (hashrate * 2);
         if (hashrate < 1000000) {
             return (Math.round(hashrate / 1000) / 1000 ).toFixed(2)+' Sol/s';
         }
         var byteUnits = [ ' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s' ];
         var i = Math.floor((Math.log(hashrate/1000) / Math.log(1000)) - 1);
         hashrate = (hashrate/1000) / Math.pow(1000, i + 1);
         return hashrate.toFixed(2) + byteUnits[i];
    };
/*
    this.getReadableHashRateString = function(hashrate) {
        if (hashrate <= 0) {
            return '0 Sols/s';
        } else {
            hashrate = (hashrate * 2);
            if (hashrate < 1000000) {
                hashrate = hashrate * 100000;
            }
            var byteUnits = [' Sols/s', ' KSols/s', ' MSols/s', ' GSols/s', ' TSols/s', ' PSols/s'];
            var i = Math.floor((Math.log(hashrate / 1000) / Math.log(1000)) - 1);
            hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);
            return hashrate.toFixed(2) + byteUnits[i];
        }
    };
*/
    this.getReadableNetworkHashRateString = function(hashrate) {
        if (hashrate <= 0) {
            return '0 Sols/s';
        } else {
            hashrate = (hashrate * 1000000);
            if (hashrate < 1000000) {
                hashrate = hashrate * 100000;
            }
            var byteUnits = [' Sols/s', ' KSols/s', ' MSols/s', ' GSols/s', ' TSols/s', ' PSols/s'];
            var i = Math.floor((Math.log(hashrate / 1000) / Math.log(1000)) - 1);
            hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);
            return hashrate.toFixed(2) + byteUnits[i];
        }
    };

    function getData(symbol) {
        request('https://api.coingecko.com/api/v3/simple/price?ids=' + symbol + '&vs_currencies=usd', function(error, response, body) {
            if (!error && response.statusCode == 200) {
                results = JSON.parse(body);
                console.log(symbol,results);
                var statGatherTime = Date.now() / 1000 | 0;
                redisStats.multi([
                    ['zadd', 'coinPrices', statGatherTime, JSON.stringify(results)],
                    ['zremrangebyscore', 'coinPrices', '-inf', '(' + retentionTime]
                ]).exec(function(err, replies) {
                    console.log(replies);
                    if (err)
                        logger.error('STATS> Error adding stats to historics, err = %s', JSON.stringify(err));
                });


                return marketData = results, price;
            } else {
                return marketData = error;
            }
        });
        return marketData, price;
    };


};
