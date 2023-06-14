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
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

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
error InvalidProof();

contract TestingLOG is ERC721A, Ownable, ReentrancyGuard {
    bool private pauseContract = true;
    bool private _revealed = false;
    bool private _tokenLock = true;
    uint256 private constant MAX_SUPPLY = 5555;
    string private _hiddenMetadata;
    string private _uriPrefix;

    struct PhaseSpec {
        bytes32 merkleRoot;
        uint256 supply;
        uint256 cost;
        uint256 maxAmountPerAddress;
        uint256 minted;
        bool isOpen;
    }

    enum PhaseMint {
        fcfs,
        freeMint,
        reserve,
        guaranteed
    }

    mapping(PhaseMint => PhaseSpec) public feature;
    mapping(address => mapping(PhaseMint => uint256)) private _addressClaim;
    mapping(uint256 => bool) private _tokenLocked;

    event Locked(uint256 tokenId);

    constructor(
        string memory _hiddenMetadataUri
    ) ERC721A("Testing-LOG", "TLOG") {
        _hiddenMetadata = _hiddenMetadataUri;

        feature[PhaseMint.fcfs] = PhaseSpec({
            merkleRoot: 0,
            supply: 1,
            cost: 0.034 ether,
            maxAmountPerAddress: 2,
            isOpen: false,
            minted: 1
        });

        feature[PhaseMint.freeMint] = PhaseSpec({
            merkleRoot: 0,
            supply: 333,
            cost: 0,
            maxAmountPerAddress: 1,
            isOpen: false,
            minted: 1
        });

        feature[PhaseMint.reserve] = PhaseSpec({
            merkleRoot: 0,
            supply: 1500,
            cost: 0.024 ether,
            maxAmountPerAddress: 2,
            isOpen: false,
            minted: 1
        });

        feature[PhaseMint.guaranteed] = PhaseSpec({
            merkleRoot: 0,
            supply: 3000,
            cost: 0.024 ether,
            maxAmountPerAddress: 2,
            isOpen: false,
            minted: 1
        });
    }

    // ===================================================================
    //                            MODIFIER
    // ===================================================================
    modifier mintCompliance(PhaseMint _phase, uint256 _mintAmount) {
        uint256 _maxAmountPerAddress = feature[_phase].maxAmountPerAddress;
        uint256 _supply = feature[_phase].supply;
        if (pauseContract) revert ContractIsPause();
        if (!feature[_phase].isOpen) {
            revert MintingPhaseClose();
        }
        if (_mintAmount < 1 || _mintAmount > _maxAmountPerAddress) {
            revert InvalidMintAmount();
        }
        if (_addressClaim[msg.sender][_phase] == _maxAmountPerAddress) {
            revert AddressAlreadyMaxClaimed();
        }
        if (
            _addressClaim[msg.sender][_phase] + _mintAmount >
            _maxAmountPerAddress
        ) {
            revert ExceedeedTokenClaiming();
        }
        if (msg.value < _mintAmount * feature[_phase].cost) {
            revert InsufficientFunds();
        }
        if ((feature[_phase].minted + _mintAmount) - 1 > _supply) {
            revert SupplyExceedeed();
        }
        _;
    }

    modifier checkWhitelistMintPhase(PhaseMint _phase) {
        if (_phase == PhaseMint.fcfs) {
            revert WrongInputPhase();
        }
        _;
    }

    // ===================================================================
    //                                MINT
    // ===================================================================
    function whitelistMint(
        PhaseMint _phase,
        uint256 mintAmount,
        bytes32[] calldata _merkleProof
    )
        external
        payable
        checkWhitelistMintPhase(_phase)
        mintCompliance(_phase, mintAmount)
    {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        if (
            !MerkleProof.verify(_merkleProof, feature[_phase].merkleRoot, leaf)
        ) {
            revert InvalidProof();
        }
        _addressClaim[msg.sender][_phase] += mintAmount;
        feature[_phase].minted += mintAmount;
        if (_phase == PhaseMint.freeMint) {
            uint256 _tokenId = totalSupply();
            _tokenLocked[_tokenId] = true;
        }
        if (_phase == PhaseMint.reserve) {
            return;
        }
        _safeMint(msg.sender, mintAmount);
    }

    function mintPublic(
        uint256 mintAmount
    ) external payable mintCompliance(PhaseMint.fcfs, mintAmount) {
        _addressClaim[msg.sender][PhaseMint.fcfs] += mintAmount;
        feature[PhaseMint.fcfs].minted += mintAmount;
        _safeMint(msg.sender, mintAmount);
    }

    function claimReserve() external {
        if (!feature[PhaseMint.fcfs].isOpen) revert MintingPhaseClose();
        uint256 _tokenReserve = _addressClaim[msg.sender][PhaseMint.reserve];
        if (_tokenReserve == 0) revert AddressAlreadyClaimOrNotReserve();
        _addressClaim[msg.sender][PhaseMint.reserve] = 0;
        feature[PhaseMint.reserve].minted -= _tokenReserve;
        _safeMint(msg.sender, _tokenReserve);
    }

    function airdrops(address to, uint256 mintAmount) external onlyOwner {
        _safeMint(to, mintAmount);
    }

    // ===================================================================
    //                          OWNER FUNCTION
    // ===================================================================
    function setTokenLock(bool toggle) public onlyOwner {
        _tokenLock = toggle;
    }

    function setMerkleRoot(
        PhaseMint _phase,
        bytes32 merkleRoot
    ) external onlyOwner checkWhitelistMintPhase(_phase) {
        feature[_phase].merkleRoot = merkleRoot;
    }

    function openWhitelistMint(
        PhaseMint _phase,
        bool toggle
    ) external onlyOwner checkWhitelistMintPhase(_phase) {
        feature[_phase].isOpen = toggle;
    }

    function openPublictMint(bool toggle) external onlyOwner {
        if (toggle) {
            uint256 _totalSupply = totalSupply();
            uint256 _reserveMint = feature[PhaseMint.reserve].minted;
            uint256 _setSupply = MAX_SUPPLY - (_totalSupply + (_reserveMint - 1));

            feature[PhaseMint.fcfs].isOpen = true;
            feature[PhaseMint.fcfs].supply = _setSupply;
            return;
        }
        feature[PhaseMint.fcfs].isOpen = false;
    }

    function setPauseContract(bool _state) external onlyOwner {
        pauseContract = _state;
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
        (bool os, ) = payable(owner()).call{value: address(this).balance}("");
        require(os);
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

    // need improvement
    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal override(ERC721A) {
        if (from != address(0)) {
            if (_tokenLocked[startTokenId] && _tokenLock) {
                emit Locked(startTokenId);
                revert TokenLocked();
            }
        }
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
    }
}

// gasss eficientcy
// unchecked
// supply public
// token locked