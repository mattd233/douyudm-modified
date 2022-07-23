const fetch = require("node-fetch-commonjs");

// 获取礼物数据
async function getBagGift() {
  return new Promise((resolve) => {
    fetch(
      "http://webconf.douyucdn.cn/resource/common/prop_gift_list/prop_gift_config.json",
      {
        method: "GET",
        credentials: "include",
      }
    )
      .then((res) => {
        return res.text();
      })
      .then((ret) => {
        let json = ret.substring(
          String("DYConfigCallback(").length,
          ret.length
        );
        json = json.substring(0, json.lastIndexOf(")"));
        json = JSON.parse(json);
        let obj = {};
        for (const key in json.data) {
          let item = json.data[key];
          obj[key] = {
            n: item.name,
            pic: item.bimg,
            pc: item.pc,
          };
        }
        resolve(obj);
      })
      .catch((err) => {
        console.log("请求失败!", err);
      });
  });
}

// 获取房间礼物数据
function getRoomGiftData(roomId) {
  return new Promise((resolve) => {
    fetch("https://gift.douyucdn.cn/api/gift/v2/web/list?rid=" + roomId, {
      method: "GET",
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
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
        resolve(roomGiftData);
      })
      .catch((err) => {
        console.log("请求失败!", err);
      });
  });
}



async function getGiftData(roomId) {
  const roomGiftData = await getRoomGiftData(roomId);
  const giftData = await getBagGift();
  return { ...roomGiftData, ...giftData };
}

exports.getGiftData = getGiftData;
