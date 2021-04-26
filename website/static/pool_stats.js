var poolWorkerChart;
var poolHashrateChart;
var poolBlockChart;
var price;
var netDiff;
var networkDiffChart;


function displayCharts() {
    var stats = getPoolStats(poolName);
    var maxScale = getReadableHashRatePair(Math.max.apply(null, stats.hashrate.map(x => x[1])));
    var maxScaleDiff = getReadableNetworkDiffPair(Math.max.apply(null, stats.networkDiff.map(x => x[1])));
    var maxScaleNetwork = getReadableNetworkPair(Math.max.apply(null, stats.networkSols.map(x => x[1])));


    poolHashrateChart = createDefaultLineChart(
        document.getElementById("poolHashChart").getContext('2d'),

        [{
                label: 'Pool Actual',
                fill: false,
                data: stats.hashrate.map(x => {
                    return {
                        t: x[0],
                        y: getScaledHashrate(x[1], maxScale[2])
                    }
                }),
                borderWidth: 1,
                backgroundColor: '#348EA9',
                pointHoverRadius: 6,
                pointBorderColor: '#24becc',
                pointBorderWidth: 2,
                pointHitRadius: 1,
                borderColor: '#348EA9'
            },


            {
                label: 'Pool Averaged',
                fill: false,
                data: stats.averagedHashrate.map(x => {
                    return {
                        t: x[0],
                        y: getScaledHashrate(x[1], maxScale[2])
                    }
                }),
                borderWidth: 1,
                backgroundColor: '#E81D62',
                pointHoverRadius: 6,
                pointHitRadius: 1,
                borderColor: '#E81D62'
            }

        ],
        'Time',
        'Hash Rates & Net Diff',
    );

    networkDiffChart = createLineChart(
        document.getElementById("networkDiffChart").getContext('2d'),
        [{
                label: 'diff',
                fill: false,
                data: stats.networkDiff.map(x => {
                    return {
                        t: x[0],
                        y: getScaledNetworkDiff(x[1], maxScaleDiff[0])
                    }
                }),
                borderWidth: 1,
                backgroundColor: '#343a40',
                borderColor: '#747a70'
            },
            {
                label: 'Network Hashrate',
                fill: false,
                data: stats.networkSols.map(x => {
                    return {
                        t: x[0],
                        y: getScaledNetworkDiff(x[1], maxScaleNetwork[0])
                    }
                }),
                borderWidth: 1,
                backgroundColor: '#FBA41F',
                borderColor: '#FBA41F'
            }
        ],
        'Time',
        'GSols/s', {
            //   beginAtZero: true,
            //   fixedStepSize: 1
        }

    );

}







