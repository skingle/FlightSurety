
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  var flight={};

  before('setup contract', async () => {
    config = await Test.Config(accounts);
    console.log("firstAirline :: " +config.firstAirline );
    //config.flightSuretyData.events.allEvents((event)=>console.log(event));
    
    await config.flightSuretyData.setOperatingStatus(true, { from: config.owner });
    await config.flightSuretyApp.setOperatingStatus(true, { from: config.owner});
    let log = await config.flightSuretyData.authorizeAppContract(config.flightSuretyApp.address, {from:config.owner});
   // console.log("LOG :: "+JSON.stringify(log) + " App address :: " + config.flightSuretyApp.address +" owner :: "+ config.owner);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let statusData = await config.flightSuretyData.isOperational.call();
    let statusApp = await config.flightSuretyApp.isOperational.call();
    assert.equal(statusData, true, "Incorrect initial operating status value for data contract");
    assert.equal(statusApp, true, "Incorrect initial operating status value for app contract");

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
          await config.flightSuretyData.setOperatingStatus(false,{ from: config.owner });
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
  
  it('(airline) fifth airline will be registred with the conscious of  half of the registred airlines',async()=>{
      let newAirline  = accounts[5]; //6th adress
      
      let registrationStatusBefore = await config.flightSuretyData.isAirlineRegistred(newAirline);
      //console.log(`registrationStatusBefore (${newAirline}) :: ${registrationStatusBefore}`);
      await config.flightSuretyApp.fund({from:accounts[2],value:web3.utils.toWei("10", "ether")});
      await config.flightSuretyApp.fund({from:accounts[3],value:web3.utils.toWei("10", "ether")});
      await config.flightSuretyApp.fund({from:accounts[4],value:web3.utils.toWei("10", "ether")});
      //Now registration will be done by all funded accounts 
      //which will increase the vote to 3/4 (account[1,2,3] : voted)
      for(let i = 1 ; i < 3 ; i++) {
            await config.flightSuretyApp.registerAirline.sendTransaction(newAirline ,{from:accounts[i]});
      }
      let registrationStatusAfter = await config.flightSuretyData.isAirlineRegistred(accounts[5]);
     // console.log(`registrationStatusAfter (${newAirline}) :: ${registrationStatusAfter}`);
      assert.equal(registrationStatusAfter,true,"Airline registration with conscious failed ");
  });

  it('(airline) Registred and funded airlines can register flights',async ()=>{
     try{ 
            let flightName = "A708";
            let timeStamp = Math.floor(Date.now()/1000)
            let airline = config.firstAirline;
            flight={name:flightName,date:timeStamp,airline:airline};
            let numberOfRegistredFlightBefore = await config.flightSuretyData.getNumberOfRegistredFlights.call();
            await config.flightSuretyApp.registerFlight.sendTransaction(flightName,timeStamp,{from:airline});
            let numberOfRegistredFlightAfter = await config.flightSuretyData.getNumberOfRegistredFlights.call();
            //console.log(numberOfRegistredFlightBefore,numberOfRegistredFlightAfter);
            assert.isAbove(numberOfRegistredFlightAfter.toNumber(),numberOfRegistredFlightBefore.toNumber(),"Flight was not registred");
        }catch(e){
            console.log(e);
        }
  })


});
