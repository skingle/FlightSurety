
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';
import Config from './config.json';

var currentAccount = "";
var selectedAirlineForReg="";
var selectedFlightForInsurance="";
var selectedFlightForOracalRes="";
var flights=[];
var passengerInsuredflights=[];
(async() => {

    

    let contract = new Contract('localhost', () => {


        //Loads accounts in a selector
        loadAccountsToSelector(contract);
        //Redeems the credits
        $('#bt_redeem').on('click',()=>{

            contract.pay(currentAccount,(error,result)=>{
               if(result){
                    contract.getWalletBalance(currentAccount,(error,result)=>{
                        document.getElementById('wallet_balance').innerHTML = contract.web3.utils.fromWei(result,'ether');
                    });
               }else{
                   showToast(error,"error");
               }
            })
           
        });

        //Onclick event on account list
        $('#accounts_list a').on('click', function(){
            //selects the current account and shows in current account box on top of nav bar
            document.getElementById('selected_account').innerHTML=$(this).text();
            currentAccount = $(this).text();

            //Retrves the wallet balance
            contract.getWalletBalance(currentAccount,(error,result)=>{
                    console.log(`getWalletBalance :: ${result?result:error} `);
                    document.getElementById('wallet_balance').innerHTML = contract.web3.utils.fromWei(result,'ether');
            });
            
            //Emptys the #insured_flights tag and loads the lists of flights which are insured by the current account
            //On clicking it adds "active" class to highlight the list-item
            //loads the selected flight to a variable called "selectedFlightForOracalRes"
            $('#insured_flights')[0].innerHTML="";
            contract.getInsuredFlights(currentAccount,(flight)=>{
                console.log(flight);
                loadInsuredFlights(undefined,flight);
            },(flights_)=>{
                passengerInsuredflights=flights_;
                
                $('#insured_flights li').click(function(){ 
                
                    $('#insured_flights li').removeClass("active")
                    $(this).addClass(" active  ");
                    selectedFlightForOracalRes = passengerInsuredflights[ $(this).index()];
                });
                
            });


            
        });


        $('#airline_accounts_list a').on('click', function(){
            //console.log($(this).text());
            document.getElementById('bt_airline_select_reg').innerText=$(this).text();
            selectedAirlineForReg = $(this).text();
            
        });

        

        // Read transaction
        contract.isAppContractOperational((error, result) => {
            let toggle = document.getElementById('app_contract_toggle');
            toggle.checked = result;
            //console.log(error,result);
           // display('Operational Status App', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    
        contract.isDataContractOperational((error, result) => {
            let toggle = document.getElementById('data_contract_toggle');
            toggle.checked = result;
            console.log(error,result);
            //console.log(error,result);
            //display('Operational Status Data', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
        
        contract.authorizeAppContract(Config.localhost.appAddress,(error,result)=>{
                console.log("error :: " +error);
                console.log("result :: " +result);
        });

        contract.getRegistredAirlines(loadRegistredAirlines);

        

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
           // let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(selectedFlightForOracalRes,currentAccount, (error,result)=>{
                console.log(error,result);
                result?showToast(result):showToast(error);
            });
        })

        DOM.elid('app_contract_toggle').addEventListener('click', () => {
            let toggle = document.getElementById('app_contract_toggle');
            // Write transaction
            contract.setAppContractOprationalStatus(toggle.checked,(error, result) => {
                console.log(error,result);
                //display('Operational Status App', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
            });
            
        })

        DOM.elid('data_contract_toggle').addEventListener('click', () => {
            let toggle = document.getElementById('app_contract_toggle');
            // Write transaction
            contract.setAppContractOprationalStatus(toggle.checked,(error, result) => {
                console.log(error,result);
                //display('Operational Status App', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
            });
            
        })

        DOM.elid('bt_fund').addEventListener('click', () => {
            let input = document.getElementById('input_fund_amount');
            // Write transaction
            contract.fund(currentAccount,input.value,(error, result) => {
                console.log(error,result);
                //display('Operational Status App', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
            });
            
        })

        DOM.elid('bt_reg').addEventListener('click', () => {
            
            let input = document.getElementById('input_fund_amount');
           
            contract.registerAirline(selectedAirlineForReg,currentAccount,(error, result) => {
                console.log(error,result);
                //display('Operational Status App', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
            });
            
        })

        //On click event for flight registration
        DOM.elid('bt_flight_reg').addEventListener('click', () => {
            
                //Retrives flight details
                let flightName = document.getElementById('input_flight_name').value;
                let flightDate = document.getElementById('input_flight_datetime').valueAsNumber/1000;
                
                
                contract.registerFlight(flightName,flightDate,currentAccount,(error, result) => {
                    console.log(`registerFlight :: ${result?result:error}`);
                    
                    if(result){
                        showToast(result,"result");
                        $('#registred_flights')[0].innerHTML="";
                        contract.getRegistredFlights((flight)=>{
                            console.log(flight);
                            loadRegistredFlights(undefined,flight);
                        },(flights_)=>{
                            flights=flights_;

                            //On click event to select flight for insurance
                            $('#registred_flights li').click(function(){ 
                        
                                $('#registred_flights li').removeClass("active")
                                $(this).addClass(" active  ");
                                selectedFlightForInsurance = flights[ $(this).index()];
                            });
                        });
            
                    }else{
                        showToast(error,"error");
                    }
            
                
                })
            }
        );
        
        //On click event for insurance purchase of flights
        DOM.elid('bt_buy_insurance').addEventListener('click', () => {
            
            let input = document.getElementById('input_insurance_amount').value;
            
            contract.buyInsurance(
                selectedFlightForInsurance["airline"],
                selectedFlightForInsurance["name"],
                selectedFlightForInsurance["flightRegistrationTimestamp"],
                currentAccount,
                input,
                (error, result) => {
                    console.log(`buyInsurance :: ${result?result:error}`);
                    if(result){
                        showToast(result,"result");
                        selectedFlightForInsurance="";
                        $('#registred_flights li').removeClass("active");
                        $('#insured_flights')[0].innerHTML="";    
                        contract.getInsuredFlights(currentAccount,(flight)=>{
                            console.log(flight);
                            loadInsuredFlights(undefined,flight);
                        },(flights_)=>{
                            passengerInsuredflights=flights_;
                            
                            $('#insured_flights li').click(function(){ 
                            
                                $('#insured_flights li').removeClass("active")
                                $(this).addClass(" active  ");
                                selectedFlightForOracalRes = passengerInsuredflights[ $(this).index()];
                            });
                            
                        });
                    }else{
                        showToast(error,"error");
                    }
                    
                }
            );
           
        })
        
            
        contract.getRegistredFlights((flight)=>{
            console.log(flight);
            loadRegistredFlights(undefined,flight);
        },(flights_)=>{
            flights=flights_;
            
            $('#registred_flights li').click(function(){ 
            
                $('#registred_flights li').removeClass("active")
                $(this).addClass(" active  ");
                selectedFlightForInsurance = flights[ $(this).index()];
            });
            
        });

        
        
        
    
        //Subscribing for events
        contract.flightSuretyApp.events.AirlineHasBeenRegistred(function(error, event){ 
            console.log(event);
            //contract.getRegistredAirlines(loadRegistredAirlines);
        })
        
    });

   // contract.getRegistredFlights();
    $(document).ready(function(){
        $("#myToast").toast('show');
        $(".show-toast").click(function(){
            $("#myToast").toast('show');
        });

        
    });



})();

