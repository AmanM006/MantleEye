'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface WalletContextType {
  walletConnected: boolean
  walletAddress: string
  connecting: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
}

const WalletContext = createContext<WalletContextType>({
  walletConnected: false,
  walletAddress: '',
  connecting: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
})

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [connecting, setConnecting] = useState(false)

  // Re-check if already connected on mount (MetaMask remembers permission)
  useEffect(() => {
    const checkExisting = async () => {
      if (typeof window === 'undefined' || !(window as any).ethereum) return
      try {
        const accounts: string[] = await (window as any).ethereum.request({
          method: 'eth_accounts', // does NOT prompt, just reads current
        })
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0])
          setWalletConnected(true)
        }
      } catch {}
    }
    checkExisting()

    // Listen for account/chain changes globally
    const eth = (window as any).ethereum
    if (!eth) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletConnected(false)
        setWalletAddress('')
      } else {
        setWalletAddress(accounts[0])
        setWalletConnected(true)
      }
    }

    eth.on('accountsChanged', handleAccountsChanged)
    return () => eth.removeListener('accountsChanged', handleAccountsChanged)
  }, [])

  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      alert('MetaMask not detected. Please install MetaMask to connect your wallet.')
      return
    }
    setConnecting(true)
    try {
      const accounts: string[] = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      })
      if (!accounts || accounts.length === 0) return
      setWalletAddress(accounts[0])
      setWalletConnected(true)

      // Switch to / add Mantle Sepolia (5003 = 0x138B)
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x138B' }],
        })
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x138B',
              chainName: 'Mantle Sepolia Testnet',
              nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
              rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
              blockExplorerUrls: ['https://sepolia.mantlescan.xyz'],
            }],
          })
        }
      }
    } catch (err: any) {
      if (err.code !== 4001) console.error('Wallet connection error:', err)
    } finally {
      setConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setWalletConnected(false)
    setWalletAddress('')
  }

  return (
    <WalletContext.Provider value={{ walletConnected, walletAddress, connecting, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  return useContext(WalletContext)
}
