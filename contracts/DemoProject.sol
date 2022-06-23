/**
SPDX-License-Identifier: MIT
////////////////////////////
//////////////////////////
////////////////////////
//////////////////////
////////////////////
//////////////////
////////////////
//////////////
////////////
//////////
////////
//////
////
 ▄█          ▄████████    ▄████████    ▄██████▄  ███    █▄     ▄████████       ▄██████▄     ▄████████         ▄██████▄  ███    █▄     ▄████████    ▄████████ ████████▄   ▄█     ▄████████ ███▄▄▄▄      ▄████████      
███         ███    ███   ███    ███   ███    ███ ███    ███   ███    ███      ███    ███   ███    ███        ███    ███ ███    ███   ███    ███   ███    ███ ███   ▀███ ███    ███    ███ ███▀▀▀██▄   ███    ███      
███         ███    █▀    ███    ███   ███    █▀  ███    ███   ███    █▀       ███    ███   ███    █▀         ███    █▀  ███    ███   ███    ███   ███    ███ ███    ███ ███▌   ███    ███ ███   ███   ███    █▀       
███        ▄███▄▄▄       ███    ███  ▄███        ███    ███  ▄███▄▄▄          ███    ███  ▄███▄▄▄           ▄███        ███    ███   ███    ███  ▄███▄▄▄▄██▀ ███    ███ ███▌   ███    ███ ███   ███   ███             
███       ▀▀███▀▀▀     ▀███████████ ▀▀███ ████▄  ███    ███ ▀▀███▀▀▀          ███    ███ ▀▀███▀▀▀          ▀▀███ ████▄  ███    ███ ▀███████████ ▀▀███▀▀▀▀▀   ███    ███ ███▌ ▀███████████ ███   ███ ▀███████████      
███         ███    █▄    ███    ███   ███    ███ ███    ███   ███    █▄       ███    ███   ███               ███    ███ ███    ███   ███    ███ ▀███████████ ███    ███ ███    ███    ███ ███   ███          ███      
███▌    ▄   ███    ███   ███    ███   ███    ███ ███    ███   ███    ███      ███    ███   ███               ███    ███ ███    ███   ███    ███   ███    ███ ███   ▄███ ███    ███    ███ ███   ███    ▄█    ███      
█████▄▄██   ██████████   ███    █▀    ████████▀  ████████▀    ██████████       ▀██████▀    ███               ████████▀  ████████▀    ███    █▀    ███    ███ ████████▀  █▀     ███    █▀   ▀█   █▀   ▄████████▀       
▀                                                                                                                                                 ███    ███                                                          
//////////
///////////                                                             
////////////
/////////////
//////////////
///////////////
/////////////////
//////////////////
///////////////////
////////////////////
/////////////////////
//////////////////////
///////////////////////
*/
pragma solidity ^0.8.0;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// import "contract-libs/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
// import "contract-libs/@rarible/royalties/contracts/LibPart.sol";
// import "contract-libs/@rarible/royalties/contracts/RoyaltiesV2.sol";

