
# bittrex-rest-client
_Forked from Andrew Barba's [bittrex-node](https://github.com/AndrewBarba/bittrex-node)_

## A full-featured Bittrex v3 REST-API client for Node.js


- [x] Upgraded to Bittrex v3 API specification
- [x] Now includes methods for fetching chart candles via REST API
- [x] 100% unit-test coverage
- [x] Heavily documented
- [x] Promise based with async/await
- [x] All public methods have thorough JSdoc comments for quick reference and parameter auto-fill in modern code editors.
___
I think I've included all of the functionality that most traders and developers will need, but if there is a particular API endpoint that I have overlooked which you need, open a new issue and I will add it.
___
There are no plans to incorporate the websocket API into this repository, as the REST API has use cases beyond trading.
___
Nobody paid me to do this, so if my work saves you time or money, consider sending a tip!

BTC: 1EHkFQBk9LB2Zm3RcP7EeVLqUUDaEFpNxx

LTC: Lht9v7E9bxPMAmU2TUeVx2SJZu2AW32LSW

ETH: 0xaba31e526ca98a2a659d69b30adc2da8f3eaaa2d

DOGE: DC8xePEAyC2PeGQUqF51abrF8m7BMuVVoS

XMR: 41tnfGBpCt527q9aqdAjU914gcyJ8Fk2K9vGHHxswgF1hPgouanA2WFbQKimLBMt3zESnkuBWcn29NMiVAC1k4CxRMAdqB6
___
## Initialize Client

This package is now available as an NPM module, and can be added to your project with:
```bash
$ npm install bittrex-rest-client
```
Then call it in your code as a dependency:
```javascript
const { BittrexClient } = require('bittrex-rest-client')
```
And initialize a new instance:
```javascript
const client = new BittrexClient({
  apiKey: process.env.KEY, // pass API creds from .env file in project directory
  apiSecret: process.env.SECRET,
  timeout: 3000 // Optional, specify timeout for web requests, in milliseconds.
  })
```

## Public Requests

```javascript
await client.markets() //List all available markets on the exchange.
await client.currencies() //List all available currencies on the exchange.
await client.ticker(marketSymbol) //Get current ticker quote.
await client.marketSummaries() //List 24-hour summaries for all available markets.
await client.marketSummary() //Get 24-hour summary for specified market.
await client.marketTrades(marketSymbol) //Get list of most recently executed trades for specified market.
await client.orderBook(marketSymbol,depth=25)//Get orderbook for specified market.
await client.getCandlesRecent(marketSymbol,candleInterval,candleType='TRADE') //Retrieve most recent candles for specified market.
await client.getCandlesHistorical(marketSymbol,candleInterval,year,month=1,day=1,candleType='TRADE') //Retrieve candles from historical period for specified market.
```
## Trading

```javascript
await client.sendOrder(marketSymbol,direction,type,{quantity,ceiling,limit}={},timeInForce='IMMEDIATE_OR_CANCEL',clientOrderId=uuid(),useAwards=false) // Send a new order to the exchange.
await client.getOpenOrders(marketSymbol)//List open orders.
await client.cancelOrder(clientOrderId,marketSymbol) //Cancel an open order.
await client.getOrderHistory(marketSymbol,nextPageToken,previousPageToken,pageSize,startDate,endDate) //Retrieve a list of closed orders.
```

## Account Management

```javascript
await client.balances(currencySymbol) //Retrieve current balance for specified currencySymbol or a list of all balances.
await client.getNewDepositAddress(currencySymbol) //Request new deposit address.
await client.getaddresses(currencySymbol) //retrieve deposit address for specified currency or all currencies.
await client.withdrawalHistory(open,{currencySymbol,status}) //Get list of withdrawals.
await client.depositHistory(currencySymbol,pending) //Get list of deposits.
await client.requestWithdrawal(currencySymbol,quantity,cryptoAddress,{cryptoAdressTag,clientWithdrawalId}) // Request a new withdrawal
await client.cancelWithdrawal(withdrawalId) //Cancel a pending withdrawal request.
```

## Note on testing
**Be careful testing on a live account.**
All tests will pass assuming a valid API key/secret with all permissions enabled. The trading method is tested in a manner that will not result in trades being filled. **The withdrawal method attempts to make a 50BTC withdrawal, and expects to receive an 'INSUFFICIENT_FUNDS' error.** You can change the test paramaters of course in test/index.js.

## Licence
This software is made available under the MIT licence.

Copyright (c) 2018 AndrewBarba
Copyright (c) 2021 libertas-primordium

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
