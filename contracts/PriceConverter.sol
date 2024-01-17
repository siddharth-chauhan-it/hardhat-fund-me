// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
  function getPrice(AggregatorV3Interface priceFeed) internal view returns (uint256) {
    // (uint80 roundId, int price, uint startedAt, uint timestamp, uint80 answeredInRound) = priceFeed.latestRoundData();
    (, int price, , , ) = priceFeed.latestRoundData();
    // ETH in terms of USD (8 decimals)
    // 3000.00000000 (8 decimals)

    return uint256(price * 1e10); // 1 * 10 ** 10 == 10000000000
  }

  function getVersion(AggregatorV3Interface priceFeed) internal view returns (uint256) {
    return priceFeed.version();
  }

  function getDecimal(AggregatorV3Interface priceFeed) internal view returns (uint256) {
    return priceFeed.decimals();
  }

  function getConversionRate(
    uint256 ethAmount,
    AggregatorV3Interface priceFeed
  ) internal view returns (uint256) {
    uint256 ethPrice = getPrice(priceFeed);
    uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
    return ethAmountInUsd;
  }
}
