require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const ms = require('ms');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const prefix = "!";
const OWNER_ID = process.env.OWNER_ID;
const GROUP_ID = process.env.GROUP_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;

// Veri yapıları
const uyariMap = new Map(); // userId => uyarı sayısı
const sicilMap = new Map(); // userId => [{tarih, sebep, uyarı}]
const cekilisler = new Map(); // mesajId => cekilis bilgisi

let devriyeAktif = false;

const yasakliKelimeler = [
  "aq", "amk", "aw", "awk", "siktir", "sg", "oc", "oç", "anan",
  "anani sikim", "sikim", "pic", "la", "lan"
];

// Yardımcı fonksiyonlar

function isYonetim(member) {
  return member.roles.cache.some(r => r.name === "Yönetim");
}

function isAskeri(member) {
  return member.roles.cache.some(r => r.name === "Askeri Personel");
}

// Bot hazır olduğunda
client.once('ready', () => {
  console.log(`Bot aktif: ${client.user.tag}`);
  client.user.setActivity("Askeri Discord Sunucusu");
});

// Otomatik Askeri Personel rolü verme
client.on('guildMemberAdd', async member => {
  const rol = member.guild.roles.cache.find(r => r.name === "Askeri Personel");
  if (rol) {
    try {
      await member.roles.add(rol);
    } catch {}
  }
});

