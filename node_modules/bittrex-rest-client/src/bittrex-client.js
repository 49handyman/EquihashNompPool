const axios = require('axios')
const CryptoJS = require('crypto-js')
const https = require('https')
const uuid = require('uuid-random')
require('dotenv').config()

class BittrexClient {

  /**
   * @constructor
   * @param {String} [options.apiKey=null]
   * @param {String} [options.apiSecret=null]
   * @param {Boolean} [options.keepAlive=true]
   */
  constructor({ apiKey, apiSecret, timeout, keepAlive = true } = {}) {
    this._apiKey = apiKey
    this._apiSecret = apiSecret
    this._nonce = new Date().getTime()
    this._baseURL = 'https://api.bittrex.com/v3'
    this._client = axios.create({
      baseURL: this._baseURL,
      httpsAgent: new https.Agent({ keepAlive }),
      timeout: timeout
    })
  }

  /*-------------------------------------------------------------------------*
   * Non-Authenticated API Calls
   *-------------------------------------------------------------------------*/

  /**
   * @method markets - List all available markets on the exchange. Returns an array of Market objects.
   * @returns {Promise} - [{
      "symbol": "string",
      "baseCurrencySymbol": "string",
      "quoteCurrencySymbol": "string",
      "minTradeSize": "number (double)",
      "precision": "integer (int32)",
      "status": "string",
      "createdAt": "string (date-time)",
      "notice": "string",
      "prohibitedIn": [
        "string"
      ],
      "associatedTermsOfService": [
        "string"
      ],
      "tags": [
        "string"
      ]
    }]
   */
  async markets(){
    const results = await this.request('GET','/markets')
    return results
  }

  /**
   * @method currencies - List all available currencies on the exchange. Returns an array of Currency objects.
   * @returns {Promise} - [{
      "symbol": "string",
      "name": "string",
      "coinType": "string",
      "status": "string",
      "minConfirmations": "integer (int32)",
      "notice": "string",
      "txFee": "number (double)",
      "logoUrl": "string",
      "prohibitedIn": [
        "string"
      ],
      "baseAddress": "string",
      "associatedTermsOfService": [
        "string"
      ],
      "tags": [
        "string"
      ]
    }]
   */
  async currencies(){
    return this.request('GET','/currencies')
  }

  /**
   * @method ticker - Get current ticker quote. Returns a single Ticker object if marketSymbol specified, or array of Ticker objects for all markets otherwise.
   * @param {String} marketSymbol - Optional. Example: 'BTC-USD'
   * @returns {Promise} - {
      "symbol": "string",
      "lastTradeRate": "number (double)",
      "bidRate": "number (double)",
      "askRate": "number (double)"
    }
   */
  async ticker(marketSymbol){
    if (marketSymbol) return this.request('GET',`/markets/${marketSymbol}/ticker`)
    else return this.request('GET','/markets/tickers')
  }

  /**
   * @method marketSummaries - List 24-hour summaries for all available markets. Returns an array of MarketSummary objects.
   * @returns {Promise} - [{
      "symbol": "string",
      "high": "number (double)",
      "low": "number (double)",
      "volume": "number (double)",
      "quoteVolume": "number (double)",
      "percentChange": "number (double)",
      "updatedAt": "string (date-time)"
    }]
   */
  async marketSummaries(){
    const results = await this.request('GET','/markets/summaries')
    return results
  }

  /**
   * @method marketSummary - Get 24-hour summary for specified market. Returns a single MarketSummary object.
   * @param {String} marketSymbol - Required. Example: 'BTC-USD'
   * @returns {Promise} - {
      "symbol": "string",
      "high": "number (double)",
      "low": "number (double)",
      "volume": "number (double)",
      "quoteVolume": "number (double)",
      "percentChange": "number (double)",
      "updatedAt": "string (date-time)"
    }
   */
  async marketSummary(marketSymbol){
    if (!marketSymbol) throw new Error('marketSymbol is required')
    const results = await this.request('GET',`/markets/${marketSymbol}/summary`)
    return results
  }

