"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { getAuthToken, getAuthNickname, setAuthToken, setAuthNickname, removeAuthToken } from "@/lib/api"

interface AuthContextType {
  isAuthenticated: boolean
  nickname: string | null
  isLoading: boolean
  login: (token: string, nickname: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [nickname, setNickname] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing auth token on mount
    const token = getAuthToken()
    const storedNickname = getAuthNickname()
    
    if (token) {
      setIsAuthenticated(true)
      setNickname(storedNickname)
    }
    
    setIsLoading(false)
  }, [])

  const login = (token: string, nickname: string) => {
    setAuthToken(token)
    setAuthNickname(nickname)
    setIsAuthenticated(true)
    setNickname(nickname)
  }

  const logout = () => {
    removeAuthToken()
    setIsAuthenticated(false)
    setNickname(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, nickname, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

