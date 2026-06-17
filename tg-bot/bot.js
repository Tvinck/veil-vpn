import { Telegraf, Markup, session } from 'telegraf'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import ws from 'ws'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '.env') })


/**
 * Инициализация Telegram-бота клиентов и Supabase клиента.
 * Бот подключается к общей базе данных Connect.
 */
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

// Подключаем middleware для хранения состояний сессий поддержки в оперативной памяти
bot.use(session({ defaultSession: () => ({ support_mode: false }) }))

/**
 * Инициализация Telegram-бота для сотрудников Connect CRM.
 * Токен предоставлен в настройках интеграции.
 */
const staffBot = new Telegraf('8910548080:AAHF8JLeT6BEfvLInsbqnH0WxSzYSDul2X8')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
})

/**
 * Утилита для форматирования объема трафика.
 * Преобразует байты в гигабайты с округлением.
 * 
 * @param {number|null} bytes - Лимит трафика в байтах
 * @returns {string} Читаемый лимит трафика
 */
const formatTraffic = (bytes) => {
  if (bytes === null || bytes === 0) return 'Безлимит'
  return `${Math.round(bytes / (1024 * 1024 * 1024))} ГБ`
}

/**
 * Обработчик команды /start.
 * 
 * Логика работы:
 * 1. Если запущен по реферальной ссылке из кабинета Connect (содержит startPayload токен):
 *    - Извлекает подписку по токену.
 *    - Привязывает telegram_username, telegram_chat_id и выставляет флаг tg_bot_linked.
 * 2. Если запущен без токена:
 *    - Пытается найти подписки по telegram_chat_id или telegram_username.
 *    - Автоматически привязывает chat_id, если найдено совпадение только по username.
 * 3. Если подписок нет, предлагает перейти на сайт для регистрации.
 */
bot.start(async (ctx) => {
  if (ctx.session) {
    ctx.session.support_mode = false
    ctx.session.support_greeted = false
  }
  try {
    const startPayload = ctx.message.text.split(' ')[1]
    const tgUser = ctx.from
    
    if (startPayload) {
      // 1. Попытка привязки аккаунта по переданному токену подписки
      const { data: sub, error: subError } = await supabase
        .from('vpn_subscriptions')
        .select('*')
        .eq('token', startPayload)
        .single()

      if (subError && subError.code !== 'PGRST116') {
        console.error('Ошибка при поиске подписки по токену:', subError)
      }

      if (sub) {
        // Обновляем chat_id и username в БД для доставки уведомлений
        const { error: updateError } = await supabase
          .from('vpn_subscriptions')
          .update({
            telegram_username: tgUser.username || null,
            telegram_chat_id: String(tgUser.id),
            tg_bot_linked: true
          })
          .eq('id', sub.id)

        if (updateError) {
          console.error('Ошибка при привязке Telegram в vpn_subscriptions:', updateError)
          return ctx.reply('Произошла ошибка при привязке. Попробуйте позже.')
        }

        ctx.reply(`✅ <b>Аккаунт успешно привязан!</b>\n\nТеперь вы будете получать здесь важные уведомления и сможете управлять своими подписками.`, {
          parse_mode: 'HTML',
          ...Markup.keyboard([
            ['🛡 Мои подписки', '💳 Продлить/Купить'],
            ['❓ Помощь', '🌐 На сайт']
          ]).resize()
        })
        return
      }
    }

    // 2. Поиск по chat_id или юзернейму, если запуск пустой
    const { data: existingSubs } = await supabase
      .from('vpn_subscriptions')
      .select('*')
      .or(`telegram_chat_id.eq.${tgUser.id}${tgUser.username ? ',telegram_username.eq.' + tgUser.username : ''}`)

    if (existingSubs && existingSubs.length > 0) {
      // Авто-привязка chat_id для нелинкованных совпадений по юзернейму
      const unlinked = existingSubs.filter(s => !s.telegram_chat_id)
      for (const s of unlinked) {
        await supabase
          .from('vpn_subscriptions')
          .update({ telegram_chat_id: String(tgUser.id), tg_bot_linked: true })
          .eq('id', s.id)
      }

      ctx.reply(`👋 С возвращением, <b>${tgUser.first_name}</b>!\nВыберите нужное действие в меню ниже.`, {
        parse_mode: 'HTML',
        ...Markup.keyboard([
          ['🛡 Мои подписки', '💳 Продлить/Купить'],
          ['❓ Помощь', '🌐 На сайт']
        ]).resize()
      })
    } else {
      ctx.reply(`👋 Добро пожаловать в <b>Veil Secure</b>!\n\nВаш надежный проводник в свободный интернет.\n\nЕсли у вас уже есть подписка, привяжите её, перейдя по ссылке личного кабинета, полученной от менеджера.`, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.url('Перейти на сайт', 'https://www.veil-vps.online/')] // compliance note: keep external link
        ])
      })
    }
  } catch (error) {
    console.error('Критическая ошибка в /start:', error)
    ctx.reply('Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже.')
  }
})

