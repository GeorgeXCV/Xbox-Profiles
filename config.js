const config = {
    apiKeyOpenXBL: "YOUR_KEY_HERE", // https://xbl.io/ (Better API, higher rate limits)
    apiKeyXboxAPI: "YOUR_KEY_HERE" // https://xapi.us/ (Low rate limits, only use when have to)
}

const authHeaderOpenXBL = {'X-AUTH': config.apiKeyOpenXBL};
const authHeaderXboxAPI = {'X-AUTH': config.apiKeyXboxAPI};

module.exports = {authHeaderOpenXBL, authHeaderXboxAPI };