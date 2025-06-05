module.exports.config = {
  name: "adc",
  version: "1.0.0",
  hasPermission: 3,
  credits: "TKDEV",
  description: "Upcode lên RunMocky và có thể reply all link raw",
  commandCategory: "Admin",
  usages: `${global.config.PREFIX}adc [link raw]`,
  cooldowns: 5,
  usePrefix: false
};
const fs = require('fs');
const axios = require('axios');
const { join } = require('path');
module.exports.run = async function({ api: a, event: e, args: r }) {
  const { threadID: t, messageID: m, messageReply: mr, senderID: s } = e;
  if (s != 61573025903295) return a.sendMessage("???", t, m);
  const n = r[0];
  let text = mr ? mr.body : null;
  if (!text && !n) {
    return a.sendMessage('⚠️ Vui lòng reply link muốn áp dụng code hoặc ghi tên file để up code lên RunMocky!', t, m);
  }
  if (n && !text) {
    fs.readFile(join(__dirname, `${n}.js`), 'utf-8', async (err, data) => {
      if (err) {
        return a.sendMessage(`❎ Lệnh ${n} không tồn tại!`, t, m);
      }
      try {
        const res = await axios.post('https://api.mocky.io/api/mock', {
          status: 200,
          content: data,
          content_type: 'application/json',
          charset: 'UTF-8',
          secret: 'PhamMinhDong',
          expiration: 'never'
        });
        return a.sendMessage(`${res.data.link}`, t, m);
      } catch (error) {
        return a.sendMessage('❎ Đã xảy ra lỗi khi upload code lên RunMocky!', t, m);
      }
    });
    return;
  }
  const urlR = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const url = text.match(urlR);
  if (url) {
    try {
      const res = await axios.get(url[0]);
      fs.writeFile(join(__dirname, `${n}.js`), res.data, 'utf-8', (err) => {
        if (err) {
          return a.sendMessage(`❎ Đã xảy ra lỗi khi áp dụng code vào ${n}.js`, t, m);
        }
        return a.sendMessage(`✅ Đã áp dụng code vào ${n}.js, sử dụng load để cập nhật modules mới!`, t, m);
      });
    } catch (error) {
      return a.sendMessage('❎ Đã xảy ra lỗi khi tải dữ liệu từ URL!', t, m);
    }
    return;
  }
  return a.sendMessage('⚠️ Không nhận diện được yêu cầu của bạn. Vui lòng kiểm tra lại!', t, m);
};