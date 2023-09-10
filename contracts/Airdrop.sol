//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

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

error InvalidInputParam();
error NeedApproveFromOwner();
error BalanceExceeded();
error ErrorApprove(uint256 amount);
error TokenIsNotTheOwner(address to, uint256 tokenId);
error ErrorTransferFrom(address spender, address to, uint256 amount);

contract Airdrop {
    // address owner, cannot be change
    // this address mush have balance from ERC20, ERC721, and ERC1155
    address private _owner;

    // ERC721 avatar contract
    InterfaceAvatar private immutable _nftAvatar;

    mapping(InterfaceAvatar.TierAvatar => uint256) private _amountAirdropERC20;
    mapping(InterfaceAvatar.TierAvatar => mapping(uint256 => uint256)) private _nftAirdrop1155;

    constructor(address nft721_) {
        // smart contract address is immutable that can be initiate when deploy but cannot be change.
        _nftAvatar = InterfaceAvatar(nft721_);
        _owner = msg.sender;

        // set up the reward in amount of token ERC20 Legendary
        _amountAirdropERC20[InterfaceAvatar.TierAvatar.legendary] = 100;
        _amountAirdropERC20[InterfaceAvatar.TierAvatar.epic] = 50;
        _amountAirdropERC20[InterfaceAvatar.TierAvatar.rare] = 20;
    }

    /**
     * @dev a modifier to check the wallet address id an owner
     */
    modifier onlyOwner() {
        require(msg.sender == _owner, "Not Owner");
        _;
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
    ) external onlyOwner() {
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
    ) external onlyOwner() {
        _nftAirdrop1155[tier][tokenIdNft] = amount;
    }

    // ===================================================================
    //                          PRIVATE FUNCTION
    // ===================================================================
    /**
     * @dev a private function to get what tier the token is from the token ID number
     * @param tokenId is token id from the nft avatar
     */
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

    /**
     * @dev a private function for check that wallet address have NFT Avatar
     * @param tokenIdAvatar is token id from the nft avatar
     * @param holder is token id from the nft 1155 that want to airdrop
     */
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
     * @dev function will set owner to `approve` this smart contract to send the `amount` of token
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
        if (!tokenAddress.approve(address(this), amount)) {
            revert ErrorApprove(amount);
        }
        if (!tokenAddress.transferFrom(_owner, to, amount)) {
            revert ErrorTransferFrom(_owner, to, amount);
        }
    }

    /**
     * @dev private airdrop function for nft ERC20 that the amount is already set by the owner
     * @dev function will set owner to `approve` this smart contract to send the `amount` of token supply
     * @param to is an destination address
     * @param tokenIdAvatar is token id from wallet address nft avatar
     */
    function _wrapAirdropERC20(
        IERC20 tokenAddress,
        address to,
        uint256 tokenIdAvatar
    ) private {
        uint256 _amount = _getAmountRewardERC20ByTier(tokenIdAvatar);
        _wrapAirdropERC20(tokenAddress, to, tokenIdAvatar, _amount);
    }

    /**
     * @dev private airdrop function for nft ERC721
     * @dev function will set owner to `approve` this smart contract to send the `token id` of nft
     * @param to is an destination address
     * @param tokenIdAvatar is token id from wallet address nft avatar
     * @param tokenIdErc721 is an token ID nft erc721 that owner have and want to transfer
     */
    function _wrapAirdropNFT721(
        IERC721 nftAddress721,
        address to,
        uint256 tokenIdAvatar,
        uint256 tokenIdErc721
    ) private {
        if (!nftAddress721.isApprovedForAll(_owner, address(this))) {
            revert NeedApproveFromOwner();
        }
        // check nft to airdrop is owner of sender
        if (nftAddress721.ownerOf(tokenIdErc721) != _owner) {
            revert InterfaceAvatar.TokenNotExist();
        }
        _checkOwnerOfNftAvatar(tokenIdAvatar, to);

        // nftAddress721.approve(address(this), tokenIdErc721);
        nftAddress721.safeTransferFrom(msg.sender, to, tokenIdErc721);
    }

    /**
     * @dev private airdrop function for nft ERC1155
     * @dev function will set owner to `approve` this smart contract to send the `token id` of nft
     * @param to is an destination address
     * @param tokenIdAvatar is token id from wallet address nft avatar
     * @param tokenIdERC1155 is an token ID nft erc1155 that owner have and want to transfer
     * @param amount is amount of nft want to sent
     */
    function _wrapAirdropNFT1155(
        IERC1155 nftAddress1155,
        address to,
        uint256 tokenIdAvatar,
        uint256 tokenIdERC1155,
        uint256 amount
    ) private {
        if (!nftAddress1155.isApprovedForAll(_owner, address(this))) {
            revert NeedApproveFromOwner();
        }
        if (amount == 0) {
            revert InterfaceAvatar.CannotZeroAmount();
        }
        if (nftAddress1155.balanceOf(_owner, tokenIdERC1155) == 0) {
            revert BalanceExceeded();
        }
        _checkOwnerOfNftAvatar(tokenIdAvatar, to);

        nftAddress1155.safeTransferFrom(_owner, to, tokenIdERC1155, amount, "");
    }

    /**
     * @dev private airdrop function for nft ERC1155 that the amount is already set by the owner
     * @dev function will set owner to `approve` this smart contract to send the `token id` of nft
     * @param to is an destination address
     * @param tokenIdAvatar is token id from wallet address nft avatar
     * @param tokenIdERC1155 is an token ID nft erc1155 that owner have and want to transfer
     */
    function _wrapAirdropNFT1155(
        IERC1155 nftAddress1155,
        address to,
        uint256 tokenIdAvatar,
        uint256 tokenIdERC1155
    ) private {
        uint256 _amount = _getAmountRewardERC1155ByTier(
            tokenIdAvatar,
            tokenIdERC1155
        );
        _wrapAirdropNFT1155(
            nftAddress1155,
            to,
            tokenIdAvatar,
            tokenIdERC1155,
            _amount
        );
    }

    // ===================================================================
    //                           AIRDROP ERC20
    // ===================================================================

    /**
     * @dev airdrop function for token ERC20 with verification that address has nft avatar
     * @param to is an destination address that have nft avatar
     * @param tokenIdAvatar is the token of nft avatar from address `to`
     * @param amount is how many tokens will send to this address
     */
    function airdropToken(
        IERC20 tokenAddress,
        address to,
        uint256 tokenIdAvatar,
        uint256 amount
    ) external onlyOwner(){
        _wrapAirdropERC20(tokenAddress, to, tokenIdAvatar, amount);
    }

    /**
     * @dev bulk airdrop function for token ERC20 with verification that address has nft avatar
     * @dev `to`, `tokenIdAvatar`, and `amount` must have same length value
     */
    function batchAirdropToken(
        IERC20 tokenAddress,
        address[] calldata to,
        uint256[] calldata tokenIdAvatar,
        uint256[] calldata amount
    ) external onlyOwner() {
        uint256 totalAddress = to.length;
        if (
            totalAddress != tokenIdAvatar.length &&
            totalAddress != amount.length
        ) {
            revert InvalidInputParam();
        }

        for (uint256 i = 0; i < totalAddress; ) {
            _wrapAirdropERC20(tokenAddress, to[i], tokenIdAvatar[i], amount[i]);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev airdrop function for token ERC20 with verification that address has nft avatar
     * @dev amount token is automatically set by the tier. Legenday, epic, and rare.
     * @param holder is an destination address that have nft avatar
     * @param tokenIdAvatar is the token of nft avatar from address `holder`
     */
    function airdropTokenToByTier(
        IERC20 tokenAddress,
        address holder,
        uint256 tokenIdAvatar
    ) external onlyOwner() {
        _wrapAirdropERC20(tokenAddress, holder, tokenIdAvatar);
    }

    /**
     * @dev bulk airdrop function for token ERC20 with verification that address has nft avatar
     * @dev amount token is automatically set by the tier. Legenday, epic, and rare.
     */
    function batchAirdropTokenByTier(
        IERC20 tokenAddress,
        address[] calldata holder,
        uint256[] calldata tokenIdAvatar
    ) external onlyOwner() {
        uint256 totalAddress = holder.length;
        if (totalAddress != tokenIdAvatar.length) {
            revert InvalidInputParam();
        }

        for (uint256 i = 0; i < totalAddress; ) {
            _wrapAirdropERC20(tokenAddress, holder[i], tokenIdAvatar[i]);
            unchecked {
                ++i;
            }
        }
    }

    // ===================================================================
    //                           AIRDROP ERC721
    // ===================================================================
    /**
     * @dev airdrop function for token ERC721 with verification that address has nft avatar
     * @param to is an destination address that have nft avatar
     * @param tokenIdAvatar is the token of nft avatar from address `to`
     * @param tokenIdNFT721 is token id from ERC1155 want to transfer
     */
    function airdropNFT721(
        IERC721 nftAddress721,
        address to,
        uint256 tokenIdAvatar,
        uint256 tokenIdNFT721
    ) external onlyOwner() {
        _wrapAirdropNFT721(nftAddress721, to, tokenIdAvatar, tokenIdNFT721);
    }

    /**
     * @dev bulk airdrop function for token ERC721 with verification that address has nft avatar
     * @dev `to`, `tokenIdAvatar`, and `tokenIdNFT721` must have same length value
     */
    function batchAirdropNFT721(
        IERC721 nftAddress721,
        address[] calldata to,
        uint256[] calldata tokenIdAvatar,
        uint256[] calldata tokenIdNFT721
    ) external onlyOwner() {
        uint256 _totalAddress = to.length;
        if (
            _totalAddress != tokenIdAvatar.length &&
            _totalAddress != tokenIdNFT721.length
        ) {
            revert InvalidInputParam();
        }
        for (uint256 i = 0; i < _totalAddress; ) {
            _wrapAirdropNFT721(
                nftAddress721,
                to[i],
                tokenIdAvatar[i],
                tokenIdNFT721[i]
            );
        }
    }

    // ===================================================================
    //                           AIRDROP ERC1155
    // ===================================================================
    /**
     * @dev airdrop function for token ERC20 with verification that address has nft avatar
     * @param to is an destination address that have nft avatar
     * @param tokenIdAvatar is the token of nft avatar from address `to`
     * @param tokenIdNFT1155 is token id from ERC1155 want to transfer
     * @param amount is amount of NFT from `tokenIdNFT1155` want to sent
     */
    function airdropNFT1155(
        IERC1155 nftAddress1155,
        address to,
        uint256 tokenIdAvatar,
        uint256 tokenIdNFT1155,
        uint256 amount
    ) external onlyOwner() {
        _wrapAirdropNFT1155(
            nftAddress1155,
            to,
            tokenIdAvatar,
            tokenIdNFT1155,
            amount
        );
    }

    /**
     * @dev bulk airdrop function for token ERC1155 with verification that address has nft avatar
     * @dev `to`, `tokenIdAvatar`, `tokenIdNFT1155`, and `amount` must have same length value
     */
    function batchAirdropNFT1155(
        IERC1155 nftAddress1155,
        address[] calldata to,
        uint256[] calldata tokenIdAvatar,
        uint256 tokenIdNFT1155,
        uint256[] calldata amount
    ) external onlyOwner() {
        uint256 _totalAddress = to.length;
        if (
            _totalAddress != tokenIdAvatar.length &&
            _totalAddress != amount.length
        ) {
            revert InvalidInputParam();
        }
        for (uint256 i = 0; i < _totalAddress; ) {
            _wrapAirdropNFT1155(
                nftAddress1155,
                to[i],
                tokenIdAvatar[i],
                tokenIdNFT1155,
                amount[i]
            );
            unchecked {
                ++i;
            }
        }
    }

    function airdropNFT1155ByTier(
        IERC1155 nftAddress1155,
        address to,
        uint256 tokenIdAvatar,
        uint256 tokenIdNFT1155
    ) external onlyOwner() {
        _wrapAirdropNFT1155(nftAddress1155, to, tokenIdAvatar, tokenIdNFT1155);
    }

    function batchAirdropNFT1155ByTier(
        IERC1155 nftAddress1155,
        address[] calldata to,
        uint256[] calldata tokenIdAvatar,
        uint256 tokenIdNFT1155
    ) external onlyOwner() {
        uint256 _totalAddress = to.length;
        if (
            _totalAddress != tokenIdAvatar.length
        ) {
            revert InvalidInputParam();
        }
        for (uint256 i = 0; i < _totalAddress; ) {
            _wrapAirdropNFT1155(
                nftAddress1155,
                to[i],
                tokenIdAvatar[i],
                tokenIdNFT1155
            );
            unchecked {
                ++i;
            }
        }
    }
}
