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
import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// import "contract-libs/Cost.sol";
// import "contract-libs/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
// import "contract-libs/@rarible/royalties/contracts/RoyaltiesV2.sol";
// import "contract-libs/@rarible/royalties/contracts/LibPart.sol";

contract GagalMintingNFT is ERC721AQueryable, Ownable, ReentrancyGuard {

    using Strings for uint256;

    string public uriPrefix = "";
    string public hiddenMetadataUri;
    string public constant URI_SUFFIX = ".json";

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

    //bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

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

    function giftMint(uint256 _mintAmount, address _receiver) public nonReentrant onlyOwner mintCompliance(_mintAmount) {
        require(giftMinted + _mintAmount <= MAX_SUPPLY_GIFT, "Max gift supply exceeded!");

        giftMinted += _mintAmount;
        _safeMint(_receiver, _mintAmount);
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
        Address.sendValue(payable(msg.sender), refundAmount);
    }

    //
    // Withdraw feature
    //
    function withdraw() external onlyOwner nonReentrant {
        require(!refundEndTime && !whitelistMintEnable, "Not in the right time");
        require(address(this).balance > 0, "Failed: no funds to withdraw");
        payable(msg.sender).transfer(address(this).balance);
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
            ? string(abi.encodePacked(currentBaseURI, _tokenId.toString(), URI_SUFFIX))
            : "";
    }

    function setHiddenMetadataUri(string memory _hiddenMetadataUri) public onlyOwner {
        hiddenMetadataUri = _hiddenMetadataUri;
    }

    function setUriPrefix(string memory _uriPrefix) public onlyOwner {
        uriPrefix = _uriPrefix;
    }

    // function setUriSuffix(string memory _uriSuffix) public onlyOwner {
    //    uriSuffix = _uriSuffix;
    // }

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


    //
    // Royalties
    // https://github.com/rarible/protocol-contracts/tree/master/royalties/contracts
    //

    // function setRoyalties(uint _tokenId, address payable _royaltiesRecipientAddress, uint96 _percentageBasisPoints) public onlyOwner {
    //     LibPart.Part[] memory _royalties = new LibPart.Part[](1);
    //     _royalties[0].value = _percentageBasisPoints;
    //     _royalties[0].account = _royaltiesRecipientAddress;
    //     _saveRoyalties(_tokenId, _royalties);
    // }


    // //configure royalties for Mintable using the ERC2981 standard
    // function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view returns (address receiver, uint256 royaltyAmount) {
    //   //use the same royalties that were saved for Rariable
    //   LibPart.Part[] memory _royalties = royalties[_tokenId];
    //   if(_royalties.length > 0) {
    //     return (_royalties[0].account, (_salePrice * _royalties[0].value) / 10000);
    //   }
    //   return (address(0), 0);
    // }


    // function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721A) returns (bool) {
    //     if(interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES) {
    //         return true;
    //     }

    //     if(interfaceId == _INTERFACE_ID_ERC2981) {
    //       return true;
    //     }

    //     return super.supportsInterface(interfaceId);
    // }

}