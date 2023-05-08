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

error AddressAlreadyMaxClaimed();
error MintingPhaseClose();
error InvalidMintAmount();
error ExceedeedTokenClaiming();
error SupplyExceedeed();
error InsufficientFunds();
error AddressAlreadyClaimOrNotReserve();
error NonExistToken();
error TokenLocked();
error ContractIsPause();

contract TestingLOG is ERC721r, Ownable {
    using Strings for uint256;

    uint256 private constant MAX_SUPPLY = 5555;
    uint256 private _timeTokenLock;
    string private _hiddenMetadata;
    string private _uriPrefix;
    bool private pauseMintPhase = true;
    bool private pauseMintPublic = true;
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

    mapping(PhaseMint => PhaseSpec) public feature;
    mapping(address => mapping(PhaseMint => uint256)) private _addressClaim;
    mapping(uint256 => bool) private _tokenLocked;

    constructor(
        string memory _hiddenMetadataUri,
        uint256 _timeTokenLocked
    ) ERC721r("Testing-LOG", "TLOG", MAX_SUPPLY) {
        _hiddenMetadata = _hiddenMetadataUri;
        setDurationTokenLock(_timeTokenLocked);

        feature[PhaseMint.freeMint] = PhaseSpec({
            supply: 333,
            cost: 0,
            maxAmountPerAddress: 1,
            startTime: 1,
            endTime: 1,
            minted: 1
        });

        feature[PhaseMint.reserve] = PhaseSpec({
            supply: 1500,
            cost: 0.024 ether,
            maxAmountPerAddress: 2,
            startTime: 1,
            endTime: 1,
            minted: 1
        });

        feature[PhaseMint.guaranteed] = PhaseSpec({
            supply: 3000,
            cost: 0.024 ether,
            maxAmountPerAddress: 2,
            startTime: 1,
            endTime: 1,
            minted: 1
        });

        feature[PhaseMint.fcfs] = PhaseSpec({
            supply: 1,
            cost: 0.034 ether,
            maxAmountPerAddress: 2,
            startTime: 1,
            endTime: 1,
            minted: 1
        });
    }

    // ===================================================================
    //                            MODIFIER
    // ===================================================================
    modifier mintCompliance(PhaseMint _phase, uint256 _mintAmount) {
        _isPause();
        _checkDuration(_phase);
        if (
            _mintAmount < 1 || _mintAmount > feature[_phase].maxAmountPerAddress
        ) {
            revert InvalidMintAmount();
        }
        if (
            _addressClaim[msg.sender][_phase] ==
            feature[_phase].maxAmountPerAddress
        ) {
            revert AddressAlreadyMaxClaimed();
        }
        if (
            _addressClaim[msg.sender][_phase] + _mintAmount >
            feature[_phase].maxAmountPerAddress
        ) {
            revert ExceedeedTokenClaiming();
        }
        _checkSupplyPhase(_phase, _mintAmount);
        if (msg.value < _mintAmount * feature[_phase].cost) {
            revert InsufficientFunds();
        }
        _addressClaim[msg.sender][_phase] += _mintAmount;
        feature[_phase].minted += _mintAmount;
        _;
    }

    function _isPause() internal view {
        if (pauseMintPhase) revert ContractIsPause();
    }

    function _checkDuration(PhaseMint _phase) internal view virtual {
        if (
            block.timestamp < feature[_phase].startTime ||
            block.timestamp > feature[_phase].endTime
        ) {
            revert MintingPhaseClose();
        }
    }

    function _checkSupplyPhase(
        PhaseMint _phase,
        uint256 _mintAmount
    ) internal view virtual {
        if (
            (feature[_phase].minted - 1) + _mintAmount > feature[_phase].supply
        ) {
            revert SupplyExceedeed();
        }
    }

    function _supplyLeft() private view returns (uint256) {
        uint256 alreadyMinted = totalSupply();
        uint256 tokenReserve = feature[PhaseMint.reserve].minted - 1;
        return MAX_SUPPLY - (alreadyMinted + tokenReserve);
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

    function mintPhase(
        PhaseMint _phase,
        uint256 mintAmount
    ) external payable mintCompliance(_phase, mintAmount) {
        _mintRandom(msg.sender, mintAmount);
    }

    function claimReserve() external {
        _isPause();
        _checkDuration(PhaseMint.fcfs);
        uint256 _tokenReserve = _addressClaim[msg.sender][PhaseMint.reserve];
        if (_tokenReserve == 0) revert AddressAlreadyClaimOrNotReserve();
        _addressClaim[msg.sender][PhaseMint.reserve] = 0;
        _mintRandom(msg.sender, _tokenReserve);
    }

    function mintPublic(uint256 mintAmount) external payable {
        if (pauseMintPublic) revert MintingPhaseClose();
        if (totalSupply() + mintAmount > MAX_SUPPLY) revert SupplyExceedeed();
        if (msg.value < mintAmount * 0.35 ether) revert InsufficientFunds();
        _mintRandom(msg.sender, mintAmount);
    }

    function airdrops(
        PhaseMint phase,
        address to,
        uint256 mintAmount
    ) external onlyOwner {
        _checkSupplyPhase(phase, mintAmount);
        _addressClaim[to][phase] = mintAmount;
        feature[phase].minted += mintAmount;
        _mintRandom(to, mintAmount);
    }

    // ===================================================================
    //                          OWNER FUNCTION
    // ===================================================================
    function setDurationTokenLock(uint256 _duration) public onlyOwner {
        _timeTokenLock = block.timestamp + _duration;
    }
    function startMintingPhase() external onlyOwner {
        feature[PhaseMint.freeMint].startTime = block.timestamp;
        feature[PhaseMint.freeMint].endTime = block.timestamp + 12 hours;
        feature[PhaseMint.reserve].startTime = feature[PhaseMint.freeMint].endTime;
        feature[PhaseMint.reserve].endTime = block.timestamp + 14 hours;
        feature[PhaseMint.guaranteed].startTime = feature[PhaseMint.reserve].endTime;
        feature[PhaseMint.guaranteed].endTime = block.timestamp + 16 hours;
    }

    function startMintingFcfs() external onlyOwner {
        feature[PhaseMint.fcfs].supply = _supplyLeft();
        feature[PhaseMint.fcfs].startTime = block.timestamp;
        feature[PhaseMint.fcfs].endTime = feature[PhaseMint.fcfs].startTime + 2 hours;
    }

    function setPauseMintPhase(bool _state) external onlyOwner {
        pauseMintPhase = _state;
    }

    function setPauseMintPublic(bool _state) external onlyOwner {
        pauseMintPublic = _state;
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

    function _baseURI() internal view virtual override returns (string memory) {
        return _uriPrefix;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721r) {
        if (from != address(0)) {
            if (_tokenLocked[tokenId] && block.timestamp < _timeTokenLock) {
                revert TokenLocked();
            }
        }
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }
}
