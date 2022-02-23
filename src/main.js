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

db.query('SELECT NOW()', (err) => {
    console.log(err ? err : "[db] 数据库连接成功")
})

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
        //只保留歌名
        const title = res.txt.replace('#点歌', '').trim();
        //点歌人nn，歌名，时间戳
        const diangeInsert = `INSERT INTO diange(nn, title) VALUES('${res.nn}', '${title}')`;
        db.query(diangeInsert, (err) => {
            console.log(err ? err.stack : ` --[${res.nn}] 点了 ${title}`);
        })
    }

    // superchat
    if (res.txt.startsWith('#sc')) {
        const text = res.txt.replace('#sc', '').trim();
        // if (text.length < 0) {
        //     return;
        // }
        const nickname = res.nn;
        const scQuery = `SELECT * FROM gift`;
        db.query(scQuery, (err, res) => {
            if (err) {
                console.log(err)
                return
            }
            // 遍历所有礼物， 标记超时的
            const gifts = res.rows;
            let toDelete = [];
            let currUser = [];
            let value = 0;
            for (let i = 0; i<gifts.length; i++) {
                const ts = new Date(gifts[i].ts).getTime();
                // elased time in minutes
                const elapsed =  (new Date().getTime() - ts) / 1000 / 60;
                if (elapsed > 5) {
                    // mark the item for deletion
                    toDelete.push(gifts[i].id);
                    continue;
                }
                else if (gifts[i].sn === nickname) {
                    // value += gift_value[gifts[i].gfid] * gifts[i].gc
                    currUser.push(gifts[i].id)
                }
                 
            }
            const scEnabled = false;
            const highlight = false;
            // 根据统计的value来执行
            // if (value >= 50) {
            //     highlight = true;
            //     scEnabled = true;
            // } else if (value >= 30) {
            //     scEnabled = true;
            // } else {
            //     console.log("Not enough value.")
            // }
            // if (scEnabled) {
            const scInsert = `INSERT INTO sc(highlight, nn ,txt) VALUES('${highlight}', '${nickname}', '${text}')`;
            db.query(scInsert, (err) => {
                console.log(err ? err.stack : ` --[${nickname}] 发了一条sc`);
            })
            // }

            // 删除用户使用掉的礼物
            if (scEnabled) {
                Array.prototype.push.apply(toDelete, currUser)
            }
            console.log(toDelete);
            if (toDelete.length > 0) {
                // 删除需要删除的value
                let scDelete = `DELETE FROM gift WHERE id IN (`;
                for (let i = 0; i<toDelete.length; i++) {
                    // last character
                    if (i === gifts.length - 1) {
                        scDelete += `${toDelete[i]})`;
                        break;
                    }
                    scDelete += `${toDelete[i]},`;
                }
                db.query(scDelete, (err) => {
                    if (err) {
                        console.log(err);
                    }
                })
            }
            
        })
    }
})

//记录礼物（忽略荧光棒，鱼丸和超大丸星）
const NO_VALUE = ['824', '20000', '20008']
room.on('spbc', function(res) {
    if (!NO_VALUE.includes(res.gfid)) {
        console.log(res);
        //送礼人nn，礼物id，礼物数量，时间戳
        const giftsInsert = `INSERT INTO gift(sn, gfid, gc) VALUES('${res.sn}', '${res.gfid}', '${res.gc}')`;
        db.query(giftsInsert, (err) => {
            console.log(err ? err.stack : ` --[${res.sn}] 赠送了 ${res.gn}x${res.gc}`);
        })
    }
    
})

room.on('loginres', function(res) {
    console.log('[loginres]', '登录成功')
})

// room.on('uenter', function(res) {
//     console.log('[uenter]', `${res.nn}进入房间`)
// })

//开始监听
room.run()