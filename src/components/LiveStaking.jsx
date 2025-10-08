import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Zap, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Gift,
  Info
} from 'lucide-react';

const LiveStaking = ({ walletAddress, connection }) => {
  const [stakingData, setStakingData] = useState({
    stakedAmount: 0,
    pendingRewards: 0,
    totalEarned: 0,
    apy: 18.5,
    lastStakeTime: null
  });
  const [sdaoBalance, setSdaoBalance] = useState(0);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stake');

  // SDAO configuration
  const SDAO_MINT = new PublicKey('9N1zAerRJnQEqoCvabYmPzbokai2TMK5F8Jb8cEBZSvt');
  const STAKING_PROGRAM_ID = new PublicKey('AnwNEDsBwSHqy3CdKLv2kieXD5QLqNqdVxEB8zCfPrrC');

  // Fetch user's SDAO balance and staking info
  const fetchStakingData = useCallback(async () => {
    if (!walletAddress || !connection) return;

    setLoading(true);
    try {
      const walletPubkey = new PublicKey(walletAddress);
      
      // Fetch SDAO balance
      try {
        const sdaoTokenAccount = await getAssociatedTokenAddress(SDAO_MINT, walletPubkey);
        const accountInfo = await getAccount(connection, sdaoTokenAccount);
        const balance = Number(accountInfo.amount) / Math.pow(10, 6);
        setSdaoBalance(balance);
      } catch (error) {
        console.log('No SDAO token account found');
        setSdaoBalance(0);
      }

      // Mock staking data (in real implementation, this would fetch from the staking program)
      const mockStakingData = {
        stakedAmount: 1000,
        pendingRewards: 45.5,
        totalEarned: 185,
        apy: 18.5,
        lastStakeTime: Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days ago
      };
      
      setStakingData(mockStakingData);

    } catch (error) {
      console.error('Error fetching staking data:', error);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, connection, SDAO_MINT]);

  useEffect(() => {
    fetchStakingData();
  }, [fetchStakingData]);

  // Stake SDAO tokens
  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    
    const amount = parseFloat(stakeAmount);
    if (amount > sdaoBalance) {
      alert('Insufficient SDAO balance');
      return;
    }

    setLoading(true);
    try {
      // Mock staking transaction
      console.log(`Staking ${amount} SDAO tokens...`);
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update local state (in real implementation, this would be handled by the program)
      setStakingData(prev => ({
        ...prev,
        stakedAmount: prev.stakedAmount + amount,
        lastStakeTime: Date.now()
      }));
      
      setSdaoBalance(prev => prev - amount);
      setStakeAmount('');
      
      alert(`Successfully staked ${amount} SDAO tokens!`);
      
    } catch (error) {
      console.error('Error staking tokens:', error);
      alert('Failed to stake tokens');
    } finally {
      setLoading(false);
    }
  };

  // Unstake SDAO tokens
  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) return;
    
    const amount = parseFloat(unstakeAmount);
    if (amount > stakingData.stakedAmount) {
      alert('Insufficient staked amount');
      return;
    }

    setLoading(true);
    try {
      // Mock unstaking transaction
      console.log(`Unstaking ${amount} SDAO tokens...`);
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update local state
      setStakingData(prev => ({
        ...prev,
        stakedAmount: prev.stakedAmount - amount
      }));
      
      setSdaoBalance(prev => prev + amount);
      setUnstakeAmount('');
      
      alert(`Successfully unstaked ${amount} SDAO tokens!`);
      
    } catch (error) {
      console.error('Error unstaking tokens:', error);
      alert('Failed to unstake tokens');
    } finally {
      setLoading(false);
    }
  };

  // Claim rewards
  const handleClaimRewards = async () => {
    if (stakingData.pendingRewards <= 0) {
      alert('No rewards to claim');
      return;
    }

    setLoading(true);
    try {
      // Mock claim rewards transaction
      console.log(`Claiming ${stakingData.pendingRewards} SDAO rewards...`);
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update local state
      const claimedAmount = stakingData.pendingRewards;
      setStakingData(prev => ({
        ...prev,
        pendingRewards: 0,
        totalEarned: prev.totalEarned + claimedAmount
      }));
      
      setSdaoBalance(prev => prev + claimedAmount);
      
      alert(`Successfully claimed ${claimedAmount.toFixed(2)} SDAO rewards!`);
      
    } catch (error) {
      console.error('Error claiming rewards:', error);
      alert('Failed to claim rewards');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const calculateDailyRewards = () => {
    return (stakingData.stakedAmount * stakingData.apy / 100 / 365);
  };

  if (!walletAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>SDAO Live Staking</span>
          </CardTitle>
          <CardDescription>
            Connect your wallet to start earning 18.5% APY on your SDAO tokens
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staking Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">SDAO Balance</p>
                <p className="text-2xl font-bold">{formatNumber(sdaoBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Staked Amount</p>
                <p className="text-2xl font-bold">{formatNumber(stakingData.stakedAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Pending Rewards</p>
                <p className="text-2xl font-bold">{formatNumber(stakingData.pendingRewards)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">APY</p>
                <p className="text-2xl font-bold">{stakingData.apy}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staking Interface */}
      <Card>
        <CardHeader>
          <CardTitle>SDAO Staking Pool</CardTitle>
          <CardDescription>
            Stake your SDAO tokens to earn {stakingData.apy}% APY with no lock period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stake">Stake</TabsTrigger>
              <TabsTrigger value="unstake">Unstake</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>

            {/* Stake Tab */}
            <TabsContent value="stake" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Amount to Stake</label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      type="number"
                      placeholder="Enter SDAO amount"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      disabled={loading}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setStakeAmount(sdaoBalance.toString())}
                      disabled={loading}
                    >
                      Max
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {formatNumber(sdaoBalance)} SDAO
                  </p>
                </div>

                {stakeAmount && parseFloat(stakeAmount) > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Daily Rewards:</span>
                        <span className="font-medium">
                          {formatNumber(parseFloat(stakeAmount) * stakingData.apy / 100 / 365)} SDAO
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual Rewards:</span>
                        <span className="font-medium">
                          {formatNumber(parseFloat(stakeAmount) * stakingData.apy / 100)} SDAO
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleStake}
                  disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  {loading ? 'Staking...' : 'Stake SDAO'}
                </Button>
              </div>
            </TabsContent>

            {/* Unstake Tab */}
            <TabsContent value="unstake" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Amount to Unstake</label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      type="number"
                      placeholder="Enter SDAO amount"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      disabled={loading}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setUnstakeAmount(stakingData.stakedAmount.toString())}
                      disabled={loading}
                    >
                      Max
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Staked: {formatNumber(stakingData.stakedAmount)} SDAO
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">No Lock Period</p>
                      <p>You can unstake your SDAO tokens anytime without penalty.</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleUnstake}
                  disabled={loading || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowDownLeft className="h-4 w-4 mr-2" />
                  {loading ? 'Unstaking...' : 'Unstake SDAO'}
                </Button>
              </div>
            </TabsContent>

            {/* Rewards Tab */}
            <TabsContent value="rewards" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Pending Rewards</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatNumber(stakingData.pendingRewards)}
                      </p>
                      <p className="text-xs text-gray-500">SDAO</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Earned</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatNumber(stakingData.totalEarned)}
                      </p>
                      <p className="text-xs text-gray-500">SDAO</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Daily Rewards Rate:</span>
                      <span className="font-medium">
                        {formatNumber(calculateDailyRewards())} SDAO/day
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current APY:</span>
                      <span className="font-medium">{stakingData.apy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staking Duration:</span>
                      <span className="font-medium">
                        {stakingData.lastStakeTime 
                          ? Math.floor((Date.now() - stakingData.lastStakeTime) / (24 * 60 * 60 * 1000)) + ' days'
                          : 'Not staking'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleClaimRewards}
                  disabled={loading || stakingData.pendingRewards <= 0}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  {loading ? 'Claiming...' : `Claim ${formatNumber(stakingData.pendingRewards)} SDAO`}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Staking Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Pool Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">500K</p>
              <p className="text-sm text-gray-600">Total Staked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">1,247</p>
              <p className="text-sm text-gray-600">Active Stakers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">92.5K</p>
              <p className="text-sm text-gray-600">Rewards Distributed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">18.5%</p>
              <p className="text-sm text-gray-600">Current APY</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveStaking;
