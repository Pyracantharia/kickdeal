export const SUPPORT_SWITCH_EVENT = 'kickdeal:support-switch'
export const SUPPORT_SWITCH_STORAGE_KEY = 'kickdeal.supportSwitching'

export function isSupportSwitching(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.sessionStorage.getItem(SUPPORT_SWITCH_STORAGE_KEY) === '1'
}

export function startSupportSwitch() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(SUPPORT_SWITCH_STORAGE_KEY, '1')
  window.dispatchEvent(new Event(SUPPORT_SWITCH_EVENT))
}

export function clearSupportSwitch() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(SUPPORT_SWITCH_STORAGE_KEY)
  window.dispatchEvent(new Event(SUPPORT_SWITCH_EVENT))
}
