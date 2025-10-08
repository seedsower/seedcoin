import { useState } from 'react';
import { useStaking } from '../hooks/useStaking.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { 
  TrendingUp, 
  DollarSign, 
  Zap, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Gift,
  Info,
  AlertCircle,
  Loader2
} from 'lucide-react';

const RealLiveStaking = ({ walletAddress, connection }) => {
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [activeTab, setActiveTab] = useState('stake');

  // Use real staking hook
  const { 
    stakingData, 
    loading, 
    error, 
    actions: { stake, unstake, claimRewards, initializeStakingSystem },
    utils: { minStakeAmount }
  } = useStaking(walletAddress, connection);

  // Handle stake operation
  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    
    const amount = parseFloat(stakeAmount);
    
    try {
      const result = await stake(amount);
      if (result.success) {
        setStakeAmount('');
        alert(result.message);
      }
    } catch (err) {
      alert('Failed to stake tokens: ' + err.message);
    }
  };

  // Handle unstake operation
  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) return;
    
    const amount = parseFloat(unstakeAmount);
    
    try {
      const result = await unstake(amount);
      if (result.success) {
        setUnstakeAmount('');
        alert(result.message);
      }
    } catch (err) {
      alert('Failed to unstake tokens: ' + err.message);
    }
  };

  // Handle claim rewards
  const handleClaimRewards = async () => {
    try {
      const result = await claimRewards();
      if (result.success) {
        alert(result.message);
      }
    } catch (err) {
      alert('Failed to claim rewards: ' + err.message);
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
            <span>Real SDAO Staking</span>
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
      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staking Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">SDAO Balance</p>
                <p className="text-2xl font-bold">{formatNumber(stakingData.userBalance)}</p>
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

      {/* Real Staking Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Real SDAO Staking Pool</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Live on Devnet
            </Badge>
          </CardTitle>
          <CardDescription>
            Stake your actual SDAO tokens to earn {stakingData.apy}% APY with real token transfers
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
                  <label className="text-sm font-medium">Amount to Stake (Real SDAO Tokens)</label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      type="number"
                      placeholder="Enter SDAO amount"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      disabled={loading}
                      min={minStakeAmount}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setStakeAmount(stakingData.userBalance.toString())}
                      disabled={loading}
                    >
                      Max
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {formatNumber(stakingData.userBalance)} SDAO | Min: {minStakeAmount} SDAO
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

                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Real Token Transfer</p>
                      <p>Your SDAO tokens will be transferred to the staking vault on Solana devnet.</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleStake}
                  disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) < minStakeAmount}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Staking...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Stake Real SDAO Tokens
                    </>
                  )}
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
                      <p>You can unstake your SDAO tokens anytime without penalty. Tokens will be returned to your wallet.</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleUnstake}
                  disabled={loading || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Unstaking...
                    </>
                  ) : (
                    <>
                      <ArrowDownLeft className="h-4 w-4 mr-2" />
                      Unstake SDAO Tokens
                    </>
                  )}
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
                      <p className="text-sm text-gray-600">Pool Total Staked</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatNumber(stakingData.totalPoolStaked)}
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
                      <span>Your Staked Amount:</span>
                      <span className="font-medium">
                        {formatNumber(stakingData.stakedAmount)} SDAO
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleClaimRewards}
                  disabled={loading || stakingData.pendingRewards <= 0}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      Claim {formatNumber(stakingData.pendingRewards)} SDAO
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Initialize Staking System */}
      {!stakingData.isInitialized && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Initialize Staking System</CardTitle>
            <CardDescription className="text-orange-700">
              The staking system needs to be initialized before you can stake tokens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={initializeStakingSystem}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                'Initialize Staking System'
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealLiveStaking;
