function parseBase64 (jsonString) {
  const jsonData = JSON.parse(jsonString)
  const response = Object.keys(jsonData).reduce((all, key) => {
    try {
      const value = jsonData[key]
      if (!value) {
        return { ...all, [key]: value }
      }
      let buf = value
      if (typeof Buffer.from === 'function') {
        // Node 5.10+
        buf = Buffer.from(value, 'base64')
      } else {
        // older Node versions, now deprecated
        buf = new Buffer(value, 'base64')
      }
      return { ...all, [key]: buf.toString() }
    } catch (err) {
      console.log('err', err)
    }
  }, { ...jsonData })
  return response
}

module.exports = {
  parseBase64
}
