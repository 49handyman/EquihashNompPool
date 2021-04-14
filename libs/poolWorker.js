var Stratum = require('stratum-pool');
var redis = require('redis');
var net = require('net');
const functions = require('./functions.js');
var MposCompatibility = require('./mposCompatibility.js');
var ShareProcessor = require('./shareProcessor.js');
const loggerFactory = require('./logger.js');


module.exports = function() {
    const logger = loggerFactory.getLogger('PoolWorker', 'system');
    var _this = this;
    var poolConfigs = JSON.parse(process.env.pools);
    var portalConfig = JSON.parse(process.env.portalConfig);
    var forkId = process.env.forkId;
    var pools = {};
    var proxySwitch = {};
    var redisClient = redis.createClient(portalConfig.redis.port, portalConfig.redis.host);

    //Handle messages from master process sent via IPC
    process.on('message', function(message) {
        switch (message.type) {
            case 'banIP':
                onBanIP(message);
                break;
            case 'blocknotify':
                onBlockNotify(message);
                break;

                // IPC message for pool switching
            case 'coinswitch':
                onCoinSwitch(message);
                break;
        }
    });

    var onCoinSwitch = function(message) {
        logger.silly('incoming coinswitch message');
        let componentStr = `Proxy Switch [:${(parseInt(forkId) + 1)}]`;
        let logger = loggerFactory.getLogger(componentStr, coin);
        var switchName = message.switchName;
        var newCoin = message.coin;
        var algo = poolConfigs[newCoin].coin.algorithm;
        var newPool = pools[newCoin];
        var oldCoin = proxySwitch[switchName].currentPool;
        var oldPool = pools[oldCoin];
        var proxyPorts = Object.keys(proxySwitch[switchName].ports);

        if (newCoin == oldCoin) {
            logger.debug('Switch message would have no effect - ignoring %s', newCoin);
            return;
        }

        logger.debug('Proxy message for %s from %s to %s', algo, oldCoin, newCoin);

        if (newPool) {
            oldPool.relinquishMiners(
                function(miner, cback) {
                    // relinquish miners that are attached to one of the "Auto-switch" ports and leave the others there.
                    cback(proxyPorts.indexOf(miner.client.socket.localPort.toString()) !== -1)
                },
                function(clients) {
                    newPool.attachMiners(clients);
                }
            );
            proxySwitch[switchName].currentPool = newCoin;

            redisClient.hset('proxyState', algo, newCoin, function(error, obj) {
                if (error) {
                    logger.error('Redis error writing proxy config, err = %s', JSON.stringify(err))
                } else {
                    logger.debug('Last proxy state saved to redis for %s', algo);
                }
            });
        }
    };

    var onBanIP = function(message) {
        logger.silly('incoming banip message');
        for (var p in pools) {
            if (pools[p].stratumServer)
                pools[p].stratumServer.addBannedIP(message.ip);
        }
    };

    var onBlockNotify = function(message) {
        logger.silly('incoming blocknotify message');

        var messageCoin = message.coin.toLowerCase();
        var poolTarget = Object.keys(pools).filter(function(p) {
            return p.toLowerCase() === messageCoin;
        })[0];

        if (poolTarget)
            pools[poolTarget].processBlockNotify(message.hash, 'blocknotify script');
    };


    Object.keys(poolConfigs).forEach(function(coin) {

        var poolOptions = poolConfigs[coin];
        let componentStr = `Pool [:${(parseInt(forkId) + 1)}]`;
        let logger = loggerFactory.getLogger(componentStr, coin);
        var handlers = {
            auth: function() {},
            share: function() {},
            diff: function() {}
        };

        //Functions required for MPOS compatibility
        if (poolOptions.mposMode && poolOptions.mposMode.enabled) {
            var mposCompat = new MposCompatibility(poolOptions);

            handlers.auth = function(port, workerName, password, authCallback) {
                mposCompat.handleAuth(workerName, password, authCallback);
            };

            handlers.share = function(isValidShare, isValidBlock, data) {
                mposCompat.handleShare(isValidShare, isValidBlock, data);
            };

            handlers.diff = function(workerName, diff) {
                mposCompat.handleDifficultyUpdate(workerName, diff);
            }
        }

        //Functions required for Mongo Mode
        //else if (poolOptions.mongoMode && poolOptions.mongoMode.enabled) {
        //TODO: PRIORITY: Write this section
        //}

        //Functions required for internal payment processing
        else {

            var shareProcessor = new ShareProcessor(poolOptions);

            handlers.auth = function(port, workerName, password, authCallback) {
                if (!poolOptions.validateWorkerUsername) {
                    authCallback(true);
                } else {
                    try {
                        // tests address.worker syntax
                        let re = /^(?:[a-zA-Z0-9]+\.)*[a-zA-Z0-9]+$/;
                        if (re.test(workerName)) {
                            // not valid input, does not respect address.worker scheme. Acceptable chars a a-Z and 0-9
                            //todo log
                            if (workerName.indexOf('.') !== -1) {
                                //have worker
                                let tmp = workerName.split('.');
                                if (tmp.length !== 2) {
                                    authCallback(false);
                                } else {
                                    pool.daemon.cmd('validateaddress', [tmp[0]], function(results) {
                                        var isValid = results.filter(function(r) {
                                            return r.response.isvalid
                                        }).length > 0;

/*
                                         var authStatus = [];
                                         console.log('auth : '+coin + 'miner '+workerName+' isValid '+isValid+' results '+results+' timestamp'+ Date.now() / 1000)
//                                         authStatus.push(['hset', coin + ':auth', 'miner',workerName, Date.now() / 1000]);
					authStatus.push(['zadd', coin + ':auth', workerName | 0,isValid, [Date.now() / 1000].join(':')]);
                                          redisClient.multi(authStatus).exec(function(err, replies) {
// 					redisCommands.push(['zadd', coin + ':auth', workerName | 0,isValid, [Date.now() / 1000].join(':')]);
                                         console.log('redisClient resp.: '+replies);
					        if (err)
                                                 logger.error(logSystem, logComponent, logSubCat, 'Error with share processor multi ' + JSON.stringify(err));
                                                 });



*/
                                        authCallback(isValid);
                                    });
                                }
                            } else {
                                //only address
                                pool.daemon.cmd('validateaddress', [workerName], function(results) {
                                    var isValid = results.filter(function(r) {
                                        return r.response.isvalid
                                    }).length > 0;

/*

        				var authStatus = [];
					console.log('auth : '+coin + 'miner '+workerName+' isValid '+isValid+' results '+results+' timestamp'+ Date.now() / 1000)
        			//	authStatus.push(['hset', coin + ':auth', 'miner',workerName, Date.now() / 1000]);
        				 redisClient.multi(['zadd', coin + ':auth', 'miner',workerName, [Date.now() / 1000].join(':')]).exec(function(err, replies) {
					console.log('redisClient resp.: '+replies);
             					if (err)
                 				logger.error(logSystem, logComponent, logSubCat, 'Error with share processor multi ' + JSON.stringify(err));
         					});

*/
                                    authCallback(isValid);
                                });
                            }
                        } else {
                            authCallback(false);
                        }
                    } catch (e) {
                        authCallback(false);
                    }

                }
            };

            handlers.share = function(isValidShare, isValidBlock, data) {
                logger.silly('Handle share, execeuting shareProcessor.handleShare, isValidShare = %s, isValidBlock = %s, data = %s', isValidShare, isValidBlock, JSON.stringify(data))
                shareProcessor.handleShare(isValidShare, isValidBlock, data);
            };
        }

        var authorizeFN = function(ip, port, workerName, password, callback) {
            handlers.auth(port, workerName, password, function(authorized) {

                var authString = authorized ? 'Authorized' : 'Unauthorized ';

                // PASSWORD "c=pexa,m=solo" etc MOUSE422
                logger.debug('\u001b[32mAUTH>TRUE> authstr [%s] worker [%s] passwd [%s] ip [%s]\u001b[37m', authString, workerName, password, functions.anonymizeIP(ip));

                callback({
                    error: null,
                    authorized: authorized,
                    disconnect: false
                });
            });
        };



        var pool = Stratum.createPool(poolOptions, authorizeFN, logger);
        pool.on('share', function(isValidShare, isValidBlock, data) {

            let workerStr = data.worker;
            let workerInfo = workerStr.split('.');

            logger.silly('onStratumPoolShare');
            //    logger.debug("forkId %s", forkId);

            var shareDataJsonStr = JSON.stringify(data);

            if (data.blockHash && !isValidBlock) {
                if (workerInfo.length === 2) {
                    logger.info('\u001b[31mBLOCK>REJECTED> Found block rejected by the daemon, share data: %s\u001b[37m' + shareDataJsonStr);
                } else {
                    logger.info('\u001b[31mBLOCK>REJECTED> Found block rejected by the daemon, share data: %s\u001b[37m' + shareDataJsonStr);
                }
            } else if (isValidBlock) {
                if (workerInfo.length === 2) {
                    logger.warn('\u001b[33mBLOCK>ACCEPTED> %s by %s worker: %s\u001b[37m', data.blockHash, workerInfo[0], workerInfo[1]);
                    logger.warn('\u001b[33mBLOCK>ACCEPTED>INFO> %s\u001b[37m', JSON.stringify(data));
                } else {
                    logger.warn('\u001b[33mBLOCK>ACCEPTED> %s by %s worker: none\u001b[37m', data.blockHash, workerStr);
                    logger.warn('\u001b[33mBLOCK>ACCEPTED>INFO> %s\u001b[37m', JSON.stringify(data));
                }
            }

            if (workerInfo.length === 2) {
                if (isValidShare) {
                    if (data.shareDiff > 1000000000) {
                        logger.warn('\u001b[33mSHARE>WARN> Share was found with diff higher than 1.000.000.000!\u001b[37m');
                    } else if (data.shareDiff > 1000000) {
                        logger.warn('\u001b[36mSHARE>WARN> Share was found with diff higher than 1.000.000!\u001b[37m');
                    }
                    logger.info('\u001b[32mSHARE>ACCEPTED> job: %s req: %s res: %s by %s worker: %s \u001b[37m', data.job, data.difficulty, data.shareDiff,  workerInfo[1], functions.anonymizeIP(data.ip));
                } else if (!isValidShare) {
                    logger.info('\u001b[31mSHARE>REJECTED1!isValidShare> job: %s diff: %s by %s worker: %s reason: %s \u001b[37m', data.job, data.difficulty, workerInfo[1], data.error, functions.anonymizeIP(data.ip));
                }
            } else {
                if (isValidShare) {
                    if (data.shareDiff > 1000000000) {
                        logger.warn('\u001b[33mSHARE>WARN> Share was found with diff higher than 1.000.000.000!\u001b[37m');
                    } else if (data.shareDiff > 1000000) {
                        logger.warn('\u001b[36mSHARE>WARN> Share was found with diff higher than 1.000.000!\u001b[37m');
                    }
                    logger.info('\u001b[37mSHARE>ACCEPTED> job: %s req: %s res: %s by %s worker: none \u001b[37m', data.job, data.difficulty, data.shareDiff, workerStr, functions.anonymizeIP(data.ip));
                } else if (!isValidShare) {
                    logger.info('\u001b[31mSHARE>REJECTED>2 job: %s diff: %s by %s worker: none reason: %s [%s]\u001b[37m', data.job, data.difficulty, workerStr, data.error, functions.anonymizeIP(data.ip));
                }
            }

            handlers.share(isValidShare, isValidBlock, data)


        }).on('difficultyUpdate', function(workerName, diff) {

            let workerStr = workerName;
            let workerInfo = workerStr.split('.');

            if (workerInfo.length === 2) {
                logger.info('\u001b[35mDIFFICULTY>UPDATE> diff: %s miner: %s worker: %s\u001b[37m', diff, workerInfo[0], workerInfo[1]);
            } else {
                logger.info('\u001b[35mDIFFICULTY>UPDATE> diff: %s miner: %s worker: none\u001b[37m', diff, workerStr);
            }

            handlers.diff(workerName, diff);
        }).on('log', function(severity, text) {
            logger.info(text);
        }).on('banIP', function(ip, worker) {
            process.send({
                type: 'banIP',
                ip: ip
            });
        }).on('started', function() {
            _this.setDifficultyForProxyPort(pool, poolOptions.coin.name, poolOptions.coin.algorithm);
        });

        pool.start();
        pools[poolOptions.coin.name] = pool;
    });


    if (portalConfig.switching) {

        let logger = loggerFactory.getLogger(`SwitchingSetup[:${(parseInt(forkId) + 1)}]`, 'system');
        var proxyState = {};

        //
        // Load proxy state for each algorithm from redis which allows NOMP to resume operation
        // on the last pool it was using when reloaded or restarted
        //
        logger.debug('Loading last proxy state from redis');

        redisClient.on('error', function(err) {
            logger.debug(logSystem, logComponent, logSubCat, 'Pool configuration failed: ' + err);
        });

        redisClient.hgetall("proxyState", function(error, obj) {
            if (!error && obj) {
                proxyState = obj;
                logger.debug('Last proxy state loaded from redis');
            }

            //
            // Setup proxySwitch object to control proxy operations from configuration and any restored
            // state.  Each algorithm has a listening port, current coin name, and an active pool to
            // which traffic is directed when activated in the config.
            //
            // In addition, the proxy config also takes diff and varDiff parmeters the override the
            // defaults for the standard config of the coin.
            //
            Object.keys(portalConfig.switching).forEach(function(switchName) {

                var algorithm = portalConfig.switching[switchName].algorithm;

                if (!portalConfig.switching[switchName].enabled) return;


                var initalPool = proxyState.hasOwnProperty(algorithm) ? proxyState[algorithm] : _this.getFirstPoolForAlgorithm(algorithm);
                proxySwitch[switchName] = {
                    algorithm: algorithm,
                    ports: portalConfig.switching[switchName].ports,
                    currentPool: initalPool,
                    servers: []
                };


                Object.keys(proxySwitch[switchName].ports).forEach(function(port) {
                    var f = net.createServer(function(socket) {
                        var currentPool = proxySwitch[switchName].currentPool;

                        //todo to string interpolation, i'm tired
                        logger.debug('Connection to ' +
                            switchName + ' from ' +
                            socket.remoteAddress + ' on ' +
                            port + ' routing to ' + currentPool);

                        if (pools[currentPool]) {
                            pools[currentPool].getStratumServer().handleNewClient(socket);
                        } else {
                            pools[initalPool].getStratumServer().handleNewClient(socket);
                        }

                    }).listen(parseInt(port), function() {
                        //todo to string interpolation, i'm tired
                        logger.debug('Switching "' + switchName +
                            '" listening for ' + algorithm +
                            ' on port ' + port +
                            ' into ' + proxySwitch[switchName].currentPool);
                    });
                    proxySwitch[switchName].servers.push(f);
                });

            });
        });
    }

    this.getFirstPoolForAlgorithm = function(algorithm) {
        var foundCoin = "";
        Object.keys(poolConfigs).forEach(function(coinName) {
            if (poolConfigs[coinName].coin.algorithm == algorithm) {
                if (foundCoin === "")
                    foundCoin = coinName;
            }
        });
        return foundCoin;
    };

    //
    // Called when stratum pool emits its 'started' event to copy the initial diff and vardiff
    // configuation for any proxy switching ports configured into the stratum pool object.
    //
    this.setDifficultyForProxyPort = function(pool, coin, algo) {


        logger.debug(`[${algo}] Setting proxy difficulties after pool start`);

        Object.keys(portalConfig.switching).forEach(function(switchName) {
            if (!portalConfig.switching[switchName].enabled) {
                return
            }

            var switchAlgo = portalConfig.switching[switchName].algorithm;
            if (pool.options.coin.algorithm !== switchAlgo) {
                return
            }

            // we know the switch configuration matches the pool's algo, so setup the diff and
            // vardiff for each of the switch's ports
            for (var port in portalConfig.switching[switchName].ports) {

                if (portalConfig.switching[switchName].ports[port].varDiff) {
                    pool.setVarDiff(port, portalConfig.switching[switchName].ports[port].varDiff);
                }

                if (portalConfig.switching[switchName].ports[port].diff) {
                    if (!pool.options.ports.hasOwnProperty(port)) {
                        pool.options.ports[port] = {};
                    }
                    pool.options.ports[port].diff = portalConfig.switching[switchName].ports[port].diff;
                }
            }
        });
    };
};
