//const requireSoSlow = require('require-so-slow');
var fs = require('fs');
var path = require('path');
var os = require('os');
var cluster = require('cluster');
var async = require('async');
var redis = require('redis');
var CreateRedisClient = require('./libs/createRedisClient.js');

var extend = require('extend');
var PoolLogger = require('./libs/logUtil.js');

var CliListener = require('./libs/cliListener.js');
var PoolWorker = require('./libs/poolWorker.js');
var PaymentProcessor = require('./libs/paymentProcessor.js');
var Website = require('./libs/website.js');
var ProfitSwitch = require('./libs/profitSwitch.js');

const loggerFactory = require('./libs/logger.js');
const logger = loggerFactory.getLogger('init.js', 'system');
var algos = require('stratum-pool/lib/algoProperties.js');
const marketStats = require('./libs/marketStats.js');
JSON.minify = JSON.minify || require("node-json-minify");


if (!fs.existsSync('config.json')) {
    console.log('config.json file does not exist. Read the installation/setup instructions.');
    return;
}
var portalConfig = JSON.parse(JSON.minify(fs.readFileSync("config.json", {
    encoding: 'utf8'
})));
var poolConfigs;

var logger2 = new PoolLogger({
    logLevel: portalConfig.logLevel,
    logColors: portalConfig.logColors
});

try {
    var posix = require('posix');
    try {
        posix.setrlimit('nofile', {
            soft: 100000,
            hard: 100000
        });
    } catch (e) {
        if (cluster.isMaster) {
            logger.warn('POSIX Connection Limit (Safe to ignore) Must be ran as root to increase resource limits');
        }
    } finally {
        // Find out which user used sudo through the environment variable
        var uid = parseInt(process.env.SUDO_UID);
        // Set our server's uid to that user
        if (uid) {
            process.setuid(uid);
            logger.warn('Pool Server Starting...')
            logger.debug('POSIX Connection Limit Raised to 100K concurrent connections, now running as non-root user: %s', process.getuid());
        }
    }
} catch (e) {
    if (cluster.isMaster) {
        logger.debug('POSIX Connection Limit (Safe to ignore) POSIX module not installed and resource (connection) limit was not raised');
    }
}



if (cluster.isWorker) {

    switch (process.env.workerType) {
        case 'pool':
            new PoolWorker();
            break;
        case 'paymentProcessor':
            new PaymentProcessor();
            break;
        case 'website':
            new Website();
            break;
        case 'profitSwitch':
            new ProfitSwitch();
            break;
        case 'marketStats':
            new marketStats();
            break;
            
    }

    return;
}


