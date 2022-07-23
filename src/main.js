// 监听库
const { client } = require("douyudm");
// 数据库
const { db } = require("../src/databaseHandler");
// 礼物数据
const { getGiftData } = require("../src/getGiftData");

// 清理前一个月的gift
function clearExpiredGift() {
  const clearQuery = `DELETE FROM gift 
    WHERE date_trunc('month', ts) = date_trunc('month', current_date - interval '1 month')`;
  db.query(clearQuery, (err) => {
    console.log(err ? err.stack : "Clearing last month's gift data.");
  });
}

async function startListening() {
  // 设置房间号，初始化
  const roomId = 3484;
  const opts = {
    debug: false, // 默认关闭 false
    ignore: ["mrkl"],
  };
  const room = new client(roomId, opts);

  // 每天清理上个月的过期礼物
  setInterval(clearExpiredGift, 1000 * 3600 * 24);

  const giftData = await getGiftData(roomId);
  //   console.log(giftData);
  console.log('[fetch] 加载礼物数据成功');


  // 系统事件
  room.on("connect", function () {
    console.log("[connect] roomId=%s", this.roomId);
  });
  room.on("disconnect", function () {
    console.log("[disconnect] roomId=%s", this.roomId);
  });
  // reconnect after error
  room.on("error", function (err) {
    console.log("[error] roomId=%s", this.roomId);
    room.run();
  });

  // 消息事件
  room.on("chatmsg", function (res) {
    // console.log(res)
    // 钻粉点歌
    if (res.diaf === "1" && res.txt.startsWith("#点歌")) {
      // 只保留歌名
      const title = res.txt.replace("#点歌", "").trim();
      // 点歌人昵称，歌名，时间戳
      const diangeInsert = `INSERT INTO playlist(nn, title) VALUES('${res.nn}', '${title}')`;
      db.query(diangeInsert, (err) => {
        console.log(err ? err.stack : ` -- [${res.nn}] 点了一首 ${title}`);
      });
    }

    // superchat
    if (res.txt.toLowerCase().startsWith("#sc")) {
      const text = res.txt.slice(3, res.txt.length).trim();
      const nickname = res.nn;
      const avatar = res.ic;
      const scQuery = `SELECT * FROM gift WHERE nn = '${nickname}' AND expired = false`;
      db.query(scQuery, (err, res) => {
        if (err) {
          console.log(err);
          return;
        }
        // 遍历该用户所有礼物， 标记超时的
        const gifts = res.rows;
        let toExpire = [];
        let currUser = [];
        let value = 0;
        for (let i = 0; i < gifts.length; i++) {
          const gift = gifts[i];
          const ts = new Date(gifts[i].ts).getTime();
          // elased time in minutes
          const elapsed = (new Date().getTime() - ts) / 1000 / 60;
          if (elapsed > 3.0) {
            // mark the item for deletion
            toExpire.push(gift.id);
            continue;
          } else if (gift.nn === nickname) {
            // price is pc * cnt / 100
            value += (giftData[gift.gfid].pc * gift.gfcnt) / 100;
            currUser.push(gift.id);
          }
        }
        let scEnabled = false;
        // 根据统计的value来执行
        if (value >= 30.0) {
          scEnabled = true;
        } else {
          console.log(`Not enough value. You have ${value}.`);
        }
        if (scEnabled) {
          const scInsert = `INSERT INTO sc(nn, avatar, total_pc, txt) VALUES('${nickname}', '${avatar}', '${parseInt(
            value
          )}', '${text}')`;
          db.query(scInsert, (err) => {
            console.log(err ? err.stack : `${scInsert} -- success`);
          });
        }

        // 删除用户使用掉的礼物
        if (scEnabled) {
          Array.prototype.push.apply(toExpire, currUser);
        }
        if (toExpire.length > 0) {
          // 删除需要删除的value
          let scExpire = `UPDATE gift SET expired = true WHERE id IN (`;
          for (let i = 0; i < toExpire.length; i++) {
            // last character
            if (i === toExpire.length - 1) {
              scExpire += `${toExpire[i]})`;
              break;
            }
            scExpire += `${toExpire[i]},`;
          }
          db.query(scExpire, (err) => {
            if (err) {
              console.log(err);
            }
          });
        }
      });
    }
  });

  // 记录礼物（忽略荧光棒，鱼丸和超大丸星）
  const IGNORE = ["824", "20000", "20008"];
  room.on("dgb", function (res) {
    // console.log(res);
    const gfid = res.gfid;
    if (IGNORE.includes(gfid)) {
      return;
    }
    if (!giftData[gfid]) {
      console.log(res);
      return;
    }

    const nn = res.nn;
    const gfcnt = res.gfcnt;
    const giftsInsert = `INSERT INTO gift(nn, gfid, gfcnt) VALUES('${nn}', '${gfid}', '${gfcnt}')`;
    db.query(giftsInsert, (err) => {
      if (err) {
        console.log(err.stack);
      } else {
        console.log(
          ` -- [${nn}] 赠送了价值 ${giftData[gfid].pc / 100} 的 ${
            giftData[gfid].n
          }x${gfcnt}`
        );
      }
    });
  });

  // 无视广播（可能是其他直播间）
  room.on("spbc", function () {
    // console.log(`------------- 感谢[${r.sn}] 赠送的 ${r.gn}x${r.gc}`)
  });

  room.on("loginres", function () {
    console.log("[loginres]", "登录成功");
  });

  room.on("uenter", function () {
    // console.log('[uenter]', `${res.nn}进入房间`)
  });

  db.connect();

  db.query("SELECT NOW()", (err) => {
    console.log(err ? err : "[pg sql] 数据库连接成功");
  });

  // 开始监听
  room.run();
}
startListening();
