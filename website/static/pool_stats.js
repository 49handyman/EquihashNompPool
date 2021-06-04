var poolWorkerChart;
var poolHashrateChart;
var poolBlockChart;
var price;
var netDiff;
var networkDiffChart;
var networkHashrateChart;

function displayCharts() {
    var stats = getPoolStats(poolName);
    var maxScale = getReadableHashRatePair(Math.max.apply(null, stats.hashrate.map(x => x[1])));

    console.log('getReadableHashRatePair.maxScale 11: '+maxScale)
    

    var maxScaleDiff = getReadableNetworkDiffPair(Math.max.apply(null, stats.networkDiff.map(x => x[1])));
    console.log('maxScaleDiff.maxScaleDiff: '+maxScaleDiff)

    var maxScaleNetwork = getReadableNetworkPair(Math.max.apply(null, stats.networkSols.map(x => x[1])));
    console.log('maxScaleNetwork.maxScaleNetwork: '+maxScaleNetwork)
console.log('stats.averagedHashrate1: '+getReadableHashRate(stats.averagedHashrate[stats.averagedHashrate.length-1].slice(-1)))
    poolHashrateChart = createDefaultLineChart(
        document.getElementById("poolHashChart").getContext('2d'),

        [
        {
                label: 'Pool Actual',
                fill: false,
                data: stats.hashrate.map(x => {
                    return {
                        t: x[0],
                        y: getScaledHashrate(x[1], maxScale[2])
                    }
                }),
                borderWidth: 1,
                backgroundColor: 'rgb(54, 162, 235)',
			    borderColor: 'rgba(54, 255, 255, 0.75)',
                //outerGlowWidth: 20,
                outerGlowColor: 'rgba(255, 0, 255, 0.5)',
                shadowOffsetX: 2,
                shadowOffsetY: 2,
                shadowBlur: 8,
                shadowColor: 'rgba(255, 255, 255, 0.5)',
                pointRadius: 0,
                pointHoverRadius: 5,
                pointBevelWidth: 5,
                pointBevelHighlightColor: 'rgba(255, 255, 255, 0.75)',
                pointBevelShadowColor: 'rgba(255, 255, 255, 0.5)',
                pointShadowOffsetX: 3,
                pointShadowOffsetY: 3,
                pointShadowBlur: 0,
                pointShadowColor: 'rgba(255, 255, 255, 0.5)',
                pointHoverInnerGlowWidth: 0,
                pointHoverInnerGlowColor: 'rgba(255, 255, 0, 0.5)',
                pointHoverOuterGlowWidth: 0,
                pointHoverOuterGlowColor: 'rgba(255, 255, 0, 1)',
                backgroundOverlayMode: 'multiply',
                hoverInnerGlowWidth: 0,
                hoverInnerGlowColor: 'rgb(255, 255, 0)',
                hoverOuterGlowWidth: 0,
                hoverOuterGlowWidth: 'rgb(255, 255, 0)'
			    
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
                backgroundColor: 'rgba(255, 40, 40, 0.75)',
			    borderColor: 'rgba(255, 40, 40, 0.75)',
                outerGlowColor: 'rgba(255, 0, 255, 0.5)',
                shadowOffsetX: 2,
                shadowOffsetY: 2,
                shadowBlur: 5,
                shadowColor: 'rgba(255, 255, 255, 0.5)'
			    
            }
        ],
        'Time',
        'Pool Hash Rate',
    );

    networkDiffChart = createLineChart(
        document.getElementById("networkDiffChart").getContext('2d'),
        [  
            {
                label: 'Diff ',
                fill: false,
                data: stats.networkDiff.map(x => {
                    return {
                        t: x[0],
                        y: getScaledNetworkDiff(x[1], maxScaleDiff[0])
                    }
                }),
                borderWidth: 1,
                backgroundColor: 'rgba(40, 40, 255, 0.75)',
			    borderColor: 'rgba(40, 40, 255, 0.75)',
                outerGlowColor: 'rgba(255, 0, 255, 0.5)',
                shadowOffsetX: 1,
                shadowOffsetY: 2,
                shadowBlur: 3,
                shadowColor: 'rgba(255, 255, 255, 0.5)'
            }
        ],
        'Time',
        'G', {
            //   beginAtZero: true,
            //   fixedStepSize: 1
        }
    );
    networkHashrateChart = createLineChart(
        document.getElementById("networkHashrateChart").getContext('2d'),
        [
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
                backgroundColor: 'rgba(255, 40, 40, 0.75)',
			    borderColor: 'rgba(255, 40, 40, 0.75)',
                outerGlowColor: 'rgba(255, 0, 255, 0.5)',
                shadowOffsetX: 1,
                shadowOffsetY: 2,
                shadowBlur: 3,
                shadowColor: 'rgba(255, 255, 255, 0.5)'

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
      //      $("#convertedValueUSD").attr("class", "text-success");
       //     $("#exchangeWalletBal").attr("class", "text-success");
       //     $("#exchangeWalletName").attr("class", "text-success");

        } else {
            $("#change1h").attr("class", "text-danger");
            $("#priceBtc").attr("class", "text-danger");
            $("#marketCap").attr("class", "text-danger");
            $("#priceUSD").attr("class", "text-danger");
	        $("#blockValue").attr("class", "text-danger");
        //    $("#convertedValueUSD").attr("class", "text-danger");
       //     $("#exchangeWalletBal").attr("class", "text-danger");
        //    $("#exchangeWalletName").attr("class", "text-danger");

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
        $("#change24h").html('24h Change<br>' + parseFloat(change24).toFixed(2) + '%<BR>' + '$' + parseFloat(data.market_data.price_change_24h));
        $("#priceUSD").html('Price USD<br>$' + parseFloat(data.market_data.current_price.usd));
        $("#marketCap").html(parseFloat(data.market_data.market_cap.usd));
        $("#volume24").html('24h Volume<br>$' + parseInt(data.market_data.total_volume.usd).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}));
        
        $("#genesis_date").html('Genesis Date<br>' + data.genesis_date);
        $("#circulating_supply").html('Coin Supply<br>' + parseInt(data.market_data.circulating_supply).toLocaleString());
        $("#ath").html('ATH<br>$' + Number(parseFloat(data.market_data.ath.usd).toLocaleString()) + '<BR>' +
            (data.market_data.ath_date.usd).substring(0, 10)).attr("class", "text-success");
            
        $("#atl").html('ATL<br>$' + Number(parseFloat(data.market_data.atl.usd).toLocaleString()) + '<BR>' +
            (data.market_data.atl_date.usd).substring(0, 10)).attr("class", "text-danger");

        $("#24h_high").html('24h High<BR>$' + Number(parseFloat(data.market_data.high_24h['usd']).toLocaleString()).toFixed(2));
        if (data?.ico_data?.short_desc) {
            var short_desc = data?.ico_data?.short_desc
        };
        $("#price_change24h").html('24h Price Change<br>' + '$' + parseFloat(data.market_data.price_change_24h));
        $("#shortDesc").html('All Data Provided By Coingecko<BR>Live Data Provided by: '+data?.tickers[0]?.market.name + '<BR> ' + data.id + ' ' + data.short_desc || '');
        //$("#shortDesc").html('All Data Provided By Coingecko: '+data.id + ': ' + data.description.en || undefined);
        $("#homePage").html('<a href=' + data.links.homepage[0] + ' target="_blank">' + data.id + '<br> Home Page </a>');
        $("#explorerUrl").html('<a href=' + data.links.blockchain_site[0] + ' target="_blank">' + data.id + '<br> Explorer</a>');
        exchangeWalletURL = data?.tickers[0]?.trade_url;
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



   // $("#poolFees").html( 'Pool Fees<BR>'  + datafees);

   // $("#payoutScheme").html(poolName + 'Payout Scheme<BR>'  + parseFloat(data.pools.payoutscheme));
   // $("#payoutInterval").html(poolName + 'Pool Fees<BR>'  + readableSeconds(parseFloat(data.pools.interval)));
   // $("#payoutMinimuml").html(poolName + 'Pool Fees<BR>'  + parseFloat(data.pools.minimum));



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
        var symbol = (poolName in stats.pools ? stats.pools[poolName].symbol : 0)
        var exchangeCoinPair = (poolName in stats.pools ? (stats.pools[poolName].exchangeCoinPair) : 0)
        var exchangeToCoin = (poolName in stats.pools ? (stats.pools[poolName].exchangeToCoin) : 0)
        var exchangeToCoinWallet = (poolName in stats.pools ? (stats.pools[poolName].exchangeToCoinWallet) : 0)
        //console.log(pool.hashrate)
        //console.log(pool.averagedHashrate)
        var max = Math.max.apply(null, (pool.hashrate).map(x => x[1]));
        var pair = getReadableHashRatePair(max);
        console.log('getReadableHashRatePair.pair: '+ pair)
        var poolDiff = stats.pools[poolName].networkDiff;
        var maxSols = Math.max.apply(null, pool.networkSols.map(x => x[1]));
        console.log('maxSols: '+ maxSols)
        var pairSols = getReadableNetworkDiffPair(maxSols); // maxSols
        console.log('getReadableNetworkDiffPair.pairSols: ' + pairSols)
        var scaledSols = getScaledNetworkDiff(maxSols); // maxSols
        console.log('getScaledNetworkDiff.scaledSols: '+scaledSols)
        var diffMax = Math.max.apply(null, pool.networkDiff.map(x => x[1]));
        var diffPair = getReadableNetworkDiffPair(stats.pools[poolName].networkDiff); // diffMax
        var diffScaled = getScaledNetworkDiff(stats.pools[poolName].networkDiff);
        var diff = getScaledNetworkDiff(poolName in stats.pools ? stats.pools[poolName].poolStats.networkDiff : 0);
      //  var pair = getReadableHashRatePair(hash); // max
      //  var hash = getReadableHashRate(poolName in stats.pools ? stats.pools[poolName].hashrate : 0, pair[2]);
        var hash = getScaledHashrate(poolName in stats.pools ? stats.pools[poolName].hashrate : 0, pair[2]);
        console.log('getScaledHashrate.hash2: '+hash)
        var sols = getReadableNetworkPair(poolName in stats.pools ? stats.pools[poolName].poolStats.networkSols : 0, pair[2]);
        var pairsols = getReadableHashRatePair(sols);
        var networkPercent = (poolName in stats.pools ? stats.pools[poolName].hashrate : 0) * 2 / 1000000 / (poolName in stats.pools ? stats.pools[poolName].poolStats.networkSols : 0)
        var timeSinceLastBlock = (poolName in stats.pools ? Date.now() - (parseInt(stats.pools[poolName]?.blocks?.lastBlock[0]?.split(':')[4])) * 1000 || 0 : 0)
    
    //parseInt(stats.pools[poolName]?.blocks?.lastBlock[0]?.split(':')[4])
    //    var timeSinceLastBlock2 = Date.now() - (parseFloat(poolName in stats.pools ? stats.pools[poolName]?.blocks?.lastBlock[0]?.split(':')[4] : 0) * 1000) || 0
    
        var poolLuck =       parseFloat(parseInt(timeSinceLastBlock) * 1000 / parseInt(stats.pools[poolName].poolStats.networkSols) /
            parseInt(stats.pools[poolName].hashrate * 2 / 1000000) * parseInt(stats.pools[poolName].blockTime) * 1000 * 100).toFixed(12)
        var revenue =       (poolName in stats.pools ? parseFloat(stats.pools[poolName].poolStats.coinMarketCap) : 0) *
            (poolName in stats.pools ? parseFloat(stats.pools[poolName].blockReward) : 0) *
            (24 / stats.pools[poolName].luckHours);
        var reward =        (poolName in stats.pools ? parseFloat(stats.pools[poolName].blockReward) : 0).toFixed(2)
        var exchangeRate =  (poolName in stats.pools ? parseFloat(stats.pools[poolName].wallet.exchangeTicker.price) : 0);
        
        var BTCUSD =        (poolName in stats.pools ? parseFloat(stats.pools[poolName].wallet.btcusd.price).toFixed(2) : 0);

      //  console.log('ARRR-BTCUSD: '+ exchangeRate +' '+BTCUSD+' '+parseFloat(BTCUSD) * exchangeRate)
        var exchangeName = stats.pools[poolName]?.wallet.exchangeWallet.exchange;
	$("#synced").html('Wallet Synced</br>' + stats.pools[poolName].poolStats.synced);
        $("#blockReward").html(poolName + '<BR>Block Reward<BR>' + reward + ' ' + stats.pools[poolName].symbol);
        $("#revenue").html('Est Daily<BR>Revenue<br>$' + parseFloat(revenue).toFixed(2));
        $("#poolLuck").html(parseFloat(poolLuck).toFixed(2) + ' %' + '<br> Pool Luck ');
        $("#poolLuck2").html('Pool Luck<BR>' + parseFloat(poolLuck).toFixed(2) + ' %' );
        $("#timeSinceBlock").html(readableSeconds(timeSinceLastBlock / 1000) + '<BR>Since Blk');
        $("#networkPercent").html('Our Percent<BR>of Network<BR>'+(parseFloat(networkPercent * 100)).toFixed(4) + ' %');
        $("#validShares").html(poolName in stats.pools ? 'Vaild Shares</br>' + parseFloat(stats.pools[poolName].poolStats.validShares).toLocaleString() : 0);
     //   $("#poolHashRate").text((!isNaN(hash) ? hash : 0) + ' ' + (pair[1] ? pair[1] : 'Sols/s'));
        $("#poolHashRate").html('Pool Hashrate</br>' + (!isNaN(hash) ? hash : 0) + ' ' + (pair[1] ? pair[1] +'Sols/s': 'Sols/s'));
        $("#luckDays").html(poolName in stats.pools ? 'Luck Days<BR>'+stats.pools[poolName].luckDays + ' Days' : 0);
        $("#luckHours").html(poolName in stats.pools ? 'Luck Hours<BR>'+stats.pools[poolName].luckHours + ' Hours' : 0);
        $("#lastBlockPaid").html(poolName in stats.pools ? 'Last Block Paid</br>' + parseFloat(stats.pools[poolName]?.payments[0]?.blocks[0]).toLocaleString() : 0);
        $("#lastBlockFound").html(poolName in stats.pools ? 'Last Block Found<BR><a href="' + stats.pools[poolName].explorerGetBlock + stats.pools[poolName]?.blocks?.lastBlock[0]?.split(':')[0] + '" target="_blank">' + parseInt(stats.pools[poolName]?.blocks?.lastBlock[0]?.split(':')[3]).toLocaleString() + '</a>' : 0);
        $("#lastBlockFoundTime").html(poolName in stats.pools ? 'Last Block Time</br>' + readableDate(parseInt(stats.pools[poolName]?.blocks?.lastBlock[0]?.split(':')[4]) * 1000) : 0) //[0]?.split(':')[4] * 1000) || 0 : 0);
        $("#lastBlockAmt").html(poolName in stats.pools ? 'Last Payment</br>' + (parseFloat((stats.pools[poolName]?.payments[0] || 0).paid).toFixed(4) || 0) : 0);
        $("#poolWorkers").html(poolName in stats.pools ? 'Workers<BR>'+stats.pools[poolName].workerCount : 0);
        $("#pendingBlocks").html(poolName in stats.pools ? 'Pending Blocks</br>' + stats.pools[poolName]?.blocks?.pending : 0);
        $("#confirmedBlocks").html(poolName in stats.pools ? 'Confirmed Blocks</br>' + stats.pools[poolName]?.blocks?.confirmed : 0);
        $("#networkHashRate").html(poolName in stats.pools ? 'Net Hashrate</br>' + getReadableNetworkHashRateString(stats.pools[poolName].poolStats.networkSols) : 0); //doug
        $("#networkBlocks").html(poolName in stats.pools ? 'Block Height</br>' + parseInt(stats.pools[poolName].poolStats.networkBlocks).toLocaleString() : 0);
        $("#networkDiff").html(poolName in stats.pools ? 'Net Difficulty</br>' + getReadableNetworkDiffString(stats.pools[poolName].poolStats.networkDiff) : 0); //doug
        $("#validBlocks").html(poolName in stats.pools ? 'Valid Blocks</br>' + parseInt(stats.pools[poolName].poolStats.validBlocks) : 0);
        $("#networkTime").html(poolName in stats.pools ? timeOfDayFormat(Date.now()) : 0);
        $("#blocksKicked").html(poolName in stats.pools ? 'Kicked Blocks</br>' + parseInt(stats.pools[poolName]?.blocks.kicked) : 0);
        var totalPaid = (poolName in stats.pools ? parseFloat((stats.pools[poolName].poolStats?.totalPaid) || 0) : 0);
        $("#totalPaidOut").html('Total Paid</br>' + parseFloat(totalPaid).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ' + stats.pools[poolName].symbol);
        var payout = (totalPaid * parseFloat(stats.pools[poolName].poolStats.coinMarketCap)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        payout = 'Payout Value<BR>$' + payout + ' USD';
        $("#poolPaidOut").html(payout);
        $("#blocksFound").html(poolName in stats.pools ? 'Blocks Found</br>' + parseInt(stats.pools[poolName]?.blocks?.blocksFound).toLocaleString() : 0);
        $("#blockFound").html(poolName in stats.pools ? 'Last Block Paid</br><a href="' + stats.pools[poolName].explorerGetBlock + stats.pools[poolName]?.confirmed?.blocks[0]?.split(':')[0] + '" target="_blank">' + parseInt(stats.pools[poolName]?.confirmed?.blocks[0]?.split(':')[2]).toLocaleString() + '</a>' : 0);
        var BlockFoundConfirmations = parseInt(stats.pools[poolName].poolStats.networkBlocks - 
            parseInt(stats.pools[poolName]?.blocks?.lastBlock[0]?.split(':')[3])+1)
        $("#BlockFoundConfirmations").html('Last Block<BR>Confirmations<BR>' + BlockFoundConfirmations);
        $("#poolStartTime").html(poolName in stats.pools ? 'Pool Restarted</br>' + readableDate(stats.pools[poolName].poolStats.poolStartTime * 1000) : 0);
        $("#timeToFind").html('Time To find</br>' + stats.pools[poolName].timeToFind);
        $("#priceUsd").html(poolName in stats.pools ? poolName + '<br>Price USD<BR>$' + parseFloat(stats.pools[poolName].poolStats.coinMarketCap).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 0);
        $("#rejected").html(poolName in stats.pools ? 'Rejected Blocks</br>' + parseInt(stats.pools[poolName]?.blocks.blocksRejected) : 0);
        $("#orphaned").html(poolName in stats.pools ? 'Orphaned Blocks</br>' + parseInt(stats.pools[poolName]?.blocks.orphaned) : 0);
        $("#duplicated").html(poolName in stats.pools ? 'Duplicated Blocks</br>' + parseInt(stats.pools[poolName]?.blocks.blocksDuplicate) : 0);
        $("#blockValue").html(poolName in stats.pools ? 'Block Value</br>$' + parseFloat(stats.pools[poolName].poolStats.coinMarketCap * reward).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 0);
        $("#transparent").html(poolName in stats.pools ? symbol + '<BR>Transparent<BR>Node Balance</br>' + parseFloat(stats.pools[poolName]?.wallet.transparent || 0)  : 0);
        $("#private").html(poolName in stats.pools ? symbol + '<BR>Private</br>Node Balance<BR>' + parseFloat(stats.pools[poolName]?.wallet.private || 0) : 0);
        $("#netTime").html('Current <BR>Network Time</br>' + readableDate(Date.now()));
        $("#exchangeWalletBal").html(poolName in stats.pools ? exchangeCoinPair +'</br> Exchange Wallet<BR>' + parseFloat(stats.pools[poolName]?.wallet.exchangeWallet.balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})  : 0);
        var link = (poolName in stats.pools ?  '<a href=' + stats.pools[poolName].exchangeUrl + ' target="_blank">' + stats.pools[poolName]?.wallet.exchangeWallet.exchange +' Live</a>' : 0);
        $("#exchangeWalletName").html(poolName in stats.pools ?  '<a href=' + stats.pools[poolName].exchangeUrl + ' target="_blank">' + stats.pools[poolName]?.wallet.exchangeWallet.exchange +'</a><BR>'+exchangeRate +'<BR>$'+(exchangeRate*BTCUSD).toFixed(2)  : 0);
        $("#exchangeWalletTime").html(poolName in stats.pools ? exchangeName +'<BR>Wallet Time<BR>' + readableDate(parseFloat(stats.pools[poolName]?.wallet.exchangeWallet.time *1000|| 0)) : 0);
        $("#convertedBalance").html(poolName in stats.pools ? exchangeToCoin +' </br>Exchange Wallet<BR>' + parseFloat(stats.pools[poolName]?.wallet.exchangeWalletConverted.balance)  : 0);
        $("#convertedValueUSD").html(poolName in stats.pools ? exchangeToCoin +'</br>Exchange Wallet<BR>$' + (parseFloat(stats.pools[poolName]?.wallet.exchangeWalletConverted.balance) * BTCUSD).toFixed(2).toLocaleString()  : 0);
        $("#exchangeValueUSD").html(poolName in stats.pools ? exchangeCoinPair +'</br>Exchange Wallet<BR>$' + (parseFloat(stats.pools[poolName]?.wallet.exchangeWallet.balance) * exchangeRate * BTCUSD).toFixed(2).toLocaleString()  : 0);
        
        var change = parseFloat(stats.pools[poolName]?.wallet.exchangeToCoinTicker.price)
        if (parseFloat(change) > parseFloat(stats.pools[poolName]?.wallet.exchangeToCoinTicker.initialprice)) {
             $("#exchangeToCoinCurrent").attr("class", "text-success");
             
             $("#convertedValueUSD").attr("class", "text-success");

        } else {
                $("#exchangeToCoinCurrent").attr("class", "text-danger");
                $("#convertedValueUSD").attr("class", "text-danger");
        }

        var xchange = parseFloat(stats.pools[poolName]?.wallet.exchangeTicker.price)
        if (parseFloat(xchange) > parseFloat(stats.pools[poolName]?.wallet.exchangeTicker.initialprice)) {
             $("#exchangeCurrent").attr("class", "text-success");
             $("#exchangeWalletName").attr("class", "text-success");
        } else {
                $("#exchangeCurrent").attr("class", "text-danger");
                 $("#exchangeWalletName").attr("class", "text-danger");
        }

        $("#exchangeToCoinLow").html(poolName in stats.pools ? exchangeToCoin +'<BR>Low<BR>$' + parseFloat(stats.pools[poolName]?.wallet.exchangeToCoinTicker.low).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})  : 0);
        $("#exchangeToCoinHigh").html(poolName in stats.pools ? exchangeToCoin +'<BR>High<BR>$' + parseFloat(stats.pools[poolName]?.wallet.exchangeToCoinTicker.high).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})  : 0);
        $("#exchangeToCoinCurrent").html(poolName in stats.pools ?  exchangeToCoin +' <BR>Current Price<BR>$' + parseFloat(stats.pools[poolName]?.wallet.exchangeToCoinTicker.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})  : 0);
        $("#exchangeToCoinOpen").html(poolName in stats.pools ? exchangeToCoin +' <BR>Opening Price<BR>$' + parseFloat(stats.pools[poolName]?.wallet.exchangeToCoinTicker.initialprice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})  : 0);
        $("#exchangeToCoinExchange").html(poolName in stats.pools ? link +'<BR>Selected Exchange Trade Time (5 Sec. Updates)<BR>' + Date(stats.pools[poolName]?.wallet.exchangeToCoinTicker.time*1000) : 0);
        $("#exchangeToCoinTicker").html(poolName in stats.pools ? exchangeName +' <BR>' + stats.pools[poolName]?.wallet.exchangeToCoinTicker.coin  : 0);
        $("#exchangeLow").html(poolName in stats.pools ? exchangeCoinPair +'<BR>Low<BR>' + parseFloat(stats.pools[poolName]?.wallet.exchangeTicker.low).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})  : 0);
        $("#exchangeHigh").html(poolName in stats.pools ? exchangeCoinPair +'<BR>High<BR>' + parseFloat(stats.pools[poolName]?.wallet.exchangeTicker.high).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})  : 0);
        $("#exchangeCurrent").html(poolName in stats.pools ?  exchangeCoinPair +' <BR>Current Price<BR>' + parseFloat(stats.pools[poolName]?.wallet.exchangeTicker.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})   : 0);
        $("#exchangeOpen").html(poolName in stats.pools ? exchangeCoinPair +' <BR>Opening Price<BR>' + parseFloat(stats.pools[poolName]?.wallet.exchangeTicker.initialprice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})  : 0);
        $("#exchangeExchange").html(poolName in stats.pools ? link +'<BR>Selected Exchange Trade Time (5 Sec. Updates)<BR>' + Date(stats.pools[poolName]?.wallet.exchangeTicker.time*1000) : 0);
        $("#exchangeTicker").html(poolName in stats.pools ? exchangeName +' <BR>' + stats.pools[poolName]?.wallet.exchangeToCoinTicker.coin  : 0);
        var BTCUSDChange = parseFloat(poolName in stats.pools ? stats.pools[poolName]?.wallet.btcusd.price : 0) - parseFloat(poolName in stats.pools ? stats.pools[poolName]?.wallet.btcusd24hr.open : 0) 
        BTCUSDChange = parseFloat(BTCUSDChange).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
        
        if (parseFloat(BTCUSDChange) > 0) {
             $("#coinbaseProBTCUSD").attr("class", "text-success");

        } else {
                $("#coinbaseProBTCUSD").attr("class", "text-danger");

        }
        
        $("#coinbaseProBTCUSD").html(poolName in stats.pools ? 'BTC-USD<BR>Coinbase Pro<BR>$' + parseFloat(stats.pools[poolName]?.wallet.btcusd.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8}) +'<BR>$'+BTCUSDChange : 0);
        $("#coinbaseProETHUSD").html(poolName in stats.pools ? 'ETH-USD<BR>Coinbase Pro <BR>$' + parseFloat(stats.pools[poolName]?.wallet.ethusd.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8}) : 0);
        
        $("#coinbaseProBTCUSDOpen").html(poolName in stats.pools ? 'BTC-USD Open<BR>Coinbase Pro<BR>$' + parseFloat(stats.pools[poolName]?.wallet.btcusd24hr.open).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})  : 0);
        $("#coinbaseProBTCUSDLow").html(poolName in stats.pools ? 'BTC-USD Low<BR>Coinbase Pro<BR>$' + parseFloat(stats.pools[poolName]?.wallet.btcusd24hr.low).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})  : 0);
        $("#coinbaseProBTCUSDHigh").html(poolName in stats.pools ? 'BTC-USD High<BR>Coinbase Pro<BR>$' + parseFloat(stats.pools[poolName]?.wallet.btcusd24hr.high).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})  : 0);
        $("#coinbaseProBTCUSDVolume").html(poolName in stats.pools ? 'BTC-USD <BR>Coinbase Pro<BR>$' + parseFloat(stats.pools[poolName]?.wallet.btcusd24hr.volume).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})  : 0);
        $("#coinbaseProBTCUSDlast").html(poolName in stats.pools ? 'BTC-USD <BR>Coinbase Pro <BR>$' + parseFloat(stats.pools[poolName]?.wallet.btcusd24hr.last).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})  : 0);
       
        // usd fix: .toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})

        var time = stats.time * 1000;
        var poolHashrateData = pool.averagedHashrate; //pool
       
                
                  
					
                   var statsHashrateAvg = getReadableHashRate(calculateAverageHashrate(poolHashrateData.slice(1)))
                   console.log('statsHashrateAvg: '+statsHashrateAvg)
    //    addChartData(poolHashrateChart, poolHashrateChart.data.datasets[1], {t: time, y: statsHashrateAvg}, true);
      
                  
            
       
       
        addChartData(poolHashrateChart, poolHashrateChart.data.datasets[0], {
            t: time,
            y: hash
        }, true);

        
        
        addChartData(networkDiffChart, networkDiffChart.data.datasets[0], {
            t: time,
            y: getScaledNetworkDiff(stats.pools[poolName].networkDiff)
        }, true);
        
        
        addChartData(networkHashrateChart, networkHashrateChart.data.datasets[0], {
            t: time,
            y: getScaledNetworkDiff(stats.pools[poolName].networkSols)
        }, true);
        
        addAnnotationVertical(poolHashrateChart, then, text);

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
/*
this.getScaledHashrate = function(hashrate, i) {
    hashrate = (hashrate * 2);
    if (hashrate < 1000000) {
        hashrate = hashrate * 100000;
    }
    hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);
    return hashrate.toFixed(2);
};
*/
this.getReadableHashRateString = function(hashrate) {
    hashrate = (hashrate * 2);
    if (hashrate < 1000000) {
        hashrate = hashrate * 100000;
    }
    var byteUnits = [' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s', 'undefined'];
    var i = Math.max(0, Math.floor((Math.log(hashrate / 1000) / Math.log(1000)) - 1));
    hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);

    return hashrate.toFixed(2) + ' ' + byteUnits[i];
};
/*
this.getReadableHashRatePair = function(hashrate) {
    hashrate = (hashrate * 2);
    if (hashrate < 1000000) {
        hashrate = hashrate * 100000;
    }
    var byteUnits = [' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s', 'undefined'];
    var i = Math.max(0, Math.floor((Math.log(hashrate / 1000) / Math.log(1000)) - 1));
    hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);

    return [hashrate.toFixed(2), byteUnits[i], i];
};
*/
function calculateAverageHashrate(poolHashrateData) {
		var count = 0;
		var total = 1;
		var avg = 0;
        
		for (var i = 0; i < poolHashrateData.length; i++) {
			count = 0;
           // console.log('poolHashrateData2: '+ poolHashrateData[i].slice(1))
			for (var ii = 0; ii < poolHashrateData[i].values.length; ii++) {
				
					count++;
					avg += parseFloat(poolHashrateData[i].values[ii][1]);
				
			}
			if (count > total)
				total = count;
		}
		avg = avg / total;
		return avg;
}