//Read all pool configs from pool_configs and join them with their coin profile
var buildPoolConfigs = function() {
    var configs = {};
    var configDir = 'pool_configs/';
    var poolConfigFiles = [];
    /* Get filenames of pool config json files that are enabled */
    fs.readdirSync(configDir).forEach(function(file) {
        if (!fs.existsSync(configDir + file) || path.extname(configDir + file) !== '.json') return;
        var poolOptions = JSON.parse(JSON.minify(fs.readFileSync(configDir + file, {
            encoding: 'utf8'
        })));
        if (!poolOptions.enabled) return;
        poolOptions.fileName = file;
        poolConfigFiles.push(poolOptions);
    });
    /* Ensure no pool uses any of the same ports as another pool */
    for (var i = 0; i < poolConfigFiles.length; i++) {
        var ports = Object.keys(poolConfigFiles[i].ports);
        for (var f = 0; f < poolConfigFiles.length; f++) {
            if (f === i) continue;
            var portsF = Object.keys(poolConfigFiles[f].ports);
            for (var g = 0; g < portsF.length; g++) {
                if (ports.indexOf(portsF[g]) !== -1) {
                    logger.error('init', coin , poolConfigFiles[f].fileName, 'Has same configured port of ' + portsF[g] + ' as ' + poolConfigFiles[i].fileName);
                    process.exit(1);
                    return;
                }
            }
            if (poolConfigFiles[f].coin === poolConfigFiles[i].coin) {
                logger.error('init', coin , poolConfigFiles[f].fileName, 'Pool has same configured coin file coins/' + poolConfigFiles[f].coin + ' as ' + poolConfigFiles[i].fileName + ' pool');
                process.exit(1);
                return;
            }
        }
    }
    poolConfigFiles.forEach(function(poolOptions) {

        poolOptions.coinFileName = poolOptions.coin;

        var coinFilePath = 'coins/' + poolOptions.coinFileName;
        if (!fs.existsSync(coinFilePath)) {
            logger.error('init', coin , '[%s] could not find file %s ', poolOptions.coinFileName, coinFilePath);
            return;
        }

        var coinProfile = JSON.parse(JSON.minify(fs.readFileSync(coinFilePath, {
            encoding: 'utf8'
        })));
        poolOptions.coin = coinProfile;
        poolOptions.coin.name = poolOptions.coin.name.toLowerCase();
        if (poolOptions.coin.name in configs) {
            logger.error('init', coin , '%s coins/' + poolOptions.coinFileName +
                ' has same configured coin name ' + poolOptions.coin.name + ' as coins/' +
                configs[poolOptions.coin.name].coinFileName + ' used by pool config ' +
                configs[poolOptions.coin.name].fileName, poolOptions.fileName);
            process.exit(1);
            return;
        }
        for (var option in portalConfig.defaultPoolConfigs) {
            if (!(option in poolOptions)) {
                var toCloneOption = portalConfig.defaultPoolConfigs[option];
                var clonedOption = {};
                if (toCloneOption.constructor === Object) {
                    Object.assign(clonedOption, toCloneOption);
                } else {
                    clonedOption = toCloneOption;
                }
                poolOptions[option] = clonedOption;
            }
        }
        configs[poolOptions.coin.name] = poolOptions;
        if (!(coinProfile.algorithm in algos)) {
            logger.error('init', '[%s] Cannot run a pool for unsupported algorithm "' + coinProfile.algorithm + '"', coinProfile.name);
            delete configs[poolOptions.coin.name];
        }
    });
    return configs;
};

var buildAuxConfigs = function() {
    var configs = {};
    var configDir = 'aux_configs/';
    var poolConfigFiles = [];
    fs.readdirSync(configDir).forEach(function(file) {
        if (!fs.existsSync(configDir + file) || path.extname(configDir + file) !== '.json') return;
        var poolOptions = JSON.parse(JSON.minify(fs.readFileSync(configDir + file, {
            encoding: 'utf8'
        })));
        if (!poolOptions.enabled) return;
        poolOptions.fileName = file;
        poolConfigFiles.push(poolOptions);
    });
    poolConfigFiles.forEach(function(poolOptions) {
        poolOptions.coinFileName = poolOptions.coin;
        var poolFilePath = 'coins/' + poolOptions.coinFileName;
        if (!fs.existsSync(poolFilePath)) {
            logger.warn('Master', poolOptions.coinFileName, 'could not find file: ' + poolFilePath);
            return;
        }
        var poolProfile = JSON.parse(JSON.minify(fs.readFileSync(poolFilePath, {
            encoding: 'utf8'
        })));
        poolOptions.coin = poolProfile;
        poolOptions.coin.name = poolOptions.coin.name.toLowerCase();
        configs[poolOptions.coin.name] = poolOptions;
        for (var option in portalConfig.defaultPoolConfigs) {
            if (!(option in poolOptions)) {
                var toCloneOption = portalConfig.defaultPoolConfigs[option];
                var clonedOption = {};
                if (toCloneOption.constructor === Object)
                    extend(true, clonedOption, toCloneOption);
                else
                    clonedOption = toCloneOption;
                poolOptions[option] = clonedOption;
            }
        }
        if (!(poolProfile.algorithm in algos)) {
            logger.warn('Master'+ coinProfile.name+ 'Cannot run a pool for unsupported algorithm "' + coinProfile.algorithm + '"');
            delete configs[poolOptions.coin.name];
        }
    });
    return configs;
};

var _lastStartTimes = [];
var _lastShareTimes = [];

