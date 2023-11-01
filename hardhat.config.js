require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version:"0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  

  networks: {
    hardhat: {
    },
    mumbai: {
      url:  "https://icy-powerful-energy.matic-testnet.discover.quiknode.pro/37e5fea8422b12e5ddc1634e382ac678b3b3a1f1",
      accounts: [''],
      
    },

    bsc: {
      url:  "https://bsc-dataseed1.binance.org/",
      accounts: [''],
      
    }

   },

  etherscan:{
    apiKey:{
      bsc: "",
      polygonMumbai: "",
    }
  }
};
