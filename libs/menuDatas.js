const { isLocationBody } = require("grammy-inline-menu/dist/source/body");

const menuData = [
  {
    text: 'Owner Menu',
    name: 'owner-menu',
    submenu: [
      {
        text: "Create a Fair Launch",
        name: "create",
        submenu: [
          {
            text: "⚙️ Token Setup",
            name: "token-setup",
            submenu: [
              { text: "Token Address", name: 'token-address', variable: "token_address" },
              {
                text: "💵 Payment Currency",
                name: "payment-currency",
                variable: "accepted_currency",
                type: "select",
                choices: ["ETH", "USDT", "BLAZEX"],
                isRow: true,
              },
              {
                text: "✅ Chain",
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
                text: "✅ Router",
                variable: "router",
                isRow: true,
                name: "router",
                type: "select",
                choices: ["Uniswap", "PancakeSwap"],
              },
              { text: "Liquidity Ratio", variable: "liquidityPercentage" },
              {
                text: "✅ Refund type",
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
                variable: "lockupPeriod",
                isLast: true,
              },
            ],
          },
          {
            text: "⚙️ Presale Information",
            name: "presale-information",
            submenu: [
              { text: "Logo URL", variable: "logoURL" },
              { text: "* Website", variable: "websiteURL", isRow: true },
              { text: "* Telegram", variable: "telegramURL" },
              { text: "* Twitter", variable: "twitterURL", isRow: true },
              { text: "Facebook", variable: "facebookURL", isRow: true },
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
            isUserPart: false,
            isLast: true,
          },
        ],
      },
      {
        text: "My presales",
        name: "my-presales",
      },
      {
        text: "⚙️ Presale Settings",
        name: "presale-settings",
        isRow: true,
        submenu: [
          { text: "Claim Settings", name: "claim-settings" },
          { text: "Refund", name: "refund-menu", isRow: true },
          { text: "Finalize Presale", name: "finalize-presale", isLast: true },
        ],
        isLast: true,
      },
    ]
  },
  {
    text: 'User Menu',
    name: 'user-menu',
    isLast : true,
    submenu: [{
      text: "Browse Projects",
      name: "browse-projects",
      isRow: true,
      submenu: [
        {
          text: "Find a presale",
          name: "find-project",
        },
        {
          text: "Live Presales",
          name: "live-presales",
          isRow: true,
        },
        {
          text: "Upcoming Presales",
          name: "upcoming-presales",
        },
        {
          text : "Saved Presales",
          name : "saved-presales",
          isRow: true,
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
          isUserPart: true,
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
        },
        { text: "Claim", name: "claim", isRow:true, isLast: true },
      ],
      isLast: true,
    },]
  }
];

module.exports = { menuData };
