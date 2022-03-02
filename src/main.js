const fetch = require("node-fetch-commonjs");
const fs = require('fs');
//监听库
const { client } = require("douyudm");
//数据库
const { db } = require("../src/databaseHandler");
//礼物数据
const { giftData } = require("../data/giftData");

function getRoomGiftData(rid) {
    return new Promise((resolve) => {
        fetch("https://gift.douyucdn.cn/api/gift/v2/web/list?rid=" + rid, {
            method: "GET",
        })
            .then((res) => {
                return res.json();
            })
            .then((ret) => {
                resolve(ret);
            })
            .catch((err) => {
                console.log("请求失败!", err);
            });
    });
}

// allGiftData.value = {...roomGiftData, ...giftData};

async function startListening() {
    //设置房间号，初始化
    const roomId = 3187637; // llm
    const opts = {
        debug: true, // 默认关闭 false
        ignore: ["mrkl"],
    };
    const room = new client(roomId, opts);

    //获取房间礼物数据
    let data = await getRoomGiftData(roomId);
    let roomGiftData = {};
    if ("giftList" in data.data) {
        for (let i = 0; i < data.data.giftList.length; i++) {
            let item = data.data.giftList[i];
            roomGiftData[item.id] = {
                n: item.name,
                pic: item.basicInfo.giftPic,
                pc: item.priceInfo.price,
            };
        }
    }
    allGiftData = {};
    allGiftData = { ...roomGiftData, ...giftData };

    // const giftJson = JSON.stringify(allGiftData);
    // // write JSON string to a file
    // fs.writeFile('gift.json', giftJson, (err) => {
    //     if (err) {
    //         throw err;
    //     }
    //     console.log("JSON data is saved.");
    // });

    //系统事件
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

    //消息事件
    room.on("chatmsg", function (res) {
        console.log("[chatmsg]", `<lv ${res.level}> [${res.nn}] ${res.txt}`);
        // console.log(res)
        // 钻粉点歌
        if (res.diaf === "1" && res.txt.startsWith("#点歌")) {
            //只保留歌名
            const title = res.txt.replace("#点歌", "").trim();
            //点歌人nn，歌名，时间戳
            const diangeInsert = `INSERT INTO diange(nn, title) VALUES('${res.nn}', '${title}')`;
            db.query(diangeInsert, (err) => {
                console.log(err ? err.stack : ` -- [${res.nn}] 点了一首 ${title}`);
            });
        }

        // superchat
        if (res.txt.startsWith("#sc")) {
            const text = res.txt.replace("#sc", "").trim();
            const nickname = res.nn;
            const avatar = res.ic;
            const scQuery = `SELECT * FROM gift`;
            db.query(scQuery, (err, res) => {
                if (err) {
                    console.log(err);
                    return;
                }
                // 遍历所有礼物， 标记超时的
                const gifts = res.rows;
                let toDelete = [];
                let currUser = [];
                let value = 0;
                for (let i = 0; i < gifts.length; i++) {
                    const ts = new Date(gifts[i].ts).getTime();
                    // elased time in minutes
                    const elapsed = (new Date().getTime() - ts) / 1000 / 60;
                    if (elapsed > 5) {
                        // mark the item for deletion
                        toDelete.push(gifts[i].id);
                        continue;
                    } else if (gifts[i].nn === nickname) {
                        // price is pc * cnt / 100
                        value += allGiftData[gifts[i].gfid].pc * gifts[i].gfcnt / 100;
                        console.log(`${gifts[i].nn} * ${gifts[i].gfcnt}`);
                        console.log(value);
                        currUser.push(gifts[i].id);
                    }
                }
                let scEnabled = false;
                let highlight = false;
                // 根据统计的value来执行
                if (value >= 50) {
                    highlight = true
                    scEnabled = true
                } else if (value >= 30) {
                    scEnabled = true
                } else {
                    console.log("Not enough value.")
                }
                if (scEnabled) {
                    const scInsert = `INSERT INTO sc(highlight, nn, avatar, txt) VALUES('${highlight}', '${nickname}', '${avatar}', '${text}')`;
                    db.query(scInsert, (err) => {
                        console.log(err ? err.stack : ` -- [${nickname}] 发了一条sc`);
                    });
                }

                // 删除用户使用掉的礼物
                if (scEnabled) {
                    Array.prototype.push.apply(toDelete, currUser);
                }
                if (toDelete.length > 0) {
                    // 删除需要删除的value
                    let scDelete = `DELETE FROM gift WHERE id IN (`;
                    for (let i = 0; i < toDelete.length; i++) {
                        // last character
                        if (i === toDelete.length - 1) {
                            scDelete += `${toDelete[i]})`;
                            break;
                        }
                        scDelete += `${toDelete[i]},`;
                    }
                    db.query(scDelete, (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            });
        }
    });

    //记录礼物（忽略荧光棒，鱼丸和超大丸星）
    const IGNORE = ["824", "20000", "20008"];
    room.on("dgb", function (res) {
        const gfid = res.gfid;
        if (IGNORE.includes(gfid)) {
            return;
        }
        if (!allGiftData[gfid]) {
            console.log(res);
            return;
        }

        const nn = res.nn;
        const gfcnt = res.gfcnt;
        const giftsInsert = `INSERT INTO gift(nn, gfid, gfcnt) VALUES('${nn}', '${gfid}', '${gfcnt}')`;
        db.query(giftsInsert, (err) => {
            console.log(
                err ? err.stack : ` -- [${nn}] 赠送了价值 ${allGiftData[gfid].pc / 100} 的 ${allGiftData[gfid].n}x${gfcnt}`
            );
        });
    });

    //无视广播（可能是其他直播间）
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

    //开始监听
    room.run();
}
startListening();
