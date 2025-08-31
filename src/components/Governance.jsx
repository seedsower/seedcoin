import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Vote, Plus, Clock, CheckCircle, XCircle, Users, TrendingUp } from 'lucide-react'

const Governance = () => {
  const [activeTab, setActiveTab] = useState('proposals')
  const [showCreateProposal, setShowCreateProposal] = useState(false)
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    category: 'treasury'
  })

  // Mock governance data
  const governanceStats = {
    totalProposals: 24,
    activeProposals: 3,
    totalVoters: 1247,
    treasuryValue: 2847320,
    sdaoCirculating: 10000000,
    votingPower: 500 // User's SDAO balance
  }

  const proposals = [
    {
      id: 1,
      title: 'Increase Staking Rewards for SEEDS Pool',
      description: 'Proposal to increase the APY for SEEDS staking from 8.2% to 12% to incentivize more participation and strengthen the ecosystem.',
      category: 'rewards',
      status: 'active',
      votesFor: 2847,
      votesAgainst: 1203,
      totalVotes: 4050,
      quorum: 5000,
      timeLeft: '2 days',
      proposer: '7xKX...AsU',
      created: '3 days ago'
    },
    {
      id: 2,
      title: 'Partnership with AgriTech Solutions',
      description: 'Approve strategic partnership with AgriTech Solutions to integrate real-world seed inventory tracking and expand our collateral base.',
      category: 'partnership',
      status: 'active',
      votesFor: 3421,
      votesAgainst: 892,
      totalVotes: 4313,
      quorum: 5000,
      timeLeft: '5 days',
      proposer: '9mN2...Kp7',
      created: '1 week ago'
    },
    {
      id: 3,
      title: 'Treasury Allocation for Marketing',
      description: 'Allocate 50,000 USDC from treasury for Q2 marketing campaign to increase platform adoption and user acquisition.',
      category: 'treasury',
      status: 'active',
      votesFor: 1876,
      votesAgainst: 2134,
      totalVotes: 4010,
      quorum: 5000,
      timeLeft: '1 day',
      proposer: '4bR8...Mx9',
      created: '4 days ago'
    },
    {
      id: 4,
      title: 'Implement Emergency Pause Mechanism',
      description: 'Add emergency pause functionality to smart contracts for enhanced security during critical situations.',
      category: 'security',
      status: 'passed',
      votesFor: 4892,
      votesAgainst: 1108,
      totalVotes: 6000,
      quorum: 5000,
      timeLeft: 'Ended',
      proposer: '2aF5...Qw3',
      created: '2 weeks ago'
    }
  ]

  const userVotes = [
    { proposalId: 1, vote: 'for', power: 500 },
    { proposalId: 4, vote: 'for', power: 500 }
  ]

  const handleCreateProposal = () => {
    // Mock proposal creation
    alert(`Proposal "${newProposal.title}" created successfully!`)
    setNewProposal({ title: '', description: '', category: 'treasury' })
    setShowCreateProposal(false)
  }

  const handleVote = (proposalId, voteType) => {
    // Mock voting
    alert(`Voted ${voteType} on proposal ${proposalId} with ${governanceStats.votingPower} SDAO`)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'passed': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'treasury': return 'bg-purple-100 text-purple-800'
      case 'rewards': return 'bg-green-100 text-green-800'
      case 'partnership': return 'bg-blue-100 text-blue-800'
      case 'security': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Governance Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Vote className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Proposals</p>
                <p className="text-2xl font-bold">{governanceStats.totalProposals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Active Proposals</p>
                <p className="text-2xl font-bold">{governanceStats.activeProposals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Voters</p>
                <p className="text-2xl font-bold">{formatNumber(governanceStats.totalVoters)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Your Voting Power</p>
                <p className="text-2xl font-bold">{formatNumber(governanceStats.votingPower)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="create">Create Proposal</TabsTrigger>
          <TabsTrigger value="history">Voting History</TabsTrigger>
        </TabsList>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Active & Recent Proposals</h3>
            <Button 
              onClick={() => setActiveTab('create')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Proposal
            </Button>
          </div>

          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className={getStatusColor(proposal.status)}>
                          {proposal.status}
                        </Badge>
                        <Badge variant="outline" className={getCategoryColor(proposal.category)}>
                          {proposal.category}
                        </Badge>
                        {proposal.status === 'active' && (
                          <span className="text-sm text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {proposal.timeLeft} left
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg">{proposal.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {proposal.description}
                      </CardDescription>
                      <div className="text-xs text-gray-500">
                        Proposed by {proposal.proposer} • {proposal.created}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Voting Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Votes: {formatNumber(proposal.totalVotes)} / {formatNumber(proposal.quorum)} (Quorum)</span>
                      <span>{((proposal.totalVotes / proposal.quorum) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(proposal.totalVotes / proposal.quorum) * 100} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>For: {formatNumber(proposal.votesFor)} ({((proposal.votesFor / proposal.totalVotes) * 100).toFixed(1)}%)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <XCircle className="h-3 w-3 text-red-600" />
                        <span>Against: {formatNumber(proposal.votesAgainst)} ({((proposal.votesAgainst / proposal.totalVotes) * 100).toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Voting Buttons */}
                  {proposal.status === 'active' && (
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handleVote(proposal.id, 'for')}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                        disabled={userVotes.some(v => v.proposalId === proposal.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Vote For
                      </Button>
                      <Button 
                        onClick={() => handleVote(proposal.id, 'against')}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 flex-1"
                        disabled={userVotes.some(v => v.proposalId === proposal.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Vote Against
                      </Button>
                    </div>
                  )}

                  {userVotes.some(v => v.proposalId === proposal.id) && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      ✓ You voted {userVotes.find(v => v.proposalId === proposal.id)?.vote} with {governanceStats.votingPower} SDAO
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Create Proposal Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Proposal</CardTitle>
              <CardDescription>
                Submit a proposal for community voting. Requires minimum 1,000 SDAO to create.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Proposal Title</label>
                <Input
                  value={newProposal.title}
                  onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                  placeholder="Enter proposal title..."
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <select 
                  value={newProposal.category}
                  onChange={(e) => setNewProposal({...newProposal, category: e.target.value})}
                  className="mt-1 w-full p-2 border rounded-md"
                >
                  <option value="treasury">Treasury</option>
                  <option value="rewards">Rewards</option>
                  <option value="partnership">Partnership</option>
                  <option value="security">Security</option>
                  <option value="governance">Governance</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                  placeholder="Provide detailed description of your proposal..."
                  className="mt-1 min-h-32"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Requirements:</strong> You need at least 1,000 SDAO to create a proposal. 
                  Your current balance: {formatNumber(governanceStats.votingPower)} SDAO
                </p>
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={handleCreateProposal}
                  disabled={!newProposal.title || !newProposal.description || governanceStats.votingPower < 1000}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Proposal
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setNewProposal({ title: '', description: '', category: 'treasury' })}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voting History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Voting History</CardTitle>
              <CardDescription>
                Track your participation in governance decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userVotes.map((vote) => {
                  const proposal = proposals.find(p => p.id === vote.proposalId)
                  return (
                    <div key={vote.proposalId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{proposal?.title}</p>
                        <p className="text-sm text-gray-600">
                          Voted <span className={vote.vote === 'for' ? 'text-green-600' : 'text-red-600'}>
                            {vote.vote}
                          </span> with {formatNumber(vote.power)} SDAO
                        </p>
                      </div>
                      <Badge variant="secondary" className={getStatusColor(proposal?.status)}>
                        {proposal?.status}
                      </Badge>
                    </div>
                  )
                })}
                
                {userVotes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Vote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No voting history yet</p>
                    <p className="text-sm">Start participating in governance!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Governance

