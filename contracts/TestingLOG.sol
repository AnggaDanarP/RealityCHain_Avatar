/**
SPDX-License-Identifier: MIT
██      ███████  █████   ██████  ██    ██ ███████      ██████  ███████      ██████  ██    ██  █████  ██████  ██████  ██  █████  ███    ██ ███████ 
██      ██      ██   ██ ██       ██    ██ ██          ██    ██ ██          ██       ██    ██ ██   ██ ██   ██ ██   ██ ██ ██   ██ ████   ██ ██      
██      █████   ███████ ██   ███ ██    ██ █████       ██    ██ █████       ██   ███ ██    ██ ███████ ██████  ██   ██ ██ ███████ ██ ██  ██ ███████ 
██      ██      ██   ██ ██    ██ ██    ██ ██          ██    ██ ██          ██    ██ ██    ██ ██   ██ ██   ██ ██   ██ ██ ██   ██ ██  ██ ██      ██ 
███████ ███████ ██   ██  ██████   ██████  ███████      ██████  ██           ██████   ██████  ██   ██ ██   ██ ██████  ██ ██   ██ ██   ████ ███████ 
*/
pragma solidity 0.8.17;

import "./token/ERC721r.sol";
import "operator-filter-registry/src/DefaultOperatorFilterer.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestingLOG is
    ERC721r,
    ReentrancyGuard,
    Ownable,
    DefaultOperatorFilterer
{
    using Strings for uint256;

    string public uriPrefix = "";
    string public hiddenMetadata;

    bytes32 public merkleRootWhitelist;
    mapping(address => bool) public whitelistClaimed;
    mapping(address => uint256) public publicClaimNft;

    uint256 public cost;
    uint256 public maxMintAmountPerTx;

    uint256 public constant MAX_SUPPLY = 5555;
    uint256 public constant PUBLIC_LIMIT = 6;

    bytes32 public merkleRootRefund;
    bool public refundEndToogle = false;
    mapping(uint256 => bool) private hashRefund;

    bool public paused = true;
    bool public revealed = false;
    bool public whitelistMintEnable = false;

    constructor(
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _cost,
        uint256 _maxMintAmountPerTx,
        string memory _hiddenMetadata
    ) ERC721r(_tokenName, _tokenSymbol, MAX_SUPPLY) {
        setCost(_cost);
        setMaxMintAmountPerTx(_maxMintAmountPerTx);
        setHiddenMetadata(_hiddenMetadata);
    }

    /**
     * ===================================================
     *                      Modifier
     * ===================================================
     */

    /**
     * @dev modifier to check supply availability
     * check max amount nft in one tx
     * check the availability of tokens from "MAX_SUPPLY"
     * @param _mintAmount is total minting
     */
    modifier mintAmountCompliance(uint256 _mintAmount) {
        require(
            _mintAmount > 0 && _mintAmount <= maxMintAmountPerTx,
            "Invalid mint amount!"
        );
        require(
            totalSupply() + _mintAmount <= MAX_SUPPLY,
            "Max supply exceeded!"
        );
        _;
    }

    /**
     * @dev mofidier to check funds to meet nft prices
     * @param _mintAmount is total minting
     */
    modifier mintPriceCompliance(uint256 _mintAmount) {
        require(msg.value >= cost * _mintAmount, "Insufficient funds");
        _;
    }

    /**
     * ===================================================
     *                Verification whitelist
     * ===================================================
     */
    /**
     * @dev check the address is whitelist
     * @param _minter is address minter
     * @param _merkleProof will get from initiate from merkleroot
     * @param _merkleRoot that get from hashing all the whitelist address
     */
    function _isOnList(
        address _minter,
        bytes32[] calldata _merkleProof,
        bytes32 _merkleRoot
    ) private pure returns (bool) {
        bytes32 _leafe = keccak256(abi.encodePacked((_minter)));
        return MerkleProof.verify(_merkleProof, _merkleRoot, _leafe);
    }

    /**
     * @dev set the merkleroot whitelist for verify
     */
    function setMerkleRootWhitelist(bytes32 _merkleRoot) external onlyOwner {
        merkleRootWhitelist = _merkleRoot;
    }

    /**
     * @dev set the merkleroot Refund for verify
     */
    function setMerkleRootRefund(bytes32 _merkleRoot) external onlyOwner {
        merkleRootRefund = _merkleRoot;
    }

    /**
     * ===================================================
     *                       Minting
     * ===================================================
     */
    /**
     * @dev whitelist mint
     * @dev every address whitelist only get 1 NFT
     * @param _merkleProof to check and verify that the address is part of whitelist
     */
    function whitelistMint(bytes32[] calldata _merkleProof)
        public
        payable
        nonReentrant
        mintAmountCompliance(1)
        mintPriceCompliance(1)
    {
        require(whitelistMintEnable, "Whitelist sale is not enabled!");
        require(
            _isOnList(msg.sender, _merkleProof, merkleRootWhitelist),
            "Invalid proof"
        );
        require(!whitelistClaimed[_msgSender()], "Address already claimed");

        whitelistClaimed[_msgSender()] = true;

        _mintRandom(_msgSender(), 1);
    }

    /**
     * @dev minting for public
     * amount NFT can provide is only 3 in one tx
     * in one address only have 6 nft for the limit
     * @param _mintAmount is mount of nft will mint
     */
    function publicMint(uint256 _mintAmount)
        public
        payable
        nonReentrant
        mintAmountCompliance(_mintAmount)
        mintPriceCompliance(_mintAmount)
    {
        require(!paused, "The contract is paused!");
        require(
            publicClaimNft[_msgSender()] + _mintAmount <= PUBLIC_LIMIT,
            "NFT Limit Exceeded"
        );

        publicClaimNft[_msgSender()] += _mintAmount;
        _mintRandom(_msgSender(), _mintAmount);
    }

    /**
     * @dev gift minting that only owner can use this function
     * @dev every _receiver address only get 1 nft
     * @param _receiver is address that want to gift the nft
     */
    function giftMint(address[] calldata _receiver)
        external
        nonReentrant
        onlyOwner
        mintAmountCompliance(_receiver.length)
    {
        for (uint256 i = 0; i < _receiver.length; i++) {
            _mintRandom(_receiver[i], 1);
        }
    }

    /**
     * ===================================================
     *                       Refund
     * ===================================================
     */
    /**
     * @dev toogle to open refund feature
     * @param _refundEndToogle is a toogle to set on/off the feature
     */
    function setToogleForRefund(bool _refundEndToogle) external onlyOwner {
        refundEndToogle = _refundEndToogle;
    }

    /**
     * @dev refund feature
     * @dev refund open when the the feature is on
     * @param tokenIds is a token that represent from nft that want to refund
     */
    function refund(
        uint256[] calldata tokenIds,
        bytes32[] calldata _merkleProof
    ) public nonReentrant {
        require(refundEndToogle, "Refund expired");
        require(
            _isOnList(msg.sender, _merkleProof, merkleRootRefund),
            "Invalid proof"
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(_exists(tokenId), "Token is not exist");
            require(msg.sender == ownerOf(tokenId), "Not token owner");
            require(!hashRefund[tokenId], "Already refunded");
            hashRefund[tokenId] = true;
            transferFrom(msg.sender, owner(), tokenId);
        }

        uint256 refundAmount = tokenIds.length * cost;
        Address.sendValue(payable(msg.sender), refundAmount);
    }

    /**
     * ===================================================
     *                     Withdraw
     * ===================================================
     */
    /**
     * @dev withdraw feature that only owner can do it
     * @dev cen do withdraw if refund feature and minitng whitelist section is off
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(
            !refundEndToogle && !whitelistMintEnable,
            "Not in the right time"
        );
        require(balance > 0, "Failed: no funds to withdraw");
        Address.sendValue(
            payable(0x21d1E1577689550148722737aEB0aE6935941aaa),
            balance
        );
    }

    /**
     * ===================================================
     *                     Metadata
     * ===================================================
     */
    /**
     * @dev setup the metadata token URI for opensea
     * @param _tokenId is the token nft to set the metadata
     */
    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(_exists(_tokenId), "URI query for nonexistent token");
        string memory currentBaseURI = (revealed == false)
            ? hiddenMetadata
            : _baseURI();
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

    /**
     * @dev set the general image (hidden metadata) before reveal the nft
     * This is hidden metadata
     * @param _hiddenMetadataUri is a CID from ipfs that contain the general image
     */
    function setHiddenMetadata(string memory _hiddenMetadataUri)
        public
        onlyOwner
    {
        hiddenMetadata = _hiddenMetadataUri;
    }

    /**
     * @dev set the real nft character
     * @param _uriPrefix is URI from CID ipfs that contain
     */
    function setUriPrefix(string memory _uriPrefix) public onlyOwner {
        uriPrefix = _uriPrefix;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return uriPrefix;
    }

    /**
     * ===================================================
     *                     Reveal
     * ===================================================
     */
    /**
     * @dev set hte reveal toogle
     * @param _state is a state to set the reveal feature
     */
    function setRevealed(bool _state) public onlyOwner {
        revealed = _state;
    }

    // function _startTokenId() internal view virtual override returns (uint256) {
    //     return 1;
    // }

    /**
     * @dev set hte maximum mount nft for minting
     * @param _maxMintAmountPerTx is maximum mount
     */
    function setMaxMintAmountPerTx(uint256 _maxMintAmountPerTx)
        public
        onlyOwner
    {
        maxMintAmountPerTx = _maxMintAmountPerTx;
    }

    /**
     * @dev set the cost for every minting
     * @param _cost is price of nft
     */
    function setCost(uint256 _cost) public onlyOwner {
        cost = _cost;
    }

    /**
     * ===================================================
     *                    Pause/Unpause
     * ===================================================
     */
    /**
     * @dev to set the contract is can minting or not
     * @param _state is toogle to turn on/off
     */
    function setPaused(bool _state) public onlyOwner {
        paused = _state;
    }

    /**
     * @dev to set the minitng whitelist feature
     * @param _state is toogle to turn on/off
     */
    function setWhitelistMintEnabled(bool _state) public onlyOwner {
        whitelistMintEnable = _state;
    }

    /**
     * ===================================================
     *                       Override
     * ===================================================
     */
    function setApprovalForAll(address operator, bool approved)
        public
        override
        onlyAllowedOperatorApproval(operator)
    {
        super.setApprovalForAll(operator, approved);
    }

    function approve(address operator, uint256 tokenId)
        public
        override
        //payable
        onlyAllowedOperatorApproval(operator)
    {
        super.approve(operator, tokenId);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override onlyAllowedOperator(from) {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId, data);
    }
}
