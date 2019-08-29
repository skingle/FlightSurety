pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    
    struct Airline{
        bool isRegistred;
        uint256 votes;
        uint256 investedFund;
        mapping(address => bool) registredVotes;
    }

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping (address => Airline) private airlines;                      // Airline info
    address[] private registredAirlines;                                // list of registred airline
    mapping (address => bool) private authorizedAppContract;            // list of authorized contracts that can call this contract
    mapping (address => uint256) private passengresAccountWallet;       // wallet for insuree


    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    struct Flight {
        string name;
        bool isRegistred;
        uint8 statusCode;
        uint256 updatedTimestamp;   
        uint256 flightRegistrationTimestamp;     
        address airline;
        address[] insuredPassangres;
    }    

    mapping(bytes32 => Flight) public  flights;
    bytes32[] public  registredFlightKeys;
    mapping(address => mapping(bytes32=>uint256)) private passengerInsuranceAmount;
    mapping(address => bytes32[]) private passengerInsuredFlights;

    function getFlightStatusCode(bytes32 key)
        view
        external
        returns(uint8)
    {
        return flights[key].statusCode;
    }
    
    function getNumberOfRegistredFlights()
        view
        external
        returns(uint256)
    {
        return registredFlightKeys.length;
    }
    function getRegistredFlights(uint256 i)
        view
        external
        returns(bytes32)
    {
        return registredFlightKeys[i];
    }
    
/********************************************************************************************/
/*                                       EVENT DEFINITIONS                                  */
/********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor(address firstAirline) 
        public 
    {
        contractOwner = msg.sender;
        //adding first airline
        airlines[firstAirline].isRegistred = true;
        registredAirlines.push(firstAirline);   
    }

/********************************************************************************************/
/*                                       FUNCTION MODIFIERS                                 */
/********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires the Contract to be authorized 
    */
    modifier requireAuthorizedContract()
    {
        require(authorizedAppContract[msg.sender], "Application Contract is not authorized");
        _;
    }

/********************************************************************************************/
/*                                       UTILITY FUNCTIONS                                  */
/********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
        public 
        view 
        returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus(bool mode) 
        external
        requireContractOwner()
    {
        operational = mode;
    }

    /**
    * @dev Authorized a contract
    * Authorize a contract so that it can call the function of this contract
    */

    function authorizeAppContract(address contract_) 
        external
        requireContractOwner()
    {
            authorizedAppContract[contract_] = true;
    }

    /**
    * @dev Deauthorized a contract
    * Deauthorize a contract so that it cannot call the function of this contract
    */

    function deauthorizeAppContract(address contract_) 
        external
        requireContractOwner()
    {
            authorizedAppContract[contract_] = false;
    }    
