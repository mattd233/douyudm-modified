// 监听库
const { client } = require("douyudm");
// 数据库
const { db } = require("../src/databaseHandler");
// 礼物数据
const { getGiftData } = require("../src/getGiftData");

// 清理前一个月的gift
function clearExpiredGift() {
  const clearQuery = `DELETE FROM gift 
    WHERE date_trunc('month', created_at) = date_trunc('month', current_date - interval '1 month')`;
  db.query(clearQuery, (err) => {
    console.log(err ? err.stack : "Clearing last month's gift data.");
  });
}

async function startListening() {
  // 设置房间号，初始化
  const roomId = 3187637;
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
      const diangeInsert = `INSERT INTO playlist(belongs_to_user, title) VALUES('${res.nn}', '${title}')`;
      db.query(diangeInsert, (err) => {
        console.log(err ? err.stack : ` -- [${res.nn}] 点了一首 ${title}`);
      });
    }

    // superchat
    if (res.txt.toLowerCase().startsWith("#sc")) {
      const text = res.txt.slice(3, res.txt.length).trim();
      const nickname = res.nn;
      const avatar = res.ic;
      const scQuery = `SELECT * FROM gift WHERE belongs_to_user = '${nickname}' AND expired = false`;
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
          const created_at = new Date(gifts[i].created_at).getTime();
          // elased and expiry time (in minutes)
          const elapsed = (new Date().getTime() - created_at) / 1000 / 60;
          const expiryTime = 10.0
          if (elapsed > expiryTime) {
            // mark the item for deletion
            toExpire.push(gift.id);
            continue;
          } else if (gift.belongs_to_user === nickname) {
            // price is pc * cnt / 100
            value += (giftData[gift.gift_id].pc * gift.gift_count) / 100;
            currUser.push(gift.id);
          }
        }
        let scEnabled = false;
        // 根据统计的value来执行
        if (value >= 30.0) {
          scEnabled = true;
        } else {
          console.log(`Not enough value. User '${nickname}' having ${value} tried to send superchat ${text}.`);
        }
        if (scEnabled) {
          const scInsert = `INSERT INTO superchat(belongs_to_user, avatar, total_price, text) VALUES('${nickname}', '${avatar}', '${parseInt(
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

  // 记录礼物（忽略荧光棒，鱼丸, 超大丸星, 钻粉荧光棒）
  const IGNORE = ["824", "20000", "20008", "22899"];
  room.on("dgb", function (res) {
    const gift_id = res.gfid;
    if (IGNORE.includes(gift_id)) {
      return;
    }
    if (!giftData[gift_id]) {
      console.log(`gift data doesn't contain gift with id: ${gift_id}`);
      return;
    }
    // 忽略1块钱以下的礼物
    if (giftData[gift_id].pc && giftData[gift_id].pc < 100) {
      return;
    }

    const belongs_to_user = res.nn;
    const gift_count = res.gfcnt;
    const giftsInsert = `INSERT INTO gift(belongs_to_user, gift_id, gift_count) VALUES('${belongs_to_user}', '${gift_id}', '${gift_count}')`;
    db.query(giftsInsert, (err) => {
      if (err) {
        console.log(err.stack);
      } else {
        console.log(
          ` -- [${belongs_to_user}] 赠送了价值 ${giftData[gift_id].pc / 100} 的 ${giftData[gift_id].n}x${gift_count}, gift_id: ${gift_id}`
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
