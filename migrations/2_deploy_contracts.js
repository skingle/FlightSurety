const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');


module.exports = function(deployer) {

   web3.eth.getAccounts((error, accts) => {
        let firstAirline = accts[1];
        let insuranceCap = web3.utils.toWei("1", "ether");
        ///let insuranceRefundMultiple = 1.5;
        let seedFundAmount =web3.utils.toWei("10", "ether")

        deployer.deploy(FlightSuretyData,firstAirline)
        .then(() => {
            return deployer.deploy(FlightSuretyApp,FlightSuretyData.address,seedFundAmount,insuranceCap,15,10)
                    .then(() => {
                        let config = {
                            localhost: {
                                url: 'http://localhost:9545',
                                dataAddress: FlightSuretyData.address,
                                appAddress: FlightSuretyApp.address
                            }
                        }
                        fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                        fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                    });
        });
   });
    
}