import { PublicKey } from '@solana/web3.js';

// SeedDAO Program Configuration
export const SEEDDAO_CONFIG = {
  // Program ID deployed on devnet
  PROGRAM_ID: new PublicKey('imhPqBdTKnajpiWiKY88kssdWC4eiwHvaLfQNu5vEvR'),
  
  // Network configuration
  NETWORK: 'devnet',
  RPC_URL: 'https://api.devnet.solana.com',
  
  // DAO Parameters (will be set after initialization)
  DAO_STATE: null, // Will be derived PDA
  SDAO_MINT: null, // Will be created during initialization
  TREASURY: null,  // Will be derived PDA
  
  // Default DAO settings
  DEFAULT_SETTINGS: {
    totalSupply: 10_000_000 * 1e6, // 10M SDAO tokens
    minProposalThreshold: 1_000 * 1e6, // 1,000 SDAO to create proposal
    votingPeriod: 7 * 24 * 3600, // 7 days in seconds
    executionDelay: 2 * 24 * 3600, // 2 days in seconds
    quorumThreshold: 100_000 * 1e6, // 100,000 SDAO for quorum
  },
  
  // Staking configuration
  STAKING: {
    defaultAPY: 1850, // 18.5% APY in basis points
    minStakeAmount: 100 * 1e6, // 100 SDAO minimum stake
  }
};

// Helper function to derive PDAs
export const derivePDAs = (programId) => {
  const encoder = new TextEncoder();
  
  const [daoState] = PublicKey.findProgramAddressSync(
    [encoder.encode('dao_state')],
    programId
  );
  
  const [treasury] = PublicKey.findProgramAddressSync(
    [encoder.encode('treasury'), daoState.toBytes()],
    programId
  );
  
  const [sdaoMint] = PublicKey.findProgramAddressSync(
    [encoder.encode('sdao_mint')],
    programId
  );
  
  return {
    daoState,
    treasury,
    sdaoMint
  };
};

// Update config with derived addresses
const pdas = derivePDAs(SEEDDAO_CONFIG.PROGRAM_ID);
SEEDDAO_CONFIG.DAO_STATE = pdas.daoState;
SEEDDAO_CONFIG.TREASURY = pdas.treasury;
SEEDDAO_CONFIG.SDAO_MINT = pdas.sdaoMint;

export default SEEDDAO_CONFIG;
