import { Telegraf, Markup } from 'telegraf'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Инициализация Telegram-бота и Supabase клиента.
 * Используем переменные окружения для защиты токенов.
 */
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

/**
 * Утилита для форматирования объема трафика.
 * Преобразует байты в гигабайты.
 * 
 * @param {number|null} bytes - Объем в байтах. Если null, возвращает "Безлимит".
 * @returns {string} Отформатированная строка трафика.
 */
const formatTraffic = (bytes) => {
  if (bytes === null) return 'Безлимит'
  return `${Math.round(bytes / (1024 * 1024 * 1024))} ГБ`
}

/**
 * Обработчик команды /start.
 * - Если передан payload (токен привязки), бот привязывает Telegram к профилю пользователя в БД.
 * - Если пользователь уже привязан, показывает главное меню.
 * - Иначе, предлагает купить VPN или войти на сайт.
 */
bot.start(async (ctx) => {
  try {
    const startPayload = ctx.message.text.split(' ')[1]
    const tgUser = ctx.from
    
    if (startPayload) {
      // Попытка привязки аккаунта по токену
      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('token', startPayload)
        .single()

      if (subError && subError.code !== 'PGRST116') {
        console.error('Ошибка при поиске подписки:', subError)
      }

      if (sub) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            telegram_username: tgUser.username || String(tgUser.id),
            telegram_chat_id: String(tgUser.id),
            tg_bot_linked: true
          })
          .eq('id', sub.user_id)

        if (updateError) {
          console.error('Ошибка при обновлении профиля:', updateError)
          return ctx.reply('Произошла ошибка при привязке. Попробуйте позже.')
        }

        ctx.reply(`✅ <b>Аккаунт успешно привязан!</b>\n\nТеперь вы будете получать здесь важные уведомления и сможете управлять своими подписками. Начислен бонус!`, {
          parse_mode: 'HTML',
          ...Markup.keyboard([
            ['🛡 Мои подписки', '💳 Продлить/Купить'],
            ['❓ Помощь', '🌐 На сайт']
          ]).resize()
        })
        return
      }
    }

    // Проверка, привязан ли аккаунт
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_username', tgUser.username || String(tgUser.id))
      .single()

    if (profError && profError.code !== 'PGRST116') {
      console.error('Ошибка при поиске профиля:', profError)
    }

    if (profile) {
      ctx.reply(`👋 С возвращением, <b>${tgUser.first_name}</b>!\nВыберите нужное действие в меню ниже.`, {
        parse_mode: 'HTML',
        ...Markup.keyboard([
          ['🛡 Мои подписки', '💳 Продлить/Купить'],
          ['❓ Помощь', '🌐 На сайт']
        ]).resize()
      })
    } else {
      ctx.reply(`👋 Добро пожаловать в <b>Veil VPN</b>!\n\nВаш надежный проводник в свободный интернет.\nЕсли у вас уже есть аккаунт, привяжите его через Личный кабинет на сайте.`, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.url('Купить VPN', 'https://veilvpn.net/checkout')],
          [Markup.button.url('Войти на сайт', 'https://veilvpn.net/')]
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
 * Запрашивает активные подписки пользователя из базы и выводит их статус, сроки и ключи.
 */
bot.hears('🛡 Мои подписки', async (ctx) => {
  try {
    const tgUser = ctx.from
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_username', tgUser.username || String(tgUser.id))
      .single()

    if (!profile) {
      return ctx.reply('Ваш аккаунт не привязан. Перейдите в личный кабинет на сайте и нажмите кнопку привязки Telegram.')
    }

    const { data: subs, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true })

    if (subsError) {
      console.error('Ошибка при получении подписок:', subsError)
      return ctx.reply('Не удалось загрузить подписки. Попробуйте позже.')
    }

    if (!subs || subs.length === 0) {
      return ctx.reply('У вас пока нет активных подписок.')
    }

    let msg = `<b>Ваши ключи доступа:</b>\n\n`
    
    subs.forEach((s, index) => {
      const statusIcon = s.status === 'active' ? '🟢' : '🔴'
      const statusText = s.status === 'active' ? 'Активна' : 'Истекла'
      const limitText = formatTraffic(s.traffic_limit)
      
      msg += `${statusIcon} <b>Устройство ${index + 1} (${limitText})</b>\n`
      msg += `Статус: ${statusText}\n`
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
 * Отправляет ссылки на тарифы.
 */
bot.hears('💳 Продлить/Купить', (ctx) => {
  try {
    ctx.reply('<b>Выберите тариф для покупки:</b>\n\n🔹 Базовый (150₽)\n🔹 Для роутера (250₽)\n🔹 Всё вместе (400₽)', {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.url('Перейти к оплате', 'https://veilvpn.net/checkout')]
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
 * Обработчик кнопки "❓ Помощь".
 */
bot.hears('❓ Помощь', (ctx) => {
  try {
    ctx.reply('Напишите ваш вопрос прямо сюда, и наш сотрудник скоро вам ответит! 🧑‍💻')
  } catch (error) {
    console.error('Ошибка в "Помощь":', error)
  }
})

/**
 * Универсальный обработчик входящих текстовых сообщений.
 * Сохраняет сообщения от пользователей в таблицу `support_messages` для отображения в CRM.
 */
bot.on('text', async (ctx) => {
  try {
    const tgUser = ctx.from
    const text = ctx.message.text
    
    let { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_chat_id', String(tgUser.id))
      .single()

    if (!profile) {
      const { data: profileByUsername } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_username', tgUser.username || String(tgUser.id))
        .single()
        
      if (!profileByUsername) {
        return ctx.reply('Сначала привяжите аккаунт через личный кабинет на сайте, чтобы задавать вопросы поддержке.')
      }
      
      // Обновляем chat_id, если он был неизвестен
      await supabase.from('profiles').update({ telegram_chat_id: String(tgUser.id) }).eq('id', profileByUsername.id)
      profile = profileByUsername
    }

    const { error: insertError } = await supabase.from('support_messages').insert({
      user_id: profile.id,
      message: text,
      is_from_user: true,
      project: 'Veil VPN'
    })

    if (insertError) {
      console.error('Ошибка при сохранении сообщения:', insertError)
      return ctx.reply('Не удалось отправить сообщение. Попробуйте позже.')
    }

    ctx.reply('Ваш вопрос получен! Наш сотрудник скоро вам ответит. 🧑‍💻')
  } catch (error) {
    console.error('Критическая ошибка в обработчике текста:', error)
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
        const { data: profile } = await supabase
          .from('profiles')
          .select('telegram_chat_id')
          .eq('id', msg.user_id)
          .single()
          
        if (profile && profile.telegram_chat_id) {
          await bot.telegram.sendMessage(profile.telegram_chat_id, `👨‍💻 <b>Ответ поддержки:</b>\n\n${msg.message}`, { parse_mode: 'HTML' })
        }
      }
    } catch (error) {
      console.error('Ошибка при обработке Realtime события:', error)
    }
  })
  .subscribe()

// Запуск бота
bot.launch().then(() => {
  console.log('Veil VPN Telegram Bot is running!')
}).catch(err => {
  console.error('Ошибка при запуске бота:', err)
})

// Корректное завершение работы
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
