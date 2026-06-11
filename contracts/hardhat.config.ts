import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

let MANTLE_PRIVATE_KEY = process.env.MANTLE_PRIVATE_KEY || "";
if (MANTLE_PRIVATE_KEY && !MANTLE_PRIVATE_KEY.startsWith("0x")) {
  MANTLE_PRIVATE_KEY = "0x" + MANTLE_PRIVATE_KEY;
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.25",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mantleSepolia: {
      url: "https://rpc.sepolia.mantle.xyz",
      chainId: 5003,
      accounts: MANTLE_PRIVATE_KEY ? [MANTLE_PRIVATE_KEY] : [],
    },
    "mantle-testnet": {
      url: "https://rpc.sepolia.mantle.xyz",
      chainId: 5003,
      accounts: MANTLE_PRIVATE_KEY ? [MANTLE_PRIVATE_KEY] : [],
    },
    mantleMainnet: {
      url: "https://rpc.mantle.xyz",
      chainId: 5000,
      accounts: MANTLE_PRIVATE_KEY ? [MANTLE_PRIVATE_KEY] : [],
    },
  },
  sourcify: {
    enabled: true
  },
  etherscan: {
    apiKey: process.env.MANTLESCAN_API_KEY || "placeholder",
    customChains: [
      {
        network: "mantleSepolia",
        chainId: 5003,
        urls: {
          apiURL: "https://api-sepolia.mantlescan.xyz/api",
          browserURL: "https://sepolia.mantlescan.xyz",
        },
      },
      {
        network: "mantle-testnet",
        chainId: 5003,
        urls: {
          apiURL: "https://api-sepolia.mantlescan.xyz/api",
          browserURL: "https://sepolia.mantlescan.xyz",
        },
      },
    ],
  },
};

export default config;