contract DemoProject is ERC721A, Ownable, ReentrancyGuard {

    using Strings for uint256;

    bytes32 public merkleRoot;
    mapping(address => bool) public whitelistClaimed;

    string public uriPrefix = "";
    string public constant URI_SUFFIX = ".json";
    string public hiddenMetadataUri;

    uint256 public cost;
    uint256 public maxMintAmountPerTx;

    uint256 public constant MAX_SUPPLY = 100;
    uint256 public constant MAX_SUPPLY_GIFT = 10;
    uint256 public constant MAX_SUPPLY_PRE_SALE = 40;
    uint256 public constant MAX_SUPPLY_PUBLIC_SALE = MAX_SUPPLY - (MAX_SUPPLY_GIFT + MAX_SUPPLY_PRE_SALE);

    bool public paused = true;
    bool public whitelistMintEnable = false;
    bool public revealed = false;

    uint256 private constant REFUND_PERIOED = 2 days;
    uint256 private refundEndTime;
    mapping(uint256 => bool) public hashRefund;

    uint256 private giftMinted = 0;
    uint256 private preSaleMinted = 0;
    uint256 private publicSaleMinted = 0;

    //bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    constructor(
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _cost,
        uint256 _maxMintAmountPerTx,
        string memory _hiddenMetadataUri
    ) ERC721A(_tokenName, _tokenSymbol) {
        setCost(_cost);
        setMaxMintAmountPerTx(_maxMintAmountPerTx);
        setHiddenMetadataUri(_hiddenMetadataUri);
    }

    modifier mintCompliance(uint _mintAmount) {
        require(_mintAmount > 0 && _mintAmount <= maxMintAmountPerTx, "Invalid mint amount!");
        require(totalSupply() <= MAX_SUPPLY, "Max supply exceeded!");
        _;
    }

    modifier mintPriceCompliance(uint256 _mintAmount) {
        require(msg.value >= cost * _mintAmount, "Insufficient funds");
        _;
    }

    // 
    // Refund the user for a token batch
    //
   
    function refund(uint256[] calldata tokenIds) external {
        require(isRefundActive(), "Refund expired");

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
    // Verification whitelist minting
    //
    function _leafe(address _minter) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(_minter));
    }

    function _isWhitelisted(address _minter, bytes32[] calldata _merkleProof, bytes32 _merkleRoot) private pure returns (bool) {
        return MerkleProof.verify(_merkleProof, _merkleRoot, _leafe(_minter));
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

    function walletOfOwner(address _owner) public view returns(uint[] memory) {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory ownedTokenIds = new uint256[](ownerTokenCount);
        uint256 currentTokenId = _startTokenId();
        uint256 ownedTokenIndex = 0;
        address latestOwnerAddress;

        while (ownedTokenIndex < ownerTokenCount && currentTokenId < _currentIndex) {
            TokenOwnership memory ownership = _ownerships[currentTokenId];
            if (!ownership.burned) {
                if (ownership.addr != address(0)) {
                    latestOwnerAddress = ownership.addr;
                }
                if (latestOwnerAddress == _owner) {
                    ownedTokenIds[ownedTokenIndex] = currentTokenId;     
                    ownedTokenIndex++;
                }
            }
            currentTokenId++;
        }
        return ownedTokenIds;
    }

    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }

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

    function withdrawFunds() external onlyOwner nonReentrant {
        require(block.timestamp > refundEndTime, "Refund period has not ended yet");
        require(address(this).balance > 0, "Failed: no funds to withdraw");
        payable(msg.sender).transfer(address(this).balance);
    }

    function toggleRefundCountdown() public onlyOwner {
        refundEndTime = block.timestamp + REFUND_PERIOED;
    }

    function isRefundActive() public view returns (bool) {
        return (block.timestamp <= refundEndTime);
    }

    function setRevealed(bool _state) public onlyOwner {
        revealed = _state;
    }

    function setCost(uint256 _cost) public onlyOwner {
        cost = _cost;
    }

    function setMaxMintAmountPerTx(uint256 _maxMintAmountPerTx) public onlyOwner {
        maxMintAmountPerTx = _maxMintAmountPerTx;
    }

    function setHiddenMetadataUri(string memory _hiddenMetadataUri) public onlyOwner {
        hiddenMetadataUri = _hiddenMetadataUri;
    }

    function setUriPrefix(string memory _uriPrefix) public onlyOwner {
        uriPrefix = _uriPrefix;
    }

    //function setUriSuffix(string memory _uriSuffix) public onlyOwner {
    //    uriSuffix = _uriSuffix;
    //}

    function setPaused(bool _state) public onlyOwner {
        paused = _state;
    }

    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function setWhitelistMintEnabled(bool _state) public onlyOwner {
        whitelistMintEnable = _state;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return uriPrefix;
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