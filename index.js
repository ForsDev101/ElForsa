// ElForsa Bot Ana Kodu (TÜM KOMUTLAR DAHİL) - Token doğrudan eklendi (GÜVENLİ DEĞİLDİR)

const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField } = require("discord.js");
const noblox = require("noblox.js");
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

const GROUP_ID = 33282690; // TKT grup ID
const ROBLOX_COOKIE = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_CAEaAhAB.B567D6CEF412284207AF16D4AB5385D81B2689C3CD74BC8F6E8C38F34857145FFFCA19EA5F1C39D4929AC66B7B7BDED4591461C260E44C075E5FB96FAB876B83E9C22A0CD9B554BE02419FAE9A16E11F3914E07B2C43A16714C6D7E25BAAA39595E0A8729BCC203508359A5F44F55AE0191B4638CC463A89A03E385593DF7B9E7EE94923A96197B43B7296DD1F8DB0C7FFC3BCDF4606B37F2442229D82E1AAB65615D118A1D8B77BEA42FB4FE35DDE9B6658F4158E12E7878A21FC1C5719C1A37BDE089E3492D6457D423B786F54CB081903E005C21861FB7C532AE3D295A890432EC25F8614B734E433753E14A2790FC672764187A6FD8AE45B6456112775CEB61D1042C8CC02535C026A576467AF6FD685615F9C7D3ECDBC964537272BAC0B57B33E2A0609CE7552B82C2D7711F29A4D083420B5BA5556E79002FDFA6E7038AE71120D909C339C8D5AC26D549CAF44E2F94B957354C410306230DFFC3458DA9C404A07F3747DC1F9B799BEC971E33818C3F433BEF1C73CAEF9E5050E5D8861F91BE67911B84785018DA319D97D9CD5A8E3BFF935ED49D1464BE4E6701B7E5C7D7F8D1B17C463F42898865F0EF2A8AEF2B08139835E8C6A47CFBC26A194CD2ECA091CC54907D794C8B0853CCA4AAF9D7AC3F4370746396E7762331FA0BFA7BC5C8922C26AC8AC945714C40388C42E9490EE4899AB9CDBBE739F8A214F241EB6294673C27107C2A0FA20B6D45B39DA1FD934AB57692F1479EE301E3E6B6A5B9BB659C56473EC7C6EB838E40B17694DFFEF8C9F64D5AA0F099342F6C3E4CE88E1C9A25E6BF0FA5043421C55AB3500E646F04F62D94B18DA70338DAF743CBD2035F9F3AEF3628189600C3369062DCC1C2F5D72AE1D358B627D8EE45C7EE639DB8C6C55CF03C67426262CFDDCCDD64300737EFEAD14C76950D689B77977CEA6A7A03705373AD95AE5644BBA166CF4F4D9D0DE4110A081D3F615647AC369AB1985FA2D9DC34827ED9FD20083D4B46F2673DBA19A4D189F6BA8F9EF8B920BC8E15E0A23EDCBCD681D69E4A14832EA529D040EDEB917BC91810875CDBFBE0A5AF177DAFF8A2E669B45567E4B33883F2C4A8D9401D4A64916FE3737C2165D92FBE4070115F2CEF0F8082D4A9232C860FA90DE35AE3C6F85A3D539A9A6C9F7485B2C270C3F4FE0699C718D97021C092228EC6B90A005AF7CFF8D7AD9E8F3A6EAE63840494FE39C14EC07B0A57BB0F2E3399FA4BA5A39FBAC'; // BURAYA ROBLOX COOKIE YAPIŞTIR
const OWNER_ID = '1117209136837427300'; // @forsdeving ID

// Sohbet Modu Ayarı
let sohbetModu = true;

// Uyarı sistemi
const fs = require("fs");
const uyarilar = {};

function kaydet() {
  fs.writeFileSync("uyarilar.json", JSON.stringify(uyarilar, null, 2));
}

try {
  const data = fs.readFileSync("uyarilar.json");
  Object.assign(uyarilar, JSON.parse(data));
} catch {}

client.once("ready", async () => {
  await noblox.setCookie(ROBLOX_COOKIE);
  console.log(`✅ ElForsa aktif: ${client.user.tag}`);
});