var spawnPoolWorkers = function() {

    var redisConfig;
    var connection;

    Object.keys(poolConfigs).forEach(function(coin) {
        var p = poolConfigs[coin];
        if (!Array.isArray(p.daemons) || p.daemons.length < 1) {
            logger.error(coin , '[%s] No daemons configured so a pool cannot be started for this coin.', coin);
            delete poolConfigs[coin];
        } else if (!connection) {
            redisConfig = p.redis;
            connection = CreateRedisClient(redisConfig);
            if (redisConfig.password != "") {
                connection.auth(redisConfig.password);
                connection.on("error", function (err) {
                    logger.error('init', coin , "redis", coin, "An error occured while attempting to authenticate redis: " + err);
                });
            }
            connection.on('ready', function(){
                logger.debug(coin, 'TimeShare processing setup with redis (' + connection.snompEndpoint + ')');
            });
        }
    });
    if (Object.keys(poolConfigs).length === 0) {
        logger.warn('PoolSpawner: No pool configs exists or are enabled in pool_configs folder. No pools spawned.');
        return;
    }
    var serializedConfigs = JSON.stringify(poolConfigs);
    var numForks = (function() {
        if (!portalConfig.clustering || !portalConfig.clustering.enabled) {
            return 1;
        }
        if (portalConfig.clustering.forks === 'auto') {
            return os.cpus().length;
        }
        if (!portalConfig.clustering.forks || isNaN(portalConfig.clustering.forks)) {
            return 1;
        }
        return portalConfig.clustering.forks;
    })();

    var poolWorkers = {};

    var createPoolWorker = function(forkId) {
        var worker = cluster.fork({
            workerType: 'pool',
            forkId: forkId,
            pools: serializedConfigs,
            portalConfig: JSON.stringify(portalConfig)
        });
        worker.forkId = forkId;
        worker.type = 'pool';
        poolWorkers[forkId] = worker;
        worker.on('exit', function(code, signal) {
            logger.error('pool' , 'PoolSpawner: Fork %s died, spawning replacement worker...', forkId);
            setTimeout(function() {
                createPoolWorker(forkId);
            }, 2000);
        }).on('message', function(msg) {
            switch (msg.type) {
                case 'banIP':
                    Object.keys(cluster.workers).forEach(function(id) {
                        if (cluster.workers[id].type === 'pool') {
                            cluster.workers[id].send({
                                type: 'banIP',
                                ip: msg.ip
                            });
                        }
                    });
                    break;
                case 'shareTrack':
                        // pplnt time share tracking of workers
                        if (msg.isValidShare && !msg.isValidBlock) {
                            var now = Date.now();
                            var lastShareTime = now;
                            var lastStartTime = now;
                            var workerAddress = msg.data.worker.split('.')[0];
                            
                            // if needed, initialize PPLNT objects for coin
                            if (!_lastShareTimes[msg.coin]) {
                                _lastShareTimes[msg.coin] = {};
                            }
                            if (!_lastStartTimes[msg.coin]) {
                                _lastStartTimes[msg.coin] = {};
                            }
                            
                            // did they just join in this round?
                            if (!_lastShareTimes[msg.coin][workerAddress] || !_lastStartTimes[msg.coin][workerAddress]) {
                                _lastShareTimes[msg.coin][workerAddress] = now;
                                _lastStartTimes[msg.coin][workerAddress] = now;
                                logger.debug('PPLNT', msg.coin, 'Thread '+msg.thread, workerAddress+' joined.');
                            }
                            // grab last times from memory objects
                            if (_lastShareTimes[msg.coin][workerAddress] != null && _lastShareTimes[msg.coin][workerAddress] > 0) {
                                lastShareTime = _lastShareTimes[msg.coin][workerAddress];
                                lastStartTime = _lastStartTimes[msg.coin][workerAddress];
                            }
                            
                            var redisCommands = [];
                            
                            // if its been less than 15 minutes since last share was submitted
                            var timeChangeSec = roundTo(Math.max(now - lastShareTime, 0) / 1000, 4);
                            //var timeChangeTotal = roundTo(Math.max(now - lastStartTime, 0) / 1000, 4);
                            if (timeChangeSec < 900) {
                                // loyal miner keeps mining :)
                                redisCommands.push(['hincrbyfloat', msg.coin + ':shares:timesCurrent', workerAddress + "." + poolConfigs[msg.coin].poolId, timeChangeSec]);                            
                                //logger.debug('init', coin , 'PPLNT', msg.coin, 'Thread '+msg.thread, workerAddress+':{totalTimeSec:'+timeChangeTotal+', timeChangeSec:'+timeChangeSec+'}');
                                connection.multi(redisCommands).exec(function(err, replies){
                                    if (err)
                                        logger.error('PPLNT', msg.coin, 'Thread '+msg.thread, 'Error with time share processor call to redis ' + JSON.stringify(err));
                                });
                            } else {
                                // they just re-joined the pool
                                _lastStartTimes[workerAddress] = now;
                                logger.debug(msg.coin, 'Thread '+msg.thread, workerAddress+' re-joined.');
                            }
                            
                            // track last time share
                            _lastShareTimes[msg.coin][workerAddress] = now;
                        }
                        if (msg.isValidBlock) {
                            // reset pplnt share times for next round
                            _lastShareTimes[msg.coin] = {};
                            _lastStartTimes[msg.coin] = {};
                        }
                    break;    
            }
        });
    };
    var i = 0;
    var spawnInterval = setInterval(function() {
        createPoolWorker(i);
        i++;
        if (i === numForks) {
            clearInterval(spawnInterval);
            logger.debug('PoolSpawner' , 'Master PoolSpawner Spawned ' + Object.keys(poolConfigs).length + ' pool(s) on ' + numForks + ' thread(s)');
           // logger.debug('Master2', 'PoolSpawner', 'Spawned ' + Object.keys(poolConfigs).length + ' pool(s) on ' + numForks + ' thread(s)');

        }
    }, 250);
};

