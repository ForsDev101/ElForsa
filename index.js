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
        if (!message.member.roles.cache.some(r => r.name === 'Yönetim')) 
          return message.reply('Bu komutu kullanmak için Yönetim rolün olmalı.');

        const member = message.mentions.members.first();
        if (!member) return message.reply('Lütfen bir kullanıcıyı etiketle.');

        const reason = args.slice(1).join(' ');
        if (!reason) return message.reply('Lütfen uyarı sebebini yaz.');

        // Kullanıcıya verilecek roller
        const u1Role = message.guild.roles.cache.find(r => r.name === 'U1');
        const u2Role = message.guild.roles.cache.find(r => r.name === 'U2');
        const u3Role = message.guild.roles.cache.find(r => r.name === 'U3');
        const mutedRole = message.guild.roles.cache.find(r => r.name === 'Muted');

        if (!u1Role || !u2Role || !u3Role) 
          return message.channel.send('Uyarı rolleri (U1, U2, U3) sunucuda eksik!');

        if (!mutedRole) 
          return message.channel.send('Muted rolü sunucuda bulunamadı!');

        // Kullanıcının mevcut uyarı sayısını al (basit şekilde, DB yoksa Map veya JSON ile saklanmalı)
        // Burada örnek olarak hafızada tutuyoruz:
        if (!client.warningMap) client.warningMap = new Map();
        let warnings = client.warningMap.get(member.id) || 0;
        warnings++;

        // Yeni uyarı sayısını kaydet
        client.warningMap.set(member.id, warnings);

        // Uyarı işlemleri
        let dmMessage = '';
        try {
          switch (warnings) {
            case 1:
              await member.roles.add(u1Role);
              dmMessage = `Sunucuda 1. uyarını aldın.\nSebep: ${reason}`;
              message.channel.send(`${member} 1. uyarı aldı.`);
              break;

            case 2:
              await member.roles.remove(u1Role).catch(() => {});
              await member.roles.add(u2Role);
              if (mutedRole) await member.roles.add(mutedRole);
              dmMessage = `Sunucuda 2. uyarını aldın ve 1 saat mutelendin.\nSebep: ${reason}`;
              message.channel.send(`${member} 2. uyarı aldı ve 1 saat mute verildi.`);
              // 1 saat sonra mute kaldır
              setTimeout(async () => {
                try {
                  await member.roles.remove(mutedRole);
                } catch {}
              }, 3600000);
              break;

            case 3:
              await member.roles.remove(u2Role).catch(() => {});
              await member.roles.add(u3Role);
              if (mutedRole) await member.roles.add(mutedRole);
              dmMessage = `Sunucuda 3. uyarını aldın ve 1 gün mutelendin.\nSebep: ${reason}`;
              message.channel.send(`${member} 3. uyarı aldı ve 1 gün mute verildi.`);
              // 1 gün sonra mute kaldır
              setTimeout(async () => {
                try {
                  await member.roles.remove(mutedRole);
                } catch {}
              }, 86400000);
              break;

            default:
              // 4 veya daha fazla uyarıda sunucudan banla
              dmMessage = `Sunucudan yasaklandın! Sebep: ${reason}`;
              message.channel.send(`${member} 4 veya daha fazla uyarı aldı, sunucudan yasaklandı.`);
              await member.ban({ reason: `4 veya daha fazla uyarı: ${reason}` });
              // Hafızadan temizle
              client.warningMap.delete(member.id);
              break;
          }

          // Kullanıcıya DM gönder
          try {
            await member.send(dmMessage);
          } catch {
            message.channel.send('Kullanıcı DM kapalı veya gönderilemiyor.');
          }
        } catch (error) {
          console.error('Uyarı komutu hatası:', error);
          message.channel.send('Uyarı verilirken bir hata oluştu.');
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
            if (!isUserYonetim) return message.reply("Bu komutu sadece Yönetim kullanabilir.");
            {
              const hedef = message.mentions.members.first();
              if (!hedef) return message.reply("Bir kullanıcıyı etiketlemelisin.");
              const rolAdi = args.slice(1).join(" ");
              if (!rolAdi) return message.reply("Verilecek rol tam adını yazmalısın.");

              const rol = message.guild.roles.cache.find(r => r.name === rolAdi);
              if (!rol) return message.reply("Rol sunucuda bulunamadı.");

              if (hedef.roles.cache.size >= 5) return message.reply("Kullanıcıya en fazla 5 rol verilebilir.");

              if (hedef.roles.cache.has(rol.id)) return message.reply("Kullanıcıda zaten bu rol var.");

              try {
                await hedef.roles.add(rol);
                message.channel.send(`${hedef.user.tag} kullanıcısına '${rolAdi}' rolü verildi.`);
              } catch {
                message.reply("Rol verme işlemi başarısız oldu.");
              }
            }
            break;

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