function loadAccountsToSelector(contract){
    document.getElementById("accounts_list").innerHTML='<div style="padding-left : 15px;">Airlines</div>';
        for(let i = 0 ; i < contract.airlines.length ; i++){
            document.getElementById("accounts_list").innerHTML=document.getElementById("accounts_list").innerHTML + generateDropDownItem(contract.airlines[i]);
            document.getElementById("airline_accounts_list").innerHTML=document.getElementById("accounts_list").innerHTML + generateDropDownItem(contract.airlines[i]);
        
        }

        document.getElementById("accounts_list").innerHTML=document.getElementById("accounts_list").innerHTML + 
        
        '<div style="padding-left : 15px;">Passangres</div>';


        for(let i = 0 ; i < contract.passengers.length ; i++){
            document.getElementById("accounts_list").innerHTML=document.getElementById("accounts_list").innerHTML + generateDropDownItem(contract.passengers[i]);
        }

}

function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}


function loadRegistredAirlines(error,result){
    let regAirlineList = document.getElementById('rg_airline_list');
            let listItem='<li class="list-group-item">###</li>'
              
            regAirlineList.innerHTML="";
            for(let i =0; i < result.length ; i++){
                regAirlineList.innerHTML= regAirlineList.innerHTML + listItem.replace('###',result[i]); 
            }
}

function loadRegistredFlights(error,result){
    let regFlightsList = document.getElementById('registred_flights');
            let listItem=`<li class="list-group-item">
            <lable>Name : </lable>${result["name"]}<br>
            <lable>Airline : </lable>${result["airline"]}<br>
            <lable>Departure Time : </lable>${Date(result["flightRegistrationTimestamp"]).toLocaleString()}<br>
            </li>`
              
            
            
            regFlightsList.innerHTML= regFlightsList.innerHTML + listItem; 

}

function loadInsuredFlights(error,result){
    let insuredFlightList = document.getElementById('insured_flights');
            let listItem=`<li class="list-group-item">
            <lable>Name : </lable>${result["name"]}<br>
            <lable>Airline : </lable>${result["airline"]}<br>
            <lable>Departure Time : </lable>${Date(result["flightRegistrationTimestamp"]).toLocaleString()}<br>
            </li>`
              
            
            
            insuredFlightList.innerHTML= insuredFlightList.innerHTML + listItem; 

}



function generateDropDownItem(text){
    return `<a class="dropdown-item" href="#">${text}</a>` ;
}


function showToast(text,type){
    let toast = `<div class="toast ${type=="error"?"alert-warning":"alert-success"}"  style="position: fixed; right:0;"  data-delay="8000" data-autohide="true">
    <div class="toast-header">
      <!-- <img src="..." class="rounded mr-2" alt="..."> -->
      <strong class="mr-auto">${type}</strong>
      <small></small>
      <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="toast-body">
      ${text}
    </div>
  </div>`

  let toast_container = document.getElementById("toast_container");
  toast_container.innerHTML = toast;
  $(".toast").toast('show');
  //document.getElementsByClassName("toast").toast("show")

}


