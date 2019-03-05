const viewHandlers = require('./handlers/views')
const apiHandlers = require('./handlers/api')
const processHandlers = require('./handlers/process')
const testHandlers = require('./handlers/test')

require('dotenv').config()

module.exports = async (req, res) => {
  await testHandlers(req, res)
  await viewHandlers(req, res)
  await apiHandlers(req, res)
  await processHandlers(req, res)
}
