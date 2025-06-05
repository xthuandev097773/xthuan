const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const cacheDir = path.join(__dirname, "cache");
const settingsPath = path.join(cacheDir, "autodown_settings.json");

if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
}

let settings = {
    isTikTokEnabled: true,
    isSoundCloudEnabled: true,
    isDouyinEnabled: true,
    isFacebookEnabled: true,
    isYouTubeEnabled: true,
    isDownAIOEnabled: true,
    isXcomEnabled: true,
    isThreadsEnabled: true,
};

if (fs.existsSync(settingsPath)) {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
} else {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

function saveSettings() {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

async function streamURL(url, type) {
    const res = await axios.get(url, {
        responseType: "arraybuffer"
    });
    const filePath = `${cacheDir}/${Date.now()}.${type}`;
    fs.writeFileSync(filePath, res.data);
    return fs.createReadStream(filePath);
}

async function infoPostTT(url) {
    const res = await axios.post("https://tikwm.com/api/", {
        url
    }, {
        headers: {
            "content-type": "application/json"
        }
    });
    return res.data.data;
}

function isDouyinVideoLink(link) {
    return /douyin\.com/.test(link);
}

exports.handleEvent = async function(o) {
    try {
        const str = o.event.body;
        const send = (msg) => o.api.sendMessage(msg, o.event.threadID, o.event.messageID);
        const links = str.match(/(https?:\/\/[^)\s]+)/g) || [];

        if (str.startsWith("Autodown")) {
            const args = str.split(" ");
            switch (args[1]) {
                case "-s":
                    settings.isSoundCloudEnabled = !settings.isSoundCloudEnabled;
                    saveSettings();
                    return send(`SoundCloud đã được ${settings.isSoundCloudEnabled ? "✅ BẬT" : "❌ TẮT"}`);
                case "-t":
                    settings.isTikTokEnabled = !settings.isTikTokEnabled;
                    saveSettings();
                    return send(`TikTok đã được ${settings.isTikTokEnabled ? "✅ BẬT" : "❌ TẮT"}`);
                case "-d":
                    settings.isDouyinEnabled = !settings.isDouyinEnabled;
                    saveSettings();
                    return send(`Douyin đã được ${settings.isDouyinEnabled ? "✅ BẬT" : "❌ TẮT"}`);
                case "-f":
                    settings.isFacebookEnabled = !settings.isFacebookEnabled;
                    saveSettings();
                    return send(`Facebook đã được ${settings.isFacebookEnabled ? "✅ BẬT" : "❌ TẮT"}`);
                case "-aio":
                    settings.isDownAIOEnabled = !settings.isDownAIOEnabled;
                    saveSettings();
                    return send(``); 
                case "-y":
                    settings.isYouTubeEnabled = !settings.isYouTubeEnabled;
                    saveSettings();
                    return send(``); 
                case "-xx":
                    settings.isXvideosEnabled = !settings.isXvideosEnabled;
                    saveSettings();
                case "-x":
                    settings.isXcomEnabled = !settings.isXcomEnabled;
                    saveSettings();
				case "-tr":
                    settings.isThreadsEnabled = !settings.isThreadsEnabled;
                    saveSettings();
                    return send(`Threads đã được ${settings.isThreadsEnabled ? "✅ BẬT" : "❌ TẮT"}`);
                case "-all":
                    const newState = !settings.isTikTokEnabled;
                    settings.isTikTokEnabled =
                        settings.isSoundCloudEnabled =
                        settings.isDouyinEnabled =
                        settings.isFacebookEnabled =
                        settings.isYouTubeEnabled =
                        settings.isDownAIOEnabled =
                        settings.isXvideosEnabled =
						settings.isThreadsEnabled =
                        settings.isXcomEnabled = newState;
                    saveSettings();
                    return send(`Tất cả các dịch vụ đã được ${newState ? "✅ BẬT" : "❌ TẮT"}`);
                default:
                    return send(`[ MENU TỰ ĐỘNG TẢI ]
1. TikTok: ${settings.isTikTokEnabled ? "✅ BẬT" : "❌ TẮT"}
2. SoundCloud: ${settings.isSoundCloudEnabled ? "✅ BẬT" : "❌ TẮT"}
3. Douyin: ${settings.isDouyinEnabled ? "✅ BẬT" : "❌ TẮT"}
4. Facebook: ${settings.isFacebookEnabled ? "✅ BẬT" : "❌ TẮT"}
5. YouTube: ${settings.isYouTubeEnabled ? "✅ BẬT" : "❌ TẮT"}
6. DownAIO: ${settings.isDownAIOEnabled ? "✅ BẬT" : "❌ TẮT"}
7. X.com: ${settings.isXcomEnabled ? "✅ BẬT" : "❌ TẮT"}
8. Threads: ${settings.isThreadsEnabled ? "✅ BẬT" : "❌ TẮT"}
9. Xvideosvideo.com: ${settings.isXvideosEnabled ? "✅ BẬT" : "❌ TẮT"}

Cách Dùng:
- Công thức: "autodown -chữ thường đầu"
- Ví dụ: "autodown -t" để bật/tắt TikTok
- "autodown -aio" để bật/tắt DownAIO ( Tải Đa Nền Tảng )
- "autodown -x" để bật/tắt X.com
- "autodown -all" để bật/tắt toàn bộ tự động tải.`);
            }
        }

        for (const link of links) {
            if (/x\.com/.test(link) && settings.isXcomEnabled) {
                try {
                    const res = await axios.get(`https://j2down.vercel.app/download?url=${link}`);
                    
                    if (res.data?.success && res.data?.data?.medias?.length) {
                        const { title, medias } = res.data.data;

                        const attachments = await Promise.all(medias.map(async (media) => {
                            if (media.type === "video") {
                                return await streamURL(media.url, "mp4");
                            } else if (media.type === "image") {
                                return await streamURL(media.url, media.extension);
                            }
                        }));

                        send({
                            body: `[ autodown X ]\n📝 Tiêu Đề: ${title}`,
                            attachment: attachments,
                        });
                    } else {
                        send("Không thể tải nội dung từ x.com.");
                    }
                } catch (error) {
                    console.error(error);
                    send("Đã xảy ra lỗi khi tải nội dung từ x.com.");
                }
            }

            if (/soundcloud/.test(link) && settings.isSoundCloudEnabled) {
                try {
                    const res = await axios.get(`https://j2down.vercel.app/download?url=${link}`);
                    const { title, duration, audio } = res.data.result;
                    const audioPath = await streamURL(audio, "mp3");
                    send({
                        body: `[ SOUNDCLOUD ]\n📝 Tiêu Đề: ${title}\n⏰ Thời Gian: ${duration}`,
                        attachment: audioPath,
                    });
                } catch {
                    send("Đã xảy ra lỗi khi tải nội dung từ SoundCloud.");
                }
            }

            if (/threads\.net/.test(link) && settings.isThreadsEnabled) {
                try {
                    const res = await axios.get(`https://j2down.vercel.app/download?url=${link}`);
                    
                    if (res.data?.success && res.data?.data?.medias?.length) {
                        const { title, medias } = res.data.data;
            
                        const attachments = await Promise.all(medias.map(async (media) => {
                            if (media.type === "video") {
                                return await streamURL(media.url, "mp4");
                            } else if (media.type === "image") {
                                return await streamURL(media.url, media.extension);
                            }
                        }));
            
                        send({
                            body: `[ Threads ]\n📝 Tiêu Đề: ${title}`,
                            attachment: attachments,
                        });
                    } else {
                        send("Không thể tải nội dung từ Threads.");
                    }
                } catch (error) {
                    console.error(error);
                    send("Đã xảy ra lỗi khi tải nội dung từ Threads.");
                }
            }
            
            if (/(^https:\/\/)((vm|vt|www|v)\.)?(tiktok)\.com\//.test(link) && settings.isTikTokEnabled) {
                try {
                    const res = await axios.get(`https://j2down.vercel.app/download?url=${link}`);
                    const json = res.data;
                    
                    // Kiểm tra nếu có dữ liệu
                    if (json.code === 0 && json.data) {
                        const { title, author, play, digg_count, comment_count, share_count } = json.data;
            
                        // Chỉ tải video
                        const attachment = await streamURL(play, "mp4");
            
                        send({
                            body: `[ TikTok ]\n📝 Tiêu Đề: ${title}\n👤 Tên Kênh: ${author.nickname}\n💖 Lượt Tim: ${digg_count}\n💬 Lượt Bình Luận: ${comment_count}\n🔗 Lượt Chia Sẻ: ${share_count}`,
                            attachment,
                        });
                    } else {
                        send("Không thể tải nội dung từ TikTok.");
                    }
                } catch (error) {
                    console.error(error);
                    send("Đã xảy ra lỗi khi tải nội dung từ TikTok.");
                }
            }

            if (settings.isDouyinEnabled && isDouyinVideoLink(link)) {
                try {
                    const res = await axios.get(`https://j2down.vercel.app/download?url=${link}`);
                    const videoData = res.data;
                    if (videoData.attachments?.length) {
                        const videoStream = await streamURL(videoData.attachments[0].url, "mp4");
                        send({
                            body: `[ DOUYIN ]\n📝 Tiêu Đề: ${videoData.caption || "N/A"}`,
                            attachment: videoStream,
                        });
                    }
                } catch {
                    send("");
                }
            }

            if (/xvideos\.com/.test(link) && settings.isXvideosEnabled) {
                try {
                    const apiUrl = `https://subhatde.id.vn/xvideos/download?url=${encodeURIComponent(link)}`; // Thay bằng API của bạn
                    const res = await axios.get(apiUrl);
            
                    if (res.data.success && res.data.data) {
                        const { contentUrl, description, name } = res.data.data;
            
                        const videoStream = await streamURL(contentUrl, "mp4");
            
                        send({
                            body: `[ XVIDEOS ]\n📝 Tiêu Đề: ${description || "N/A"}\n👤 Tên Tài Khoản: ${name || "N/A"}`,
                            attachment: videoStream,
                        });
                    } else {
                        send("Không thể tải video từ Xvideos.");
                    }
                } catch (error) {
                    console.error(error);
                    send("Đã xảy ra lỗi khi tải video từ Xvideos.");
                }
            }

            if (/fb|facebook/.test(link) && settings.isFacebookEnabled) {
                try {
                    const res = await axios.get(`https://api.hungdev.id.vn/medias/down-aio?url=${encodeURIComponent(link)}&apikey=9b9495cfdb`);
                    const { title, medias } = res.data.data;
                    
                    if (medias?.length) {
                        const firstMedia = medias[0]; 
                        const attachment = await streamURL(firstMedia.url, firstMedia.extension);
            
                        send({
                            body: `[ FACEBOOK ]\n📝 Tiêu Đề: ${title || "N/A"}`,
                            attachment,
                        });
                    }
                } catch {
                    send("");
                }
            }
            
        }
    } catch (error) {
        console.error(error);
    }
};

exports.run = () => {};

exports.config = {
    name: "autodow",
    version: "1.0.9",
    hasPermssion: 0,
    credits: "tkdev",
    description: "Tự động tải link (TikTok, SoundCloud, Douyin & Facebook)",
    commandCategory: "Tiện ích",
    usages: ["autodown"],
    cooldowns: 3,
};