  /**
   * @method marketTrades - Get list of most recently executed trades for specified market. Returns an array of Trade objects.
   * @param {String} marketSymbol - Reqired. Example: 'BTC-USD'
   * @returns {Promise} - [{
      "id": "string (uuid)",
      "executedAt": "string (date-time)",
      "quantity": "number (double)",
      "rate": "number (double)",
      "takerSide": "string"
    }]
   */
  async marketTrades(marketSymbol){
    if (!marketSymbol) throw new Error('marketSymbol is required')
    const results = await this.request('GET',`/markets/${marketSymbol}/trades`)
    return results
  }

  /**
   * @method orderBook - Get orderbook for specified market. 25 levels if no depth specified. Returns an OrderBook Object.
   * @param {String} marketSymbol - Required. Example: 'BTC-USD'
   * @param {Number} depth=25 - (integer) Optional.
   * @returns {Promise} - {
    "bid": [
      {
        "quantity": "number (double)",
        "rate": "number (double)"
      }
    ],
    "ask": [
      {
        "quantity": "number (double)",
        "rate": "number (double)"
      }
    ]
  }
   */
  async orderBook(marketSymbol,depth=25){
    if (!marketSymbol) throw new Error('marketSymbol is required')
    return this.request('GET',`/markets/${marketSymbol}/orderbook`,{depth})
  }

  /**
   * @method getCandlesRecent - Retrieve most recent candles for specified market. Returns an array of Candle objects.
   * The maximum age of the returned candles depends on the interval as follows: (MINUTE_1: 1 day, MINUTE_5: 1 day, HOUR_1: 31 days, DAY_1: 366 days).
   * @param  {String} marketSymbol - Required. Example: 'BTC-USD'
   * @param  {String} candleInterval - Required. Must be: ['MINUTE_1'|'MINUTE_5'|'HOUR_1'|'DAY_1']
   * @param  {String} candleType='TRADE' - Optional. Either 'TRADE' or 'MIDPOINT'. Default 'TRADE'.
   * @returns {Promise} - [{
    "startsAt": "string (date-time)",
    "open": "number (double)",
    "high": "number (double)",
    "low": "number (double)",
    "close": "number (double)",
    "volume": "number (double)",
    "quoteVolume": "number (double)"
    }]
   */
  async getCandlesRecent(marketSymbol,candleInterval,candleType='TRADE'){
    if (!marketSymbol) throw new Error('marketSymbol is required')
    if (!candleInterval) throw new Error('candleInterval is required')
    const results = await this.request('GET',`/markets/${marketSymbol}/candles/${candleType}/${candleInterval}/recent`)
    return results
  }

   /**
   * @method getCandlesHistorical - Retrieve candles from historical period for specified market. Returns an array of Candle objects.
   * The date range of returned candles depends on the interval as follows: (MINUTE_1: 1 day, MINUTE_5: 1 day, HOUR_1: 31 days, DAY_1: 366 days).
   * @param  {String} marketSymbol - Required. Example: 'BTC-USD'
   * @param  {String} candleInterval - Required. Must be: ['MINUTE_1'|'MINUTE_5'|'HOUR_1'|'DAY_1']
   * @param  {Number} year - (integer) - Required.
   * @param  {Number} month - (integer) - Required.
   * @param  {Number} day - (integer) - Required.
   * @param  {String} candleType='TRADE' - Optional. Either 'TRADE' or 'MIDPOINT'.
   * @returns {Promise} - [{
    "startsAt": "string (date-time)",
    "open": "number (double)",
    "high": "number (double)",
    "low": "number (double)",
    "close": "number (double)",
    "volume": "number (double)",
    "quoteVolume": "number (double)"
    }]
   */
  async getCandlesHistorical(marketSymbol,candleInterval,year,month=1,day=1,candleType='TRADE'){
    if (!marketSymbol) throw new Error('marketSymbol is required')
    if (!candleInterval) throw new Error('candleInterval is required')
    const results = await this.request('GET',`/markets/${marketSymbol}/candles/${candleType}/${candleInterval}/historical/${year}/${month}/${day}`)
    return results
  }

  /*-------------------------------------------------------------------------*
   * Authenticated API Calls
   *-------------------------------------------------------------------------*/

  /// Trading:

