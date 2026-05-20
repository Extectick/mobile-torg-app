export const MINIMUM_ORDER_AMOUNT = 7000

export const formatMoney = (value: number) => `${Math.ceil(value).toLocaleString('ru-RU')} ₽`

export const formatQuantity = (value: number) => (
  Number.isInteger(value) ? String(value) : value.toLocaleString('ru-RU')
)

export const getMinimumOrderProgressColor = (progress: number) => {
  const normalizedProgress = Math.max(0, Math.min(progress, 100))

  if (normalizedProgress >= 100) {
    return '#9ac42c'
  }

  if (normalizedProgress <= 80) {
    const redHue = 0
    const orangeHue = 36
    const hue = redHue + (orangeHue - redHue) * (normalizedProgress / 80)

    return `hsl(${hue} 86% 52%)`
  }

  const orangeHue = 36
  const yellowHue = 50
  const hue = orangeHue + (yellowHue - orangeHue) * ((normalizedProgress - 80) / 20)

  return `hsl(${hue} 88% 50%)`
}
