import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';


export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
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
            
            while(this.airlines.length < 5) {
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

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
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
        .send({from:voter},callback)  
    }

    fund(account,fundValue,callback){
        let self = this;
        self.flightSuretyApp.methods
        .fund()
        .send({from:account.trim(), value:this.web3.utils.toWei(fundValue, "ether")},callback);

    }
}