var startCliListener = function() {
    let cliHost = '';
    if (portalConfig.cliHost) {
        cliHost = portalConfig.cliHost;
    } else {
        // For backward compatibility
        cliHost = '127.0.0.1';
    }
    var cliPort = portalConfig.cliPort;
    var listener = new CliListener(cliHost, cliPort);
    listener.on('log', function(text) {
        
    }).on('command', function(command, params, options, reply) {
        switch (command) {
            case 'blocknotify':
                Object.keys(cluster.workers).forEach(function(id) {
                    cluster.workers[id].send({
                        type: 'blocknotify',
                        coin: params[0],
                        hash: params[1]
                    });
                });
                reply('Pool workers notified');
                break;
            case 'coinswitch':
                processCoinSwitchCommand(params, options, reply);
                
                break;
            case 'reloadpool':
                Object.keys(cluster.workers).forEach(function(id) {
                    cluster.workers[id].send({
                        type: 'reloadpool',
                        coin: params[0]
                    });
                });
                reply('reloaded pool ' + params[0]);
                break;
            default:
                reply('unrecognized command "' + command + '"');
                break;
        }
    }).start();
};


var processCoinSwitchCommand = function(params, options, reply) {
    var logSystem = 'CLI';
    var logComponent = 'coinswitch';
    var replyError = function(msg) {
        reply(msg);
        logger.error('CLI' ,  msg+' params: '+JSON.stringify(params)+' options: ' +JSON.stringify(options));
    };
    if (!params[0]) {
        replyError('Coin name required');
        return;
    }
    if (!params[1] && !options.algorithm) {
        replyError('If switch key is not provided then algorithm options must be specified');
        return;
    } else if (params[1] && !portalConfig.switching[params[1]]) {
        replyError('Switch key not recognized: ' + params[1]);
        return;
    } else if (options.algorithm && !Object.keys(portalConfig.switching).filter(function(s) {
            return portalConfig.switching[s].algorithm === options.algorithm;
        })[0]) {
        replyError('No switching options contain the algorithm ' + options.algorithm);
        return;
    }

    var messageCoin = params[0].toLowerCase();
    var newCoin = Object.keys(poolConfigs).filter(function(p) {
        return p.toLowerCase() === messageCoin;
    })[0];
    if (!newCoin) {
        replyError('Switch message to coin that is not recognized: ' + messageCoin);
        return;
    }
    var switchNames = [];
    if (params[1]) {
        switchNames.push(params[1]);
    } else {
        for (var name in portalConfig.switching) {
            if (portalConfig.switching[name].enabled && portalConfig.switching[name].algorithm === options.algorithm)
                switchNames.push(name);
        }
    }
    switchNames.forEach(function(name) {
        if (poolConfigs[newCoin].coin.algorithm !== portalConfig.switching[name].algorithm) {
            replyError('Cannot switch a ' +
                portalConfig.switching[name].algorithm +
                ' algo pool to coin ' + newCoin + ' with ' + poolConfigs[newCoin].coin.algorithm + ' algo');
            return;
        }
        Object.keys(cluster.workers).forEach(function(id) {
            cluster.workers[id].send({
                type: 'coinswitch',
                coin: newCoin,
                switchName: name
            });
        });
    });
    reply('Switch message sent to pool workers');
};

