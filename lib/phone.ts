import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js'

export function formatPhoneForDisplay(val: string) {
  try {
    const asYou = new AsYouType()
    asYou.input(val||'')
    const num = asYou.getNumber()
    return num ? num.formatInternational() : String(val)
  } catch { return String(val) }
}

export function isValidPhone(val: string) {
  try {
    const p = parsePhoneNumberFromString(String(val||''))
    return !!p && p.isValid()
  } catch { return false }
}
