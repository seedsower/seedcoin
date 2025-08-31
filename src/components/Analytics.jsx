import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Users, Coins, Activity, Target, Zap } from 'lucide-react'

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('7d')

  // Mock analytics data
  const protocolMetrics = {
    tvl: 2847320,
    tvlChange: 12.5,
    volume24h: 156780,
    volumeChange: -3.2,
    users: 1247,
    usersChange: 8.7,
    transactions: 4892,
    transactionsChange: 15.3
  }

  const tvlData = [
    { date: '2025-01-24', tvl: 2100000, seeds: 1200000, sdao: 900000 },
    { date: '2025-01-25', tvl: 2250000, seeds: 1300000, sdao: 950000 },
    { date: '2025-01-26', tvl: 2180000, seeds: 1250000, sdao: 930000 },
    { date: '2025-01-27', tvl: 2420000, seeds: 1400000, sdao: 1020000 },
    { date: '2025-01-28', tvl: 2650000, seeds: 1500000, sdao: 1150000 },
    { date: '2025-01-29', tvl: 2580000, seeds: 1450000, sdao: 1130000 },
    { date: '2025-01-30', tvl: 2847320, seeds: 1600000, sdao: 1247320 }
  ]

  const volumeData = [
    { date: '2025-01-24', volume: 120000, swaps: 89, stakes: 31 },
    { date: '2025-01-25', volume: 145000, swaps: 102, stakes: 43 },
    { date: '2025-01-26', volume: 98000, swaps: 67, stakes: 31 },
    { date: '2025-01-27', volume: 178000, swaps: 134, stakes: 44 },
    { date: '2025-01-28', volume: 203000, swaps: 156, stakes: 47 },
    { date: '2025-01-29', volume: 167000, swaps: 123, stakes: 44 },
    { date: '2025-01-30', volume: 156780, swaps: 118, stakes: 38 }
  ]

  const tokenDistribution = [
    { name: 'Staked SEEDS', value: 45, amount: 1250000 },
    { name: 'Circulating SEEDS', value: 35, amount: 875000 },
    { name: 'Treasury SEEDS', value: 20, amount: 500000 }
  ]

  const stakingMetrics = [
    { pool: 'SEEDS', apy: 8.2, staked: 1250000, rewards: 102600, participants: 456 },
    { pool: 'SDAO', apy: 18.5, staked: 500000, rewards: 92500, participants: 234 }
  ]

  const governanceData = [
    { month: 'Oct', proposals: 3, votes: 1200, participation: 65 },
    { month: 'Nov', proposals: 5, votes: 1890, participation: 72 },
    { month: 'Dec', proposals: 4, votes: 1650, participation: 68 },
    { month: 'Jan', proposals: 6, votes: 2340, participation: 78 }
  ]

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value Locked</p>
                <p className="text-2xl font-bold">{formatCurrency(protocolMetrics.tvl)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {protocolMetrics.tvlChange > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs ${protocolMetrics.tvlChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(protocolMetrics.tvlChange)}
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">24h Volume</p>
                <p className="text-2xl font-bold">{formatCurrency(protocolMetrics.volume24h)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {protocolMetrics.volumeChange > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs ${protocolMetrics.volumeChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(protocolMetrics.volumeChange)}
                  </span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{formatNumber(protocolMetrics.users)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {protocolMetrics.usersChange > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs ${protocolMetrics.usersChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(protocolMetrics.usersChange)}
                  </span>
                </div>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold">{formatNumber(protocolMetrics.transactions)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {protocolMetrics.transactionsChange > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs ${protocolMetrics.transactionsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(protocolMetrics.transactionsChange)}
                  </span>
                </div>
              </div>
              <Zap className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tvl" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tvl">TVL & Volume</TabsTrigger>
          <TabsTrigger value="tokens">Token Analytics</TabsTrigger>
          <TabsTrigger value="staking">Staking Metrics</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
        </TabsList>

        {/* TVL & Volume Tab */}
        <TabsContent value="tvl" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Value Locked</CardTitle>
                <CardDescription>Protocol TVL over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={tvlData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'TVL']}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Area type="monotone" dataKey="tvl" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Volume</CardTitle>
                <CardDescription>Trading volume and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Volume']}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Bar dataKey="volume" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Token Analytics Tab */}
        <TabsContent value="tokens" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>SEEDS Distribution</CardTitle>
                <CardDescription>Token allocation breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tokenDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tokenDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>TVL Composition</CardTitle>
                <CardDescription>Asset breakdown over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={tvlData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value)]}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Area type="monotone" dataKey="seeds" stackId="1" stroke="#10b981" fill="#10b981" />
                    <Area type="monotone" dataKey="sdao" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Staking Metrics Tab */}
        <TabsContent value="staking" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Staking Pools Performance</CardTitle>
                <CardDescription>APY and participation metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stakingMetrics.map((pool) => (
                    <div key={pool.pool} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{pool.pool} Pool</h4>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {pool.apy}% APY
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Staked</p>
                          <p className="font-medium">{formatCurrency(pool.staked)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Rewards</p>
                          <p className="font-medium">{formatCurrency(pool.rewards)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Participants</p>
                          <p className="font-medium">{formatNumber(pool.participants)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Staking Activity</CardTitle>
                <CardDescription>Stakes vs unstakes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="stakes" stroke="#10b981" name="Stakes" />
                    <Line type="monotone" dataKey="swaps" stroke="#3b82f6" name="Swaps" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Governance Tab */}
        <TabsContent value="governance" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Governance Participation</CardTitle>
                <CardDescription>Voting activity and engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={governanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="proposals" fill="#8b5cf6" name="Proposals" />
                    <Bar yAxisId="left" dataKey="votes" fill="#10b981" name="Total Votes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Participation Rate</CardTitle>
                <CardDescription>Voter engagement over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={governanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Participation']} />
                    <Line 
                      type="monotone" 
                      dataKey="participation" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Governance Activity</CardTitle>
              <CardDescription>Latest proposals and voting outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Increase Staking Rewards for SEEDS Pool</p>
                    <p className="text-sm text-gray-600">4,050 votes • 81% participation</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Passing</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Partnership with AgriTech Solutions</p>
                    <p className="text-sm text-gray-600">4,313 votes • 86% participation</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Passing</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Treasury Allocation for Marketing</p>
                    <p className="text-sm text-gray-600">4,010 votes • 80% participation</p>
                  </div>
                  <Badge className="bg-red-100 text-red-800">Failing</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Analytics