/**
 * Обработчик кнопки "🛡 Мои подписки".
 * Выводит список подписок, лимиты трафика, даты окончания и ключи доступа.
 */
bot.hears('🛡 Мои подписки', async (ctx) => {
  if (ctx.session.support_mode) return
  try {
    const tgUser = ctx.from
    
    // Получаем подписки по chat_id или username
    const { data: subs, error: subsError } = await supabase
      .from('vpn_subscriptions')
      .select('*')
      .or(`telegram_chat_id.eq.${tgUser.id}${tgUser.username ? ',telegram_username.eq.' + tgUser.username : ''}`)
      .order('created_at', { ascending: true })

    if (subsError) {
      console.error('Ошибка при получении подписок:', subsError)
      return ctx.reply('Не удалось загрузить подписки. Попробуйте позже.')
    }

    if (!subs || subs.length === 0) {
      return ctx.reply('У вас пока нет активных подписок. Свяжите аккаунт по ссылке из кабинета Connect.')
    }

    // Автоматическая привязка chat_id
    for (const s of subs) {
      if (!s.telegram_chat_id) {
        await supabase
          .from('vpn_subscriptions')
          .update({ telegram_chat_id: String(tgUser.id), tg_bot_linked: true })
          .eq('id', s.id)
      }
    }

    // Получаем сервер из БД для генерации прямого ключа
    const { data: serverData } = await supabase.from('vpn_servers').select('*').limit(1).single()
    const server = serverData || {}
    const s_ip = server.ip_address || '185.142.99.185'
    const s_port = server.port || 443
    const s_pbk = server.reality_public_key || 'QScEWDolcox0fyfXNODCepp59KaN5O5WCwLu-QxbL2g'
    const s_sni = 'www.microsoft.com';
    const s_sid = server.reality_short_id || 'ca'
    const s_flow = server.reality_flow || 'xtls-rprx-vision'
    const s_name = server.name || 'Нидерланды (Premium)'
    const s_country = server.country_code || 'NL'

    function getFlagEmoji(countryCode) {
      if (!countryCode) return '🌐';
      const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
      try { return String.fromCodePoint(...codePoints); } catch(e) { return '🌐'; }
    }

    function extractUuid(key) {
      if (!key) return null;
      if (key.startsWith('vless://')) {
        const match = key.match(/vless:\/\/([^@]+)@/);
        return match ? match[1] : null;
      }
      return key;
    }

    let msg = `<b>Ваши ключи доступа:</b>\n\n`
    
    subs.forEach((s, index) => {
      const isExpired = s.expires_at && new Date(s.expires_at) < new Date()
      const statusIcon = (s.status === 'active' && !isExpired) ? '🟢' : '🔴'
      const statusText = (s.status === 'active' && !isExpired) ? 'Активна' : isExpired ? 'Истекла' : 'Заблокирована'
      const limitText = formatTraffic(s.traffic_limit)
      const usedText = (s.traffic_used / (1024 * 1024 * 1024)).toFixed(2) + ' ГБ'
      
      msg += `${statusIcon} <b>Подписка #${index + 1}</b>\n`
      msg += `Статус: ${statusText}\n`
      msg += `Трафик: ${usedText} / ${limitText}\n`
      if (s.expires_at) {
        msg += `Истекает: ${new Date(s.expires_at).toLocaleDateString('ru-RU')}\n`
      }
      
      const uuid = extractUuid(s.subscription_key)
      let directKeyTCP = s.subscription_key
      let directKeyGRPC = ''
      if (uuid && (uuid.length === 32 || uuid.length === 36)) {
        directKeyTCP = `vless://${uuid}@${s_ip}:${s_port}?encryption=none&type=tcp&security=reality&pbk=${encodeURIComponent(s_pbk)}&sni=${encodeURIComponent(s_sni)}&fp=chrome&sid=${s_sid}&spx=%2F&flow=${s_flow}#${encodeURIComponent(getFlagEmoji(s_country) + ' ' + s_name + ' (TCP)')}`
        directKeyGRPC = `vless://${uuid}@${s_ip}:444?encryption=none&type=grpc&mode=gun&security=reality&pbk=${encodeURIComponent(s_pbk)}&sni=github.com&fp=chrome&sid=${s_sid}&spx=%2F#${encodeURIComponent(getFlagEmoji(s_country) + ' ' + s_name + ' (gRPC)')}`
      }

      msg += `🔑 Прямой ключ TCP (Быстрый):\n<code>${directKeyTCP}</code>\n\n`
      if (directKeyGRPC) {
        msg += `🔑 Прямой ключ gRPC (Анти-блок):\n<code>${directKeyGRPC}</code>\n\n`
      }
      
      if (s.token) {
        msg += `🔗 Ссылка на подписку (Рекомендуется для Hiddify / v2rayNG):\n<code>https://185-142-99-185.sslip.io:2053/api/sub?token=${s.token}</code>\n\n`
      }
    })

    ctx.reply(msg, { parse_mode: 'HTML' })
  } catch (error) {
    console.error('Критическая ошибка в "Мои подписки":', error)
    ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.')
  }
})

