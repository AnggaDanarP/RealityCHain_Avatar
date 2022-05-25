// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Withdrawable is Ownable {
    constructor() {}

    function withdrawFunds() external onlyOwner {
        require(address(this).balance > 0, "Failed: no funds to withdraw");
        payable(msg.sender).transfer(address(this).balance);
    }
}