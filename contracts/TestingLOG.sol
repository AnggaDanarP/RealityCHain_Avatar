/**
SPDX-License-Identifier: MIT
██      ███████  █████   ██████  ██    ██ ███████      ██████  ███████      ██████  ██    ██  █████  ██████  ██████  ██  █████  ███    ██ ███████ 
██      ██      ██   ██ ██       ██    ██ ██          ██    ██ ██          ██       ██    ██ ██   ██ ██   ██ ██   ██ ██ ██   ██ ████   ██ ██      
██      █████   ███████ ██   ███ ██    ██ █████       ██    ██ █████       ██   ███ ██    ██ ███████ ██████  ██   ██ ██ ███████ ██ ██  ██ ███████ 
██      ██      ██   ██ ██    ██ ██    ██ ██          ██    ██ ██          ██    ██ ██    ██ ██   ██ ██   ██ ██   ██ ██ ██   ██ ██  ██ ██      ██ 
███████ ███████ ██   ██  ██████   ██████  ███████      ██████  ██           ██████   ██████  ██   ██ ██   ██ ██████  ██ ██   ██ ██   ████ ███████ 
*/
pragma solidity 0.8.19;

import "../contracts/token/ERC721r.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error AddressAlreadyClaimed();
error MintingPhaseClose();
error InvalidMintAmount();
error ExceedeedTokenClaiming();
error SupplyExceedeed();
error MaxSupplyExceedeed();
error InsufficientFunds();
error AddressAlreadyClaimOrNotReserve();
error NeedAllFeaturesOff();
error NonExistToken();
error TokenLocked();

