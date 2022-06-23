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
import "../contract-libs/Withdrawable.sol";
// import "contract-libs/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
// import "contract-libs/@rarible/royalties/contracts/LibPart.sol";
// import "contract-libs/@rarible/royalties/contracts/RoyaltiesV2.sol";

contract DemoProject is ERC721A, Ownable, ReentrancyGuard, Withdrawable {

    using Strings for uint256;

    bytes32 public merkleRoot;
    mapping(address => bool) public whitelistClaimed;

    string public uriPrefix = "";
    string public uriSuffix = ".json";
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

    uint256 private giftMinted = 0;
    uint256 private preSaleMinted = 0;
    uint256 private publicSaleMinted = 0;

    //bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    struct TokenBatchRefund {
        uint256 price;
        uint256 qtyMinted;
    }
    mapping(address => TokenBatchRefund[]) public userTokenBtachRefund;

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

    // Refund the user for a token batch
    function _claimRefund() external {
        require(whitelistMintEnable, "Refund time is passed");

        uint256 totalRefund = _totaltReturn(msg.sender);
        require(address(this).balance >= (totalRefund), "Insufficient funds");

        removeListRefund(msg.sender);
        payable(msg.sender).transfer(totalRefund);
    }

    function _totaltReturn(address buyer) private view returns (uint256) {
        uint256 _price = 0;
        uint256 _qtyMinted = 0;

        TokenBatchRefund[] storage histories = userTokenBtachRefund[buyer];

        for (uint256 i = 0; i < histories.length; i++) {
            _price = histories[i].price;
            _qtyMinted = histories[i].qtyMinted;
        }

        return  _price * _qtyMinted;
    }

    function removeListRefund(address _buyer) private {
        TokenBatchRefund[] storage histories = userTokenBtachRefund[_buyer];

        for (uint256 i = 0; i < histories.length; i++) {
            histories.pop();
        }
    }

    function _leafe(address _minter) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(_minter));
    }

    function _isWhitelisted(address _minter, bytes32[] calldata _merkleProof, bytes32 _merkleRoot) private pure returns (bool) {
        return MerkleProof.verify(_merkleProof, _merkleRoot, _leafe(_minter));
    }

    function preSaleMint(uint256 _mintAmount, bytes32[] calldata _merkleProof) public payable nonReentrant mintCompliance(_mintAmount) mintPriceCompliance(_mintAmount) {
        require(whitelistMintEnable, "Whitelist sale is not enabled!");

        require(_isWhitelisted(msg.sender, _merkleProof, merkleRoot), "Invalid proof");
        require(!whitelistClaimed[_msgSender()], "Address already claimed");
        
        require(preSaleMinted + _mintAmount <= MAX_SUPPLY_PRE_SALE, "Max pre-sale supply exceeded!");

        whitelistClaimed[_msgSender()] = true;
        preSaleMinted += _mintAmount;

        TokenBatchRefund[] storage histories = userTokenBtachRefund[msg.sender];
        histories.push(TokenBatchRefund(cost, _mintAmount));

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
            ? string(abi.encodePacked(currentBaseURI, _tokenId.toString(), uriSuffix))
            : "";
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

    function setUriSuffix(string memory _uriSuffix) public onlyOwner {
        uriSuffix = _uriSuffix;
    }

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