import { useState, useEffect, useMemo } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { ArrowUpDown, TrendingUp, Settings, Zap, AlertTriangle } from 'lucide-react'
import { Connection, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

const TokenPurchase = () => {
  const [fromToken, setFromToken] = useState('SOL')
  const [toToken, setToToken] = useState('SEEDS')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [isSwapping, setIsSwapping] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [wallet, setWallet] = useState(null)
  const [connection, setConnection] = useState(null)
  const [balances, setBalances] = useState({
    SOL: 0,
    SEEDS: 0,
    SDAO: 0,
    USDC: 0
  })

  // Orca SDK removed due to persistent compatibility issues

  // Mock token prices (in production, fetch from Jupiter API)
  const tokenPrices = useMemo(() => ({
    SOL: 145.32,
    SEEDS: 1.00,
    SDAO: 0.25,
    USDC: 1.00
  }), [])

  useEffect(() => {
    // Initialize connection
    const conn = new Connection('https://api.devnet.solana.com', 'confirmed')
    setConnection(conn)

    // Get wallet provider
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
    setWallet(phantom)

    // Fetch balances if wallet is connected
    if (phantom?.isConnected) {
      fetchBalances(phantom.publicKey, conn)
    }
  }, [])

  const fetchBalances = async (publicKey, conn) => {
    try {
      // Fetch SOL balance
      const solBalance = await conn.getBalance(publicKey)
      setBalances(prev => ({
        ...prev,
        SOL: solBalance / LAMPORTS_PER_SOL
      }))
    } catch (error) {
      console.error('Error fetching balances:', error)
    }
  }

  const tokens = [
    { 
      symbol: 'SOL', 
      name: 'Solana', 
      color: 'bg-blue-100 text-blue-800',
      mint: 'So11111111111111111111111111111111111111112'
    },
    { 
      symbol: 'SEEDS', 
      name: 'Seed Stable', 
      color: 'bg-green-100 text-green-800',
      mint: 'Eoyy5BhjVsRUTiyHoNbM675PAZHdyX7qGr1yndZezYQG'
    },
    { 
      symbol: 'SDAO', 
      name: 'SeedDAO', 
      color: 'bg-purple-100 text-purple-800',
      mint: '9N1zAerRJnQEqoCvabYmPzbokai2TMK5F8Jb8cEBZSvt' // Real SDAO mint address
    },
    { 
      symbol: 'USDC', 
      name: 'USD Coin', 
      color: 'bg-gray-100 text-gray-800',
      mint: null
    }
  ]

  // Calculate exchange rate and amounts
  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      const fromPrice = tokenPrices[fromToken]
      const toPrice = tokenPrices[toToken]
      const calculatedAmount = (parseFloat(fromAmount) * fromPrice / toPrice).toFixed(6)
      setToAmount(calculatedAmount)
    } else if (toAmount && fromToken && toToken) {
      const fromPrice = tokenPrices[fromToken]
      const toPrice = tokenPrices[toToken]
      const calculatedAmount = (parseFloat(toAmount) * toPrice / fromPrice).toFixed(6)
      setFromAmount(calculatedAmount)
    }
  }, [fromAmount, toAmount, fromToken, toToken, tokenPrices])

  const handleSwapTokens = () => {
    const tempToken = fromToken
    const tempAmount = fromAmount
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  const handleMaxClick = () => {
    const maxBalance = balances[fromToken] || 0
    setFromAmount(maxBalance.toString())
  }

  const executeSwap = async () => {
    if (!wallet || !wallet.isConnected) {
      alert('Please connect your wallet first')
      return
    }

    if (!connection) {
      alert('Connection not initialized')
      return
    }

    setIsSwapping(true)
    
    try {
      // Check if we have a SOL/SEEDS swap with Orca pool
      if ((fromToken === 'SOL' && toToken === 'SEEDS') || (fromToken === 'SEEDS' && toToken === 'SOL')) {
        const fromTokenData = tokens.find(t => t.symbol === fromToken)
        const toTokenData = tokens.find(t => t.symbol === toToken)
        
        const inputMint = fromTokenData.mint
        const outputMint = toTokenData.mint
        const amountInLamports = fromToken === 'SOL' 
          ? parseFloat(fromAmount) * LAMPORTS_PER_SOL 
          : parseFloat(fromAmount) * 1_000_000 // 6 decimals for SEEDS
        
        console.log(`Executing Jupiter swap: ${fromAmount} ${fromToken} → ${toToken}`)
        console.log(`Input mint: ${inputMint}`)
        console.log(`Output mint: ${outputMint}`)
        console.log(`Amount: ${amountInLamports}`)
        
        try {
          // Get quote from Jupiter API
          const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInLamports}&slippageBps=${parseFloat(slippage) * 100}`
          console.log('Fetching quote from:', quoteUrl)
          
          const quoteResponse = await fetch(quoteUrl)
          const quoteData = await quoteResponse.json()
          
          console.log('Quote API response:', quoteData)
          
          if (!quoteResponse.ok || quoteData.error) {
            throw new Error(quoteData.error || 'Failed to get quote from Jupiter')
          }
          
          // Get swap transaction from Jupiter API
          const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quoteResponse: quoteData,
              userPublicKey: wallet.publicKey.toString(),
              wrapAndUnwrapSol: true,
            })
          })

          const swapData = await swapResponse.json()
          console.log('Swap API response:', swapData)
          
          if (!swapResponse.ok || swapData.error) {
            throw new Error(swapData.error || 'Failed to get swap transaction')
          }

          const { swapTransaction } = swapData
          
          if (!swapTransaction) {
            throw new Error('No swap transaction returned from Jupiter API')
          }
          
          // Deserialize the transaction
          const binaryString = atob(swapTransaction)
          const transactionBuf = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            transactionBuf[i] = binaryString.charCodeAt(i)
          }
          
          const transaction = Transaction.from(transactionBuf)
          
          // Sign and send transaction
          const signedTransaction = await wallet.signTransaction(transaction)
          const signature = await connection.sendRawTransaction(signedTransaction.serialize())
          
          // Wait for confirmation
          await connection.confirmTransaction(signature)
          
          alert(`🎉 Swap successful!\n\nTransaction: ${signature}\n\nView on Solana Explorer (devnet)`)
          console.log(`View transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`)
          
        } catch (error) {
          console.error('Jupiter swap error:', error)
          
          if (error.message.includes('not tradable') || error.message.includes('TOKEN_NOT_TRADABLE')) {
            // Fallback for custom tokens not indexed by Jupiter
            const orcaPoolUrl = `https://www.orca.so/pools?chainId=solanaDevnet&tokens=${inputMint}&tokens=${outputMint}`
            
            alert(`
⚠️ Token Not Available on Jupiter

Your SEEDS token isn't indexed by Jupiter yet. 
Use your Orca pool directly:

Pool: SOL ↔ SEEDS
Amount: ${fromAmount} ${fromToken}

Opening Orca pool...
            `)
            
            window.open(orcaPoolUrl, '_blank')
          } else {
            alert(`Swap failed: ${error.message}`)
          }
        }
        
        // Refresh balances
        await fetchBalances(wallet.publicKey, connection)
      } else {
        // For other token combinations, show message about available pairs
        alert(`Direct swap not available. Currently supporting SOL ↔ SEEDS via Orca pool on devnet.`)
      }
      
      setFromAmount('')
      setToAmount('')
    } catch (error) {
      console.error('Swap failed:', error)
      alert(`Swap failed: ${error.message}`)
    } finally {
      setIsSwapping(false)
    }
  }

  const getExchangeRate = () => {
    if (!fromToken || !toToken) return '0'
    const rate = tokenPrices[fromToken] / tokenPrices[toToken]
    return rate.toFixed(6)
  }

  const getMinimumReceived = () => {
    if (!toAmount) return '0'
    const slippageDecimal = parseFloat(slippage) / 100
    const minimum = parseFloat(toAmount) * (1 - slippageDecimal)
    return minimum.toFixed(6)
  }

  const getPriceImpact = () => {
    // Mock price impact calculation
    const amount = parseFloat(fromAmount) || 0
    if (amount > 1000) return '2.5%'
    if (amount > 100) return '0.8%'
    return '0.1%'
  }

  const getNetworkFee = () => {
    return '0.00025 SOL (~$0.04)'
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-green-600" />
              <span>Token Swap</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Swap tokens with best rates via Jupiter aggregator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Settings Panel */}
          {showSettings && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label className="text-sm font-medium">Slippage Tolerance</label>
                <div className="flex space-x-2 mt-1">
                  {['0.1', '0.5', '1.0'].map((value) => (
                    <Button
                      key={value}
                      variant={slippage === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSlippage(value)}
                      className="text-xs"
                    >
                      {value}%
                    </Button>
                  ))}
                  <Input
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                    className="w-16 h-8 text-xs"
                    placeholder="Custom"
                  />
                </div>
              </div>
            </div>
          )}

          {/* From Token */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">From</label>
              <span className="text-xs text-gray-500">
                Balance: {balances[fromToken]?.toFixed(4) || '0.0000'}
              </span>
            </div>
            <div className="flex space-x-2">
              <Select value={fromToken} onValueChange={setFromToken}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className={token.color}>
                          {token.symbol}
                        </Badge>
                        <span className="text-sm">{token.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1 relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="pr-12"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMaxClick}
                  className="absolute right-1 top-1 h-6 text-xs text-green-600 hover:text-green-700"
                >
                  MAX
                </Button>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSwapTokens}
              className="h-8 w-8 p-0 rounded-full border"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">To</label>
              <span className="text-xs text-gray-500">
                Balance: {balances[toToken]?.toFixed(4) || '0.0000'}
              </span>
            </div>
            <div className="flex space-x-2">
              <Select value={toToken} onValueChange={setToToken}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className={token.color}>
                          {token.symbol}
                        </Badge>
                        <span className="text-sm">{token.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="0.00"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Transaction Details */}
          {fromAmount && toAmount && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Exchange Rate</span>
                <span>1 {fromToken} = {getExchangeRate()} {toToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Minimum Received</span>
                <span>{getMinimumReceived()} {toToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price Impact</span>
                <span className={parseFloat(getPriceImpact()) > 2 ? 'text-red-600' : 'text-green-600'}>
                  {getPriceImpact()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Network Fee</span>
                <span>{getNetworkFee()}</span>
              </div>
            </div>
          )}

          {/* Warning for high price impact */}
          {parseFloat(getPriceImpact()) > 2 && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium">High Price Impact</p>
                <p>This swap will significantly affect the token price. Consider reducing the amount.</p>
              </div>
            </div>
          )}

          {/* Wallet Connection Check */}
          {!wallet?.isConnected && (
            <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Wallet Not Connected</p>
                <p>Please connect your Phantom wallet to perform swaps.</p>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <Button
            onClick={executeSwap}
            disabled={!fromAmount || !toAmount || isSwapping || !wallet?.isConnected}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isSwapping ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Swapping...</span>
              </div>
            ) : !wallet?.isConnected ? (
              'Connect Wallet to Swap'
            ) : (
              `Swap ${fromToken} for ${toToken}`
            )}
          </Button>

          {/* Route Information */}
          <div className="text-xs text-center text-gray-500">
            <div className="flex items-center justify-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>SOL ↔ SEEDS via Orca Pool • Devnet</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TokenPurchase

