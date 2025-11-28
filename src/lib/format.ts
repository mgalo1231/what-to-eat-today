export const formatDate = (iso?: string) => {
  if (!iso) return '无'
  const date = new Date(iso)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export const daysUntil = (iso?: string) => {
  if (!iso) return undefined
  const target = new Date(iso).getTime()
  const diff = target - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