  /**
   * @method sendOrder - Submit a new order to the exchange. Returns a single Order object if successful.
   * @param  {String} marketSymbol - Required. Example: 'BTC-USD'
   * @param  {String} direction - Required. Must be: ['BUY'|'SELL']
   * @param  {String} type - Required. Must be: ['LIMIT'|'MARKET'|'CEILING_LIMIT'|'CEILING_MARKET']
   * @param  {Number} quantity - (double) Required if type=['LIMIT'|'MARKET']. Excluded if type=['CEILING_LIMIT'|'CEILING_MARKET'].
   * @param  {Number} ceiling - (double) Required if type=['CEILING_LIMIT'|'CEILING_MARKET']. Excluded if type=['LIMIT'|'MARKET'].
   * @param  {Number} limit - (double) Order price. Required if type=['LIMIT'|'CEILING_LIMIT']. Excluded if type=['MARKET'|'CEILING_MARKET']
   * @param  {String} timeInForce='INSTANT' - Required. Must be: ['GOOD_TIL_CANCELLED'|'IMMEDIATE_OR_CANCEL'|'FILL_OR_KILL'|'POST_ONLY_GOOD_TIL_CANCELLED'|'BUY_NOW'|'INSTANT']
   * @param  {String} clientOrderId - Optional. UUID-formatted string for advanced order tracking. Will be randomly generated by default.
   * @param  {Boolean} useAwards=false - Optional. Set useAwards=true to use Bittrex credits to pay transaction fee.
   * @returns  {Promise} - {
      "id": "string (uuid)",
      "marketSymbol": "string",
      "direction": "string",
      "type": "string",
      "quantity": "number (double)",
      "limit": "number (double)",
      "ceiling": "number (double)",
      "timeInForce": "string",
      "clientOrderId": "string (uuid)",
      "fillQuantity": "number (double)",
      "commission": "number (double)",
      "proceeds": "number (double)",
      "status": "string",
      "createdAt": "string (date-time)",
      "updatedAt": "string (date-time)",
      "closedAt": "string (date-time)",
      "orderToCancel": {
        "type": "string",
        "id": "string (uuid)"
      }
    }
   */
  async sendOrder(marketSymbol,direction,type,{quantity,ceiling,limit}={},timeInForce='IMMEDIATE_OR_CANCEL',clientOrderId=uuid(),useAwards=false){
    if (!marketSymbol) throw new Error('marketSymbol is required')
    if (['BUY','SELL'].indexOf(direction) === -1) throw new Error('direction must be either \'BUY\' or \'SELL\'')
    if (['LIMIT','MARKET','CEILING_LIMIT','CEILING_MARKET'].indexOf(type) === -1) throw new Error('type must be either: [\'LIMIT\'|\'MARKET\'|\'CEILING_LIMIT\'|\'CEILING_MARKET\']')
    if (['LIMIT','MARKET'].indexOf(type) >= 0 && !quantity) throw new Error('quantity must be included if type=[\'MARKET\'|\'LIMIT\']')
    if (['LIMIT','MARKET'].indexOf(type) >= 0 && ceiling) throw new Error('Do not specify ceiling if type=[\'MARKET\'|\'LIMIT\']')
    if (['CIELING_LIMIT','CIELING_MARKET'].indexOf(type) >=0 && !ceiling) throw new Error('ceiling must be included if type=[\'CEILING_MARKET\'|\'CEILING_LIMIT\']')
    if (['CIELING_LIMIT','CIELING_MARKET'].indexOf(type) >=0 && quantity) throw new Error('Do not specify quantity if type=[\'CEILING_MARKET\'|\'CEILING_LIMIT\']')
    if (['CIELING_LIMIT','LIMIT'].indexOf(type) >=0 && !limit) throw new Error('limit must be included if type=[\'LIMIT\'|\'CEILING_LIMIT\']')
    if (['MARKET','CIELING_MARKET'].indexOf(type) >=0 && limit) throw new Error('Do not specify limit if type=[\'MARKET\'|\'CEILING_MARKET\']')
    if (['MARKET','CIELING_MARKET'].indexOf(type) === -1 && !timeInForce) timeInForce = 'GOOD_TIL_CANCELLED'
    const requestBody = {marketSymbol,direction,type,quantity,ceiling,limit,timeInForce,clientOrderId,useAwards}
    const query = ''
    const results = await this.requestAuth('POST','/orders',query,requestBody)
    return results
  }