/**
 * Обработчик кнопки "💳 Продлить/Купить".
 */
bot.hears('💳 Продлить/Купить', (ctx) => {
  if (ctx.session.support_mode) return
  try {
    ctx.reply('<b>Для покупки или продления подписки обратитесь на сайт или к нашему менеджеру:</b>', {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.url('Перейти на сайт', 'https://www.veil-vps.online/')]
      ])
    })
  } catch (error) {
    console.error('Ошибка в "Купить":', error)
  }
})

/**
 * Обработчик кнопки "🌐 На сайт".
 */
bot.hears('🌐 На сайт', (ctx) => {
  if (ctx.session.support_mode) return
  try {
    ctx.reply('Нажмите на кнопку ниже, чтобы открыть сайт Veil Secure.', {
      ...Markup.inlineKeyboard([
        [Markup.button.url('Перейти на сайт', 'https://www.veil-vps.online/')]
      ])
    })
  } catch (error) {
    console.error('Ошибка в "На сайт":', error)
  }
})

/**
 * Обработчик кнопки "❓ Помощь". Переводит чат в режим техподдержки,
 * перенаправляя все текстовые сообщения сотрудникам CRM.
 */
bot.hears('❓ Помощь', (ctx) => {
  if (ctx.session.support_mode) return
  try {
    ctx.session.support_mode = true
    ctx.reply('Напишите подробно ваш вопрос или проблему, сотрудник ответит в ближайшее время. 🧑‍💻', {
      ...Markup.keyboard([
        ['❌ Завершить диалог']
      ]).resize()
    })
  } catch (error) {
    console.error('Ошибка в "Помощь":', error)
  }
})

/**
 * Выход из режима техподдержки.
 */
bot.hears('❌ Завершить диалог', (ctx) => {
  try {
    ctx.session.support_mode = false
    ctx.session.support_greeted = false
    ctx.reply('Диалог завершен. Чем еще могу помочь?', {
      ...Markup.keyboard([
        ['🛡 Мои подписки', '💳 Продлить/Купить'],
        ['❓ Помощь', '🌐 На сайт']
      ]).resize()
    })
  } catch (error) {
    console.error('Ошибка при выходе из поддержки:', error)
  }
})

/**
 * Универсальный обработчик входящих медиа- и текстовых сообщений.
 * Все входящие сообщения поддержки сохраняются в таблицу `support_messages`
 * и отображаются менеджеру в CRM Connect.
 */
