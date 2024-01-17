// SPDX-License-Identifier: MIT

// Pragma - Style Guide
pragma solidity ^0.8.8;

// Imports - Style Guide
import "./PriceConverter.sol";
// import "hardhat/console.sol";  // Hardhat Debug Console

// Error Codes - Style Guide
error FundMe__NotOwner();

// Interfaces, Libraries, Contracts - Style Guide

// Natspec - Style Guide
/**
 * @title A contract for crowd funding
 * @author Siddharth Chauhan
 * @notice This contract is to demo a sample funding contract
 * @dev This implements chainlink price feeds as our library
 */
contract FundMe {
  // Type Declarations - Style Guide
  using PriceConverter for uint256;

  // State Variables - Style Guide
  uint256 public constant MINIMUM_USD = 50 * 1e18; // 1 * 10 ** 18
  address[] private s_funders;
  mapping(address => uint256) private s_addressToAmountFunded;
  address private immutable i_owner;
  AggregatorV3Interface private s_priceFeed;

  // Modifier - Style Guide
  modifier onlyOwner() {
    // require(msg.sender == i_owner, "Not owner!");
    if (msg.sender != i_owner) revert FundMe__NotOwner(); // More Gas Efficient
    _;
  }

  // Functions Order: - Style Guide
  //// constructor
  //// receive
  //// fallback
  //// external
  //// public
  //// internal
  //// private
  //// view / pure

  constructor(address priceFeedAddress) {
    i_owner = msg.sender;
    s_priceFeed = AggregatorV3Interface(priceFeedAddress);
  }

  receive() external payable {
    fund();
  }

  fallback() external payable {
    fund();
  }

  /**
   * @notice This function funds this contract
   * @dev This implements chainlink price feeds as our library
   */
  // * @param - For parameters
  // * @return - For returning values
  function fund() public payable {
    require(msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD, "Didn't send enough ETH"); // 1e18 = 1 * 10 ** 18 == 1000000000000000000
    s_funders.push(msg.sender);
    s_addressToAmountFunded[msg.sender] += msg.value;
    // console.log("Transferring %s from %s", msg.value, msg.sender); // Hardhat Debug Console
  }

  function withdraw() public onlyOwner {
    // reset the mapping
    for (uint256 funderIndex = 0; funderIndex < s_funders.length; funderIndex++) {
      address funder = s_funders[funderIndex];
      s_addressToAmountFunded[funder] = 0;
    }

    // reset the funders array
    s_funders = new address[](0);

    // withdraw the funds
    (bool callSuccess, ) = payable(msg.sender).call{value: address(this).balance}("");
    require(callSuccess, "Call failed");
  }

  // For Gas Efficiency => Memory is cheaper than Storage
  function efficientWithdraw() public onlyOwner {
    address[] memory funders = s_funders;

    // mappings can't be in memory
    // reset the mapping
    for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
      address funder = funders[funderIndex];
      s_addressToAmountFunded[funder] = 0;
    }

    // reset the funders array
    s_funders = new address[](0);

    // withdraw the funds
    (bool callSuccess, ) = i_owner.call{value: address(this).balance}("");
    require(callSuccess, "Call failed");
  }

  // View / Pure - Style Guide
  function getOwner() public view returns (address) {
    return i_owner;
  }

  function getFunder(uint256 index) public view returns (address) {
    return s_funders[index];
  }

  function getAddressToAmountFunded(address funder) public view returns (uint256) {
    return s_addressToAmountFunded[funder];
  }

  function getPriceFeed() public view returns (AggregatorV3Interface) {
    return s_priceFeed;
  }
}