  /**
   * @method openOrders - List open orders. May be narrowed by specifying either market or clientOrderId. Returns an array of Order objects or a single Order object.
   * @param {String} marketSymbol - Optional. Example: 'BTC-USD'
   * @param {String} clientOrderId='open' - Optional. UUID-formatted string.
   * @returns {Promise} - [{
    "id": "string (uuid)",
    "marketSymbol": "string",
    "direction": "string",
    "type": "string",
    "quantity": "number (double)",
    "limit": "number (double)",
    "ceiling": "number (double)",
    "timeInForce": "string",
    "clientOrderId": "string (uuid)",
    "fillQuantity": "number (double)",
    "commission": "number (double)",
    "proceeds": "number (double)",
    "status": "string",
    "createdAt": "string (date-time)",
    "updatedAt": "string (date-time)",
    "closedAt": "string (date-time)",
    "orderToCancel": {
      "type": "string",
      "id": "string (uuid)"
    }}]
   */
  async getOpenOrders(marketSymbol,clientOrderId='open'){
    const query = {marketSymbol}
    const results = await this.requestAuth('GET',`/orders/${clientOrderId}`,query)
    return results
  }


  /**
   * @method cancelOrder - Cancel existing orders. Default will cancel ALL orders. Specify either marketSymbol or clientOrderId to cancel specific orders only. Returns an Order object or array of Order objets.
   * @param  {String} clientOrderId='open' - Optional. UUID-formatted string to identify order.
   * @param  {String} marketSymbol - Optional. Example: 'BTC-USD'
   * @returns {promise} - [{
    "id": "string (uuid)",
    "statusCode": "string",
    "result": {
      "id": "string (uuid)",
      "marketSymbol": "string",
      "direction": "string",
      "type": "string",
      "quantity": "number (double)",
      "limit": "number (double)",
      "ceiling": "number (double)",
      "timeInForce": "string",
      "clientOrderId": "string (uuid)",
      "fillQuantity": "number (double)",
      "commission": "number (double)",
      "proceeds": "number (double)",
      "status": "string",
      "createdAt": "string (date-time)",
      "updatedAt": "string (date-time)",
      "closedAt": "string (date-time)",
      "orderToCancel": {
        "type": "string",
        "id": "string (uuid)"
      }
    }}]
   */
  async cancelOrder(clientOrderId='open',marketSymbol){
    const query = {marketSymbol}
    const results = this.requestAuth('DELETE',`/orders/${clientOrderId}`,query)
    return results
  }



  /**
   * @method getOrderHistory - Retrieve a list of closed orders. Query can by narrowed by specifying marketSymbol. Returns an array of Order objects.
   * @param  {String} marketSymbol - Optional. Example: 'BTC'
   * @param  {String} nextPageToken - Optional. Used for traversing a paginated set in the forward direction. May only be specified if PreviousPageToken is not specified.
   * @param  {String} previousPageToken - Optional. Used for traversing a paginated set in the reverse direction. May only be specified if NextPageToken is not specified.
   * @param  {Number} pageSize - Integer. [1-200] Optional. Default 100. Maximum number of items to retrieve.
   * @param  {Date} startDate - DateTime. Optional. Filter out orders before this date-time.
   * @param  {Date} endDate - DateTime. Optional. Filter out orders after this date-time.
   * @returns {Promise} - [{
    "id": "string (uuid)",
    "marketSymbol": "string",
    "direction": "string",
    "type": "string",
    "quantity": "number (double)",
    "limit": "number (double)",
    "ceiling": "number (double)",
    "timeInForce": "string",
    "clientOrderId": "string (uuid)",
    "fillQuantity": "number (double)",
    "commission": "number (double)",
    "proceeds": "number (double)",
    "status": "string",
    "createdAt": "string (date-time)",
    "updatedAt": "string (date-time)",
    "closedAt": "string (date-time)",
    "orderToCancel": {
      "type": "string",
      "id": "string (uuid)"
      }
    }]
   */
  async getOrderHistory(marketSymbol,nextPageToken,previousPageToken,pageSize,startDate,endDate){
    const query = {marketSymbol,nextPageToken,previousPageToken,pageSize,startDate,endDate}
    const results = await this.requestAuth('GET','/orders/closed',query)
    return results
  }


  /// User/Account:

