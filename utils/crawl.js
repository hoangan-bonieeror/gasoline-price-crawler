const cheerio = require('cheerio')
const axios = require('axios')
const currencyUtil = require('./currency')
const properties = [
    'item',
    'price',
    'deviant'
]

const crawl = async (url) => {
    try {
        const { data } = await axios.get(url)
        const $ = cheerio.load(data)
        
        const outputGasoline = []

        $('#admwrapper > main > div.main-content > div.content-left > section > div > div:nth-child(1) > div.content-tk > table > tbody > tr').each((index,row) => {
            let gasolineObj = {}
            let keyIdx = 0
            $("td:not(:first-child)", $(row)).each((indexChild,column) => {
                if($(column).text()) {
                    const columnValue = $(column).text()
                    switch(keyIdx) {
                        case 0: // Title
                            gasolineObj[properties[keyIdx]] = columnValue
                            break
                        case 1: // Price
                        case 2: // Deviant
                            const valueNum = columnValue.split(' ').join('')
                            if(columnValue.includes('.')) {
                                gasolineObj[properties[keyIdx]] = valueNum
                                        .split('.')
                                        .map((num, index) => {
                                            num = parseInt(num)
                                            if(index == 0) {
                                                num *= 1000
                                            }
                                            return num
                                        })
                                        .reduce((thousandUnit, hundredUnit) => thousandUnit + hundredUnit)
                            } else {
                                gasolineObj[properties[keyIdx]] = parseInt(valueNum)
                            }
                            break
                    }
                    keyIdx ++
                }
            })
            outputGasoline.push(gasolineObj)
        })

        return outputGasoline;
    } catch (error) {
        // console.log(error)
        throw new Error(error.stack)
    }
}

const adjustDataByLocale = async (req) => {
    const data = await crawl('https://luatvietnam.vn/bang-gia-xang-dau-hom-nay.html')
    const locale = req.headers['accept-language']?.split(',')[0] || 'en-US';
    const targetCurrency = currencyUtil.getCurrencyFromLocale(locale);

    const rates = await currencyUtil.getRates('VND'); // base = VND
    const convertedData = data.map(item => ({
        ...item,
        price: currencyUtil.convertCurrency(item.price, 'VND', targetCurrency, rates),
        deviant: currencyUtil.convertCurrency(item.deviant, 'VND', targetCurrency, rates),
        targetCurrency
    }));

    return {
        data: convertedData,
        locale,
        currency: targetCurrency
    }
}

module.exports = {
    crawl,
    adjustDataByLocale
}