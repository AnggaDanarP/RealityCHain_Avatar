//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PreSaleActive is Ownable {
    uint256 public preSaleStartTime;
    uint256 public preSaleEndTime;

    modifier isPreSaleActive() {
        require(isPreSaleAlreadyActive(), "Pre Sale is not active");
        _;
    }

    constructor() {}

    function isPreSaleAlreadyActive() public view returns (bool) {
        return preSaleStartTime > 0 && 
        preSaleEndTime > 0 && 
        block.timestamp >= preSaleStartTime &&
        block.timestamp <= preSaleEndTime;
    }

    // unix time set
    // start: 1653390000 {Tue May 24 2022 18:00:00 UTC+0700 (Waktu Indonesia Barat)}
    // end  : 1655982000 {Thu Jun 23 2022 18:00:00 UTC+0700 (Waktu Indonesia Barat)}
    function setPreSaleActive(uint256 _startTime, uint256 _endTime) external onlyOwner {
        require(_endTime > _startTime, "Time input invalid");
        preSaleStartTime = _startTime;
        preSaleEndTime = _endTime;
    }
}