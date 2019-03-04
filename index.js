const view = require('./handlers/views')
const api = require('./handlers/api')
const process = require('./handlers/process')

module.exports = async (req, res) => {
  await view(req, res)
  await api(req, res)
  await process(req, res)
}
