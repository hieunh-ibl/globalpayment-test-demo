const { CreditCardData } = require('globalpayments-api')
const renders = require('../utils/render')
const payments = require('../utils/global-payments')
const {Builder, By, Key, until} = require('selenium-webdriver')

module.exports = async function (req, res) {
  switch (req.method) {
    case 'GET':
      if (req.url.indexOf('/test/refund') === 0) {
        payments.setServicesContainer(payments.responseConfig)
        const card = new CreditCardData()
        card.number = '4263970000005262'
        card.expMonth = '12'
        card.expYear = '2025'
        card.cardHolderName = 'James Mason'
        try {
          const requests = []
          let count = 0
          let done = 0
          let fail = 0
          console.log('preparing')
          while (count < 6000) {
            const startItem = new Date().getTime()
            const item = {
              index: count,
              start: startItem,
              request: card
                .refund(1)
                .withCurrency('USD')
                .execute()
                .then((data) => {
                  const endItem = new Date().getTime()
                  item.end = endItem
                  item.done = true
                  if (data.responseCode === '00') {
                    done++
                    item.done = true
                  } else {
                    fail++
                    item.done = false
                  }
                  return item
                }).catch((data) => {
                  const endItem = new Date().getTime()
                  item.end = endItem
                  item.done = false
                  fail++
                  item.error = data.message
                  return item
                })
            }
            requests.push(item)
            count++
          }
          const start = new Date().getTime()
          console.log('start', start)
          await Promise.all(requests.map(item => item.request))
          const endRequest = new Date().getTime()
          console.log('result', {
            fetchTime: +endRequest - +start,
            done,
            fail
          })
          await renders.renderSuccess(res, JSON.stringify({
            fetchTime: +endRequest - +start,
            done,
            fail
          }))
        } catch (err) {
          console.log('error', err)
        }
      } else if (req.url.indexOf('/test/form') === 0) {
        (async function test () {
          let driver = await new Builder().forBrowser('firefox').build()
          let count = 0
          while (count < 100) {
            try {
              await driver.get('http://localhost:3000/view/card')
              await driver.sleep(100)
              await driver.switchTo().frame(0)
              await driver.sleep(2100)
              const tag = await driver.findElement(By.id('rxp-footer')).getText()
              // await driver.wait(until.titleIs('webdriver - Google Search'), 1000)
              console.log('tag', tag)
            } finally {
              count++
            }
          }
          await driver.quit()
        })()
      }
  }
}
