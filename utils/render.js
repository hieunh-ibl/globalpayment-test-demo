const Handlebars = require('handlebars')
const fs = require('fs')
const { promisify } = require('util')

const readFileAsync = promisify(fs.readFile)

const renderCardPayment = async (res) => {
  const html = await readFileAsync('views/card.html', 'utf8')
  const template = Handlebars.compile(html)
  res.end(template({host: process.env.HOST}))
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

module.exports = {
  getFile,
  renderAllPayment,
  renderAndroidPayment,
  renderSuccess,
  renderCardPayment
}