bot.on('message', async (ctx) => {
  try {
    if (!ctx.session.support_mode) {
      if (ctx.message.text) {
        return ctx.reply('Я не понимаю эту команду. Пожалуйста, используйте кнопки меню ниже.', {
          ...Markup.keyboard([
            ['🛡 Мои подписки', '💳 Продлить/Купить'],
            ['❓ Помощь', '🌐 На сайт']
          ]).resize()
        })
      }
      return
    }

    const tgUser = ctx.from
    let messageText = ctx.message.text || ''

    // Обработка отправленных медиафайлов (фото/скриншоты, файлы, голосовые сообщения)
    if (ctx.message.photo) {
      const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id
      const fileUrlObj = await ctx.telegram.getFileLink(fileId)
      const fileUrl = typeof fileUrlObj === 'string' ? fileUrlObj : fileUrlObj.href
      const captionText = ctx.message.caption ? `\nОписание: ${ctx.message.caption}` : ''
      messageText = `📷 [Изображение]: ${fileUrl}${captionText}`
    } else if (ctx.message.document) {
      const fileId = ctx.message.document.file_id
      const fileUrlObj = await ctx.telegram.getFileLink(fileId)
      const fileUrl = typeof fileUrlObj === 'string' ? fileUrlObj : fileUrlObj.href
      messageText = `📁 [Файл]: ${fileUrl}`
    } else if (ctx.message.voice) {
      const fileId = ctx.message.voice.file_id
      const fileUrlObj = await ctx.telegram.getFileLink(fileId)
      const fileUrl = typeof fileUrlObj === 'string' ? fileUrlObj : fileUrlObj.href
      messageText = `🎤 [Голосовое сообщение]: ${fileUrl}`
    }

    if (!messageText) {
      return ctx.reply('Данный тип сообщений не поддерживается в чате поддержки.')
    }
    
    // Находим подписку по chat_id или username
    const { data: sub } = await supabase
      .from('vpn_subscriptions')
      .select('*')
      .or(`telegram_chat_id.eq.${tgUser.id}${tgUser.username ? ',telegram_username.eq.' + tgUser.username : ''}`)
      .limit(1)
      .single()

    if (!sub) {
      return ctx.reply('Сначала привяжите аккаунт, перейдя по ссылке из кабинета Connect, чтобы задавать вопросы поддержке.')
    }

    // Авто-привязываем chat_id, если он не был сохранен
    if (!sub.telegram_chat_id) {
      await supabase
        .from('vpn_subscriptions')
        .update({ telegram_chat_id: String(tgUser.id), tg_bot_linked: true })
        .eq('id', sub.id)
    }

    // Отправляем сообщение в CRM
    const { error: insertError } = await supabase.from('support_messages').insert({
      user_id: sub.id,
      message: messageText,
      is_from_user: true,
      project: 'Veil Secure'
    })

    if (insertError) {
      console.error('Ошибка при сохранении сообщения в support_messages:', insertError)
      return ctx.reply('Не удалось отправить сообщение. Попробуйте позже.')
    }
    
    if (!ctx.session.support_greeted) {
      ctx.session.support_greeted = true
      ctx.reply('Ваш вопрос получен! Вы можете продолжать писать сообщения сюда. Чтобы выйти из чата, нажмите кнопку ниже.', {
        ...Markup.keyboard([
          ['❌ Завершить диалог']
        ]).resize()
      })
    }
  } catch (error) {
    console.error('Критическая ошибка в обработчике сообщений:', error)
  }
})

// Переменная кэша ID чата сотрудников Connect CRM
let staffChatId = null;

/**
 * Получает ID чата сотрудников Connect CRM из таблицы `vpn_settings`.
 * 
 * @returns {Promise<string|null>} ID чата сотрудников
 */
async function getStaffChatId() {
  if (staffChatId) return staffChatId;
  try {
    const { data } = await supabase
      .from('vpn_settings')
      .select('value')
      .eq('key', 'staff_chat_id')
      .maybeSingle();
    if (data?.value) {
      staffChatId = data.value;
    }
  } catch (err) {
    console.error('Ошибка при запросе staff_chat_id:', err);
  }
  return staffChatId;
}

