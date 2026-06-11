'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface EducationContextType {
  isEducationMode: boolean
  toggleEducationMode: () => void
}

const EducationContext = createContext<EducationContextType | undefined>(undefined)

export function EducationProvider({ children }: { children: React.ReactNode }) {
  const [isEducationMode, setIsEducationMode] = useState<boolean>(false)

  // Hydrate state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('seye_education_mode')
    if (saved === 'true') {
      setIsEducationMode(true)
    }
  }, [])

  const toggleEducationMode = () => {
    setIsEducationMode((prev) => {
      const next = !prev
      localStorage.setItem('seye_education_mode', String(next))
      return next
    })
  }

  return (
    <EducationContext.Provider value={{ isEducationMode, toggleEducationMode }}>
      {children}
    </EducationContext.Provider>
  )
}

export function useEducationMode() {
  const context = useContext(EducationContext)
  if (context === undefined) {
    throw new Error('useEducationMode must be used within an EducationProvider')
  }
  return context
}
