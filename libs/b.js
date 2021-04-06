//change coins list in this array
const coinsList = [
    'BTC',
    'ETH',
    'BNB',
    'LTC',
    'XLM',
    'BAT',
    'LIT',
    'TRX',
    'USDT'
];

const fetchCoinAPI = async () => {
    coinsList.forEach(async (coinName) => {
        let url = `https://min-api.cryptocompare.com/data/price?fsym=${coinName}&tsyms=USDT`;
        let fetchResult = await fetch(url);
        let jsonResult = await fetchResult.json();
        document.getElementById(`currenciesList`).innerHTML += `
        <h3><a target="blank" href="https://www.cryptocompare.com/coins/${coinName.toLowerCase()}/overview/USDT">${coinName}:</a> <span style="color: green;">${jsonResult.USDT}</span>$</h3>`
    });
    // // get gold price
    // document.getElementById('goldVNDPrice').innerHTML = await fetchGoldPrice();
    // Exchange USD to VNĐ
    let VNDcurrency = await fetchExchange();
    document.getElementById('VNDPrice').innerHTML = formatMoney(VNDcurrency);
}

const fetchGoldPrice = async () => {
    let myHeaders = new Headers();

    myHeaders.append("x-access-token", "goldapi-3pc5dukj0u2i3t-io");
    myHeaders.append("Content-Type", "application/json");

    const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    let result = await fetch("https://www.goldapi.io/api/XAU/USDT", requestOptions).then(response => response.text())
        .then(result => result);
    if (typeof result == 'string') result = JSON.parse(result);
    if (typeof result == 'object') {
        result = result.price;
        result = result.toFixed(2);
    }
    return result;
}

const fetchExchange = async () => {
    let result = await fetch(`https://free.currconv.com/api/v7/convert?q=USD_VND&compact=ultra&apiKey=adeffb2a37fa8b7a98aa`); //add this to your url &compact=ultra&apiKey=${yourkey}
    result = await result.json();
    return result.USD_VND;
}

function formatMoney(n, c, d, t) {
    var c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
        j = (j = i.length) > 3 ? j % 3 : 0;

    var ret = s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "") + ' VNĐ';
    return ret.replace('.00', '');
}

fetchCoinAPI();


