//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PublicSaleActive is Ownable {
    uint256 public publicSaleStartTime;
    uint256 public publicSaleEndTime;

    modifier isPublicSaleActive() {
        require(isPublicSaleAlreadyActive(), "Public Sale is not active");
        _;
    }

    constructor() {}

    function isPublicSaleAlreadyActive() public view returns (bool) {
        return publicSaleStartTime > 0 && 
        publicSaleEndTime > 0 && 
        block.timestamp >= publicSaleStartTime &&
        block.timestamp <= publicSaleEndTime;
    }

    // unix time set
    // start: 1653390000 {Tue May 24 2022 18:00:00 UTC+0700 (Waktu Indonesia Barat)}
    // end  : 1655982000 {Thu Jun 23 2022 18:00:00 UTC+0700 (Waktu Indonesia Barat)}
    function setPublicSaleActive(uint256 _startTime, uint256 _endTime) external onlyOwner {
        require(_endTime > _startTime, "Time input invalid");
        publicSaleStartTime = _startTime;
        publicSaleEndTime = _endTime;
    }
}