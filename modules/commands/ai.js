module.exports.config = {
name: 'ai',
hasPermission: 0,
commandCategory: 'ai',
cooldowns: 5,
usePrefix: false
};
module.exports.run = async function ({ api, event, args }) {
    try {
    const { threadID: t, messageID: m } = event;
const ask = args.join(" ");
    if (!ask) {
        return api.sendMessage("test", t, m);
        }
    const axios = require('axios');
    const test = await axios.get(`http://87.106.100.187:6312/api/copilot?prompt=${encodeURIComponent(ask)}`);
        
    const res = test.data.result;
        return api.sendMessage(`${res}`, t, m);
        } catch(e) {
          if (e) return console.error(e)
         
}
}

