export function formatNumberInput(value: string): string {
  const normalized = value.replace(/[^\d.,]/g, '').replace(',', '.')
  const [integerPart, decimalPart] = normalized.split('.')
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  if (decimalPart === undefined) {
    return formattedInteger
  }

  return `${formattedInteger}.${decimalPart.slice(0, 2)}`
}

export function parseFormattedNumber(value: string): number | undefined {
  const normalized = value.replace(/\s/g, '').replace(',', '.')

  if (!normalized) {
    return undefined
  }

  const numberValue = Number(normalized)

  return Number.isFinite(numberValue) ? numberValue : undefined
}

export function parseOptionalNumber(value: string): number | undefined {
  if (!value) {
    return undefined
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : undefined
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}