/**
SPDX-License-Identifier: MIT
██      ███████  █████   ██████  ██    ██ ███████      ██████  ███████      ██████  ██    ██  █████  ██████  ██████  ██  █████  ███    ██ ███████ 
██      ██      ██   ██ ██       ██    ██ ██          ██    ██ ██          ██       ██    ██ ██   ██ ██   ██ ██   ██ ██ ██   ██ ████   ██ ██      
██      █████   ███████ ██   ███ ██    ██ █████       ██    ██ █████       ██   ███ ██    ██ ███████ ██████  ██   ██ ██ ███████ ██ ██  ██ ███████ 
██      ██      ██   ██ ██    ██ ██    ██ ██          ██    ██ ██          ██    ██ ██    ██ ██   ██ ██   ██ ██   ██ ██ ██   ██ ██  ██ ██      ██ 
███████ ███████ ██   ██  ██████   ██████  ███████      ██████  ██           ██████   ██████  ██   ██ ██   ██ ██████  ██ ██   ██ ██   ████ ███████ 
*/
pragma solidity 0.8.17;

import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "operator-filter-registry/src/DefaultOperatorFilterer.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract NftLog is
    ERC721AQueryable,
    ReentrancyGuard,
    Ownable,
    DefaultOperatorFilterer
{
    using Strings for uint256;

    string public uriPrefix = "";
    string public hiddenMetadata;

    bytes32 public merkleRoot;
    mapping(address => bool) public whitelistClaimed;

    uint256 public cost;
    uint256 public maxMintAmountPerTx;

    uint256 public constant MAX_SUPPLY = 5555; // actual supply 5.555 + 88 NFTs

    bool public refundEndToogle = false;
    mapping(uint256 => bool) private hashRefund;

    bool public paused = true;
    bool public revealed = false;
    bool public whitelistMintEnable = false;

    address private constant WALLET_A =
        0x69a31266321e78670F1Ea24CA57c772259C679ad;
    address private constant WALLET_B =
        0xB940062cf4afb9068623F23d974E02268015186a;

    constructor(
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _cost,
        uint256 _maxMintAmountPerTx,
        string memory _hiddenMetadata
    ) ERC721A(_tokenName, _tokenSymbol) {
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
     * @param _mintAmount is total minting
     */
    modifier mintCompliance(uint256 _mintAmount) {
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
     * @dev set the merkleroot for verify
     */
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
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
        mintCompliance(1)
        mintPriceCompliance(1)
    {
        require(whitelistMintEnable, "Whitelist sale is not enabled!");

        require(
            _isOnList(msg.sender, _merkleProof, merkleRoot),
            "Invalid proof"
        );
        require(!whitelistClaimed[_msgSender()], "Address already claimed");

        whitelistClaimed[_msgSender()] = true;

        _safeMint(_msgSender(), 1);
    }

    /**
     * @dev minting for public
     * @param _mintAmount is mount of nft will mint
     */
    function publicMint(uint256 _mintAmount)
        public
        payable
        nonReentrant
        mintCompliance(_mintAmount)
        mintPriceCompliance(_mintAmount)
    {
        require(!paused, "The contract is paused!");

        _safeMint(_msgSender(), _mintAmount);
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
        mintCompliance(_receiver.length)
    {
        for (uint256 i = 0; i < _receiver.length; i++) {
            _safeMint(_receiver[i], 1);
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
    function refund(uint256[] calldata tokenIds) public nonReentrant {
        require(refundEndToogle, "Refund expired");

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
        require(
            !refundEndToogle && !whitelistMintEnable,
            "Not in the right time"
        );
        require(address(this).balance > 0, "Failed: no funds to withdraw");
        uint256 walletBalanceA = (address(this).balance * 15) / 100;
        uint256 walletBalanceB = (address(this).balance * 85) / 100;

        Address.sendValue(payable(WALLET_A), walletBalanceA);
        Address.sendValue(payable(WALLET_B), walletBalanceB);
    }

    /**
     * ===================================================
     *                     Metadata
     * ===================================================
     */
    /**
     * @dev setup the metadata token URI for opensea
     * if tokenId < 88 will return metadata for creator
     * else will return the character LOG for public
     * @param _tokenId is the token nft to set the metadata
     */
    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override(ERC721A, IERC721A)
        returns (string memory)
    {
        require(_exists(_tokenId), "URI query for nonexistent token");
        // the actual value is 89
        // the maximum supply for creator access is 88 NFTs
        if (revealed == false) {
            return hiddenMetadata;
        }
        string memory currentBaseURI = _baseURI();
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
     * This is hidden metadata for creator access
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

    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }

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
        override(ERC721A, IERC721A)
        onlyAllowedOperatorApproval(operator)
    {
        super.setApprovalForAll(operator, approved);
    }

    function approve(address operator, uint256 tokenId)
        public
        payable
        override(ERC721A, IERC721A)
        onlyAllowedOperatorApproval(operator)
    {
        super.approve(operator, tokenId);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public payable override(ERC721A, IERC721A) onlyAllowedOperator(from) {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public payable override(ERC721A, IERC721A) onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public payable override(ERC721A, IERC721A) onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId, data);
    }
}
