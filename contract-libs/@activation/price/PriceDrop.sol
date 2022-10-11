//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../PublicSaleActive.sol";

contract PriceDrop is PublicSaleActive {
    uint256 public preSaleStartTime;
    
    uint256 public cost;

    uint256 public constant PRICE_DROP_DURATION = 600; // 10 mins
    uint256 public constant PRICE_DROP_AMOUNT = 0.025 ether;
    uint256 public constant PRICE_DROP_FLOOR = 0.2 ether;

    constructor(uint256 _cost) { cost = _cost; }

    function getPrice() public view returns (uint256) {
        if (isPublicSaleAlreadyActive()) {
            uint256 dropCount = (block.timestamp - preSaleStartTime) / PRICE_DROP_DURATION;

            // It takes 12 dropCount to reach at 0.2 floor price in Dutch Auction
            return dropCount < 12 
                ? cost - dropCount * PRICE_DROP_AMOUNT
                : PRICE_DROP_FLOOR;
        }
        return cost;
        
    }


}