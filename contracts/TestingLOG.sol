/**
SPDX-License-Identifier: MIT
██      ███████  █████   ██████  ██    ██ ███████      ██████  ███████      ██████  ██    ██  █████  ██████  ██████  ██  █████  ███    ██ ███████ 
██      ██      ██   ██ ██       ██    ██ ██          ██    ██ ██          ██       ██    ██ ██   ██ ██   ██ ██   ██ ██ ██   ██ ████   ██ ██      
██      █████   ███████ ██   ███ ██    ██ █████       ██    ██ █████       ██   ███ ██    ██ ███████ ██████  ██   ██ ██ ███████ ██ ██  ██ ███████ 
██      ██      ██   ██ ██    ██ ██    ██ ██          ██    ██ ██          ██    ██ ██    ██ ██   ██ ██   ██ ██   ██ ██ ██   ██ ██  ██ ██      ██ 
███████ ███████ ██   ██  ██████   ██████  ███████      ██████  ██           ██████   ██████  ██   ██ ██   ██ ██████  ██ ██   ██ ██   ████ ███████ 
*/
pragma solidity 0.8.19;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "operator-filter-registry/src/DefaultOperatorFilterer.sol";

error AddressAlreadyMaxClaimed();
error MintingPhaseClose();
error InvalidMintAmount();
error ExceedeedTokenClaiming();
error SupplyExceedeed();
error InsufficientFunds();
error AddressAlreadyClaim();
error NonExistToken();
error TokenLocked();
error ContractIsPause();
error ContractIsNotPause();
error WrongInputPhase();
error InvalidProof();
error MaxSupplyReached();
error ContractNotAllowed();
error ProxyNotAllowed();

