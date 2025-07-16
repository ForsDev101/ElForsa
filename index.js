{
  "name": "elforsa-discord-bot",
  "version": "1.0.0",
  "description": "ElForsa Discord botu",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "discord.js": "^14.13.0",
    "dotenv": "^16.3.1"
  }
}
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

const prefix = "!";
const ownerID = "YOUR_ID"; // uyarı logları sana DM olarak gitmesi için

let warningData = {};
let izinListesi = [];
let devriyeListesi = [];

client.on('ready', () => {
  console.log(`${client.user.tag} çalışıyor.`);
});

// Küfür, medya kontrol
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const argo = ["amk", "siktir", "orospu", "aq", "anan", "yarrak", "sik"];
  const küfürlü = argo.some(k => msg.content.toLowerCase().includes(k));
  const medya = msg.attachments.size > 0;

  if (küfürlü || medya) {
    await msg.delete();
    const member = msg.member;
    const reason = küfürlü ? "Küfür" : "Medya";

    warningData[member.id] = (warningData[member.id] || 0) + 1;
    const uyarilar = warningData[member.id];

    const dm = await client.users.fetch(ownerID);
    dm.send(`🚨 **Uyarı:** ${member.user.tag} - Sebep: ${reason} - Toplam uyarı: ${uyarilar}`);

    msg.channel.send(`${member} mesajın silindi. Sebep: ${reason}`);
  }
});

// Komutlar
client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(" ");
  const command = args.shift().toLowerCase();

  // !sa
  if (command === "sa") {
    return message.channel.send("Aleyküm selam canım");
  }

  // !mute @kişi
  if (command === "mute") {
    const member = message.mentions.members.first();
    const muteRole = message.guild.roles.cache.find(r => r.name === "Muted");
    if (!member || !muteRole) return message.reply("Hedef kullanıcı veya Muted rolü yok.");
    member.roles.add(muteRole);
    return message.channel.send(`${member} susturuldu.`);
  }

  // !unmute @kişi
  if (command === "unmute") {
    const member = message.mentions.members.first();
    const muteRole = message.guild.roles.cache.find(r => r.name === "Muted");
    if (!member || !muteRole) return message.reply("Hedef kullanıcı veya Muted rolü yok.");
    member.roles.remove(muteRole);
    return message.channel.send(`${member} susturulması kaldırıldı.`);
  }

  // !rütbever @kişi RÜTBE
  if (command === "rütbever") {
    if (!message.member.roles.cache.some(r => r.name === "@+")) return;
    const member = message.mentions.members.first();
    const rütbe = args.slice(1).join(" ");
    if (!member || !rütbe) return message.reply("Kullanıcı veya rütbe eksik.");

    // Burada Roblox API ile rütbe verilecektir. (Simülasyon)
    return message.reply(`✅ ${member} kişisinin Roblox rütbesi \`${rütbe}\` olarak ayarlandı.`);
  }

  // !tamyasakla @kişi
  if (command === "tamyasakla") {
    const member = message.mentions.members.first();
    if (!member) return message.reply("Birini etiketle!");
    message.guild.members.ban(member.id, { reason: "Tamyasaklandı" });
    return message.channel.send(`${member.user.tag} sunucudan tamamen yasaklandı.`);
  }

  // !çekiliş süre ödül
  if (command === "çekiliş") {
    const süre = parseInt(args[0]) * 1000;
    const ödül = args.slice(1).join(" ");
    const embed = new EmbedBuilder()
      .setTitle("🎉 ÇEKİLİŞ BAŞLADI 🎉")
      .setDescription(`Ödül: **${ödül}**\nSüre: ${args[0]} saniye\nKatılmak için 🎉 tepkisi verin!`)
      .setColor("Blue");

    const msg = await message.channel.send({ embeds: [embed] });
    await msg.react("🎉");

    setTimeout(async () => {
      const cache = await msg.reactions.cache.get("🎉").users.fetch();
      const katilanlar = cache.filter(u => !u.bot).map(u => u);
      if (katilanlar.length === 0) return message.channel.send("Yeterli katılım olmadı.");
      const kazanan = katilanlar[Math.floor(Math.random() * katilanlar.length)];
      message.channel.send(`🎉 Tebrikler ${kazanan}, **${ödül}** kazandın!`);
    }, süre);
  }

  // !izin @kişi sebep
  if (command === "izin") {
    const member = message.mentions.members.first();
    const reason = args.slice(1).join(" ") || "Sebep yok";
    if (!member) return message.reply("Birini etiketle!");
    izinListesi.push({ user: member.user.tag, reason });
    return message.channel.send(`${member.user.tag} izne ayrıldı. Sebep: ${reason}`);
  }

  // !devriye @kişi bölge
  if (command === "devriye") {
    const member = message.mentions.members.first();
    const bölge = args.slice(1).join(" ") || "belirtilmedi";
    if (!member) return message.reply("Birini etiketle!");
    devriyeListesi.push({ user: member.user.tag, bölge });
    return message.channel.send(`${member.user.tag} devriyeye çıktı. Bölge: ${bölge}`);
  }

  // !format
  if (command === "format") {
    const embed = new EmbedBuilder()
      .setTitle("ElForsa Bot Formatı")
      .setDescription(`**📌 Başvuru formatını aşağıya yazınız:**\n- Roblox grubunda rütbe verilir\n- İsim:\n- Yaş:\n- Neden katılmak istiyorsun:`)
      .setColor("Green");
    return message.channel.send({ embeds: [embed] });
  }

  // !sicil @kişi
  if (command === "sicil") {
    const member = message.mentions.members.first();
    if (!member) return message.reply("Birini etiketle!");
    const uyarilar = warningData[member.id] || 0;
    return message.reply(`${member} kullanıcısının toplam ${uyarilar} uyarısı var.`);
  }

  // !komutlar
  if (command === "komutlar") {
    const embed = new EmbedBuilder()
      .setTitle("🛠️ ElForsa Tüm Komutlar")
      .setColor("Gold")
      .setDescription(`
\`!sa\` - Selam ver
\`!mute @kişi\` - Sustur
\`!unmute @kişi\` - Susturmayı kaldır
\`!rütbever @kişi RÜTBE\` - Roblox rütbe ver
\`!tamyasakla @kişi\` - Tümden banla
\`!çekiliş 10 Ödül\` - Çekiliş başlat (saniye cinsinden)
\`!izin @kişi Sebep\` - İzin verir
\`!devriye @kişi Bölge\` - Devriyeye yollar
\`!format\` - Başvuru formatını atar
\`!sicil @kişi\` - Kişinin uyarı sayısını gösterir
      `);
    message.channel.send({ embeds: [embed] });
  }
});

client.login(process.env.DISCORD_TOKEN);
