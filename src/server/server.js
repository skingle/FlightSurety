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
  try{
    oracleAccounts = accts.slice(21,51);
    oracleAccounts.forEach(oracle=>{
      flightSuretyApp.methods
      .registerOracle().send({from:oracle,value:web3.utils.toWei("1", "ether"),gas:1000000},
            (error,tx)=>{
              console.log(`RegisterOracle :: error ${error} result ${tx}`);
              


                flightSuretyApp.methods
                .getMyIndexes().call({from:oracle},(error,indexes)=>{
                 
                  if(indexes!==undefined){
                    indexes.forEach(x =>{
                      if(oracleAndIndexes[x]===undefined){
                        oracleAndIndexes[x]=[];
                      }
                      oracleAndIndexes[x].push(oracle);
                    });  
                  }
                 
                });

              
          
            });
      
            
        
    });

  }catch(e){
    console.log(e)
  }
  
  
  
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
      //if (error) console.log(error)
      if(event!= undefined){//console.log(event.returnValues.index+" "+ JSON.stringify(oracleAndIndexes))
        try {

            //console.log(event.returnValues)
         let oraclesToRespond = oracleAndIndexes[event.returnValues.index];
         console.log(`oraclesToRespond :: ${oraclesToRespond}`);
           oraclesToRespond.forEach(oracle=>{
             let oracleResponse =20; 
             flightSuretyApp.methods
             .submitOracleResponse(
               event.returnValues.index,
               event.returnValues.airline,
               event.returnValues.flight,
               event.returnValues.timestamp,
               oracleResponse)
             .send({from:oracle,gas:1000000},(error,result)=>{
                     if (error) console.log(error);
                     if (result) console.log(`${result} :  ${oracleResponse}`);
               });

           });

        } catch (error) {
          console.log(error);
        }  
        
          

      }
  });



const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})




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


