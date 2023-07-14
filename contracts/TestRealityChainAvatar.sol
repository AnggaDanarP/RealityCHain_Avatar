//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error ExceedeedTokenClaiming();
error SupplyExceedeed();
error InsufficientFunds();
error InvalidProof();

contract TestRealityChainAvatar is ERC721URIStorage, Ownable, ReentrancyGuard {

    struct NftAvatarSpec {
        bytes32 merkleRoot;
        uint256 supply;
        uint256 cost;
        uint256 minted;
    }

    enum TierAvatar {
        legendary,
        epic,
        rare
    }

    mapping(TierAvatar => NftAvatarSpec) public _avatar;
    mapping(address => bool) private _addressClaim;

    constructor(
        string memory _tokenName,
        string memory _tokenSymbol
    ) ERC721(_tokenName, _tokenSymbol) {
        _avatar[TierAvatar.legendary] = NftAvatarSpec({
            merkleRoot: 0x00,
            supply: 50,
            cost: 0.05 ether,
            minted: 1
        });

        _avatar[TierAvatar.epic] = NftAvatarSpec({
            merkleRoot: 0x00,
            supply: 950,
            cost: 0.03 ether,
            minted: 1
        });

        _avatar[TierAvatar.rare] = NftAvatarSpec({
            merkleRoot: 0x00,
            supply: 2000,
            cost: 0.01 ether,
            minted: 1
        });
    }

    // ===================================================================
    //                           PRIVATE FUNCTION
    // ===================================================================
    function _mintCompliance(
        TierAvatar _tier,
        address _holder,
        bytes32[] calldata _merkleProof
    ) private view {
        bytes32 _leaf = keccak256(abi.encodePacked(_msgSender()));
        bytes32 _merkleRoot = _avatar[_tier].merkleRoot;
        if (!MerkleProof.verify(_merkleProof, _merkleRoot, _leaf)) {
            revert InvalidProof();
        }
        if (_addressClaim[_holder]) {
            revert ExceedeedTokenClaiming();
        }
        uint256 _costPhase = _avatar[_tier].cost;
        if (msg.value < 1 * _costPhase) {
            revert InsufficientFunds();
        }
        uint256 _alreadyMinted = _avatar[_tier].minted;
        uint256 _supplyPhase = _avatar[_tier].supply;
        if (_alreadyMinted > _supplyPhase) {
            revert SupplyExceedeed();
        }
    }

    function _totalSupply() private view returns(uint256) {
        uint256 _legendaryMinted = _avatar[TierAvatar.legendary].minted;
        uint256 _epicMinted = _avatar[TierAvatar.epic].minted;
        uint256 _rareMinted = _avatar[TierAvatar.rare].minted;
        return (_legendaryMinted + _epicMinted + _rareMinted) - 3;
    }

    // ===================================================================
    //                              MODIFIER
    // ===================================================================
    modifier mintCompliance(TierAvatar _tier, bytes32[] calldata _merkleProof) {
        _mintCompliance(_tier, msg.sender, _merkleProof);
        _;
    }

    // ===================================================================
    //                                MINT
    // ===================================================================
    function whitelistMint(
        TierAvatar _tier,
        bytes32[] calldata _merkleProof,
        string memory tokenUriAvatar
    ) external payable mintCompliance(_tier, _merkleProof) {
        _addressClaim[_msgSender()] = true;
        _avatar[_tier].minted++;
        _safeMint(_msgSender(), 1);
        uint256 _tokenId = _totalSupply();
        _setTokenURI(_tokenId, tokenUriAvatar);
    }

    // ===================================================================
    //                          OWNER FUNCTION
    // ===================================================================
    function setMerkleRoot(
        TierAvatar _tier,
        bytes32 merkleRoot
    ) external onlyOwner {
        _avatar[_tier].merkleRoot = merkleRoot;
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InsufficientFunds();
        (bool hs, ) = payable(owner()).call{value: (address(this).balance * 5) / 100}("");
        require(hs);
        (bool os, ) = payable(0xEB2D4fA007225AC5bB5fCCc8033b0ED51F2690Ac).call{value: address(this).balance}("");
        require(os);
    }

    // ===================================================================
    //                          FRONTEND FUNCTION
    // ===================================================================
    function getAddressAlreadyClaimed(
        address logHolder
    ) external view returns (bool) {
        return _addressClaim[logHolder];
    }
}
