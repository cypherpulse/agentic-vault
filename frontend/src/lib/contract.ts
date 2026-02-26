export const OWNER_ADDRESS = "0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38" as const;

export const CHAIN_CONFIG = {
  8453: {
    name: "Base Mainnet",
    contractAddress: "0xb8c3A6Aa148D4E5cB978A1bf249BC838CE0832E9" as `0x${string}`,
    explorer: "https://basescan.org",
  },
  84532: {
    name: "Base Sepolia",
    contractAddress: "0x7B682E166589b723062a87b32BD353969FD11753" as `0x${string}`,
    explorer: "https://sepolia.basescan.org",
  },
} as const;

export type SupportedChainId = keyof typeof CHAIN_CONFIG;

export const AGENTIC_VAULT_ABI = [
  {"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[],"name":"AgentNotAssigned","type":"error"},
  {"inputs":[],"name":"EnforcedPause","type":"error"},
  {"inputs":[],"name":"ExecutionFailed","type":"error"},
  {"inputs":[],"name":"ExpectedPause","type":"error"},
  {"inputs":[],"name":"InsufficientBalance","type":"error"},
  {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},
  {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},
  {"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},
  {"inputs":[],"name":"Unauthorized","type":"error"},
  {"inputs":[],"name":"VaultNotActive","type":"error"},
  {"inputs":[],"name":"ZeroAddress","type":"error"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"address","name":"agent","type":"address"}],"name":"AgentAssigned","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"address","name":"agent","type":"address"},{"indexed":false,"internalType":"address","name":"target","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"AgentExecuted","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"}],"name":"AgentRevoked","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Deposited","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"EmergencyWithdraw","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdrawn","type":"event"},
  {"stateMutability":"payable","type":"fallback"},
  {"inputs":[{"internalType":"address","name":"agent","type":"address"}],"name":"assignAgent","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[],"name":"emergencyWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"address","name":"target","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"executeAsAgent","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getVault","outputs":[{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"address","name":"agent","type":"address"},{"internalType":"bool","name":"active","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"revokeAgent","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"stateMutability":"payable","type":"receive"}
] as const;

export const CUSTOM_ERRORS: Record<string, string> = {
  InsufficientBalance: "Insufficient balance in your vault",
  VaultNotActive: "Your vault is not active. Deposit first.",
  Unauthorized: "You are not authorized for this action",
  ExecutionFailed: "Transaction execution failed",
  ZeroAddress: "Cannot use zero address",
  AgentNotAssigned: "No agent is assigned to this vault",
  EnforcedPause: "Contract is currently paused",
  ExpectedPause: "Contract is not paused",
  ReentrancyGuardReentrantCall: "Reentrancy detected",
};

export function parseContractError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  for (const [key, value] of Object.entries(CUSTOM_ERRORS)) {
    if (msg.includes(key)) return value;
  }
  if (msg.includes("User rejected")) return "Transaction rejected by user";
  if (msg.includes("insufficient funds")) return "Insufficient funds for gas";
  return "Transaction failed. Please try again.";
}

export function getTxLink(chainId: number, hash: string): string {
  const config = CHAIN_CONFIG[chainId as SupportedChainId];
  if (!config) return "";
  return `${config.explorer}/tx/${hash}`;
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
