
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

        
        //console.log(JSON.stringify(contract.flightSuretyData));
        //contract.getRegistredFlights();9999

        //Load accounts in a selector
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

        $('#bt_redeem').on('click',()=>{

            contract.pay(currentAccount,(error,result)=>{
                console.log(result);
                console.log(error);
            })
            contract.getWalletBalance(currentAccount,(error,result)=>{
                $('#wallet_balance').innerHTML = result;
            });
        });

        $('#accounts_list a').on('click', function(){
            //console.log($(this).text());
            document.getElementById('selected_account').innerHTML=$(this).text();
            currentAccount = $(this).text();

            contract.getWalletBalance(currentAccount,(error,result)=>{
                    $('#wallet_balance').innerHTML = result;
            });

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
            contract.fetchFlightStatus(selectedFlightForOracalRes, (error, result) => {
               // display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
                if(result!=undefined){
                    console.table(result);
                    showToast(`Airline : ${result["name"]} 
                    Time : ${ Date(result["flightRegistrationTimestamp"]).toLocaleString()}`);
                }else{
                    showToast(JSON.stringify(error));
                }
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
            // Write transaction
            contract.registerAirline(selectedAirlineForReg,currentAccount,(error, result) => {
                console.log(error,result);
                //display('Operational Status App', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
            });
            
        })

        DOM.elid('bt_flight_reg').addEventListener('click', () => {
            let input = document.getElementById('input_fund_amount');
            let flightName = document.getElementById('input_flight_name').value;
            let flightDate = document.getElementById('input_flight_datetime').valueAsNumber/1000;
            // Write transaction
            contract.registerFlight(flightName,flightDate,currentAccount,(error, result) => {
                console.log(error,result);
                showToast(error);
                //display('Operational Status App', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
            });
            $('#registred_flights')[0].innerHTML="";
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
            })}
        )

        DOM.elid('bt_buy_insurance').addEventListener('click', () => {
            let input = document.getElementById('input_insurance_amount').value;
            // Write transaction
            contract.buyInsurance(
                selectedFlightForInsurance["airline"],
                selectedFlightForInsurance["name"],
                selectedFlightForInsurance["flightRegistrationTimestamp"],
                currentAccount,
                input,
                (error, result) => {console.log(error,result);}
            );
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


function showToast(text){
    let toast = `<div class="toast"  style="position: fixed; right:0;"  data-delay="8000" data-autohide="true">
    <div class="toast-header">
      <!-- <img src="..." class="rounded mr-2" alt="..."> -->
      <strong class="mr-auto">Bootstrap</strong>
      <small>11 mins ago</small>
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


