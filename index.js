const app = require('express')()

const port = process.env.PORT || 3000;
const crawl = require('./utils/crawl')

app.get('/gasoline-price', async (req,res) => {
    const data = await crawl('https://pvoil.com.vn/truyen-thong/tin-gia-xang-dau')
    console.log(req.headers)
    res.send(data)
})

app.listen(port, () => {
    console.log('Listening on port', port)
})