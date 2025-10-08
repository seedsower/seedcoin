import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';

// SDAO Staking Configuration
export const STAKING_CONFIG = {
  SDAO_MINT: new PublicKey('9N1zAerRJnQEqoCvabYmPzbokai2TMK5F8Jb8cEBZSvt'),
  STAKING_AUTHORITY: new PublicKey('Dm1PKxJGqFQdwbqQUABs3tBedYKnEcMJ2ubTRD1hcwNQ'), // Your wallet as staking authority
  APY_BASIS_POINTS: 1850, // 18.5% APY
  MIN_STAKE_AMOUNT: 100 * 1e6, // 100 SDAO (6 decimals)
  DECIMALS: 6
};

// Derive staking vault address
export const getStakingVaultAddress = async () => {
  return await getAssociatedTokenAddress(
    STAKING_CONFIG.SDAO_MINT,
    STAKING_CONFIG.STAKING_AUTHORITY
  );
};

// Get user's SDAO token account
export const getUserTokenAccount = async (userWallet) => {
  return await getAssociatedTokenAddress(
    STAKING_CONFIG.SDAO_MINT,
    new PublicKey(userWallet)
  );
};

// Check if account exists
export const checkAccountExists = async (connection, accountAddress) => {
  try {
    await getAccount(connection, accountAddress);
    return true;
  } catch (error) {
    return false;
  }
};

// Get SDAO balance
export const getSDAOBalance = async (connection, userWallet) => {
  try {
    const userTokenAccount = await getUserTokenAccount(userWallet);
    const accountInfo = await getAccount(connection, userTokenAccount);
    return Number(accountInfo.amount) / Math.pow(10, STAKING_CONFIG.DECIMALS);
  } catch (error) {
    console.log('No SDAO token account found or balance is 0');
    return 0;
  }
};

// Create staking vault if it doesn't exist
export const createStakingVault = async (connection, payer) => {
  const stakingVault = await getStakingVaultAddress();
  const vaultExists = await checkAccountExists(connection, stakingVault);
  
  if (!vaultExists) {
    const transaction = new Transaction();
    
    // Create associated token account for staking vault
    const createVaultInstruction = createAssociatedTokenAccountInstruction(
      payer.publicKey,
      stakingVault,
      STAKING_CONFIG.STAKING_AUTHORITY,
      STAKING_CONFIG.SDAO_MINT,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    transaction.add(createVaultInstruction);
    return transaction;
  }
  
  return null; // Vault already exists
};

// Stake SDAO tokens
export const stakeTokens = async (connection, userWallet, amount) => {
  try {
    const amountInLamports = Math.floor(amount * Math.pow(10, STAKING_CONFIG.DECIMALS));
    
    if (amountInLamports < STAKING_CONFIG.MIN_STAKE_AMOUNT) {
      throw new Error(`Minimum stake amount is ${STAKING_CONFIG.MIN_STAKE_AMOUNT / 1e6} SDAO`);
    }
    
    // Get user's current balance
    const currentBalance = await getSDAOBalance(connection, userWallet);
    if (amount > currentBalance) {
      throw new Error('Insufficient SDAO balance');
    }
    
    const userTokenAccount = await getUserTokenAccount(userWallet);
    const stakingVault = await getStakingVaultAddress();
    
    // Check if user token account exists
    const userAccountExists = await checkAccountExists(connection, userTokenAccount);
    if (!userAccountExists) {
      throw new Error('User SDAO token account not found');
    }
    
    // Check if staking vault exists
    const vaultExists = await checkAccountExists(connection, stakingVault);
    if (!vaultExists) {
      throw new Error('Staking vault not initialized');
    }
    
    const transaction = new Transaction();
    
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      userTokenAccount,
      stakingVault,
      new PublicKey(userWallet),
      amountInLamports,
      [],
      TOKEN_PROGRAM_ID
    );
    
    transaction.add(transferInstruction);
    
    return {
      transaction,
      amount: amountInLamports,
      stakingVault: stakingVault.toString(),
      userAccount: userTokenAccount.toString()
    };
    
  } catch (error) {
    console.error('Error creating stake transaction:', error);
    throw error;
  }
};

