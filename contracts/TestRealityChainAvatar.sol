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

    mapping(TierAvatar => NftAvatarSpec) public avatar;
    mapping(address => bool) private addressClaim;

    constructor(
        string memory _tokenName,
        string memory _tokenSymbol
    ) ERC721(_tokenName, _tokenSymbol) {
        avatar[TierAvatar.legendary] = NftAvatarSpec({
            merkleRoot: 0x00,
            supply: 50,
            cost: 0.05 ether,
            minted: 1
        });

        avatar[TierAvatar.epic] = NftAvatarSpec({
            merkleRoot: 0x00,
            supply: 950,
            cost: 0.03 ether,
            minted: 1
        });

        avatar[TierAvatar.rare] = NftAvatarSpec({
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
        bytes32 _merkleRoot = avatar[_tier].merkleRoot;
        if (!MerkleProof.verify(_merkleProof, _merkleRoot, _leaf)) {
            revert InvalidProof();
        }
        if (addressClaim[_holder]) {
            revert ExceedeedTokenClaiming();
        }
        uint256 _costPhase = avatar[_tier].cost;
        if (msg.value < 1 * _costPhase) {
            revert InsufficientFunds();
        }
        uint256 _alreadyMinted = avatar[_tier].minted;
        uint256 _supplyPhase = avatar[_tier].supply;
        if (_alreadyMinted > _supplyPhase) {
            revert SupplyExceedeed();
        }
    }

    function totalMinted() private view returns(uint256) {
        uint256 _legendaryMinted = avatar[TierAvatar.legendary].minted;
        uint256 _epicMinted = avatar[TierAvatar.epic].minted;
        uint256 _rareMinted = avatar[TierAvatar.rare].minted;
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
    function mint(
        TierAvatar _tier,
        bytes32[] calldata _merkleProof,
        string memory tokenUriAvatar
    ) external payable mintCompliance(_tier, _merkleProof) {
        addressClaim[_msgSender()] = true;
        avatar[_tier].minted++;
        uint256 _tokenId = totalMinted();
        _safeMint(_msgSender(), _tokenId);
        _setTokenURI(_tokenId, tokenUriAvatar);
    }

    // ===================================================================
    //                          OWNER FUNCTION
    // ===================================================================
    function setMerkleRoot(
        TierAvatar _tier,
        bytes32 merkleRoot
    ) external onlyOwner {
        avatar[_tier].merkleRoot = merkleRoot;
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
        return addressClaim[logHolder];
    }

    function totalSupply() public view returns(uint256) {
        return totalMinted();
    }
}
