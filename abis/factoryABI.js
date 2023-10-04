const factoryABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
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
        indexed: false,
        internalType: "address",
        name: "poolAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "deployerAddress",
        type: "address",
      },
    ],
    name: "poolCreated",
    type: "event",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_tokenAmount", type: "uint256" },
      {
        internalType: "uint256",
        name: "_liquidityPercentage",
        type: "uint256",
      },
    ],
    name: "calcRequiredTokenAmount",
    outputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "claimFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_presale", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
      { internalType: "address", name: "_contributor", type: "address" },
    ],
    name: "contributeForUser",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "poolAddress", type: "address" },
          {
            internalType: "contract IERC20",
            name: "tokenAddress",
            type: "address",
          },
          { internalType: "uint256", name: "sellAmount", type: "uint256" },
          { internalType: "uint256", name: "acceptedTokens", type: "uint256" },
          { internalType: "uint256", name: "softcap", type: "uint256" },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          {
            internalType: "uint256",
            name: "minimumBuyAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maximumBuyAmount",
            type: "uint256",
          },
          { internalType: "uint256", name: "lockupPeriod", type: "uint256" },
          {
            internalType: "uint256",
            name: "liquidityPercentage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "referralPercentage",
            type: "uint256",
          },
          { internalType: "bool", name: "_isPancakeRouter", type: "bool" },
          { internalType: "bool", name: "_whitelistEnabled", type: "bool" },
        ],
        internalType: "struct FairLaunchFactory.PoolInfo",
        name: "_poolInfo",
        type: "tuple",
      },
      {
        internalType: "address[]",
        name: "_whitelistAddresses",
        type: "address[]",
      },
    ],
    name: "createPool",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "launchPools",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "managerWallet",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "poolCreationFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
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
    inputs: [{ internalType: "address", name: "_manager", type: "address" }],
    name: "setManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_poolCreationFee", type: "uint256" },
    ],
    name: "setPoolCreationFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20",
        name: "_tokenAddress",
        type: "address",
      },
    ],
    name: "withdrawTokenFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

module.exports = factoryABI;
