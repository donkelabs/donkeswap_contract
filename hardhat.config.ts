import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
// hardhat.config.ts

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.5.16",
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
      {
        version: "0.6.6",
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
      {
        version: "0.6.12",
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
    ],
  },
  networks: {
    seiEVM_dev: {
      chainId: 1328,
      url: "https://evm-rpc-testnet.sei-apis.com",
      accounts: [process.env.PRIVATE_KEY || ""],
    },
    seiEVM: {
      chainId: 1329,
      url: "https://evm-rpc.sei-apis.com",
      accounts: [process.env.PRIVATE_KEY || ""],
    },
  },

  etherscan: {
    apiKey: {
      seiEVM_dev: process.env.INEVMSCAN_API_KEY || "",
      seiEVM: process.env.INEVMSCAN_API_KEY || "",
    },
    // https://docs.blockscout.com/for-users/verifying-a-smart-contract/hardhat-verification-plugin
    customChains: [
      {
        network: "seiEVM_dev",
        chainId: 1328,
        urls: {
          apiURL: "https://seitrace.com/atlantic-2/api",
          browserURL: "https://seitrace.com/",
        },
      },
      {
        network: "seiEVM",
        chainId: 1329,
        urls: {
          apiURL: "https://seitrace.com/pacific-1/api",
          browserURL: "https://seitrace.com/",
        },
      },
    ],
  },
};

export default config;
