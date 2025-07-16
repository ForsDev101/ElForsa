// Ana dosya: index.js

const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Partials } = require("discord.js");
require("dotenv").config();
const noblox = require("noblox.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const prefix = "!";
const GROUP_ID = 332826996;
const OWNER_ID = "1393136901552345095"; // @forsdeving
const sohbetModu = true;
let uyarilar = {};

function kaydet() {
  fs.writeFileSync("uyarilar.json", JSON.stringify(uyarilar, null, 2));
}
try {
  const data = fs.readFileSync("uyarilar.json");
  Object.assign(uyarilar, JSON.parse(data));
} catch {}

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  const content = msg.content.toLowerCase();
  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (content === "sa") return msg.reply("Aleyküm selam canım");

  if (command === "format") {
    const embed = new EmbedBuilder()
      .setTitle("📌 Başvuru Formatı")
      .setDescription("**Roblox ismin:**\n**Çalıştığın kamplar:**\n**Kamp kişi sayısı:**")
      .setColor("Blue");
    return msg.reply({ embeds: [embed] });
  }

  if (command === "komutlar") {
    const embed = new EmbedBuilder()
      .setTitle("🔧 Komutlar Listesi")
      .setDescription(`
**!rütbever @kişi RÜTBE**
**!tamyasakla @kişi**
**!mute @kişi**
**!unmute @kişi**
**!çekiliş süre ödül**
**!izin**, **!devriye**
**!komutlar**, **!format**
**!sohbetac / !sohbetkapat**
`)
      .setColor("Green");
    return msg.reply({ embeds: [embed] });
  }

  // Roblox rütbe verme
  if (command === "rütbever") {
    const member = msg.mentions.users.first();
    const rank = args.slice(1).join(" ");
    if (!member || !rank) return msg.reply("Kullanıcıyı ve rütbeyi belirt.");
    msg.reply(`✅ ${member} kullanıcısının rütbesi **${rank}** olarak ayarlandı.`);
    // Roblox API bağlantısı buraya entegre edilebilir
  }

  if (command === "tamyasakla") {
    const user = msg.mentions.users.first();
    if (!user) return msg.reply("Birini etiketlemelisin.");
    client.guilds.cache.forEach(guild => {
      const member = guild.members.cache.get(user.id);
      if (member) member.ban({ reason: "TAM YASAK" }).catch(() => {});
    });
    msg.reply(`🚫 ${user.username} tüm sunuculardan yasaklandı.`);
  }

  if (command === "mute") {
    const member = msg.mentions.members.first();
    if (!member) return msg.reply("Birini etiketlemelisin.");
    member.timeout(1000 * 60 * 10);
    msg.reply(`${member} 10 dakika susturuldu.`);
  }

  if (command === "unmute") {
    const member = msg.mentions.members.first();
    if (!member) return msg.reply("Birini etiketlemelisin.");
    member.timeout(null);
    msg.reply(`${member} susturması kaldırıldı.`);
  }

  if (command === "çekiliş") {
    const süre = args[0];
    const ödül = args.slice(1).join(" ");
    if (!süre || !ödül) return msg.reply("Süre ve ödül girin.");
    const embed = new EmbedBuilder()
      .setTitle("🎉 Çekiliş!")
      .setDescription(`Ödül: ${ödül}\nSüre: ${süre}`)
      .setFooter({ text: "Katılmak için 🎉 emojisine tıkla!" });
    const mesaj = await msg.channel.send({ embeds: [embed] });
    mesaj.react("🎉");
  }

  if (command === "izin") msg.reply("İzin alındı.");
  if (command === "devriye") msg.reply("Devriye başlatıldı.");
});

// Küfür/foto/uyarı sistemi
client.on("messageCreate", msg => {
  const küfürler = ["amk", "siktir", "orospu", "anan"];
  const uygunsuz = küfürler.some(k => msg.content.toLowerCase().includes(k));
  const içerik = msg.content.toLowerCase();

  if (uygunsuz || msg.attachments.size > 0) {
    const id = msg.author.id;
    uyarilar[id] = (uyarilar[id] || 0) + 1;
    kaydet();
    msg.reply(`⚠️ Kurallara uymadın. Uyarı: ${uyarilar[id]}`);
    client.users.fetch(OWNER_ID).then(u => {
      u.send(`⚠️ ${msg.author.tag} kural ihlali yaptı: ${msg.content}`);
    });
  }
});

// Sohbet komutları
client.on("messageCreate", msg => {
  if (!sohbetModu || !msg.mentions.has(client.user)) return;
  const soru = msg.content.split(" ").slice(1).join(" ");
  if (soru.length < 2) return msg.reply("Evet, askerim?");
  const cevaplar = [
    "Bunu Komutan Forsa'ya sorman gerekebilir.",
    "Şu an bir tatbikat var, sonra sor.",
    "Güzel soru, ama emir bekleniyor.",
  ];
  msg.reply(cevaplar[Math.floor(Math.random() * cevaplar.length)]);
});

client.login(process.env.DISCORD_TOKEN);
