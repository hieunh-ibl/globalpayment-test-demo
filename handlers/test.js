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
          while (count < 8000) {
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
          res.end(JSON.stringify({
            fetchTime: +endRequest - +start,
            done,
            fail
          }))
        } catch (err) {
          console.log('error', err)
        }
      } else if (req.url.indexOf('/test/repeat') === 0) {
        const NUMBER_PER_REQUEST = 3000
        payments.setServicesContainer(payments.responseConfig)
        const card = new CreditCardData()
        card.number = '4263970000005262'
        card.expMonth = '12'
        card.expYear = '2025'
        card.cardHolderName = 'James Mason'
        try {
          const requests = [
            { list: [], done: 0, fail: 0 },
            { list: [], done: 0, fail: 0 },
            { list: [], done: 0, fail: 0 },
            { list: [], done: 0, fail: 0 },
            { list: [], done: 0, fail: 0 },
            { list: [], done: 0, fail: 0 }
          ]
          let count = 0
          let done = 0
          let fail = 0
          console.log('preparing')
          console.log('requests', requests)
          while (count < NUMBER_PER_REQUEST * 6) {
            const startItem = new Date().getTime()
            let listIndex = 0
            if (count < NUMBER_PER_REQUEST) {
              listIndex = 0
            } else if (count < NUMBER_PER_REQUEST * 2 && count >= NUMBER_PER_REQUEST) {
              listIndex = 1
            } else if (count < NUMBER_PER_REQUEST * 3 && count >= NUMBER_PER_REQUEST * 2) {
              listIndex = 2
            } else if (count < NUMBER_PER_REQUEST * 4 && count >= NUMBER_PER_REQUEST * 3) {
              listIndex = 3
            } else if (count < NUMBER_PER_REQUEST * 5 && count >= NUMBER_PER_REQUEST * 4) {
              listIndex = 4
            } else if (count < NUMBER_PER_REQUEST * 6 && count >= NUMBER_PER_REQUEST * 5) {
              listIndex = 5
            }
            const item = {
              index: count,
              start: startItem,
              request: () => (card
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
                    requests[listIndex].done++
                  } else {
                    fail++
                    item.done = false
                    requests[listIndex].fail++
                  }
                  return item
                }).catch((data) => {
                  const endItem = new Date().getTime()
                  item.end = endItem
                  item.done = false
                  fail++
                  item.error = data.message
                  requests[listIndex].fail++
                  return item
                })
              )
            }
            requests[listIndex].list.push(item)
            count++
          }
          console.log('requests')
          const start = new Date().getTime()
          console.log('start', start)
          new Promise((resolve, reject) => {
            let requestCount = 0
            requests.forEach((requestList, index) => {
              setTimeout(() => {
                Promise
                  .all(requestList.list.map(item => item.request()))
                  .then(() => {
                    requestCount++
                    if (requestCount >= 6) {
                      resolve(true)
                    }
                  })
                  .catch(() => {
                    requestCount++
                    if (requestCount >= 6) {
                      resolve(true)
                    }
                  })
              }, index * 15000)
            })
          }).then(() => {
            const endRequest = new Date().getTime()
            console.log('result', {
              fetchTime: +endRequest - +start,
              requests: requests.map((item) => ({ done: item.done, fail: item.fail })),
              done,
              fail
            })
            res.end(JSON.stringify({
              fetchTime: +endRequest - +start,
              done,
              fail
            }))
          })
        } catch (err) {
          console.log('error', err)
        }
      } else if (req.url.indexOf('/test/form') === 0) {
        (async function test () {
          let driver = await new Builder().forBrowser('firefox').build()
          let count = 0
          let done = 0
          let fail = 0
          const start = new Date().getTime()
          while (count < 100) {
            try {
              await driver.get(`${process.env.HOST}/view/card`)
              await driver.sleep(100)
              await driver.switchTo().frame(0)
              await driver.sleep(2900)
              const tag = await driver.findElement(By.id('rxp-footer')).getText()
              // await driver.wait(until.titleIs('webdriver - Google Search'), 1000)
              if (tag) {
                done++
              } else {
                fail++
              }
            } finally {
              count++
            }
          }
          const endRequest = new Date().getTime()
          await renders.renderSuccess(res, JSON.stringify({
            fetchTime: +endRequest - +start,
            done,
            fail
          }))
          await driver.quit()
        })()
      }
  }
}