  /**
   * @method balance - Retrieve current balance for specified currencySymbol or a list of all balances. Returns a Balance object or an array of Balance objects.
   * @param {String} currencySymbol - Optional. Example: 'BTC'
   * @returns {Promise} - {
    "currencySymbol": "string",
    "total": "number (double)",
    "available": "number (double)",
    "updatedAt": "string (date-time)"
    }
  */
  async balance(currencySymbol=''){
    const results = this.requestAuth('GET',`/balances/${currencySymbol}`)
    return results
  }

  /**
   * @method getNewDepositAddress - Request a new deposit address for specified currencySymbol. Returns an address object.
   * @param {String} currencySymbol - Required. Example: 'BTC'
   * @returns {Promise} - {
    "status": "string",
    "currencySymbol": "string",
    "cryptoAddress": "string",
    "cryptoAddressTag": "string"
  }
  */
  async getNewDepositAddress(currencySymbol){
    if (!currencySymbol) throw new Error('currencySymbol is required')
    const query = {currencySymbol}
    return this.requestAuth('POST','/addresses',query)
  }

  /**
   * @method getAddresses - Retrieve existing deposit address for specified currencySymbol, or for all currencies if not specified. Returns an Address object or an array of Address objects.
   * @param {String} currencySymbol - Optional. Example: 'BTC'
   * @returns {Promise} - [{
    "status": "string",
    "currencySymbol": "string",
    "cryptoAddress": "string",
    "cryptoAddressTag": "string"
    }]
    */
  async getAddresses(currencySymbol=''){
    return this.requestAuth('GET',`/addresses/${currencySymbol}`)
  }


  /**
   * @method requestWithdrawal - Start a new withdrawal. Returns a Withdrawal object.
   * @param  {String} currencySymbol - Required. Example: 'BTC'
   * @param  {Number} quantity - (Double) Required.
   * @param  {String} cryptoAddress - Required.
   * @param  {String} cryptoAdressTag - Optional. Required for certain currencies.
   * @param  {String} clientWithdrawalId - Optional. Client-provided UUID-formatted string, needed to cancel withdrawal.
   * @returns {Promise} - {
    "id": "string (uuid)",
    "currencySymbol": "string",
    "quantity": "number (double)",
    "cryptoAddress": "string",
    "cryptoAddressTag": "string",
    "txCost": "number (double)",
    "txId": "string",
    "status": "string",
    "createdAt": "string (date-time)",
    "completedAt": "string (date-time)",
    "clientWithdrawalId": "string (uuid)"
    }
   */
  async requestWithdrawal(currencySymbol,quantity,cryptoAddress,{cryptoAdressTag,clientWithdrawalId=uuid()}={}){
    if (!currencySymbol) throw new Error('currencySymbol is required')
    if (!quantity) throw new Error('quantity is required')
    if (!cryptoAddress) throw new Error('address is required')
    const requestBody = {currencySymbol,quantity,cryptoAddress,cryptoAdressTag,clientWithdrawalId}
    const results = await this.requestAuth('POST','/withdrawals','',requestBody)
    return results
  }

  /**
   * @method withdrawalHistory - Retrieve list of withdrawals. Either open or closed withdrawals. Default returns open. Returns an array of Withdrawal objects.
   * @param  {Boolean} open=true - Optional. Retrieve open withdrawals if true, or closed withdrawals if false.
   * @param  {String} currencySymbol - Optional. Example: 'BTC'
   * @param  {String} status - Optional. Filter by status: ['REQUESTED'|'AUTHORIZED'|'PENDING'|'ERROR_INVALID_ADDRESS'] for open withdrawals, or ['COMPLETED'|'CANCELLED'] for closed withdrawals.
   * @returns {Promise} - [{
    "id": "string (uuid)",
    "currencySymbol": "string",
    "quantity": "number (double)",
    "cryptoAddress": "string",
    "cryptoAddressTag": "string",
    "txCost": "number (double)",
    "txId": "string",
    "status": "string",
    "createdAt": "string (date-time)",
    "completedAt": "string (date-time)",
    "clientWithdrawalId": "string (uuid)"
    }]
   */
  async withdrawalHistory(open=true,{currencySymbol,status}={}){
    const query = {currencySymbol,status}
    let results
    if (open) results = await this.requestAuth('GET','/withdrawals/open',query)
    else results = await this.requestAuth('GET','/withdrawals/closed',query)
    return results
  }

