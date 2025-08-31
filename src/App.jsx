import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Sprout, Coins, Vote, TrendingUp, Shield, Users } from 'lucide-react'
import Dashboard from './components/Dashboard.jsx'
import './App.css'

// Landing Page Component
function LandingPage() {
  const [prices] = useState({
    seeds: 1.00,
    sdao: 0.25,
    sol: 145.32
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sprout className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">SeedCoin</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-green-600 dark:text-gray-300">Features</a>
            <a href="#tokens" className="text-gray-600 hover:text-green-600 dark:text-gray-300">Tokens</a>
            <a href="#governance" className="text-gray-600 hover:text-green-600 dark:text-gray-300">Governance</a>
            <Link to="/dashboard">
              <Button className="bg-green-600 hover:bg-green-700">Launch App</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Grow Your Seeds in the 
              <span className="text-green-600"> Agricultural DeFi</span> Revolution
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              SeedCoin bridges traditional agriculture with decentralized finance through 
              SEEDS stablecoin and SDAO governance token, backed by real seed bank partnerships.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
                  Start Growing Your Seeds
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Prices Ticker */}
      <section className="py-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">SEEDS</Badge>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">${prices.seeds.toFixed(2)}</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">SDAO</Badge>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">${prices.sdao.toFixed(2)}</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">SOL</Badge>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">${prices.sol.toFixed(2)}</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Cards */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Why Choose SeedCoin?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle className="text-green-800 dark:text-green-400">Stable & Secure</CardTitle>
                <CardDescription>
                  SEEDS stablecoin maintains USD peg through diversified collateral including tokenized seeds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• 150% minimum collateral ratio</li>
                  <li>• Oracle-based price feeds</li>
                  <li>• Emergency pause functionality</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Vote className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle className="text-purple-800 dark:text-purple-400">Community Governed</CardTitle>
                <CardDescription>
                  SDAO token holders participate in platform governance and decision making
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Proposal creation and voting</li>
                  <li>• Treasury allocation decisions</li>
                  <li>• Partnership approvals</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-amber-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Coins className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle className="text-amber-800 dark:text-amber-400">High Yield Staking</CardTitle>
                <CardDescription>
                  Earn rewards by staking your tokens with flexible lock periods and compound interest
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• 5-20% APY based on lock period</li>
                  <li>• Compound interest options</li>
                  <li>• Multiple staking tiers</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Partnership Logos Carousel */}
      <section className="py-16 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Trusted by Agricultural Partners
          </h3>
          <div className="flex justify-center items-center space-x-12 opacity-60">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8" />
              <span className="font-semibold">Seed Bank Network</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sprout className="h-8 w-8" />
              <span className="font-semibold">AgriTech Partners</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8" />
              <span className="font-semibold">Insurance Providers</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-amber-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Growing?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join the agricultural DeFi revolution and start earning with your digital seeds today.
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-3">
              Launch App
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sprout className="h-6 w-6 text-green-400" />
                <span className="text-xl font-bold">SeedCoin</span>
              </div>
              <p className="text-gray-400">
                Bridging agriculture and DeFi for a sustainable future.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><a href="#" className="hover:text-white">Swap</a></li>
                <li><a href="#" className="hover:text-white">Staking</a></li>
                <li><a href="#" className="hover:text-white">Governance</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Whitepaper</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Discord</a></li>
                <li><a href="#" className="hover:text-white">Twitter</a></li>
                <li><a href="#" className="hover:text-white">Telegram</a></li>
                <li><a href="#" className="hover:text-white">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SeedCoin. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Main App Component
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  )
}

export default App

