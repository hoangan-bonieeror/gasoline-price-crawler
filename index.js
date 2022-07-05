const app = require('express')()

const port = process.env.PORT || 3000;
const client = require('./utils/db_connection')
const refreshFunc = require('./utils/refresh_data')

setInterval(() => refreshFunc(client), 10000)

app.get('/gasoline-price', async (req,res) => {
    const data = await client.query('SELECT * FROM gasoline_tbl')
    res.send(data)
})

app.listen(port, () => {
    console.log('Listening on port', port)
})