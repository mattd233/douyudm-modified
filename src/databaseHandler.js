//数据库
const { Pool } = require('pg')

const { giftData }  = require('../data/giftData')

const db = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mydb',
  password: 'password',
  port: 5432,
})

exports.db = db;