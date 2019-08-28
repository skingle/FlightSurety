var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
      },
      network_id: '*',
      gas: 9999999
    },
    develop: {
      port: 8545,
      network_id: 20,
      accounts: 55,
      defaultEtherBalance: 500,
    }


  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};