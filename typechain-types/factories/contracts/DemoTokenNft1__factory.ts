/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  BigNumberish,
  Overrides,
} from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  DemoTokenNft1,
  DemoTokenNft1Interface,
} from "../../contracts/DemoTokenNft1";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_tokenName",
        type: "string",
      },
      {
        internalType: "string",
        name: "_tokenSymbol",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_cost",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_maxSupply",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_maxMintAmountPerTx",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_hiddenMetadataUri",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "ApprovalCallerNotOwnerNorApproved",
    type: "error",
  },
  {
    inputs: [],
    name: "ApprovalQueryForNonexistentToken",
    type: "error",
  },
  {
    inputs: [],
    name: "ApprovalToCurrentOwner",
    type: "error",
  },
  {
    inputs: [],
    name: "ApproveToCaller",
    type: "error",
  },
  {
    inputs: [],
    name: "BalanceQueryForZeroAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "MintToZeroAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "MintZeroQuantity",
    type: "error",
  },
  {
    inputs: [],
    name: "OwnerQueryForNonexistentToken",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferCallerNotOwnerNorApproved",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferFromIncorrectOwner",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferToNonERC721ReceiverImplementer",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferToZeroAddress",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "cost",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getApproved",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "hiddenMetadataUri",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxMintAmountPerTx",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "merkleRoot",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_mintAmount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_mintAmount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_receiver",
        type: "address",
      },
    ],
    name: "mintForAddress",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "revealed",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_cost",
        type: "uint256",
      },
    ],
    name: "setCost",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_hiddenMetadataUri",
        type: "string",
      },
    ],
    name: "setHiddenMetadataUri",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_maxMintAmountPerTx",
        type: "uint256",
      },
    ],
    name: "setMaxMintAmountPerTx",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_merkleRoot",
        type: "bytes32",
      },
    ],
    name: "setMerkleRoot",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_state",
        type: "bool",
      },
    ],
    name: "setPaused",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_state",
        type: "bool",
      },
    ],
    name: "setRevealed",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_uriPrefix",
        type: "string",
      },
    ],
    name: "setUriPrefix",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_uriSuffix",
        type: "string",
      },
    ],
    name: "setUriSuffix",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_state",
        type: "bool",
      },
    ],
    name: "setWhitelistMintEnabled",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "uriPrefix",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "uriSuffix",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
    ],
    name: "walletOfOwner",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "whitelistClaimed",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_mintAmount",
        type: "uint256",
      },
      {
        internalType: "bytes32[]",
        name: "_merkleProof",
        type: "bytes32[]",
      },
    ],
    name: "whitelistMint",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "whitelistMintEnable",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60a06040819052600060808190526200001b91600c916200025d565b5060408051808201909152600580825264173539b7b760d91b60209092019182526200004a91600d916200025d565b506012805462ffffff191660011790553480156200006757600080fd5b5060405162002b3d38038062002b3d8339810160408190526200008a91620003d0565b855186908690620000a39060029060208501906200025d565b508051620000b99060039060208401906200025d565b5050600160005550620000cc3362000103565b6001600955620000dc8462000155565b6010839055620000ec82620001a9565b620000f781620001f9565b505050505050620004ba565b600880546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b6008546001600160a01b03163314620001a45760405162461bcd60e51b8152602060048201819052602482015260008051602062002b1d83398151915260448201526064015b60405180910390fd5b600f55565b6008546001600160a01b03163314620001f45760405162461bcd60e51b8152602060048201819052602482015260008051602062002b1d83398151915260448201526064016200019b565b601155565b6008546001600160a01b03163314620002445760405162461bcd60e51b8152602060048201819052602482015260008051602062002b1d83398151915260448201526064016200019b565b80516200025990600e9060208401906200025d565b5050565b8280546200026b906200047d565b90600052602060002090601f0160209004810192826200028f5760008555620002da565b82601f10620002aa57805160ff1916838001178555620002da565b82800160010185558215620002da579182015b82811115620002da578251825591602001919060010190620002bd565b50620002e8929150620002ec565b5090565b5b80821115620002e85760008155600101620002ed565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200032b57600080fd5b81516001600160401b038082111562000348576200034862000303565b604051601f8301601f19908116603f0116810190828211818310171562000373576200037362000303565b816040528381526020925086838588010111156200039057600080fd5b600091505b83821015620003b4578582018301518183018401529082019062000395565b83821115620003c65760008385830101525b9695505050505050565b60008060008060008060c08789031215620003ea57600080fd5b86516001600160401b03808211156200040257600080fd5b620004108a838b0162000319565b975060208901519150808211156200042757600080fd5b620004358a838b0162000319565b965060408901519550606089015194506080890151935060a08901519150808211156200046157600080fd5b506200047089828a0162000319565b9150509295509295509295565b600181811c908216806200049257607f821691505b60208210811415620004b457634e487b7160e01b600052602260045260246000fd5b50919050565b61265380620004ca6000396000f3fe6080604052600436106102515760003560e01c8063715018a611610139578063b071401b116100b6578063d5abeb011161007a578063d5abeb011461069d578063db4bec44146106b3578063e0a80853146106e3578063e985e9c514610703578063efbd73f41461074c578063f2fde38b1461075f57600080fd5b8063b071401b1461060a578063b767a0981461062a578063b88d4fde1461064a578063c87b56dd1461066a578063d2cab0561461068a57600080fd5b806394354fd0116100fd57806394354fd01461059757806395d89b41146105ad578063a0712d68146105c2578063a22cb465146105d5578063a45ba8e7146105f557600080fd5b8063715018a61461050557806376ca49ae1461051a5780637cb64759146105395780637ec4a659146105595780638da5cb5b1461057957600080fd5b80633ccfd60b116101d2578063518302271161019657806351830227146104615780635503a0e8146104815780635c975abb1461049657806362b99ad4146104b05780636352211e146104c557806370a08231146104e557600080fd5b80633ccfd60b146103bf57806342842e0e146103d4578063438b6300146103f457806344a0d68a146104215780634fdd43cb1461044157600080fd5b806316ba10e01161021957806316ba10e01461032b57806316c38b3c1461034b57806318160ddd1461036b57806323b872dd146103895780632eb4a7ab146103a957600080fd5b806301ffc9a71461025657806306fdde031461028b578063081812fc146102ad578063095ea7b3146102e557806313faede614610307575b600080fd5b34801561026257600080fd5b50610276610271366004611f5f565b61077f565b60405190151581526020015b60405180910390f35b34801561029757600080fd5b506102a06107d1565b6040516102829190611fd4565b3480156102b957600080fd5b506102cd6102c8366004611fe7565b610863565b6040516001600160a01b039091168152602001610282565b3480156102f157600080fd5b5061030561030036600461201c565b6108a7565b005b34801561031357600080fd5b5061031d600f5481565b604051908152602001610282565b34801561033757600080fd5b506103056103463660046120d1565b610935565b34801561035757600080fd5b50610305610366366004612129565b61097f565b34801561037757600080fd5b5061031d600154600054036000190190565b34801561039557600080fd5b506103056103a4366004612144565b6109bc565b3480156103b557600080fd5b5061031d600a5481565b3480156103cb57600080fd5b506103056109c7565b3480156103e057600080fd5b506103056103ef366004612144565b610ac2565b34801561040057600080fd5b5061041461040f366004612180565b610add565b604051610282919061219b565b34801561042d57600080fd5b5061030561043c366004611fe7565b610c1d565b34801561044d57600080fd5b5061030561045c3660046120d1565b610c4c565b34801561046d57600080fd5b506012546102769062010000900460ff1681565b34801561048d57600080fd5b506102a0610c89565b3480156104a257600080fd5b506012546102769060ff1681565b3480156104bc57600080fd5b506102a0610d17565b3480156104d157600080fd5b506102cd6104e0366004611fe7565b610d24565b3480156104f157600080fd5b5061031d610500366004612180565b610d36565b34801561051157600080fd5b50610305610d84565b34801561052657600080fd5b5060125461027690610100900460ff1681565b34801561054557600080fd5b50610305610554366004611fe7565b610dba565b34801561056557600080fd5b506103056105743660046120d1565b610de9565b34801561058557600080fd5b506008546001600160a01b03166102cd565b3480156105a357600080fd5b5061031d60115481565b3480156105b957600080fd5b506102a0610e26565b6103056105d0366004611fe7565b610e35565b3480156105e157600080fd5b506103056105f03660046121df565b610f4a565b34801561060157600080fd5b506102a0610fe0565b34801561061657600080fd5b50610305610625366004611fe7565b610fed565b34801561063657600080fd5b50610305610645366004612129565b61101c565b34801561065657600080fd5b50610305610665366004612212565b611060565b34801561067657600080fd5b506102a0610685366004611fe7565b6110b1565b61030561069836600461228d565b611209565b3480156106a957600080fd5b5061031d60105481565b3480156106bf57600080fd5b506102766106ce366004612180565b600b6020526000908152604090205460ff1681565b3480156106ef57600080fd5b506103056106fe366004612129565b611462565b34801561070f57600080fd5b5061027661071e36600461230b565b6001600160a01b03918216600090815260076020908152604080832093909416825291909152205460ff1690565b61030561075a366004612335565b6114a8565b34801561076b57600080fd5b5061030561077a366004612180565b611594565b60006001600160e01b031982166380ac58cd60e01b14806107b057506001600160e01b03198216635b5e139f60e01b145b806107cb57506301ffc9a760e01b6001600160e01b03198316145b92915050565b6060600280546107e090612358565b80601f016020809104026020016040519081016040528092919081815260200182805461080c90612358565b80156108595780601f1061082e57610100808354040283529160200191610859565b820191906000526020600020905b81548152906001019060200180831161083c57829003601f168201915b5050505050905090565b600061086e8261162f565b61088b576040516333d1c03960e21b815260040160405180910390fd5b506000908152600660205260409020546001600160a01b031690565b60006108b282610d24565b9050806001600160a01b0316836001600160a01b031614156108e75760405163250fdee360e21b815260040160405180910390fd5b336001600160a01b038216148015906109075750610905813361071e565b155b15610925576040516367d9dca160e11b815260040160405180910390fd5b610930838383611668565b505050565b6008546001600160a01b031633146109685760405162461bcd60e51b815260040161095f90612393565b60405180910390fd5b805161097b90600d906020840190611eb0565b5050565b6008546001600160a01b031633146109a95760405162461bcd60e51b815260040161095f90612393565b6012805460ff1916911515919091179055565b6109308383836116c4565b6008546001600160a01b031633146109f15760405162461bcd60e51b815260040161095f90612393565b60026009541415610a445760405162461bcd60e51b815260206004820152601f60248201527f5265656e7472616e637947756172643a207265656e7472616e742063616c6c00604482015260640161095f565b60026009556000610a5d6008546001600160a01b031690565b6001600160a01b03164760405160006040518083038185875af1925050503d8060008114610aa7576040519150601f19603f3d011682016040523d82523d6000602084013e610aac565b606091505b5050905080610aba57600080fd5b506001600955565b61093083838360405180602001604052806000815250611060565b60606000610aea83610d36565b90506000816001600160401b03811115610b0657610b06612046565b604051908082528060200260200182016040528015610b2f578160200160208202803683370190505b50905060016000805b8482108015610b48575060005483105b15610c1257600083815260046020908152604091829020825160608101845290546001600160a01b0381168252600160a01b81046001600160401b031692820192909252600160e01b90910460ff16151591810182905290610bff5780516001600160a01b031615610bb957805191505b876001600160a01b0316826001600160a01b03161415610bff5783858481518110610be657610be66123c8565b602090810291909101015282610bfb816123f4565b9350505b83610c09816123f4565b94505050610b38565b509195945050505050565b6008546001600160a01b03163314610c475760405162461bcd60e51b815260040161095f90612393565b600f55565b6008546001600160a01b03163314610c765760405162461bcd60e51b815260040161095f90612393565b805161097b90600e906020840190611eb0565b600d8054610c9690612358565b80601f0160208091040260200160405190810160405280929190818152602001828054610cc290612358565b8015610d0f5780601f10610ce457610100808354040283529160200191610d0f565b820191906000526020600020905b815481529060010190602001808311610cf257829003601f168201915b505050505081565b600c8054610c9690612358565b6000610d2f826118b2565b5192915050565b60006001600160a01b038216610d5f576040516323d3ad8160e21b815260040160405180910390fd5b506001600160a01b03166000908152600560205260409020546001600160401b031690565b6008546001600160a01b03163314610dae5760405162461bcd60e51b815260040161095f90612393565b610db860006119d9565b565b6008546001600160a01b03163314610de45760405162461bcd60e51b815260040161095f90612393565b600a55565b6008546001600160a01b03163314610e135760405162461bcd60e51b815260040161095f90612393565b805161097b90600c906020840190611eb0565b6060600380546107e090612358565b80600081118015610e4857506011548111155b610e645760405162461bcd60e51b815260040161095f9061240f565b60105481610e79600154600054036000190190565b610e83919061243c565b1115610ea15760405162461bcd60e51b815260040161095f90612454565b8180600f54610eb0919061248b565b341015610ef45760405162461bcd60e51b8152602060048201526012602482015271496e73756666696369656e742066756e647360701b604482015260640161095f565b60125460ff1615610f405760405162461bcd60e51b8152602060048201526016602482015275151a194818dbdb9d1c9858dd081a5cc81c185d5cd95960521b604482015260640161095f565b6109303384611a2b565b6001600160a01b038216331415610f745760405163b06307db60e01b815260040160405180910390fd5b3360008181526007602090815260408083206001600160a01b03871680855290835292819020805460ff191686151590811790915590519081529192917f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31910160405180910390a35050565b600e8054610c9690612358565b6008546001600160a01b031633146110175760405162461bcd60e51b815260040161095f90612393565b601155565b6008546001600160a01b031633146110465760405162461bcd60e51b815260040161095f90612393565b601280549115156101000261ff0019909216919091179055565b61106b8484846116c4565b6001600160a01b0383163b1515801561108d575061108b84848484611a45565b155b156110ab576040516368d2bf6b60e11b815260040160405180910390fd5b50505050565b60606110bc8261162f565b6111085760405162461bcd60e51b815260206004820152601e60248201527f4d6574616461746120666f72206e6f6e6578697374656e7420746f6b656e0000604482015260640161095f565b60125462010000900460ff166111aa57600e805461112590612358565b80601f016020809104026020016040519081016040528092919081815260200182805461115190612358565b801561119e5780601f106111735761010080835404028352916020019161119e565b820191906000526020600020905b81548152906001019060200180831161118157829003601f168201915b50505050509050919050565b60006111b4611b3d565b905060008151116111d45760405180602001604052806000815250611202565b806111de84611b4c565b600d6040516020016111f2939291906124aa565b6040516020818303038152906040525b9392505050565b8260008111801561121c57506011548111155b6112385760405162461bcd60e51b815260040161095f9061240f565b6010548161124d600154600054036000190190565b611257919061243c565b11156112755760405162461bcd60e51b815260040161095f90612454565b8380600f54611284919061248b565b3410156112c85760405162461bcd60e51b8152602060048201526012602482015271496e73756666696369656e742066756e647360701b604482015260640161095f565b601254610100900460ff1661131f5760405162461bcd60e51b815260206004820181905260248201527f5468652077686974656c6973742073616c65206973206e6f7420656e61626c65604482015260640161095f565b336000908152600b602052604090205460ff161561137f5760405162461bcd60e51b815260206004820152601860248201527f4164647265737320616c726561647920636c696d656e64210000000000000000604482015260640161095f565b6040516bffffffffffffffffffffffff193360601b1660208201526000906034016040516020818303038152906040528051906020012090506113f985858080602002602001604051908101604052809392919081815260200183836020028082843760009201919091525050600a549150849050611c49565b6114365760405162461bcd60e51b815260206004820152600e60248201526d496e76616c69642070726f6f662160901b604482015260640161095f565b336000818152600b60205260409020805460ff1916600117905561145a9087611a2b565b505050505050565b6008546001600160a01b0316331461148c5760405162461bcd60e51b815260040161095f90612393565b60128054911515620100000262ff000019909216919091179055565b816000811180156114bb57506011548111155b6114d75760405162461bcd60e51b815260040161095f9061240f565b601054816114ec600154600054036000190190565b6114f6919061243c565b11156115145760405162461bcd60e51b815260040161095f90612454565b6008546001600160a01b0316331461153e5760405162461bcd60e51b815260040161095f90612393565b60125460ff161561158a5760405162461bcd60e51b8152602060048201526016602482015275151a194818dbdb9d1c9858dd081a5cc81c185d5cd95960521b604482015260640161095f565b6109308284611a2b565b6008546001600160a01b031633146115be5760405162461bcd60e51b815260040161095f90612393565b6001600160a01b0381166116235760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b606482015260840161095f565b61162c816119d9565b50565b600081600111158015611643575060005482105b80156107cb575050600090815260046020526040902054600160e01b900460ff161590565b60008281526006602052604080822080546001600160a01b0319166001600160a01b0387811691821790925591518593918516917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92591a4505050565b60006116cf826118b2565b9050836001600160a01b031681600001516001600160a01b0316146117065760405162a1148160e81b815260040160405180910390fd5b6000336001600160a01b03861614806117245750611724853361071e565b8061173f57503361173484610863565b6001600160a01b0316145b90508061175f57604051632ce44b5f60e11b815260040160405180910390fd5b6001600160a01b03841661178657604051633a954ecd60e21b815260040160405180910390fd5b61179260008487611668565b6001600160a01b038581166000908152600560209081526040808320805467ffffffffffffffff198082166001600160401b0392831660001901831617909255898616808652838620805493841693831660019081018416949094179055898652600490945282852080546001600160e01b031916909417600160a01b4290921691909102178355870180845292208054919390911661186657600054821461186657805460208601516001600160401b0316600160a01b026001600160e01b03199091166001600160a01b038a16171781555b50505082846001600160a01b0316866001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a45b5050505050565b604080516060810182526000808252602082018190529181019190915281806001111580156118e2575060005481105b156119c057600081815260046020908152604091829020825160608101845290546001600160a01b0381168252600160a01b81046001600160401b031692820192909252600160e01b90910460ff161515918101829052906119be5780516001600160a01b031615611955579392505050565b5060001901600081815260046020908152604091829020825160608101845290546001600160a01b038116808352600160a01b82046001600160401b031693830193909352600160e01b900460ff16151592810192909252156119b9579392505050565b611955565b505b604051636f96cda160e11b815260040160405180910390fd5b600880546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b61097b828260405180602001604052806000815250611c5f565b604051630a85bd0160e11b81526000906001600160a01b0385169063150b7a0290611a7a90339089908890889060040161256e565b602060405180830381600087803b158015611a9457600080fd5b505af1925050508015611ac4575060408051601f3d908101601f19168201909252611ac1918101906125ab565b60015b611b1f573d808015611af2576040519150601f19603f3d011682016040523d82523d6000602084013e611af7565b606091505b508051611b17576040516368d2bf6b60e11b815260040160405180910390fd5b805181602001fd5b6001600160e01b031916630a85bd0160e11b1490505b949350505050565b6060600c80546107e090612358565b606081611b705750506040805180820190915260018152600360fc1b602082015290565b8160005b8115611b9a5780611b84816123f4565b9150611b939050600a836125de565b9150611b74565b6000816001600160401b03811115611bb457611bb4612046565b6040519080825280601f01601f191660200182016040528015611bde576020820181803683370190505b5090505b8415611b3557611bf36001836125f2565b9150611c00600a86612609565b611c0b90603061243c565b60f81b818381518110611c2057611c206123c8565b60200101906001600160f81b031916908160001a905350611c42600a866125de565b9450611be2565b600082611c568584611c6c565b14949350505050565b6109308383836001611ce0565b600081815b8451811015611cd8576000858281518110611c8e57611c8e6123c8565b60200260200101519050808311611cb45760008381526020829052604090209250611cc5565b600081815260208490526040902092505b5080611cd0816123f4565b915050611c71565b509392505050565b6000546001600160a01b038516611d0957604051622e076360e81b815260040160405180910390fd5b83611d275760405163b562e8dd60e01b815260040160405180910390fd5b6001600160a01b038516600081815260056020908152604080832080546fffffffffffffffffffffffffffffffff1981166001600160401b038083168c0181169182176801000000000000000067ffffffffffffffff1990941690921783900481168c01811690920217909155858452600490925290912080546001600160e01b031916909217600160a01b429092169190910217905580808501838015611dd857506001600160a01b0387163b15155b15611e61575b60405182906001600160a01b038916906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef908290a4611e296000888480600101955088611a45565b611e46576040516368d2bf6b60e11b815260040160405180910390fd5b80821415611dde578260005414611e5c57600080fd5b611ea7565b5b6040516001830192906001600160a01b038916906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef908290a480821415611e62575b506000556118ab565b828054611ebc90612358565b90600052602060002090601f016020900481019282611ede5760008555611f24565b82601f10611ef757805160ff1916838001178555611f24565b82800160010185558215611f24579182015b82811115611f24578251825591602001919060010190611f09565b50611f30929150611f34565b5090565b5b80821115611f305760008155600101611f35565b6001600160e01b03198116811461162c57600080fd5b600060208284031215611f7157600080fd5b813561120281611f49565b60005b83811015611f97578181015183820152602001611f7f565b838111156110ab5750506000910152565b60008151808452611fc0816020860160208601611f7c565b601f01601f19169290920160200192915050565b6020815260006112026020830184611fa8565b600060208284031215611ff957600080fd5b5035919050565b80356001600160a01b038116811461201757600080fd5b919050565b6000806040838503121561202f57600080fd5b61203883612000565b946020939093013593505050565b634e487b7160e01b600052604160045260246000fd5b60006001600160401b038084111561207657612076612046565b604051601f8501601f19908116603f0116810190828211818310171561209e5761209e612046565b816040528093508581528686860111156120b757600080fd5b858560208301376000602087830101525050509392505050565b6000602082840312156120e357600080fd5b81356001600160401b038111156120f957600080fd5b8201601f8101841361210a57600080fd5b611b358482356020840161205c565b8035801515811461201757600080fd5b60006020828403121561213b57600080fd5b61120282612119565b60008060006060848603121561215957600080fd5b61216284612000565b925061217060208501612000565b9150604084013590509250925092565b60006020828403121561219257600080fd5b61120282612000565b6020808252825182820181905260009190848201906040850190845b818110156121d3578351835292840192918401916001016121b7565b50909695505050505050565b600080604083850312156121f257600080fd5b6121fb83612000565b915061220960208401612119565b90509250929050565b6000806000806080858703121561222857600080fd5b61223185612000565b935061223f60208601612000565b92506040850135915060608501356001600160401b0381111561226157600080fd5b8501601f8101871361227257600080fd5b6122818782356020840161205c565b91505092959194509250565b6000806000604084860312156122a257600080fd5b8335925060208401356001600160401b03808211156122c057600080fd5b818601915086601f8301126122d457600080fd5b8135818111156122e357600080fd5b8760208260051b85010111156122f857600080fd5b6020830194508093505050509250925092565b6000806040838503121561231e57600080fd5b61232783612000565b915061220960208401612000565b6000806040838503121561234857600080fd5b8235915061220960208401612000565b600181811c9082168061236c57607f821691505b6020821081141561238d57634e487b7160e01b600052602260045260246000fd5b50919050565b6020808252818101527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604082015260600190565b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052601160045260246000fd5b6000600019821415612408576124086123de565b5060010190565b602080825260139082015272125b9d985b1a59081b5a5b9d08185b5bdd5b9d606a1b604082015260600190565b6000821982111561244f5761244f6123de565b500190565b6020808252601f908201527f546f74616c20737570706c792065786365656473206d617820737570706c7900604082015260600190565b60008160001904831182151516156124a5576124a56123de565b500290565b6000845160206124bd8285838a01611f7c565b8551918401916124d08184848a01611f7c565b8554920191600090600181811c90808316806124ed57607f831692505b85831081141561250b57634e487b7160e01b85526022600452602485fd5b80801561251f57600181146125305761255d565b60ff1985168852838801955061255d565b60008b81526020902060005b858110156125555781548a82015290840190880161253c565b505083880195505b50939b9a5050505050505050505050565b6001600160a01b03858116825284166020820152604081018390526080606082018190526000906125a190830184611fa8565b9695505050505050565b6000602082840312156125bd57600080fd5b815161120281611f49565b634e487b7160e01b600052601260045260246000fd5b6000826125ed576125ed6125c8565b500490565b600082821015612604576126046123de565b500390565b600082612618576126186125c8565b50069056fea2646970667358221220a07f60897c85d85ab4e539ab2718a64cec08c94e0e37f6402a4cfad9735d28bb64736f6c634300080900334f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572";