$.get({
    url: "https://api.coingecko.com/api/v3/coins/" + poolName,
    success: function(data) {
        var price = parseFloat(data.market_data.current_price.usd).toFixed(2);
        $("#priceBtc").html('Exchange Rate<BR>' + parseFloat(data.market_data.current_price.btc) + ' BTC');
        $("#rank").html('Coin Rank<BR>' + data.market_cap_rank + ' th');

        var change1h = parseFloat(data.market_data.price_change_percentage_1h_in_currency.usd).toFixed(2);
        if (parseFloat(change1h) > 0) {
            $("#change1h").attr("class", "text-success");
            $("#priceBtc").attr("class", "text-success");
            $("#marketCap").attr("class", "text-success");
            $("#priceUSD").attr("class", "text-success");
	    $("#blockValue").attr("class", "text-success");

        } else {
            $("#change1h").attr("class", "text-danger");
            $("#priceBtc").attr("class", "text-danger");
            $("#marketCap").attr("class", "text-danger");
            $("#priceUSD").attr("class", "text-danger");
	    $("#blockValue").attr("class", "text-danger");
        }

        var change24 = data.market_data.price_change_percentage_24h_in_currency.usd;
        if (parseFloat(change24) > 0) {
            $("#change24h").attr("class", "text-success");
            $("#price_change24h").attr("class", "text-success");
            $("#priceUSD").attr("class", "text-success");
            $("#volume24").attr("class", "text-success");
            $("#24h_high").attr("class", "text-success");
        } else {
            $("#change24h").attr("class", "text-danger");
            $("#price_change24h").attr("class", "text-danger");
            $("#priceUSD").attr("class", "text-danger");
            $("#volume24").attr("class", "text-danger");
            $("#24h_high").attr("class", "text-danger");
        }

        $("#change1h").html('1h Change<br>' + change1h + '%');
        $("#change24h").html('24h Change<br>' + parseFloat(change24).toFixed(2) + '%');
        $("#priceUSD").html('Price USD<br>$' + parseFloat(data.market_data.current_price.usd));
        $("#marketCap").html(parseFloat(data.market_data.market_cap.usd));
        $("#volume24").html('24h Volume<br>$' + parseInt(data.market_data.total_volume.usd).toLocaleString());
        $("#ath").html('ATH<br>$' + Number(parseFloat(data.market_data.ath.usd).toLocaleString()) + '<BR>' +
            (data.market_data.ath_date.usd).substring(0, 10)).attr("class", "text-success");

        $("#atl").html('ATL<br>$' + Number(parseFloat(data.market_data.atl.usd).toLocaleString()) + '<BR>' +
            (data.market_data.atl_date.usd).substring(0, 10)).attr("class", "text-danger");

        $("#24h_high").html('24h High<BR>$' + Number(parseFloat(data.market_data.high_24h['usd']).toLocaleString()).toFixed(2));
        if (data?.ico_data?.short_desc) {
            var short_desc = data?.ico_data?.short_desc
        };
        $("#price_change24h").html('24h Price Change<br>' + '$' + parseFloat(data.market_data.price_change_24h));
        $("#shortDesc").html('All Data Provided By Coingecko<BR> ' + data.id + ': ' + data.short_desc || undefined);
        //$("#shortDesc").html('All Data Provided By Coingecko: '+data.id + ': ' + data.description.en || undefined);
        $("#homePage").html('<a href=' + data.links.homepage[0] + ' target="_blank">' + data.id + '<br> Home Page </a>');
        $("#explorerUrl").html('<a href=' + data.links.blockchain_site[0] + ' target="_blank">' + data.id + '<br> Explorer</a>');
        $("#tradeUrl1").html('<a href=' + data?.tickers[0]?.trade_url + ' target="_blank">' + data?.tickers[0]?.market.name + '<br> ' + data?.tickers[0]?.base + '-' + data?.tickers[0]?.target + ' ' + data?.tickers[0]?.last + '</a>');
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
        var poolDiff = stats.pools[poolName].networkDiff;
        var maxSols = Math.max.apply(null, pool.networkSols.map(x => x[1]));
        var pairSols = getReadableNetworkDiffPair(maxSols);
        var scaledSols = getScaledNetworkDiff(maxSols);
        var diffMax = Math.max.apply(null, pool.networkDiff.map(x => x[1]));
        var diffPair = getReadableNetworkDiffPair(diffMax);
        var diffScaled = getScaledNetworkDiff(stats.pools[poolName].networkDiff);
        var diff = getScaledNetworkDiff(poolName in stats.pools ? stats.pools[poolName].poolStats.networkDiff : 0);
        var pair = getReadableHashRatePair(max);
        var hash = getReadableHashRate(poolName in stats.pools ? stats.pools[poolName].hashrate : 0, pair[2]);
        var sols = getReadableNetworkPair(poolName in stats.pools ? stats.pools[poolName].poolStats.networkSols : 0, pair[2]);
        var pairsols = getReadableHashRatePair(sols);
        var networkPercent = (poolName in stats.pools ? stats.pools[poolName].hashrate : 0) * 2 / 1000000 / (poolName in stats.pools ? stats.pools[poolName].poolStats.networkSols : 0)
        var timeSinceLastBlock = Date.now() - (stats.pools[poolName]?.blocks?.lastBlockTime[0]?.split(':')[0]) * 1000 || 0
        var timeSinceLastBlock2 = Date.now() - (parseFloat(poolName in stats.pools ? stats.pools[poolName]?.blocks?.lastBlockTime[0].split(':')[0] : 0) * 1000) || 0
        var poolLuck = parseFloat(parseInt(timeSinceLastBlock) * 1000 / parseInt(stats.pools[poolName].poolStats.networkSols) /
            parseInt(stats.pools[poolName].hashrate * 2 / 1000000) * parseInt(stats.pools[poolName].blockTime) * 1000 * 100).toFixed(12)
        var revenue = (poolName in stats.pools ? parseFloat(stats.pools[poolName].poolStats.coinMarketCap) : 0) *
            (poolName in stats.pools ? parseFloat(stats.pools[poolName].blockReward) : 0) *
            (24 / stats.pools[poolName].luckHours);
        var reward = (poolName in stats.pools ? parseFloat(stats.pools[poolName].blockReward) : 0).toFixed(2)

        $("#blockReward").html(poolName + '<BR>Block Reward<BR>' + reward + ' ' + stats.pools[poolName].symbol);
        $("#revenue").html('Est Revenue<br> $' + parseFloat(revenue).toFixed(2));
        $("#poolLuck").html(parseFloat(poolLuck).toFixed(2) + ' %' + '<br> Pool Luck ');
        $("#timeSinceBlock").html(readableSeconds(timeSinceLastBlock / 1000) + '<BR>Since Blk');
        $("#networkPercent").html((parseFloat(networkPercent * 100)).toFixed(4) + ' %');
        $("#validShares").text(poolName in stats.pools ? parseFloat(stats.pools[poolName].poolStats.validShares).toLocaleString() : 0);
        $("#poolHashRate").text((!isNaN(hash) ? hash : 0) + ' ' + (pair[1] ? pair[1] : 'Sols/s'));
        $("#luckDays").text(poolName in stats.pools ? stats.pools[poolName].luckDays + ' Days' : 0);
        $("#luckHours").text(poolName in stats.pools ? stats.pools[poolName].luckHours + ' Hours' : 0);
        $("#lastBlockPaid").text(poolName in stats.pools ? parseFloat(stats.pools[poolName]?.payments[0]?.blocks[0]).toLocaleString() : 0);
        $("#lastBlockFound").html(poolName in stats.pools ? '<a href="' + stats.pools[poolName].explorerGetBlock + stats.pools[poolName]?.blocks?.lastBlock[0]?.split(':')[0] + '" target="_blank">' + parseInt(stats.pools[poolName]?.blocks?.lastBlock[0]?.split(':')[3]).toLocaleString() + '</a>' : 0);
        $("#lastBlockFoundTime").html(poolName in stats.pools ? 'Last<BR>Block Time</br>' + readableDate(stats.pools[poolName]?.blocks?.lastBlockTime[0].split(':')[0] * 1000) : 0) //[0]?.split(':')[4] * 1000) || 0 : 0);
        $("#lastBlockAmt").text(poolName in stats.pools ? (parseFloat((stats.pools[poolName]?.payments[0] || 0).paid).toFixed(4) || 0) : 0);
        $("#poolWorkers").text(poolName in stats.pools ? stats.pools[poolName].workerCount : 0);
        $("#pendingBlocks").text(poolName in stats.pools ? stats.pools[poolName]?.blocks?.pending : 0);
        $("#confirmedBlocks").text(poolName in stats.pools ? stats.pools[poolName]?.blocks?.confirmed : 0);
        $("#networkHashRate").html(poolName in stats.pools ? getReadableNetworkHashRateString(stats.pools[poolName].poolStats.networkSols) : 0); //doug
        $("#networkBlocks").html(poolName in stats.pools ? parseInt(stats.pools[poolName].poolStats.networkBlocks).toLocaleString() : 0);
        $("#networkDiff").html(poolName in stats.pools ? getReadableNetworkDiffString(stats.pools[poolName].poolStats.networkDiff) : 0); //doug
        $("#validBlocks").html(poolName in stats.pools ? 'Valid Blocks</br>' + parseInt(stats.pools[poolName].poolStats.validBlocks) : 0);
        $("#networkTime").html(poolName in stats.pools ? timeOfDayFormat(Date.now()) : 0);
        $("#blocksKicked").html(poolName in stats.pools ? 'Kicked Blocks</br>' + parseInt(stats.pools[poolName]?.blocks.kicked) : 0);
        var totalPaid = (poolName in stats.pools ? parseFloat((stats.pools[poolName].poolStats?.totalPaid) || 0) : 0);
        var payout = (totalPaid * parseFloat(stats.pools[poolName].poolStats.coinMarketCap)).toLocaleString();
        payout = 'Payout Value<BR>$' + payout + ' USD';
        $("#poolPaidOut").html(payout);
        $("#blocksFound").html(poolName in stats.pools ? 'Blocks Found</br>' + parseInt(stats.pools[poolName]?.blocks?.blocksFound).toLocaleString() : 0);
        $("#blockFound").html(poolName in stats.pools ? '<a href="' + stats.pools[poolName].explorerGetBlock + stats.pools[poolName]?.confirmed?.blocks[0]?.split(':')[0] + '" target="_blank">' + parseInt(stats.pools[poolName]?.confirmed?.blocks[0]?.split(':')[2]).toLocaleString() + '</a>' : 0);
        $("#poolStartTime").html(poolName in stats.pools ? 'Pool Restarted</br>' + readableDate(stats.pools[poolName].poolStats.poolStartTime * 1000) : 0);
        $("#timeToFind").html('Time To find</br>' + stats.pools[poolName].timeToFind);
        $("#priceUsd").html(poolName in stats.pools ? poolName + '<br>Price USD<BR>$' + stats.pools[poolName].poolStats.coinMarketCap : 0);
        $("#rejected").html(poolName in stats.pools ? 'Rejected Blocks</br>' + parseInt(stats.pools[poolName]?.blocks.blocksRejected) : 0);
        $("#orphaned").html(poolName in stats.pools ? 'Orphaned Blocks</br>' + parseInt(stats.pools[poolName]?.blocks.orphaned) : 0);
        $("#duplicated").html(poolName in stats.pools ? 'Duplicated Blocks</br>' + parseInt(stats.pools[poolName]?.blocks.blocksDuplicate) : 0);
$("#blockValue").html(poolName in stats.pools ? poolName + '<br>Block Value<BR>$' + stats.pools[poolName].poolStats.coinMarketCap * reward : 0);
        $("#blank").html('Net Time</br>' + readableDate(Date.now()));


        //	$("#bigDiff").html(poolName in stats.pools ?   'BigDiff Blocks</br>'+ parseInt(stats.pools[poolName]?.bigDiff) : 0);
        var time = stats.time * 1000;
        var avg = pool.averagedHashrate;
        addChartData(poolHashrateChart, poolHashrateChart.data.datasets[0], {
            t: time,
            y: hash
        }, true);
        // addChartData(poolHashrateChart, poolHashrateChart.data.datasets[1], {t: time,y: getScaledHashrate(avg[avg.length - 1][1], pair[2])}, true); //getReadableHashRatePair(avg)}, true);
        // addChartData(poolHashrateChart, poolHashrateChart.data.datasets[2], {t: time,y: diff}, true);
        addChartData(networkDiffChart, networkDiffChart.data.datasets[0], {
            t: time,
            y: getScaledNetworkDiff(stats.pools[poolName].poolStats.networkDiff)
        }, true);
        addChartData(networkDiffChart, networkDiffChart.data.datasets[1], {
            t: time,
            y: getScaledNetworkDiff(stats.pools[poolName].poolStats.networkSols)
        }, true);
        //var text = 'block';
        //var now=Date.now();
        //var then=now-60*60;
        //addAnnotationVertical(poolHashrateChart, then, text);

    });
}, false);

