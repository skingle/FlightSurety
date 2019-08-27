pragma solidity ^0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";


/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

/********************************************************************************************/
/*                                       DATA VARIABLES                                     */
/********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    //Constant
    uint8 private constant REGISTRATION_WITHOUT_VOTE = 4;

    address private contractOwner;          // Account used to deploy contract
    address private dataContractAddress;    // Data Contract Address
    bool    private operational;               // Operational status of the contract
    uint256 private seedAmount;             // seed amount in wei
    uint256 private insuranceCapPrice;      // max insurance can be purchased in wei
    uint256 private insuranceRefundMultipleNum;      // numerator
    uint256 private insuranceRefundMultipleDeno;     // denominator
    

    
    //bytes32[] private listOfRegisterFlightsIndex;
    FlightSuretyData flightSuretyDataContract;


/********************************************************************************************/
/*                                              EVENTS                                      */
/********************************************************************************************/
//event voteAlreadyRecorded(string name,uint age);

/********************************************************************************************/
/*                                       FUNCTION MODIFIERS                                 */

// Modifiers help avoid duplication of code. They are typically used to validate something
// before a function is allowed to be executed.
/********************************************************************************************/

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
         // Modify to call data contract's status
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
    * @dev Modifier that requires the airline to be registered
    */
    modifier requireAirlineRegistred()
    {
        require(flightSuretyDataContract.isAirlineRegistred(msg.sender), "Airline should be registred");
        _;
    }

    /**
    * @dev Modifier that requires airline to fund the contract with seed amount
    */
    modifier requireAirlineHasFundedContract()
    {
        require(flightSuretyDataContract.getAirlineInvestedFundAmount(msg.sender)>=seedAmount, "Airline has to fund the contract with seed amount");
        _;
    }

    /**
    * @dev Modifier that requires flight to be registred
    */
    modifier requireFlightIsNotRegistred(address airline,string flight,uint256 timestamp)
    {    
        
        require(!flightSuretyDataContract.getIsFlightRegistred(getFlightKey(airline,flight,timestamp)), "flight is registred");
        _;
    }

       modifier requireFlightIsRegistred(address airline,string flight,uint256 timestamp)
    {    
        
        require(flightSuretyDataContract.getIsFlightRegistred(getFlightKey(airline,flight,timestamp)), "flight is not registred");
        _;
    }

    // /**
    // * @dev Modifier that caps the price of insurance
    // */
    // modifier requireInsurancePurchaseAmountLessThanCap()
    // {
    //     require(msg.value <= insuranceCapPrice , "Airline should be registred");
    //     _;
    // }