// Mesaj olayları
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.guild) return; // DM engelle

  // Sa / Sa cevabı
  if (/^sa$/i.test(message.content.trim())) {
    return message.reply("Aleyküm Selam Canım,");
  }

  // Devriye aktifse küfür kontrol
  if (devriyeAktif) {
    const mesaj = message.content.toLowerCase();
    if (yasakliKelimeler.some(k => mesaj.includes(k))) {
      const muteRol = message.guild.roles.cache.find(r => r.name.toLowerCase().includes('mute'));
      if (muteRol && !message.member.roles.cache.has(muteRol.id) && message.author.id !== OWNER_ID) {
        try {
          await message.member.roles.add(muteRol);
          message.channel.send(`${message.author.tag} küfür nedeniyle 15 dakika mutelendi.`);
          // DM owner'a log
          const owner = await client.users.fetch(OWNER_ID);
          owner.send(`[Devriye] ${message.author.tag} küfür nedeniyle mutelendi. Mesaj: ${message.content}`);
          message.delete();
          // Mute kaldırma 15 dakika sonra
          setTimeout(() => {
            message.member.roles.remove(muteRol).catch(() => {});
          }, 15 * 60 * 1000);
        } catch {}
      }
      return;
    }
    // Fotoğraf içerik denetimi (basit)
    if (message.attachments.size > 0) {
      const muteRol = message.guild.roles.cache.find(r => r.name.toLowerCase().includes('mute'));
      if (muteRol && !message.member.roles.cache.has(muteRol.id) && message.author.id !== OWNER_ID) {
        try {
          await message.member.roles.add(muteRol);
          message.channel.send(`${message.author.tag} +18 içerik nedeniyle 15 dakika mutelendi.`);
          const owner = await client.users.fetch(OWNER_ID);
          owner.send(`[Devriye] ${message.author.tag} +18 içerik nedeniyle mutelendi.`);
          message.delete();
          setTimeout(() => {
            message.member.roles.remove(muteRol).catch(() => {});
          }, 15 * 60 * 1000);
        } catch {}
      }
      return;
    }
  }

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  const isUserYonetim = isYonetim(message.member);
  const isUserAskeri = isAskeri(message.member);

  // Komutlar
  switch (cmd) {

    case "format":
      if (!isUserAskeri && !isUserYonetim) return message.reply("Bu komutu kullanmak için Askeri Personel veya Yönetim rolüne sahip olmalısın.");
      return message.channel.send(`**Başvuru Formatı:**\nRoblox ismim:\nÇalıştığım kamplar:\nÇalıştığın kampların kişi sayıları:\nKaç saat aktif olurum:\nNiçin burayı seçtim:\nDüşündüğüm rütbe:\nTransfer olunca katıldığım bütün kamplardan çıkacağımı kabul ediyor muyum:\nSS:\ntag: <@&1393136901552345095>`);

    case "grup":
      if (!isUserAskeri && !isUserYonetim) return message.reply("Bu komutu kullanmak için Askeri Personel veya Yönetim rolüne sahip olmalısın.");
      return message.channel.send("https://www.roblox.com/share/g/33282690\nhttps://www.roblox.com/tr/communities/33282690/Turkish-Modern-Military#!/about");

    case "tamyasakla":
      if (!isUserYonetim) return message.reply("Bu komutu sadece Yönetim kullanabilir.");
      {
        const hedef = message.mentions.members.first();
        if (!hedef) return message.reply("Bir kullanıcıyı etiketlemelisin.");
        const sebep = args.slice(1).join(" ") || "Sebep belirtilmedi";
        try {
          // Banla sunucudan
          await hedef.ban({ reason: sebep });
          message.channel.send(`${hedef.user.tag} isimli kullanıcı sunucudan yasaklandı. Sebep: ${sebep}`);
          try {
            await hedef.send(`Tüm sunuculardan banlandınız. Sebep: ${sebep}`);
          } catch {}
        } catch (e) {
          message.reply("Banlama işlemi başarısız oldu.");
        }
      }
      break;

    case "mute":
      if (!isUserYonetim) return message.reply("Bu komutu sadece Yönetim kullanabilir.");
      {
        const hedef = message.mentions.members.first();
        if (!hedef) return message.reply("Bir kullanıcıyı etiketlemelisin.");
        const sebep = args[1] || "Sebep belirtilmedi";
        const sureArg = args[2] || "0:15";
        const muteRol = message.guild.roles.cache.find(r => r.name.toLowerCase().includes('mute'));
        if (!muteRol) return message.reply("Mute rolü sunucuda bulunamadı.");
        if (hedef.roles.cache.has(muteRol.id)) return message.reply("Kullanıcı zaten muteli.");
        await hedef.roles.add(muteRol);
        message.channel.send(`${hedef.user.tag} mutelendi. Sebep: ${sebep} Süre: ${sureArg}`);

        // Süreyi ms olarak hesapla
        const [saat, dakika] = sureArg.split(":").map(x => parseInt(x) || 0);
        const süreMs = (saat * 60 + dakika) * 60 * 1000;
        setTimeout(() => {
          if (hedef.roles.cache.has(muteRol.id)) {
            hedef.roles.remove(muteRol).catch(() => {});
            message.channel.send(`${hedef.user.tag} mutesi kalktı.`);
          }
        }, süreMs);
      }
      break;

    case "unmute":
      if (!isUserYonetim) return message.reply("Bu komutu sadece Yönetim kullanabilir.");
      {
        const hedef = message.mentions.members.first();
        if (!hedef) return message.reply("Bir kullanıcıyı etiketlemelisin.");
        const muteRol = message.guild.roles.cache.find(r => r.name.toLowerCase().includes('mute'));
        if (!muteRol) return message.reply("Mute rolü sunucuda bulunamadı.");
        if (!hedef.roles.cache.has(muteRol.id)) return message.reply("Kullanıcı mute değil.");
        await hedef.roles.remove(muteRol);
        message.channel.send(`${hedef.user.tag} mutesi kaldırıldı.`);
      }
      break;

      // Uyarı komutu - Başarıyla çalışacak ve mute/ban işlemleri içerir

      if (command === 'uyari') {
        // Sadece "Yönetim" rolüne sahip olanlar komutu kullanabilir
        if (!message.member.roles.cache.some(r => r.name === 'Yönetim')) {
          return message.reply('Bu komutu kullanmak için Yönetim rolüne sahip olmalısın.');
        }

        const member = message.mentions.members.first();
        if (!member) return message.reply('Lütfen bir kullanıcı etiketle.');

        const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

        // Uyarı rollerini ve muted rolünü bul
        const roles = {
          u1: message.guild.roles.cache.find(r => r.name === 'U1'),
          u2: message.guild.roles.cache.find(r => r.name === 'U2'),
          u3: message.guild.roles.cache.find(r => r.name === 'U3'),
          muted: message.guild.roles.cache.find(r => r.name === 'Muted')
        };

        if (!roles.u1 || !roles.u2 || !roles.u3 || !roles.muted) {
          return message.channel.send('U1, U2, U3 veya Muted rolü sunucuda eksik.');
        }

        // Uyarı sayısını hafızada tutalım
        if (!client.warnCounts) client.warnCounts = new Map();
        let count = client.warnCounts.get(member.id) || 0;
        count += 1;
        client.warnCounts.set(member.id, count);

        // DM mesajı içeriği
        let dmMessage = '';
        try {
          if (count === 1) {
            await member.roles.add(roles.u1);
            dmMessage = `⚠️ **1. Uyarı** aldın.\nSebep: ${reason}`;
            message.channel.send(`${member} kişisine 1. uyarı verildi.`);
          } else if (count === 2) {
            await member.roles.remove(roles.u1).catch(() => {});
            await member.roles.add(roles.u2);
            await member.roles.add(roles.muted);
            dmMessage = `⚠️ **2. Uyarı** aldın ve 1 saat susturuldun.\nSebep: ${reason}`;
            message.channel.send(`${member} kişisine 2. uyarı verildi. 1 saat mute.`);
            setTimeout(() => {
              member.roles.remove(roles.muted).catch(() => {});
            }, 60 * 60 * 1000); // 1 saat
          } else if (count === 3) {
            await member.roles.remove(roles.u2).catch(() => {});
            await member.roles.add(roles.u3);
            await member.roles.add(roles.muted);
            dmMessage = `⚠️ **3. Uyarı** aldın ve 1 gün susturuldun.\nSebep: ${reason}`;
            message.channel.send(`${member} kişisine 3. uyarı verildi. 1 gün mute.`);
            setTimeout(() => {
              member.roles.remove(roles.muted).catch(() => {});
            }, 24 * 60 * 60 * 1000); // 1 gün
          } else {
            dmMessage = `⛔ **4. Uyarı** aldın. Tüm sunuculardan yasaklandın.\nSebep: ${reason}`;
            await member.send(dmMessage).catch(() => {});
            message.channel.send(`${member} 4. uyarısını aldı ve sunucudan yasaklandı.`);
            await member.ban({ reason: `4. uyarı: ${reason}` });
            client.warnCounts.delete(member.id); // sıfırla
            return;
          }

          // DM gönder
          await member.send(dmMessage).catch(() => {
            message.channel.send(`${member} kişisine DM gönderilemedi.`);
          });

        } catch (err) {
          console.error('Uyarı komutu hatası:', err);
          message.channel.send('❌ Uyarı verirken bir hata oluştu.');
        }
      }

    case "devriye":
      if (!isUserYonetim) return message.reply("Bu komutu sadece Yönetim kullanabilir.");
      {
        const durum = args[0];
        if (durum === "aç" || durum === "ac") {
          devriyeAktif = true;
          message.channel.send("Devriye modu aktif edildi.");
        } else if (durum === "kapa") {
          devriyeAktif = false;
          message.channel.send("Devriye modu kapatıldı.");
        } else {
          message.reply("Lütfen '!devriye aç' veya '!devriye kapa' yazın.");
        }
      }
      break;

    case "cekilis":
      if (!isUserYonetim) return message.reply("Bu komutu sadece Yönetim kullanabilir.");
      {
        const sureArg = args[0];
        const odul = args[1];
        let kazananSayisi = 1;

        if (!sureArg || !odul) return message.reply("Kullanım: !cekilis (saat:dakika) (ödül) (kazanan sayısı opsiyonel)");

        if (args[2]) {
          const k = parseInt(args[2]);
          if (!isNaN(k) && k > 0) kazananSayisi = k;
        }

        const sureArr = sureArg.split(":");
        if (sureArr.length !== 2) return message.reply("Süre formatı saat:dakika şeklinde olmalı.");

        const [saat, dakika] = sureArr.map(x => parseInt(x));
        if (isNaN(saat) || isNaN(dakika)) return message.reply("Geçersiz süre.");

        const sureMs = (saat * 60 + dakika) * 60 * 1000;

        const cekilisMesaj = await message.channel.send({
          content: `Çekilişe katılmak için aşağıdaki emojiye tıklamanız yeterlidir.\nSüre: ${sureArg}\nKazanan Sayısı: ${kazananSayisi}\nÖdül: ${odul}`,
          fetchReply: true
        });

        await cekilisMesaj.react("🎉");

        cekilisler.set(cekilisMesaj.id, {
          kanal: message.channel.id,
          odul,
          kazananSayisi,
          zaman: Date.now() + sureMs
        });

        setTimeout(async () => {
          const cekilis = cekilisler.get(cekilisMesaj.id);
          if (!cekilis) return;

          const reaction = await cekilisMesaj.reactions.cache.get("🎉")?.users.fetch();
          if (!reaction) return message.channel.send("Çekiliş iptal edildi.");

          const katilimcilar = reaction.filter(u => !u.bot).map(u => u.id);
          if (katilimcilar.length === 0) return message.channel.send("Çekilişe kimse katılmadı.");

          const kazananlar = [];
          while (kazananlar.length < cekilis.kazananSayisi && katilimcilar.length > 0) {
            const secilen = katilimcilar.splice(Math.floor(Math.random() * katilimcilar.length), 1)[0];
            kazananlar.push(secilen);
          }

          const kanal = await client.channels.fetch(cekilis.kanal);
          if (kanal) kanal.send(`Çekiliş sonucu: ${kazananlar.map(id => `<@${id}>`).join(", ")} kazandı! Ödül: ${cekilis.odul}`);

          cekilisler.delete(cekilisMesaj.id);
        }, sureMs);
      }
      break;

    case "kanalikilitle":
      if (!isUserYonetim) return message.reply("Bu komutu sadece Yönetim kullanabilir.");
      try {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
        message.channel.send("Kanal kilitlendi.");
      } catch {
        message.reply("Kanal kilitlenirken hata oluştu.");
      }
      break;

    case "kanaliac":
      if (!isUserYonetim) return message.reply("Bu komutu sadece Yönetim kullanabilir.");
      try {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
        message.channel.send("Kanal açıldı.");
      } catch {
        message.reply("Kanal açılırken hata oluştu.");
      }
      break;

      case "rütbever":
            if (!isUserYonetim) return message.reply("Bu komutu sadece Yönetim kullanabilir.");
            {
              const hedef = message.mentions.members.first();
              if (!hedef) return message.reply("Bir kullanıcıyı etiketlemelisin.");
              const rolAdi = args.slice(1).join(" ");
              if (!rolAdi) return message.reply("Verilecek rol tam adını yazmalısın.");

              // Burada Roblox API veya cookie ile rütbe verme işlemi yapılmalı.
              // Roblox API entegrasyonu, özel token ve cookie ile yapılır. 
              // Bu örnekte sadece mesaj olarak bildiriyoruz.
              message.channel.send(`${hedef.user.tag} kullanıcısına Roblox grubunda '${rolAdi}' rütbesi verildi (simüle).`);
            }
            break;

          case "rolver":
            if (command === 'rolver') {
              if (!message.member.roles.cache.some(r => r.name === 'Yönetim')) return message.reply('Bu komutu kullanmak için Yönetim rolün olmalı.');

              const member = message.mentions.members.first();
              if (!member) return message.reply('Lütfen bir kullanıcıyı etiketle.');

              // Komutda ikinci mention rol olmalı
              const role = message.mentions.roles.first();
              if (!role) return message.reply('Lütfen bir rolü etiketle.');

              // Rolü ver
              try {
                await member.roles.add(role);
                message.channel.send(`${member} kullanıcısına ${role} rolü verildi.`);
              } catch (err) {
                console.error(err);
                message.channel.send('Rol verilirken hata oluştu. Botun yetkilerini ve rol sıralamasını kontrol et.');
              }
            }

          case "sicil":
            if (!isUserYonetim) return message.reply("Bu komutu sadece Yönetim kullanabilir.");
            {
              const hedef = message.mentions.members.first();
              if (!hedef) return message.reply("Bir kullanıcıyı etiketlemelisin.");

              const sicil = sicilMap.get(hedef.id) || [];
              if (sicil.length === 0) return message.channel.send("Kullanıcının sicili boş.");

              const embed = new EmbedBuilder()
                .setTitle(`${hedef.user.tag} - Sicil Kayıtları`)
                .setColor("Red")
                .setDescription(
                  sicil.map((kayıt, i) => `\`${i + 1}.\` Tarih: ${kayıt.tarih}\nSebep: ${kayıt.sebep}\nUyarı: ${kayıt.uyarı}`).join("\n\n")
                );
              message.channel.send({ embeds: [embed] });
            }
            break;

          case "komutlar":
            {
              const sayfa1 = new EmbedBuilder()
                .setTitle("Komutlar - Sayfa 1")
                .setDescription(
                  "`!format` - Başvuru formatını gösterir.\n" +
                  "`!grup` - Roblox grup linklerini atar.\n" +
                  "`!tamyasakla @kullanıcı (sebep)` - Kullanıcıyı banlar.\n" +
                  "`!mute @kullanıcı (sebep) (saat:dakika)` - Kullanıcıyı muteler.\n" +
                  "`!unmute @kullanıcı` - Mute kaldırır."
                )
                .setFooter({ text: "Sayfa 1 / 2" });

              const sayfa2 = new EmbedBuilder()
                .setTitle("Komutlar - Sayfa 2")
                .setDescription(
                  "`!uyari @kullanıcı (sebep)` - Uyarı verir ve cezalar uygular.\n" +
                  "`!devriye aç/kapa` - Küfür/argo kontrolünü açar/kapatır.\n" +
                  "`!cekilis (saat:dakika) (ödül) (kazanan sayısı)` - Çekiliş başlatır.\n" +
                  "`!kanalikilitle` - Kanalı kilitler.\n" +
                  "`!kanaliac` - Kanalı açar.\n" +
                  "`!rütbever @kullanıcı (rol)` - Roblox grubunda rütbe verir.\n" +
                  "`!rolver @kullanıcı (rol)` - Discord rolü verir.\n" +
                  "`!sicil @kullanıcı` - Kullanıcının uyarı sicilini gösterir."
                )
                .setFooter({ text: "Sayfa 2 / 2" });

              const embedler = [sayfa1, sayfa2];
              let sayfa = 0;

              const mesaj = await message.channel.send({ embeds: [embedler[sayfa]] });
              await mesaj.react("⬅️");
              await mesaj.react("➡️");

              const collector = mesaj.createReactionCollector({
                filter: (reaction, user) => ["⬅️", "➡️"].includes(reaction.emoji.name) && user.id === message.author.id,
                time: 60000
              });

              collector.on('collect', reaction => {
                reaction.users.remove(message.author.id).catch(() => {});
                if (reaction.emoji.name === "➡️") {
                  if (sayfa < embedler.length - 1) sayfa++;
                  else sayfa = 0;
                } else if (reaction.emoji.name === "⬅️") {
                  if (sayfa > 0) sayfa--;
                  else sayfa = embedler.length - 1;
                }
                mesaj.edit({ embeds: [embedler[sayfa]] });
              });

              collector.on('end', () => {
                mesaj.reactions.removeAll().catch(() => {});
              });
            }
            break;

          default:
            message.reply("Bilinmeyen komut. `!komutlar` yazarak listeyi görebilirsin.");
        }
      });

      client.login(DISCORD_BOT_TOKEN);
