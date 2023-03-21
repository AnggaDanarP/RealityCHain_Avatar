/**
SPDX-License-Identifier: MIT
██      ███████  █████   ██████  ██    ██ ███████      ██████  ███████      ██████  ██    ██  █████  ██████  ██████  ██  █████  ███    ██ ███████ 
██      ██      ██   ██ ██       ██    ██ ██          ██    ██ ██          ██       ██    ██ ██   ██ ██   ██ ██   ██ ██ ██   ██ ████   ██ ██      
██      █████   ███████ ██   ███ ██    ██ █████       ██    ██ █████       ██   ███ ██    ██ ███████ ██████  ██   ██ ██ ███████ ██ ██  ██ ███████ 
██      ██      ██   ██ ██    ██ ██    ██ ██          ██    ██ ██          ██    ██ ██    ██ ██   ██ ██   ██ ██   ██ ██ ██   ██ ██  ██ ██      ██ 
███████ ███████ ██   ██  ██████   ██████  ███████      ██████  ██           ██████   ██████  ██   ██ ██   ██ ██████  ██ ██   ██ ██   ████ ███████ 
*/
pragma solidity 0.8.17;

//import "./token/ERC721r.sol";
import "operator-filter-registry/src/DefaultOperatorFilterer.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error InvalidMintAmount();
error AmountCannotZero();
error MaxSupplyExceeded();
error InsufficientFunds();
error ContractAddressCannotMint();
error AddressWhitelistAlreadyClaimed();
error PublicDisable();
error WhitelistSaleDisable();
error RefundDisable();
error InvalidProof();
error NftLimitAddressExceeded();
error NeedAllFeaturesOff();
error WrongInputSupply();
error SupplyInputAboveLimit();
error NonExistToken();
error MintingMoreTokenThanAvailable();
error NotTokenOwner();
error TokenAlreadyRefunded();
error ToggleInputInvalid();

