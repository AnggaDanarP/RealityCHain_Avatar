//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./InterfaceAvatar.sol";

contract TestRealityChainAvatar is ERC721Enumerable, Ownable, ReentrancyGuard {
    bool private _revealed = false;
    string private _hiddenMetadata = "";
    string private _baseUri = "";

    mapping(InterfaceAvatar.TierAvatar => InterfaceAvatar.NftAvatarSpec)public avatar;
    mapping(address => mapping(InterfaceAvatar.TierAvatar => uint256))private _addressClaim;

    constructor(
        string memory hiddenMetadata_
    ) ERC721("Test Avatar NFT", "TAN") {
        _hiddenMetadata = hiddenMetadata_;
        avatar[InterfaceAvatar.TierAvatar.legendary] = InterfaceAvatar
            .NftAvatarSpec({
                isOpen: false,
                merkleRoot: 0x00,
                supply: 55,
                maxTokenId: 55,
                startTokenId: 1,
                maxAmountPerAddress: 1,
                cost: 0.05 ether,
                tokenIdCounter: 0
            });

        avatar[InterfaceAvatar.TierAvatar.epic] = InterfaceAvatar
            .NftAvatarSpec({
                isOpen: false,
                merkleRoot: 0x00,
                supply: 945,
                maxTokenId: 1000,
                startTokenId: 56,
                maxAmountPerAddress: 3,
                cost: 0.03 ether,
                tokenIdCounter: 0
            });

        avatar[InterfaceAvatar.TierAvatar.rare] = InterfaceAvatar
            .NftAvatarSpec({
                isOpen: false,
                merkleRoot: 0x00,
                supply: 2000,
                maxTokenId: 3000,
                startTokenId: 1001,
                maxAmountPerAddress: 5,
                cost: 0.01 ether,
                tokenIdCounter: 0
            });
    }

    // ===================================================================
    //                           PRIVATE FUNCTION
    // ===================================================================

    function _verifyWhitelist(
        InterfaceAvatar.TierAvatar _tier,
        bytes32[] calldata _merkleProof
    ) private view {
        _checkEnumWhitelistTierOnly(_tier);
        bytes32 _leaf = keccak256(abi.encodePacked(_msgSender()));
        if (
            !MerkleProof.verify(_merkleProof, avatar[_tier].merkleRoot, _leaf)
        ) {
            revert InterfaceAvatar.InvalidProof();
        }
    }

    function _checkEnumWhitelistTierOnly(
        InterfaceAvatar.TierAvatar _tier
    ) private pure {
        if (_tier == InterfaceAvatar.TierAvatar.rare) {
            revert InterfaceAvatar.InvalidTierInput();
        }
    }

    function _isMintOpen(InterfaceAvatar.TierAvatar _tier) private view {
        if (!avatar[_tier].isOpen) {
            revert InterfaceAvatar.MintingClose();
        }
    }

    function _mintWrap(
        InterfaceAvatar.TierAvatar _tier,
        uint256 _mintAmount
    ) private {
        if (_mintAmount < 1) {
            revert InterfaceAvatar.CannotZeroAmount();
        }
        uint256 _totalAddressClaim = _addressClaim[_msgSender()][_tier] + _mintAmount;
        if (_totalAddressClaim > avatar[_tier].maxAmountPerAddress) {
            revert InterfaceAvatar.ExceedeedTokenClaiming();
        }
        uint256 _totalCost = _mintAmount * avatar[_tier].cost;
        if (msg.value < _totalCost) {
            revert InterfaceAvatar.InsufficientFunds();
        }
        uint256 _totalMinted = avatar[_tier].tokenIdCounter + _mintAmount;
        if (_totalMinted > avatar[_tier].supply) {
            revert InterfaceAvatar.SupplyExceedeed();
        }
        _addressClaim[_msgSender()][_tier] += _mintAmount;
        for (uint256 i = 0; i < _mintAmount; ) {
            uint256 _tokenId;
            unchecked {
                _tokenId = avatar[_tier].tokenIdCounter + avatar[_tier].startTokenId;
                avatar[_tier].tokenIdCounter++;
            }
            _mint(_msgSender(), _tokenId);
            unchecked {
                ++i;
            }
        }
    }

    // ===================================================================
    //                                MINT
    // ===================================================================
    function mintLegendary(
        uint256 mintAmount,
        bytes32[] calldata merkleProof
    )
        external
        payable
    {
        _isMintOpen(InterfaceAvatar.TierAvatar.legendary);
        _verifyWhitelist(InterfaceAvatar.TierAvatar.legendary, merkleProof);
        _mintWrap(InterfaceAvatar.TierAvatar.legendary, mintAmount);
    }

    function mintEpic(
        uint256 mintAmount,
        bytes32[] calldata merkleProof
    ) external payable {
        _isMintOpen(InterfaceAvatar.TierAvatar.epic);
        _verifyWhitelist(InterfaceAvatar.TierAvatar.epic, merkleProof);
        _mintWrap(InterfaceAvatar.TierAvatar.epic, mintAmount);
    }

    function mintRare(uint256 mintAmount) external payable {
        _isMintOpen(InterfaceAvatar.TierAvatar.rare);
        _mintWrap(InterfaceAvatar.TierAvatar.rare, mintAmount);
    }

    // ===================================================================
    //                          OWNER FUNCTION
    // ===================================================================
    function toggleMint(InterfaceAvatar.TierAvatar tier, bool toggle) external onlyOwner {
        avatar[tier].isOpen = toggle;
    }

    function setMerkleRoot(
        InterfaceAvatar.TierAvatar tier,
        bytes32 merkleRoot
    ) external onlyOwner {
        _checkEnumWhitelistTierOnly(tier);
        avatar[tier].merkleRoot = merkleRoot;
    }

    function setHiddenMetadata(string memory uri) external onlyOwner {
        _hiddenMetadata = uri;
    }

    function setReveal(bool toggle) external onlyOwner {
        _revealed = toggle;
    }

    function setBaseUri(string memory uri) external onlyOwner {
        _baseUri = uri;
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InterfaceAvatar.InsufficientFunds();
        (bool hs, ) = payable(owner()).call{
            value: (address(this).balance * 5) / 100
        }("");
        require(hs);
        (bool os, ) = payable(0xEB2D4fA007225AC5bB5fCCc8033b0ED51F2690Ac).call{
            value: address(this).balance
        }("");
        require(os);
    }

    // ===================================================================
    //                          METADATA FUNCTION
    // ===================================================================
    function _getBaseUri() private view returns (string memory) {
        return _baseUri;
    }

    function tokenURI(
        uint256 _tokenId
    ) public view virtual override(ERC721) returns (string memory) {
        if (!_exists(_tokenId)) revert InterfaceAvatar.TokenNotExist();
        if (!_revealed) return _hiddenMetadata;
        string memory currentBaseURI = _getBaseUri();
        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseURI,
                        Strings.toString(_tokenId),
                        ".json"
                    )
                )
                : "";
    }

    // ===================================================================
    //                          FRONTEND FUNCTION
    // ===================================================================
    function getAddressAlreadyClaimed(
        InterfaceAvatar.TierAvatar tier,
        address holder
    ) public view returns (uint256) {
        return _addressClaim[holder][tier];
    }

    function exist(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function ownerOf(
        uint256 tokenId
    ) public view override(ERC721, IERC721) returns (address) {
        ownerOf(tokenId);
    }
}