/********************************************************************************************/
/*                                     SMART CONTRACT FUNCTIONS                             */
/********************************************************************************************/
//Airlines 
   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
   
    function registerAirline(address airline)
        external
        requireIsOperational()
        requireAuthorizedContract()
    {
            airlines[airline].isRegistred = true;
            registredAirlines.push(airline);
            
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy()
        external
        requireIsOperational()
        requireAuthorizedContract()
        payable
    {
        
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(address passengre, uint256 amount)
        external
        requireIsOperational()
        requireAuthorizedContract()
    {
        passengresAccountWallet[passengre] = passengresAccountWallet[passengre].add(amount);
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay()
        external
        requireIsOperational()
        //requireAuthorizedContract(msg.sender)
    {   
        require(passengresAccountWallet[msg.sender] > 0,'Wallet is empty');
        uint256 amount = passengresAccountWallet[msg.sender];
        passengresAccountWallet[msg.sender] = 0;
        msg.sender.transfer(amount);
    }

    /**
     *  @dev Returns Wallet balance
     *
    */
    function getWalletBalance()
        external
        view
        returns (uint256)
    {
        return passengresAccountWallet[msg.sender];
    }
   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund()
        public
        requireIsOperational()
        payable
    {
    }

    function getFlightKey(address airline, string memory flight, uint256 timestamp)
        pure
        internal
        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    *   @dev gets the Airline registration status
    */
    function isAirlineRegistred(address airline)
        view
        external
        returns(bool)
    {
        
        return airlines[airline].isRegistred;
    }

    /**
    *   @dev gets vote count
    */
    function getAirlineVoteCount(address airline)
        view
        external
        returns(uint256)
    {
        return airlines[airline].votes;
    }

    function getAirlineInvestedFundAmount(address airline)
        view
        external
        returns(uint256)
    {
        return airlines[airline].investedFund;
    }

    
    
    /**
    *   @dev register the vote for given airline
    */
    function incrementAirlineVote(address airline,address voter)
        external
        requireAuthorizedContract()
        requireIsOperational()
        returns(uint256)
    {   
        airlines[airline].votes = airlines[airline].votes.add(1);
        airlines[airline].registredVotes[voter] = true;
        return airlines[airline].votes;
    }

    /**
    *   @dev get the vote of the participent
    */
    function hasVoted(address airline, address voter)
        view
        external
        requireAuthorizedContract()
        returns(bool)
    {   
        return airlines[airline].registredVotes[voter];
    }

    /**
    *   @dev gets total registred airlines
    */
    
    function getNumberOfRegistredAirlines()
        view
        external
        returns(uint256)
    {
    
        return registredAirlines.length;
    }

    /**
    *   @dev gets total registred airlines
    */
    
    function getRegistredAirlines(uint256 index)
        view
        external
        returns(address)
    {
    
        return registredAirlines[index];
    }

    /**
    *   @dev receive fund and add entry to airline.investedAmount
    */
    
    event receivedFundFromAirline(address airline,uint value);
    function receiveFundFromAirline(address airline)
        external
        payable
        requireIsOperational()
        requireAuthorizedContract()
    {
        airlines[airline].investedFund = airlines[airline].investedFund.add(msg.value);
        //emit receivedFundFromAirline(airline,airlines[airline].investedFund);
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
        external 
        payable 
    {
        fund();
    }

//Flight
    

    

    function registerFlight(string flightName,uint256 timestamp,address airline_)
        external
        requireIsOperational()
        requireAuthorizedContract()
    {
        bytes32 flightKey = getFlightKey(airline_,flightName,timestamp);
        flights[flightKey] = Flight({
                                        name:flightName,
                                        isRegistred:true,
                                        statusCode:STATUS_CODE_UNKNOWN,
                                        updatedTimestamp:timestamp,
                                        flightRegistrationTimestamp:timestamp,
                                        airline:airline_,
                                        insuredPassangres:new address[](0)
                                    });
        registredFlightKeys.push(flightKey);                            
        
    }
    function setFlightIsRegistred(bytes32 key, bool isRegistred)
        external
        requireIsOperational()
        requireAuthorizedContract()
    {
            flights[key].isRegistred = isRegistred;
    }

    function setFlightStatusCode(bytes32 key, uint8 statusCode)
        external
        requireIsOperational()
        requireAuthorizedContract()
    {
            flights[key].statusCode = statusCode;
    }

    function setFlightUpdatedTimestamp(bytes32 key, uint256 updatedTimestamp)
        external
        requireIsOperational()
        requireAuthorizedContract()
    {
            flights[key].updatedTimestamp = updatedTimestamp;
    }
    
    function addInsuredPassangres(bytes32 key, address isuredPassangres)
        external
        requireIsOperational()
        requireAuthorizedContract()
    {
            flights[key].insuredPassangres.push(isuredPassangres) ;
    }

    function getNumberOfInsuredPassangres(bytes32 key)
        view
        external
        returns (uint256)
    {
        return flights[key].insuredPassangres.length;
    }

    function getInsuredPassangresAt(bytes32 key, uint256 index)
        view
        external
        returns (address)
    {
        return flights[key].insuredPassangres[index];
    }

    function addPassengerInsuredFlights( address passenger, bytes32 flightKey)
        external
        requireIsOperational()
        requireAuthorizedContract()
    {
        passengerInsuredFlights[passenger].push(flightKey);
    }

     function getPassengersInsuredFlightCount( address passenger)
        view
        external
        returns(uint256)
    {
        return passengerInsuredFlights[passenger].length;
        
    }

    function getPassengersInsuredFlights( address passenger, uint256 index)
        view
        external
        returns (bytes32)
    {
       return passengerInsuredFlights[passenger][index];
    }
    

    function setPassengerInsuranceAmount(address passenger, bytes32 flightKey,uint256 amount)
        external
        requireIsOperational()
        requireAuthorizedContract()
    {
        passengerInsuranceAmount[passenger][flightKey] = amount;
    }

    function getPassengerInsuranceAmount(address passenger, bytes32 flightKey)
        view
        external
        returns(uint256)
    {
        return passengerInsuranceAmount[passenger][flightKey];
    }

    function getIsFlightRegistred(bytes32 key)
        view
        external
        returns(bool)
    {
        return flights[key].isRegistred;
    }
}

