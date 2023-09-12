// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT721 is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    constructor() ERC721("MyToken721", "MT7") {}

    function safeMint() public onlyOwner {
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(msg.sender, tokenId);
    }
}