//引入类库
const { client }  = require('douyudm')

//数据库
const { Pool } = require('pg')

const db = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mydb',
  password: 'password',
  port: 5432,
})

db.connect()

//设置房间号，初始化
const roomId = 3187637; // llm
const opts = {
    debug: true,  // 默认关闭 false
    ignore: ['mrkl'],
}
const room = new client(roomId, opts)

//系统事件
room.on('connect', function () {
    console.log('[connect] roomId=%s', this.roomId)
})
room.on('disconnect', function () {
    console.log('[disconnect] roomId=%s', this.roomId)
})
room.on('error', function(err) {
    console.log('[error] roomId=%s', this.roomId)
})

//消息事件
room.on('chatmsg', function(res) {
    // console.log('[chatmsg]', `<lv ${res.level}> [${res.nn}] ${res.txt}`)
    // 钻粉点歌
    if (res.diaf === '1' && res.txt.startsWith('#点歌')) {
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        //只保留歌名
        const title = res.txt.replace('#点歌', '').trim();
        const diangeInsert = `INSERT INTO diange (bl, nn, title, ts) VALUES('${res.bl}', '${res.nn}', '${title}', '${timestamp}')`
        db.query(diangeInsert, (err, res) => {
            console.log(err ? err.stack : ` --${title}已录入`);
        })
    }
})

room.on('spbc', function(res) {
    console.log(res);
})

room.on('loginres', function(res) {
    console.log('[loginres]', '登录成功')
})
room.on('uenter', function(res) {
    console.log('[uenter]', `${res.nn}进入房间`)
})

//开始监听
room.run()