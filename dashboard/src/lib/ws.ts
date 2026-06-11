import { mockPrices, mockSignals, mockAgentLog, Signal, PriceTick } from './mock-data'

type WSMessageHandler = (data: any) => void

export class MantleEyeSocket {
  private socket: WebSocket | null = null
  private handlers: { [channel: string]: WSMessageHandler[] } = {}
  private reconnectInterval = 1000
  private maxReconnectInterval = 30000
  private isConnecting = false
  private simulationIntervalId: any = null

  constructor() {
    this.connect()
  }

  public subscribe(channel: string, handler: WSMessageHandler) {
    if (!this.handlers[channel]) {
      this.handlers[channel] = []
    }
    this.handlers[channel].push(handler)
    return () => this.unsubscribe(channel, handler)
  }

  public unsubscribe(channel: string, handler: WSMessageHandler) {
    if (this.handlers[channel]) {
      this.handlers[channel] = this.handlers[channel].filter((h) => h !== handler)
    }
  }

  private connect() {
    if (typeof window === 'undefined') return
    if (this.socket || this.isConnecting) return

    this.isConnecting = true
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/live'
    
    console.log(`Connecting to WebSocket: ${wsUrl}...`)
    
    try {
      this.socket = new WebSocket(wsUrl)
      
      this.socket.onopen = () => {
        console.log('WebSocket connected to server.')
        this.isConnecting = false
        this.reconnectInterval = 1000
        this.stopSimulation()
      }

      this.socket.onmessage = (event) => {
        try {
          const envelope = JSON.parse(event.data)
          const { channel, data } = envelope
          if (channel && this.handlers[channel]) {
            this.handlers[channel].forEach((handler) => handler(data))
          }
        } catch (e) {
          console.error('Error parsing WS message:', e)
        }
      }

      this.socket.onclose = () => {
        console.warn('WebSocket disconnected. Scheduling reconnect...')
        this.cleanup()
        this.scheduleReconnect()
        this.startSimulation()
      }

      this.socket.onerror = (err) => {
        console.error('WebSocket error:', err)
      }
    } catch (e) {
      console.error('WebSocket connection initialization failed:', e)
      this.isConnecting = false
      this.scheduleReconnect()
      this.startSimulation()
    }
  }

  private cleanup() {
    if (this.socket) {
      this.socket.onopen = null
      this.socket.onmessage = null
      this.socket.onclose = null
      this.socket.onerror = null
      this.socket = null
    }
    this.isConnecting = false
  }

  private scheduleReconnect() {
    setTimeout(() => {
      this.reconnectInterval = Math.min(this.reconnectInterval * 2, this.maxReconnectInterval)
      this.connect()
    }, this.reconnectInterval)
  }

  // --- Live Mock Simulation Fallback ---
  // Fires events periodically when the backend server is offline
  private startSimulation() {
    if (this.simulationIntervalId) return
    console.log('Starting client-side UI simulation loop...')
    
    this.simulationIntervalId = setInterval(() => {
      const chance = Math.random()
      
      if (chance < 0.40) {
        // 1. Simulate Price Tick update
        const randomAssetIndex = Math.floor(Math.random() * mockPrices.length)
        const basePrice = mockPrices[randomAssetIndex]
        const drift = (Math.random() - 0.5) * 0.015 // max 1.5% drift
        const newPrice = basePrice.price * (1 + drift)
        
        const tickUpdate: PriceTick = {
          symbol: basePrice.symbol,
          price: parseFloat(newPrice.toFixed(4)),
          change_24h: parseFloat((basePrice.change_24h + drift * 100).toFixed(2)),
        }
        
        // Notify subscribers
        this.trigger('prices', tickUpdate)
      } else if (chance < 0.65) {
        // 2. Simulate Agent log actions
        const sampleLogs = [
          'Scanning Merchant Moe LP flows on Mantle Sepolia...',
          'Smart money wallet 0x8894E... detected executing collateral swap',
          'Analyzing price deviations: mETH discount narrows',
          'Executing automated risk limits audit... OK',
          'Updating on-chain AgentRegistry NFT win-rate cache...',
        ]
        const randomLog = sampleLogs[Math.floor(Math.random() * sampleLogs.length)]
        const date = new Date()
        const logTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
        
        this.trigger('agent_actions', {
          timestamp: logTime,
          message: randomLog,
          type: 'info'
        })
      } else if (chance < 0.72) {
        // 3. Simulate new alpha signals occasionally
        const assets = ['WMNT/USDT', 'mETH/USDT', 'USDY/USDT']
        const randomAsset = assets[Math.floor(Math.random() * assets.length)]
        const direction = Math.random() > 0.5 ? 'BUY' : 'SELL'
        const confidence = parseFloat((0.65 + Math.random() * 0.32).toFixed(2))
        
        const newSignal: Signal = {
          id: `sig_${Math.floor(Math.random() * 1000 + 100)}`,
          asset: randomAsset,
          signal_type: direction as any,
          confidence,
          price_at_signal: randomAsset === 'mETH/USDT' ? 3850 : 0.85,
          reasoning: `Dynamic cluster analysis: wallet 0x742d accumulation triggers standard ${direction} parameters.`,
          created_at: new Date().toISOString()
        }
        this.trigger('signals', newSignal)
      }
    }, 4000)
  }

  private stopSimulation() {
    if (this.simulationIntervalId) {
      clearInterval(this.simulationIntervalId)
      this.simulationIntervalId = null
      console.log('Client-side UI simulation loop stopped.')
    }
  }

  private trigger(channel: string, data: any) {
    if (this.handlers[channel]) {
      this.handlers[channel].forEach((handler) => handler(data))
    }
  }
}
export const socketClient = new MantleEyeSocket()
