//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error ExceedeedTokenClaiming();
error SupplyExceedeed();
error InsufficientFunds();
error InvalidProof();
error InvalidTierInput();
error MintingClose();
error InvalidMintAmount();

contract TestRealityChainAvatar is ERC721URIStorage, Ownable, ReentrancyGuard {
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
    //                              MODIFIER
    // ===================================================================
    modifier verifyWhitelist(
        TierAvatar _tier,
        bytes32[] calldata _merkleProof
    ) {
        isMintingTierOpen(_tier);
        bytes32 _leaf = keccak256(abi.encodePacked(_msgSender()));
        bytes32 _merkleRoot = avatar[_tier].merkleRoot;
        if (!MerkleProof.verify(_merkleProof, _merkleRoot, _leaf)) {
            revert InvalidProof();
        }
        _;
    }

    modifier mintCompliance(TierAvatar _tier, uint256 _mintAmount) {
        if (_mintAmount < 1) {
            revert InvalidMintAmount();
        }
        uint256 _addressClaimed = _addressClaim[_msgSender()][_tier];
        uint256 _maxAmountPerAddress = avatar[_tier].maxAmountPerAddress;
        if (_addressClaimed + _mintAmount > _maxAmountPerAddress) {
            revert ExceedeedTokenClaiming();
        }
        uint256 _costTier = avatar[_tier].cost;
        if (msg.value < _mintAmount * _costTier) {
            revert InsufficientFunds();
        }
        uint256 _alreadyMinted = avatar[_tier].minted;
        uint256 _supplyPhase = avatar[_tier].supply;
        if (_alreadyMinted > _supplyPhase) {
            revert SupplyExceedeed();
        }
        _addressClaim[_msgSender()][_tier] += _mintAmount;
        avatar[_tier].minted += _mintAmount;
        _;
    }

    // ===================================================================
    //                           PRIVATE FUNCTION
    // ===================================================================
    function totalMinted() private view returns (uint256) {
        uint256 _legendaryMinted = avatar[TierAvatar.legendary].minted;
        uint256 _epicMinted = avatar[TierAvatar.epic].minted;
        uint256 _rareMinted = avatar[TierAvatar.rare].minted;
        return (_legendaryMinted + _epicMinted + _rareMinted) - 3;
    }

    function isMintingTierOpen(TierAvatar _tier) private view {
        if (!avatar[_tier].isOpen) {
            revert MintingClose();
        }
    }

    function mint(
        TierAvatar tier,
        uint256 mintAmount
    ) private mintCompliance(tier, mintAmount) {
        uint256 _tokenId = totalMinted();
        _safeMint(_msgSender(), _tokenId);
    }

    // ===================================================================
    //                                MINT
    // ===================================================================
    function mintLegendary(
        uint256 mintAmount,
        bytes32[] calldata merkleProof
    ) external payable verifyWhitelist(TierAvatar.legendary, merkleProof) {
        mint(TierAvatar.legendary, mintAmount);
    }

    function mintEpic(
        uint256 mintAmount,
        bytes32[] calldata merkleProof
    ) external payable verifyWhitelist(TierAvatar.epic, merkleProof) {
        mint(TierAvatar.epic, mintAmount);
    }

    function mintRare(uint256 mintAmount) external payable {
        isMintingTierOpen(TierAvatar.rare);
        mint(TierAvatar.epic, mintAmount);
    }

    // ===================================================================
    //                          OWNER FUNCTION
    // ===================================================================
    function setMerkleRoot(
        TierAvatar tier,
        bytes32 merkleRoot
    ) external onlyOwner {
        if (tier == TierAvatar.rare) {
            revert InvalidTierInput();
        }
        avatar[tier].merkleRoot = merkleRoot;
    }

    function toggleMintTier(TierAvatar tier, bool toggle) external {
        avatar[tier].isOpen = toggle;
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
        address logHolder,
        TierAvatar tier
    ) external view returns (uint256) {
        return _addressClaim[logHolder][tier];
    }

    function totalSupply() public view returns (uint256) {
        return totalMinted();
    }
}
