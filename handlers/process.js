const { Transaction, CreditCardData } = require('globalpayments-api')
const base64 = require('../utils/base64')
const renders = require('../utils/render')
const payments = require('../utils/global-payments')
const formData = require('urlencoded-body-parser')

module.exports = async function (req, res) {
  switch (req.method) {
    case 'GET':
      if (req.url.indexOf('/process/refund') === 0) {
        payments.setServicesContainer(payments.responseConfig)
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
          console.log('responseCode', response.responseCode)
          console.log('responseMessage', response.responseMessage)
          await renders.renderSuccess(res, JSON.stringify(cardResult))
        } catch (err) {
          console.log('error', err)
        }
      }
      break
    case 'POST':
      if (req.url.indexOf('/process/authorize') === 0) {
        const data = await formData(req)
        const json = base64.parseBase64(data.hppResponse)
        payments.setServicesContainer(payments.responseConfig)
        const transaction = Transaction.fromId(json.PASREF, json.ORDER_ID)
        try {
          const response = await transaction
            .capture(1)
            .execute()
          console.log('response', response)
          await renders.renderSuccess(res, response.responseMessage)
        } catch (e) {
          // TODO: Add your error handling here
          console.log('error', e)
          await renders.renderSuccess(res, e.message)
        }
      } else if (req.url.indexOf('/process/charge') === 0) {
        const data = await formData(req)
        const service = payments.getHostedService(payments.responseConfig)
        const transaction = service.parseResponse(data.hppResponse)
        const responseCode = transaction.responseCode
        const responseMessage = transaction.responseMessage
        console.log('responseCode', responseCode)
        console.log('responseMessage', responseMessage)
        await renders.renderSuccess(res, responseMessage)
      }
      break
  }
}