  /**
   * @method cancelWithdrawal - Cancel an open withdrawal request. Only works if Withdrawal.status==['REQUESTED'|'AUTHORIZED'|'ERROR_INVALID_ADDRESS']. Returns a Withdrawal object.
   * @param  {String} withdrawalId - Required. UUID-formatted string matching clientWithdrawalId that was provided when requesting withdrawal.
   * @returns {Promise} - {
    "id": "string (uuid)",
    "currencySymbol": "string",
    "quantity": "number (double)",
    "cryptoAddress": "string",
    "cryptoAddressTag": "string",
    "txCost": "number (double)",
    "txId": "string",
    "status": "string",
    "createdAt": "string (date-time)",
    "completedAt": "string (date-time)",
    "clientWithdrawalId": "string (uuid)"
    }
   */
  async cancelWithdrawal(withdrawalId){
    if (!withdrawalId) throw new Error('withdrawalId is required')
    const results = await this.requestAuth('DELETE',`/withdrawals/${withdrawalId}`)
    return results
  }

  /**
   * @method depositHistory - Retrieve list of deposts. Can filter by pending|completed or by currencySymbol. Returns an array of Deposit objects.
   * @param {String} [currencySymbol] - Optional. Example: 'BTC'
   * @param {Boolean} pending=false - Optional. true will return pending deposits. false will return completed deposits.
   * @returns {Promise} - [{
    "id": "string (uuid)",
    "currencySymbol": "string",
    "quantity": "number (double)",
    "cryptoAddress": "string",
    "cryptoAddressTag": "string",
    "txId": "string",
    "confirmations": "integer (int32)",
    "updatedAt": "string (date-time)",
    "completedAt": "string (date-time)",
    "status": "string",
    "source": "string"
    }]
   */
  async depositHistory(currencySymbol,pending=false){
    let results
    if (pending) results = await this.requestAuth('GET','/deposits/open',{currencySymbol})
  else results = await this.requestAuth('GET','/deposits/closed',{currencySymbol})
  return results
}

  /*-------------------------------------------------------------------------*
   * Private
   *-------------------------------------------------------------------------*/
  /**
   * @private
   * @method request - Simple API Request Method
   * @param  {String} method
   * @param  {String} url
   * @returns {Object}
   */
  async request(method,url){
    const payload = {method,url}
    const response = await this._client.request(payload)
    return response.data
  }

   /**
   * @private
   * @method requestAuth - Authenticated API Request Method
   * @param {String} method
   * @param {String} url
   * @param {Object} query
   * @param {Object} requestBody
   * @returns {Object}
   */
  async requestAuth(method,url,query,requestBody){
    const apiKey = this._apiKey
    const timestamp = new Date().getTime()
    const {params} = this.sanitize(query)
    const data = this.sanitize(requestBody)
    let contentHash = CryptoJS.SHA512('').toString(CryptoJS.enc.Hex)
    if (method==='POST') contentHash = CryptoJS.SHA512(JSON.stringify(data)).toString(CryptoJS.enc.Hex)
    let path = url
    if (params) path = `${url}?${params}`
    const uri = `${this._baseURL}${path}`
    const preSign = [timestamp,uri,method,contentHash].join('')
    const signedMessage = CryptoJS.HmacSHA512(preSign,this._apiSecret).toString(CryptoJS.enc.Hex)
    const headers = {
      'Api-Key': apiKey,
      'Api-Timestamp': timestamp,
      'Api-Content-Hash': contentHash,
      'Api-Signature': signedMessage
    }
    let payload = {method,url,headers,params}
    let response = {}
    if (method==='POST'){
      payload = {method,headers}
      try{
        response = await this._client.post(uri,data,payload)
      }
      catch(error){
        throw new Error(error)
      }
      return response.data
    }
    else{
      try{
        response = await this._client.request(payload)
      }
      catch(error){
        throw new Error(error)
      }
    return response.data
    }
  }

  /**
   * @private
   * @method sanitize
   * @param {Object} requestBody
   * @returns {Object}
   */
  sanitize(requestBody = {}) {
    const obj = {}
    for (const key of Object.keys(requestBody)) {
      if (requestBody[key] === undefined) continue
      obj[key] = requestBody[key]
    }
    return obj
  }
}

module.exports = BittrexClient
