import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { ArrowUpDown, Settings, TrendingUp, AlertTriangle, Zap } from 'lucide-react'

const TokenPurchase = () => {
  const [fromToken, setFromToken] = useState('SOL')
  const [toToken, setToToken] = useState('SEEDS')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [isSwapping, setIsSwapping] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Mock token prices
  const tokenPrices = {
    SOL: 145.32,
    SEEDS: 1.00,
    SDAO: 0.25,
    USDC: 1.00
  }

  // Mock user balances
  const balances = {
    SOL: 2.45,
    SEEDS: 1250.00,
    SDAO: 500.00,
    USDC: 100.00
  }

  const tokens = [
    { symbol: 'SOL', name: 'Solana', color: 'bg-blue-100 text-blue-800' },
    { symbol: 'SEEDS', name: 'Seed Stable', color: 'bg-green-100 text-green-800' },
    { symbol: 'SDAO', name: 'SeedDAO', color: 'bg-purple-100 text-purple-800' },
    { symbol: 'USDC', name: 'USD Coin', color: 'bg-gray-100 text-gray-800' }
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
  }, [fromAmount, toAmount, fromToken, toToken])

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
    setIsSwapping(true)
    
    // Simulate swap transaction
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Mock successful swap
    alert(`Successfully swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`)
    setFromAmount('')
    setToAmount('')
    setIsSwapping(false)
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

          {/* Swap Button */}
          <Button
            onClick={executeSwap}
            disabled={!fromAmount || !toAmount || isSwapping}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isSwapping ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Swapping...</span>
              </div>
            ) : (
              `Swap ${fromToken} for ${toToken}`
            )}
          </Button>

          {/* Route Information */}
          <div className="text-xs text-center text-gray-500">
            <div className="flex items-center justify-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>Best route via Jupiter • Powered by Solana</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TokenPurchase

