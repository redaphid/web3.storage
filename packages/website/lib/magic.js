import { Magic } from 'magic-sdk'
import { OAuthExtension } from '@magic-ext/oauth'
import constants from './constants'

const API = constants.API
/** @type {import('magic-sdk').Magic | null} */
let magic = null

export function getMagic() {
  console.log('getMagic()')
  if (magic) {
    return magic
  }
  console.log({constants})
  magic = new Magic(constants.MAGIC_TOKEN, {
    extensions: [new OAuthExtension()],
  })

  console.log(`oh hey there ${magic}`)
  return magic
}

/**
 * Login request
 *
 * @param {string} [token]
 */
export async function login(token, type = 'magic', data = {}) {
  const res = await fetch(API + '/user/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify({
      type,
      data,
    }),
  })
  if (!res.ok) {
    throw new Error(`failed to login user: ${await res.text()}`)
  }
  return res.json()
}

export async function isLoggedIn() {
  return getMagic().user.isLoggedIn()
}

/**
 * Login with email
 *
 * @param {string} email
 */
export async function loginEmail(email) {
  const didToken = await getMagic().auth.loginWithMagicLink({
    email: email,
    redirectURI: new URL('/callback/', window.location.origin).href,
  })

  if (didToken) {
    const data = await login(didToken)
    return data
  }

  throw new Error('Login failed.')
}

/**
 * Login with social
 *
 * @param {string} provider
 */
export async function loginSocial(provider) {
  // @ts-ignore - TODO fix Magic extension types
  await getMagic().oauth.loginWithRedirect({
    provider,
    redirectURI: new URL('/callback/', window.location.origin).href,
  })
}

export async function redirectMagic() {
  const idToken = await getMagic().auth.loginWithCredential()
  if (idToken) {
    try {
      const data = await login(idToken)
      return { ...data, idToken }
    } catch (err) {
      await getMagic().user.logout()
      throw err
    }
  }

  throw new Error('Login failed.')
}

export async function redirectSocial() {
  // @ts-ignore - TODO fix Magic extension types
  const result = await getMagic().oauth.getRedirectResult()
  try {
    const data = await login(result.magic.idToken, 'github', result)
    return { ...data, idToken: result.magic.idToken }
  } catch (err) {
    await getMagic().user.logout()
    throw err
  }
}