$.getJSON('/api/stats', function(data) {
    const array = [];
    for (var p in data.pools) {
        for (var w in data.pools[p].workers) {
            var worker = getWorkerNameFromAddress(w);
            miner = w.split('.')[1];
            var miner = worker + ' ' + 'Blocks : ' + parseInt((data.pools[p].blocks.blocksFound[w]) || 0) + ' | '
            array.push(miner);
        }
    }
    $("#topMiner").html(topMiner);
    $("#blocks").html(array);
});


function timeOfDayFormat(timestamp) {
    return new Date(parseInt(timestamp)).toLocaleTimeString()
}

function readableDate(a) {
    return new Date(parseInt(a)).toLocaleString(); //.substring(0, 16).replace('T', ' ') + ' CST';
}



function addAnnotationVertical(chart, timestamp, text) {
    var line = 'line' + timestamp;
    chart.options.annotation.annotations.push({
        drawTime: "afterDatasetsDraw",
        id: line,
        type: "line",
        mode: "vertical",
        scaleID: "x-axis-0",
        value: timestamp,
        borderColor: "black",
        borderWidth: 1,
        label: {
            fontColor: "black",
            backgroundColor: "white",
            content: text,
            enabled: true
        }
    });
    chart.update();
}



this.getReadableHashRate = function(hashrate) {
    hashrate = (hashrate * 2);
    if (hashrate < 1000000) {
        hashrate = hashrate * 100000;
    }
    var i = Math.max(0, Math.floor((Math.log(hashrate / 1000) / Math.log(1000)) - 1));
    hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);
    return hashrate.toFixed(2);
};

this.getScaledHashrate = function(hashrate, i) {
    hashrate = (hashrate * 2);
    if (hashrate < 1000000) {
        hashrate = hashrate * 100000;
    }
    hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);
    return hashrate.toFixed(2);
};

this.getReadableHashRateString = function(hashrate) {
    hashrate = (hashrate * 2);
    if (hashrate < 1000000) {
        hashrate = hashrate * 100000;
    }
    var byteUnits = [' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s'];
    var i = Math.max(0, Math.floor((Math.log(hashrate / 1000) / Math.log(1000)) - 1));
    hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);

    return hashrate.toFixed(2) + ' ' + byteUnits[i];
};

this.getReadableHashRatePair = function(hashrate) {
    hashrate = (hashrate * 2);
    if (hashrate < 1000000) {
        hashrate = hashrate * 100000;
    }
    var byteUnits = [' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s'];
    var i = Math.max(0, Math.floor((Math.log(hashrate / 1000) / Math.log(1000)) - 1));
    hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);

    return [hashrate.toFixed(2), byteUnits[i], i];
};
