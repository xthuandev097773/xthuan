const fs = require('fs'), ytdl = require('@distube/ytdl-core'), fse = require("fs-extra");
const moment = require("moment-timezone"), Youtube = require('youtube-search-api');

module.exports.config = {
  name: "sing2", version: "1.0.3", hasPermission: 0,
  credits: "D-Jukie fix by TKDEV", description: "Nghe nhạc Youtube ngay trên Messenger",
  commandCategory: "Tiện ích", usages: "[tên bài hát]", cooldowns: 3, usePrefix: true
};

module.exports.run = async function({ api, event, args }) {
  if (!args[0]) return api.sendMessage("❎ Nhập tên bài hát!", event.threadID, event.messageID);
  try {
    const data = (await Youtube.GetListByKeyword(args.join(" "), false, 6)).items.filter(i => i.type === "video");
    if (!data.length) return api.sendMessage("❎ Không tìm thấy bài nào!", event.threadID, event.messageID);
    const msg = data.map((v, i) =>
      `|› ${i + 1}. ${v.title}\n|› 👤 ${v.channelTitle}\n|› ⏱️ ${v.length.simpleText}\n──────────────────`
    ).join('\n');
    const link = data.map(v => v.id);
    return api.sendMessage(`📝 Kết quả:\n${msg}\n\n📌 Reply STT để bot phát nhạc!`, event.threadID, (err, info) =>
      global.client.handleReply.push({ type: 'reply', name: this.config.name, author: event.senderID, messageID: info.messageID, link })
    , event.messageID);
  } catch (e) {
    console.error(e); api.sendMessage("❎ Lỗi khi tìm kiếm!", event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, body, senderID } = event, id = handleReply.link[parseInt(body) - 1];
  if (!id) return api.sendMessage("❎ Số không hợp lệ!", threadID, messageID);
  const path = `${__dirname}/cache/sing-${senderID}.mp3`;
  try {
    const info = await ytdl.getInfo(id);
    const v = info.videoDetails;

    const format = ytdl.filterFormats(info.formats, 'audioonly').find(f => 
      f.mimeType.includes('audio/mp4') && f.audioBitrate <= 128
    );
    if (!format) return api.sendMessage("❎ Không tìm được định dạng phù hợp!", threadID, messageID);

    const stream = ytdl.downloadFromInfo(info, {
      format,
      highWaterMark: 1 << 25
    }).pipe(fs.createWriteStream(path));

    stream.on('finish', () => {
      const size = fs.statSync(path).size;
      if (size > 26214400) return api.sendMessage("❎ File quá lớn!", threadID, () => fse.unlinkSync(path), messageID);
      api.unsendMessage(handleReply.messageID);
      api.sendMessage({
        body: `=== [ Âm Nhạc Từ YouTube ] ===
──────────────────
🎵 Tên: ${v.title}
⏱️ Thời lượng: ${convertHMS(v.lengthSeconds)} |
👤 Tác giả: ${v.author.name}
📆 Ngày đăng: ${v.uploadDate} | 👁️ Lượt xem: ${v.viewCount}
──────────────────
⏰ ${moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss | DD/MM/YYYY")}`,
        attachment: fs.createReadStream(path)
      }, threadID, () => fse.unlinkSync(path), messageID);
    });

    stream.on('error', e => {
      console.error(e); return api.sendMessage("❎ Lỗi khi tải!", threadID, messageID);
    });

  } catch (e) {
    console.error(e); return api.sendMessage("❎ Đã xảy ra lỗi!", threadID, messageID);
  }
};

function convertHMS(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return [h, m, sec].map(v => v < 10 ? "0" + v : v).filter((v, i) => v !== "00" || i > 0).join(":");
}
