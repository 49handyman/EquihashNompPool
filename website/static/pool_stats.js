var poolWorkerChart;
var poolHashrateChart;
var poolBlockChart;
var price;
var netDiff;
// Your moment
var mmt = moment();

// Your moment at midnight
var mmtMidnight = mmt.clone().startOf('day');

// Difference in minutes
var diffMinutes = mmt.diff(mmtMidnight, 'minutes');

// Your moment
var mmt = moment();

// Your moment at midnight
var mmtMidnight = mmt.clone().startOf('day');

sinceMidnight = moment("24:00:00", "hh:mm:ss").diff(moment(), 'seconds');
var diffSeconds = mmt.diff(mmtMidnight, 'milliseconds');
console.log('moment: '+mmt+' midNight: '+mmtMidnight+' Date.now: '+Date.now()+' sinceMidnight: '+sinceMidnight+' diffMinutes: '+diffMinutes*1000*60*60*60)



///

 var now = new Date();
  let yesterday=new Date(new Date().getTime() - (1 * 24 * 60 * 60 * 1000));
  let last7Days=new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000));
 // var data=obj.filter(p => new Date(p.LastSeenDate) <= yesterday && new Date(p.LastSeenDate) >= last3Days);  
//console.log('yesterday : '+yesterday+' '+last7Days)

///

