export function getTelegram() {
  return window.Telegram?.WebApp ?? null
}

export function initTelegram() {
  const tg = getTelegram()
  if (!tg) return null

  tg.ready()
  tg.expand()

  try {
    tg.setHeaderColor('#0a3d4a')
    tg.setBackgroundColor('#071e26')
  } catch {
    // older clients may not support theme setters
  }

  return tg
}

export function getTelegramUser() {
  const user = getTelegram()?.initDataUnsafe?.user
  if (!user) return null
  return {
    id: user.id,
    username: user.username || null,
    name: [user.first_name, user.last_name].filter(Boolean).join(' ') || null,
  }
}

export function haptic(type = 'light') {
  try {
    getTelegram()?.HapticFeedback?.impactOccurred(type)
  } catch {
    // ignore
  }
}
