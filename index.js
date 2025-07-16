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
// ElForsa Bot - Genişletilmiş Komutlar ve Sistemler
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, PermissionsBitField } = require("discord.js");
const noblox = require("noblox.js");
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();
const prefix = "!";
const adminID = "<@YOUR_USER_ID>"; // örn: @forsdeving

const warningData = new Map(); // Kullanıcı uyarı kayıtları için

// === BOT MESAJ KOMUTLARI ===
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // === SELAM KOMUTU ===
  if (message.content.toLowerCase() === "sa") {
    return message.reply("Aleyküm selam canım");
  }

  // === !format ===
  if (command === "format") {
    const embed = new EmbedBuilder()
      .setTitle("Başvuru Formatı")
      .setDescription(`**Roblox ismim:**\n**Çalıştığım kamplar:**\n**Çalıştığın kampların kişi sayıları:**\n**Kaç saat aktif olurum:**\n**Niçin burayı seçtim:**\n**Düşündüğüm rütbe:**\n**Transfer olunca katıldığım bütün kamplardan çıkacağımı kabul ediyor muyum:**\n**Ss:**\n**tag:** <@&1393136901552345095>`)
      .setColor("Blue");
    message.channel.send({ embeds: [embed] });
  }

  // === !rütbever ===
  if (command === "rütbever") {
    const member = message.mentions.users.first();
    const rank = args.slice(1).join(" ");
    if (!member || !rank) return message.reply("Kullanıcıyı ve rütbeyi belirt.");
    message.reply(`✔️ ${member} kişisinin Roblox rütbesi \\`${rank}\\` olarak ayarlandı.`);
    // Buraya noblox kodu eklenebilir
  }

  // === !rolver ===
  if (command === "rolver") {
    const member = message.mentions.members.first();
    const roles = message.mentions.roles;
    if (!member || roles.size === 0) return message.reply("Kullanıcı ve en az bir rol belirt.");
    roles.forEach(role => member.roles.add(role));
    message.reply(`${member} kullanıcısına roller verildi.`);
  }

  // === !tamyasakla ===
  if (command === "tamyasakla") {
    const member = message.mentions.members.first();
    const reason = args.slice(1).join(" ") || "Sebep belirtilmedi";
    if (!member) return message.reply("Bir kullanıcı belirt.");
    await member.ban({ reason });
    message.reply(`${member} sunucudan yasaklandı. Sebep: ${reason}`);
    member.send(`**Sunucudan yasaklandın. Sebep:** ${reason}`).catch(() => {});
  }

  // === !mute ===
  if (command === "mute") {
    const member = message.mentions.members.first();
    const time = args[1];
    const muteRole = message.guild.roles.cache.find(r => r.name === "Muted");
    if (!member || !muteRole) return message.reply("Kullanıcıyı ya da mute rolünü bulamadım.");

    await member.roles.add(muteRole);
    message.reply(`${member} susturuldu.`);

    if (time) {
      const [saat, dakika] = time.split(":").map(Number);
      const ms = (saat * 60 + dakika) * 60 * 1000;
      setTimeout(() => member.roles.remove(muteRole), ms);
    }
  }

  // === !unmute ===
  if (command === "unmute") {
    const member = message.mentions.members.first();
    const muteRole = message.guild.roles.cache.find(r => r.name === "Muted");
    if (!member || !muteRole) return message.reply("Kullanıcıyı ya da mute rolünü bulamadım.");
    await member.roles.remove(muteRole);
    message.reply(`${member} susturması kaldırıldı.`);
  }

  // === !uyari ===
  if (command === "uyari") {
    const member = message.mentions.members.first();
    const reason = args.slice(1).join(" ");
    if (!member || !reason) return message.reply("Kullanıcı ve sebep belirt.");

    let uyarilar = warningData.get(member.id) || 0;
    uyarilar++;
    warningData.set(member.id, uyarilar);

    if (uyarilar === 1) member.roles.add(message.guild.roles.cache.find(r => r.name === "U1"));
    if (uyarilar === 2) {
      member.roles.add(message.guild.roles.cache.find(r => r.name === "U2"));
      const muteRole = message.guild.roles.cache.find(r => r.name === "Muted");
      member.roles.add(muteRole);
      setTimeout(() => member.roles.remove(muteRole), 60 * 60 * 1000);
    }
    if (uyarilar === 3) {
      member.roles.add(message.guild.roles.cache.find(r => r.name === "U3"));
      const muteRole = message.guild.roles.cache.find(r => r.name === "Muted");
      member.roles.add(muteRole);
      setTimeout(() => member.roles.remove(muteRole), 24 * 60 * 60 * 1000);
    }
    if (uyarilar >= 4) {
      member.roles.add(message.guild.roles.cache.find(r => r.name === "U4"));
      member.ban({ reason: "4. uyarıya ulaştı." });
    }

    message.reply(`${member} kullanıcısı uyarıldı. Sebep: ${reason}`);
  }

  // === !sicil ===
  if (command === "sicil") {
    const member = message.mentions.members.first();
    const uyarilar = warningData.get(member.id) || 0;
    message.reply(`${member} kullanıcısının toplam ${uyarilar} uyarısı var.`);
  }

  // === !komutlar ===
  if (command === "komutlar") {
    const embed = new EmbedBuilder()
      .setTitle("ElForsa BOT Komutlar")
      .setColor("Green")
      .setDescription(`**!format**: Başvuru formatını atar\n**!rütbever**: Roblox grubunda rütbe verir\n**!rolver**: Kullanıcıya 1-5 rol verir\n**!tamyasakla**: Sunucudan banlar\n**!mute**: Kullanıcıyı susturur\n**!unmute**: Mute kaldırır\n**!uyari**: Uyarı sistemi\n**!sicil**: Uyarı bilgisi\n**!komutlar**: Komut listesini gösterir`);
    message.channel.send({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
