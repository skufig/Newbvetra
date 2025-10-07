import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js'

/**
 * Форматирует номер в международном виде (например: +7 999 123 45 67)
 */
export function formatPhoneForDisplay(val: string) {
  try {
    const digits = val.replace(/[^\d+]/g, '')
    const asYou = new AsYouType()
    asYou.input(digits)
    const number = asYou.getNumber()
    return number ? number.formatInternational() : digits
  } catch {
    return val
  }
}

/**
 * Проверяет, валиден ли номер телефона
 */
export function isValidPhone(phone: string) {
  try {
    const number = parsePhoneNumberFromString(phone)
    return number?.isValid() || false
  } catch {
    return false
  }
}

// ✅ Для обратной совместимости (старые вызовы)
export const formatPhoneNumber = formatPhoneForDisplay
export const isValidPhoneNumber = isValidPhone