/********************************************************************************************/
/*                                       CONSTRUCTOR                                        */
/********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor(address dataContract, uint256 _seedAmount, uint256 _insuranceCapPrice, uint256 _insuranceRefundMultipleNum,uint256 _insuranceRefundMultipleDeno) 
        public 
    {
        contractOwner = msg.sender;
        dataContractAddress = dataContract;
        flightSuretyDataContract =  FlightSuretyData(dataContract);
        seedAmount = _seedAmount;
        insuranceCapPrice=_insuranceCapPrice;
        insuranceRefundMultipleNum = _insuranceRefundMultipleNum;
        insuranceRefundMultipleDeno = _insuranceRefundMultipleDeno;
    }

/********************************************************************************************/
/*                                       UTILITY FUNCTIONS                                  */
/********************************************************************************************/

    function isOperational() 
        public 
        view 
        returns(bool) 
    {
        return operational;  // Modify to call data contract's status
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
    

/********************************************************************************************/
/*                                     SMART CONTRACT FUNCTIONS                             */
/********************************************************************************************/
    
  
    /**
    * @dev Add an airline to the registration queue
    * First 4  airlines  will  be  registred  without  any  votes  but  need  to be registred by pre registred airline.
    * As airline registration count increases above or equle to 5, the new airline which is to be registred should get 
    * 50% consensus of registred airlines 
    * Every registred airline should submit 10 ether
    */   
    event AirlineHasBeenRegistred (uint256 count_);
    function registerAirline( address airline )
        external
        requireIsOperational()
        requireAirlineRegistred()
        requireAirlineHasFundedContract()
        returns(bool success, uint256 votes )
    {   
        require(!flightSuretyDataContract.isAirlineRegistred(airline), "Airline is already registred");
        if(flightSuretyDataContract.getNumberOfRegistredAirlines() < REGISTRATION_WITHOUT_VOTE) {
            flightSuretyDataContract.incrementAirlineVote(airline,msg.sender);
            flightSuretyDataContract.registerAirline(airline);
            emit AirlineHasBeenRegistred(flightSuretyDataContract.getNumberOfRegistredAirlines());
            success = true;
        }else{
            success = false;
            require(!flightSuretyDataContract.hasVoted(airline,msg.sender), "Already voted for the airline");
            if(flightSuretyDataContract.incrementAirlineVote(airline,msg.sender)>=flightSuretyDataContract.getNumberOfRegistredAirlines().div(2)){
                flightSuretyDataContract.registerAirline(airline);
                emit AirlineHasBeenRegistred(flightSuretyDataContract.getNumberOfRegistredAirlines());
            }
            success = true;

        }
        
        return (flightSuretyDataContract.isAirlineRegistred(airline), flightSuretyDataContract.getAirlineVoteCount(airline));
    }
    
    /**
    * @dev seed funding by registred airlines
    * checks if the fund amount is equal to seedAmount
    */
    event recivedfund(address payee, uint amount);
    function fund()
        public
        payable
        requireIsOperational()
        requireAirlineRegistred()
    {   
       
        flightSuretyDataContract.receiveFundFromAirline.value(msg.value)(msg.sender);
        emit recivedfund(msg.sender,msg.value);
    }


   /**
    * @dev Register a future flight for insuring.
    *
    */  
    event FlightHasBeenRegistred(string flightName,uint256 timestamp,address airline);
    function registerFlight(string flightName,uint256 timestamp)
        external
        requireIsOperational()
        requireAirlineRegistred()
        requireAirlineHasFundedContract()
        requireFlightIsNotRegistred(msg.sender,flightName,timestamp)   
    {
          flightSuretyDataContract.registerFlight(flightName,timestamp,msg.sender);  
          emit  FlightHasBeenRegistred(flightName,timestamp,msg.sender);
    }
    
   /**
    * @dev Called after oracle has updated flight status
    *
    */  
    
    function processFlightStatus(address airline, string memory flight, uint256 timestamp, uint8 statusCode)
        internal
    {
        bytes32 flightKey = getFlightKey(airline,flight,timestamp);
        flightSuretyDataContract.setFlightStatusCode(flightKey,statusCode);
        oracleResponses[flightKey].isOpen = false;
        if(statusCode == STATUS_CODE_LATE_AIRLINE){
            //refund 1.5x
            for(uint256 i =0; i < flightSuretyDataContract.getNumberOfInsuredPassangres(flightKey) ; i++ ){
                address passanger = flightSuretyDataContract.getInsuredPassangresAt(flightKey,i);
                uint256 boughtInsurance = flightSuretyDataContract.getPassengerInsuranceAmount(passanger,flightKey);
                flightSuretyDataContract.creditInsurees(passanger, boughtInsurance.mul(insuranceRefundMultipleNum).div(insuranceRefundMultipleDeno));
            }
        }
        
    }


    // Generate a request for oracles to fetch flight information
    
    function fetchFlightStatus(address airline,string flight,uint256 timestamp)
        external
        requireIsOperational()
        requireFlightIsRegistred(airline,flight,timestamp)
    {
        // Generate a unique key for storing the request
        
        uint8 index = getRandomIndex(msg.sender);
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    } 


 
/********************************************************************************************/
/*                                     ORACLE MANAGEMENT                                    */
/********************************************************************************************/

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    
    function getFlightKey
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }
  
 
/********************************************************************************************/
/*                                     INSURANCE FUNCTIONS                                    */
/********************************************************************************************/
    
    /**
    * @dev Buy insurance for a flight
    *
    */   
    event InsuranceSuccessfullyPurchased(address,string,uint256,uint256);
    function buyInsurance(address airline, string flight, uint256 timestamp )
        external
        payable
        requireIsOperational()
        requireFlightIsRegistred(airline,flight,timestamp)
       

    {   
        bytes32 key = getFlightKey(airline,flight,timestamp);
        require(flightSuretyDataContract.getPassengerInsuranceAmount(msg.sender,key) == 0,"Insurance Already Bought");
        require(msg.value <= insuranceCapPrice,"Can not buy insurance greater than cap price ");
        flightSuretyDataContract.buy.value(msg.value)();
        flightSuretyDataContract.setPassengerInsuranceAmount(msg.sender,key,msg.value);
        flightSuretyDataContract.addPassengerInsuredFlights(msg.sender,key);
        flightSuretyDataContract.addInsuredPassangres(key,msg.sender);
        emit InsuranceSuccessfullyPurchased(airline,flight,timestamp,msg.value);
    }

}   


contract FlightSuretyData {
    

    function isOperational() public view returns(bool);
    function setOperatingStatus(bool mode) external;
    function authorizeAppContract(address contract_) external;
    function deauthorizeAppContract(address contract_) external;
    function registerAirline(address airline) external;
    function buy() external payable;
    function creditInsurees(address passengre, uint256 amount)external;
    function pay(address passengre) external;
    function fund() public payable;
    function getFlightKey(address airline, string memory flight, uint256 timestamp)  pure internal returns(bytes32);
    function isAirlineRegistred(address airline) view external returns(bool);
    function getAirlineVoteCount(address airline) view external returns(uint256);
    function getAirlineInvestedFundAmount(address airline) view external returns(uint256);
    function incrementAirlineVote(address airline, address voter) external returns(uint256);
    function hasVoted(address airline, address voter) view external returns(bool);
    function getNumberOfRegistredAirlines() view external returns(uint256);
    function receiveFundFromAirline(address airline) external payable;
    
    function registerFlight(string flightName,uint256 timestamp,address airline_) external;
    function setFlightIsRegistred(bytes32 key, bool isRegistred)  external;
    function setFlightStatusCode(bytes32 key, uint8 statusCode)    external;
    function setFlightUpdatedTimestamp(bytes32 key, uint256 updatedTimestamp)    external;
    function setPassengerInsuranceAmount(address passenger, bytes32 flightKey,uint256 amount) external;
    function addInsuredPassangres(bytes32 key, address isuredPassangres)    external;
    function addPassengerInsuredFlights( address passenger, bytes32 flightKey) external;
    function getNumberOfInsuredPassangres(bytes32 key) view external returns (uint256);
    function getInsuredPassangresAt(bytes32 flightKey, uint256 index) view external returns (address);
    function getPassengerInsuranceAmount(address passenger, bytes32 flightKey) view external returns(uint256);
    function getIsFlightRegistred(bytes32 key) view external returns(bool);
    

}