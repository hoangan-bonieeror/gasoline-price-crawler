const axios = require('axios');

const getRates = async (base = 'VND') => {
  const res = await axios.get(`https://open.er-api.com/v6/latest/${base}`);
  return res.data.rates;
}

const convertCurrency = (amount, from, to, rates) => {
  if (from === to) return amount;

  const rate = rates[to];
  if (!rate) throw new Error(`Missing rate for ${to}`);

  return amount * rate;
}

const getCurrencyFromLocale = (locale) => {
  const region = locale.split('-')[1]; // "US", "VN", "DE"

  const regionToCurrency = {
    US: 'USD',
    VN: 'VND',
    JP: 'JPY',
    GB: 'GBP',
    DE: 'EUR',
    FR: 'EUR'
  };

  return regionToCurrency[region] || 'USD';
}

module.exports = {
    getRates,
    convertCurrency,
    getCurrencyFromLocale
}
