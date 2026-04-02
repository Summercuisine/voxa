// 格式化相对时间
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 30) return `${days} 天前`
  if (days < 365) return `${Math.floor(days / 30)} 个月前`
  return `${Math.floor(days / 365)} 年前`
}

// 截断文本
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// 获取默认头像
export function getDefaultAvatar(): string {
  return 'https://api.dicebear.com/7.x/initials/svg?seed=Voxa'
}

// 获取用户头像（带默认值）
export function getUserAvatar(avatar?: string | null, username?: string): string {
  if (avatar) return avatar
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username || 'U')}`
}