contract TestingLOG is
    ERC721Enumerable,
    ReentrancyGuard,
    Ownable,
    DefaultOperatorFilterer
{
    using Strings for uint256;

    string public uriPrefix = "";
    string public hiddenMetadata = "";
    uint256 private _numAvailableTokens;
    uint256 public immutable maxSupplyToken;
    uint256 public constant BATCH_SIZE = 6;
    bool public refundToggle = false;
    bool public revealed = false;

    struct NftSpec {
        uint256 supplyLimit;
        uint256 cost;
        uint256 maxMintAmountPerTx;
        uint256 alreadyMinted;
        uint256 toggle; // value 1 is false, 2 is true.
    }

    enum MintingFeature {
        publicMinting,
        whitelistMinting,
        giftMinting
    }

    enum VerifyFeature {
        whitelist,
        refund
    }

    mapping(MintingFeature => NftSpec) public feature;
    mapping(VerifyFeature => bytes32) public merkleRoot;
    mapping(address => uint256) private _whitelistClaimed; // if the valie is 1, wallet already claim the nft
    mapping(address => uint256) private _publicClaimNft;
    mapping(uint256 => uint256) private _hashRefund; // if the valie is 1, tokenId have refund
    mapping(uint256 => uint256) private _availableTokens;

    event Minting(address to, uint256 tokenId);
    event Refund(address from, uint256 tokenId, uint256 costToken);

    constructor(
        uint256 _maxSupplyAvailable,
        string memory _hiddenMetadata
    ) ERC721("Testing-LOG", "TLOG") {
        hiddenMetadata = _hiddenMetadata;
        maxSupplyToken = _maxSupplyAvailable;
        _numAvailableTokens = _maxSupplyAvailable;
        feature[MintingFeature.publicMinting] = NftSpec(2000, 0.02 ether, 3, 1, 1);
        feature[MintingFeature.whitelistMinting] = NftSpec(1000, 0.015 ether, 1, 1, 1);
        feature[MintingFeature.giftMinting] = NftSpec(200, 0, 200, 1, 2);
        merkleRoot[VerifyFeature.whitelist] = 0;
        merkleRoot[VerifyFeature.refund] = 0;
    }

    function _isOnList(
        address _minter,
        bytes32[] calldata _merkleProof,
        bytes32 _merkleRoot
    ) private pure returns (bool) {
        bytes32 _leafe = keccak256(abi.encodePacked((_minter)));
        return MerkleProof.verify(_merkleProof, _merkleRoot, _leafe);
    }

    function checkSupplyAndCost(
        MintingFeature mintingFeature,
        uint256 _mintingAmount
    ) private returns (bool) {
        uint256 _cost = feature[mintingFeature].cost;
        uint256 _alreadyMinted = feature[mintingFeature].alreadyMinted;

        if (_mintingAmount == 0) {
            revert AmountCannotZero();
        }
        if (_mintingAmount > feature[mintingFeature].maxMintAmountPerTx) {
            revert InvalidMintAmount();
        }
        if (totalSupply() + _mintingAmount > maxSupplyToken) {
            revert MaxSupplyExceeded();
        }
        if (msg.value < _cost * _mintingAmount) {
            revert InsufficientFunds();
        }
        if (
            (_alreadyMinted + _mintingAmount) - 1 >
            feature[mintingFeature].supplyLimit
        ) {
            revert MaxSupplyExceeded();
        }
        return true;
    }

    function checkMaxLimitSupply(
        MintingFeature feature2Change,
        uint256 _newSupply,
        MintingFeature featureOne,
        MintingFeature featureTwo
    ) private view returns (bool) {
        uint256 available = availabelSupply(featureOne, featureTwo);

        if (_newSupply == 0) revert AmountCannotZero();
        if (_newSupply < feature[feature2Change].alreadyMinted) {
            revert WrongInputSupply();
        }
        if (_newSupply > available) revert SupplyInputAboveLimit();
        return true;
    }

    function availabelSupply(
        MintingFeature featureOne,
        MintingFeature featureTwo
    ) private view returns (uint256) {
        uint256 _maxLimitWhitelist = feature[featureOne].supplyLimit;
        uint256 _maxLimitGift = feature[featureTwo].supplyLimit;
        uint256 _maxSupplyToken = maxSupplyToken;
        return _maxSupplyToken - (_maxLimitWhitelist + _maxLimitGift);
    }

    function getCostToken() private view returns (uint256) {
        if (feature[MintingFeature.whitelistMinting].toggle == 2) {
            return feature[MintingFeature.whitelistMinting].cost;
        }

        if (feature[MintingFeature.publicMinting].toggle == 2) {
            return feature[MintingFeature.publicMinting].cost;
        }

        return 0;
    }

    function getRandomAvailableTokenId(
        address to,
        uint256 updatedNumAvailableTokens
    ) private returns (uint256) {
        uint256 randomNum = uint256(
            keccak256(
                abi.encode(
                    to,
                    tx.gasprice,
                    block.number,
                    block.timestamp,
                    block.difficulty,
                    blockhash(block.number - 1),
                    address(this),
                    updatedNumAvailableTokens
                )
            )
        );
        uint256 randomIndex = randomNum % updatedNumAvailableTokens;
        return getAvailableTokenAtIndex(randomIndex, updatedNumAvailableTokens);
    }

    function getAvailableTokenAtIndex(
        uint256 indexToUse,
        uint256 updatedNumAvailableTokens
    ) private returns (uint256) {
        uint256 valAtIndex = _availableTokens[indexToUse];
        uint256 result;
        if (valAtIndex == 0) {
            // This means the index itself is still an available token
            result = indexToUse;
        } else {
            // This means the index itself is not an available token, but the val at that index is.
            result = valAtIndex;
        }

        uint256 lastIndex = updatedNumAvailableTokens - 1;
        uint256 lastValInArray = _availableTokens[lastIndex];
        if (indexToUse != lastIndex) {
            // Replace the value at indexToUse, now that it's been used.
            // Replace it with the data from the last index in the array, since we are going to decrease the array size afterwards.
            if (lastValInArray == 0) {
                // This means the index itself is still an available token
                _availableTokens[indexToUse] = lastIndex;
            } else {
                // This means the index itself is not an available token, but the val at that index is.
                _availableTokens[indexToUse] = lastValInArray;
            }
        }
        if (lastValInArray != 0) {
            // Gas refund courtsey of @dievardump
            delete _availableTokens[lastIndex];
        }

        return result;
    }

    function _minting(
        MintingFeature mintingFeature,
        uint256 _mintAmount,
        address _to
    ) private nonReentrant {
        uint256 updatedNumAvailableTokens = _numAvailableTokens;

        if (Address.isContract(_to)) {
            revert ContractAddressCannotMint();
        }
        if (updatedNumAvailableTokens < _mintAmount)
            revert MintingMoreTokenThanAvailable();

        for (uint256 i; i < _mintAmount; ++i) {
            // Do this ++ unchecked?
            uint256 tokenId = getRandomAvailableTokenId(_to, updatedNumAvailableTokens);

            _mint(_to, tokenId);

            unchecked {
                --updatedNumAvailableTokens;
            }

            emit Minting(_to, tokenId);
        }

        _numAvailableTokens = updatedNumAvailableTokens;

        unchecked {
            feature[mintingFeature].alreadyMinted += _mintAmount;
        }
    }

    function whitelistMint(bytes32[] calldata _merkleProof) external payable {
        bytes32 _merkleRootWhitelist = merkleRoot[VerifyFeature.whitelist];

        if (feature[MintingFeature.whitelistMinting].toggle != 2) {
            revert WhitelistSaleDisable();
        }

        if (!_isOnList(_msgSender(), _merkleProof, _merkleRootWhitelist)) {
            revert InvalidProof();
        }

        if (_whitelistClaimed[_msgSender()] == 1) {
            revert AddressWhitelistAlreadyClaimed();
        }

        if (checkSupplyAndCost(MintingFeature.whitelistMinting, 1)) {
            _minting(MintingFeature.whitelistMinting, 1, _msgSender());
            unchecked {
                _whitelistClaimed[_msgSender()]++;
            }
        }
    }

    function publicMint(uint256 _mintAmount) external payable {
        if (feature[MintingFeature.publicMinting].toggle != 2) {
            revert PublicDisable();
        }

        if ((_publicClaimNft[_msgSender()] + _mintAmount) > BATCH_SIZE) {
            revert NftLimitAddressExceeded();
        }

        if (checkSupplyAndCost(MintingFeature.publicMinting, _mintAmount)) {
            _publicClaimNft[_msgSender()] += _mintAmount;
            _minting(MintingFeature.publicMinting, _mintAmount, _msgSender());
        }
    }

    function giftMint(address[] calldata _receiver) external onlyOwner {
        uint256 _amount = _receiver.length;
        if (checkSupplyAndCost(MintingFeature.giftMinting, _amount)) {
            for (uint256 i = 0; i < _amount; i++) {
                _minting(MintingFeature.giftMinting, 1, _receiver[i]);
            }
        }
    }

    function refund(
        uint256 tokenId,
        bytes32[] calldata _merkleProof
    ) external nonReentrant {
        bytes32 _merkleRootRefund = merkleRoot[VerifyFeature.refund];

        if (!refundToggle) {
            revert RefundDisable();
        }

        if (!_isOnList(_msgSender(), _merkleProof, _merkleRootRefund)) {
            revert InvalidProof();
        }
        if (!_exists(tokenId)) revert NonExistToken();
        if (_msgSender() != ownerOf(tokenId)) revert NotTokenOwner();
        if (_hashRefund[tokenId] == 1) revert TokenAlreadyRefunded();

        uint256 priceToReturn = getCostToken();

        unchecked {
            _hashRefund[tokenId]++;
        }
        
        transferFrom(msg.sender, owner(), tokenId);

        Address.sendValue(payable(_msgSender()), priceToReturn);

        emit Refund(_msgSender(), tokenId, priceToReturn);
    }

    function withdraw() external onlyOwner {
        if (
            refundToggle ||
            feature[MintingFeature.whitelistMinting].toggle == 2 ||
            feature[MintingFeature.publicMinting].toggle == 2
        ) {
            revert NeedAllFeaturesOff();
        }
        uint256 balance = address(this).balance;
        if (balance == 0) revert InsufficientFunds();
        Address.sendValue(
            payable(0x21d1E1577689550148722737aEB0aE6935941aaa),
            balance
        );
    }

    function tokenURI(
        uint256 _tokenId
    ) public view virtual override returns (string memory) {
        if (!_exists(_tokenId)) revert NonExistToken();
        if(!revealed) return hiddenMetadata;
        string memory currentBaseURI =  _baseURI();
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

    function _baseURI() internal view virtual override returns (string memory) {
        return uriPrefix;
    }

    function setHiddenMetadata(
        string memory _hiddenMetadataUri
    ) external onlyOwner {
        hiddenMetadata = _hiddenMetadataUri;
    }

    function setMetadataBaseUri(string memory _uriPrefix) external onlyOwner {
        uriPrefix = _uriPrefix;
    }

    function setRevealed(bool _state) external onlyOwner {
        revealed = _state;
    }

    function setMaxMintAmountPerTxPublic(
        uint256 _maxMintAmountPerTx
    ) external onlyOwner {
        feature[MintingFeature.publicMinting]
            .maxMintAmountPerTx = _maxMintAmountPerTx;
    }

    function setCostPublic(uint256 _cost) external onlyOwner {
        feature[MintingFeature.publicMinting].cost = _cost;
    }

    function setCostWhitelist(uint256 _cost) external onlyOwner {
        feature[MintingFeature.whitelistMinting].cost = _cost;
    }

    function setMerkleRootWhitelist(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot[VerifyFeature.whitelist] = _merkleRoot;
    }

    function setMerkleRootRefund(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot[VerifyFeature.refund] = _merkleRoot;
    }

    function setMaxSupplyPublic(uint256 _newSupply) external onlyOwner {
        if (
            checkMaxLimitSupply(
                MintingFeature.publicMinting,
                _newSupply,
                MintingFeature.whitelistMinting,
                MintingFeature.giftMinting
            )
        ) {
            feature[MintingFeature.publicMinting].supplyLimit = _newSupply;
        }
    }

    function setMaxSupplyWhitelist(uint256 _newSupply) external onlyOwner {
        if (
            checkMaxLimitSupply(
                MintingFeature.whitelistMinting,
                _newSupply,
                MintingFeature.publicMinting,
                MintingFeature.giftMinting
            )
        ) {
            feature[MintingFeature.whitelistMinting].supplyLimit = _newSupply;
        }
    }

    function setMaxSupplyGift(uint256 _newSupply) external onlyOwner {
        if (
            checkMaxLimitSupply(
                MintingFeature.giftMinting,
                _newSupply,
                MintingFeature.whitelistMinting,
                MintingFeature.publicMinting
            )
        ) {
            feature[MintingFeature.giftMinting].supplyLimit = _newSupply;
        }
    }

    function setPublicMintEnable(uint256 toggle) external onlyOwner {
        if (toggle < 1 || toggle > 2) {
            revert ToggleInputInvalid();
        }
        feature[MintingFeature.publicMinting].toggle = toggle;
    }

    function setWhitelistMintEnable(uint256 toggle) external onlyOwner {
        if (toggle < 1 || toggle > 2) {
            revert ToggleInputInvalid();
        }
        feature[MintingFeature.whitelistMinting].toggle = toggle;
    }

    function setToogleForRefund(bool _refundEndToogle) external onlyOwner {
        refundToggle = _refundEndToogle;
    }

    /**
     * ===================================================
     *                       Override
     * ===================================================
     */
    function setApprovalForAll(
        address operator,
        bool approved
    ) public override(ERC721, IERC721) onlyAllowedOperatorApproval(operator) {
        super.setApprovalForAll(operator, approved);
    }

    function approve(
        address operator,
        uint256 tokenId
    )
        public
        override(ERC721, IERC721)
        //payable
        onlyAllowedOperatorApproval(operator)
    {
        super.approve(operator, tokenId);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721, IERC721) onlyAllowedOperator(from) {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721, IERC721) onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override(ERC721, IERC721) onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId, data);
    }
}
