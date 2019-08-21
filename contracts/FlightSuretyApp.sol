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
    uint8 private constant REGISTRATION_WITHOUT_VOTE = 5;

    address private contractOwner;          // Account used to deploy contract
    address private dataContractAddress;    // Data Contract Address
    bool    private operational;               // Operational status of the contract
    uint256 private seedAmount;             // seed amount in wei
    uint256 private insuranceCapPrice;      // max insurance can be purchased in wei
    uint256 private insuranceRefundMultipleNum;      // numerator
    uint256 private insuranceRefundMultipleDeno;     // denominator
    

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
        address[] insuredPassangres;
    }    

    mapping(bytes32 => Flight) private flights;
    mapping(address => mapping(bytes32=>uint256)) private passengerinsuranceAmount;
    mapping(address => bytes32[]) passengerInsuredFlights;
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
    modifier requireFlightRegistred(address airline,string flight,uint256 timestamp)
    {
        require(flights[getFlightKey(airline,flight,timestamp)].isRegistered, "flight is not registred");
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
    event countAirlines (uint256 count_);
    function registerAirline( address airline )
        external
        requireIsOperational()
        requireAirlineRegistred()
        requireAirlineHasFundedContract()
        returns(bool success, uint256 votes )
    {   emit countAirlines(0);
     
        if(flightSuretyDataContract.getNumberOfRegistredAirlines() < REGISTRATION_WITHOUT_VOTE) {
            flightSuretyDataContract.incrementAirlineVote(airline);
            uint256 x = flightSuretyDataContract.registerAirline(airline);
            emit countAirlines(x);
            success = true;
        }else{
            success = false;
            require(!flightSuretyDataContract.hasVoted(airline), "Already voted for the airline");
            if(flightSuretyDataContract.incrementAirlineVote(airline)>=flightSuretyDataContract.getNumberOfRegistredAirlines().div(2)){
                flightSuretyDataContract.registerAirline(airline);
            }
            success = true;

        }
        return (flightSuretyDataContract.isAirlineRegistred(airline), flightSuretyDataContract.getAirlineVoteCount(airline));
    }
    event recivedfund(address payee, uint amount);
    /**
    * @dev seed funding by registred airlines
    * checks if the fund amount is equal to seedAmount
    */
    function fund()
        public
        payable
        requireIsOperational()
        requireAirlineRegistred()
    {   
       // emit recivedfund(msg.sender,msg.value);
        flightSuretyDataContract.receiveFundFromAirline.value(msg.value)(msg.sender);
    }


   /**
    * @dev Register a future flight for insuring.
    *
    */  
    event flightHasBeenReg(string flightName,uint256 timestamp,address airline);
    function registerFlight(string flightName,uint256 timestamp)
        external
        requireIsOperational()
        requireAirlineRegistred()
        requireAirlineHasFundedContract()   
    {
        bytes32 flightKey = getFlightKey(msg.sender,flightName,timestamp);
        flights[flightKey] = Flight({
                                        isRegistered:true,
                                        statusCode:STATUS_CODE_UNKNOWN,
                                        updatedTimestamp:timestamp,
                                        airline:msg.sender,
                                        insuredPassangres:new address[](0)
                                    });
          emit  flightHasBeenReg(flightName,timestamp,msg.sender);
    }
    
   /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus(address airline, string memory flight, uint256 timestamp, uint8 statusCode)
        internal
        
    {
        bytes32 flightKey = getFlightKey(airline,flight,timestamp);
        flights[flightKey].statusCode = statusCode;
        oracleResponses[flightKey].isOpen = false;
        if(statusCode == STATUS_CODE_LATE_AIRLINE){
            //refund 1.5x
            for(uint256 i =0; i < flights[flightKey].insuredPassangres.length ; i++ ){
                address passanger = flights[flightKey].insuredPassangres[i];
                uint256 boughtInsurance = passengerinsuranceAmount[passanger][flightKey];
                flightSuretyDataContract.creditInsurees(passanger, boughtInsurance.mul(insuranceRefundMultipleNum).div(insuranceRefundMultipleDeno));
            }
        }
        
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(address airline,string flight,uint256 timestamp)
        external
        requireIsOperational()
        requireFlightRegistred(airline,flight,timestamp)
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

    function getFlight
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        external
                        view
                        returns (bool,uint8,uint256,address)
    {
           bytes32 key = getFlightKey(airline,flight,timestamp); 
                return(
                    flights[key].isRegistered,
                    flights[key].statusCode,
                    flights[key].updatedTimestamp,
                    flights[key].airline
                );
                    
    }
 
/********************************************************************************************/
/*                                     INSURANCE FUNCTIONS                                    */
/********************************************************************************************/
    
    /**
    * @dev Buy insurance for a flight
    *
    */   
    function buyInsurance(address airline, string flight, uint256 timestamp )
        external
        payable
        requireIsOperational()

    {
        require(msg.value <= insuranceCapPrice,"Can buy insurance less than cap price");
        flightSuretyDataContract.buy.value(msg.value)();
        bytes32 key = getFlightKey(airline,flight,timestamp);
        passengerinsuranceAmount[msg.sender][key] = msg.value;
        passengerInsuredFlights[msg.sender].push(key);
        flights[key].insuredPassangres.push(msg.sender);
        
    }

}   


contract FlightSuretyData {
    function isOperational() public view returns(bool);
    function setOperatingStatus(bool mode) external;
    function authorizeAppContract(address contract_) external;
    function deauthorizeAppContract(address contract_) external;
    function registerAirline(address airline) external returns(uint256);
    function buy() external payable;
    function creditInsurees(address passengre, uint256 amount)external;
    function pay(address passengre) external;
    function fund() public payable;
    function getFlightKey(address airline, string memory flight, uint256 timestamp)  pure internal returns(bytes32);
    function isAirlineRegistred(address airline) view external returns(bool);
    function getAirlineVoteCount(address airline) view external returns(uint256);
    function getAirlineInvestedFundAmount(address airline) view external returns(uint256);
    function incrementAirlineVote(address airline) external returns(uint256);
    function hasVoted(address airline) view external returns(bool);
    function getNumberOfRegistredAirlines() view external returns(uint256);
    function receiveFundFromAirline(address airline) external payable;
}