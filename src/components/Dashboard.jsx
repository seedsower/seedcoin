import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Coins, 
  Users, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sprout,
  Shield,
  Wallet,
  BarChart3,
  Vote
} from 'lucide-react'
import Analytics from './Analytics.jsx'
import SeedStableProtocol from './SeedStableProtocol.jsx'
import TokenPurchase from './TokenPurchase.jsx'
import Governance from './Governance.jsx'
import WalletConnect from './WalletConnect.jsx'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data
  const portfolioData = {
    totalValue: 2847.32,
    change24h: 5.67,
    changePercent: 2.34
  }

  const positions = [
    {
      token: 'SEEDS',
      amount: 1250.00,
      value: 1250.00,
      change: 0.00,
      changePercent: 0.00,
      color: 'bg-green-100 text-green-800'
    },
    {
      token: 'SDAO',
      amount: 500.00,
      value: 125.00,
      change: 12.50,
      changePercent: 11.11,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      token: 'SOL',
      amount: 2.45,
      value: 356.03,
      change: -8.92,
      changePercent: -2.44,
      color: 'bg-blue-100 text-blue-800'
    }
  ]

  const recentTransactions = [
    {
      type: 'swap',
      from: 'SOL',
      to: 'SEEDS',
      amount: '0.5 SOL',
      value: '$72.66',
      time: '2 hours ago',
      status: 'completed'
    },
    {
      type: 'stake',
      token: 'SDAO',
      amount: '100 SDAO',
      value: '$25.00',
      time: '1 day ago',
      status: 'completed'
    },
    {
      type: 'vote',
      proposal: 'Increase staking rewards',
      amount: '250 SDAO',
      time: '3 days ago',
      status: 'completed'
    }
  ]

  const stakingPools = [
    {
      token: 'SDAO',
      apy: 18.5,
      staked: 250.00,
      rewards: 12.34,
      lockPeriod: '90 days',
      status: 'active',
      mint: '9N1zAerRJnQEqoCvabYmPzbokai2TMK5F8Jb8cEBZSvt', // Real SDAO mint
      programId: 'imhPqBdTKnajpiWiKY88kssdWC4eiwHvaLfQNu5vEvR'
    },
    {
      token: 'SEEDS',
      apy: 8.2,
      staked: 500.00,
      rewards: 5.67,
      lockPeriod: '30 days',
      status: 'active'
    }
  ]

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercent = (percent) => {
    const isPositive = percent >= 0
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
        {Math.abs(percent).toFixed(2)}%
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SeedCoin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Mainnet
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <WalletConnect />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="protocol">Protocol</TabsTrigger>
                <TabsTrigger value="swap">Swap</TabsTrigger>
                <TabsTrigger value="stake">Stake</TabsTrigger>
                <TabsTrigger value="governance">Governance</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Portfolio Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Wallet className="h-5 w-5" />
                      <span>Portfolio Overview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(portfolioData.totalValue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">24h Change</p>
                        <p className="text-2xl font-semibold">
                          {formatPercent(portfolioData.changePercent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">24h P&L</p>
                        <p className={`text-2xl font-semibold ${portfolioData.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {portfolioData.change24h >= 0 ? '+' : ''}{formatCurrency(portfolioData.change24h)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Token Positions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Coins className="h-5 w-5" />
                      <span>Your Positions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {positions.map((position) => (
                        <div key={position.token} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge variant="secondary" className={position.color}>
                              {position.token}
                            </Badge>
                            <div>
                              <p className="font-medium">{position.amount.toFixed(2)} {position.token}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {formatCurrency(position.value)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {formatPercent(position.changePercent)}
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {position.change >= 0 ? '+' : ''}{formatCurrency(position.change)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Recent Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentTransactions.map((tx, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              tx.type === 'swap' ? 'bg-blue-100' : 
                              tx.type === 'stake' ? 'bg-green-100' : 'bg-purple-100'
                            }`}>
                              {tx.type === 'swap' && <ArrowUpRight className="h-4 w-4 text-blue-600" />}
                              {tx.type === 'stake' && <Coins className="h-4 w-4 text-green-600" />}
                              {tx.type === 'vote' && <Vote className="h-4 w-4 text-purple-600" />}
                            </div>
                            <div>
                              <p className="font-medium capitalize">{tx.type}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {tx.type === 'swap' && `${tx.from} → ${tx.to}`}
                                {tx.type === 'stake' && `Staked ${tx.token}`}
                                {tx.type === 'vote' && tx.proposal}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{tx.amount || tx.value}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{tx.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Swap Tab */}
              <TabsContent value="swap">
                <TokenPurchase />
              </TabsContent>

              {/* Stake Tab */}
              <TabsContent value="stake" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Staking Positions</CardTitle>
                    <CardDescription>
                      Your current staking positions and rewards
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stakingPools.map((pool, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className={
                                pool.token === 'SDAO' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                              }>
                                {pool.token}
                              </Badge>
                              <span className="font-medium">{pool.apy}% APY</span>
                            </div>
                            <Badge variant="outline" className="text-green-600">
                              {pool.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Staked</p>
                              <p className="font-medium">{pool.staked} {pool.token}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Rewards</p>
                              <p className="font-medium text-green-600">{pool.rewards} {pool.token}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Lock Period</p>
                              <p className="font-medium">{pool.lockPeriod}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2 mt-4">
                            <Button size="sm" variant="outline">Claim Rewards</Button>
                            <Button size="sm" variant="outline">Unstake</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Governance Tab */}
              <TabsContent value="governance" className="space-y-6">
                <Governance />
              </TabsContent>

              {/* SeedStable Protocol Tab */}
              <TabsContent value="protocol" className="space-y-6">
                <SeedStableProtocol />
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <Analytics />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