type DemoTokenNft1ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: DemoTokenNft1ConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class DemoTokenNft1__factory extends ContractFactory {
  constructor(...args: DemoTokenNft1ConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _tokenName: string,
    _tokenSymbol: string,
    _cost: BigNumberish,
    _maxSupply: BigNumberish,
    _maxMintAmountPerTx: BigNumberish,
    _hiddenMetadataUri: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<DemoTokenNft1> {
    return super.deploy(
      _tokenName,
      _tokenSymbol,
      _cost,
      _maxSupply,
      _maxMintAmountPerTx,
      _hiddenMetadataUri,
      overrides || {}
    ) as Promise<DemoTokenNft1>;
  }
  override getDeployTransaction(
    _tokenName: string,
    _tokenSymbol: string,
    _cost: BigNumberish,
    _maxSupply: BigNumberish,
    _maxMintAmountPerTx: BigNumberish,
    _hiddenMetadataUri: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _tokenName,
      _tokenSymbol,
      _cost,
      _maxSupply,
      _maxMintAmountPerTx,
      _hiddenMetadataUri,
      overrides || {}
    );
  }
  override attach(address: string): DemoTokenNft1 {
    return super.attach(address) as DemoTokenNft1;
  }
  override connect(signer: Signer): DemoTokenNft1__factory {
    return super.connect(signer) as DemoTokenNft1__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): DemoTokenNft1Interface {
    return new utils.Interface(_abi) as DemoTokenNft1Interface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): DemoTokenNft1 {
    return new Contract(address, _abi, signerOrProvider) as DemoTokenNft1;
  }
}