// Регистрация чата сотрудников при старте или по команде /setchat
staffBot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  staffChatId = String(chatId);
  const { error } = await supabase
    .from('vpn_settings')
    .upsert({ key: 'staff_chat_id', value: staffChatId });

  if (error) {
    console.error('Ошибка при сохранении staff_chat_id:', error);
    ctx.reply('❌ Ошибка при регистрации чата в базе данных.');
  } else {
    ctx.reply('✅ Этот чат успешно зарегистрирован для получения уведомлений поддержки Connect!');
  }
});

staffBot.command('setchat', async (ctx) => {
  const chatId = ctx.chat.id;
  staffChatId = String(chatId);
  const { error } = await supabase
    .from('vpn_settings')
    .upsert({ key: 'staff_chat_id', value: staffChatId });

  if (error) {
    console.error('Ошибка при сохранении staff_chat_id:', error);
    ctx.reply('❌ Ошибка при регистрации чата.');
  } else {
    ctx.reply('✅ Чат сотрудников успешно привязан!');
  }
});

/**
 * Подписка на Realtime-изменения таблицы `support_messages` в Supabase.
 * Реализует:
 * 1. Пересылку ответов поддержки клиенту в Telegram.
 * 2. Уведомление сотрудников в чат сотрудников о новых сообщениях от клиентов.
 * 3. Уведомление сотрудников о том, какой коллега и что ответил клиенту.
 */
supabase
  .channel('support_messages_channel')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, async (payload) => {
    try {
      const msg = payload.new;

      // 1. Новое сообщение от клиента (is_from_user = true)
      if (msg.is_from_user) {
        const targetChatId = await getStaffChatId();
        if (targetChatId) {
          const { data: sub } = await supabase
            .from('vpn_subscriptions')
            .select('username, telegram_username')
            .eq('id', msg.user_id)
            .maybeSingle();

          const clientName = sub ? (sub.username || (sub.telegram_username ? `@${sub.telegram_username}` : 'Клиент')) : 'Клиент';
          
          let text = `📥 <b>Новое сообщение в поддержку (${msg.project || 'Veil'})</b>\n`;
          text += `От: <code>${clientName}</code>\n\n`;
          text += `${msg.message}`;

          await staffBot.telegram.sendMessage(targetChatId, text, { parse_mode: 'HTML' });
        }
      }

      // 2. Ответ от оператора (is_from_user = false)
      if (!msg.is_from_user) {
        // А. Пересылаем клиенту в Telegram, если он привязан к боту
        const { data: sub } = await supabase
          .from('vpn_subscriptions')
          .select('telegram_chat_id, username, telegram_username')
          .eq('id', msg.user_id)
          .maybeSingle();

        if (sub && sub.telegram_chat_id && msg.project === 'Veil Secure') {
          await bot.telegram.sendMessage(sub.telegram_chat_id, `👨‍💻 <b>Ответ поддержки:</b>\n\n${msg.message}`, { parse_mode: 'HTML' });
        }

        // Б. Уведомляем сотрудников в общем чате, кто из коллег ответил клиенту
        const targetChatId = await getStaffChatId();
        if (targetChatId) {
          const sender = msg.sender_email ? `@${msg.sender_email.split('@')[0]}` : 'сотрудник';
          const clientName = sub ? (sub.username || (sub.telegram_username ? `@${sub.telegram_username}` : 'клиент')) : 'клиент';

          let text = `✍️ Сотрудник <b>${sender}</b> ответил на сообщение для <code>${clientName}</code>:\n\n`;
          text += msg.message;

          await staffBot.telegram.sendMessage(targetChatId, text, { parse_mode: 'HTML' });
        }
      }
    } catch (error) {
      console.error('Ошибка при обработке Realtime события (поддержка):', error);
    }
  })
  .subscribe()

// Запуск бота для клиентов
bot.launch().then(() => {
  console.log('Veil Secure Telegram Bot is running on Connect DB!')
}).catch(err => {
  console.error('Ошибка при запуске клиентского бота:', err)
})

// Запуск бота для сотрудников
staffBot.launch().then(() => {
  console.log('Staff Connect Telegram Bot is running!')
}).catch(err => {
  console.error('Ошибка при запуске бота сотрудников:', err)
})

// Корректное завершение процессов ботов
process.once('SIGINT', () => {
  bot.stop('SIGINT')
  staffBot.stop('SIGINT')
})
process.once('SIGTERM', () => {
  bot.stop('SIGTERM')
  staffBot.stop('SIGTERM')
})
