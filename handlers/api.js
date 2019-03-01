const {
  Address,
  CreditCardData,
  TransactionModifier } = require('globalpayments-api')
const crypto = require('../utils/crypto')
const payments = require('../utils/global-payments')
const base64 = require('../utils/base64')
const { json } = require('micro')
const request = require('request')

module.exports = async function (req, res) {
  switch (req.method) {
    case 'GET':
      if (req.url.indexOf('/api/authorize') === 0) {
        const service = payments.getHostedService()

        const json = service
          .authorize(1)
          .withCurrency('USD')
          .serialize()
        const response = base64.parseBase64(json)
        res.end(JSON.stringify(response))
      } else if (req.url.indexOf('/api/charge') === 0) {
        const service = payments.getHostedService(payments.getHostedPaymentConfig())

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
      } else if (req.url.indexOf('/api/apple-pay') === 0) {
        const uri = req.query.validationURL || 'https://apple-pay-gateway-cert.apple.com/paymentservices/startSession'
        const { cerificate, merchant } = crypto.getIdentifier()
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
      }
      break
    case 'POST':
      if (req.url.indexOf('/api/android-pay') === 0) {
        // obtain request data
        const data = await json(req)

        // create payment request with gateway
        payments.setServicesContainer.configure(payments.responseConfig)

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
  }
}
