import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Loader2, Check, Copy, HelpCircle, ArrowRight, AlertTriangle, MessageSquare } from 'lucide-react'
import confetti from 'canvas-confetti'

interface ActivationResult {
  success: boolean
  email: string
  token: string
  isNew: boolean
  expiresAt: string
  durationDays: number
}

export default function SuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ActivationResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'windows' | 'macos'>('ios')

  // Get uniquecode from URL (supports both lowercase and camelCase)
  const uniquecode = searchParams.get('uniquecode') || searchParams.get('uniqueCode')

  useEffect(() => {
    if (!uniquecode) {
      setLoading(false)
      setError('Уникальный код не найден в ссылке. Пожалуйста, вернитесь на GGsel или воспользуйтесь инструкцией из письма.')
      return
    }

    const verifyCode = async () => {
      try {
        setLoading(true)
        setError(null)

        const refParam = localStorage.getItem('veil_referrer') || undefined;

        const res = await fetch('/api/ggsel-callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            uniqueCode: uniquecode,
            referrer: refParam
          })
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || 'Не удалось активировать уникальный код');
        }

        // Clear referrer on success
        localStorage.removeItem('veil_referrer');

        setData(json);
        setLoading(false)

        // Trigger confetti!
        triggerConfetti();

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Ошибка соединения с сервером');
        setLoading(false)
      }
    };

    verifyCode();
  }, [uniquecode])

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00f0ff', '#a855f7', '#ff007a']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00f0ff', '#a855f7', '#ff007a']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }

  const handleCopyLink = () => {
    if (!data) return
    const cabinetUrl = `${window.location.origin}/cabinet/${data.token}`
    navigator.clipboard.writeText(cabinetUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  // Neon style elements
  const glowStyle = {
    boxShadow: '0 0 40px rgba(0, 240, 255, 0.15)',
    border: '1.5px solid rgba(0, 240, 255, 0.2)'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-height-screen px-4 text-center">
        <div className="sec-dash-ambient-1" />
        <div className="sec-dash-ambient-2" />
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full bg-white/[0.02] border border-white/[0.05] p-10 rounded-3xl backdrop-blur-xl">
          <Loader2 className="w-16 h-16 animate-spin text-[#00f0ff]" />
          <div>
            <h2 className="text-2xl font-black mb-2 text-white font-title tracking-tight">Активация подписки</h2>
            <p className="text-mute2 text-sm leading-relaxed">
              Мы верифицируем ваш платёж через GGsel и создаём ваш личный кабинет VPN. Пожалуйста, подождите...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-height-screen px-4 text-center">
        <div className="sec-dash-ambient-1" />
        <div className="sec-dash-ambient-2" />
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-lg w-full bg-white/[0.02] border border-red-500/10 p-10 rounded-3xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black mb-2 text-white font-title tracking-tight">Ошибка активации</h2>
            <p className="text-red-400/90 text-sm leading-relaxed mb-4">{error}</p>
            <p className="text-mute2 text-xs leading-relaxed">
              Если оплата прошла успешно, но вы видите эту ошибку, обратитесь в нашу поддержку в Telegram. Мы поможем вам вручную.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => window.open('https://t.me/Veil_Vps_bot', '_blank')}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-white font-semibold transition-all text-sm"
            >
              <MessageSquare className="w-4 h-4 text-[#00f0ff]" /> Техподдержка в TG
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3.5 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all text-sm"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-20 px-4 flex flex-col items-center min-height-screen relative z-10">
      <div className="sec-dash-ambient-1" />
      <div className="sec-dash-ambient-2" />

      <div 
        className="max-w-2xl w-full p-8 sm:p-10 rounded-3xl backdrop-blur-2xl bg-[#06060c]/80 flex flex-col items-center gap-8 shadow-2xl relative"
        style={glowStyle}
      >
        {/* Success Icon Badge */}
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
          <Check className="w-10 h-10 text-green-500" strokeWidth={3} />
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-white font-title tracking-tight mb-2">
            Подписка активирована!
          </h1>
          <p className="text-mute2 text-sm max-w-md mx-auto">
            Спасибо за покупку на GGsel. Доступ к вашему VPN успешно настроен и готов к работе.
          </p>
        </div>

        {/* Info Box */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl">
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-mute2 mb-1">Почта клиента</span>
            <span className="font-mono text-sm text-white font-bold">{data?.email}</span>
          </div>
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-mute2 mb-1">Период подписки</span>
            <span className="font-mono text-sm text-[#00f0ff] font-bold">
              +{data?.durationDays} дней ({formatDate(data?.expiresAt || '')})
            </span>
          </div>
        </div>

        {/* Cabinet Link Box */}
        <div className="w-full flex flex-col gap-3">
          <label className="block text-[11px] uppercase tracking-wider text-mute2 font-semibold">
            Ваша персональная ссылка на личный кабинет:
          </label>
          <div className="flex items-center gap-2 bg-[#0a0a14] border border-white/10 rounded-xl p-1.5 pl-4">
            <span className="font-mono text-xs sm:text-sm text-white/90 truncate flex-1 select-all">
              {window.location.origin}/cabinet/{data?.token}
            </span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 h-10 px-4 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 text-white font-semibold text-xs sm:text-sm transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Скопировано!' : 'Копировать'}
            </button>
          </div>
          <p className="text-[11px] text-mute2 leading-relaxed">
            <strong className="text-amber-500/90">Важно:</strong> Сохраните эту ссылку в закладки. Через нее вы будете управлять подпиской, добавлять новые устройства и общаться со службой поддержки.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate(`/cabinet/${data?.token}`)}
          className="w-full h-14 bg-gradient-to-r from-[#00f0ff] to-[#a855f7] hover:brightness-110 active:scale-[0.99] text-black font-black font-cyber rounded-xl flex items-center justify-center gap-2 text-base transition-all shadow-[0_0_30px_rgba(0,240,255,0.25)] tracking-wide"
        >
          Войти в личный кабинет <ArrowRight className="w-5 h-5" />
        </button>

        {/* Instructions Divider */}
        <div className="w-full border-t border-white/[0.05] pt-6 flex flex-col gap-4">
          <h3 className="text-sm uppercase tracking-wider font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#00f0ff]" /> Как подключить VPN прямо сейчас?
          </h3>

          {/* Tab buttons */}
          <div className="flex gap-1 bg-white/[0.03] p-1 border border-white/[0.05] rounded-xl w-full">
            {(['ios', 'android', 'windows', 'macos'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs uppercase font-bold tracking-wider rounded-lg transition-all ${
                  activeTab === tab 
                    ? 'bg-[#00f0ff] text-black shadow-md' 
                    : 'text-mute2 hover:text-white'
                }`}
              >
                {tab === 'ios' ? 'iOS / Apple' : tab === 'android' ? 'Android' : tab === 'windows' ? 'Windows' : 'macOS'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-[#0a0a14] border border-white/[0.05] p-5 rounded-2xl text-xs sm:text-sm text-mute2 leading-relaxed space-y-3">
            {activeTab === 'ios' && (
              <>
                <p>1. Скачайте приложение <strong className="text-white">Streisand</strong> или <strong className="text-white">V2Box</strong> из App Store.</p>
                <p>2. Нажмите кнопку <strong className="text-white">"Войти в личный кабинет"</strong> выше.</p>
                <p>3. В кабинете скопируйте VLESS-ссылку подключения под нужной страной.</p>
                <p>4. Откройте приложение, нажмите кнопку добавления новой конфигурации (+) и выберите импорт из буфера обмена (Import from Clipboard).</p>
                <p>5. Нажмите на импортированный сервер для подключения. Поздравляем, VPN работает!</p>
              </>
            )}
            {activeTab === 'android' && (
              <>
                <p>1. Скачайте приложение <strong className="text-white">v2rayNG</strong> или <strong className="text-white">Hiddify</strong> из Google Play.</p>
                <p>2. Нажмите кнопку <strong className="text-white">"Войти в личный кабинет"</strong> выше.</p>
                <p>3. Скопируйте ссылку подписки или VLESS-ключ нужной локации.</p>
                <p>4. В приложении нажмите (+), выберите «Импорт профиля из буфера обмена».</p>
                <p>5. Нажмите на добавленный сервер и нажмите на круглый значок подключения снизу справа.</p>
              </>
            )}
            {activeTab === 'windows' && (
              <>
                <p>1. Скачайте клиент <strong className="text-white">v2rayN</strong> или <strong className="text-white">Hiddify</strong> с нашего сайта или GitHub.</p>
                <p>2. Запустите приложение и скопируйте VLESS-ключ из своего Личного Кабинета.</p>
                <p>3. Вставьте ключ через сочетание клавиш <strong className="text-white">Ctrl + V</strong> прямо в окно v2rayN.</p>
                <p>4. Нажмите правой кнопкой мыши по иконке программы в трее, выберите «Системный прокси» → «Глобальный».</p>
              </>
            )}
            {activeTab === 'macos' && (
              <>
                <p>1. Скачайте приложение <strong className="text-white">FoXray</strong> или <strong className="text-white">V2Box</strong> из Mac App Store.</p>
                <p>2. Скопируйте ссылку подключения из Личного Кабинета.</p>
                <p>3. Вставьте ссылку в программу через добавление конфига из буфера обмена (Import from clipboard).</p>
                <p>4. Активируйте соединение кнопкой Connect.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