// Unstake SDAO tokens
export const unstakeTokens = async (connection, userWallet, amount) => {
  try {
    const amountInLamports = Math.floor(amount * Math.pow(10, STAKING_CONFIG.DECIMALS));
    
    const userTokenAccount = await getUserTokenAccount(userWallet);
    const stakingVault = await getStakingVaultAddress();
    
    // Check staking vault balance
    const vaultAccount = await getAccount(connection, stakingVault);
    const vaultBalance = Number(vaultAccount.amount);
    
    if (amountInLamports > vaultBalance) {
      throw new Error('Insufficient staked amount');
    }
    
    const transaction = new Transaction();
    
    // Create transfer instruction from vault back to user
    // Note: This would require the staking authority to sign in a real implementation
    const transferInstruction = createTransferInstruction(
      stakingVault,
      userTokenAccount,
      STAKING_CONFIG.STAKING_AUTHORITY, // Authority needs to sign
      amountInLamports,
      [],
      TOKEN_PROGRAM_ID
    );
    
    transaction.add(transferInstruction);
    
    return {
      transaction,
      amount: amountInLamports,
      stakingVault: stakingVault.toString(),
      userAccount: userTokenAccount.toString()
    };
    
  } catch (error) {
    console.error('Error creating unstake transaction:', error);
    throw error;
  }
};

// Get staking vault balance (total staked)
export const getTotalStaked = async (connection) => {
  try {
    const stakingVault = await getStakingVaultAddress();
    const vaultAccount = await getAccount(connection, stakingVault);
    return Number(vaultAccount.amount) / Math.pow(10, STAKING_CONFIG.DECIMALS);
  } catch (error) {
    console.log('Staking vault not found or empty');
    return 0;
  }
};

// Calculate rewards
export const calculateRewards = (stakedAmount, stakingDuration) => {
  const annualRewards = stakedAmount * (STAKING_CONFIG.APY_BASIS_POINTS / 10000);
  const dailyRewards = annualRewards / 365;
  const stakingDays = stakingDuration / (24 * 60 * 60 * 1000); // Convert ms to days
  
  return {
    daily: dailyRewards,
    accumulated: dailyRewards * stakingDays,
    annual: annualRewards
  };
};

// Get staking info for user
export const getUserStakingInfo = async (connection, userWallet) => {
  try {
    // In a real implementation, this would fetch from a staking program
    // For now, we'll simulate based on vault balance and user's contribution
    const totalStaked = await getTotalStaked(connection);
    const userBalance = await getSDAOBalance(connection, userWallet);
    
    // Mock staking data - in reality this would be stored on-chain
    const mockStakingData = {
      stakedAmount: 0, // Would be fetched from staking program
      stakingStartTime: Date.now(),
      lastClaimTime: Date.now(),
      totalRewards: 0
    };
    
    const rewards = calculateRewards(
      mockStakingData.stakedAmount, 
      Date.now() - mockStakingData.lastClaimTime
    );
    
    return {
      ...mockStakingData,
      pendingRewards: rewards.accumulated,
      apy: STAKING_CONFIG.APY_BASIS_POINTS / 100,
      totalPoolStaked: totalStaked,
      userBalance
    };
    
  } catch (error) {
    console.error('Error getting staking info:', error);
    throw error;
  }
};

// Initialize staking system
export const initializeStaking = async (connection, payer) => {
  try {
    console.log('Initializing SDAO staking system...');
    
    // Create staking vault if needed
    const createVaultTx = await createStakingVault(connection, payer);
    
    if (createVaultTx) {
      console.log('Staking vault needs to be created');
      return {
        needsInitialization: true,
        transaction: createVaultTx,
        stakingVault: (await getStakingVaultAddress()).toString()
      };
    }
    
    console.log('Staking system already initialized');
    return {
      needsInitialization: false,
      stakingVault: (await getStakingVaultAddress()).toString()
    };
    
  } catch (error) {
    console.error('Error initializing staking:', error);
    throw error;
  }
};
