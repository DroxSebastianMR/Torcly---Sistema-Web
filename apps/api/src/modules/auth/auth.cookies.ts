import type { Request, Response } from 'express'
import { env } from '../../config/env.js'

const maxAge = env.SESSION_IDLE_MINUTES * 60 * 1000

export function readSessionCookie(request: Request) {
  const cookies = request.headers.cookie?.split(';') ?? []

  for (const cookie of cookies) {
    const separator = cookie.indexOf('=')
    if (separator < 0) continue
    const name = cookie.slice(0, separator).trim()
    if (name !== env.SESSION_COOKIE_NAME) continue

    try {
      return decodeURIComponent(cookie.slice(separator + 1))
    } catch {
      return undefined
    }
  }

  return undefined
}

export function setSessionCookie(response: Response, token: string) {
  response.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(env.SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}
