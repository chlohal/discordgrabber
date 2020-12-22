require('dotenv').config();

const Discord = require('discord.js')
const client = new Discord.Client({
    http: {
        api: "https://discord.com/api"
    }
});
var fs = require("fs");

function formatDate(d) {
    return ([d.getFullYear(), d.getMonth()+1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()]).join("-");
}
var t = formatDate(new Date());

var fileName = __dirname + "/grab_" + t + ".csv";

//adds headers and overwrites any other content in the file
fs.writeFileSync(fileName, "content,unix timestamp,creation date,channel name,channel index,channel topic,channel ID,pinned,ID,author id,author username,"
    + "author discriminator,author avatar,author isBot,attachment filename,attachment filesize,attachment height,attachment width,attachment ID,"
    + "attachment proxyCdnUrl,attachment isSpoiler,attachment sourceUrl,type,isTts,editedTimestamp\n");

var completedChannelCount = 0;

client.on('ready', async function() {
    var guild = await client.guilds.get(process.env.SERVER_ID);

    var channels = guild.channels.filter(c => c.type === 'text');

    channels.forEach(async function(channel, index) {
        var messages = [], before, erroredRequest;
        messages.length = 100;

        while(messages.length == 100 && !erroredRequest) {
            erroredRequest = false;
            var qParams = { limit: 100 };
            if(before) qParams.before = before;

            var msgsCollection;
            try {
                msgsCollection = await channel.fetchMessages(qParams);
            } catch(e) {
                console.log("Error - Stepping back 1 messagepage");
                console.log(e);
                erroredRequest = true;
            }
            messages = msgsCollection.array();

            var beforeMessage = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp)[0];
            if(!beforeMessage) break;
            else before = beforeMessage.id;
            

            messages.forEach(function(m) {
                fs.appendFileSync(fileName, ([
                    csvify(m.content),
                    m.createdTimestamp,
                    csvify(m.createdAt.toString()),
                    csvify(m.channel.name),
                    m.channel.position,
                    csvify(m.channel.topic),
                    m.channel.id,
                    m.pinned,
                    m.id,
                    m.author.id,
                    csvify(m.author.username),
                    m.author.discriminator,
                    m.author.avatar,
                    m.author.bot,
                    csvify(m.attachments.first.filename),
                    m.attachments.first.filesize,
                    m.attachments.first.height,
                    m.attachments.first.width,
                    m.attachments.first.id,
                    csvify(m.attachments.first.proxyURL),
                    m.attachments.first.spoiler,
                    csvify(m.attachments.first.url),
                    m.type,
                    m.tts,
                    m.editedTimestamp,
                ]).join(",") + "\n");
            });
            
        }
        completedChannelCount++;
        console.log(channel.name +  " completed! (" + completedChannelCount + "/" + channels.array().length + ")");
        
        if(completedChannelCount == channels.array().length) {
            console.log("all done!");
            process.exit();
        }
    });
})


client.login(process.env.BOT_SECRET_TOKEN);

function csvify(str) {
    if(!str) return "";
    else return `"${(""+str).replace(/"/g, `""`)}"`;
}

