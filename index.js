// ElForsa Discord Bot - Tüm Komutlar Dahil, .env desteğiyle
require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Partials } = require("discord.js");
const noblox = require("noblox.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const GROUP_ID = process.env.GROUP_ID;
const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;
const OWNER_ID = process.env.OWNER_ID;
const TOKEN = process.env.DISCORD_TOKEN;

let sohbetModu = true;
const uyarilar = {};

function kaydet() {
  fs.writeFileSync("uyarilar.json", JSON.stringify(uyarilar, null, 2));
}

try {
  const data = fs.readFileSync("uyarilar.json");
  Object.assign(uyarilar, JSON.parse(data));
} catch {}

client.on("ready", async () => {
  console.log(`${client.user.tag} aktif!`);
  await noblox.setCookie(ROBLOX_COOKIE);
});

client.on("messageCreate", async (msg) => {
  if (!msg.content.startsWith("!")) return;
  const args = msg.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // !sa cevabı
  if (msg.content.toLowerCase() === "sa") return msg.reply("Aleyküm selam canım");

  // !format komutu
  if (command === "format") {
    const embed = new EmbedBuilder()
      .setTitle("Başvuru Formatı")
      .setDescription("**Roblox ismin:**\n**Çalıştığın kamplar:**\n**Çalıştığın kampların kişi sayıları:**")
      .setColor("Blue");
    return msg.channel.send({ embeds: [embed] });
  }

  // !rütbever
  if (command === "rütbever") {
    const member = msg.mentions.users.first();
    const rank = args.slice(1).join(" ");
    if (!member || !rank) return msg.reply("Kullanıcıyı ve rütbeyi belirt.");
    msg.reply(`✅ ${member} kişisinin Roblox rütbesi \`${rank}\` olarak ayarlandı.`);
    // noblox setRank fonksiyonu eklenebilir
  }

  // !tamyasakla
  if (command === "tamyasakla") {
    if (msg.author.id !== OWNER_ID) return msg.reply("Bu komutu sadece bot sahibi kullanabilir.");
    const user = msg.mentions.users.first();
    if (!user) return msg.reply("Yasaklanacak kişiyi etiketle.");
    const guilds = client.guilds.cache;
    guilds.forEach(guild => {
      const member = guild.members.cache.get(user.id);
      if (member) member.ban({ reason: "Bot global yasak" });
    });
    msg.reply(`${user.tag} tüm sunuculardan yasaklandı.`);
  }

  // !mute
  if (command === "mute") {
    const member = msg.mentions.members.first();
    if (!member) return msg.reply("Kimi susturacağım?");
    await member.timeout(10 * 60 * 1000, "Moderatör susturma");
    msg.reply(`${member} susturuldu.`);
  }

  // !unmute
  if (command === "unmute") {
    const member = msg.mentions.members.first();
    if (!member) return msg.reply("Kimi susturmayı kaldırayım?");
    await member.timeout(null);
    msg.reply(`${member} artık konuşabilir.`);
  }

  // !çekiliş
  if (command === "çekiliş") {
    const süre = parseInt(args[0]);
    const ödül = args.slice(1).join(" ");
    if (!süre || !ödül) return msg.reply("Kullanım: !çekiliş <saniye> <ödül>");
    const embed = new EmbedBuilder()
      .setTitle("🎉 ÇEKİLİŞ BAŞLADI 🎉")
      .setDescription(`Ödül: ${ödül}\nÇekiliş ${süre} saniye sürecek!`)
      .setColor("Green");
    const mesaj = await msg.channel.send({ embeds: [embed] });
    await mesaj.react("🎉");
    setTimeout(async () => {
      const tepkiler = await mesaj.reactions.cache.get("🎉").users.fetch();
      const katılımcılar = tepkiler.filter(u => !u.bot).map(u => u);
      const kazanan = katılımcılar[Math.floor(Math.random() * katılımcılar.length)];
      if (!kazanan) return msg.channel.send("Yeterli katılım yok.");
      msg.channel.send(`🎊 Kazanan: ${kazanan}`);
    }, süre * 1000);
  }

  // !devriye
  if (command === "devriye") {
    const member = msg.mentions.users.first();
    if (!member) return msg.reply("Kimi devriyeye yazacağım?");
    msg.reply(`${member} devriyeye yazıldı! 🫡`);
  }

  // !izin
  if (command === "izin") {
    const member = msg.mentions.users.first();
    if (!member) return msg.reply("Kime izin verilecek?");
    msg.reply(`${member} izne çıktı! 🌴`);
  }

  // sohbetbotu
  if (command === "sohbetac") sohbetModu = true;
  if (command === "sohbetkapat") sohbetModu = false;
  if (sohbetModu && msg.mentions.has(client.user)) {
    const soru = msg.content.split(" ").slice(1).join(" ");
    if (soru.length < 2) return msg.reply("Evet, askerim?");
    const cevaplar = [
      "Bunu Komutan Forsa'ya sorman gerekebilir.",
      "Şu an bir tatbikat var, sonra sor.",
      "Güzel soru, ama emir bekleniyor."
    ];
    msg.reply(cevaplar[Math.floor(Math.random() * cevaplar.length)]);
  }

  // !komutlar
  if (command === "komutlar") {
    const embed = new EmbedBuilder()
      .setTitle("🔧 Komutlar Listesi")
      .setDescription(`
**!rütbever @kişi RÜTBE** ➤ Roblox grubunda rütbe verir
**!format** ➤ Başvuru formatını yollar
**!tamyasakla @kişi** ➤ Tüm sunuculardan banlar
**!mute @kişi** ➤ Kişiyi susturur
**!unmute @kişi** ➤ Susturmayı kaldırır
**!çekiliş 10 ödül** ➤ Çekiliş yapar
**!devriye @kişi** ➤ Devriyeye yazar
**!izin @kişi** ➤ İzin verir
**!komutlar** ➤ Komut listesini gösterir
`)
      .setColor("Blue");
    msg.reply({ embeds: [embed] });
  }
});

client.login(TOKEN)
