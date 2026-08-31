import { createHash, randomInt } from 'node:crypto'

export type OwnerOtpMethod = 'phone' | 'email'

export function generateOwnerOtp(method: OwnerOtpMethod): string {
  if (method === 'email') return String(randomInt(0, 1_000_000)).padStart(6, '0')

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let value = ''
  for (let i = 0; i < 8; i++) value += alphabet[randomInt(0, alphabet.length)]
  return value
}

export function hashOwnerOtp(code: string, secret: string): string {
  return createHash('sha256').update(`${secret}:${code}`).digest('hex')
}

export function ownerOtpExpiry(method: OwnerOtpMethod, now = new Date()): Date {
  const minutes = method === 'phone' ? 5 : 10
  return new Date(now.getTime() + minutes * 60_000)
}
