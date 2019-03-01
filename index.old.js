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
  TransactionModifier,
  // PaymentMethod,
  PaymentMethodType
} = require('globalpayments-api')
const axios = require('axios')
const fs = require('fs')
const { promisify } = require('util')
const Handlebars = require('handlebars')
const request = require('request')
const x509 = require('x509')
const PouchDB = require('pouchdb')
const db = new PouchDB('my_db')

const readFileAsync = promisify(fs.readFile)

const CERT_PATH = './apple-pay-cert.pem'

function extractMerchantID (cert) {
  try {
    var info = x509.parseCert(cert)
    console.log(info)
    return info.extensions['1.2.840.113635.100.6.32'].substr(2)
  } catch (e) {
    console.error('Unable to extract merchant ID from certificate ' + CERT_PATH)
  }
}

let merchantIdentifier = null
let cerificate = null
function getIdentifier () {
  if (merchantIdentifier === null) {
    cerificate = fs.readFileSync(CERT_PATH, 'utf8')
    merchantIdentifier = extractMerchantID(cerificate)
  }
  return { merchant: merchantIdentifier, cerificate }
}

const config = new ServicesConfig()
config.merchantId = 'Quantatest'
config.accountId = 'internet'
config.sharedSecret = 'secret'
// config.refundPassword = 'refund'
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

const renderCardPayment = async (res) => {
  const html = await readFileAsync('views/card.html', 'utf8')
  const template = Handlebars.compile(html)
  res.end(template({}))
}
const renderSuccess = async (res, result) => {
  const html = await readFileAsync('views/success.html', 'utf8')
  const template = Handlebars.compile(html)
  res.end(template({ result }))
}
const renderAndroidPayment = async (res) => {
  const html = await readFileAsync('views/android-pay.html', 'utf8')
  const template = Handlebars.compile(html)
  res.end(template({}))
}
const renderAllPayment = async (res, url) => {
  try {
    const html = await readFileAsync('views/all.html', 'utf8')
    const template = Handlebars.compile(html)
    res.end(template({ url }))
  } catch (err) {
    res.end(err.message)
  }
}
const getFile = async (res, url = 'assets/rxp-js.js') => {
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
        buf = Buffer.from(value, 'base64')
      } else {
        // older Node versions, now deprecated
        buf = new Buffer(value, 'base64')
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
          const cardResult = {
            number: '4263970000005262',
            expMonth: '12',
            expYear: '2025',
            cardHolderName: 'James Mason',
            resultCode: response.responseCode,
            responseMessage: response.responseMessage
          }
          db.put(cardResult)
          console.log('responseCode', response.responseCode)
          console.log('responseMessage', response.responseMessage)
          await renderSuccess(res, JSON.stringify(cardResult))
        } catch (err) {
          console.log('error', err)
        }
      } else if (req.url.indexOf('/api/authorize') === 0) {
        const service = new HostedService(config)

        const json = service
          .authorize(1)
          .withCurrency('USD')
          .serialize()
        const response = parseBase64(json)
        res.end(JSON.stringify(response))
      } else if (req.url.indexOf('/api/charge') === 0) {
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
      } else if (req.url.indexOf('/paypal') === 0) {
        const hostedPaymentConfig = new HostedPaymentConfig()
        hostedPaymentConfig.version = HppVersion.Version2
        config.hostedPaymentConfig = hostedPaymentConfig

        const service = new HostedService(config)
        // const paymentMethod = new PaymentMethod
        const json = service
          .charge(1)
          .withCurrency('EUR')
          .withPaymentMethod(PaymentMethodType.Reference)
          .serialize()
        const url = await getPaypalURL(JSON.parse(json))
        renderAllPayment(res, url)
      } else if (req.url.indexOf('/merchant/new') === 0) {
        const uri = req.query.validationURL || 'https://apple-pay-gateway-cert.apple.com/paymentservices/startSession'
        const { cerificate, merchant } = getIdentifier()
        const options = {
          uri: uri,
          json: {
            merchantIdentifier: merchant,
            domainName: process.env.APPLE_PAY_DOMAIN,
            displayName: process.env.APPLE_PAY_DISPLAY_NAME
          },

          agentOptions: {
            cert: cerificate,
            key: cerificate
          }
        }
        request.post(options, function (error, response, body) {
          if (error) {
            console.log('error', error)
          }
          if (body) {
            // Apple returns a payload with `displayName`, but passing this
            // to `completeMerchantValidation` causes it to error.
            delete body.displayName
          }
          res.send(body)
        })
      } else if (req.url.indexOf('/android-pay') === 0) {
        await renderAndroidPayment(res)
      } else if (req.url.indexOf('/rxp-js.js') === 0) {
        await getFile(res, 'assets/rxp-js.js')
      } else if (req.url.indexOf('/card') === 0) {
        await renderCardPayment(res)
      }
      break
    case 'POST':
      if (req.url.indexOf('/response/authorize') === 0) {
        const data = await formData(req)
        const json = parseBase64(data.hppResponse)
        ServicesContainer.configure(responseConfig)
        const transaction = Transaction.fromId(json.PASREF, json.ORDER_ID)
        try {
          const response = await transaction
            .capture(1)
            .execute()
          console.log('response', response)
          await renderSuccess(res, response.responseMessage)
        } catch (e) {
          // TODO: Add your error handling here
          console.log('error', e)
          await renderSuccess(res, e.message)
        }
      } else if (req.url.indexOf('/response/charge') === 0) {
        const data = await formData(req)
        const service = new HostedService(responseConfig)
        const transaction = service.parseResponse(data.hppResponse)
        const responseCode = transaction.responseCode
        const responseMessage = transaction.responseMessage
        console.log('responseCode', responseCode)
        console.log('responseMessage', responseMessage)
        await renderSuccess(res, responseMessage)
      } else if (req.url.indexOf('/api/android-pay') === 0) {
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

async function getPaypalURL (data) {
  try {
    const result = await axios.post('https://pay.sandbox.realexpayments.com/pay', {
      ...data,
      SHIPPING_ADDRESS_ENABLE: 1,
      ADDRESS_OVERRIDE: 1,
      HPP_NAME: 'James Mason',
      HPP_STREET: 'Flat 123',
      HPP_STREET2: 'House 456',
      HPP_CITY: 'Chicago',
      HPP_STATE: 'IL',
      HPP_ZIP: '50001',
      HPP_COUNTRY: 'IM',
      HPP_PHONE: '015552390'
      // PM_METHODS: 'paypal'
    })
    console.log('result', result.data)
    return result.data.hppPayByLink
  } catch (err) {
    console.log('err', err)
  }
}
