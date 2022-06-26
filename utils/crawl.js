const cheerio = require('cheerio')
const axios = require('axios')

const properties = [
    'item',
    'price',
    'deviant'
]

module.exports = async (url) => {
    try {
        const { data } = await axios.get(url)

        const $ = cheerio.load(data)
        
        const outputGasoline = []

        $('#cctb-1 > table > tbody > tr').each((index,row) => {
            let gasolineObj = {}
            let keyIdx = 0
            $("td:not(:first-child)", $(row)).each((indexChild,column) => {
                if($(column).text()) {
                    keyIdx == 0 
                    ? gasolineObj[properties[keyIdx]] = $(column).text()
                    : gasolineObj[properties[keyIdx]] = 
                        $(column).text().length >= 4
                            ? $(column).text()
                                .split('.')
                                .map((num, index) => {
                                num = parseInt(num)
                                if(index == 0) {
                                    num *= 1000
                                }
                                return num
                                })
                                .reduce((thousandUnit, hundredUnit) => thousandUnit + hundredUnit)
                            : parseInt($(column).text())
                    keyIdx ++
                }
            })
            gasolineObj['currencyUnit'] = 'VNĐ'
            outputGasoline.push(gasolineObj)
        })

        return outputGasoline;
    } catch (error) {
        throw new Error(error.stack)
    }
}