const Payment = require('globalpayments-api');
const formData = require('urlencoded-body-parser');
const { Address,
  BuilderError,
  HostedPaymentConfig,
  HostedService,
  ServicesConfig,
}  = Payment;
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

const config = new ServicesConfig();
config.merchantId = "quantatest";
config.accountId = "internet";
config.sharedSecret = "secret";
config.serviceUrl = "https://pay.sandbox.realexpayments.com/pay";
config.hostedPaymentConfig = new HostedPaymentConfig();
config.hostedPaymentConfig.language = "US";
config.hostedPaymentConfig.responseUrl = "http://requestb.in/10q2bjb1";

const service = new HostedService(config);

// const address = new Address();
// address.postalCode = "123|56";
// address.country = "IRELAND";

const showIndex = async (res) => {
  const html = await readFileAsync('index.html');
  res.end(html);
};
const showRxp = async (res) => {
  const html = await readFileAsync('rxp-js.js');
  res.end(html);
};

module.exports = async (req, res) => {
  switch (req.method) {
    case 'GET':
      if (req.url.indexOf('/get-json') === 0) {
        const json = service
          .charge(1)
          .withCurrency("USD")
          .serialize();

        console.log("data Json: ", json);
        res.end(json);
        return;
      }
      if (req.url.indexOf('/rxp-js.js') === 0) {
        await showRxp(res);
        return;
      }
      await showIndex(res);
      break;
    case 'POST':
      const data = await formData(req);
      console.log("data ++++++", data);
      await showIndex(res);
      break;
  }
};
