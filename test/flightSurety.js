
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  const regTimestamp = Math.floor(Date.now() / 1000);
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    console.log("firstAirline :: " +config.firstAirline );
    config.flightSuretyData.receivedFundFromAirline()
    .on('data', event =>console.log(event) );

    // config.flightSuretyApp.recivedfund()
    // .on('data', event =>console.log(event) );
    
    config.flightSuretyApp.FlightHasBeenRegistred()
    .on('data', event =>console.log(event) );

    // config.flightSuretyData.noOfRegistredAirlines()
    // .on('data', event =>console.log(event) );
    
    //config.flightSuretyData.countAirlines()
    //.on('data', event =>console.log(event) );

    let log = await config.flightSuretyData.authorizeAppContract(config.flightSuretyApp.address, {from:config.owner});
   // console.log("LOG :: "+JSON.stringify(log) + " App address :: " + config.flightSuretyApp.address +" owner :: "+ config.owner);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false,{from : config.owner});
      await config.flightSuretyApp.setOperatingStatus(false,{from : config.owner});
      
      let newAirline = accounts[2];
      let reverted = false;
      try 
      {
          //await config.flightSurety.setTestingMode(true);
          await config.flightSuretyApp.registerAirline.call(newAirline, {from: config.firstAirline});  
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true,{from : config.owner});
      await config.flightSuretyApp.setOperatingStatus(true,{from : config.owner});

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
       
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirlineRegistred.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('(airline) can register Airline if seed funding is successfully  done ', async () =>{
    
    let flight = 'ND1309'; // Course number
    //await config.flightSuretyData.registerAirline( accounts[5],{from:accounts[2]});
    let numberOfAirlinesReg_before =await config.flightSuretyData.getNumberOfRegistredAirlines.call();
    //funding the contract with 10 ether
    await config.flightSuretyApp.fund({from:config.firstAirline,value:web3.utils.toWei("10", "ether")});
    //registring 4 airlines
    for(let i = 2 ; i < 5 ; i++){
        //console.log(config.flightSuretyApp.registerAirline);
        let result = await config.flightSuretyApp.registerAirline.sendTransaction(accounts[i] ,{from:config.firstAirline});
       // console.log("Airline : " + accounts[i] + " Status : " + result[0]+ " Vote : " + result[1] );
       
    }
    let numberOfAirlinesReg_after =await config.flightSuretyData.getNumberOfRegistredAirlines.call();
    console.log("Registred Airlines : " + numberOfAirlinesReg_after );
    assert.equal(numberOfAirlinesReg_before < numberOfAirlinesReg_after, true, "Airline should be able to register another airline if fund is provided ");  
  });
 


});
