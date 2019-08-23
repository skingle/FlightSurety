
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';
import Config from './config.json';
var currentAccount = "";
var selectedAirlineForReg="";

(async() => {

    

    let contract = new Contract('localhost', () => {
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

        $('#accounts_list a').on('click', function(){
            //console.log($(this).text());
            document.getElementById('selected_account').innerHTML=$(this).text();
            currentAccount = $(this).text();
            
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
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
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


function generateDropDownItem(text){
    return `<a class="dropdown-item" href="#">${text}</a>`
}



