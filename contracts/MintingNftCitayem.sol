/**
SPDX-License-Identifier: MIT
///////////////////////////
/////////////////////////
///////////////////////
/////////////////////
///////////////////
/////////////////
///////////////
/////////////
///////////
/////////
///////
/////
///
██      ███████  █████   ██████  ██    ██ ███████      ██████  ███████      ██████  ██    ██  █████  ██████  ██████  ██  █████  ███    ██ ███████ 
██      ██      ██   ██ ██       ██    ██ ██          ██    ██ ██          ██       ██    ██ ██   ██ ██   ██ ██   ██ ██ ██   ██ ████   ██ ██      
██      █████   ███████ ██   ███ ██    ██ █████       ██    ██ █████       ██   ███ ██    ██ ███████ ██████  ██   ██ ██ ███████ ██ ██  ██ ███████ 
██      ██      ██   ██ ██    ██ ██    ██ ██          ██    ██ ██          ██    ██ ██    ██ ██   ██ ██   ██ ██   ██ ██ ██   ██ ██  ██ ██      ██ 
███████ ███████ ██   ██  ██████   ██████  ███████      ██████  ██           ██████   ██████  ██   ██ ██   ██ ██████  ██ ██   ██ ██   ████ ███████ 
///////
////////                                                             
/////////
//////////
///////////
////////////
//////////////
///////////////
////////////////
/////////////////
//////////////////
///////////////////
////////////////////
*/
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "erc721a/contracts/extensions/ERC721AQueryable.sol";

