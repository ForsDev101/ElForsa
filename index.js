import { Client, GatewayIntentBits, REST, Routes, Events, PermissionsBitField, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

const SECURITY_YETKI_ROLE = process.env.SECURITY_YETKI_ROLE;
const TOKEN = process.env.TOKEN;
const commands = [
  {
    name: 'abusekoruma',
    description: 'Kanal abuse korumasını aç/kapat',
    options: [{ name: 'durum', type: 3, required: true, description: 'aç veya kapat', choices: [{ name: 'aç', value: 'on' }, { name: 'kapat', value: 'off' }] }]
  },
  {
    name: 'linkengel',
    description: 'Link engel sistemini aç/kapat',
    options: [{ name: 'durum', type: 3, required: true, description: 'aç veya kapat', choices: [{ name: 'aç', value: 'on' }, { name: 'kapat', value: 'off' }] }]
  },
  {
    name: 'videoengel',
    description: 'Video engel sistemini aç/kapat',
    options: [{ name: 'durum', type: 3, required: true, description: 'aç veya kapat', choices: [{ name: 'aç', value: 'on' }, { name: 'kapat', value: 'off' }] }]
  },
  {
    name: 'botengel',
    description: 'Bot ekleme engel sistemini aç/kapat',
    options: [{ name: 'durum', type: 3, required: true, description: 'aç veya kapat', choices: [{ name: 'aç', value: 'on' }, { name: 'kapat', value: 'off' }] }]
  },
  {
    name: 'unban',
    description: 'Kullanıcının banını kaldırır',
    options: [{ name: 'id', type: 3, required: true, description: 'Banı açılacak kişinin kullanıcı ID\'si' }]
  },
  {
    name: 'yardım',
    description: 'Tüm komutları listeler'
  }
];

const systems = {
  abuse: false,
  link: false,
  video: false,
  bot: false,
};

let channelDeleteLogs = [];

client.once(Events.ClientReady, async () => {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
  console.log(`Bot aktif: ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const roleCheck = interaction.member.roles.cache.has(SECURITY_YETKI_ROLE);
  if (!roleCheck) return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok.', ephemeral: true });

  const { commandName, options } = interaction;

  if (['abusekoruma', 'linkengel', 'videoengel', 'botengel'].includes(commandName)) {
    const durum = options.getString('durum');
    systems[commandName.replace('koruma', '').replace('engel', '')] = durum === 'on';
    await interaction.reply(`✅ ${commandName} başarıyla **${durum}** olarak ayarlandı.`);
  }

  if (commandName === 'yardım') {
    const helpEmbed = new EmbedBuilder()
      .setTitle('🔐 Güvenlik Bot Komutları')
      .setDescription([
        '`/abusekoruma aç/kapat` → Kanal abuse koruması',
        '`/linkengel aç/kapat` → Link gönderimini engeller',
        '`/videoengel aç/kapat` → Video gönderimini engeller',
        '`/botengel aç/kapat` → Bot eklemeleri engeller',
        '`/unban <id>` → Banı kaldırır',
      ].join('\n'))
      .setColor('Red');
    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  }

  if (commandName === 'unban') {
    const id = options.getString('id');
    try {
      await interaction.guild.members.unban(id);
      await interaction.reply(`✅ ${id} adlı kullanıcının banı kaldırıldı.`);
    } catch {
      await interaction.reply(`❌ Kullanıcının banı bulunamadı veya hata oluştu.`);
    }
  }
});

// Abuse koruma (kanal silme takibi)
client.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
  if (!systems.abuse || entry.action !== 12) return;

  const executorId = entry.executorId;
  channelDeleteLogs.push(executorId);
  const recent = channelDeleteLogs.filter(id => id === executorId).length;

  if (recent >= 3) {
    try {
      const member = await guild.members.fetch(executorId);
      await member.ban({ reason: 'Abuse koruması - Çok fazla kanal silme' });
      await member.send(`${guild.name} Sunucumuza abuse atmaya çalışmaktan banlandınız.`);
      // Rollback (geri alma) mantığını senin manuel olarak yapman lazım
    } catch (e) {
      console.log('Ban hatası:', e);
    }
  }

  // 10 dk içinde temizle
  setTimeout(() => {
    channelDeleteLogs = channelDeleteLogs.filter(id => id !== executorId);
  }, 10 * 60 * 1000);
});

// Link engel
client.on(Events.MessageCreate, async message => {
  if (systems.link && /(https?:\/\/[^\s]+)/g.test(message.content)) {
    await message.delete().catch(() => {});
  }
});

// Video engel
const videoMap = new Map();
client.on(Events.MessageCreate, async message => {
  if (systems.video && message.attachments.some(a => a.contentType?.startsWith('video'))) {
    const id = message.author.id;
    await message.delete();
    if (!videoMap.has(id)) {
      videoMap.set(id, 1);
      await message.channel.send(`<@${id}> Bu kanalda video paylaşmak yasak! Bir daha tekrarlarsan timeout alırsın.`);
    } else {
      const member = await message.guild.members.fetch(id);
      await member.timeout(60 * 60 * 1000, 'Video yasağı tekrar ihlali');
      videoMap.delete(id);
    }
  }
});

// Bot engel
client.on(Events.GuildMemberAdd, async member => {
  if (systems.bot && member.user.bot) {
    const audit = await member.guild.fetchAuditLogs({ type: 28, limit: 1 }); // BOT_ADD
    const entry = audit.entries.first();
    if (entry?.target?.id === member.id) {
      try {
        await member.kick('Bot engel aktif');
        const adder = await member.guild.members.fetch(entry.executor.id);
        await adder.kick('İzinsiz bot ekleme');
      } catch (e) {
        console.log('Bot engelleme hatası:', e);
      }
    }
  }
});

client.login(TOKEN);
