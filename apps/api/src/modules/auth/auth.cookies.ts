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
    secure:
      env.NODE_ENV === 'production' || env.SESSION_COOKIE_SAME_SITE === 'none',
    sameSite: env.SESSION_COOKIE_SAME_SITE,
    path: '/',
    maxAge,
  })
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(env.SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure:
      env.NODE_ENV === 'production' || env.SESSION_COOKIE_SAME_SITE === 'none',
    sameSite: env.SESSION_COOKIE_SAME_SITE,
    path: '/',
  })
}

const IMPERSONATOR_COOKIE_NAME = `${env.SESSION_COOKIE_NAME}_impersonator`

export function readImpersonatorCookie(request: Request): string | undefined {
  const cookies = request.headers.cookie?.split(';') ?? []

  for (const cookie of cookies) {
    const separator = cookie.indexOf('=')
    if (separator < 0) continue
    const name = cookie.slice(0, separator).trim()
    if (name !== IMPERSONATOR_COOKIE_NAME) continue

    try {
      return decodeURIComponent(cookie.slice(separator + 1))
    } catch {
      return undefined
    }
  }

  return undefined
}

export function setImpersonatorCookie(response: Response, token: string) {
  response.cookie(IMPERSONATOR_COOKIE_NAME, token, {
    httpOnly: true,
    secure:
      env.NODE_ENV === 'production' || env.SESSION_COOKIE_SAME_SITE === 'none',
    sameSite: env.SESSION_COOKIE_SAME_SITE,
    path: '/',
    maxAge: 4 * 60 * 60 * 1000, // 4 horas para soporte
  })
}

export function clearImpersonatorCookie(response: Response) {
  response.clearCookie(IMPERSONATOR_COOKIE_NAME, {
    httpOnly: true,
    secure:
      env.NODE_ENV === 'production' || env.SESSION_COOKIE_SAME_SITE === 'none',
    sameSite: env.SESSION_COOKIE_SAME_SITE,
    path: '/',
  })
}