var startPaymentProcessor = function() {
    var enabledForAny = false;
    for (var pool in poolConfigs) {
        var p = poolConfigs[pool];
        var enabled = p.enabled && p.paymentProcessing && p.paymentProcessing.enabled;
        logger.info('PaymentProcess' , 'startPaymentProcessor if (Enabled) '+ p.enabled + ' '+ p.paymentProcessing+ ' ' + p.paymentProcessing.enabled )
        if (enabled) {
            enabledForAny = true;
            break;
        }
    }
    if (!enabledForAny)
        return;
    var worker = cluster.fork({
        workerType: 'paymentProcessor',
        pools: JSON.stringify(poolConfigs)
    });
    worker.on('exit', function(code, signal) {
        logger.error('paymentProcess' , 'Master Payment processor died, spawning replacement...');
        setTimeout(function() {
            startPaymentProcessor(poolConfigs);
        }, 3000);
    });
};

var startmarketStats = function() {
    var enabledForAny = false;
    for (var pool in poolConfigs) {
        var p = poolConfigs[pool];
        var enabled = p.enabled && p.marketStats;
        if (enabled) {
            logger.info('MarketStats', pool , '\u001b[35m start marketStats if (Enabled) '+ pool+ enabled+ p.enabled+ p.marketStats)
            enabledForAny = true;
            break;
        }
    }
    if (!enabledForAny)
        return;
    var worker = cluster.fork({
        workerType: 'marketStats',
        pools: JSON.stringify(poolConfigs)
    });
    worker.on('exit', function(code, signal) {
        logger.error('MarketStats', pool , 'Master marketStats Processor MarketStats died, spawning replacement...'+ code+ signal);
        setTimeout(function() {
            startmarketStats(poolConfigs);
        }, 2000);
    });
};


var startAuxPaymentProcessor = function() {
    var enabledForAny = false;
    for (var aux in auxConfigs) {
        var p = auxConfigs[aux];
        var enabled = p.enabled && p.paymentProcessing && p.paymentProcessing.enabled;
        if (enabled) {
            enabledForAny = true;
            break;
        }
    }

    if (!enabledForAny)
        return;
    var worker = cluster.fork({
        workerType: 'paymentProcessor',
        pools: JSON.stringify(auxConfigs)
    });
    worker.on('exit', function(code, signal) {
        logger.error('Master Auxilliary Payment Processor Auxilliary Payment processor died, spawning replacement...');
        setTimeout(function() {
            startPaymentProcessor(auxConfigs);
        }, 2000);
    });
};

var startWebsite = function() {
    if (!portalConfig.website.enabled) return;
    logger.warn('Pool Server Starting...');
    var worker = cluster.fork({
        workerType: 'website',
        pools: JSON.stringify(poolConfigs),
        portalConfig: JSON.stringify(portalConfig)
    });
    worker.on('exit', function(code, signal) {
        logger.error('Website' , 'Master Website process died, spawning replacement...');
        setTimeout(function() {
            startWebsite(portalConfig, poolConfigs);
        }, 2000);
    });
};

var startProfitSwitch = function() {
  

    var worker = cluster.fork({
        workerType: 'profitSwitch',
        pools: JSON.stringify(poolConfigs),
        portalConfig: JSON.stringify(portalConfig)
    });
    worker.on('exit', function(code, signal) {
        logger.error(workerType , 'Profit switching process died, spawning replacement...');
        setTimeout(function() {
            startProfitSwitch(portalConfig, poolConfigs);
        }, 2000);
    });
};


(function init() {
    poolConfigs = buildPoolConfigs();
    auxConfigs = buildAuxConfigs();
    spawnPoolWorkers();
    

    setTimeout(function() {
        startmarketStats();
        startPaymentProcessor();
        startAuxPaymentProcessor();
        startWebsite();
        startProfitSwitch();
        startCliListener();
    }, 2000);
})();
