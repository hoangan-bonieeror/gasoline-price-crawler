const cheerio = require('cheerio')
const axios = require('axios')
const currencyUtil = require('./currency')

const puppeteer = require('puppeteer');

const properties = [
    'item',
    'price',
    'deviant'
]
const americaProperties = [
    'state',
    'price',
    'weeklyChange',
    'monthlyChange'
]

const crawl = async () => {
    try {
        const { data } = await axios.get('https://luatvietnam.vn/bang-gia-xang-dau-hom-nay.html')
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

const crawlAmericanFuel = async () => {
    try {
        const { data } = await axios.get('https://www.gaspriceslive.com/')
        const $ = cheerio.load(data)

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.goto('https://www.gaspriceslive.com/', {
            waitUntil: 'networkidle2'
        });

        const americaProperties = [
            'state',
            'price',
            'weeklyChange',
            'monthlyChange'
        ];

        const outputGasoline = await page.$$eval(
            '#stateGrid > a.state-link',
            (cards, americaProperties) => {
            return cards.map(card => {
                const gasolineObj = {};

                // State
                const stateEl = card.querySelector(
                'article.state-card .state-head .state-name'
                );
                if (stateEl) {
                    gasolineObj[americaProperties[0]] = stateEl.innerText.trim();
                }

                // Price
                const priceEl = card.querySelector(
                'article.state-card .state-body .today-line .today-price'
                );
                if (priceEl) {
                    let [_, value] = priceEl.innerText.trim().split('$')

                    gasolineObj[americaProperties[1]] = parseFloat(value);
                }

                // Weekly + Monthly change
                const deltaEls = card.querySelectorAll(
                'article.state-card .state-body .delta-row .delta-box .delta-value'
                );

                if (deltaEls[0]) {
                    gasolineObj[americaProperties[2]] =
                        deltaEls[0].innerText.trim().split('$').join('');
                }

                if (deltaEls[1]) {
                    gasolineObj[americaProperties[3]] =
                        deltaEls[1].innerText.trim().split('$').join('');
                }

                return gasolineObj;
            });
            },
            americaProperties // passed into browser context
        );

        await browser.close();
        return outputGasoline;
    } catch (error) {
        // console.log(error)
        throw new Error(error.stack)
    }
}

const adjustDataByLocale = async (req, crawlFunc = crawl, baseCurrency = 'VND') => {
    const data = await crawlFunc()
    const locale = req.headers['accept-language']?.split(',')[0] || 'en-US';
    const targetCurrency = currencyUtil.getCurrencyFromLocale(locale);

    const rates = await currencyUtil.getRates(baseCurrency);
    const convertedData = data.map(item => ({
        ...item,
        price: currencyUtil.convertCurrency(item.price, baseCurrency, targetCurrency, rates),
        deviant: 'deviant' in item ? currencyUtil.convertCurrency(item.deviant, baseCurrency, targetCurrency, rates) : null,
        weeklyChange: 'weeklyChange' in item ? currencyUtil.convertCurrency(item.weeklyChange, baseCurrency, targetCurrency, rates) : null,
        monthlyChange: 'monthlyChange' in item ? currencyUtil.convertCurrency(item.monthlyChange, baseCurrency, targetCurrency, rates) : null,
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
    adjustDataByLocale,
    crawlAmericanFuel
}