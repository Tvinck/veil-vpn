import { Telegraf, Markup, session } from 'telegraf'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import ws from 'ws'

dotenv.config()

/**
 * Инициализация Telegram-бота и Supabase клиента.
 * Подключаемся к единой БД Connect.
 */
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

// Подключаем middleware для хранения состояний сессий (в оперативной памяти)
bot.use(session({ defaultSession: () => ({ support_mode: false }) }))

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
})

/**
 * Утилита для форматирования объема трафика.
 * Преобразует байты в гигабайты.
 */
const formatTraffic = (bytes) => {
  if (bytes === null || bytes === 0) return 'Безлимит'
  return `${Math.round(bytes / (1024 * 1024 * 1024))} ГБ`
}

/**
 * Обработчик команды /start.
 * - Если передан payload (токен привязки), бот привязывает Telegram к подписке пользователя в БД.
 * - Иначе ищет подписку по telegram_username и автоматически привязывает её.
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
      // 1. Попытка привязки аккаунта по токену подписки
      const { data: sub, error: subError } = await supabase
        .from('vpn_subscriptions')
        .select('*')
        .eq('token', startPayload)
        .single()

      if (subError && subError.code !== 'PGRST116') {
        console.error('Ошибка при поиске подписки по токену:', subError)
      }

      if (sub) {
        // Обновляем чат-ID и имя пользователя для отправки уведомлений
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

    // 2. Если токена нет, пробуем найти подписку по chat_id или username
    const { data: existingSubs } = await supabase
      .from('vpn_subscriptions')
      .select('*')
      .or(`telegram_chat_id.eq.${tgUser.id}${tgUser.username ? ',telegram_username.eq.' + tgUser.username : ''}`)

    if (existingSubs && existingSubs.length > 0) {
      // Если нашли по username, но chat_id не был привязан — привязываем автоматически
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
      ctx.reply(`👋 Добро пожаловать в <b>Veil VPN</b>!\n\nВаш надежный проводник в свободный интернет.\n\nЕсли у вас уже есть подписка, привяжите её, перейдя по ссылке личного кабинета, полученной от менеджера.`, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.url('Перейти на сайт', 'https://veilvpn.net/')]
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
 * Выводит список подписок, привязанных к данному пользователю Telegram.
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

    // Автоматическая привязка chat_id, если найдено только по username
    for (const s of subs) {
      if (!s.telegram_chat_id) {
        await supabase
          .from('vpn_subscriptions')
          .update({ telegram_chat_id: String(tgUser.id), tg_bot_linked: true })
          .eq('id', s.id)
      }
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
      msg += `Ключ: <code>${s.subscription_key}</code>\n\n`
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
        [Markup.button.url('Перейти на сайт', 'https://veilvpn.net/')]
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
    ctx.reply('Нажмите на кнопку ниже, чтобы открыть сайт Veil VPN.', {
      ...Markup.inlineKeyboard([
        [Markup.button.url('Перейти на сайт', 'https://veilvpn.net/')]
      ])
    })
  } catch (error) {
    console.error('Ошибка в "На сайт":', error)
  }
})

/**
 * Обработчик кнопки "❓ Помощь" (Вход в режим техподдержки).
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
 * Выход из режима поддержки.
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
 * Универсальный обработчик входящих текстовых сообщений.
 * Сохраняет сообщения от пользователей в таблицу `support_messages` для отображения в CRM Connect.
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

    // Обработка медиафайлов (фото/скриншоты, файлы, голосовые сообщения)
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

    // Авто-привязываем chat_id
    if (!sub.telegram_chat_id) {
      await supabase
        .from('vpn_subscriptions')
        .update({ telegram_chat_id: String(tgUser.id), tg_bot_linked: true })
        .eq('id', sub.id)
    }

    const { error: insertError } = await supabase.from('support_messages').insert({
      user_id: sub.id, // Идентификатор подписки
      message: messageText,
      is_from_user: true,
      project: 'Veil VPN'
    })

    if (insertError) {
      console.error('Ошибка при сохранении сообщения в support_messages:', insertError)
      return ctx.reply('Не удалось отправить сообщение. Попробуйте позже.')
    }
    
    // Подтверждение только при первом сообщении в рамках сессии
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

/**
 * Подписка на Realtime-события из БД (ответы техподдержки).
 * Если сотрудник ответил из панели `connect`, бот пересылает это сообщение пользователю.
 */
supabase
  .channel('support_messages_channel')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, async (payload) => {
    try {
      const msg = payload.new
      // Реагируем только на ответы от сотрудника
      if (!msg.is_from_user) {
        const { data: sub } = await supabase
          .from('vpn_subscriptions')
          .select('telegram_chat_id')
          .eq('id', msg.user_id)
          .single()
          
        if (sub && sub.telegram_chat_id) {
          await bot.telegram.sendMessage(sub.telegram_chat_id, `👨‍💻 <b>Ответ поддержки:</b>\n\n${msg.message}`, { parse_mode: 'HTML' })
        }
      }
    } catch (error) {
      console.error('Ошибка при обработке Realtime события (поддержка):', error)
    }
  })
  .subscribe()

// Запуск бота
bot.launch().then(() => {
  console.log('Veil VPN Telegram Bot is running on Connect DB!')
}).catch(err => {
  console.error('Ошибка при запуске бота:', err)
})

// Корректное завершение работы
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
