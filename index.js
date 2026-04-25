const app = require('express')()

const port = process.env.PORT || 3000;
app.set('view engine', 'ejs');
// const client = require('./utils/db_connection')
// const refreshFunc = require('./utils/refresh_data')

const crawlUtil = require('./utils/crawl');

// setInterval(() => refreshFunc(client), 10000)

app.get('/', async (req,res) => {
    const data = await crawlUtil.adjustDataByLocale(req)

    const americaData = await crawlUtil.adjustDataByLocale(req, crawlUtil.crawlAmericanFuel, 'USD')
    console.log(data)
    res.render('main', {
        VIETNAM: data,
        AMERICA: americaData
    });
})

app.get('/api/gasoline-data', async (req,res) => {
    const data = await crawlUtil.adjustDataByLocale(req)
    return res.json(data)
})

app.listen(port, () => {
    console.log('Listening on port', port)
})