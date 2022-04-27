let fs = require('fs');
let http = require('http');
let https = require('https');
let url = require("url");
require('dotenv').config();
let authSid = Math.round(Math.random() * 10000000000) + '' + Math.round(Math.random() * 10000000000);
var redis = require('redis');
var async = require('async');
var filterIterate = require('./filterIterate.js');
var stats = require('./stats.js');
// added
let charts = require('./charts.js');
//let notifications = require('./notifications.js');
let apiInterfaces = require('./apiInterfaces.js')   //(config.daemon, config.wallet);
let market = require('./market.js');
//let utils = require('./utils.js');
JSON.minify = JSON.minify || require("node-json-minify");
//end
/*
    var portalConfig = JSON.parse(process.env.portalConfig);
    var poolConfigs = JSON.parse(process.env.pools);
console.log(poolConfigs)

Object.keys(poolConfigs).forEach(function(coin) {
	var poolOptions = poolConfigs[coin];
	if (poolOptions.marketStats){
	enabledPools.push(coin);
	}
});
/*
var redisClient = redis.createClient(poolOptions.redis.port, poolOptions.redis.host);
    if (poolOptions.redis.password) {
        redisClient.auth(poolOptions.redis.password);
    }

var poolOptions = poolConfigs[coin];
var daemonConfig = poolOptions.daemons[0];
*/
var portalConfig = JSON.parse(JSON.minify(fs.readFileSync("config.json", {
    encoding: 'utf8'
})));
//var poolConfigs;
const functions = require('./functions.js');
const loggerFactory = require('./logger.js');
const logger = loggerFactory.getLogger('\u001b[31mApi\u001b[0m', 'system');
/*
if (Object.keys(poolConfigs).length === 0) {
	logger.warn('PoolSpawner: No pool configs exists or are enabled in pool_configs folder. No pools spawned.');
	return;
}
*/
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


