import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Wallet, Copy, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token'

const WalletConnect = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [balance, setBalance] = useState({
    sol: 0,
    seeds: 0,
    sdao: 0
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [connection, setConnection] = useState(null)
  const [provider, setProvider] = useState(null)
  
  // Token mint addresses on devnet
  const SEEDS_MINT = useMemo(() => new PublicKey('Eoyy5BhjVsRUTiyHoNbM675PAZHdyX7qGr1yndZezYQG'), [])
  const SDAO_MINT = useMemo(() => new PublicKey('9N1zAerRJnQEqoCvabYmPzbokai2TMK5F8Jb8cEBZSvt'), [])

  const fetchBalance = useCallback(async (publicKey, conn) => {
    try {
      // Fetch SOL balance
      const solBalance = await conn.getBalance(publicKey)
      
      // Fetch SEEDS token balance
      let seedsBalance = 0
      try {
        const seedsTokenAccount = await getAssociatedTokenAddress(SEEDS_MINT, publicKey)
        const accountInfo = await getAccount(conn, seedsTokenAccount)
        seedsBalance = Number(accountInfo.amount) / Math.pow(10, 6) // SEEDS has 6 decimals
      } catch {
        // Token account doesn't exist or no balance
        console.log('No SEEDS token account found or balance is 0')
        seedsBalance = 0
      }

      // Fetch SDAO token balance
      let sdaoBalance = 0
      try {
        const sdaoTokenAccount = await getAssociatedTokenAddress(SDAO_MINT, publicKey)
        const accountInfo = await getAccount(conn, sdaoTokenAccount)
        sdaoBalance = Number(accountInfo.amount) / Math.pow(10, 6) // SDAO has 6 decimals
      } catch {
        // Token account doesn't exist or no balance
        console.log('No SDAO token account found or balance is 0')
        sdaoBalance = 0
      }
      
      setBalance(prev => ({
        ...prev,
        sol: solBalance / LAMPORTS_PER_SOL,
        seeds: seedsBalance,
        sdao: sdaoBalance
      }))
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }, [SEEDS_MINT, SDAO_MINT])

  useEffect(() => {
    // Initialize Solana devnet connection
    const conn = new Connection('https://api.devnet.solana.com', 'confirmed')
    setConnection(conn)

    // Check if Phantom wallet is available
    const getProvider = () => {
      if ('phantom' in window) {
        const provider = window.phantom?.solana
        if (provider?.isPhantom) {
          return provider
        }
      }
      return null
    }

    const phantom = getProvider()
    setProvider(phantom)

    // Check if already connected
    if (phantom?.isConnected) {
      setIsConnected(true)
      setWalletAddress(phantom.publicKey.toString())
      fetchBalance(phantom.publicKey, conn)
    }
  }, [fetchBalance])

  const connectWallet = async () => {
    if (!provider) {
      alert('Phantom wallet not found! Please install Phantom wallet.')
      return
    }

    setIsConnecting(true)
    
    try {
      const response = await provider.connect()
      const publicKey = response.publicKey.toString()
      
      setWalletAddress(publicKey)
      setIsConnected(true)
      
      // Fetch SOL balance
      await fetchBalance(response.publicKey, connection)
      
      setIsConnecting(false)
    } catch (error) {
      console.error('Error connecting wallet:', error)
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    if (provider) {
      try {
        await provider.disconnect()
      } catch (error) {
        console.error('Error disconnecting wallet:', error)
      }
    }
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

  const openInExplorer = () => {
    window.open(`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`, '_blank')
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-green-600" />
          <CardTitle>Connect Your Wallet</CardTitle>
          <CardDescription>
            Connect your Solana wallet to start using SeedCoin on Devnet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Button 
              onClick={connectWallet} 
              disabled={isConnecting || !provider}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isConnecting ? 'Connecting...' : provider ? 'Connect Phantom' : 'Install Phantom'}
            </Button>
          </div>
          
          {!provider && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Phantom Wallet Required</p>
                <p>Please install the Phantom wallet browser extension to continue.</p>
                <a 
                  href="https://phantom.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 underline"
                >
                  Download Phantom
                </a>
              </div>
            </div>
          )}
          
          <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Solana Devnet</p>
              <p>Connected to Solana devnet for testing. Switch your wallet to devnet.</p>
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
            onClick={openInExplorer}
            className="h-6 w-6 p-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Token Balances</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchBalance(new PublicKey(walletAddress), connection)}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
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
            Network: Solana Devnet
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default WalletConnect

