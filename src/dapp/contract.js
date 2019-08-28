import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';


export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 8) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isAppContractOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    isDataContractOperational(callback) {
        let self = this;
        self.flightSuretyData.methods
             .isOperational()
             .call({ from: self.owner}, callback);
     }

    fetchFlightStatus(flight,currentAccount, callback) {
        let self = this;
        // let payload = {
        //     airline: self.airlines[0],
        //     flight: flight,
        //     timestamp: Math.floor(Date.now() / 1000)
        // } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(flight["airline"], flight["name"], flight["flightRegistrationTimestamp"])
            .send({ from:currentAccount}, callback);
    }

    setAppContractOprationalStatus(status,callback){
        let self = this;
        self.flightSuretyApp.methods
        .setOperatingStatus(status)
        .send({ from: self.owner},(error, result) => {
            callback(error, result);
        });
    }

    setDataContractOprationalStatus(status,callback){
        let self = this;
        self.flightSuretyData.methods
        .setOperatingStatus(status)
        .send({ from: self.owner},(error, result) => {
            callback(error, payload);
        });
    }

    getRegistredAirlines(callback){
        let self = this;
        let regAirlineCount = -1;
        self.flightSuretyData.methods
        .getNumberOfRegistredAirlines().call({ from: self.owner},async(error,result)=>{
            console.log("error :: " + error);
            console.log("Result :: " + result);
            let airlines = [];
            if(result!=0){
              for(let i = 0; i < result ; i++){
                
                 await self.flightSuretyData.methods
                .getRegistredAirlines(i)
                .call({ from: self.owner},(error,result)=>{
                    if(result!=undefined){
                        airlines.push(result);
                    }
                    else{
                        console.log("error :: getRegistredAirlines :: " + error );
                    }
                })

              }  
            }
            callback(error,airlines);

        });
       
    }

    authorizeAppContract(contract,callback){
        let self = this;
        console.log(contract);
        self.flightSuretyData.methods  
        .authorizeAppContract(contract)
        .send({from: self.owner},callback);
    }

    deauthorizeAppContract(contract,callback){
        let self = this;
        self.flightSuretyData.methods  
        .deauthorizeAppContract(contract)
        .send({from: self.owner},callback);
    }

    registerAirline(airline,voter,callback){
        let self = this;
        self.flightSuretyApp.methods
        .registerAirline(airline)
        .send({from:voter,gas: 1000000},callback)  
    }

    fund(account,fundValue,callback){
        let self = this;
        self.flightSuretyApp.methods
        .fund()
        .send({from:account.trim(), value:this.web3.utils.toWei(fundValue, "ether")},callback);

    }

    registerFlight(flightName,timestamp,airline,callback){
        let self = this;
        self.flightSuretyApp.methods
        .registerFlight(flightName  ,timestamp)
        .send({from:airline,gas:1000000},callback);
    }

    getRegistredFlights(callback,storeArray){
        let self  = this;
        let registerFlights =  [];
        self.flightSuretyData.methods.getNumberOfRegistredFlights().call(async (error, result)=>{
            let registredFligthCount = result;
            for(let i  = 0 ; i < registredFligthCount ; i++ ){
               await self.flightSuretyData.methods.registredFlightKeys(i).call({ from: self.owner},async(error,result_)=>{
                    //console.log("byte32 :: "+result_);
                    await self.flightSuretyData.methods.flights(result_).call(async (error , flight)=>{
                        //console.log("Flights :: "+JSON.stringify(flight));
                        registerFlights.push(flight);
                        callback(flight);
                        if(i===(registredFligthCount-1)){
                            console.table(registerFlights);
                            storeArray(registerFlights);
                        }
                    })   
                });
    
            }
            
           
        });
        
       // console.log(JSON.stringify(registredFlightCount);
    }

    getInsuredFlights(passenger,callback,storeArray){
        let self  = this;
        let insuredFlights =  [];
        self.flightSuretyData.methods.getPassengersInsuredFlightCount(passenger).call(async (error, result)=>{
            let insuredFligthCount = result;
            for(let i  = 0 ; i < insuredFligthCount ; i++ ){
               await self.flightSuretyData.methods.getPassengersInsuredFlights(passenger,i).call({ from: self.owner},async(error,result_)=>{
                    //console.log("byte32 :: "+result_);
                    await self.flightSuretyData.methods.flights(result_).call(async (error , flight)=>{
                        //console.log("Flights :: "+JSON.stringify(flight));
                        insuredFlights.push(flight);
                        callback(flight);
                        if(i===(insuredFligthCount-1)){
                            console.table(insuredFlights);
                            storeArray(insuredFlights);
                        }
                    })   
                });
    
            }
            
           
        });
        
       // console.log(JSON.stringify(registredFlightCount);
    }


    buyInsurance(airline,flight,timestamp,insurer,amount,callback)
    {
        let self = this;
        self.flightSuretyApp.methods
        .buyInsurance(airline,flight,timestamp)
        .send({from:insurer,value:this.web3.utils.toWei(amount, "ether"),gas:1000000},callback)
    }

    getWalletBalance(passenger,callback){
        let self = this;
        self.flightSuretyData.methods
        .getWalletBalance()
        .call({from : passenger},callback)
    }

    pay(account,callback){
        let self = this;
        self.flightSuretyData.methods
        .pay()
        .send({from:account},callback)
    }
  
}