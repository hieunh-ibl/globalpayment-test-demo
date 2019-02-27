const formData = require('urlencoded-body-parser')
const { json } = require('micro')
const {
  Address,
  HppVersion,
  HostedPaymentConfig,
  HostedService,
  ServicesConfig,
  Transaction,
  ServicesContainer,
  CreditCardData,
  TransactionModifier
  // HostedPaymentData
} = require('globalpayments-api')
const fs = require('fs')
const { promisify } = require('util')
// const PouchDB = require('pouchdb')

// const db = new PouchDB('my_db')
const readFileAsync = promisify(fs.readFile)

const config = new ServicesConfig()
config.merchantId = 'Quantatest'
config.accountId = 'internet'
config.sharedSecret = 'secret'
config.refundPassword = 'refund'
config.serviceUrl = 'https://pay.sandbox.realexpayments.com/pay'

const responseConfig = new ServicesConfig()
responseConfig.merchantId = 'Quantatest'
responseConfig.accountId = 'internet'
responseConfig.sharedSecret = 'secret'
responseConfig.refundPassword = 'refund'
responseConfig.serviceUrl = 'https://api.sandbox.realexpayments.com/epage-remote.cgi'

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
const renderDigital = async (res) => {
  const html = await readFileAsync('digital.html')
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
      if (req.url.indexOf('/refund') === 0) {
        ServicesContainer.configure(responseConfig)
        const card = new CreditCardData()
        card.number = '4263970000005262'
        card.expMonth = '12'
        card.expYear = '2025'
        card.cardHolderName = 'James Mason'
        try {
          const response = await card
            .refund(1)
            .withCurrency('USD')
            .execute()
          console.log('responseCode', response.responseCode)
          console.log('responseMessage', response.responseMessage)
        } catch (err) {
          console.log('error', err)
        }
      } else if (req.url.indexOf('/get-hpp-authorize') === 0) {
        const service = new HostedService(config)

        const json = service
          .authorize(1)
          .withCurrency('USD')
          .serialize()
        const response = parseBase64(json)
        res.end(JSON.stringify(response))
      } else if (req.url.indexOf('/get-hpp-charge') === 0) {
        const hostedPaymentConfig = new HostedPaymentConfig()
        // hostedPaymentConfig.cardStorageEnabled = true
        // hostedPaymentConfig.language = 'US'
        // hostedPaymentConfig.displaySavedCards = true
        hostedPaymentConfig.paymentButtonText = 'Thanh Toán'
        hostedPaymentConfig.version = HppVersion.Version2
        config.hostedPaymentConfig = hostedPaymentConfig

        const service = new HostedService(config)

        // const hostedPaymentData = new HostedPaymentData()
        // hostedPaymentData.offerToSaveCard = true
        // hostedPaymentData.customerExists = true

        const json = service
          .charge(1)
          .withModifier(TransactionModifier.EncryptedMobile)
          .withCurrency('EUR')
          // .withHostedPaymentData(hostedPaymentData)
          .serialize()
        res.end(json)
      } else if (req.url.indexOf('/digital-wallet') === 0) {
        await renderDigital(res)
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
        console.log('data', parseBase64(data.hppResponse))
        const service = new HostedService(responseConfig)
        const transaction = service.parseResponse(data.hppResponse)
        console.log('transaction', transaction)
        const responseCode = transaction.responseCode
        const responseMessage = transaction.responseMessage
        console.log('responseCode', responseCode)
        console.log('responseMessage', responseMessage)
        await renderSuccess(res)
      } else if (req.url.indexOf('/digital-wallet') === 0) {
        // obtain request data
        const data = await json(req)

        // create payment request with gateway
        ServicesContainer.configure(responseConfig)

        const card = new CreditCardData()
        card.token = data.response.details.paymentMethodToken.token
        card.mobileType = data.mobileType

        const address = new Address()
        address.postalCode = data.response.details.cardInfo.billingAddress.postalCode

        try {
          const payment = await card.charge('20.00')
            .withCurrency('USD')
            .withAddress(address)
            .withModifier(TransactionModifier.EncryptedMobile)
            .execute()

          res.end(JSON.stringify({
            error: false,
            response: payment
          }))
        } catch (e) {
          console.log(e)
          res.end(JSON.stringify({
            error: true,
            exception: {
              code: e.code,
              message: e.message
            }
          }))
        }
      }
      break
  }
}