contract MintingNftCitayem is ERC721A, ERC2981, Ownable, ReentrancyGuard {

    using Strings for uint256;

    string public uriPrefix = "";
    string public hiddenMetadataUri;

    bytes32 public merkleRoot;
    mapping(address => bool) public whitelistClaimed;

    uint256 public cost;
    uint256 public maxMintAmountPerTx;

    uint256 public maxSupply;
    uint256 public constant MAX_SUPPLY_GIFT = 10;
    uint256 public constant MAX_SUPPLY_PRE_SALE = 40;
    uint256 public constant MAX_SUPPLY_PUBLIC_SALE = 50;

    bool public refundEndTime = false;
    mapping(uint256 => bool) private hashRefund;

    bool public paused = true;
    bool public revealed = false;
    bool public whitelistMintEnable = false;

    uint256 public giftMinted = 0;
    uint256 public preSaleMinted = 0;
    uint256 public publicSaleMinted = 0;

    address private constant WALLET_A = 0x69a31266321e78670F1Ea24CA57c772259C679ad;
    address private constant WALLET_B = 0xB940062cf4afb9068623F23d974E02268015186a;
    address private constant WALLET_C = 0xfa1656f6785718BaE8A8790DBd91433Cd566dF8f;

    constructor(
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _cost,
        uint256 _maxSupply,
        uint256 _maxMintAmountPerTx,
        string memory _hiddenMetadataUri
    ) ERC721A(_tokenName, _tokenSymbol) {
        setCost(_cost);
        maxSupply = _maxSupply;
        setMaxMintAmountPerTx(_maxMintAmountPerTx);
        setHiddenMetadataUri(_hiddenMetadataUri);
        _setDefaultRoyalty(0x0fBBc1c4830128BEFCeAff715a8B6d4bCdcaFd18, 500); 
    }

    modifier mintCompliance(uint _mintAmount) {
        require(_mintAmount > 0 && _mintAmount <= maxMintAmountPerTx, "Invalid mint amount!");
        require(totalSupply() <= maxSupply, "Max supply exceeded!");
        _;
    }

    modifier mintPriceCompliance(uint256 _mintAmount) {
        require(msg.value >= cost * _mintAmount, "Insufficient funds");
        _;
    }

    //
    // Verification whitelist
    //
    function _leafe(address _minter) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(_minter));
    }

    function _isWhitelisted(address _minter, bytes32[] calldata _merkleProof, bytes32 _merkleRoot) private pure returns (bool) {
        return MerkleProof.verify(_merkleProof, _merkleRoot, _leafe(_minter));
    }

    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }

    // 
    // minting
    //
    function preSaleMint(uint256 _mintAmount, bytes32[] calldata _merkleProof) public payable nonReentrant mintCompliance(_mintAmount) mintPriceCompliance(_mintAmount) {
        require(whitelistMintEnable, "Whitelist sale is not enabled!");

        require(_isWhitelisted(msg.sender, _merkleProof, merkleRoot), "Invalid proof");
        require(!whitelistClaimed[_msgSender()], "Address already claimed");
        
        require(preSaleMinted + _mintAmount <= MAX_SUPPLY_PRE_SALE, "Max pre-sale supply exceeded!");

        whitelistClaimed[_msgSender()] = true;
        preSaleMinted += _mintAmount;

        _safeMint(_msgSender(), _mintAmount);
    }

    function publicMint(uint256 _mintAmount) public payable nonReentrant mintCompliance(_mintAmount) mintPriceCompliance(_mintAmount) {
        require(!paused, "The contract is paused!");
        require(publicSaleMinted + _mintAmount <= MAX_SUPPLY_PUBLIC_SALE, "Max public sale supply exceeded!");

        publicSaleMinted += _mintAmount;
        _safeMint(_msgSender(), _mintAmount);
    }

    function giftMint(uint256[] calldata _mintAmount, address[] calldata _receiver) public nonReentrant onlyOwner {
        for(uint256 i; i < _receiver.length; i++) {
            require(giftMinted + _mintAmount[i] <= MAX_SUPPLY_GIFT, "Max gift supply exceeded!");

            giftMinted += _mintAmount[i];
            _safeMint(_receiver[i], _mintAmount[i]);
        }
    }

    //
    // Refund feature
    //
    function setOpenForRefund(bool _refundEndTime) external onlyOwner {
        require(whitelistMintEnable, "Only for whitelist sale!");
        refundEndTime = _refundEndTime;
    }

    function refund(uint256[] calldata tokenIds) external nonReentrant {
        require(refundEndTime && paused, "Refund expired");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(msg.sender == ownerOf(tokenId), "Not token owner");
            require(!hashRefund[tokenId], "Already refunded");
            hashRefund[tokenId] = true;
            transferFrom(msg.sender, owner(), tokenId);
        }

        uint256 refundAmount = tokenIds.length * cost;
        sendValue(payable(msg.sender), refundAmount);
    }

    //
    // Withdraw feature
    //
    function withdraw() external onlyOwner nonReentrant {
        require(!refundEndTime && !whitelistMintEnable, "Not in the right time");
        require(address(this).balance > 0, "Failed: no funds to withdraw");
        uint256 walletBalanceA = address(this).balance * 50 / 100;
        uint256 walletBalanceB = address(this).balance * 30 / 100;
        uint256 walletBalanceC = address(this).balance * 20 / 100;

        sendValue(payable(WALLET_A), walletBalanceA);
        sendValue(payable(WALLET_B), walletBalanceB);
        sendValue(payable(WALLET_C), walletBalanceC);
    }

    function sendValue(address payable _to, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        (bool success, ) = _to.call{value: amount}("");
        require(success, "Address: failed to send value");
    }

    // 
    // Metadata to Opensea
    //
    function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
        require(_exists(_tokenId), "URI query for nonexistent token");
        if (revealed == false) {
            return hiddenMetadataUri;
        }
        string memory currentBaseURI = _baseURI();
        return bytes(currentBaseURI).length > 0
            ? string(abi.encodePacked(currentBaseURI, _tokenId.toString(), ".json"))
            : "";
    }

    function setHiddenMetadataUri(string memory _hiddenMetadataUri) public onlyOwner {
        hiddenMetadataUri = _hiddenMetadataUri;
    }

    function setUriPrefix(string memory _uriPrefix) public onlyOwner {
        uriPrefix = _uriPrefix;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return uriPrefix;
    }

    //
    // Set up to reveal the NFT
    //
    function setRevealed(bool _state) public onlyOwner {
        revealed = _state;
    }

    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }

    function setMaxMintAmountPerTx(uint256 _maxMintAmountPerTx) public onlyOwner {
        maxMintAmountPerTx = _maxMintAmountPerTx;
    }

    function setCost(uint256 _cost) public onlyOwner {
        cost = _cost;
    }

    //
    // Pause/unpause the contract
    //
    function setPaused(bool _state) public onlyOwner {
        paused = _state;
    }

    function setWhitelistMintEnabled(bool _state) public onlyOwner {
        whitelistMintEnable = _state;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721A, ERC2981) returns (bool) {
        // IERC165: 0x01ffc9a7, IERC721: 0x80ac58cd, IERC721Metadata: 0x5b5e139f, IERC29081: 0x2a55205a
        return ERC721A.supportsInterface(interfaceId) || ERC2981.supportsInterface(interfaceId);
    }

}