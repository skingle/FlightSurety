
var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');

contract('Oracles', async (accounts) => {

const TEST_ORACLES_COUNT = 9;
var config;
const regTimestamp=Math.floor(Date.now() / 1000);
const flight = 'ND1309';
const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;
  
  before('setup contract', async () => {
    config = await Test.Config(accounts);

    //regTimestamp = Math.floor(Date.now() / 1000);
    
    console.log("regTimestamp : "+regTimestamp);

    await config.flightSuretyData.setOperatingStatus(true);
    await config.flightSuretyApp.setOperatingStatus(true);
    await config.flightSuretyData.authorizeAppContract(config.flightSuretyApp.address);
    await config.flightSuretyApp.fund({from:config.firstAirline,value:web3.utils.toWei("10", "ether")});
    await config.flightSuretyApp.registerFlight(flight,regTimestamp,{from:config.firstAirline});
    // Watch contract events
    
  });


  it('can register oracles', async () => {
    
    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();
    // ACT
    for(let a=1; a<TEST_ORACLES_COUNT; a++) {      
      await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
      let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });

  it('can request flight status', async () => {
    
    // ARRANGE
    let flight = 'ND1309'; // Course number
    let timestamp = Math.floor(Date.now() / 1000);
    
    // Submit a request for oracles to get status information for a flight
    // let investedFund  = await config.flightSuretyData.getAirlineInvestedFundAmount.call(config.firstAirline);
    // console.log(config.firstAirline+" "+investedFund);
    // let result = await config.flightSuretyApp.getFlight(config.firstAirline,flight,regTimestamp);
    // console.log("Result : "+JSON.stringify(result));
   
    await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, regTimestamp);
    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    for(let a=1; a<TEST_ORACLES_COUNT; a++) {

     
      // Get oracle information
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a]});
      for(let idx=0;idx<3;idx++) {

        try {
          // Submit a response...it will only be accepted if there is an Index match
          await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.firstAirline, flight, regTimestamp, STATUS_CODE_LATE_AIRLINE, { from: accounts[a] });
          console.log("submited :: ",oracleIndexes[idx].toNumber(), flight, regTimestamp,accounts[a]);
        }
        catch(e) {
          // Enable this when debugging
           console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, regTimestamp);
        }

      }


    }

  });


 
});