client.on("messageCreate", async msg => {
  if (msg.author.bot) return;

  const args = msg.content.split(" ");
  const command = args.shift().toLowerCase();

  // SA cevabı
  if (command === "sa" || command === "Sa") return msg.reply("Aleyküm Selam canım");

  // !format başvuru formatı
  if (command === "!format") {
    return msg.reply(
      `**Başvuru Formatı:**\nRoblox ismim:\nÇalıştığım kamplar:\nÇalıştığın kampların kişi sayıları:\nKaç saat aktif olurum:\nNiçin burayı seçtim:\nDüşündüğüm rütbe:\nTransfer olunca katıldığım bütün kamplardan çıkacağımı kabul ediyor muyum:\nSS:\ntag: <@&1393136901552345095>`
    );
  }

  // !rütbever @kisi RÜTBE
  if (command === "!rütbever") {
    if (!msg.member.roles.cache.some(role => role.name === "@+")) return;
    const mention = msg.mentions.users.first();
    const rutbe = args.slice(1).join(" ");
    if (!mention || !rutbe) return msg.reply("Kullanım: !rütbever @kisi RÜtbeAdı");
    try {
      const id = await noblox.getIdFromUsername(mention.username);
      const roles = await noblox.getRoles(GROUP_ID);
      const target = roles.find(r => r.name.toLowerCase() === rutbe.toLowerCase());
      if (!target) return msg.reply("Böyle bir rütbe bulunamadı.");
      await noblox.setRank(GROUP_ID, id, target.rank);
      msg.reply(`✅ ${mention} kullanıcısına ${rutbe} rütbesi verildi.`);
    } catch (e) {
      msg.reply("Hata: Kullanıcı bulunamadı veya işlem başarısız.");
    }
  }

  // !tamyasakla @kisi (sebep opsiyonel)
  if (command === "!tamyasakla") {
    const member = msg.mentions.members.first();
    const sebep = args.slice(1).join(" ") || "Sebep belirtilmedi.";
    if (!member) return msg.reply("Kullanım: !tamyasakla @kisi [sebep]");
    await member.ban({ reason: sebep });
    msg.reply(`❌ ${member.user.tag} sunucudan yasaklandı.`);
    member.send(`Sunucudan yasaklandın. Sebep: ${sebep}`).catch(() => {});
  }

  // !rolver @kisi @rol1 @rol2 @rol3 ...
  if (command === "!rolver") {
    const member = msg.mentions.members.first();
    const roller = msg.mentions.roles;
    if (!member || roller.size < 1) return msg.reply("Kullanım: !rolver @kisi @rol1 @rol2 ...");
    roller.forEach(role => member.roles.add(role));
    msg.reply(`✅ ${member.user.tag} kullanıcısına roller verildi.`);
  }

  // !mute @kisi 1:30 (saat:dakika) veya süresiz
  if (command === "!mute") {
    const member = msg.mentions.members.first();
    const sure = args[1];
    if (!member) return msg.reply("Kullanım: !mute @kisi [saat:dakika]");
    const muteRole = msg.guild.roles.cache.find(r => r.name === "Muted");
    if (!muteRole) return msg.reply("Muted rolü yok");
    await member.roles.add(muteRole);
    msg.reply(`🔇 ${member.user.tag} mutelendi.`);
    if (sure) {
      const [saat, dakika] = sure.split(":".map(Number));
      const ms = ((saat || 0) * 60 + (dakika || 0)) * 60 * 1000;
      setTimeout(() => member.roles.remove(muteRole), ms);
    }
  }

  // !unmute @kisi
  if (command === "!unmute") {
    const member = msg.mentions.members.first();
    const muteRole = msg.guild.roles.cache.find(r => r.name === "Muted");
    if (member && muteRole) {
      await member.roles.remove(muteRole);
      msg.reply(`🔊 ${member.user.tag} unmutelendi.`);
    }
  }

  // !sohbetac / !sohbetkapat
  if (command === "!sohbetac") sohbetModu = true;
  if (command === "!sohbetkapat") sohbetModu = false;

  // Sohbet (Chatbot basit mod)
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

  // !komutlar sayfa sayfa
  if (command === "!komutlar") {
    const embed = new EmbedBuilder()
      .setTitle("📜 Komutlar Listesi")
      .setDescription(`**!rütbever @kişi Rütbe** → Roblox grubunda rütbe verir\n**!format** → Başvuru formatı\n**!tamyasakla @kişi** → Sunuculardan yasaklar\n**!rolver @kişi @rol1 @rol2...** → Rol verir\n**!mute @kişi [saat:dakika]** → Mute atar\n**!unmute @kişi** → Muteyi kaldırır\n**!sohbetac / !sohbetkapat** → Sohbet modunu aç/kapat\n**!komutlar** → Tüm komutlar\n...`)
      .setColor("Blue");
    msg.reply({ embeds: [embed] });
  }
});

// BOT TOKEN (geçici olarak doğrudan eklendi)
client.login('MTM5NDc1MDg3NzIxNDE3OTM2OA.GtEPfg.Vbo0WWHNndEt5Xik_f9rn2cpFxB9fMFO82VWac');
