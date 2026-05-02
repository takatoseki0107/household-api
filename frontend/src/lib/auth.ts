import { Amplify } from 'aws-amplify'
import { signIn, signOut, signUp, confirmSignUp, getCurrentUser as amplifyGetCurrentUser, fetchAuthSession } from 'aws-amplify/auth'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    },
  },
})

export async function login(email: string, password: string) {
  return await signIn({ username: email, password })
}

export async function logout() {
  await signOut()
}

export async function register(email: string, password: string) {
  return await signUp({ username: email, password, options: { userAttributes: { email } } })
}

export async function confirmRegister(email: string, code: string) {
  return await confirmSignUp({ username: email, confirmationCode: code })
}

export async function getCurrentUser() {
  return await amplifyGetCurrentUser()
}

export async function getIdToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession()
    return session.tokens?.idToken?.toString() ?? null
  } catch {
    return null
  }
}
