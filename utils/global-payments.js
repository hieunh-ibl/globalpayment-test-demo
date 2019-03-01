const {
  HppVersion,
  HostedPaymentConfig,
  HostedService,
  ServicesConfig,
  ServicesContainer
} = require('globalpayments-api')

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

function setServicesContainer (localConfig) {
  ServicesContainer.configure(localConfig)
}

function getHostedPaymentConfig (localConfig = config) {
  const hostedPaymentConfig = new HostedPaymentConfig()
  // hostedPaymentConfig.cardStorageEnabled = true
  // hostedPaymentConfig.language = 'US'
  // hostedPaymentConfig.displaySavedCards = true
  hostedPaymentConfig.paymentButtonText = 'Payment'
  hostedPaymentConfig.version = HppVersion.Version2
  localConfig.hostedPaymentConfig = hostedPaymentConfig
  return localConfig
}

function getHostedService (localConfig) {
  return new HostedService(localConfig || config)
}

module.exports = {
  config,
  responseConfig,
  getHostedService,
  setServicesContainer,
  getHostedPaymentConfig
}