contract TestingLOG is ERC721r, Ownable {
    using Strings for uint256;

    uint256 private constant MAX_SUPPLY = 5555;
    uint256 private immutable _timeTokenLock;
    string private _hiddenMetadata;
    string private _uriPrefix;
    bool private _revealed = false;

    struct PhaseSpec {
        uint256 supply;
        uint256 cost;
        uint256 maxAmountPerAddress;
        uint256 minted;
        uint256 startTime;
        uint256 endTime;
    }

    enum PhaseMint {
        freeMint,
        reserve,
        guaranteed,
        fcfs
    }

    mapping(PhaseMint => PhaseSpec) public _feature;
    mapping(address => mapping(PhaseMint => uint256)) public _addressClaim;
    mapping(uint256 => bool) private _tokenLocked;

    constructor(
        string memory _hiddenMetadataUri,
        uint256 _timeTokenLocked
    ) ERC721r("Testing-LOG", "TLOG", MAX_SUPPLY) {
        _hiddenMetadata = _hiddenMetadataUri;
        _timeTokenLock = _timeTokenLocked;

        _feature[PhaseMint.freeMint] = PhaseSpec({
            supply: 333,
            cost: 0 ether,
            maxAmountPerAddress: 1,
            startTime: 0,
            endTime: _feature[PhaseMint.freeMint].startTime + 12 hours,
            minted: 1
        });

        _feature[PhaseMint.reserve] = PhaseSpec({
            supply: 1500,
            cost: 0.024 ether,
            maxAmountPerAddress: 2,
            startTime: _feature[PhaseMint.freeMint].endTime,
            endTime: _feature[PhaseMint.reserve].startTime + 2 hours,
            minted: 1
        });

        _feature[PhaseMint.guaranteed] = PhaseSpec({
            supply: 3000,
            cost: 0.024 ether,
            maxAmountPerAddress: 2,
            startTime: _feature[PhaseMint.reserve].endTime,
            endTime: _feature[PhaseMint.guaranteed].startTime + 2 hours,
            minted: 1
        });

        _feature[PhaseMint.fcfs] = PhaseSpec({
            supply: _supplyLeft(),
            cost: 0.034 ether,
            maxAmountPerAddress: 2,
            startTime: 0,
            endTime: _feature[PhaseMint.guaranteed].startTime + 2 hours,
            minted: 1
        });
    }

    // ===================================================================
    //                            MODIFIER
    // ===================================================================
    modifier mintCompliance(PhaseMint _phase, uint256 _mintAmount) {
        _checkDuration(_phase);
        if (
            _mintAmount < 0 &&
            _mintAmount > _feature[_phase].maxAmountPerAddress
        ) {
            revert InvalidMintAmount();
        }
        if (
            _addressClaim[msg.sender][_phase] ==
            _feature[_phase].maxAmountPerAddress
        ) {
            revert AddressAlreadyClaimed();
        }
        if (
            _addressClaim[msg.sender][_phase] + _mintAmount >
            _feature[_phase].maxAmountPerAddress
        ) {
            revert ExceedeedTokenClaiming();
        }
        if (
            (_feature[_phase].minted + _mintAmount) - 1 >
            _feature[_phase].supply
        ) {
            revert SupplyExceedeed();
        }
        if (msg.value < _mintAmount * _feature[_phase].cost) {
            revert InsufficientFunds();
        }
        _addressClaim[msg.sender][_phase] += _mintAmount;
        _feature[_phase].minted += _mintAmount;
        _;
    }

    modifier IsTransferAllowed(uint256 _tokenId) {
        if (_tokenLocked[_tokenId] && block.timestamp < _timeTokenLock) {
            revert TokenLocked();
        }
        _;
    }

    function _checkDuration(PhaseMint _phase) internal view virtual {
        if (
            block.timestamp < _feature[_phase].startTime &&
            block.timestamp > _feature[_phase].endTime
        ) {
            revert MintingPhaseClose();
        }
    }

    function _supplyLeft() private view returns (uint256) {
        uint256 mintedPhase1 = _feature[PhaseMint.freeMint].minted;
        uint256 mintedPhase2 = _feature[PhaseMint.reserve].minted;
        uint256 mintedPhase3 = _feature[PhaseMint.guaranteed].minted;
        return MAX_SUPPLY - (mintedPhase1 + mintedPhase2 + mintedPhase3);
    }

    // ===================================================================
    //                                MINT
    // ===================================================================
    function freeMinting()
        external
        payable
        mintCompliance(PhaseMint.freeMint, 1)
    {
        uint256 _tokenId = getRandomIndex(msg.sender);
        _tokenLocked[_tokenId] = true;
        _mintAtIndex(msg.sender, _tokenId);
    }

    function reserve(
        uint256 amountReserve
    ) external payable mintCompliance(PhaseMint.reserve, amountReserve) {}

    function mint(
        PhaseMint phaseMint,
        uint256 amountMint
    ) external payable mintCompliance(phaseMint, amountMint) {
        _mintRandom(msg.sender, amountMint);
    }

    function claimReserve() external {
        _checkDuration(PhaseMint.fcfs);
        uint256 _tokenReserve = _addressClaim[msg.sender][PhaseMint.reserve];
        if (_tokenReserve == 0) revert AddressAlreadyClaimOrNotReserve();
        _addressClaim[msg.sender][PhaseMint.reserve] = 0;
        _mintRandom(msg.sender, _tokenReserve);
    }

    function devClaim(uint256 mintAmount) external onlyOwner {
        _mintRandom(msg.sender, mintAmount);
    }

    // ===================================================================
    //                          OWNER FUNCTION
    // ===================================================================
    function startMintingPhase(uint256 timeStart) external onlyOwner {
        _feature[PhaseMint.freeMint].startTime = timeStart;
    }

    function startMintingPublic(uint256 timeStart) external onlyOwner {
        _feature[PhaseMint.fcfs].startTime = timeStart;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _uriPrefix;
    }

    function setHiddenMetadata(
        string memory _hiddenMetadataUri
    ) external onlyOwner {
        _hiddenMetadata = _hiddenMetadataUri;
    }

    function setBaseUri(string memory _newUriPrefix) external onlyOwner {
        _uriPrefix = _newUriPrefix;
    }

    function setRevealed(bool _state) external onlyOwner {
        _revealed = _state;
    }

    function withdraw() external onlyOwner {
        if (
            block.timestamp > _feature[PhaseMint.freeMint].endTime &&
            block.timestamp > _feature[PhaseMint.fcfs].endTime
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

    // ===================================================================
    //                           OPENSEA SUPPORT
    // ===================================================================
    function tokenURI(
        uint256 _tokenId
    ) public view virtual override returns (string memory) {
        if (!_exists(_tokenId)) revert NonExistToken();
        if (!_revealed) return _hiddenMetadata;
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

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721r) IsTransferAllowed(tokenId) {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override(ERC721r) IsTransferAllowed(tokenId) {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721r) IsTransferAllowed(tokenId) {
        super.safeTransferFrom(from, to, tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721r) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