module.exports = function(portalConfig, poolConfigs) {

    var _this = this;
    var portalStats = this.stats = new stats(portalConfig, poolConfigs);
    this.liveStatConnections = {};
    this.handleApiRequest = function(req, res, next) {
        switch (req.params.method) {
            case 'pools':
		res.header('Content-Type', 'application/json');
                res.end(JSON.stringify({result: poolConfigs}));
                return;
            case 'stats':
                res.header('Content-Type', 'application/json');
                res.end(portalStats.statsString);
                return;
	    case 'blocks':
		portalStats.getBlocks(function(data){
		let blocks = JSON.parse(JSON.stringify(data));
		(blocks, {split:{by:':', index:3}}, 'miner-');
		res.header('Content-Type', 'application/json');
		res.end(JSON.stringify(blocks));
		 });
		break;
            case 'getblocksstats':
                 portalStats.getBlocks(function(data){
                     //Anonymize
                     let anonData = JSON.parse(JSON.stringify(data));
                     filterIterate(anonData, {split:{by:':', index:3}}, 'miner-');
                     res.header('Content-Type', 'application/json');
                     res.end(JSON.stringify(anonData));
                });
                break;
            case 'getblocksstatsraw':
                portalStats.getBlocks(function(data) {
                    res.header('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                });
                break;
            case 'payments':
                var poolBlocks = [];
                for (var pool in portalStats.stats.pools) {
                    poolBlocks.push({
                        name: pool,
                        pending: portalStats.stats.pools[pool].pending,
                        payments: portalStats.stats.pools[pool].payments
                    });
                }
                res.header('Content-Type', 'application/json');
                res.end(JSON.stringify(poolBlocks));
                return;
            case 'worker_stats':
                res.header('Content-Type', 'application/json');
                if (req.url.indexOf("?") > 0) {
                    var url_parms = req.url.split("?");
                    if (url_parms.length > 0) {
                        var history = {};
                        var workers = {};
                        var address = url_parms[1] || null;
                        //res.end(portalStats.getWorkerStats(address));
                        if (address != null && address.length > 0) {
                            // make sure it is just the miners address
                            address = address.split(".")[0];
                            // get miners balance along with worker balances
                            portalStats.getBalanceByAddress(address, function(balances) {

                                // get current round share total
                                portalStats.getTotalSharesByAddress(address, function(shares) {

                                    var totalHash = parseFloat(0.0);
                                    var totalHeld = parseFloat(0.0);
                                    var totalShares = shares;
                                    var networkSols = 0;

                                    for (var h in portalStats.statHistory) {
                                        for (var pool in portalStats.statHistory[h].pools) {
                                            for (var w in portalStats.statHistory[h].pools[pool].workers) {
                                                if (w.startsWith(address)) {
                                                    if (history[w] == null) {
                                                        history[w] = [];
                                                    }
                                                    if (portalStats.statHistory[h].pools[pool].workers[w].hashrate) {
                                                        history[w].push({
                                                            time: portalStats.statHistory[h].time,
                                                            hashrate: portalStats.statHistory[h].pools[pool].workers[w].hashrate
                                                        });
                                                    }
                                                }
                                            }
                                            // order check...
                                            //console.log(portalStats.statHistory[h].time);
                                        }
                                    }

                                    for (var pool in portalStats.stats.pools) {
                                        for (var w in portalStats.stats.pools[pool].workers) {

                                            if (w.startsWith(address)) {

                                                //                        console.log('>>>>BALANCES>>>>: ' + JSON.stringify(balances));

                                                workers[w] = portalStats.stats.pools[pool].workers[w];

                                                for (var b in balances.balances) {
                                                    if (w == balances.balances[b].worker) {
                                                        workers[w].paid = balances.balances[b].paid;
                                                        workers[w].balance = balances.balances[b].balance;
                                                        workers[w].immature = balances.balances[b].immature;
                                                    }
                                                }
                                                workers[w].balance = (workers[w].balance || 0);
                                                workers[w].immature = (workers[w].immature || 0);
                                                workers[w].paid = (workers[w].paid || 0);

                                                //                        console.log('workers[w].immature: '+workers[w].immature);

                                                totalHash += portalStats.stats.pools[pool].workers[w].hashrate;
                                                networkSols = portalStats.stats.pools[pool].poolStats.networkSols;

                                            }

                                        }

                                    }
                                    res.end(JSON.stringify({
                                        miner: address,
                                        totalHash: totalHash,
                                        totalShares: totalShares,
                                        networkSols: networkSols,

                                        immature: (balances.totalImmature * 100000000),
                                        balance: balances.totalHeld,
                                        paid: balances.totalPaid,

                                        workers: workers,
                                        history: history
                                    }));

                                });


                            });
                        } else {
                            res.end(JSON.stringify({
                                result: "error"
                            }));
                        }
                    } else {
                        res.end(JSON.stringify({
                            result: "error"
                        }));
                    }
                } else {
                    res.end(JSON.stringify({
                        result: "error"
                    }));
                }
                return;

                //new api items
            
			// Worker statistics
		case 'stats_address':
			handleMinerStats(urlParts, response);
			break;

		case 'getinfo':
			getNetworkData(response)
			res.header('Content-Type', 'application/json');
			res.end(JSON.stringify(response));

				break;
			

			// Payments
		case 'get_payments':
			handleGetPayments(urlParts, response);
			break;

			// Blocks
		case 'get_blocks':
			handleGetBlocks(urlParts, response);
			break;

			// Get market prices
		case 'get_market':
			handleGetMarket(urlParts, response);
			break;

			// Top 10 miners
		case 'get_top10miners':
			handleTopMiners(response);
			break;    
                //new api end
            case 'pool_fees':
                res.header('Content-Type', 'application/json');

                /* leshacat code :) */
                var o = {
                    pools: []
                }; // empty Object

                for (var pool in poolConfigs) {

                    var ttotal = 0.0;

                    var rewardRecipients = portalStats.stats.pools[pool].rewardRecipients || {};
                    for (var r in rewardRecipients) {
                        ttotal += rewardRecipients[r];
                    }


                    var intSec = poolConfigs[pool].paymentProcessing.paymentInterval || 0;
                    var intMinPymt = poolConfigs[pool].paymentProcessing.minimumPayment || 0;
                    var strSchema = poolConfigs[pool].paymentProcessing.schema || "PROP";

                    tmpStr = readableSeconds(intSec);

                    o.pools.push({
                        "coin": pool,
                        "fee": ttotal,
                        "payoutscheme": strSchema,
                        "interval": intSec,
                        "intervalstr": tmpStr,
                        "minimum": intMinPymt
                    }); //

                }
                res.end(JSON.stringify(o));

                return;
            case 'pool_stats':
                res.header('Content-Type', 'application/json');

                res.end(JSON.stringify(portalStats.statPoolHistory));

                return;
			case 'algo_stats':
					res.writeHead(200, {
						'Content-Type': 'text/html',
						'Cache-Control': 'max-age=20',
						'Connection': 'keep-alive'
					});
					res.end(JSON.stringify(portalStats.statAlgoHistory));
					return;
            case 'live_stats':
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });
                res.write('\n');
                var uid = Math.random().toString();
                _this.liveStatConnections[uid] = res;
//                res.flush();
                req.on("close", function() {
                    delete _this.liveStatConnections[uid];
                });
            default:
			
                next();
        }
    };

    Object.filter = (obj, predicate) =>
        Object.keys(obj)
        .filter(key => predicate(obj[key]))
        .reduce((res, key) => (res[key] = obj[key], res), {});

    this.handleAdminApiRequest = function(req, res, next) {
        switch (req.params.method) {
            case 'pools': {
                res.end(JSON.stringify({
                    result: poolConfigs
                }));
                return;
            }
            default:
                next();
        }
    };
// original api

// added api 
function getPaymentsData(portalStats, pool, address) {
	// Establish Payment Variables
	var payments = [];

	for (var w in portalStats.stats[pool].payments) {
		var paymentInformation = portalStats.stats[pool].payments[w];
		var paymentsData = {
			pool: portalStats.stats[pool].name,
			symbol: portalStats.stats[pool].symbol,
			algorithm: portalStats.stats[pool].algorithm,
			time: paymentInformation.time,
			txid: paymentInformation.txid,
			shares: paymentInformation.shares,
			workers: paymentInformation.workers,
			paid: paymentInformation.paid,
		//	unpaid: paymentInformation.unpaid,
		//	records: paymentInformation.records,
			totals: paymentInformation.totals,
		};
		payments.push(paymentsData);
	}

	// Filter by Worker Passed
	if (address !== null && address.length > 0) {
		payments = payments.filter(function (payment) {
			return Object.keys(payment.totals.amounts).includes(address);
		});
	}

	// Define Output Payload
	const payload = {
		payments: payments,
	};

	// Return Output
	return payload;
}




function truncateMinerAddress (blocks) {
	for (let i = 0; i < blocks.length; i++) {
		let block = blocks[i].split(':');
		if (block[0] === 'solo' || block[0] === 'prop') {
			block[1] = `${block[1].substring(0,7)}...${block[1].substring(block[1].length-7)}`;
			blocks[i] = block.join(':');
		}
	}
	return blocks
}

/**
 *  Calculate the Diff, shares and totalblocks
 **/
function calculateBlockData (data, blocks) {
	for (let i = 0; i < blocks.length; i++) {
		let block = blocks[i].split(':');
		if (block[0] === 'solo') {
			data.totalDiffSolo += parseInt(block[4]);
			data.totalSharesSolo += parseInt(block[5]);
			data.totalBlocksSolo += 1;
		} else if (block[0] === 'prop') {
			data.totalDiff += parseInt(block[4]);
			data.totalShares += parseInt(block[5]);
			data.totalBlocks += 1;
		} else {
			if (block[5]) {
				data.totalDiff += parseInt(block[2]);
				data.totalShares += parseInt(block[3]);
				data.totalBlocks += 1;
			}
		}
	}
}


/**
 * Get Network data
 **/
 let networkDataRpcMode = 'getinfo';



 function getNetworkData (callback, rpcMode) {
     if (!rpcMode) rpcMode = networkDataRpcMode;
 
     // Try get_info RPC method first if available (not all coins support it)
     if (rpcMode === 'getinfo') {
         apiInterfaces.rpcDaemon('getinfo', {}, function (error, reply) {
             if (error || !reply) {
                 getNetworkData(callback, 'getlastblockheader');
                 return;
             } else {
                 networkDataRpcMode = 'getinfo';
 
                 callback(null, {
                     difficulty: reply.difficulty,
                     height: reply.height
                 });
             }
         });
     }
 
     // Else fallback to getlastblockheader
     else {
         apiInterfaces.rpcDaemon('getlastblockheader', {}, function (error, reply) {
             if (error) {
                 logger.info('Error getting network data %j', [error]);
                 callback(true);
                 return;
             } else {
                 networkDataRpcMode = 'getlastblockheader';
 
                 let blockHeader = reply.block_header;
                 callback(null, {
                     difficulty: blockHeader.difficulty,
                     height: blockHeader.height + 1
                 });
             }
         });
     }
 }
 
 /**
  * Get Last Block data
  **/
 function getLastBlockData (callback) {
     apiInterfaces.rpcDaemon('getlastblockheader', {}, function (error, reply) {
         if (error) {
             logger.info('Error getting last block data %j', [error]);
             callback(true);
             return;
         }
         let blockHeader = reply.block_header;
         if (config.blockUnlocker.useFirstVout) {
             apiInterfaces.rpcDaemon('getblock', {
                 height: blockHeader.height
             }, function (error, result) {
                 if (error) {
                     logger.info('Error getting last block details: %j', [error]);
                     callback(true);
                     return;
                 }
                 let vout = JSON.parse(result.json)
                     .miner_tx.vout;
                 if (!vout.length) {
                     logger.info('Error: tx at height %s has no vouts!', [blockHeader.height]);
                     callback(true);
                     return;
                 }
                 callback(null, {
                     difficulty: blockHeader.difficulty,
                     height: blockHeader.height,
                     timestamp: blockHeader.timestamp,
                     reward: vout[0].amount,
                     hash: blockHeader.hash
                 });
             });
             return;
         }
         callback(null, {
             difficulty: blockHeader.difficulty,
             height: blockHeader.height,
             timestamp: blockHeader.timestamp,
             reward: blockHeader.reward,
             hash: blockHeader.hash
         });
     });
 }
 
/**
 * Get Last Block data
 **/
 function getLastBlockData (callback) {
	apiInterfaces.rpcDaemon('getlastblockheader', {}, function (error, reply) {
		if (error) {
			logger.info('Error getting last block data %j', [error]);
			callback(true);
			return;
		}
		let blockHeader = reply.block_header;
		if (config.blockUnlocker.useFirstVout) {
			apiInterfaces.rpcDaemon('getblock', {
				height: blockHeader.height
			}, function (error, result) {
				if (error) {
					logger.info('Error getting last block details: %j', [error]);
					callback(true);
					return;
				}
				let vout = JSON.parse(result.json)
					.miner_tx.vout;
				if (!vout.length) {
					logger.info('Error: tx at height %s has no vouts!', [blockHeader.height]);
					callback(true);
					return;
				}
				callback(null, {
					difficulty: blockHeader.difficulty,
					height: blockHeader.height,
					timestamp: blockHeader.timestamp,
					reward: vout[0].amount,
					hash: blockHeader.hash
				});
			});
			return;
		}
		callback(null, {
			difficulty: blockHeader.difficulty,
			height: blockHeader.height,
			timestamp: blockHeader.timestamp,
			reward: blockHeader.reward,
			hash: blockHeader.hash
		});
	});
}
/*
function handleGetApis (callback) {
	let apis = {};
	config.childPools.forEach(pool => {
		if (pool.enabled)
			apis[pool.coin] = {
				api: pool.api
			}
	})
	callback(apis)
}

*/
function handleGetApis (response) {
	async.waterfall([
		function (callback) {
			let apis = {};
			config.childPools.forEach(pool => {
				if (pool.enabled)
					apis[pool.coin] = {
						api: pool.api
					}
			})
			callback(null, apis);
		}
	], function (error, data) {
		if (error) {
			response.end(JSON.stringify({
				error: 'Error collecting Api Information'
			}));
			return;
		}
		let reply = JSON.stringify(data);

		response.writeHead("200", {
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'no-cache',
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(reply, 'utf8')
		});
		response.end(reply);
	})
}


/**
 * Takes a chart data JSON string and uses it to compute the average over the past hour, 6 hours,
 * and 24 hours.  Returns [AVG1, AVG6, AVG24].
 **/
 function extractAverageHashrates (chartdata) {
	let now = new Date() / 1000 | 0;

	let sums = [0, 0, 0]; // 1h, 6h, 24h
	let counts = [0, 0, 0];

	let sets = chartdata ? JSON.parse(chartdata) : []; // [time, avgValue, updateCount]
	for (let j in sets) {
		let hr = sets[j][1];
		if (now - sets[j][0] <= 1 * 60 * 60) {
			sums[0] += hr;
			counts[0]++;
		}
		if (now - sets[j][0] <= 6 * 60 * 60) {
			sums[1] += hr;
			counts[1]++;
		}
		if (now - sets[j][0] <= 24 * 60 * 60) {
			sums[2] += hr;
			counts[2]++;
		}
	}

	return [sums[0] * 1.0 / (counts[0] || 1), sums[1] * 1.0 / (counts[1] || 1), sums[2] * 1.0 / (counts[2] || 1)];
}

  
/**
 * Broadcast worker statistics
 **/
function broadcastWorkerStats (address, destinations) {
	let redisCommands = [
		['hgetall', `${config.coin}:workers:${address}`],
		['zrevrange', `${config.coin}:payments:${address}`, 0, config.api.payments - 1, 'WITHSCORES'],
		['keys', `${config.coin}:unique_workers:${address}~*`],
		['get', `${config.coin}:charts:hashrate:${address}`]
	];
	redisClient.multi(redisCommands).exec(function (error, replies) {
			if (error || !replies || !replies[0]) {
				sendLiveStats({
					error: 'Not found'
				}, destinations);
				return;
			}

			let stats = replies[0];
			stats.hashrate = minerStats[address] && minerStats[address]['hashrate'] ? minerStats[address]['hashrate'] : 0;
			stats.roundScore = minerStats[address] && minerStats[address]['roundScore'] ? minerStats[address]['roundScore'] : 0;
			stats.roundHashes = minerStats[address] && minerStats[address]['roundHashes'] ? minerStats[address]['roundHashes'] : 0;
			if (replies[3]) {
				let hr_avg = extractAverageHashrates(replies[3]);
				stats.hashrate_1h = hr_avg[0];
				stats.hashrate_6h = hr_avg[1];
				stats.hashrate_24h = hr_avg[2];
			}

			let paymentsData = replies[1];

			let workersData = [];
			for (let j = 0; j < replies[2].length; j++) {
				let key = replies[2][j];
				let keyParts = key.split(':');
				let miner = keyParts[2];
				if (miner.indexOf('~') !== -1) {
					let workerName = miner.substr(miner.indexOf('~') + 1, miner.length);
					let workerData = {
						name: workerName,
						hashrate: minerStats[miner] && minerStats[miner]['hashrate'] ? minerStats[miner]['hashrate'] : 0
					};
					workersData.push(workerData);
				}
			}

			charts.getUserChartsData(address, paymentsData, function (error, chartsData) {
				let redisCommands = [];
				for (let i in workersData) {
					redisCommands.push(['hgetall', `${config.coin}:unique_workers:${address}~${workersData[i].name}`]);
					redisCommands.push(['get', `${config.coin}:charts:worker_hashrate:${address}~${ workersData[i].name}`]);
				}
				redisClient.multi(redisCommands).exec(function (error, replies) {
						for (let i in workersData) {
							let wi = 2 * i;
							let hi = wi + 1
							if (replies[wi]) {
								workersData[i].lastShare = replies[wi]['lastShare'] ? parseInt(replies[wi]['lastShare']) : 0;
								workersData[i].hashes = replies[wi]['hashes'] ? parseInt(replies[wi]['hashes']) : 0;
							}
							if (replies[hi]) {
								let avgs = extractAverageHashrates(replies[hi]);
								workersData[i]['hashrate_1h'] = avgs[0];
								workersData[i]['hashrate_6h'] = avgs[1];
								workersData[i]['hashrate_24h'] = avgs[2];
							}
						}

						let data = {
							stats: stats,
							payments: paymentsData,
							charts: chartsData,
							workers: workersData
						};
						sendLiveStats(data, destinations);
					});
			});
		});
}

/**
 * Send live statistics to specified destinations
 **/
function sendLiveStats (data, destinations) {
	if (!destinations) { 
		return;
	}

	let dataJSON = JSON.stringify(data);
	for (let i in destinations) {
		destinations[i].end(dataJSON);
	}
}


/**
 * Return miner (worker) statistics
 **/
 function handleMinerStats (urlParts, response) {
	let address = urlParts.query.address;
	let longpoll = (urlParts.query.longpoll === 'true');

	if (longpoll) {
		response.writeHead(200, {
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'no-cache',
			'Content-Type': 'application/json',
			'Connection': 'keep-alive'
		});

		redisClient.exists(`${config.coin}:workers:${address}`, function (error, result) {
			if (!result) {
				response.end(JSON.stringify({
					error: 'Not found'
				}));
				return;
			}

			let address = urlParts.query.address;
			let uid = Math.random().toString();
			let key = address + ':' + uid;
			response.on("finish", function () {
				delete addressConnections[key];
			});
			response.on("close", function () {
				delete addressConnections[key];
			});
			addressConnections[key] = response;
		});
	} else {
		redisClient.multi([
				['hgetall', `${config.coin}:workers:${address}`],
				['zrevrange', `${config.coin}:payments:${address}`, 0, config.api.payments - 1, 'WITHSCORES'],
				['keys', `${config.coin}:unique_workers:${address}~*`],
				['get', `${config.coin}:charts:hashrate:${address}`]
			]).exec(function (error, replies) {
				if (error || !replies[0]) {
					let dataJSON = JSON.stringify({
						error: 'Not found'
					});
					response.writeHead("200", {
						'Access-Control-Allow-Origin': '*',
						'Cache-Control': 'no-cache',
						'Content-Type': 'application/json',
						'Content-Length': Buffer.byteLength(dataJSON, 'utf8')
					});
					response.end(dataJSON);
					return;
				}

				let stats = replies[0];
				stats.hashrate = minerStats[address] && minerStats[address]['hashrate'] ? minerStats[address]['hashrate'] : 0;
				stats.roundScore = minerStats[address] && minerStats[address]['roundScore'] ? minerStats[address]['roundScore'] : 0;
				stats.roundHashes = minerStats[address] && minerStats[address]['roundHashes'] ? minerStats[address]['roundHashes'] : 0;
				if (replies[3]) {
					let hr_avg = extractAverageHashrates(replies[3]);
					stats.hashrate_1h = hr_avg[0];
					stats.hashrate_6h = hr_avg[1];
					stats.hashrate_24h = hr_avg[2];
				}

				let paymentsData = replies[1];
				let workersData = [];
				for (let i = 0; i < replies[2].length; i++) {
					let key = replies[2][i];
					let keyParts = key.split(':');
					let miner = keyParts[2];
					if (miner.indexOf('~') !== -1) {
						let workerName = miner.substr(miner.indexOf('~') + 1, miner.length);
						let workerData = {
							name: workerName,
							hashrate: minerStats[miner] && minerStats[miner]['hashrate'] ? minerStats[miner]['hashrate'] : 0
						};
						workersData.push(workerData);
					}
				}

				charts.getUserChartsData(address, paymentsData, function (error, chartsData) {
					let redisCommands = [];
					for (let i in workersData) {
						redisCommands.push(['hgetall', `${config.coin}:unique_workers:${address}~${workersData[i].name}`]);
						redisCommands.push(['get', `${config.coin}:charts:worker_hashrate:${address}~${workersData[i].name}`]);
					}
					redisClient.multi(redisCommands).exec(function (error, replies) {
							for (let i in workersData) {
								let wi = 2 * i;
								let hi = wi + 1;
								if (replies[wi]) {
									workersData[i].lastShare = replies[wi]['lastShare'] ? parseInt(replies[wi]['lastShare']) : 0;
									workersData[i].hashes = replies[wi]['hashes'] ? parseInt(replies[wi]['hashes']) : 0;
								}
								if (replies[hi]) {
									let avgs = extractAverageHashrates(replies[hi]);
									workersData[i]['hashrate_1h'] = avgs[0];
									workersData[i]['hashrate_6h'] = avgs[1];
									workersData[i]['hashrate_24h'] = avgs[2];
								}
							}

							let data = {
								stats: stats,
								payments: paymentsData,
								charts: chartsData,
								workers: workersData
							}

							let dataJSON = JSON.stringify(data);

							response.writeHead("200", {
								'Access-Control-Allow-Origin': '*',
								'Cache-Control': 'no-cache',
								'Content-Type': 'application/json',
								'Content-Length': Buffer.byteLength(dataJSON, 'utf8')
							});
							response.end(dataJSON);
						});
				});
			});
	}
}



/**
 * Return payments history
 **/
 function handleGetPayments (urlParts, response) {
//	let paymentKey = ':payments:all';
    let paymentKey = ':payments';

	if (urlParts.query.address)
		paymentKey = `:payments:${urlParts.query.address}`;

	redisClient.zrevrangebyscore(
		`${config.coin}${paymentKey}`,
		`(${urlParts.query.time}`,
		'-inf',
		'WITHSCORES',
		'LIMIT',
		0,
		config.api.payments,
		function (err, result) {
			let data;
			if (err) {
				data = {
					error: 'Query failed'
				};
			} else {
				data = result ? result : '';
			}

			let reply = JSON.stringify(data);

			response.writeHead("200", {
				'Access-Control-Allow-Origin': '*',
				'Cache-Control': 'no-cache',
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(reply, 'utf8')
			});
			response.end(reply);
		}
	)
}


/**
 * Return blocks data
 **/
 function handleGetBlocks (urlParts, response) {
	redisClient.zrevrangebyscore(
		`${config.coin}:blocks:matured`,
		`(${urlParts.query.height}`,
		'-inf',
		'WITHSCORES',
		'LIMIT',
		0,
		config.api.blocks,
		function (err, result) {
			let data;
			if (err) {
				data = {
					error: 'Query failed'
				};
			} else {

				for (let i in result) {
					let block = result[i].split(':');
					if (block[0] === 'solo' || block[0] === 'prop') {
						block[1] = `${block[1].substring(0,7)}...${block[1].substring(block[1].length-7)}`
						result[i] = block.join(':')
					}
				}
				data = result ? result : '';
			}

			let reply = JSON.stringify(data);

			response.writeHead("200", {
				'Access-Control-Allow-Origin': '*',
				'Cache-Control': 'no-cache',
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(reply, 'utf8')
			});
			response.end(reply);

		});
}

/**
 * Get market exchange prices
 **/
 function handleGetMarket (urlParts, response) {
	response.writeHead(200, {
		'Access-Control-Allow-Origin': '*',
		'Cache-Control': 'no-cache',
		'Content-Type': 'application/json'
	});
	response.write('\n');

	let tickers = urlParts.query["tickers[]"] || urlParts.query.tickers;
	if (!tickers || tickers === undefined) {
		response.end(JSON.stringify({
			error: 'No tickers specified.'
		}));
		return;
	}

	let exchange = urlParts.query.exchange || config.prices.source;
	if (!exchange || exchange === undefined) {
		response.end(JSON.stringify({
			error: 'No exchange specified.'
		}));
		return;
	}

	// Get market prices
	market.get(exchange, tickers, function (data) {
		response.end(JSON.stringify(data));
	});
}




/**
 * Return top 10 miners
 **/
 function handleBlockExplorers (response) {
	async.waterfall([
		function (callback) {
			let blockExplorers = {};
			blockExplorers[config.coin] = {
				"blockchainExplorer": config.blockchainExplorer,
				"transactionExplorer": config.transactionExplorer
			}
			config.childPools.forEach(pool => {
				if (pool.enabled)
					blockExplorers[pool.coin] = {
						"blockchainExplorer": pool.blockchainExplorer,
						"transactionExplorer": pool.transactionExplorer
					}
			})
			callback(null, blockExplorers);
		}
	], function (error, data) {
		if (error) {
			response.end(JSON.stringify({
				error: 'Error collecting Block Explorer Information'
			}));
			return;
		}
		let reply = JSON.stringify(data);

		response.writeHead("200", {
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'no-cache',
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(reply, 'utf8')
		});
		response.end(reply);
	})
}


    /**
 * Return top 10 miners
 **/
function handleTopMiners (response) {
    console.log('top miners called')
	async.waterfall([
		function (callback) {
			redisClient.keys(`${poolConfigs}:workers:*`, callback);
		},
		function (workerKeys, callback) {
			let redisCommands = workerKeys.map(function (k) {
				return ['hmget', k, 'lastShare', 'hashes'];
			});
			redisClient.multi(redisCommands).exec(function (error, redisData) {
					let minersData = [];
					let keyParts = [];
					let address = '';
					let data = '';
					for (let i in redisData) {
						keyParts = workerKeys[i].split(':');
						address = keyParts[keyParts.length - 1];
						data = redisData[i];
						minersData.push({
							miner: address.substring(0, 7) + '...' + address.substring(address.length - 7),
							hashrate: minersHashrate[address] && minerStats[address]['hashrate'] ? minersHashrate[address] : 0,
							lastShare: data[0],
							hashes: data[1]
						});
					}
					callback(null, minersData);
				});
		}
	], function (error, data) {
		if (error) {
			response.end(JSON.stringify({
				error: 'Error collecting top 10 miners stats'
			}));
			return;
		}

		data.sort(compareTopMiners);
		data = data.slice(0, 10);
		let reply = JSON.stringify(data);

		response.writeHead("200", {
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'no-cache',
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(reply, 'utf8')
		});
		response.end(reply);
	});
}

};


// Data storage variables used for live statistics
let currentStats = {};
let minerStats = {};
let minersHashrate = {};

let liveConnections = {};
let addressConnections = {};

//
 // Handle server requests
 //
function handleServerRequest (request, response) {
	let urlParts = url.parse(request.url, true);

	switch (urlParts.pathname) {
		// Pool statistics
		case '/stats':
			handleStats(urlParts, request, response);
			break;
		case '/live_stats':
			response.writeHead(200, {
				'Access-Control-Allow-Origin': '*',
				'Cache-Control': 'no-cache',
				'Content-Type': 'application/json',
				'Connection': 'keep-alive'
			});

			let address = urlParts.query.address ? urlParts.query.address : 'undefined';
			let uid = Math.random().toString();
			let key = address + ':' + uid;

			response.on("finish", function () {
				delete liveConnections[key];
			});
			response.on("close", function () {
				delete liveConnections[key];
			});

			liveConnections[key] = response;
			break;

			// Worker statistics
		case '/stats_address':
			handleMinerStats(urlParts, response);
			break;

			// Payments
		case '/get_payments':
			handleGetPayments(urlParts, response);
			break;

			// Blocks
		case '/get_blocks':
			handleGetBlocks(urlParts, response);
			break;

			// Get market prices
		case '/get_market':
			handleGetMarket(urlParts, response);
			break;

			// Top 10 miners
		case '/get_top10miners':
			handleTopMiners(response);
			break;

			// Miner settings
		case '/get_miner_payout_level':
			handleGetMinerPayoutLevel(urlParts, response);
			break;
		case '/set_miner_payout_level':
			handleSetMinerPayoutLevel(urlParts, response);
			break;
		case '/get_email_notifications':
			handleGetMinerNotifications(urlParts, response);
			break;
		case '/set_email_notifications':
			handleSetMinerNotifications(urlParts, response);
			break;
		case '/get_telegram_notifications':
			handleGetTelegramNotifications(urlParts, response);
			break;
		case '/set_telegram_notifications':
			handleSetTelegramNotifications(urlParts, response);
			break;
		case '/block_explorers':
			handleBlockExplorers(response)
			break
		case '/get_apis':
			handleGetApis(response)
			break
			// Miners/workers hashrate (used for charts)
		case '/miners_hashrate':
			if (!authorize(request, response)) {
				return;
			}
			handleGetMinersHashrate(response);
			break;
		case '/workers_hashrate':
			if (!authorize(request, response)) {
				return;
			}
			handleGetWorkersHashrate(response);
			break;

			// Pool Administration
		case '/admin_stats':
			if (!authorize(request, response))
				return;
			handleAdminStats(response);
			break;
		case '/admin_monitoring':
			if (!authorize(request, response)) {
				return;
			}
			handleAdminMonitoring(response);
			break;
		case '/admin_log':
			if (!authorize(request, response)) {
				return;
			}
			handleAdminLog(urlParts, response);
			break;
		case '/admin_users':
			if (!authorize(request, response)) {
				return;
			}
			handleAdminUsers(request, response);
			break;
		case '/admin_ports':
			if (!authorize(request, response)) {
				return;
			}
			handleAdminPorts(request, response);
			break;

			// Test notifications
		case '/test_email_notification':
			if (!authorize(request, response)) {
				return;
			}
			handleTestEmailNotification(urlParts, response);
			break;
		case '/test_telegram_notification':
			if (!authorize(request, response)) {
				return;
			}
			handleTestTelegramNotification(urlParts, response);
			break;

			// Default response
		default:
			response.writeHead(404, {
				'Access-Control-Allow-Origin': '*'
			});
			response.end('Invalid API call');
			break;
	}
}



function compareTopMiners (a, b) {
	let v1 = a.hashrate ? parseInt(a.hashrate) : 0;
	let v2 = b.hashrate ? parseInt(b.hashrate) : 0;
	if (v1 > v2) return -1;
	if (v1 < v2) return 1;
	return 0;
}

/*

//
 // Miner settings: minimum payout level
 //

// Get current minimum payout level
function handleGetMinerPayoutLevel (urlParts, response) {
	response.writeHead(200, {
		'Access-Control-Allow-Origin': '*',
		'Cache-Control': 'no-cache',
		'Content-Type': 'application/json'
	});
	response.write('\n');

	let address = urlParts.query.address;

	// Check the minimal required parameters for this handle.
	if (address === undefined) {
		response.end(JSON.stringify({
			status: 'Parameters are incomplete'
		}));
		return;
	}

	// Return current miner payout level
	redisClient.hget(`${config.coin}:workers:${address}`, 'minPayoutLevel', function (error, value) {
		if (error) {
			response.end(JSON.stringify({
				status: 'Unable to get the current minimum payout level from database'
			}));
			return;
		}

		let minLevel = config.payments.minPayment / config.coinUnits;
		if (minLevel < 0) minLevel = 0;

		let maxLevel = config.payments.maxPayment ? config.payments.maxPayment / config.coinUnits : null;

		let currentLevel = value / config.coinUnits;
		if (currentLevel < minLevel) currentLevel = minLevel;
		if (maxLevel && currentLevel > maxLevel) currentLevel = maxLevel;

		response.end(JSON.stringify({
			status: 'done',
			level: currentLevel
		}));
	});
}


// Set minimum payout level
function handleSetMinerPayoutLevel (urlParts, response) {
	response.writeHead(200, {
		'Access-Control-Allow-Origin': '*',
		'Cache-Control': 'no-cache',
		'Content-Type': 'application/json'
	});
	response.write('\n');

	let address = urlParts.query.address;
	let ip = urlParts.query.ip;
	let level = urlParts.query.level;
	// Check the minimal required parameters for this handle.
	if (ip === undefined || address === undefined || level === undefined) {
		response.end(JSON.stringify({
			status: 'Parameters are incomplete'
		}));
		return;
	}

	// Do not allow wildcards in the queries.
	if (ip.indexOf('*') !== -1 || address.indexOf('*') !== -1) {
		response.end(JSON.stringify({
			status: 'Remove the wildcard from your miner address'
		}));
		return;
	}

	level = parseFloat(level);
	if (isNaN(level)) {
		response.end(JSON.stringify({
			status: 'Your minimum payout level doesn\'t look like a number'
		}));
		return;
	}

	let minLevel = config.payments.minPayment / config.coinUnits;
	if (minLevel < 0) minLevel = 0;
	let maxLevel = config.payments.maxPayment ? config.payments.maxPayment / config.coinUnits : null;
	if (level < minLevel) {
		response.end(JSON.stringify({
			status: 'The minimum payout level is ' + minLevel
		}));
		return;
	}

	if (maxLevel && level > maxLevel) {
		response.end(JSON.stringify({
			status: 'The maximum payout level is ' + maxLevel
		}));
		return;
	}


//
// Return miners hashrate
 //
 function handleGetMinersHashrate (response) {
	let data = {};
	for (let miner in minersHashrate) {
		if (miner.indexOf('~') !== -1) continue;
		data[miner] = minersHashrate[miner];
	}

	data = {
		minersHashrate: data
	}

	let reply = JSON.stringify(data);

	response.writeHead("200", {
		'Access-Control-Allow-Origin': '*',
		'Cache-Control': 'no-cache',
		'Content-Type': 'application/json',
		'Content-Length': Buffer.byteLength(reply, 'utf8')
	});
	response.end(reply);
}

//
 // Return workers hashrate
 //
function handleGetWorkersHashrate (response) {
	let data = {};
	for (let miner in minersHashrate) {
		if (miner.indexOf('~') === -1) continue;
		data[miner] = minersHashrate[miner];
	}
	let reply = JSON.stringify({
		workersHashrate: data
	});

	response.writeHead("200", {
		'Access-Control-Allow-Origin': '*',
		'Cache-Control': 'no-cache',
		'Content-Type': 'application/json',
		'Content-Length': reply.length
	});
	response.end(reply);
}



//
 // Authorize access to a secured API call
 //
 function authorize (request, response) {
	let sentPass = url.parse(request.url, true)
		.query.password;

	let remoteAddress = request.connection.remoteAddress;
	if (config.api.trustProxyIP && request.headers['x-forwarded-for']) {
		remoteAddress = request.headers['x-forwarded-for'];
	}

	let bindIp = config.api.host ? config.api.host : "0.0.0.0";
	if (typeof sentPass == "undefined" && (remoteAddress === '127.0.0.1' || remoteAddress === '::ffff:127.0.0.1' || remoteAddress === '::1' || (bindIp != "0.0.0.0" && remoteAddress === bindIp))) {
		return true;
	}

	response.setHeader('Access-Control-Allow-Origin', '*');

	let cookies = parseCookies(request);
	if (typeof sentPass == "undefined" && cookies.sid && cookies.sid === authSid) {
		return true;
	}

	if (sentPass !== config.api.password) {
		response.statusCode = 401;
		response.end('Invalid password');
		return;
	}

	log('warn', logSystem, 'Admin authorized from %s', [remoteAddress]);
	response.statusCode = 200;

	let cookieExpire = new Date(new Date().getTime() + 60 * 60 * 24 * 1000);
	
	response.setHeader('Set-Cookie', 'sid=' + authSid + '; path=/; expires=' + cookieExpire.toUTCString());
	response.setHeader('Cache-Control', 'no-cache');
	response.setHeader('Content-Type', 'application/json');

	return true;
}


//
 // Administration: return pool statistics
 //
 function handleAdminStats (response) {
	async.waterfall([

		//Get worker keys & unlocked blocks
		function (callback) {
			redisClient.multi([
					['keys', `${config.coin}:workers:*`],
					['zrange', `${config.coin}:blocks:matured`, 0, -1]
				]).exec(function (error, replies) {
					if (error) {
						logger.info('Error trying to get admin data from redis %j', [error]);
						callback(true);
						return;
					}
					callback(null, replies[0], replies[1]);
				});
		},

		//Get worker balances
		function (workerKeys, blocks, callback) {
			let redisCommands = workerKeys.map(function (k) {
				return ['hmget', k, 'balance', 'paid'];
			});
			redisClient.multi(redisCommands).exec(function (error, replies) {
					if (error) {
						logger.info('Error with getting balances from redis %j', [error]);
						callback(true);
						return;
					}

					callback(null, replies, blocks);
				});
		},
		function (workerData, blocks, callback) {
			let stats = {
				totalOwed: 0,
				totalPaid: 0,
				totalRevenue: 0,
				totalRevenueSolo: 0,
				totalDiff: 0,
				totalDiffSolo: 0,
				totalShares: 0,
				totalSharesSolo: 0,
				blocksOrphaned: 0,
				blocksUnlocked: 0,
				blocksUnlockedSolo: 0,
				totalWorkers: 0
			};

			for (let i = 0; i < workerData.length; i++) {
				stats.totalOwed += parseInt(workerData[i][0]) || 0;
				stats.totalPaid += parseInt(workerData[i][1]) || 0;
				stats.totalWorkers++;
			}

			for (let i = 0; i < blocks.length; i++) {
				let block = blocks[i].split(':');
				if (block[0] === 'prop' || block[0] === 'solo') {
					if (block[7]) {
						if (block[0] === 'solo') {
							stats.blocksUnlockedSolo++
							stats.totalDiffSolo += parseInt(block[4])
							stats.totalSharesSolo += parseInt(block[5])
							stats.totalRevenueSolo += parseInt(block[7])
						} else {
							stats.blocksUnlocked++
							stats.totalDiff += parseInt(block[4])
							stats.totalShares += parseInt(block[5])
							stats.totalRevenue += parseInt(block[7])
						}
					} else {
						stats.blocksOrphaned++
					}
				} else {
					if (block[5]) {
						stats.blocksUnlocked++;
						stats.totalDiff += parseInt(block[2]);
						stats.totalShares += parseInt(block[3]);
						stats.totalRevenue += parseInt(block[5]);
					} else {
						stats.blocksOrphaned++;
					}
				}
			}
			callback(null, stats);
		}
	], function (error, stats) {
		if (error) {
			response.end(JSON.stringify({
				error: 'Error collecting stats'
			}));
			return;
		}
		response.end(JSON.stringify(stats));
	});

}


//
// Administration: users list
 //
 function handleAdminUsers (request, response) {
	let otherCoin = url.parse(request.url, true).query.otherCoin;
	async.waterfall([
		// get workers Redis keys
		function (callback) {
			redisClient.keys(`${config.coin}:workers:*`, callback);
		},

		// get workers data
		function (workerKeys, callback) {
			let allCoins = config.childPools.filter(pool => pool.enabled).map(pool => {
					return `${pool.coin}`
				})

			allCoins.push(otherCoin);

			let redisCommands = workerKeys.map(function (k) {
				return ['hmget', k, 'balance', 'paid', 'lastShare', 'hashes', ...allCoins];
			});
			redisClient.multi(redisCommands).exec(function (error, redisData) {
					let workersData = {};
					let keyParts = [];
					let address = '';
					let data = [];
					let wallet = '';
					let coin = null;
					for (let i in redisData) {
						keyParts = workerKeys[i].split(':');
						address = keyParts[keyParts.length - 1];
						data = redisData[i];

						for (let a = 0, b = 4; b <= data.length; a++, b++) {
							if (data[b]) {
								coin = `${allCoins[a]}=${data[b]}`;
								break;
							}
						}

						workersData[address] = {
							pending: data[0],
							paid: data[1],
							lastShare: data[2],
							hashes: data[3],
							childWallet: coin,
							hashrate: minerStats[address] && minerStats[address]['hashrate'] ? minerStats[address]['hashrate'] : 0,
							roundScore: minerStats[address] && minerStats[address]['roundScore'] ? minerStats[address]['roundScore'] : 0,
							roundHashes: minerStats[address] && minerStats[address]['roundHashes'] ? minerStats[address]['roundHashes'] : 0
						};
					}
					callback(null, workersData);
				});
		}
	], function (error, workersData) {
		if (error) {
			response.end(JSON.stringify({
				error: 'Error collecting users stats'
			}));
			return;
		}
		response.end(JSON.stringify(workersData));
	});
}
*/

//
// Administration: log file data
 //
 function handleAdminLog (urlParts, response) {
	let file = urlParts.query.file;
	let filePath = config.logging.files.directory + '/' + file;
	if (!file.match(/^\w+\.log$/)) {
		response.end('wrong log file');
	}
	response.writeHead(200, {
		'Content-Type': 'text/plain',
		'Cache-Control': 'no-cache',
		'Content-Length': fs.statSync(filePath)
			.size
	});
	fs.createReadStream(filePath)
		.pipe(response);
}

//
// Administration: pool ports usage
 //
 function handleAdminPorts (request, response) {
	async.waterfall([
		function (callback) {
			redisClient.keys(`${config.coin}:ports:*`, callback);
		},
		function (portsKeys, callback) {
			let redisCommands = portsKeys.map(function (k) {
				return ['hmget', k, 'port', 'users'];
			});
			redisClient.multi(redisCommands).exec(function (error, redisData) {
					let portsData = {};
					let port = ''
					let data = []
					for (let i in redisData) {
						port = portsKeys[i];
						data = redisData[i];
						portsData[port] = {
							port: data[0],
							users: data[1]
						};
					}
					callback(null, portsData);
				});
		}
	], function (error, portsData) {
		if (error) {
			response.end(JSON.stringify({
				error: 'Error collecting Ports stats'
			}));
			return;
		}
		response.end(JSON.stringify(portsData));
	});
}


//
 // RPC monitoring of daemon and wallet
 //

// Start RPC monitoring
function startRpcMonitoring (rpc, module, method, interval) {
	setInterval(function () {
		rpc(method, {}, function (error, response) {
			let stat = {
				lastCheck: new Date() / 1000 | 0,
				lastStatus: error ? 'fail' : 'ok',
				lastResponse: JSON.stringify(error ? error : response)
			};
			if (error) {
				stat.lastFail = stat.lastCheck;
				stat.lastFailResponse = stat.lastResponse;
			}
			let key = getMonitoringDataKey(module);
			let redisCommands = [];
			for (let property in stat) {
				redisCommands.push(['hset', key, property, stat[property]]);
			}
			redisClient.multi(redisCommands).exec();
		});
	}, interval * 1000);
}





// Enable to be bind to a certain ip or all by default
//let bindIp = config.api.bindIp ? config.api.bindIp : "0.0.0.0";

// Start API on HTTP port
let server = http.createServer(function (request, response) {
	if (request.method.toUpperCase() === "OPTIONS") {
		response.writeHead("204", "No Content", {
			"access-control-allow-origin": '*',
			"access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
			"access-control-allow-headers": "content-type, accept",
			"access-control-max-age": 10, // Seconds.
			"content-length": 0
		});
		return (response.end());
	}

	handleServerRequest(request, response);
});

//server.listen(config.api.port, bindIp, function () {
//	log('info', logSystem, 'API started & listening on %s port %d', [bindIp, config.api.port]);
//});


// Return monitoring data key
function getMonitoringDataKey (module) {
	return config.coin + ':status:' + module;
}

///
 // Return list of pool logs file
 //
 function getLogFiles (callback) {
	let dir = config.logging.files.directory;
	fs.readdir(dir, function (error, files) {
		let logs = {};
		let file = ''
		let stats = '';
		for (let i in files) {
			file = files[i];
			stats = fs.statSync(dir + '/' + file);
			logs[file] = {
				size: stats.size,
				changed: Date.parse(stats.mtime) / 1000 | 0
			}
		}
		callback(error, logs);
	});
}

//
// Check if a miner has been seen with specified IP address
 //
function minerSeenWithIPForAddress (address, ip, callback) {
	let ipv4_regex = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
	if (ipv4_regex.test(ip)) {
		ip = '::ffff:' + ip;
	}
	redisClient.sismember([`${config.coin}:workers_ip:${address}`, ip], function (error, result) {
		let found = result > 0 ? true : false;
		callback(error, found);
	});
}

//
 // Parse cookies data
 //
function parseCookies (request) {
	let list = {},
		rc = request.headers.cookie;
	rc && rc.split(';').forEach(function (cookie) {
			let parts = cookie.split('=');
			list[parts.shift().trim()] = unescape(parts.join('='));
		});
	return list;
}

// Initialize monitoring
function initMonitoring () {
	let modulesRpc = {
		daemon: apiInterfaces.rpcDaemon,
		wallet: apiInterfaces.rpcWallet,
		price: apiInterfaces.jsonHttpRequest
	};
	let daemonType = config.daemonType ? config.daemonType.toLowerCase() : "default";
	let settings = '';
	for (let module in config.monitoring) {
		settings = config.monitoring[module];
		// if (module === "price") {
		//     startPriceMonitoring(modulesRpc[module], module, settings.rpcMethod, settings.checkInterval, settings.tickers )
		//     break
		// }
		if (daemonType === "bytecoin" && module === "wallet" && settings.rpcMethod === "getbalance") {
			settings.rpcMethod = "getBalance";
		}
		if (settings.checkInterval) {
			startRpcMonitoring(modulesRpc[module], module, settings.rpcMethod, settings.checkInterval);
		}
	}
}


// Get monitoring data
function getMonitoringData (callback) {
	let modules = Object.keys(config.monitoring);
	let redisCommands = [];
	for (let i in modules) {
		redisCommands.push(['hgetall', getMonitoringDataKey(modules[i])]);
	}
	redisClient.multi(redisCommands).exec(function (error, results) {
			let stats = {};
			for (let i in modules) {
				if (results[i]) {
					stats[modules[i]] = results[i];
				}
			}
			callback(error, stats);
		});
}

//
 // Return pool public ports
 //
function getPublicPorts (ports) {
	return ports.filter(function (port) {
		return !port.hidden;
	});
}


