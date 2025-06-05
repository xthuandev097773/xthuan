const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const ytdl = require("@distube/ytdl-core");
const moment = require("moment-timezone");
const Youtube = require("youtube-search-api");

module.exports.config = {
  name: "yt",
  version: "2.0.0",
  hasPermission: 0,
  credits: "TKDEV",
  description: "Nghe nhạc trên Youtube hoặc tải video siêu bá:)",
  commandCategory: "Tiện ích",
  usages: "[tên bài hát]",
  cooldowns: 3,
  usePrefix: true
};

module.exports.run = async function ({ api, event, args }) {
  if (!args[0]) return api.sendMessage("❎ Vui lòng nhập tên bài hát!", event.threadID, event.messageID);
  try {
    const results = (await Youtube.GetListByKeyword(args.join(" "), false, 8)).items;
    const filtered = results.filter(v => v.type === "video" && v.length?.simpleText && !v.isLive && parseDuration(v.length.simpleText) <= 600);
    if (!filtered.length) return api.sendMessage("❎ Không có video hợp lệ dưới 10 phút!", event.threadID, event.messageID);

    const msg = filtered.map((v, i) => `${i + 1}. ${v.title}\n⏱️ ${v.length.simpleText} | 👤 ${v.channelTitle}\n─────────────────────`).join("\n\n");
    const links = filtered.map(v => v.id);

    return api.sendMessage(`[ YOUTUBE SEARCH ]\n📝 Kết quả tìm kiếm:\n\n${msg}\n\n📌 Reply STT để chọn video bạn muốn tải.`, event.threadID, (err, info) => {
      global.client.handleReply.push({
        type: "select",
        name: module.exports.config.name,
        messageID: info.messageID,
        author: event.senderID,
        links
      });
    }, event.messageID);
  } catch (e) {
    console.error(e);
    return api.sendMessage("❎ Đã xảy ra lỗi khi tìm kiếm!", event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (event.senderID !== handleReply.author) return;
  const index = parseInt(event.body) - 1;
  const id = handleReply.links[index];
  if (!id) return api.sendMessage("❎ STT không hợp lệ!", event.threadID, event.messageID);

  const url = `https://www.youtube.com/watch?v=${id}`;
  const formatMsg = `[ YOUTUBE FORMATING ]\n📥 Bạn muốn định dạng file như nào?\nVui lòng thả cảm xúc vào tin nhắn này!\n1/❤️. MP3\n2/😮. MP4`;
  api.unsendMessage(handleReply.messageID);

  return api.sendMessage(formatMsg, event.threadID, (err, info) => {
    global.client.handleReaction.push({
      name: module.exports.config.name,
      messageID: info.messageID,
      author: event.senderID,
      url
    });
  }, event.messageID);
};

module.exports.handleReaction = async function ({ api, event, handleReaction }) {
  const { messageID, userID, reaction, threadID } = event;
  if (userID !== handleReaction.author || messageID !== handleReaction.messageID) return;
  api.unsendMessage(messageID);

  let format = "";
  const heartReactions = ["❤️", "❤"];
  if (reaction === "😮") format = "mp4";
  else if (heartReactions.includes(reaction)) format = "mp3";
  else return;

  const filePath = path.join(__dirname, `cache/sing-${userID}.${format}`);
  const timestart = Date.now();

  try {
    const info = await ytdl.getInfo(handleReaction.url);
    const v = info.videoDetails;

    if (format === "mp3") {
      const audioFormat = ytdl.filterFormats(info.formats, "audioonly").find(f => f.mimeType.includes("audio/mp4") && f.audioBitrate <= 128);
      if (!audioFormat) return api.sendMessage("❎ Không tìm được định dạng phù hợp!", threadID);

      const stream = ytdl.downloadFromInfo(info, {
        format: audioFormat,
        highWaterMark: 1 << 25
      }).pipe(fs.createWriteStream(filePath));

      stream.on("finish", () => sendResult(api, threadID, v, format, filePath, timestart));
      stream.on("error", e => {
        console.error(e);
        return api.sendMessage("❎ Lỗi khi tải file!", threadID);
      });
    } else {
      const stream = ytdl.downloadFromInfo(info, {
        quality: "highestvideo",
        filter: "audioandvideo",
        highWaterMark: 1 << 25
      });

      const writeStream = fs.createWriteStream(filePath);
      stream.pipe(writeStream);

      writeStream.on("finish", () => sendResult(api, threadID, v, format, filePath, timestart));
      writeStream.on("error", err => {
        console.error("Lỗi ghi file:", err);
        return api.sendMessage("❎ Lỗi khi ghi file tải về!", threadID);
      });
    }
  } catch (e) {
    console.error(e);
    return api.sendMessage("❎ Lỗi khi xử lý video!", threadID);
  }
};

function sendResult(api, threadID, v, format, filePath, timestart) {
  const size = fs.statSync(filePath).size;
  if (size > 26214400) {
    fs.unlinkSync(filePath);
    return api.sendMessage("❎ File lớn hơn 25MB, không thể gửi qua Messenger!", threadID);
  }

  const duration = convertHMS(v.lengthSeconds);
  const timeEnd = moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss | DD/MM/YYYY");
  return api.sendMessage({
    body: `[ YOUTUBE - ${format.toUpperCase()} ]\n\n🎬 Tên: ${v.title}\n⏱️ Thời lượng: ${duration}\n👤 Tác giả: ${v.author.name}\n📅 Ngày đăng: ${v.uploadDate}\n👁️ Lượt xem: ${v.viewCount} lượt\n🕒 Thời gian xử lý: ${(Date.now() - timestart) / 1000}s\n⏰ ${timeEnd}`,
    attachment: fs.createReadStream(filePath)
  }, threadID, () => fs.unlinkSync(filePath));
}

function convertHMS(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return [h, m, sec].map(v => v < 10 ? "0" + v : v).filter((v, i) => v !== "00" || i > 0).join(":");
}

function parseDuration(str) {
  const parts = str.split(":".trim()).map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}
