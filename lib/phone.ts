// lib/phone.ts
import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js'

export function formatPhoneForDisplay(val: string) {
  try {
    const digits = val.replace(/[^\d+]/g, '')
    const asYou = new AsYouType()
    asYou.input(digits)
    return asYou.getNumberValue() ? asYou.formatComplete() ?? digits : digits
  } catch {
    return val
  }
}

export function isValidPhone(val?: string) {
  if (!val) return false
  try {
    const pn = parsePhoneNumberFromString(val)
    return pn ? pn.isValid() : false
  } catch {
    return false
  }
}
