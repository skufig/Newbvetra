import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js'

export function formatPhoneNumber(val: string) {
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

export function isValidPhoneNumber(phone: string) {
  try {
    const number = parsePhoneNumberFromString(phone)
    return number?.isValid() || false
  } catch {
    return false
  }
}
