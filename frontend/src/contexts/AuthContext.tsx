import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getCurrentUser, getIdToken, logout } from '../lib/auth'

type AuthState = {
  isAuthenticated: boolean
  isLoading: boolean
  idToken: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [idToken, setIdToken] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      await getCurrentUser()
      const token = await getIdToken()
      setIdToken(token)
      setIsAuthenticated(true)
    } catch {
      setIsAuthenticated(false)
      setIdToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function signOut() {
    await logout()
    setIsAuthenticated(false)
    setIdToken(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, idToken, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
