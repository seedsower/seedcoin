import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Wallet, Copy, ExternalLink, AlertCircle } from 'lucide-react'

// Mock wallet connection for demonstration
const WalletConnect = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [balance, setBalance] = useState({
    sol: 0,
    seeds: 0,
    sdao: 0
  })
  const [isConnecting, setIsConnecting] = useState(false)

  // Mock wallet connection
  const connectWallet = async () => {
    setIsConnecting(true)
    
    // Simulate wallet connection delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock successful connection
    const mockAddress = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
    setWalletAddress(mockAddress)
    setIsConnected(true)
    setBalance({
      sol: 2.45,
      seeds: 1250.00,
      sdao: 500.00
    })
    setIsConnecting(false)
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setWalletAddress('')
    setBalance({ sol: 0, seeds: 0, sdao: 0 })
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-green-600" />
          <CardTitle>Connect Your Wallet</CardTitle>
          <CardDescription>
            Connect your Solana wallet to start using SeedCoin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={connectWallet} 
              disabled={isConnecting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isConnecting ? 'Connecting...' : 'Phantom'}
            </Button>
            <Button 
              onClick={connectWallet} 
              disabled={isConnecting}
              variant="outline"
            >
              {isConnecting ? 'Connecting...' : 'Solflare'}
            </Button>
            <Button 
              onClick={connectWallet} 
              disabled={isConnecting}
              variant="outline"
            >
              {isConnecting ? 'Connecting...' : 'Ledger'}
            </Button>
            <Button 
              onClick={connectWallet} 
              disabled={isConnecting}
              variant="outline"
            >
              {isConnecting ? 'Connecting...' : 'Backpack'}
            </Button>
          </div>
          
          <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Demo Mode</p>
              <p>This is a demonstration. Click any wallet to simulate connection.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            <CardTitle className="text-lg">Wallet Connected</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={disconnectWallet}
            className="text-red-600 hover:text-red-700"
          >
            Disconnect
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
            {formatAddress(walletAddress)}
          </code>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={copyAddress}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-3">Token Balances</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">SOL</Badge>
                <span className="text-sm text-gray-600">Solana</span>
              </div>
              <span className="font-medium">{balance.sol.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">SEEDS</Badge>
                <span className="text-sm text-gray-600">Seed Stable</span>
              </div>
              <span className="font-medium">{balance.seeds.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">SDAO</Badge>
                <span className="text-sm text-gray-600">SeedDAO</span>
              </div>
              <span className="font-medium">{balance.sdao.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <div className="text-xs text-gray-500 text-center">
            Network: Solana Mainnet
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default WalletConnect

