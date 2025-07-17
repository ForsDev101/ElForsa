require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const noblox = require('noblox.js');

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

const PREFIX = '!';
const OWNER_ID = process.env.OWNER_ID;
let devriyeAcilmis = false;
const kufurListesi = ['amk','aq','siktir','anan','oç','amq','awk','oc','sg','orospu','yarrak','göt','piç','sik','sex','porno','la','lan'];
const uyariData = new Map();
const sicil = new Map();
const komutSayfalari = [
  "**Sayfa 1:**\n!format\n!grup\n!uyari\n!sicil\n!sicilsil (madde)\n!tamyasakla @kişi (sebep)",
  "**Sayfa 2:**\n!mute @kişi (sebep) (süre)\n!unmute @kişi\n!devriye aç/kapa\n!çekiliş saat:dakika ödül (kazanan sayısı)\n!rütbever @kişi robloxAdı rütbe\n!rütbelistesi",
  "**Sayfa 3:**\n!rolver @kişi @rol\n!komutlar\n!kanalikilitle\n!kanaliac\n!yetkili mesaj\n!bildir mesaj"
];

client.on('ready', () => {
  console.log(`Bot aktif: ${client.user.tag}`);
});

client.on('guildMemberAdd', member => {
  const role = member.guild.roles.cache.find(r => r.name === 'Askeri Personel');
  if (role) member.roles.add(role).catch(console.error);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === 'sa') return message.reply('Aleyküm Selam Canım');
  if (!message.content.startsWith(PREFIX)) return;
  const [command, ...args] = message.content.slice(PREFIX.length).trim().split(/ +/);

  const isYonetim = message.member.roles.cache.some(r => r.name === 'Yönetim');
  const isAskeri = message.member.roles.cache.some(r => r.name === 'Askeri Personel');
  if (!isYonetim && !['format','grup'].includes(command)) return;

  if (devriyeAcilmis && kufurListesi.some(k => message.content.toLowerCase().includes(k))) {
    const muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
    if (muteRole && !message.member.roles.cache.has(muteRole.id)) {
      await message.member.roles.add(muteRole);
      setTimeout(() => message.member.roles.remove(muteRole), 15 * 60 * 1000);
      sicil.set(message.author.id, (sicil.get(message.author.id) || []).concat(`[Devriye] Küfür: ${message.content}`));
    }
    return message.reply("Küfür tespit edildi, 15dk mute atıldı.");
  }

  if (command === 'format') {
    return message.channel.send(`**Başvuru Formatı:**\nRoblox ismim:\nÇalıştığım kamplar:\nÇalıştığın kampların kişi sayıları:\nKaç saat aktif olurum:\nNiçin burayı seçtim:\nDüşündüğüm rütbe:\nTransfer olunca katıldığım bütün kamplardan çıkacağımı kabul ediyor muyum:\nSS:\ntag: <@&1393136901552345095>`);
  }

  if (command === 'grup') {
    return message.channel.send(`https://www.roblox.com/share/g/33282690\nhttps://www.roblox.com/tr/communities/33282690/Turkish-Modern-Military#!/about`);
  }

  if (command === 'devriye') {
    if (args[0] === 'aç') devriyeAcilmis = true;
    else if (args[0] === 'kapa') devriyeAcilmis = false;
    return message.reply(`Devriye ${devriyeAcilmis ? 'açıldı' : 'kapatıldı'}`);
  }

  if (command === 'mute') {
    const member = message.mentions.members.first();
    const sure = args.pop();
    const reason = args.slice(1).join(" ") || 'Sebep yok';
    const muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
    if (member && muteRole) {
      await member.roles.add(muteRole);
      const [saat, dakika] = sure.split(":").map(Number);
      setTimeout(() => member.roles.remove(muteRole), ((saat * 60) + dakika) * 60000);
      message.channel.send(`${member} mutelendi. Sebep: ${reason}`);
    }
  }

  if (command === 'unmute') {
    const member = message.mentions.members.first();
    const muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
    if (member && muteRole) {
      await member.roles.remove(muteRole);
      message.channel.send(`${member} unmute edildi.`);
    }
  }

  if (command === 'uyari') {
    const member = message.mentions.members.first();
    const reason = args.slice(1).join(" ");
    let count = (uyariData.get(member.id) || 0) + 1;
    uyariData.set(member.id, count);
    sicil.set(member.id, (sicil.get(member.id) || []).concat(`[Uyarı ${count}]: ${reason}`));
    try { await member.send(`Uyarıldınız (${count}): ${reason}`); } catch {}
    const roles = ['U1','U2','U3'];
    const muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
    if (count <= 3) {
      const rol = message.guild.roles.cache.find(r => r.name === roles[count - 1]);
      if (rol) await member.roles.add(rol);
    }
    if (count === 2 && muteRole) {
      await member.roles.add(muteRole);
      setTimeout(() => member.roles.remove(muteRole), 3600000);
    }
    if (count === 3 && muteRole) {
      await member.roles.add(muteRole);
      setTimeout(() => member.roles.remove(muteRole), 86400000);
    }
    if (count >= 4) await member.ban({ reason: '4. uyarı' });
    message.channel.send(`${member} uyarıldı (${count})`);
  }

  if (command === 'sicil') {
    const member = message.mentions.members.first();
    const sicilList = sicil.get(member.id) || ["Temiz."];
    return message.channel.send(`**Sicil:**\n- ${sicilList.join("\n- ")}`);
  }

  if (command === 'sicilsil') {
    const id = message.mentions.members.first()?.id;
    const madde = args.slice(1).join(" ");
    if (id && madde) {
      const eski = sicil.get(id) || [];
      sicil.set(id, eski.filter(x => !x.includes(madde)));
      message.channel.send("Sicil maddesi silindi.");
    }
  }

  if (command === 'çekiliş') {
    const timeArg = args[0];
    const reward = args.slice(1, -1).join(" ");
    const winnerCount = parseInt(args[args.length - 1]) || 1;
    const [saat, dakika] = timeArg.split(":").map(Number);
    const totalMs = (saat * 60 + dakika) * 60000;
    const embed = new EmbedBuilder().setTitle("🎉 Çekiliş Başladı!").setDescription(`Ödül: **${reward}**\nKazanan: ${winnerCount} kişi`).setFooter({ text: "Katılmak için 🎉'ye tıklayın!" });
    const msg = await message.channel.send({ embeds: [embed] });
    await msg.react("🎉");
    setTimeout(async () => {
      const reaction = msg.reactions.cache.get("🎉");
      await reaction.users.fetch();
      const users = reaction.users.cache.filter(u => !u.bot).map(u => u);
      const winners = users.sort(() => 0.5 - Math.random()).slice(0, winnerCount);
      message.channel.send(`Kazananlar: ${winners.map(w => `<@${w.id}>`).join(", ")}`);
    }, totalMs);
  }

  if (command === 'komutlar') {
    let sayfa = 0;
    const embed = new EmbedBuilder().setTitle("Komutlar").setDescription(komutSayfalari[sayfa]);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('geri').setLabel('◀️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ileri').setLabel('▶️').setStyle(ButtonStyle.Secondary)
    );
    const msg = await message.channel.send({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 60000 });
    collector.on('collect', async i => {
      if (i.user.id !== message.author.id) return i.reply({ content: "Bu düğme sana ait değil.", ephemeral: true });
      if (i.customId === 'geri') sayfa = (sayfa - 1 + komutSayfalari.length) % komutSayfalari.length;
      if (i.customId === 'ileri') sayfa = (sayfa + 1) % komutSayfalari.length;
      await i.update({ embeds: [embed.setDescription(komutSayfalari[sayfa])] });
    });
  }

  if (command === 'rütbever') {
    const member = message.mentions.members.first();
    const robloxName = args[1];
    const rankName = args.slice(2).join(" ");
    try {
      const robloxUser = await noblox.getIdFromUsername(robloxName);
      const roles = await noblox.getRoles(Number(process.env.GROUP_ID));
      const role = roles.find(r => r.name.toLowerCase() === rankName.toLowerCase());
      if (!role) return message.reply("Rütbe bulunamadı.");
      await noblox.setRank(Number(process.env.GROUP_ID), robloxUser, role.rank);
      message.channel.send(`✅ ${member} (${robloxName}) kişisine ${rankName} rütbesi verildi.`);
    } catch (err) {
      console.log(err);
      message.reply("Bir hata oluştu. Roblox adı yanlış olabilir.");
    }
  }

  if (command === 'rütbelistesi') {
    const roles = await noblox.getRoles(Number(process.env.GROUP_ID));
    const list = roles.map(r => `${r.name} (${r.rank})`).join("\n");
    message.channel.send("**Rütbe Listesi:**\n" + list);
  }

  if (command === 'rolver') {
    const member = message.mentions.members.first();
    const rol = message.mentions.roles.first();
    if (!member || !rol) return message.reply("Kullanım: !rolver @kişi @rol");
    const currentRoles = member.roles.cache;
    if (currentRoles.size >= 5) return message.reply("Bu kişiye en fazla 5 rol verilebilir.");
    await member.roles.add(rol);
    message.channel.send(`${member} kişisine ${rol.name} rolü verildi.`);
  }

  if (command === 'kanalikilitle') {
    message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false });
    message.channel.send("🔒 Kanal kilitlendi.");
  }

  if (command === 'kanaliac') {
    message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: true });
    message.channel.send("🔓 Kanal açıldı.");
  }

  if (command === 'yetkili') {
    const mesaj = args.join(" ");
    const yonetim = message.guild.roles.cache.find(r => r.name === 'Yönetim');
    if (!yonetim) return;
    yonetim.members.forEach(m => m.send(`Yetkili çağrısı: ${mesaj}`));
    message.channel.send("Yönetim bilgilendirildi.");
  }

  if (command === 'bildir') {
    const mesaj = args.join(" ");
    const yonetim = message.guild.roles.cache.find(r => r.name === 'Yönetim');
    if (!yonetim) return;
    yonetim.members.forEach(m => m.send(`Bildiri: ${mesaj}`));
    message.channel.send("Yönetim bilgilendirildi.");
  }

  if (command === 'tamyasakla') {
    const member = message.mentions.members.first();
    const reason = args.slice(1).join(" ") || 'Sebep belirtilmedi';
    if (!member) return message.reply("Kullanım: !tamyasakla @kişi (sebep)");
    await member.send(`Aşağıdaki sunuculardan banlandınız: ${client.guilds.cache.map(g => g.name).join(", ")}\nSebep: ${reason}`).catch(() => {});
    client.guilds.cache.forEach(guild => {
      const target = guild.members.cache.get(member.id);
      if (target) target.ban({ reason });
    });
    message.channel.send(`${member.user.tag} kullanıcısı tamamen yasaklandı.`);
  }
});

noblox.setCookie(process.env.ROBLOX_COOKIE).then(() => console.log('Roblox giriş yapıldı')).catch(console.error);
client.login(process.env.DISCORD_BOT_TOKEN);
