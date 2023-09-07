//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

interface InterfaceAvatar {
    struct NftAvatarSpec {
        bool isOpen;
        bytes32 merkleRoot;
        uint256 supply;
        uint256 maxTokenId;
        uint256 startTokenId;
        uint256 maxAmountPerAddress;
        uint256 cost;
        uint256 tokenIdCounter;
    }

    enum TierAvatar {
        legendary,
        epic,
        rare
    }

    error ExceedeedTokenClaiming();
    error SupplyExceedeed();
    error InsufficientFunds();
    error InvalidProof();
    error CannotZeroAmount();
    error InvalidTierInput();
    error MintingClose();
    error TokenNotExist();

    function exist(uint256 tokenId) external view returns (bool);

    function ownerOf(uint256 tokenId) external view returns (address);

    function getAddressAlreadyClaimed(
        TierAvatar tier,
        address holder
    ) external view returns (uint256);

}
