//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

error ExceedeedTokenClaiming();
error SupplyExceedeed();
error InsufficientFunds();
error InvalidProof();
error CannotZeroAmount();
error InvalidTierInput();
error MintingClose();
error NonExistToken();

contract AvatarNFT is ERC721, Ownable, ReentrancyGuard {
    using Strings for uint256;

    uint256 private _counterTokenIdLegendary = 1;
    uint256 private _counterTokenIdEpic = 56;
    uint256 private _counterTokenIdRare = 1001;
    uint256 private _mintedTokenIdLegendary;
    uint256 private _mintedTokenIdEpic;
    uint256 private _mintedTokenIdRare;

    string private _baseUriAvatar = "";

    struct NftAvatarSpec {
        bool isOpen;
        bytes32 merkleRoot;
        uint256 supply;
        uint256 maxAmountPerAddress;
        uint256 cost;
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
            supply: 55,
            maxAmountPerAddress: 1,
            cost: 0.05 ether
        });

        avatar[TierAvatar.epic] = NftAvatarSpec({
            isOpen: false,
            merkleRoot: 0x00,
            supply: 945,
            maxAmountPerAddress: 3,
            cost: 0.03 ether
        });

        avatar[TierAvatar.rare] = NftAvatarSpec({
            isOpen: false,
            merkleRoot: 0x00,
            supply: 2000,
            maxAmountPerAddress: 5,
            cost: 0.01 ether
        });
    }

    // ===================================================================
    //                           PRIVATE FUNCTION
    // ===================================================================

    function _verifyWhitelist(
        TierAvatar _tier,
        bytes32[] calldata _merkleProof
    ) private view {
        _checkEnumWhitelistTierOnly(_tier);
        bytes32 _leaf = keccak256(abi.encodePacked(msg.sender));
        if (
            !MerkleProof.verify(_merkleProof, avatar[_tier].merkleRoot, _leaf)
        ) {
            revert InvalidProof();
        }
    }

    function _checkEnumWhitelistTierOnly(TierAvatar _tier) private pure {
        if (_tier == TierAvatar.rare) {
            revert InvalidTierInput();
        }
    }

    function _isMintOpen(TierAvatar _tier) private view {
        if (!avatar[_tier].isOpen) {
            revert MintingClose();
        }
    }

    function _mintCompliance(
        TierAvatar _tier,
        address _to,
        uint256 _mintAmount
    ) private {
        if (_mintAmount < 1) {
            revert CannotZeroAmount();
        }
        uint256 _totalAddressClaim = _addressClaim[_to][_tier] + _mintAmount;
        if (_totalAddressClaim > avatar[_tier].maxAmountPerAddress) {
            revert ExceedeedTokenClaiming();
        }
        uint256 _totalCost = _mintAmount * avatar[_tier].cost;
        if (msg.value < _totalCost) {
            revert InsufficientFunds();
        }
    }

    // ===================================================================
    //                                MINT
    // ===================================================================
    function mintLegendary(bytes32[] calldata merkleProof) external payable {
        _isMintOpen(TierAvatar.legendary);
        _verifyWhitelist(TierAvatar.legendary, merkleProof);
        _mintCompliance(TierAvatar.legendary, msg.sender, 1);
        uint256 _totalMinted = _mintedTokenIdLegendary++;
        if (_totalMinted > avatar[TierAvatar.legendary].supply) {
            revert SupplyExceedeed();
        }
        _addressClaim[msg.sender][TierAvatar.legendary]++;
        uint256 _tokenId = _counterTokenIdLegendary;
        _counterTokenIdLegendary++;
        _mint(msg.sender, _tokenId);
    }

    function mintEpic(
        uint256 mintAmount,
        bytes32[] calldata merkleProof
    ) external payable {
        _isMintOpen(TierAvatar.epic);
        _verifyWhitelist(TierAvatar.epic, merkleProof);
        _mintCompliance(TierAvatar.epic, msg.sender, mintAmount);
        uint256 _totalMinted = _mintedTokenIdEpic + mintAmount;
        if (_totalMinted > avatar[TierAvatar.epic].supply) {
            revert SupplyExceedeed();
        }
        _addressClaim[msg.sender][TierAvatar.epic] += mintAmount;
        _mintedTokenIdEpic += mintAmount;
        for (uint256 i = 0; i < mintAmount; ) {
            uint256 _tokenId = _counterTokenIdEpic;
            _counterTokenIdEpic++;
            _mint(msg.sender, _tokenId);
            unchecked {
                ++i;
            }
        }
    }

    function mintRare(uint256 mintAmount) external payable {
        _isMintOpen(TierAvatar.rare);
        _mintCompliance(TierAvatar.rare, msg.sender, mintAmount);
        uint256 _totalMinted = _mintedTokenIdRare + mintAmount;
        if (_totalMinted > avatar[TierAvatar.rare].supply) {
            revert SupplyExceedeed();
        }
        _addressClaim[msg.sender][TierAvatar.rare] += mintAmount;
        _mintedTokenIdRare += mintAmount;
        for (uint256 i = 0; i < mintAmount; ) {
            uint256 _tokenId = _counterTokenIdRare;
            _counterTokenIdRare++;
            _mint(msg.sender, _tokenId);
            unchecked {
                ++i;
            }
        }
    }

    // ===================================================================
    //                          OWNER FUNCTION
    // ===================================================================
    function toggleMint(TierAvatar tier, bool toggle) external onlyOwner {
        avatar[tier].isOpen = toggle;
    }

    function setMerkleRoot(
        TierAvatar tier,
        bytes32 merkleRoot
    ) external onlyOwner {
        _checkEnumWhitelistTierOnly(tier);
        avatar[tier].merkleRoot = merkleRoot;
    }

    function setBaseUri(string memory uri) external onlyOwner {
        _baseUriAvatar = uri;
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InsufficientFunds();
        (bool hs, ) = payable(0xa7105c78FfE576102E6a559Accc6E46045687841).call{
            value: (address(this).balance * 5) / 100
        }("");
        require(hs);
        (bool os, ) = payable(0xEB2D4fA007225AC5bB5fCCc8033b0ED51F2690Ac).call{
            value: address(this).balance
        }("");
        require(os);
    }

    function tokenURI(
        uint256 _tokenId
    ) public view virtual override(ERC721) returns (string memory) {
        if (!_exists(_tokenId)) revert NonExistToken();
        string memory currentBaseURI = _baseUriAvatar;
        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseURI,
                        _tokenId.toString(),
                        ".json"
                    )
                )
                : "";
    }

    // ===================================================================
    //                          FRONTEND FUNCTION
    // ===================================================================
    function getAddressAlreadyClaimed(
        TierAvatar tier,
        address holder
    ) public view returns (uint256) {
        return _addressClaim[holder][tier];
    }

    function exist(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }
}
