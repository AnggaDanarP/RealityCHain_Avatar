//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./InterfaceAvatar.sol";

error InvalidInputParam();
error TokenIsNotTheOwner(address to, uint256 tokenId);

contract Airdrop is Ownable {
    // ERC721 avatar contract
    InterfaceAvatar private immutable _nftAvatar;

    mapping(InterfaceAvatar.TierAvatar => uint256) private _amountAirdropERC20;
    mapping(InterfaceAvatar.TierAvatar => mapping(uint256 => uint256))
        private _nftAirdrop1155;

    constructor(address nft721_) {
        // smart contract address is immutable that can be initiate when deploy but cannot be change.
        _nftAvatar = InterfaceAvatar(nft721_);

        // set up the reward in amount of token ERC20 Legendary
        _amountAirdropERC20[InterfaceAvatar.TierAvatar.legendary] = 100;
        _amountAirdropERC20[InterfaceAvatar.TierAvatar.epic] = 50;
        _amountAirdropERC20[InterfaceAvatar.TierAvatar.rare] = 20;
    }

    // ===================================================================
    //                           SETUP REWARD VALUE
    // ===================================================================
    /**
     * @dev function to setup amount of reward for ERC20 token airdrop
     * @param tier is state of tier nft avatar
     * @param amount is how many tokens will send to this address
     */
    function setAmountErc20ByTier(
        InterfaceAvatar.TierAvatar tier,
        uint256 amount
    ) external onlyOwner {
        _amountAirdropERC20[tier] = amount;
    }

    /**
     * @dev function to setup amount of reward for ERC1155 token airdrop
     * @param tier is state of tier nft avatar
     * @param tokenIdNft is unique identifier of NFT (NFT-ID) ERC1155
     * @param amount is how many tokens will send to this address
     */
    function setAmountErc1155ByTier(
        InterfaceAvatar.TierAvatar tier,
        uint256 tokenIdNft,
        uint256 amount
    ) external onlyOwner {
        _nftAirdrop1155[tier][tokenIdNft] = amount;
    }

    // ===================================================================
    //                          PRIVATE FUNCTION
    // ===================================================================
    function _getTokenTier(
        uint256 tokenId
    ) private pure returns (InterfaceAvatar.TierAvatar) {
        if (tokenId < 56) {
            return InterfaceAvatar.TierAvatar.legendary;
        }

        if (tokenId > 55 && tokenId < 1001) {
            return InterfaceAvatar.TierAvatar.epic;
        }

        if (tokenId > 1000 && tokenId < 3001) {
            return InterfaceAvatar.TierAvatar.rare;
        }
        revert InvalidInputParam();
    }

    /**
     * @dev a private function for check that wallet address contain token id that eligibely amount token/nft by tier to get airdrop
     * @param tokenId is token id from the nft avatar
     */
    function _getAmountRewardERC20ByTier(
        uint256 tokenId
    ) private view returns (uint256) {
        InterfaceAvatar.TierAvatar onTier = _getTokenTier(tokenId);
        return _amountAirdropERC20[onTier];
    }

    /**
     * @dev a private function for check that wallet address contain token id that eligibely amount token/nft by tier to get airdrop
     * @param tokenIdAvatar is token id from the nft avatar
     * @param tokenIdNft1155 is token id from the nft 1155 that want to airdrop
     */
    function _getAmountRewardERC1155ByTier(
        uint256 tokenIdAvatar,
        uint256 tokenIdNft1155
    ) private view returns (uint256) {
        InterfaceAvatar.TierAvatar onTier = _getTokenTier(tokenIdAvatar);
        return _nftAirdrop1155[onTier][tokenIdNft1155];
    }

    function _checkOwnerOfNftAvatar(
        uint256 tokenIdAvatar,
        address holder
    ) private view {
        // check the token id is exist
        if (!_nftAvatar.exist(tokenIdAvatar)) {
            revert InterfaceAvatar.TokenNotExist();
        }

        // check the token Id is same as `to` address
        if (_nftAvatar.ownerOf(tokenIdAvatar) != holder) {
            revert TokenIsNotTheOwner(holder, tokenIdAvatar);
        }
    }

    /**
     * @dev private airdrop function for token ERC20 to wherever wallet address and without verification that address has nft avatar
     * @param to is an destination address
     * @param tokenIdAvatar is token id from wallet address nft avatar
     * @param amount is how many tokens will send to this address
     */
    function _wrapAirdropERC20(
        IERC20 tokenAddress,
        address to,
        uint256 tokenIdAvatar,
        uint256 amount
    ) private {
        if (amount == 0) {
            revert InterfaceAvatar.CannotZeroAmount();
        }
        _checkOwnerOfNftAvatar(tokenIdAvatar, to);
        require(tokenAddress.transferFrom(msg.sender, to, amount));
    }

    /**
     * @dev private airdrop function for nft ERC721
     * @param to is an destination address
     * @param tokenIdAvatar is token id from wallet address nft avatar
     * @param tokenId is an token ID nft erc721 that owner have and want to transfer
     */
    function _wrapAirdropNFT721(
        IERC721 nftAddress,
        address to,
        uint256 tokenIdAvatar,
        uint256 tokenId
    ) private {
        _checkOwnerOfNftAvatar(tokenIdAvatar, to);

        // check nft to airdrop is owner of sender
        if (nftAddress.ownerOf(tokenId) == msg.sender) {
            revert InterfaceAvatar.TokenNotExist();
        }

        nftAddress.safeTransferFrom(msg.sender, to, tokenId);
    }

    // ===================================================================
    //                           AIRDROP ERC20
    // ===================================================================

    /**
     * @dev airdrop function for token ERC20 with verification that address has nft avatar
     * @param to is an destination address that have nft avatar
     * @param tokenId is the token of nft avatar from address `to`
     * @param amount is how many tokens will send to this address
     */
    function airdropToken(
        IERC20 tokenAddress,
        address to,
        uint256 tokenId,
        uint256 amount
    ) external onlyOwner {
        _wrapAirdropERC20(tokenAddress, to, tokenId, amount);
    }

    /**
     * @dev bulk airdrop function for token ERC20 with verification that address has nft avatar
     * @dev `to`, `tokenId`, and `amount` must have same length value
     */
    function batchAirdropToken(
        IERC20 tokenAddress,
        address[] calldata to,
        uint256[] calldata tokenId,
        uint256[] calldata amount
    ) external onlyOwner {
        uint256 totalAddress = to.length;
        if (totalAddress != tokenId.length && totalAddress != amount.length) {
            revert InvalidInputParam();
        }

        for (uint256 i = 0; i < totalAddress; ) {
            _wrapAirdropERC20(tokenAddress, to[i], tokenId[i], amount[i]);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev airdrop function for token ERC20 with verification that address has nft avatar
     * @dev amount token is automatically set by the tier. Legenday, epic, and rare.
     * @param holder is an destination address that have nft avatar
     * @param tokenId is the token of nft avatar from address `holder`
     */
    function airdropTokenToByTier(
        IERC20 tokenAddress,
        address holder,
        uint256 tokenId
    ) external onlyOwner {
        uint256 _amount = _getAmountRewardERC20ByTier(tokenId);
        _wrapAirdropERC20(tokenAddress, holder, tokenId, _amount);
    }

    /**
     * @dev bulk airdrop function for token ERC20 with verification that address has nft avatar
     * @dev amount token is automatically set by the tier. Legenday, epic, and rare.
     */
    function batchAirdropTokenByTier(
        IERC20 tokenAddress,
        address[] calldata holder,
        uint256[] calldata tokenId
    ) external onlyOwner {
        uint256 totalAddress = holder.length;
        if (totalAddress != tokenId.length) {
            revert InvalidInputParam();
        }

        for (uint256 i = 0; i < totalAddress; ) {
            this.airdropTokenToByTier(tokenAddress, holder[i], tokenId[i]);
        }
    }

    // ===================================================================
    //                           AIRDROP ERC721
    // ===================================================================
    function airdropNFT721ToAddressAvatar(
        IERC721 nftAddress,
        address to,
        uint256 tokenIdAvatar,
        uint256 tokenIdNFT
    ) external onlyOwner {
        _wrapAirdropNFT721(nftAddress, to, tokenIdAvatar, tokenIdNFT);
    }

    function bulkAridropNFT721ToAddressAvatar(
        IERC721 nftAddress,
        address[] calldata to,
        uint256[] calldata tokenIdAvatar,
        uint256[] calldata tokenIdNFT
    ) external onlyOwner {
        uint256 _totalAddress = to.length;
        if (
            _totalAddress != tokenIdAvatar.length &&
            _totalAddress != tokenIdNFT.length
        ) {
            revert InvalidInputParam();
        }
        for (uint256 i = 0; i < _totalAddress; ) {
            this.airdropNFT721ToAddressAvatar(
                nftAddress,
                to[i],
                tokenIdAvatar[i],
                tokenIdNFT[i]
            );
        }
    }

    // ===================================================================
    //                           AIRDROP ERC1155
    // ===================================================================
}
