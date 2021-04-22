function calculateExpMovingAvg(mArray, mRange) {
    var k = 2 / (mRange + 1);
    // first item is just the same as the first item in the input
    emaArray = [
        [mArray[0][0], mArray[0][1]]
    ];
    // for the rest of the items, they are computed with the previous one
    for (var i = 1; i < mArray.length; i++) {
        var height = mArray[i][1] * k + emaArray[i - 1][1] * (1 - k);
        emaArray.push([mArray[i][0], height]);
    }
    return emaArray;
}

function capFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function generateName() {
    var name1 = ['raging', 'mad', 'hashing', 'cool', 'rich', 'honorable', 'king',
        'fast', 'killer', 'sweet'
    ];

    var name2 = ['cromulon', 'computer', 'hasher', 'PC', 'rig', 'miner', 'otter',
        'cronenberg', 'gazorpazorp'
    ];

    var name = name1[Math.floor(Math.random() * name1.length)].toLowerCase() + name2[Math.floor(Math.random() * name2.length)].toLowerCase();
    return name;

}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getRandomPastelColor() {
    var r = (Math.round(Math.random() * 127) + 127).toString(16);
    var g = (Math.round(Math.random() * 127) + 127).toString(16);
    var b = (Math.round(Math.random() * 127) + 127).toString(16);
    return '#' + r + g + b;
}

function addChartData(chart, dataset, data, update) {
    dataset.data.shift();
    dataset.data.push(data);
    if (update) {
        chart.update();
    }
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

function getReadableNetworkHashRateString(hashrate) {
    hashrate = (hashrate * 1000000);
    if (hashrate < 1000000)
        return '0 Sol';
    var byteUnits = [' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s'];
    var i = Math.floor((Math.log(hashrate / 1000) / Math.log(1000)) - 1);
    hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);
    return hashrate.toFixed(2) + byteUnits[i];
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

this.getScaledNetworkDiff = function(networkDiff) {
         networkDiff = (networkDiff * 1000000);
      var i = Math.max(0, Math.floor((Math.log(networkDiff /1000) / Math.log(1000)) - 1));
      networkDiff = (networkDiff /1000) / Math.pow(1000, i + 1);

      return networkDiff.toFixed(2);
 };


/*

this.getScaledNetworkDiff = function(networkDiff, i) {
	networkDiff = (networkDiff * 1000000);
     networkDiff = (networkDiff / 1000) / Math.pow(1000, i + 1);
console.log(networkDiff);
     return networkDiff.toFixed(2);
};

*/
this.getReadableHashRateString = function(hashrate) {
    hashrate = (hashrate * 2);
    if (hashrate < 1000000) {
        hashrate = hashrate * 100000;
    }
    var byteUnits = [' Sols/s', ' KSols/s', ' MSols/s', ' GSols/s', ' TSols/s', ' PSols/s'];
    var i = Math.max(0, Math.floor((Math.log(hashrate / 1000) / Math.log(1000)) - 1));
    hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);

    return hashrate.toFixed(2) + ' ' + byteUnits[i];
};

this.getReadableNetworkDiffString = function(networkDiff) {
        networkDiff = networkDiff * 1000000;
    var byteUnits = [' ', ' K', ' M', ' G', ' T', ' P'];
    var i = Math.max(0, Math.floor((Math.log(networkDiff / 1000) / Math.log(1000)) - 1));
    networkDiff = (networkDiff / 1000) / Math.pow(1000, i + 1);
    return networkDiff.toFixed(2) + ' ' + byteUnits[i];
};



this.getReadableHashRatePair = function(hashrate) {
    hashrate = (hashrate * 2);
    if (hashrate < 1000000) {
        hashrate = hashrate * 100000;
    }
    var byteUnits = [' Sols/s', ' KSols/s', ' MSols/s', ' GSols/s', ' TSols/s', ' PSols/s'];
    var i = Math.max(0, Math.floor((Math.log(hashrate / 1000) / Math.log(1000)) - 1));
    hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);

    return [hashrate.toFixed(2), byteUnits[i], i];
};

this.getReadableNetworkDiffPair = function(networkDiff) {
	networkDiff = (networkDiff * 1000000);
     var byteUnits = [' H', ' K', ' M', ' G', ' T', ' P'];
     var i = Math.max(0, Math.floor((Math.log(networkDiff /1000) / Math.log(1000)) - 1));
     networkDiff = (networkDiff /1000) / Math.pow(1000, i + 1);

     return [networkDiff.toFixed(2), byteUnits[i]];
};


function createDefaultLineChart(ctx, datasets, xLabel, yLabel) {
    return createLineChart(ctx, datasets, xLabel, yLabel, {
        beginAtZero: true
    });
}

function createLineChart(ctx,  datasets, xLabel, yLabel, ticks) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            spanGaps: false,
            animation: {
                easing: 'easeInExpo',
                duration: 1000,
                xAxis: true,
                yAxis: true,
            },
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                point: {
                    radius: 0
                }
            },
            scales: {
                xAxes: [{
                    type: 'time'
                }],
                yAxes: [{
                    ticks: ticks,
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: yLabel
                    }
                }]
            }
        }
    });
}
