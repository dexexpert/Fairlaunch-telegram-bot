const { isLocationBody } = require("grammy-inline-menu/dist/source/body");

const ownerMenuData = [
  {
    text: "Create a Fair Launch",
    name: "create",
    submenu: [
      {
        text: "⚙️ Token Setup",
        name: "token-setup",
        submenu: [
          { text: "Token Address", variable: "token_address" },
          {
            text: "💵 Payment Currency",
            name: "payment-currency",
            variable: "accepted_currency",
            type: "select",
            choices: ["ETH", "USDT", "BLAZEX"],
            isRow: true,
          },
          {
            text: "Chain",
            variable: "chain",
            name: "chain",
            type: "select",
            choices: ["Ethereum", "Binance"],
          },
          {
            text: "Enable Whitelist",
            variable: "whitelist_enabled",
            type: "toggle",
            isRow: true,
          },
          {
            text: "Affiliate Programm",
            variable: "referralEnabled",
            type: "toggle",
            isLast: true,
          },
        ],
      },
      {
        text: "⚙️ Presale Configuration",
        name: "presale-configuration",
        isRow: true,
        submenu: [
          { text: "Total Selling Amount", variable: "sellAmount" },
          { text: "Softcap", variable: "softcap", isRow: true },
          { text: "Min Buy", variable: "minimumBuyAmount", isRow: true },
          { text: "Max Buy", variable: "maximumBuyAmount" },
          {
            text: "Router",
            variable: "router",
            isRow: true,
            name: "router",
            type: "select",
            choices: ["Uniswap", "PancakeSwap"],
          },
          { text: "Liquidity Ratio", variable: "liquidityPercentage" },
          {
            text: "Refund type",
            name: "refund-type",
            variable: "refundType",
            type: "select",
            choices: ["Burn", "Refund Token"],
            isRow: true,
          },
          { text: "Start time", variable: "startTime" },
          { text: "End time", variable: "endTime", isRow: true },
          {
            text: "Liquidity Lockup Days",
            variable: "lockupperiod",
            isLast: true,
          },
        ],
      },
      {
        text: "⚙️ Presale Information",
        name: "presale-information",
        submenu: [
          { text: "Logo URL", variable: "logoURL" },
          { text: "Website", variable: "websiteURL", isRow: true },
          { text: "Telegram", variable: "telegramURL" },
          { text: "Twitter", variable: "twitterURL", isRow: true },
          { text: "Github", variable: "githubURL" },
          { text: "Discord", variable: "discordURL", isRow: true },
          { text: "Instagram", variable: "instagramURL" },
          { text: "Reddit", variable: "redditURL", isRow: true },
          { text: "Preview", variable: "preview" },
          {
            text: "Description",
            variable: "description",
            isRow: true,
            isLast: true,
          },
        ],
      },
      {
        text: "⏫ Review & Launch",
        type: "launch",
        name: "review-launch",
        isRow: true,
        isLast: true,
        // submenu: [{ text: "Launch", type:"launch", isRow: true }],
      },
    ],
  },
  {
    text: "Import Wallet",
    name: "import-wallet",
    isRow: true,
    submenu: [
      {
        text: "Create a Wallet",
        name: "create-wallet",
      },
      {
        text: "Import Wallet",
        name: "import-wallet",
        variable: "importedWallet",
        isRow: true,
      },
      {
        text: "Manage Wallets",
        name: "manage-wallet",
        isLast: true,
      },
    ],
  },
  {
    text: "My presales",
    name: "my-presales",
    submenu: [
      { text: "Ongoing Presales", name: "ongoing-presales" },
      {
        text: "Finished Presales",
        name: "finished-presales",
        isRow: true,
        isLast: true,
      },
    ],
  },
  {
    text: "⚙️ Presale Settings",
    name: "presale-settings",
    isRow: true,
    submenu: [
      { text: "Claim Settings", name: "claim-settings" },
      { text: "Refund Menu", name: "refund-menu", isRow: true },
      { text: "Finalize Presale", name: "finalze-presale", isLast: true },
    ],
    isLast: true,
  },
];

const userMenuData = [
  {
    text: "Browse Projects",
    name: "browse-projects",
    isRow: true,
    submenu: [
      {
        text: "Find a presale",
        name: "find-presale",
        submenu: [
          { text: "Find Project", name: "find-project" },
          { text: "Search", name: "search", isRow: true, isLast: true },
        ],
      },
      {
        text: "Live Presales",
        name: "live-presales",
        isRow: true,
      },
      {
        text: "Upcoming Presales",
        name: "upcoming-presales",
        
        isLast: true,
      },
    ],
  },
  {
    text: "Wallets",
    name: "user-wallets",
    isRow: true,
    submenu: [
      {
        text: "Create a Wallet",
        name: "create-wallet",
      },
      {
        text: "Import Wallet",
        name: "import-wallet",
        variable: "importedWallet",
      },
      {
        text: "Manage Wallets",
        name: "manage-wallet",
        isRow: true,
        isLast: true,
      },
    ],
  },
  {
    text: "Contributions & Claim",
    name: "contribution-claim",
    isRow: true,
    submenu: [
      {
        text: "Contributions",
        name: "contributions",
        submenu: [
          {
            text: "1. Project 1",
            name: "contribution-project1",
          },
          {
            text: "2. Project 2",
            name: "contribution-project2",
          },
          {
            text: "3. Project 3",
            name: "contribution-project3",
            isLast: true,
          },
        ],
      },
      { text: "Claim", name: "claim", isLast: true },
    ],
    isLast: true,
  },
];

module.exports = { ownerMenuData, userMenuData };
