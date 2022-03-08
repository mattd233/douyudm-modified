//数据库
const { Pool } = require('pg')

const db = new Pool({
  host: 'localhost',
  database: 'douyu',
  user: 'llm',
  password: 'ilovellm',
  port: 5432,
})

exports.db = db;