function displayCharts() {
    var stats = getPoolStats(poolName);
    var maxScale = getReadableHashRatePair(Math.max.apply(null, stats.hashrate.map(x => x[1])));
    poolHashrateChart = createDefaultLineChart(
      document.getElementById("poolHashChart").getContext('2d'),
      [{
          label: 'Actual',
          fill: false,
          data: stats.hashrate.map(x => {
            return {
              t: x[0],
              y: getScaledHashrate(x[1], maxScale[2])
            }
          }),
          borderWidth: 2,
          backgroundColor: '#348EA9',
          borderColor: '#348EA9'
        },
        {
          label: 'Averaged',
          fill: false,
          data: stats.averagedHashrate.map(x => {
            return {
              t: x[0],
              y: getScaledHashrate(x[1], maxScale[2])
            }
          }),
          borderWidth: 2,
          backgroundColor: '#E81D62',
          borderColor: '#E81D62'
      }],
      'Time',
      'Hash Rate',
   );
}
$.get({
    url: "https://api.coingecko.com/api/v3/coins/" + poolName,
    success: function(data) {
   //     console.log(data);
        $("#priceUsd").html('$' + parseFloat(data.market_data.current_price.usd).toFixed(5) + ' USD');
        price = parseFloat(data.market_data.current_price.usd).toFixed(5);
        $("#priceBtc").html(parseFloat(data.market_data.current_price.btc) + ' BTC');
        $("#rank").html(data.market_cap_rank) + ' th';

        var change1h = data.market_data.price_change_percentage_1h_in_currency.usd;
        if (parseFloat(change1h) > 0) {
            $("#change1h").parent().attr("class", "text-success");
        }
        $("#change1h").html(change1h);

        var change24 = data.market_data.price_change_percentage_24h_in_currency.usd;
        if (parseFloat(change24) > 0) {
            $("#change24h").parent().attr("class", "text-success");
        }

        $("#change24h").html(change24);
        $("#marketCap").html(Number(parseFloat(data.market_data.market_cap.usd)).toLocaleString());
        $("#volume24").html(Number(parseFloat(data.market_data.total_volume.usd)).toLocaleString());
        $("#ath").html('$' + Number(parseFloat(data.market_data.ath['usd'])).toLocaleString());
        $("#24h_high").html('$' + Number(parseFloat(data.market_data.high_24h['usd'])).toFixed(2));
        if (data?.ico_data?.short_desc) {
            var short_desc = data?.ico_data?.short_desc
        };
        $("#shortDesc").html(data.id + ': ' + short_desc || undefined);
        $("#homePage").html('<a href=' + data.links.homepage[0] + ' target="_blank">' + data.id + '<br> Home Page </a>');
        $("#explorerUrl").html('<a href=' + data.links.blockchain_site[0] + ' target="_blank">' + data.id + '<br> Explorer</a>');
        $("#tradeUrl1").html('<a href=' + data?.tickers[1]?.trade_url + ' target="_blank">' + data?.tickers[1]?.market.name + '<br> ' + data?.tickers[1]?.base + '-' + data?.tickers[1]?.target + ' ' + data?.tickers[1]?.last + '</a>');
        $("#tradeUrl2").html('<a href=' + data?.tickers[2]?.trade_url + ' target="_blank">' + data?.tickers[2]?.market.name + '<br> ' + data?.tickers[2]?.base + '-' + data?.tickers[2]?.target + ' ' + data?.tickers[2]?.last + '</a>');
        $("#tradeUrl3").html('<a href=' + data?.tickers[3]?.trade_url + ' target="_blank">' + data?.tickers[3]?.market.name + '<br> ' + data?.tickers[3]?.base + '-' + data?.tickers[3]?.target + ' ' + data?.tickers[3]?.last + '</a>');
        $("#tradeUrl4").html('<a href=' + data?.tickers[4]?.trade_url + ' target="_blank">' + data?.tickers[4]?.market.name + '<br> ' + data?.tickers[4]?.base + '-' + data?.tickers[4]?.target + ' ' + data?.tickers[4]?.last + '</a>');
        $("#tradeUrl5").html('<a href=' + data?.tickers[5]?.trade_url + ' target="_blank">' + data?.tickers[5]?.market.name + '<br> ' + data?.tickers[5]?.base + '-' + data?.tickers[5]?.target + ' ' + data?.tickers[5]?.last + '</a>');
        $("#tradeUrl6").html('<a href=' + data?.tickers[8]?.trade_url + ' target="_blank">' + data?.tickers[8]?.market.name + '<br> ' + data?.tickers[8]?.base + '-' + data?.tickers[8]?.target + ' ' + data?.tickers[8]?.last + '</a>');
        $("#tradeUrl7").html('<a href=' + data?.tickers[9]?.trade_url + ' target="_blank">' + data?.tickers[9]?.market.name + '<br> ' + data?.tickers[9]?.base + '-' + data?.tickers[9]?.target + ' ' + data?.tickers[9]?.last + '</a>');
        $("#tradeUrl8").html('<a href=' + data?.tickers[15]?.trade_url + ' target="_blank">' + data?.tickers[15]?.market.name + '<br> ' + data?.tickers[15]?.base + '-' + data?.tickers[15]?.target + ' ' + data?.tickers[15]?.last + '</a>');

        $("#githubUrl").html('<a href=' + data.links?.repos_url?.github[0] + ' target="_blank">' + data.id + '<br> github</a>');

    }
});
//doug 
$.getJSON('/api/pool_stats', function(data) {
    if (document.hidden) return;
    //Add pool to tracker
    addPoolToTracker(data, poolName, function() {
        displayCharts();
    });
});
statsSource.addEventListener('message', function(e) {
    var stats = JSON.parse(e.data);
    updatePoolData(stats, poolName, function(pool) {
        var max = Math.max.apply(null, pool.hashrate.map(x => x[1]));
        var pair = getReadableHashRatePair(max);
        var hash = getScaledHashrate(poolName in stats.pools ? stats.pools[poolName].hashrate : 0, pair[2]);
        var sols = getScaledHashrate(poolName in stats.pools ? stats.pools[poolName].poolStats.networkSols : 0, pair[2]);
        var pairsols = getReadableHashRatePair(sols);
	var networkPercent = (poolName in stats.pools ? stats.pools[poolName].hashrate : 0)*2/1000000/(poolName in stats.pools ? stats.pools[poolName].poolStats.networkSols : 0)
        var timeSinceLastBlock = Date.now() - (stats.pools[poolName]?.blocks?.lastBlock[0]?.split(':')[4]) * 1000 || 0
        if (timeSinceLastBlock / 1000 / 60 <= 60) {
            var t = ' Mins';
            timeSinceLastBlock = (timeSinceLastBlock / 1000 / 60);
            $("#timeSinceBlock").html(parseFloat(timeSinceLastBlock).toFixed(2) + t);
        } else {
            timeSinceLastBlock = (timeSinceLastBlock / 1000 / 60 / 60);
            t = ' HRs'
            $("#timeSinceBlock").html(parseFloat(timeSinceLastBlock).toFixed(2) + t);
        }
        $("#networkPercent").html((parseFloat(networkPercent * 100)).toFixed(4) + ' %');
        $("#validShares").text(poolName in stats.pools ? stats.pools[poolName].poolStats.validShares : 0);
	$("#poolHashRate").text((!isNaN(hash) ? hash : 0) + ' ' + (pair[1] ? pair[1] : 'Sols/s'));
        $("#luckDays").text(poolName in stats.pools ? stats.pools[poolName].luckDays + ' Days' : 0);
        $("#luckHours").text(poolName in stats.pools ? stats.pools[poolName].luckHours + ' Hours' : 0);
        $("#lastBlockPaid").text(poolName in stats.pools ? stats.pools[poolName]?.payments[0]?.blocks[0] : 0);
        $("#lastBlockFound").html(poolName in stats.pools ? '<a href="' + stats.pools[poolName].explorerGetBlock + stats.pools[poolName]?.blocks?.lastBlock[0]?.split(':')[0] + '" target="_blank">' + stats.pools[poolName]?.blocks?.lastBlock[0]?.split(':')[3] + '</a>' : 0);
        $("#lastBlockFoundTime").html(poolName in stats.pools ? timeOfDayFormat(stats.pools[poolName]?.blocks?.lastBlock[0]?.split(':')[4] * 1000) || 0 : 0);
        $("#lastBlockAmt").text(poolName in stats.pools ? (parseFloat((stats.pools[poolName]?.payments[0] || 0).paid).toFixed(4) || 0) : 0);
        $("#poolWorkers").text(poolName in stats.pools ? stats.pools[poolName].workerCount : 0);
        $("#pendingBlocks").text(poolName in stats.pools ? stats.pools[poolName]?.blocks?.pending : 0);
        $("#confirmedBlocks").text(poolName in stats.pools ? stats.pools[poolName]?.blocks?.confirmed : 0);
        $("#networkHashRate").text(poolName in stats.pools ? getReadableNetworkHashRateString(stats.pools[poolName].poolStats.networkSols) : 0); //doug
        $("#networkBlocks").text(poolName in stats.pools ? stats.pools[poolName].poolStats.networkBlocks : 0);
        $("#networkDiff").text(poolName in stats.pools ? getReadableNetworkDiffString(stats.pools[poolName].poolStats.networkDiff) : 0); //doug
        $("#validBlocks").text(poolName in stats.pools ? stats.pools[poolName].poolStats.validBlocks : 0);
        $("#networkTime").text(poolName in stats.pools ? timeOfDayFormat(Date.now()) : 0);
        $("#kicked").text(poolName in stats ? pools[poolName]?.blocksKicked : 0);
        $("#poolPaidOut").text(poolName in stats.pools ? '$' + parseFloat(((stats.pools[poolName].poolStats?.totalPaid) || 0) * price || 0).toFixed(2) + ' USD' : 0);
        $("#workers").text(poolName in stats.pools ? stats.pools[poolName]?.blocks?.blocksFound : 0);
        $("#blockFound").html(poolName in stats.pools ? '<a href="' + stats.pools[poolName].explorerGetBlock + stats.pools[poolName]?.confirmed?.blocks[0]?.split(':')[0] + '" target="_blank">' + stats.pools[poolName]?.confirmed?.blocks[0]?.split(':')[2] + '</a>' : 0);

	$("#poolStartTime").html(poolName in stats.pools ?  timeOfDayFormat(stats.pools[poolName].poolStats.poolStartTime*1000) : 0);
        var time = stats.time * 1000;
        var avg = pool.averagedHashrate;
        addChartData(poolHashrateChart, poolHashrateChart.data.datasets[0], {
            t: time,
            y: hash
        }, false);
        addChartData(poolHashrateChart, poolHashrateChart.data.datasets[1], {
            t: time,
            y: getScaledHashrate(avg[avg.length - 1][1], pair[2])
        }, true);
//        addChartData(poolHashrateChart, poolBlockChart.data.datasets[3], { 
//            t: time,
//            y: poolName in stats.pools ? stats.pools[poolName].blocks.pending : 0
//        }, true);

    });
}, false);
//console.log('dataset ',poolBlockChart.data.datasets);

