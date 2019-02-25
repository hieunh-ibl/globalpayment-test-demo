const parseBase64 = jsonData => Object.keys(jsonData).reduce((all, key) => {
    try {
        const value = jsonData[key];
        if (!value) {
            return { ...all, [key]: value }
        }
        let buf = value;
        // console.log('value', value)
        if (typeof Buffer.from === 'function') {
            // Node 5.10+
            buf = Buffer.from(value, 'base64'); // Ta-da
        } else {
            // older Node versions, now deprecated
            buf = new Buffer(value, 'base64'); // Ta-da
        }
        return { ...all, [key]: buf.toString() }
    } catch (err) {
        console.log('err', err)
    }
}, { ...jsonData });

const parseBase64String = jsonDataString => JSON.stringify(parseBase64(JSON.parse(jsonDataString)));

module.exports = {
    parseBase64,
    parseBase64String
};