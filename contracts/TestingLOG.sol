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
error ContractIsNotPause();
error WrongInputPhase();

contract TestingLOG is ERC721r, Ownable {
    using Strings for uint256;

    uint256 private constant MAX_SUPPLY = 5555;
    uint256 private _timeTokenLock;
    string private _hiddenMetadata;
    string private _uriPrefix;
    bool private pauseContract = true;
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
        publicMint,
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

        feature[PhaseMint.publicMint] = PhaseSpec({
            supply: 1,
            cost: 0.045 ether,
            maxAmountPerAddress: 6,
            startTime: 1,
            endTime: 1,
            minted: 1
        });

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
        if (pauseContract) revert ContractIsPause();
        if (
            block.timestamp < feature[_phase].startTime ||
            block.timestamp > feature[_phase].endTime
        ) {
            revert MintingPhaseClose();
        }
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
        if (
            (feature[_phase].minted - 1) + _mintAmount > feature[_phase].supply
        ) {
            revert SupplyExceedeed();
        }
        _addressClaim[msg.sender][_phase] += _mintAmount;
        feature[_phase].minted += _mintAmount;
        _;
    }

    modifier checkCost(PhaseMint _phase, uint256 _mintAmount) {
        if (msg.value < _mintAmount * feature[_phase].cost) {
            revert InsufficientFunds();
        }
        _;
    }

    modifier checkMintPhase(PhaseMint _phase) {
        if (
            _phase == PhaseMint.freeMint ||
            _phase == PhaseMint.reserve
        ) revert WrongInputPhase();
        _;
    }

    // ===================================================================
    //                                MINT
    // ===================================================================
    function freeMinting() external mintCompliance(PhaseMint.freeMint, 1) {
        uint256 _tokenId = getRandomIndex(msg.sender);
        _tokenLocked[_tokenId] = true;
        _mintAtIndex(msg.sender, _tokenId);
    }

    function reserve(
        uint256 amountReserve
    )
        external
        payable
        checkCost(PhaseMint.reserve, amountReserve)
        mintCompliance(PhaseMint.reserve, amountReserve)
    {}

    function mintPhase(
        PhaseMint _phase,
        uint256 mintAmount
    )
        external
        payable
        checkMintPhase(_phase)
        checkCost(_phase, mintAmount)
        mintCompliance(_phase, mintAmount)
    {
        _mintRandom(msg.sender, mintAmount);
    }

    function claimReserve() external {
        if (pauseContract) revert ContractIsPause();
        if (
            block.timestamp < feature[PhaseMint.fcfs].startTime ||
            block.timestamp > feature[PhaseMint.fcfs].endTime
        ) {
            revert MintingPhaseClose();
        }
        uint256 _tokenReserve = _addressClaim[msg.sender][PhaseMint.reserve];
        if (_tokenReserve == 0) revert AddressAlreadyClaimOrNotReserve();
        _addressClaim[msg.sender][PhaseMint.reserve] = 0;
        feature[PhaseMint.reserve].minted -= _tokenReserve;
        _mintRandom(msg.sender, _tokenReserve);
    }

    function airdrops(address to, uint256 mintAmount) external onlyOwner {
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
        uint256 alreadyMinted = totalSupply();
        uint256 tokenReserve = feature[PhaseMint.reserve].minted - 1;
        feature[PhaseMint.fcfs].supply = MAX_SUPPLY - (alreadyMinted + tokenReserve);
        feature[PhaseMint.fcfs].startTime = block.timestamp;
        feature[PhaseMint.fcfs].endTime = block.timestamp + 2 hours;
    }

    function startMintingPublic(uint256 _duration) external onlyOwner {
        uint256 alreadyMinted = totalSupply();
        feature[PhaseMint.publicMint].supply = MAX_SUPPLY - alreadyMinted;
        feature[PhaseMint.publicMint].startTime = block.timestamp;
        feature[PhaseMint.publicMint].endTime = block.timestamp + _duration;
    }

    function setPauseContract(bool _state) external onlyOwner {
        pauseContract = _state;
    }

    function setCostPublicMint(uint256 _newCost) external onlyOwner {
        feature[PhaseMint.publicMint].cost = _newCost;
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
        if (!pauseContract) revert ContractIsNotPause();
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
