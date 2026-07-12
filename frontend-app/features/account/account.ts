import httpClient from '@/features/api'

export type AccountSecurity = {
  twoFactorEnabled: boolean
}

export type TwoFactorSetup = {
  otpAuthUri: string
  qrCodeSvg: string
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
  newPasswordConfirm: string
}

class AccountManager {
  async getSecurity() {
    return httpClient.get<AccountSecurity>('/account/security')
  }

  async changePassword(payload: ChangePasswordPayload) {
    return httpClient.patch<{ message: string }, ChangePasswordPayload>('/account/password', payload)
  }

  async setupTwoFactor() {
    return httpClient.post<TwoFactorSetup>('/account/2fa/setup', {})
  }

  async confirmTwoFactor(code: string) {
    return httpClient.post<{ message: string; twoFactorEnabled: boolean }>('/account/2fa/confirm', { code })
  }

  async disableTwoFactor(currentPassword: string) {
    return httpClient.remove<{ message: string; twoFactorEnabled: boolean }, { currentPassword: string }>(
      '/account/2fa',
      { currentPassword },
    )
  }
}

export const accountManager = new AccountManager()
