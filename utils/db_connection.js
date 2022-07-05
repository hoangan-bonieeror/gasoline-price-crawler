const { Client } = require('pg')
require('dotenv').config()

const client = new Client({
    host: process.env.PGHOST,
    port: 5432,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database : process.env.PGDB
})

client.connect(err => {
    if (err) {
      console.error('Connection Error', err.stack)
    } else {
      console.log('Database Connected')
    }
})

module.exports = client;