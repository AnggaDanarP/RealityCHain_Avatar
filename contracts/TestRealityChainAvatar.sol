//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error ExceedeedTokenClaiming();
error SupplyExceedeed();
error InsufficientFunds();
error InvalidProof();
error CannotZeroAmount();
error InvalidTierInput();
error MintingClose();
error TokenNotExist();

contract TestRealityChainAvatar is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounters;

    struct NftAvatarSpec {
        bool isOpen;
        bytes32 merkleRoot;
        uint256 supply;
        uint256 maxAmountPerAddress;
        uint256 cost;
        uint256 minted;
    }

    enum TierAvatar {
        legendary,
        epic,
        rare
    }

    mapping(TierAvatar => NftAvatarSpec) public avatar;
    mapping(address => mapping(TierAvatar => uint256)) private _addressClaim;
    mapping(TierAvatar => mapping(uint256 => bool)) private _tokenClaimAtTier;

    constructor(
        string memory _tokenName,
        string memory _tokenSymbol
    ) ERC721(_tokenName, _tokenSymbol) {
        avatar[TierAvatar.legendary] = NftAvatarSpec({
            isOpen: false,
            merkleRoot: 0x00,
            supply: 50,
            maxAmountPerAddress: 1,
            cost: 0.05 ether,
            minted: 1
        });

        avatar[TierAvatar.epic] = NftAvatarSpec({
            isOpen: false,
            merkleRoot: 0x00,
            supply: 950,
            maxAmountPerAddress: 3,
            cost: 0.03 ether,
            minted: 1
        });

        avatar[TierAvatar.rare] = NftAvatarSpec({
            isOpen: false,
            merkleRoot: 0x00,
            supply: 2000,
            maxAmountPerAddress: 5,
            cost: 0.01 ether,
            minted: 1
        });
    }

    // ===================================================================
    //                           PRIVATE FUNCTION
    // ===================================================================

    function verifyWhitelist(
        TierAvatar _tier,
        bytes32[] calldata _merkleProof
    ) private view {
        checkEnumWhitelistTierOnly(_tier);
        bytes32 _leaf = keccak256(abi.encodePacked(_msgSender()));
        if (
            !MerkleProof.verify(_merkleProof, avatar[_tier].merkleRoot, _leaf)
        ) {
            revert InvalidProof();
        }
    }

    function checkEnumWhitelistTierOnly(TierAvatar _tier) private pure {
        if (_tier == TierAvatar.rare) {
            revert InvalidTierInput();
        }
    }

    function isMintOpen(TierAvatar _tier) private view {
        if (!avatar[_tier].isOpen) {
            revert MintingClose();
        }
    }

    function _mintWrap(TierAvatar _tier, uint256 _mintAmount) private {
        isMintOpen(_tier);
        if (_mintAmount < 1) {
            revert CannotZeroAmount();
        }
        uint256 _totalAddressClaim = _addressClaim[_msgSender()][_tier] +
            _mintAmount;
        if (_totalAddressClaim > avatar[_tier].maxAmountPerAddress) {
            revert ExceedeedTokenClaiming();
        }
        uint256 _totalCost = _mintAmount * avatar[_tier].cost;
        if (msg.value < _totalCost) {
            revert InsufficientFunds();
        }
        uint256 _totalMinted = (avatar[_tier].minted - 1) + _mintAmount;
        if (_totalMinted > avatar[_tier].supply) {
            revert SupplyExceedeed();
        }
        _addressClaim[_msgSender()][_tier] += _mintAmount;
        avatar[_tier].minted += _mintAmount;
        for (uint256 i = 0; i < _mintAmount; ) {
            _tokenIdCounters++;
            uint256 _tokenId = _tokenIdCounters;
            _mint(_msgSender(), _tokenId);
            _tokenClaimAtTier[_tier][_tokenId] = true;
            unchecked {
                ++i;
            }
        }
    }

    // ===================================================================
    //                              MODIFIER
    // ===================================================================
    modifier whitelist(TierAvatar _tier, bytes32[] calldata _merkleProof) {
        isMintOpen(_tier);
        verifyWhitelist(_tier, _merkleProof);
        _;
    }

    // ===================================================================
    //                                MINT
    // ===================================================================
    function mintLegendary(
        uint256 mintAmount,
        bytes32[] calldata merkleProof
    ) external payable whitelist(TierAvatar.legendary, merkleProof) {
        _mintWrap(TierAvatar.legendary, mintAmount);
    }

    function mintEpic(
        uint256 mintAmount,
        bytes32[] calldata merkleProof
    ) external payable whitelist(TierAvatar.epic, merkleProof) {
        _mintWrap(TierAvatar.epic, mintAmount);
    }

    function mintRare(uint256 mintAmount) external payable {
        _mintWrap(TierAvatar.rare, mintAmount);
    }

    // ===================================================================
    //                          OWNER FUNCTION
    // ===================================================================
    function setTokenUri(uint256 tokenId, string memory tokenUri) external onlyOwner {
        _setTokenURI(tokenId, tokenUri);
    }

    function toggleMint(TierAvatar tier, bool toggle) external onlyOwner {
        avatar[tier].isOpen = toggle;
    }

    function setMerkleRoot(
        TierAvatar tier,
        bytes32 merkleRoot
    ) external onlyOwner {
        checkEnumWhitelistTierOnly(tier);
        avatar[tier].merkleRoot = merkleRoot;
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InsufficientFunds();
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
    //                          FRONTEND FUNCTION
    // ===================================================================
    function getAddressAlreadyClaimed(
        TierAvatar tier,
        address logHolder
    ) public view returns (uint256) {
        return _addressClaim[logHolder][tier];
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounters;
    }

    function verifyTokenClaimInTier(TierAvatar tier, uint256 tokenId) public view returns (bool) {
        if (!_exists(tokenId)) {
            revert TokenNotExist();
        }
        return _tokenClaimAtTier[tier][tokenId];
    }
}
