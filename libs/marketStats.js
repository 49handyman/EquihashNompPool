var fs = require('fs');
var request = require('request');
var redis = require('redis');
var async = require('async');
const loggerFactory = require('./logger.js');

JSON.minify = JSON.minify || require("node-json-minify");

console.log('\u001b[35m marketstats.js called...');

var _this = this;

var logSystem = 'CoinData';

var redisClient = redis.createClient();

var coinData = [];

function marketStats() {
    console.log('\u001b[35m marketStats called...');
    response = request('https://api.nomics.com/v1/currencies/ticker?key=a61001570699a5ab9a3b1830cf0e9839&ids=KMD&interval=0d');
    console.log('\u001b[35m request called...', request);
    console.log('request response ' + response + body);

    if (response.statusCode == 200) {
        var data = JSON.parse(body);
        logger.info(logSystem, logComponent, 'marketStats', JSON.stringify(data));
        marketStatsUpdate.push(['zadd', 'komodo' + ':global', 'marketStats', JSON.stringify(data)]);
        redisClient(['zadd', logComponent + ':global', 'marketStats', JSON.stringify(data)])
        if (err) {
            logger.error(logSystem, 'Market', '\u001b[35m Error with redis during call to cacheMarketStats() ' + JSON.stringify(error));
            return;
        }
    }
}