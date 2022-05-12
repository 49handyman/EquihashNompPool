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
//                onBlockNotify(message);

                 var messageCoin = message.coin.toLowerCase();
                 var poolTarget = Object.keys(pools).filter(function(p){
                     return p.toLowerCase() === messageCoin;
                 })[0];

                 if (poolTarget)
                     pools[poolTarget].processBlockNotify(message.hash, 'blocknotify script');


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


        //Functions required for internal payment processing
        else {

             var shareProcessor = new ShareProcessor(logger, poolOptions);

             handlers.auth = function(port, workerName, password, authCallback){
                 if (poolOptions.validateWorkerUsername !== true) {
                     authCallback(true);
                 } else {
                     authCallback(_this.validateAddress(String(workerName).split(".")[0], poolOptions));
                 }
             };

             handlers.share = function(isValidShare, isValidBlock, data){
                 shareProcessor.handleShare(isValidShare, isValidBlock, data);
             };
         }


        var authorizeFN = function(ip, port, workerName, password, callback) {
            handlers.auth(port, workerName, password, function(authorized) {

                var authString = authorized ? 'Authorized' : 'Unauthorized ';

              //  logger.debug('AUTH>TRUE> authstr '+' ip [%s]', authString,  functions.anonymizeIP(ip));
                logger.debug('AUTH>TRUE> authstr '+ authString +' ip '+   functions.anonymizeIP(ip));
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
            var shareDataJsonStr = JSON.stringify(data);
          //pm2   var logger2 = new PoolLogger({logColors: true});
            
            if (data.blockHash && !isValidBlock) {
                if (workerInfo.length === 2) {
                    logger.info('\u001b[33mHeight: '+ data.height + '\u001b[33m Block rejected by the daemon, share data: \u001b[37m' + shareDataJsonStr);
                } else {
                    logger.info('\u001b[33mHHeight: '+ data.height +'\u001b[33m Block rejected by the daemon, share data: \u001b[37m' + shareDataJsonStr);
                }
            } else if (isValidBlock) {
                if (workerInfo.length === 2) {
                    logger.info('\u001b[33mHeight: '+ data.height + ' job# ' +data.job+ ' Block found by miner: \u001b[37m'+ workerInfo[1]);
                    logger.info('\u001b[33mHeight: '+ data.height + ' job# ' +data.job+ ' BLOCK>ACCEPTED> Diff \u001b[37m'+parseFloat(data.shareDiff).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}));
			logger.info('\u0007');
                } else {
                    logger.info('\u001b[33mHeight: '+ data.height + ' job# ' +data.job+ ' Block found by miner: \u001b[37m' + workerInfo[0]);
			 logger.info('\u0007');

                }
            }

            if (workerInfo.length === 2) {
                if (isValidShare) {
                    if (data.shareDiff > 1000000000) {
			redisClient.hincrby([coin + ':bigDiff', workerStr, 1]);
			logger.info('\u001b[33mHHeight: '+ data.height + ' SHARE>WARN> Share was found with diff: \u001b[37m'+parseFloat(data.shareDiff).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})+', higher than 1,000,000,000!\u001b[37m ');
                    } else if (data.shareDiff > 1000000) {
			redisClient.hincrby([coin + ':bigDiff', workerStr, 1]);
			 logger.info('\u001b[33mHHeight: '+ data.height + ' SHARE>WARN> Share was found with diff: \u001b[37m'+parseFloat(data.shareDiff).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})+', higher than 1,000,000!\u001b[37m ');
                    }
                    logger.info('\u001b[32mHeight: '+ data.height + '\u001b[37m Job# ' + data.job +  '\u001b[35m Share diff ' + parseFloat(data.difficulty).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})+ '/'+parseFloat(data.shareDiff).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}) +' by miner\u001b[37m '+workerInfo[1] +' \u001b[37m');
                } else if (!isValidShare) {
                    logger.info('\u001b[31mSHARE>REJECTED> job# '+data.job+' diff: '+parseFloat(data.difficulty).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})+ '\u001b[32m by miner '+workerInfo[1] +' reason: \u001b[37m'+ data.error);                }
            } else {
                if (isValidShare) {
                    if (data.shareDiff > 1000000000) {
			redisClient.hincrby([coin + ':bigDiff',workerStr, 1]);
 			logger.info('Height: '+ data.height + '\u001b[33m SHARE>WARN> Share was found with diff: %s, higher than 1,000,000,000!\u001b[37m '+parseFloat(data.shareDiff).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}));
                    } else if (data.shareDiff > 1000000) {
			 redisClient.hincrby([coin + ':bigDiff',workerStr, 1]);
			 logger.info('Height: '+ data.height + '\u001b[33m SHARE>WARN> Share was found with diff: %s, higher than 1,000,000,000!\u001b[37m '+parseFloat(data.shareDiff).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}));
                    }
                    logger.info('Height: '+ data.height + '\u001b[32m SHARE>ACCEPTED> job: '+data.job+' \u001b[35m  Share diff '+parseFloat(data.difficulty).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})+ '/'+data.shareDiff.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}) +'\u001b[32m by miner\u001b[37m'+workerInfo[1] +' \u001b[37m');
                } else if (!isValidShare) {
                    logger.info('Height: '+ data.height + '\u001b[31m SHARE>REJECTED> job: '+data.job+' diff: '+parseFloat(data.difficulty).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})+ ' by '+workerInfo[1] +' reason: \u001b[37m'+ data.error);
                }
            }

            handlers.share(isValidShare, isValidBlock, data)


        }).on('difficultyUpdate', function(workerName, diff) {

            let workerStr = workerName;
            let workerInfo = workerStr.split('.');


            if (workerInfo.length === 2) {
                logger.info('\u001b[35mDifficulty update to diff  '+parseFloat(diff).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})+' worker: \u001b[37m' + workerInfo[1]);
            } else {
                logger.info('\u001b[35mDifficulty update to diff '+parseFloat(diff).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})+' worker: \u001b[37m' + workerStr);
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
            logger.debug('Pool configuration failed: ' + err);
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


         this.validateAddress = function(address, poolOptions) {
         let poolZAddressPrefix = (typeof poolOptions.zAddress !== 'undefined' ? poolOptions.zAddress : '').substring(0,2);
         let minerAddressLength = address.replace(/[^0-9a-z]/gi, '').length;
         let minerAddressPrefix = address.substring(0,2);
// console.log('this.validateAddress called poolworker ln373 : ',address, poolZAddressPrefix,minerAddressLength, minerAddressPrefix);
         if (typeof poolOptions.coin.privateChain !== 'undefined' && poolOptions.coin.privateChain === true) {
             var privateChain = poolOptions.coin.privateChain === true;
         } else {
             var privateChain = false;
         }

         if (privateChain && poolZAddressPrefix == 'zs' && minerAddressLength == 78 && minerAddressPrefix == 'zs') {
             //validate as sapling
// console.log('privateChain && poolZAddressPrefix == zs && 78 length : ',address, minerAddressLength,minerAddressPrefix)
             return true;
         } else if (privateChain && poolZAddressPrefix == 'zc' && minerAddressLength == 95 && minerAddressPrefix == 'zc') {
             //validate as sprout
             return true;
         } else if (privateChain || address.length >= 40 || address.length <= 30) {
// console.log('(privateChain || address.length >= 40 || address.length <= 30 : ',address, privateChain, poolZAddressPrefix , minerAddressLength, minerAddressPrefix);

             return false;

         } else {
             return true;
         }
     };






};
