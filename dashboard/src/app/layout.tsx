import type { Metadata } from 'next'
import './globals.css'
import { EducationProvider } from '@/context/EducationContext'
import { WalletProvider } from '@/context/WalletContext'
import GlobalShaderGradient from '@/components/GlobalShaderGradient'

export const metadata: Metadata = {
  title: 'MANTLEYE | On-Chain AI Intelligence & Trading',
  description: 'Dual-layer AI analytics and autonomous execution dashboard on Mantle Network.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-primary text-text-primary font-sans antialiased min-h-screen select-none">
        <EducationProvider>
          <WalletProvider>
            <GlobalShaderGradient />
            {children}
          </WalletProvider>
        </EducationProvider>
      </body>
    </html>
  )
}
