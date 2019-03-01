const x509 = require('x509')
const fs = require('fs')

let merchantIdentifier = null
let cerificate = null
function getIdentifier () {
  if (merchantIdentifier === null) {
    cerificate = fs.readFileSync(CERT_PATH, 'utf8')
    merchantIdentifier = extractMerchantID(cerificate)
  }
  return { merchant: merchantIdentifier, cerificate }
}

const CERT_PATH = './apple-pay-cert.pem'

function extractMerchantID (cert) {
  try {
    var info = x509.parseCert(cert)
    console.log(info)
    return info.extensions['1.2.840.113635.100.6.32'].substr(2)
  } catch (e) {
    console.error('Unable to extract merchant ID from certificate ' + CERT_PATH)
  }
}

module.exports = {
  getIdentifier
}
