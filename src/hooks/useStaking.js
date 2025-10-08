import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  stakeTokens,
  unstakeTokens,
  getSDAOBalance,
  getUserStakingInfo,
  getTotalStaked,
  initializeStaking,
  STAKING_CONFIG
} from '../utils/stakingUtils.js';

// Custom hook for managing SDAO staking
export const useStaking = (walletAddress, connection) => {
  const [stakingData, setStakingData] = useState({
    userBalance: 0,
    stakedAmount: 0,
    pendingRewards: 0,
    totalPoolStaked: 0,
    apy: 18.5,
    isInitialized: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all staking data
  const fetchStakingData = useCallback(async () => {
    if (!walletAddress || !connection) return;

    setLoading(true);
    setError(null);

    try {
      // Get user's SDAO balance
      const userBalance = await getSDAOBalance(connection, walletAddress);
      
      // Get total staked in pool
      const totalPoolStaked = await getTotalStaked(connection);
      
      // Get user's staking info
      const stakingInfo = await getUserStakingInfo(connection, walletAddress);
      
      setStakingData({
        userBalance,
        stakedAmount: stakingInfo.stakedAmount,
        pendingRewards: stakingInfo.pendingRewards,
        totalPoolStaked,
        apy: stakingInfo.apy,
        isInitialized: true
      });

    } catch (err) {
      console.error('Error fetching staking data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, connection]);

  // Initialize staking system
  const initializeStakingSystem = useCallback(async () => {
    if (!connection || !window.solana) return;

    setLoading(true);
    setError(null);

    try {
      const wallet = window.solana;
      const initResult = await initializeStaking(connection, wallet);
      
      if (initResult.needsInitialization) {
        // Send transaction to create staking vault
        const { blockhash } = await connection.getLatestBlockhash();
        initResult.transaction.recentBlockhash = blockhash;
        initResult.transaction.feePayer = wallet.publicKey;
        
        const signedTx = await wallet.signTransaction(initResult.transaction);
        const signature = await connection.sendRawTransaction(signedTx.serialize());
        
        await connection.confirmTransaction(signature);
        console.log('Staking vault created:', signature);
      }
      
      // Refresh data after initialization
      await fetchStakingData();
      
    } catch (err) {
      console.error('Error initializing staking system:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [connection, fetchStakingData]);

  // Stake tokens
  const stake = useCallback(async (amount) => {
    if (!walletAddress || !connection || !window.solana) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const wallet = window.solana;
      
      // Create stake transaction
      const stakeResult = await stakeTokens(connection, walletAddress, amount);
      
      // Get latest blockhash and set fee payer
      const { blockhash } = await connection.getLatestBlockhash();
      stakeResult.transaction.recentBlockhash = blockhash;
      stakeResult.transaction.feePayer = wallet.publicKey;
      
      // Sign and send transaction
      const signedTx = await wallet.signTransaction(stakeResult.transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      // Confirm transaction
      await connection.confirmTransaction(signature);
      
      console.log('Stake transaction confirmed:', signature);
      
      // Update local state immediately
      setStakingData(prev => ({
        ...prev,
        userBalance: prev.userBalance - amount,
        stakedAmount: prev.stakedAmount + amount,
        totalPoolStaked: prev.totalPoolStaked + amount
      }));
      
      // Refresh data from blockchain
      setTimeout(() => fetchStakingData(), 2000);
      
      return {
        success: true,
        signature,
        amount,
        message: `Successfully staked ${amount} SDAO tokens!`
      };

    } catch (err) {
      console.error('Error staking tokens:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAddress, connection, fetchStakingData]);

  // Unstake tokens (simplified - would need authority signature in real implementation)
  const unstake = useCallback(async (amount) => {
    if (!walletAddress || !connection) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // For demo purposes, we'll simulate unstaking by updating local state
      // In a real implementation, this would require the staking authority to sign
      
      if (amount > stakingData.stakedAmount) {
        throw new Error('Insufficient staked amount');
      }
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update local state
      setStakingData(prev => ({
        ...prev,
        userBalance: prev.userBalance + amount,
        stakedAmount: prev.stakedAmount - amount,
        totalPoolStaked: prev.totalPoolStaked - amount
      }));
      
      console.log(`Simulated unstaking ${amount} SDAO tokens`);
      
      return {
        success: true,
        signature: 'simulated_unstake_' + Date.now(),
        amount,
        message: `Successfully unstaked ${amount} SDAO tokens!`
      };

    } catch (err) {
      console.error('Error unstaking tokens:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAddress, connection, stakingData.stakedAmount]);

  // Claim rewards (simplified simulation)
  const claimRewards = useCallback(async () => {
    if (!walletAddress || !connection) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const rewardAmount = stakingData.pendingRewards;
      
      if (rewardAmount <= 0) {
        throw new Error('No rewards to claim');
      }
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update local state
      setStakingData(prev => ({
        ...prev,
        userBalance: prev.userBalance + rewardAmount,
        pendingRewards: 0
      }));
      
      console.log(`Simulated claiming ${rewardAmount} SDAO rewards`);
      
      return {
        success: true,
        signature: 'simulated_claim_' + Date.now(),
        amount: rewardAmount,
        message: `Successfully claimed ${rewardAmount.toFixed(2)} SDAO rewards!`
      };

    } catch (err) {
      console.error('Error claiming rewards:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAddress, connection, stakingData.pendingRewards]);

  // Calculate real-time rewards
  const calculateCurrentRewards = useCallback(() => {
    if (stakingData.stakedAmount <= 0) return 0;
    
    const dailyRate = stakingData.apy / 100 / 365;
    const currentRewards = stakingData.stakedAmount * dailyRate;
    
    return currentRewards;
  }, [stakingData.stakedAmount, stakingData.apy]);

  // Update pending rewards in real-time
  useEffect(() => {
    if (stakingData.stakedAmount > 0) {
      const interval = setInterval(() => {
        const dailyRewards = calculateCurrentRewards();
        const rewardIncrement = dailyRewards / (24 * 60 * 60); // Per second
        
        setStakingData(prev => ({
          ...prev,
          pendingRewards: prev.pendingRewards + rewardIncrement
        }));
      }, 1000); // Update every second
      
      return () => clearInterval(interval);
    }
  }, [stakingData.stakedAmount, calculateCurrentRewards]);

  // Fetch data on mount and wallet change
  useEffect(() => {
    fetchStakingData();
  }, [fetchStakingData]);

  return {
    stakingData,
    loading,
    error,
    actions: {
      stake,
      unstake,
      claimRewards,
      initializeStakingSystem,
      refreshData: fetchStakingData
    },
    utils: {
      calculateCurrentRewards,
      minStakeAmount: STAKING_CONFIG.MIN_STAKE_AMOUNT / 1e6
    }
  };
};
