const formData = require('urlencoded-body-parser')
const {
  HostedPaymentConfig,
  HostedService,
  ServicesConfig,
  Transaction,
  ServicesContainer
} = require('globalpayments-api')
const fs = require('fs')
const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)

const config = new ServicesConfig()
config.merchantId = 'quantatest'
config.accountId = 'internet'
config.sharedSecret = 'secret'
config.serviceUrl = 'https://pay.sandbox.realexpayments.com/pay'

const responseConfig = new ServicesConfig()
responseConfig.merchantId = 'quantatest'
responseConfig.accountId = 'internet'
responseConfig.sharedSecret = 'secret'
responseConfig.serviceUrl = 'https://api.sandbox.realexpayments.com/epage-remote.cgi'

config.hostedPaymentConfig = new HostedPaymentConfig()
config.hostedPaymentConfig.language = 'US'
config.hostedPaymentConfig.responseUrl = 'http://requestb.in/10q2bjb1'

// const address = new Address()
// address.postalCode = '123|56'
// address.country = 'IRELAND'

const renderIndex = async (res) => {
  const html = await readFileAsync('index.html')
  res.end(html)
}
const renderSuccess = async (res) => {
  const html = await readFileAsync('success.html')
  res.end(html)
}
const getFile = async (res, url = 'rxp-js.js') => {
  const file = await readFileAsync(url)
  res.end(file)
}

function parseBase64 (jsonString) {
  const jsonData = JSON.parse(jsonString)
  const response = Object.keys(jsonData).reduce((all, key) => {
    try {
      const value = jsonData[key]
      if (!value) {
        return { ...all, [key]: value }
      }
      let buf = value
      if (typeof Buffer.from === 'function') {
        // Node 5.10+
        buf = Buffer.from(value, 'base64') // Ta-da
      } else {
        // older Node versions, now deprecated
        buf = new Buffer(value, 'base64') // Ta-da
      }
      return { ...all, [key]: buf.toString() }
    } catch (err) {
      console.log('err', err)
    }
  }, { ...jsonData })
  return response
}

module.exports = async (req, res) => {
  switch (req.method) {
    case 'GET':
      if (req.url.indexOf('/get-hpp-authorize') === 0) {
        const service = new HostedService(config)
        const json = service
          .authorize(1)
          .withCurrency('USD')
          .serialize()
        const response = parseBase64(json)
        res.end(JSON.stringify(response))
      } else if (req.url.indexOf('/get-hpp-charge') === 0) {
        const service = new HostedService(config)
        const json = service
          .charge(1)
          .withCurrency('USD')
          .serialize()
        const response = parseBase64(json)
        res.end(JSON.stringify(response))
      } else if (req.url.indexOf('/rxp-js.js') === 0) {
        await getFile(res, 'rxp-js.js')
      } else {
        await renderIndex(res)
      }
      break
    case 'POST':
      if (req.url.indexOf('/authorize-case') === 0) {
        const data = await formData(req)
        const json = parseBase64(data.hppResponse)
        ServicesContainer.configure(responseConfig)
        const transaction = Transaction.fromId(json.PASREF, json.ORDER_ID)
        try {
          const response = await transaction
            .capture(1)
            .execute()
          console.log('response', response)
        } catch (e) {
          // TODO: Add your error handling here
          console.log('error', e)
        }
        await renderSuccess(res)
      } else if (req.url.indexOf('/charge-case') === 0) {
        const data = await formData(req)
        const service = new HostedService(responseConfig)
        const transaction = service.parseResponse(data.hppResponse)
        const responseCode = transaction.responseCode
        const responseMessage = transaction.responseMessage
        console.log('responseCode', responseCode)
        console.log('responseMessage', responseMessage)
        await renderSuccess(res)
      }
      break
  }
}
