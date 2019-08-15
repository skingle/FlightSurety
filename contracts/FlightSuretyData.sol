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
    mapping (address => bool) private authorizedAppContract;            // list of authorized contracts tha can call this contract
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
    modifier requireAuthorizedContract(address contract_)
    {
        require(authorizedAppContract[contract_], "Application Contract is not authorized");
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

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline(address airline)
        external
        requireIsOperational()
        requireAuthorizedContract(msg.sender)
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
        payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees()
        external
        pure
    {
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay()
        external
        pure
    {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund()
        public
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
        return(bool)
    {
        return airlines[airline].isRegistred;
    }

    /**
    *   @dev gets vote count
    */
    function getAirlineVoteCount(address airline)
        view
        external
        return(uint256)
    {
        return airlines[airline].votes;
    }

    function getAirlineInvestedFundAmount(address airline)
        view
        external
        return(uint256)
    {
        return airlines[airline].investedFund;
    }
    
    /**
    *   @dev register the vote for given airline
    */
    function incrementAirlineVote(address airline)
        external
        requireAuthorizedContract()
        return(uint256)
    {   
        airlines[airline].votes = airlines[airline].votes + 1;
        airlines[airline].registredVotes[msg.sender] = true;
        return airlines[airline].votes;
    }

    /**
    *   @dev get the vote of the participent
    */
    function hasVoted(address airline)
        view
        external
        requireAuthorizedContract()
        return(bool)
    {   
        return airlines[airline].registredVotes[msg.sender];
    }

    /**
    *   @dev gets total registred airlines
    */
    function getNumberOfRegistredAirlines()
        view
        external
        return(uint256)
    {
        return registredAirlines.length;
    }

    /**
    *   @dev receive fund and add entry to airline.investedAmount
    */
    

    function receiveFundFromAirline(address airline)
        external
        payable
        requireIsOperational()
        requireAuthorizedContract()
    {
        airlines[airline].investedFund.add(msg.value);
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


}

