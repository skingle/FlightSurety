import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let oracleAccounts=[];
let oracleAndIndexes={};
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
//web3.eth.defaultAccount = web3.eth.accounts[25];


let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

web3.eth.getAccounts((error, accts) => {
  
  oracleAccounts = accts.slice(21,51);
  console.log(`Oracle accounts  :: ${oracleAccounts}` );
  
})

function submitOracleResponse(event){
  let oraclesToRespond = oracleAndIndexes[event.returnValues.index];
  oraclesToRespond.forEach(oracle=>{

    flightSuretyApp.methods
    .submitOracleResponse(
      event.returnValues.index,
      event.returnValues.airline,
      event.returnValues.flight,
      event.returnValues.timestamp,
      Math.random()>0.5?10:20)
    .send({from:oracle},(error,result)=>{
            if (error) console.log(error);
            if (error) console.log(result);
      });

  });
      
}  

flightSuretyApp.events.OracleRequest( function (error, event) {
      if (error) console.log(error)
      if(event!= undefined){
        
        console.log(event.returnValues)
        let oraclesToRespond = oracleAndIndexes[event.returnValues.index];
        console.log(`oraclesToRespond :: ${oraclesToRespond}`);
          oraclesToRespond.forEach(oracle=>{

            flightSuretyApp.methods
            .submitOracleResponse(
              event.returnValues.index,
              event.returnValues.airline,
              event.returnValues.flight,
              event.returnValues.timestamp,
              Math.random()>0.5?10:20)
            .send({from:oracle,gas:1000000},(error,result)=>{
                    if (error) console.log(error);
                    if (result) console.log(result);
              });

          });
        

      }
  });



const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

app.get('/register_oracle', (req, res) => {
 // console.log(web3.eth.defaultAccount);
 if(oracleAccounts!==undefined){
        oracleAccounts.forEach(oracle=>{
          flightSuretyApp.methods
          .registerOracle().send({from:oracle,value:web3.utils.toWei("1", "ether"),gas:1000000},
                (error,result)=>{
                  console.log(`RegisterOracle :: error ${error} result ${result}`);

                  flightSuretyApp.methods
                  .getMyIndexes().call({from:oracle},(error,result)=>{
                    //console.log(result,error);
                      result.forEach(x =>{
                            if(oracleAndIndexes[x]==undefined){
                              oracleAndIndexes[x]=[];
                            }
                            oracleAndIndexes[x].push(oracle);
                           // console.log(oracleAndIndexes);
                      });  
            });


                });
          
                
            
        });

        oracleAccounts.forEach((oracle)=>{
            
        });

 }
    

    res.send({
      message:` ${JSON.stringify(oracleAndIndexes)}`,
      error:"${error_}"
    });
    
});

app.get('/oracle_acc', (req, res) => {
 // console.log(web3.eth.defaultAccount);
  
  res.send({
    message:` ${JSON.stringify(oracleAccounts)}`,
    error:"${error_}"
  });

 
});

app.get('/oracleAndIndexes', (req, res) => {
 // console.log(web3.eth.defaultAccount);
  
  res.send({
    message:` ${JSON.stringify(oracleAndIndexes)}`,
    error:"${error_}"
  });

 
});

// oracleAccounts.forEach(oracle=>{
//   flightSuretyApp.methods
//   .registerOracle().send({from:oracle,value:web3.utils.toWei("1", "ether"),gas:1000000},
//   (error_,result)=>{
//       //console.log(result,error_);
      
//       if(result){
//           flightSuretyApp.methods
//           .getMyIndexes().call({from:oracle},(error,result)=>{
//             //console.log(result,error);
//             oracleAndIndexes[oracle]= result;
//           });
//       }
      
     

//   });
// });
export default app;