$.getJSON('/api/stats', function(data) {
    const array = [];
    for (var p in data.pools) {
        for (var w in data.pools[p].workers) {
            var worker = getWorkerNameFromAddress(w);
            miner = w.split('.')[1];
            //console.log('worker in w, miner :', worker, w, miner);
            var miner = worker + ' ' + 'Blocks : ' + parseInt((data.pools[p].blocks.blocksFound[w]) || 0) + ' | '
            array.push(miner);
            //          $("#blocks").text( worker+': '+data.pools[p].blocks.blocksFound[w]);
        }
    }
 //   console.log(array)
    $("#blocks").html(array);
    //console.log(allblocks, blocks);
});


function timeOfDayFormat(timestamp) {
    return new Date(parseInt(timestamp)).toLocaleTimeString('en-US')
}

function readableDate(a) {
    return new Date(parseInt(a)).toISOString().substring(0, 16).replace('T', ' ') + ' UTC';
}


function getReadableNetworkHashRateString(hashrate) {
    hashrate = (hashrate * 1000000);
    if (hashrate < 1000000)
        return '0 Sol';
    var byteUnits = [' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s'];
    var i = Math.floor((Math.log(hashrate / 1000) / Math.log(1000)) - 1);
    hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);
    return hashrate.toFixed(2) + byteUnits[i];
}

function getReadableNetworkDiffString(hashrate) {
    hashrate = (hashrate * 1000000);
    if (hashrate < 1000000)
        return '0';
    var byteUnits = [' ', ' K', ' M', ' G', ' T', ' P'];
    var i = Math.floor((Math.log(hashrate / 1000) / Math.log(1000)) - 1);
    hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);
    return hashrate.toFixed(2) + byteUnits[i];
}

function getReadableHashRateString(hashrate){
       hashrate = (hashrate * 1000000);
       if (hashrate < 1000000)
           return '0 Sol';
       var byteUnits = [ ' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s' ];
       var i = Math.floor((Math.log(hashrate/1000) / Math.log(1000)) - 1);
       hashrate = (hashrate/1000) / Math.pow(1000, i + 1);
       return hashrate.toFixed(2) + byteUnits[i];
   }

