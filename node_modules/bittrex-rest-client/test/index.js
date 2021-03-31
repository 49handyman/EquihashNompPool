const should = require('should')
const { BittrexClient } = require('../')
require('dotenv').config()

const client = new BittrexClient({
  apiKey: process.env.KEY,
  apiSecret: process.env.SECRET,
  timeout: 3000})

describe('bittrex-node', () => {
  describe('non-authenticated API calls', () => {
    it('should get markets', async () => {
      let results = await client.markets()
      should.exist(results)
      results.length.should.be.above(0)
    })

    it('should get currencies', async () => {
      let results = await client.currencies()
      should.exist(results)
      results.length.should.be.above(0)
    })

    it('should get ticker', async () => {
      let ticker = await client.ticker('BTC-USD')
      ticker.symbol.should.equal('BTC-USD')
      ticker.lastTradeRate.should.be.above(0)
      ticker.bidRate.should.be.above(0)
      ticker.askRate.should.be.above(0)
    })

    it('should get market summaries', async () => {
      let results = await client.marketSummaries()
      should.exist(results)
      results.length.should.be.above(0)
    })

    it('should get market summary', async () => {
      let results = await client.marketSummary('BTC-USD')
      should.exist(results)
      results.symbol.should.equal('BTC-USD')
      results.high.should.be.above(0)
    })

    it('should get recent market trades', async () => {
      let results = await client.marketTrades('BTC-USD')
      should.exist(results)
      results.length.should.be.above(0)
      results[0].rate.should.be.above(0)
    })

    it('should get order book', async () => {
      let results = await client.orderBook('BTC-USD')
      should.exist(results)
      results.bid.length.should.be.equal(25)
      results.ask.length.should.be.equal(25)
    })

    it('should get recent candles', async () => {
      let results = await client.getCandlesRecent('BTC-USD','MINUTE_5')
      should.exist(results)
      results.length.should.be.above(0)
      results[0].quoteVolume.length.should.be.above(0)
    })

    it('should get historical candles', async () => {
      let date = new Date()
      let results = await client.getCandlesHistorical('BTC-USD','MINUTE_5',date.getFullYear()-1,date.getMonth(),date.getDay())
      should.exist(results)
      results.length.should.be.above(0)
      results[0].quoteVolume.length.should.be.above(0)
    })
  })

  describe('authenticated trading API calls', () => {


    it('should get order history', async () => {
      let results = await client.getOrderHistory()
      should.exist(results)
      results.length.should.be.above(0)
    })

    it('should get open orders', async () => {
      let results = await client.getOpenOrders()
      should.exist(results)
      results.length.should.be.aboveOrEqual(0)
    })

    it('should attempt a buy limit order', async () => {
      let result = await client.sendOrder('BTC-USD', 'BUY', 'LIMIT', { quantity:1, limit:1.00 })
        should.exist(result)
        result.status.should.be.equal('CLOSED')
    })

    it('should cancel an order', async () => {
      let cancel = await client.cancelOrder()
      should.exist(cancel)
    })

    it('should attempt a sell market order', async () => {
      try {let result = await client.sendOrder('BTC-USD', 'SELL', 'MARKET', { quantity:0.0000001 })
      should.not.exist(result)
    }catch(err){
      err.response.data.code.should.equal('MIN_TRADE_REQUIREMENT_NOT_MET')
    }
    })
  })

  describe('authenticated account API calls', () => {
    it('should get balances', async () => {
      let results = await client.balance('')
      should.exist(results)
      results.length.should.be.aboveOrEqual(0)
      let Balance = await client.balance('BTC')
      should.exist(Balance)
      Balance.total.should.be.aboveOrEqual(0)
    })


    it('should get deposit addresses', async () => {
      let allAddresses = await client.getAddresses()
      allAddresses.length.should.be.aboveOrEqual(0)
    })

    it('should create a deposit address', async () => {
      let Address = await client.getAddresses('BTC')
      should.exist(Address)
    })

    it('should get order history', async () => {
      let results = await client.getOrderHistory('BTC-USD')
      should.exist(results)
      results.length.should.be.aboveOrEqual(0)
    })

    it('should get withdrawl history', async () => {
      let results = await client.withdrawalHistory()
      should.exist(results)
      results.length.should.be.aboveOrEqual(0)
    })

    it('should get deposit history', async () => {
      let results = await client.depositHistory('BTC')
      should.exist(results)
      results.length.should.be.aboveOrEqual(0)
    })
    it('should request a withdrawal', async () => {
      try{
        let withdrawal = await client.requestWithdrawal('BTC', 50.0, '36EEHh9ME3kU7AZ3rUxBCyKR5FhR3RbqVo')
        should.not.exist(withdrawal)
      }
      catch(err){
        err.message.should.be.equal('Request failed with status code 409')
      }
    })
  })
})
