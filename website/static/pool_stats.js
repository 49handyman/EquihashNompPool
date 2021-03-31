var poolWorkerChart;
var poolHashrateChart;
var poolBlockChart;
var price;
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
    maxScale[1]
  );
  poolWorkerChart = createLineChart(
    document.getElementById("poolWorkerChart").getContext('2d'),
    [{
        label: 'Actual',
        fill: false,
        data: stats.workers.map(x => {
          return {
            t: x[0],
            y: x[1]
          }
        }),
        borderWidth: 2,
        backgroundColor: '#0061B5',
        borderColor: '#0061B5'
      },
      {
        label: 'Averaged',
        fill: false,
        data: stats.averagedWorkers.map(x => {
          return {
            t: x[0],
            y: x[1]
          }
        }),
        borderWidth: 2,
        backgroundColor: '#FF9400',
        borderColor: '#FF9400'
    }],
    'Time',
    'Workers',
    {
      beginAtZero: true,
      fixedStepSize: 1
    }
  );
  poolBlockChart = createLineChart(
    document.getElementById("blockChart").getContext('2d'),
    [{
        label: 'Currently Pending',
        fill: true,
        steppedLine: true,
        data: stats.blocks.map(x => {
          return {
            t: x[0],
            y: x[1]
          }
        }),
        borderWidth: 1,
        backgroundColor: '#FBA41F',
        borderColor: '#FBA41F'
    }],
    'Time',
    'Blocks',
    {
      beginAtZero: true,
      fixedStepSize: 1
    }
  );
}
//doug
$.get({
    url : "https://api.coingecko.com/api/v3/coins/komodo",
    success : function(data){
        console.log(data);
        $("#priceUsd").html('$'+parseFloat(data.market_data.current_price.usd).toFixed(5)+' USD');
price = parseFloat(data.market_data.current_price.usd).toFixed(5);
        $("#priceBtc").html(parseFloat(data.market_data.current_price.btc)+' BTC');
        $("#rank").html(data.market_cap_rank)+' th';
        var change1h = data.market_data.price_change_percentage_1h_in_currency.usd;
        if(parseFloat(change1h)>0){
            $("#change1h").parent().attr("class","text-success");
        }
        $("#change1h").html(change1h);
        var change24 = data.market_data.price_change_percentage_24h_in_currency.usd;
        if(parseFloat(change24)>0){
            $("#change24h").parent().attr("class","text-success");
        }
        $("#change24h").html(change24);

        $("#marketCap").html(Number(parseFloat(data.market_data.market_cap.usd)).toLocaleString());
        $("#volume24").html(Number(parseFloat(data.market_data.total_volume.usd)).toLocaleString());
	$("#ath").html('$'+Number(parseFloat(data.market_data.ath['usd'])).toLocaleString());
	 $("#24h_high").html('$'+Number(parseFloat(data.market_data.high_24h['usd'])).toFixed(2));


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
console.log(price);
statsSource.addEventListener('message', function(e) {
  var stats = JSON.parse(e.data);
  updatePoolData(stats, poolName, function(pool) {
    var max = Math.max.apply(null, pool.hashrate.map(x => x[1]));
    var pair = getReadableHashRatePair(max);
    var hash = getScaledHashrate(poolName in stats.pools ? stats.pools[poolName].hashrate : 0, pair[2]);
     var sols = getScaledHashrate(poolName in stats.pools ? stats.pools[poolName].poolStats.networkSols : 0, pair[2]);
   var pairsols = getReadableHashRatePair(sols);
    $("#validShares").text(poolName in stats.pools ? stats.pools[poolName].poolStats.validShares : 0);
    $("#poolHashRate").text((!isNaN(hash) ? hash : 0) + ' ' + (pair[1] ? pair[1] : 'Sols/s'));
    $("#luckDays").text(poolName in stats.pools ? stats.pools[poolName].luckDays + ' Days' : 0);
    $("#luckHours").text(poolName in stats.pools ? stats.pools[poolName].luckHours + ' Hours' : 0);
   $("#lastBlockPaid").text(poolName in stats.pools ? stats.pools[poolName]?.payments[0]?.blocks[0] : 0);
    $("#lastBlockFound").text(poolName in stats.pools ? stats.pools[poolName].blocks.lastBlock[0].split(':')[3] : 0);
    $("#lastBlockAmt").text(poolName in stats.pools ? parseFloat((stats.pools[poolName]?.payments[0]||{}).paid) : 0); 
    $("#poolWorkers").text(poolName in stats.pools ? stats.pools[poolName].workerCount : 0);
    $("#pendingBlocks").text(poolName in stats.pools ? stats.pools[poolName].blocks.pending : 0);
    $("#confirmedBlocks").text(poolName in stats.pools ? stats.pools[poolName].blocks.confirmed : 0);
    $("#networkHashRate").text(poolName in stats.pools ? getReadableNetworkHashRateString(stats.pools[poolName].poolStats.networkSols) : 0); //doug
    $("#networkBlocks").text(poolName in stats.pools ? stats.pools[poolName].poolStats.networkBlocks : 0);
    $("#networkDiff").text(poolName in stats.pools ? getReadableNetworkDiffString(stats.pools[poolName].poolStats.networkDiff) : 0); //doug
    $("#validBlocks").text(poolName in stats.pools ? stats.pools[poolName].poolStats.validBlocks : 0);
    $("#networkTime").text(poolName in stats.pools ? timeOfDayFormat(Date.now()) : 0);
 $("#kicked").text(poolName in stats ? pools[poolName]?.blocksKicked : 0);
$("#poolPaidOut").text(poolName in stats.pools ? '$'+(stats.pools[poolName].poolStats.totalPaid * price).toFixed(2)+' USD' : 0);
    var time = stats.time * 1000;
    var avg = pool.averagedHashrate;
    addChartData(poolHashrateChart, poolHashrateChart.data.datasets[0], {t: time, y: hash}, false);
    addChartData(poolHashrateChart, poolHashrateChart.data.datasets[1], {t: time, y: getScaledHashrate(avg[avg.length - 1][1], pair[2])}, true);
    addChartData(poolBlockChart, poolBlockChart.data.datasets[0], {t: time, y: poolName in stats.pools ? stats.pools[poolName].blocks.pending : 0}, true);
  });
}, false);

 function timeOfDayFormat(timestamp){
     return new Date(parseInt(timestamp)).toLocaleTimeString('en-US')
 }

function readableDate(a){
     return new Date(parseInt(a)).toISOString().substring(0, 16).replace('T', ' ') + ' UTC';
 }


 function getReadableNetworkHashRateString(hashrate){
     hashrate = (hashrate * 1000000);
     if (hashrate < 1000000)
         return '0 Sol';
     var byteUnits = [ ' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s' ];
     var i = Math.floor((Math.log(hashrate/1000) / Math.log(1000)) - 1);
     hashrate = (hashrate/1000) / Math.pow(1000, i + 1);
     return hashrate.toFixed(2) + byteUnits[i];
 }

  function getReadableNetworkDiffString(hashrate){
      hashrate = (hashrate * 1000000);
      if (hashrate < 1000000)
          return '0';
      var byteUnits = [ ' ', ' K', ' M', ' G', ' T', ' P' ];
      var i = Math.floor((Math.log(hashrate/1000) / Math.log(1000)) - 1);
      hashrate = (hashrate/1000) / Math.pow(1000, i + 1);
      return hashrate.toFixed(2) + byteUnits[i];
  }

