//数据库
const { Pool } = require('pg')

const db = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'llm',
  password: 'ilovellm',
  port: 5432,
})

exports.db = db;