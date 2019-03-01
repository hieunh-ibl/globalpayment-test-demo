const payments = require('../utils/global-payments')
const renders = require('../utils/render')
const axios = require('axios')
const fs = require('fs')
const { promisify } = require('util')

const readFileAsync = promisify(fs.readFile)

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

module.exports = async function (req, res) {
  switch (req.method) {
    case 'GET':
      if (req.url.indexOf('/view/card') === 0) {
        await renders.renderCardPayment(res)
      } else if (req.url.indexOf('/view/android-pay') === 0) {
        await renders.renderAndroidPayment(res)
      } else if (req.url.indexOf('/view/paypal') === 0) {
        const service = payments.getHostedService(payments.getHostedPaymentConfig())
        // const paymentMethod = new PaymentMethod
        const json = service
          .charge(1)
          .withCurrency('EUR')
          .serialize()
        const url = await getPaypalURL(JSON.parse(json))
        renders.renderAllPayment(res, url)
      } else if (req.url.indexOf('/assets/rxp-js.js') === 0) {
        const file = await readFileAsync('assets/rxp-js.js')
        res.end(file)
      }
      break
  }
}
