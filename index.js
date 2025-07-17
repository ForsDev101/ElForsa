
// Ana bot dosyası (index.js)

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const { Group } = require('noblox.js'); // Roblox işlemleri için noblox.js kullanılıyor

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

// Çevresel değişkenler
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const OWNER_ID = process.env.OWNER_ID;
const GROUP_ID = parseInt(process.env.GROUP_ID);
const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;

// Roller (rol isimlerini veya ID'leri .env den alabilirsin)
const ROL_YONETIM = 'Yönetim';
const ROL_ASKERI_PERSONEL = 'Askeri Personel';
const ROL_MUTE = 'Muted';
const ROL_U1 = 'U1';
const ROL_U2 = 'U2';
const ROL_U3 = 'U3';

// Küfür/argo listesi (geliştirilebilir)
const KUFURLER = [
  'aq', 'amk', 'aw', 'awk', 'siktir', 'sg', 'oc', 'oç',
  'anan', 'anani sikim', 'sikim', 'pic', 'la', 'lan',
];

// Değişkenler
let devriyeAktif = false;
const uyariSayilari = new Map(); // KullanıcıID => uyarı sayısı
const muteLog = new Map(); // Mute atılanlar (kullanıcıID => timeoutID)
const sicilMap = new Map(); // KullanıcıID => [{sebep, tarih}]

// noblox.js ile roblox oturumu aç
const noblox = require('noblox.js');

async function robloxLogin() {
  try {
    await noblox.setCookie(ROBLOX_COOKIE);
    console.log('Roblox hesabına giriş yapıldı.');
  } catch (err) {
    console.error('Roblox cookie ile giriş başarısız:', err);
    process.exit(1);
  }
}

// Yardımcı fonksiyonlar
function rolBul(guild, isim) {
  return guild.roles.cache.find(r => r.name === isim);
}

function yetkiliMi(uye) {
  return uye.roles.cache.some(r => r.name === ROL_YONETIM);
}

async function muteVer(uye, sureMs, sebep = 'Belirtilmedi') {
  const muteRol = rolBul(uye.guild, ROL_MUTE);
  if (!muteRol) return false;

  if (uye.roles.cache.has(muteRol.id)) return false; // Zaten mute'lu

  await uye.roles.add(muteRol);
  // Süre sonunda mute kaldır
  if (sureMs > 0) {
    if (muteLog.has(uye.id)) clearTimeout(muteLog.get(uye.id));
    const timeout = setTimeout(async () => {
      if (uye.roles.cache.has(muteRol.id)) await uye.roles.remove(muteRol);
      muteLog.delete(uye.id);
    }, sureMs);
    muteLog.set(uye.id, timeout);
  }
  return true;
}

async function muteKaldir(uye) {
  const muteRol = rolBul(uye.guild, ROL_MUTE);
  if (!muteRol) return false;

  if (!uye.roles.cache.has(muteRol.id)) return false;

  await uye.roles.remove(muteRol);
  if (muteLog.has(uye.id)) {
    clearTimeout(muteLog.get(uye.id));
    muteLog.delete(uye.id);
  }
  return true;
}

function dmGonder(kisi, mesaj) {
  kisi.send(mesaj).catch(() => { });
}

function bugZaman() {
  return new Date().toLocaleString('tr-TR');
}

// Bot hazır olunca roblox girişini yap
client.once('ready', async () => {
  console.log(`Bot ${client.user.tag} olarak giriş yaptı.`);
  await robloxLogin();
});

// Sunucuya yeni katılanlara otomatik rol verme
client.on('guildMemberAdd', async member => {
  try {
    const rol = rolBul(member.guild, ROL_ASKERI_PERSONEL);
    if (rol && !member.roles.cache.has(rol.id)) {
      await member.roles.add(rol);
    }
  } catch {
    // Hata logu veya sessizce geç
  }
});

