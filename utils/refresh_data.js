const crawl = require('./crawl')

const refresh = async (client) => {
    try {
        const data = await crawl('https://pvoil.com.vn/truyen-thong/tin-gia-xang-dau')
        let insertString = 'INSERT INTO gasoline_tbl(item, price, deviant) VALUES '
        let insertItemArr = []

        const responseFromDB = await client.query('SELECT item FROM gasoline_tbl;')
        const listData = responseFromDB.rows

        for(let row of data) {
            const { item, price, deviant } = row;
            
            (listData.filter(one => {
                return one.item === item
            }).length === 0) && insertItemArr.push([`('${item}', ${price}, ${deviant})`])
        }

        if(insertItemArr.length !== 0) {
            insertString += insertItemArr.join(',')
            await client.query(insertString)
        }
    
    } catch (error) {
        throw new Error(error.stack)
    }
}

module.exports = refresh;