contract TestingLOG is
    ERC721A,
    ERC2981,
    Ownable,
    ReentrancyGuard,
    DefaultOperatorFilterer
{
    bool private pauseContract = true;
    bool private _revealed = false;
    bool private _toggleTokenLock = true;
    uint256 private constant MAX_SUPPLY = 6666;
    uint256 private supplyTreasury = 0;
    string private _hiddenMetadata = "";
    string private _uriPrefix = "";

    struct PhaseSpec {
        bytes32 merkleRoot;
        uint256 supply;
        uint256 cost;
        uint256 maxAmountPerAddress;
        uint256 minted;
        bool isOpen;
    }

    enum PhaseMint {
        publicSale,
        freeMint,
        guaranteed,
        fcfs
    }

    mapping(PhaseMint => PhaseSpec) public feature;
    mapping(address => mapping(PhaseMint => uint256)) private _addressClaim;
    mapping(uint256 => bool) private _tokenLocked;

    constructor(
        string memory _hiddenMetadataUri
    ) ERC721A("Testing-LOG", "TLOG") {
        _hiddenMetadata = _hiddenMetadataUri;

        feature[PhaseMint.publicSale] = PhaseSpec({
            merkleRoot: 0x00,
            supply: 2600,
            cost: 0.019 ether,
            maxAmountPerAddress: 2,
            isOpen: false,
            minted: 1
        });

        feature[PhaseMint.freeMint] = PhaseSpec({
            merkleRoot: 0x00,
            supply: 333,
            cost: 0,
            maxAmountPerAddress: 1,
            isOpen: false,
            minted: 1
        });

        feature[PhaseMint.guaranteed] = PhaseSpec({
            merkleRoot: 0x00,
            supply: 2000,
            cost: 0.019 ether,
            maxAmountPerAddress: 2,
            isOpen: false,
            minted: 1
        });

        feature[PhaseMint.guaranteed] = PhaseSpec({
            merkleRoot: 0x00,
            supply: 2600,
            cost: 0.019 ether,
            maxAmountPerAddress: 2,
            isOpen: false,
            minted: 1
        });
    }

    // ===================================================================
    //                            MODIFIER
    // ===================================================================
    modifier notContract() {
        if (_isContract(_msgSender())) revert ContractNotAllowed();
        if (_msgSender() != tx.origin) revert ProxyNotAllowed();
        _;
    }

    function _isContract(address _addr) private view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(_addr)
        }
        return size > 0;
    }

    modifier _checkWhitelistPhase(PhaseMint _phase) {
        if (_phase == PhaseMint.publicSale) {
            revert WrongInputPhase();
        }
        _;
    }

    function _mintCompliance(PhaseMint _phase, uint256 _mintAmount) private {
        if (pauseContract) revert ContractIsPause();
        bool _isOpenPhase = feature[_phase].isOpen;
        if (!_isOpenPhase) {
            revert MintingPhaseClose();
        }
        uint256 _maxAmountPerAddress = feature[_phase].maxAmountPerAddress;
        if (_mintAmount < 1 || _mintAmount > _maxAmountPerAddress) {
            revert InvalidMintAmount();
        }
        uint256 _addressClaimed = _addressClaim[_msgSender()][_phase];
        if (_addressClaimed + _mintAmount > _maxAmountPerAddress) {
            revert ExceedeedTokenClaiming();
        }
        uint256 _alreadyMinted = feature[_phase].minted;
        uint256 _supplyPhase = feature[_phase].supply;
        if ((_alreadyMinted + _mintAmount) - 1 > _supplyPhase) {
            revert SupplyExceedeed();
        }
        uint256 _totalSupply = totalSupply();
        uint256 _maxSupply = MAX_SUPPLY;
        if ((_totalSupply + _mintAmount) > _maxSupply) {
            revert MaxSupplyReached();
        }
        uint256 _costPhase = feature[_phase].cost;
        if (msg.value < _mintAmount * _costPhase) {
            revert InsufficientFunds();
        }
        _addressClaim[_msgSender()][_phase] += _mintAmount;
        feature[_phase].minted += _mintAmount;
    }

    function _verifying(
        PhaseMint _phase,
        bytes32[] calldata _merkleProof
    ) private view {
        bytes32 leaf = keccak256(abi.encodePacked(_msgSender()));
        if (
            !MerkleProof.verify(_merkleProof, feature[_phase].merkleRoot, leaf)
        ) {
            revert InvalidProof();
        }
    }

    // ===================================================================
    //                                MINT
    // ===================================================================
    function whitelistMint(
        PhaseMint _phase,
        uint256 mintAmount,
        bytes32[] calldata _merkleProof
    ) external payable notContract _checkWhitelistPhase(_phase) {
        _verifying(_phase, _merkleProof);
        _mintCompliance(_phase, mintAmount);
        if (_phase == PhaseMint.freeMint) {
            uint256 _tokenId = totalSupply() + 1;
            _tokenLocked[_tokenId] = true;
        }
        _safeMint(_msgSender(), mintAmount);
    }

    function mintPublic(uint256 mintAmount) external payable notContract {
        _mintCompliance(PhaseMint.publicSale, mintAmount);
        _safeMint(_msgSender(), mintAmount);
    }

    // function claimReserve(bytes32[] calldata _merkleProof) external {
    //     if (!feature[PhaseMint.fcfs].isOpen) revert MintingPhaseClose();
    //     _verifying(PhaseMint.reserve, _merkleProof);
    //     uint256 _tokenReserve = _addressClaim[_msgSender()][PhaseMint.reserve];
    //     if (_tokenReserve == 0) revert AddressAlreadyClaim();
    //     _addressClaim[_msgSender()][PhaseMint.reserve] = 0;
    //     feature[PhaseMint.reserve].minted -= _tokenReserve;
    //     _safeMint(_msgSender(), _tokenReserve);
    // }

    function mintForAddress(uint256 _mintAmount, address _receiver)
        external
        onlyOwner
    {
        if (!pauseContract) revert ContractIsNotPause();
        _safeMint(_receiver, _mintAmount);
    }

    // ===================================================================
    //                          OWNER FUNCTION
    // ===================================================================
    function setTokenLock(bool toggle) external onlyOwner {
        _toggleTokenLock = toggle;
    }

    function setMerkleRoot(
        PhaseMint _phase,
        bytes32 merkleRoot
    ) external onlyOwner _checkWhitelistPhase(_phase) {
        feature[_phase].merkleRoot = merkleRoot;
    }

    function _getSupplyLeftOver() private view returns (uint256) {
        uint256 _totalSupply = totalSupply();
        uint256 _supplyTreasury = supplyTreasury;
        uint256 _maxSupply = MAX_SUPPLY;
        return _maxSupply - (_totalSupply + _supplyTreasury);
    }

    function openWhitelistMint(
        PhaseMint _phase,
        bool toggle
    ) external onlyOwner _checkWhitelistPhase(_phase) {
        if (_phase == PhaseMint.fcfs && toggle) {
            uint256 _setSupply = _getSupplyLeftOver();
            feature[PhaseMint.fcfs].supply = _setSupply;
        }
        feature[_phase].isOpen = toggle;
    }

    function openPublictMint(bool toggle) external onlyOwner {
        if (toggle) {
            uint256 _setSupply = _getSupplyLeftOver();
            feature[PhaseMint.publicSale].supply = _setSupply;
        }
        feature[PhaseMint.publicSale].isOpen = toggle;
    }

    function setPauseContract(bool _toggle) external onlyOwner {
        pauseContract = _toggle;
    }

    function setHiddenMetadata(
        string memory _hiddenMetadataUri
    ) external onlyOwner {
        _hiddenMetadata = _hiddenMetadataUri;
    }

    function setBaseUri(string memory _newUriPrefix) external onlyOwner {
        _uriPrefix = _newUriPrefix;
    }

    function setRevealed(bool _toggle) external onlyOwner {
        _revealed = _toggle;
    }

    function withdraw() external onlyOwner nonReentrant {
        if (!pauseContract) revert ContractIsNotPause();
        uint256 balance = address(this).balance;
        if (balance == 0) revert InsufficientFunds();
        (bool os, ) = payable(owner()).call{value: address(this).balance}("");
        require(os);
    }

    function setRoyalties(
        address _recipient,
        uint96 _amount
    ) external onlyOwner {
        _setDefaultRoyalty(_recipient, _amount);
    }

    // ===================================================================
    //                           OPENSEA SUPPORT
    // ===================================================================
    function tokenURI(
        uint256 _tokenId
    ) public view virtual override(ERC721A) returns (string memory) {
        if (!_exists(_tokenId)) revert NonExistToken();
        if (!_revealed) return _hiddenMetadata;
        string memory currentBaseURI = _baseURI();
        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseURI,
                        _toString(_tokenId),
                        ".json"
                    )
                )
                : "";
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _uriPrefix;
    }

    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }

    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal override(ERC721A) {
        if (from > address(0)) {
            if (_toggleTokenLock && _tokenLocked[startTokenId]) {
                revert TokenLocked();
            }
        }
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
    }

    function setApprovalForAll(
        address operator,
        bool approved
    ) public override onlyAllowedOperatorApproval(operator) {
        super.setApprovalForAll(operator, approved);
    }

    function approve(
        address operator,
        uint256 tokenId
    ) public payable override onlyAllowedOperatorApproval(operator) {
        super.approve(operator, tokenId);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public payable override onlyAllowedOperator(from) {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public payable override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public payable override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721A, ERC2981) returns (bool) {
        // IERC165: 0x01ffc9a7, IERC721: 0x80ac58cd, IERC721Metadata: 0x5b5e139f, IERC29081: 0x2a55205a
        return
            ERC721A.supportsInterface(interfaceId) ||
            ERC2981.supportsInterface(interfaceId);
    }
}