// Mesaj dinleme ve komut işlemleri
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.guild) return; // Sadece sunucularda

  // sa veya Sa yazınca cevap verme
  if (message.content.toLowerCase() === 'sa') {
    await message.channel.send('Aleyküm Selam Canım,');
    return;
  }

  // Devriye aktifse küfür denetle
  if (devriyeAktif) {
    const mesajLower = message.content.toLowerCase();
    if (KUFURLER.some(kufur => mesajLower.includes(kufur))) {
      // Küfür bulundu, mute ata
      const muteRol = rolBul(message.guild, ROL_MUTE);
      if (!muteRol) return;

      const uye = message.member;
      if (!uye.roles.cache.has(muteRol.id)) {
        await muteVer(uye, 15 * 60 * 1000, 'Devriye: Küfür kullanımı');
        await message.channel.send(`${uye} küfür nedeniyle 15 dakika mutelandı.`);
        // Logu ownera DM ile gönder
        const owner = await client.users.fetch(OWNER_ID);
        dmGonder(owner, `${uye.user.tag} küfür nedeniyle 15 dakika mutelandı. Mesaj: ${message.content}`);
      }
      await message.delete().catch(() => { });
      return;
    }
  }

  // Komut kontrolü
  if (!message.content.startsWith('!')) return;
  const args = message.content.slice(1).trim().split(/ +/);
  const komut = args.shift().toLowerCase();

  const uye = message.member;

  // Yardımcı: Rol kontrolü
  function kullaniciRol(varlik) {
    return uye.roles.cache.some(r => r.name === varlik);
  }

  // Komutlar:

  // !format
  if (komut === 'format') {
    if (!kullaniciRol(ROL_ASKERI_PERSONEL)) return message.reply('Bu komutu kullanmak için Askeri Personel rolüne sahip olmalısın.');
    const formatMetin = `**Başvuru Formatı:**
Roblox ismim:
Çalıştığım kamplar:
Çalıştığın kampların kişi sayıları:
Kaç saat aktif olurum:
Niçin burayı seçtim:
Düşündüğüm rütbe:
Transfer olunca katıldığım bütün kamplardan çıkacağımı kabul ediyor muyum:
SS:
tag: <@&1393136901552345095>`;
    await message.channel.send(formatMetin);
    return;
  }

  // !grup
  if (komut === 'grup') {
    if (!kullaniciRol(ROL_ASKERI_PERSONEL)) return message.reply('Bu komutu kullanmak için Askeri Personel rolüne sahip olmalısın.');
    await message.channel.send('https://www.roblox.com/share/g/33282690');
    await message.channel.send('https://www.roblox.com/tr/communities/33282690/Turkish-Modern-Military#!/about');
    return;
  }

  // Buradan sonra yalnızca Yönetim rolü olanlar kullanabilir
  if (!yetkiliMi(uye)) return message.reply('Bu komutları kullanmak için Yönetim rolüne sahip olmalısın.');

  // !tamyasakla @kisi (sebep)
  if (komut === 'tamyasakla') {
    const kisi = message.mentions.members.first();
    if (!kisi) return message.reply('Lütfen yasaklanacak kişiyi etiketle.');
    const sebep = args.slice(1).join(' ') || 'Sebep belirtilmedi';
    try {
      await kisi.ban({ reason: sebep });
      message.channel.send(`${kisi.user.tag} tüm sunuculardan yasaklandı. Sebep: ${sebep}`);
      dmGonder(kisi.user, `Tüm sunuculardan yasaklandınız. Sebep: ${sebep}`);
    } catch (err) {
      message.reply('Ban işlemi başarısız oldu.');
    }
    return;
  }

  // !mute @kisi (sebep) (süre saat:dakika)
  if (komut === 'mute') {
    const muteKisi = message.mentions.members.first();
    if (!muteKisi) return message.reply('Mutelemek istediğin kişiyi etiketlemelisin.');

    const sureArg = args.find(a => a.match(/^\d+:\d+$/));
    const sebepArg = args.filter(a => !a.match(/^\d+:\d+$/)).slice(1).join(' ') || 'Belirtilmedi';

    if (!rolBul(message.guild, ROL_MUTE)) return message.reply('Mute rolü bulunamadı.');

    if (muteKisi.roles.cache.has(rolBul(message.guild, ROL_MUTE).id))
      return message.reply('Bu kullanıcı zaten mute\'lu.');

    let sureMs = 0;
    if (sureArg) {
      const [saat, dakika] = sureArg.split(':').map(Number);
      sureMs = (saat * 60 + dakika) * 60 * 1000;
    }

    const basarili = await muteVer(muteKisi, sureMs, sebepArg);
    if (basarili) {
      message.channel.send(`${muteKisi.user.tag} mutelandı. Sebep: ${sebepArg} Süre: ${sureArg || 'Süre belirtilmedi'}`);
      dmGonder(muteKisi.user, `Sunucuda mutelandınız. Sebep: ${sebepArg} Süre: ${sureArg || 'Süre belirtilmedi'}`);
    } else {
      message.reply('Mute işlemi başarısız ya da zaten mute\'lu.');
    }
    return;
  }

  // !unmute @kisi
  if (komut === 'unmute') {
    const unmuteKisi = message.mentions.members.first();
    if (!unmuteKisi) return message.reply('Unmute etmek istediğin kişiyi etiketle.');

    const basarili = await muteKaldir(unmuteKisi);
    if (basarili) {
      message.channel.send(`${unmuteKisi.user.tag} mute kaldırıldı.`);
      dmGonder(unmuteKisi.user, 'Sunucuda mute kaldırıldınız.');
    } else {
      message.reply('Bu kullanıcı mute\'lu değil.');
    }
    return;
  }

  // !uyari @kisi sebep (sebep zorunlu)
  if (komut === 'uyari') {
    const kisi = message.mentions.members.first();
    if (!kisi) return message.reply('Uyarı vereceğin kişiyi etiketle.');
    const sebep = args.slice(1).join(' ');
    if (!sebep) return message.reply('Lütfen bir uyarı sebebi belirt.');

    // Uyarı sayısını arttır
    let sayi = uyariSayilari.get(kisi.id) || 0;
    sayi++;
    uyariSayilari.set(kisi.id, sayi);

    // Sicil kaydı
    if (!sicilMap.has(kisi.id)) sicilMap.set(kisi.id, []);
    sicilMap.get(kisi.id).push({ sebep, tarih: bugZaman() });

    // Uyarı rolleri
    const u1 = rolBul(message.guild, ROL_U1);
    const u2 = rolBul(message.guild, ROL_U2);
    const u3 = rolBul(message.guild, ROL_U3);

    // Uyarıya göre işlem
    let muteSure = 0;
    let mesaj = `${kisi.user.tag} kişisine ${sayi}. uyarı verildi. Sebep: ${sebep}`;

    if (sayi === 1) {
      if (u1 && !kisi.roles.cache.has(u1.id)) await kisi.roles.add(u1);
    } else if (sayi === 2) {
      if (u1 && kisi.roles.cache.has(u1.id)) await kisi.roles.remove(u1);
      if (u2 && !kisi.roles.cache.has(u2.id)) await kisi.roles.add(u2);
      muteSure = 10 * 60 * 1000; // 10 dakika mute
      const muteBasarili = await muteVer(kisi, muteSure, '2. uyarı nedeniyle mute');
      if (muteBasarili) mesaj += '\nAyrıca 10 dakika mute atıldı.';
    } else if (sayi === 3) {
      if (u2 && kisi.roles.cache.has(u2.id)) await kisi.roles.remove(u2);
      if (u3 && !kisi.roles.cache.has(u3.id)) await kisi.roles.add(u3);
      muteSure = 30 * 60 * 1000; // 30 dakika mute
      const muteBasarili = await muteVer(kisi, muteSure, '3. uyarı nedeniyle mute');
      if (muteBasarili) mesaj += '\nAyrıca 30 dakika mute atıldı.';
    } else if (sayi >= 4) {
      // Ban işlemi
      await kisi.ban({ reason: `4 ve üzeri uyarı nedeniyle banlandı. Sebep: ${sebep}` });
      mesaj += '\n4 ve üzeri uyarı nedeniyle banlandı.';
      uyariSayilari.delete(kisi.id);
      dmGonder(kisi.user, 'Sunucudan banlandınız, 4 ve üzeri uyarı nedeniyle.');
      message.channel.send(mesaj);
      return;
    }

    message.channel.send(mesaj);

    // Uyarı sahibine DM
    dmGonder(kisi.user, `Sunucuda uyarı aldınız: ${sebep}. Uyarı sayınız: ${sayi}`);

    // Ownera log DM
    const owner = await client.users.fetch(OWNER_ID);
    dmGonder(owner, `Uyarı: ${kisi.user.tag} (${kisi.id})\nSebep: ${sebep}\nUyarı sayısı: ${sayi}`);

    return;
  }

  // !sicil @kisi
  if (komut === 'sicil') {
    const kisi = message.mentions.members.first();
    if (!kisi) return message.reply('Sicilini görmek istediğin kişiyi etiketle.');

    const sicil = sicilMap.get(kisi.id);
    if (!sicil || sicil.length === 0) return message.reply('Bu kişinin sicili temiz.');

    let metin = `**${kisi.user.tag}** kişisinin sicil kayıtları:\n`;
    sicil.forEach((kayit, i) => {
      metin += `${i + 1}. Sebep: ${kayit.sebep} - Tarih: ${kayit.tarih}\n`;
    });

    if (metin.length > 1900) metin = metin.slice(0, 1900) + '... (Devamı var)';
    message.channel.send(metin);
    return;
  }

  // !sicilsil @kisi [madde no]
  if (komut === 'sicilsil') {
    if (!yetkiliMi(uye)) return message.reply('Bu komutu kullanmak için Yönetim rolüne sahip olmalısın.');

    const kisi = message.mentions.members.first();
    if (!kisi) return message.reply('Sicilinden madde silmek istediğin kişiyi etiketle.');
    const maddeNo = parseInt(args[1]);
    if (!maddeNo || maddeNo < 1) return message.reply('Silmek istediğin madde numarasını doğru yazmalısın.');

    const sicil = sicilMap.get(kisi.id);
    if (!sicil || sicil.length < maddeNo) return message.reply('Bu madde sicilde bulunamadı.');

    sicil.splice(maddeNo - 1, 1);
    sicilMap.set(kisi.id, sicil);
    message.channel.send(`${kisi.user.tag} kişisinin sicilinden ${maddeNo}. madde silindi.`);
    return;
  }

  // !rütbever @kisi robloxAdi rutbe
  if (komut === 'rütbever' || komut === 'rutbever') {
    const kisi = message.mentions.members.first();
    if (!kisi) return message.reply('Rütbe vereceğin kişiyi etiketle.');

    const robloxAdi = args[1];
    const rutbe = args.slice(2).join(' ');
    if (!robloxAdi || !rutbe) return message.reply('Kullanıcı adı ve rütbe belirtilmeli: !rütbever @kisi robloxAdi rutbe');

    try {
      const userId = await noblox.getIdFromUsername(robloxAdi);
      const roles = await noblox.getRoles(GROUP_ID);
      const role = roles.find(r => r.name.toLowerCase() === rutbe.toLowerCase());
      if (!role) return message.reply('Belirtilen rütbe grupta bulunamadı.');

      await noblox.setRank(GROUP_ID, userId, role.rank);
      message.channel.send(`${kisi.user.tag} kullanıcısına Roblox grubu üzerinde ${rutbe} rütbesi verildi.`);
    } catch (error) {
      message.reply(`Rütbe verme sırasında hata: ${error.message || error}`);
    }
    return;
  }

  // !rütbelistesi
  if (komut === 'rütbelistesi' || komut === 'rutbelistesi') {
    try {
      const roles = await noblox.getRoles(GROUP_ID);
      let liste = '**Roblox Grup Rütbeleri:**\n';
      roles.forEach(r => {
        liste += `Rank: ${r.rank} - İsim: ${r.name}\n`;
      });
      if (liste.length > 1900) liste = liste.slice(0, 1900) + '...';
      message.channel.send(liste);
    } catch (err) {
      message.reply('Rütbeler listelenirken hata oluştu.');
    }
    return;
  }

  // !rolver @kisi @rol (en fazla 5 rol)
  if (komut === 'rolver') {
    const kisi = message.mentions.members.first();
    if (!kisi) return message.reply('Rol vereceğin kişiyi etiketle.');

    const roller = message.mentions.roles;
    if (!roller || roller.size === 0) return message.reply('Rol etiketlemelisin.');

    if (roller.size > 5) return message.reply('En fazla 5 rol verebilirsin.');

    try {
      await kisi.roles.add(roller);
      message.channel.send(`${kisi.user.tag} kişisine roller verildi: ${roller.map(r => r.name).join(', ')}`);
    } catch {
      message.reply('Rol verme işlemi başarısız oldu.');
    }
    return;
  }

  // !kanalikilitle
  if (komut === 'kanalikilitle') {
    const kanal = message.channel;
    if (!yetkiliMi(uye)) return message.reply('Bu komutu kullanmak için Yönetim rolüne sahip olmalısın.');
    kanal.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    message.channel.send('Kanal kilitlendi.');
    return;
  }

  // !kanaliac
  if (komut === 'kanaliac') {
    const kanal = message.channel;
    if (!yetkiliMi(uye)) return message.reply('Bu komutu kullanmak için Yönetim rolüne sahip olmalısın.');
    kanal.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
    message.channel.send('Kanal açıldı.');
    return;
  }

  // !devriye aç/kapa
  if (komut === 'devriye') {
    if (!yetkiliMi(uye)) return message.reply('Bu komutu kullanmak için Yönetim rolüne sahip olmalısın.');
    if (!args[0]) return message.reply('Lütfen aç veya kapa yaz.');

    if (args[0].toLowerCase() === 'aç' || args[0].toLowerCase() === 'ac') {
      devriyeAktif = true;
      message.channel.send('Devriye modu açıldı.');
    } else if (args[0].toLowerCase() === 'kapat' || args[0].toLowerCase() === 'kapa') {
      devriyeAktif = false;
      message.channel.send('Devriye modu kapatıldı.');
    } else {
      message.reply('Lütfen aç veya kapa yaz.');
    }
    return;
  }

  // !cekilis saat:dakika ödül kazananSayısı (kazananSayısı opsiyonel)
  if (komut === 'cekilis' || komut === 'çekiliş') {
    if (!yetkiliMi(uye)) return message.reply('Bu komutu kullanmak için Yönetim rolüne sahip olmalısın.');
    if (args.length < 2) return message.reply('Doğru kullanım: !çekiliş saat:dakika ödül [kazananSayısı]');

    const zamanArg = args[0];
    const odul = args[1];
    let kazananSayisi = args[2] ? parseInt(args[2]) : 1;
    if (isNaN(kazananSayisi) || kazananSayisi < 1) kazananSayisi = 1;

    const [saat, dakika] = zamanArg.split(':').map(x => parseInt(x));
    if (isNaN(saat) || isNaN(dakika)) return message.reply('Zaman formatı hatalı.');

    const msSure = (saat * 60 + dakika) * 60 * 1000;

    message.channel.send(`Çekiliş başladı! Ödül: **${odul}** Katılım için tepkiye basın! Kazanan sayısı: ${kazananSayisi}`);

    const cekilisMesaji = await message.channel.send('Katılmak için 🎉 reaksiyonuna basın!');
    await cekilisMesaji.react('🎉');

    setTimeout(async () => {
      const cekilisMesajiGuncel = await message.channel.messages.fetch(cekilisMesaji.id);
      const reaksiyon = cekilisMesajiGuncel.reactions.cache.get('🎉');
      if (!reaksiyon) return message.channel.send('Çekiliş katılımı olmadı.');

      const kullanicilar = await reaksiyon.users.fetch();
      const katilimcilar = kullanicilar.filter(k => !k.bot).map(k => k.id);

      if (katilimcilar.length === 0) {
        return message.channel.send('Çekilişe katılan olmadı.');
      }

      const kazananlar = [];
      while (kazananlar.length < kazananSayisi && katilimcilar.length > 0) {
        const secilen = katilimcilar.splice(Math.floor(Math.random() * katilimcilar.length), 1)[0];
        kazananlar.push(secilen);
      }

      const kazananTaglar = kazananlar.map(id => {
        const uye = message.guild.members.cache.get(id);
        return uye ? uye.user.tag : `<@${id}>`;
      });

      message.channel.send(`Çekiliş sona erdi! Ödül: **${odul}**\nKazananlar: ${kazananTaglar.join(', ')}`);
    }, msSure);

    return;
  }

  // !komutlar sayfalı komut listesi (emoji ile sayfa değiştirme)
 if (komut === 'komutlar') {
    const sayfalar = [
      `**Komutlar - Sayfa 1/2**
!sa - Bot "Aleyküm Selam Canım" diye cevap verir.
!format - Başvuru formatını gönderir.
!grup - Roblox grup linklerini gönderir.
!rütbever @kişi robloxAdı rütbe - Roblox grubunda kişiye rütbe verir.
!rütbelistesi - Roblox grubundaki rütbeleri listeler.
!rolver @kişi @rol1 @rol2 - Kişiye en fazla 5 rol verir.
!tamyasakla @kişi sebep - Tüm sunuculardan yasaklar.
!mute @kişi sebep süre(hh:mm) - Kişiyi muteler.
!unmute @kişi - Muteyi kaldırır.`,

      `**Komutlar - Sayfa 2/2**
!uyari @kişi sebep - Kişiye uyarı verir, 2 ve 3. uyarıda mute atar, 4. uyarıda banlar.
!sicil @kişi - Kişinin sicil kayıtlarını gösterir.
!sicilsil @kişi maddeNo - Sicil kaydını siler.
!kanalikilitle - Kanalı kilitler.
!kanaliac - Kanal kilidini açar.
!devriye aç/kapa - Küfür denetimini açar/kapatır.
!cekilis saat:dakika ödül kazananSayısı - Çekiliş başlatır.
!yetkili mesaj - Yönetim rolündekilere DM gönderir.
!bildir mesaj - Yönetim rolüne bildirim yollar.
`,
    ];

    let sayfa = 0;
    const embed = new EmbedBuilder()
      .setTitle('Komutlar')
      .setDescription(sayfalar[sayfa])
      .setFooter({ text: `Sayfa ${sayfa + 1} / ${sayfalar.length}` });

    const msg = await message.channel.send({ embeds: [embed] });

    if (sayfalar.length <= 1) return;

    await msg.react('◀️');
    await msg.react('▶️');

    const filter = (reaction, user) =>
      ['◀️', '▶️'].includes(reaction.emoji.name) && !user.bot && user.id === message.author.id;

    const collector = msg.createReactionCollector({ filter, time: 60000 });

    collector.on('collect', (reaction, user) => {
      reaction.users.remove(user).catch(() => { });

      if (reaction.emoji.name === '▶️') {
        sayfa = (sayfa + 1) % sayfalar.length;
      } else if (reaction.emoji.name === '◀️') {
        sayfa = (sayfa - 1 + sayfalar.length) % sayfalar.length;
      }

      const yeniEmbed = new EmbedBuilder()
        .setTitle('Komutlar')
        .setDescription(sayfalar[sayfa])
        .setFooter({ text: `Sayfa ${sayfa + 1} / ${sayfalar.length}` });

      msg.edit({ embeds: [yeniEmbed] });
    });

    collector.on('end', () => {
      msg.reactions.removeAll().catch(() => { });
    });

    return;
  }

  // !yetkili mesaj
  if (komut === 'yetkili') {
    if (!yetkiliMi(uye)) return message.reply('Bu komutu kullanmak için Yönetim rolüne sahip olmalısın.');
    const yMesaj = args.join(' ');
    if (!yMesaj) return message.reply('Lütfen bir mesaj yaz.');

    // Yönetim rolündekilere DM gönder
    const yonetimler = message.guild.members.cache.filter(m => yetkiliMi(m));
    yonetimler.forEach(m => {
      dmGonder(m.user, `Yönetici çağrısı: ${yMesaj}`);
    });

    message.channel.send('Yönetim üyelerine mesaj gönderildi.');
    return;
  }

  // !bildir mesaj
  if (komut === 'bildir') {
    if (!yetkiliMi(uye)) return message.reply('Bu komutu kullanmak için Yönetim rolüne sahip olmalısın.');
    const bMesaj = args.join(' ');
    if (!bMesaj) return message.reply('Lütfen bir bildirim mesajı yaz.');

    // Yönetim rolüne sahip herkese DM at
    const yonetimler = message.guild.members.cache.filter(m => yetkiliMi(m));
    yonetimler.forEach(m => {
      dmGonder(m.user, `Bildirim: ${bMesaj}`);
    });

    message.channel.send('Yönetim üyelerine bildirim gönderildi.');
    return;
  }
});
 
client.login(TOKEN);
