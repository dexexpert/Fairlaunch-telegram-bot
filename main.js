require("dotenv").config();
const { Web3, HttpProvider } = require("web3");
const ethUtil = require("ethereumjs-util");
const Wallet = require('ethereumjs-wallet');
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const TelegramBot = require("node-telegram-bot-api");
const { parseUnits, BigNumber } = require('ethers')
const { ethers } = require('ethers');
const factoryABI = require("./abis/factoryABI");
const fairlaunchAbi = require("./abis/FairLaunch");
const tokenAbi = require("./abis/tokenAbi");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const {
  isValidEthereumAddress,
  isNumber,
  isValidURL,
  isValidPrivateKey,
  isValidDate,
} = require("./libs/validators");
const { menuData } = require("./libs/menuDatas");
const { replyReviewLaunch, getPresaleInformation, replyReviewMessage } = require("./libs/actions");
const getTotalBalance = require("./libs/walletFuncs");
const HDWalletProvider = require("@truffle/hdwallet-provider");
// ERC-20 Token ABI with only the necessary parts for fetching name and symbol

const factoryAddress = {
  Binance: "0xc563971e19bfc8C6aFDB64c8853127eF9b25AFc8",
  Ethereum: "0xEc0621b3c82E0921DFF4e2E6F9f415dB42666368",
};

// Your Ethereum node's RPC URL (could be local, Infura, Alchemy, etc.)
const providerURL = {
  Binance: "https://bsc-testnet.publicnode.com",
  Ethereum: "https://goerli.infura.io/v3/81f1f856e5854cda96f939fe2a658c40",
};

const { Bot, InlineKeyboard } = require("grammy");
const { Menu } = require("@grammyjs/menu");
const mongoose = require("mongoose");
const mongoUri = "mongodb+srv://kham:eWgvFVyLVMknCK2@cluster0.0kwh7.mongodb.net/";

mongoose
  .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected successfully to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection failed", err);
  });

const Schema = mongoose.Schema;

const poolInfoSchema = new Schema({
  poolAddress: String,
  deployerAddress: String,
  deployerUsername: String,
  token_address: String,
  token_name: String,
  token_symbol: String,
  accepted_currency: String,
  chain: String,
  sellAmount: Number,
  softcap: Number,
  minimumBuyAmount: Number,
  maximumBuyAmount: Number,
  whitelist_enabled: Boolean,
  referralEnabled: Boolean,
  router: String,
  refundType: String,
  liquidityPercentage: Number,
  startTime: Number,
  endTime: Number,
  lockupPeriod: Number,
  logoURL: String,
  websiteURL: String,
  twitterURL: String,
  telegramURL: String,
  facebookURL: String,
  discordURL: String,
  githubURL: String,
  instagramURL: String,
  redditURL: String,
  preview: String,
  description: String,
});

const contributionDataSchema = new Schema({
  userWallet: String,
  poolAddress: String,
  contributionAmount: Number,
  contributionTime: Number,
  claimed: Boolean,
});

const ownerInfoSchema = new Schema({
  ownerUsername: String,
  ownerWallets: [String],
});

const userStuckedMessageSchema = new Schema({
  ownerUsername: String,
  stuckedMessageIds: [String],
});

const PoolInfo = mongoose.model("PoolInfo", poolInfoSchema);
const OwnerInfo = mongoose.model("OwnerInfo", ownerInfoSchema);
const ContributionInfo = mongoose.model("ContributionInfo", contributionDataSchema);

const bot = new Bot(process.env.BOT_TOKEN);

const sessions = {};
function formatDate(date1) {
  const date = new Date(date1 * 1000);
  const year = date.getFullYear();

  // JavaScript's getMonth() function returns month index starting from 0 (0 = January, 1 = February, ...)
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getSession(userId) {
  if (!sessions[userId]) {
    sessions[userId] = {
      today_messages: [],
      stucked_messages: [],
      token_address: {
        value: undefined,
        category: "setup",
        invalid_description: "Please input valid token address",
      },
      token_name: {
        value: undefined,
        category: "setup",
        validation: (val) => {
          return val !== undefined;
        },
        invalid_description: "Please input valid token name",
      },
      token_symbol: {
        value: undefined,
        category: "setup",
        validation: (val) => {
          return val !== undefined;
        },
        invalid_description: "Please input valid token symbol",
      },
      token_supply: {
        value: undefined,
        category: "setup",
        validation: (val) => {
          return val !== undefined;
        }
      },
      token_decimals: {
        value: undefined,
        category: "setup",
        validation: (val) => {
          return val !== undefined;
        }
      },
      accepted_currency: {
        value: "BNB",
        category: "setup",
        validation: (val) => {
          return true;
        },
        invalid_description: "Please input valid currency",
      }, // ETH USDT BLAZEX
      chain: {
        value: "Binance",
        category: "setup",
        validation: (val) => {
          return true;
        },
        invalid_description: "Please input valid chain",
      },
      sellAmount: {
        value: undefined,
        category: "configuration",
        // validation: (val) => {
        //   return val !== undefined && isNumber(val) && val > 0;
        // },
        invalid_description: "1. Must input valid Number\n2. Must Have Added The Contract In the Token Address\n3. Must have connected wallet first\n4.Must have enough Tokens of that Address in his wallet.",
      },
      softcap: {
        value: undefined,
        category: "configuration",
        validation: (val) => {
          return val !== undefined && isNumber(val);
        },
        invalid_description: "Please input valid number",
      },
      minimumBuyAmount: {
        value: undefined,
        category: "configuration",
        validation: (val) => {
          return val !== undefined && isNumber(val);
        },
        invalid_description: "Please input valid number",
      },
      maximumBuyAmount: {
        value: undefined,
        category: "configuration",
        invalid_description:
          "Please input valid number (must be greater than minimum buy amount)",
      },
      whitelist_enabled: {
        value: false,
        category: "setup",
        validation: (val) => {
          return val !== undefined;
        },
        invalid_description: "Please input true or false",
      },
      referralEnabled: {
        value: false,
        category: "setup",
        validation: (val) => {
          return val !== undefined;
        },
        invalid_description: "Please input true or false",
      },
      router: {
        value: "Uniswap",
        category: "configuration",
        validation: (val) => {
          return true;
        },
        invalid_description:
          "Please input valid string (Uniswap or PancakeSwap)",
      }, // Uniswap Pancakeswap
      refundType: {
        value: "Burn",
        category: "configuration",
        validation: (val) => {
          return true;
        },
        invalid_description: "Please input valid string (Burn or Refund)",
      },
      liquidityPercentage: {
        value: undefined,
        category: "configuration",
        validation: (val) => {
          if (val !== undefined && isNumber(val)) {
            return val >= 51;
          }
          return false;
        },
        invalid_description:
          "Please input valid number (percentage must be greater than 51)",
      },
      startTime: {
        value: undefined,
        category: "configuration",
        validation: (val) => {
          console.log("starttime", val);
          console.log("now time", Math.floor(Date.now() / 1000))
          if (val !== undefined && isNumber(val)) {
            return val > Math.floor(Date.now() / 1000);
          }
          return false;
        },
        invalid_description:
          "Please input valid number (timestamp must be after now)",
      },
      endTime: {
        value: undefined,
        category: "configuration",
        invalid_description:
          "Please input valid number (timestamp must be after now and before 7 days from start time)",
      },
      lockupPeriod: {
        value: undefined,
        validation: (val) => {
          if (val !== undefined && isNumber(val)) {
            return val >= 60;
          }
          return false;
        },
        category: "configuration",
        invalid_description:
          "Please input valid number (must be bigger than 60 days)",
      },
      logoURL: {
        value: undefined,
        validation: (val) => {
          return val !== undefined && isValidURL(val) && val.length > 0;
        },
        category: "information",
        invalid_description: "You need use https://",
      },
      websiteURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && val !== "" && isValidURL(val);
        },
        category: "information",
        invalid_description: "You need use https://",
      },
      twitterURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && val !== "" && isValidURL(val);
        },
        category: "information",
        invalid_description: "You need use https://",
      },
      telegramURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && val !== "" && isValidURL(val);
        },
        category: "information",
        invalid_description: "You need use https://",
      },
      facebookURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        category: "information",
        invalid_description: "You need use https://",
      },
      discordURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        category: "information",
        invalid_description: "You need use https://",
      },
      githubURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        category: "information",
        invalid_description: "You need use https://",
      },
      instagramURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        category: "information",
        invalid_description: "You need use https://",
      },
      redditURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        category: "information",
        invalid_description: "You need use https://",
      },
      preview: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        category: "information",
        invalid_description: "You need use https://",
      },
      description: {
        value: "",
        validation: (val) => {
          return true;
        },
        category: "information",
        invalid_description: "Please input valid string",
      },
      importedWallet: {
        value: "",
        validation: (val) => {
          return isValidPrivateKey(val);
        },
        invalid_description: "Please input valid private key",
      },
      wallets: [],
      amountToContribute: 0,
      isExpectingAnswer: "",
      selectedWallet: 1,
      isAuth: false,
    };
    sessions[userId].token_address.validation = async (val) => {
      if (val === undefined || isValidEthereumAddress(val) === false) {
        sessions[userId].token_address.invalid_description = "⚠️ Please input valid address";
        return false;
      }
      console.log("valid address");
      if (sessions[userId].wallets.length === 0)
        return false;
      const privateKey = sessions[userId].wallets[sessions[userId].selectedWallet - 1];
      // Setup provider with the private key
      const provider = new HDWalletProvider(
        {
          privateKeys: [privateKey],
          providerOrUrl:
            providerURL[sessions[userId].chain.value]
        }
      );

      const web3 = new Web3(provider);

      const sender = getCurrentWalletPublicKey(sessions[userId]);
      try {
        const tokenContract = new web3.eth.Contract(
          tokenAbi,
          val
        );
        const result = await tokenContract.methods.balanceOf(sender).call({ from: sender });
        if (result == 0 || result === '0n') {
          sessions[userId].token_address.invalid_description = "⚠️ The contract exists, but you don't have any tokens in your wallet.";
          return false;
        }
      }
      catch (err) {
        console.log(err);
        return false;
      }

      return true;
    }
    sessions[userId].endTime.validation = (val) => {
      if (isNumber(val)) {
        return (
          val > Math.floor(Date.now() / 1000) &&
          val > sessions[userId].startTime.value &&
          val < sessions[userId].startTime.value + 7 * 24 * 3600
        );
      }
      return false;
    };

    sessions[userId].maximumBuyAmount.validation = (val) => {
      if (val === undefined) return true;
      if (isNumber(val)) {
        const minimumVal = sessions[userId].minimumBuyAmount.value === undefined ? '0' : sessions[userId].minimumBuyAmount.value;
        console.log("minimum", minimumVal);
        console.log("max", BigInt(val));
        console.log("min", BigInt(minimumVal));
        return val === 0 || BigInt(val) > BigInt(minimumVal);
      }
      return false;
    };

    sessions[userId].sellAmount.validation = async (val) => {
      if (val === undefined || isNumber(val) === false || val <= 0) {
        sessions[userId].sellAmount.invalid_description = "⚠️ Please input valid number";
        return false;
      }
      else if (sessions[userId].token_address.value === undefined) {
        sessions[userId].sellAmount.invalid_description = "⚠️ Must have added the contract in the Token Address";
        return false;
      }
      else if (sessions[userId].wallets.length === 0) {
        sessions[userId].sellAmount.invalid_description = "⚠️ Must have connected wallet first!";
        return false;
      }
      else {
        const privateKey = sessions[userId].wallets[sessions[userId].selectedWallet - 1];
        // Setup provider with the private key
        const provider = new HDWalletProvider(
          {
            privateKeys: [privateKey],
            providerOrUrl:
              providerURL[sessions[userId].chain.value]
          }
        );

        const web3 = new Web3(provider);
        const sender = getCurrentWalletPublicKey(sessions[userId]);

        const tokenContract = new web3.eth.Contract(
          tokenAbi,
          sessions[userId].token_address.value
        );

        const result = await tokenContract.methods.balanceOf(sender).call({ from: sender });
        if (result < val) {
          sessions[userId].sellAmount.invalid_description = "⚠️ Must have enough tokens of that address in his wallet";
          return false;
        }
        sessions[userId].sellAmount.invalid_description = "1. Must input valid Number\n2. Must Have Added The Contract In the Token Address\n3. Must have connected wallet first\n4.Must have enough Tokens of that Address in his wallet.";
        return true;
      }
      return true;
    }
  }
  return sessions[userId];
}


function checkPassword(pwd, ctxId) {
}

function encryptAndSavePWD(userPWD, ctxId) {
  bcrypt.hash(userPassword, saltRounds, function (err, hash) {
    if (err) throw err;

    // Save the hash in MongoDB
    // ... your MongoDB saving code here ...

  });
}
// 0x137bf66ebb4e4796491e7a0ed4ea8334b54f5bbe
function encryptPK(pk) {
}

function decryptPK(password, enc_pk) {
}

function getCurrentWalletPublicKey(session) {
  if (session.wallets.length === 0) return "";
  const privateKeyHex = session.wallets[session.selectedWallet - 1].slice(2);

  // Convert the private key string to a Buffer
  const privateKey = Buffer.from(privateKeyHex, "hex");

  // Get the public key
  const publicKey = ethUtil.privateToPublic(privateKey);

  // Derive the Ethereum address
  const address = ethUtil.publicToAddress(publicKey);

  // Convert the address to its hexadecimal representation
  const addressHex = ethUtil.bufferToHex(address);
  return addressHex;
}

function getWalletPublicKeyFromindex(session, index) {
  if (session.wallets.length === 0) return "";
  const privateKeyHex = session.wallets[Number(index) - 1].slice(2);

  // Convert the private key string to a Buffer
  const privateKey = Buffer.from(privateKeyHex, "hex");

  // Get the public key
  const publicKey = ethUtil.privateToPublic(privateKey);

  // Derive the Ethereum address
  const address = ethUtil.publicToAddress(publicKey);

  // Convert the address to its hexadecimal representation
  const addressHex = ethUtil.bufferToHex(address);
  return addressHex;
}

async function contributionAction(ctx, session) {
  let sentMessageId = undefined;
  if (session.wallets.length === 0) {
    sentMessageId = await ctx.reply(
      "⛔️ No wallets selected and can't load your presale info"
    );
  } else {
    ContributionInfo.find({ userWallet: getCurrentWalletPublicKey(session) })
      .then(async contributions => {
        if (contributions.length > 0) {
          const projectsInlineKeyboard = new InlineKeyboard();
          for (const contributionItem of contributions) {
            PoolInfo.findOne({ poolAddress: contributionItem.poolAddress, chain: session.chain.value })
              .then(async (pools) => {
                if (pools === null) {
                  sentMessageId = await ctx.reply(`⚠️ No result! for ${contributionItem.poolAddress}`);
                } else {
                  const privateKey = session.wallets[session.selectedWallet - 1];
                  // Setup provider with the private key
                  const provider = new HDWalletProvider({
                    privateKeys: [privateKey],
                    providerOrUrl: providerURL[session.chain.value],
                  });

                  const web3 = new Web3(provider);

                  const accounts = await web3.eth.getAccounts();
                  const sender = accounts[0];
                  const presaleContract = new web3.eth.Contract(factoryABI, presale_address);
                  const isFinalized = await presaleContract.methods.isFinalized().call({ from: sender });
                  projectsInlineKeyboard.text(`${pools.token_name} - ${pools.accepted_currency} ${isFinalized === true ? '✅ You can claim' : ''}`, `userProject_${pools.chain}_${pools.poolAddress}`);
                }
              })
              .catch((err) => {
                console.log(err);
              });
          }
          sentMessageId = await ctx.reply(`Your contributed pools are her`, { reply_markup: projectsInlineKeyboard });
        } else {
          sentMessageId = await ctx.reply('⚠️ You have no contributed presales');
        }
      })
      .catch(async err => { console.log(err); sentMessageId = await ctx.reply(`⚠️ Failed fetching contributions`) })
  }
  if (sentMessageId !== undefined)
    session.today_messages.push(sentMessageId.message_id);
}

const main = new Menu("root-menu");

let ongoingPresaleMenu;
let tokenSetupMenu;
let presaleConfigurationMenu;
let presaleInformationMenu;
let currentMenuStatus;
let ownerMenu;
let userMenu;

const cancelInlineKeyboard = new InlineKeyboard().text(
  "cancel",
  "click-cancel-input"
);

async function ownerMenuMiddleware(ctx, next) {
  try {
    const session = getSession(ctx.from.id);
    await ctx.api.editMessageText(ctx.chat.id, session.today_messages[0], "Owner Menu", { parse_mode: 'HTML' })
  } catch (err) { console.log(err) };

  await next();
}

async function userMenuMiddleware(ctx, next) {
  try {
    const session = getSession(ctx.from.id);
    await ctx.api.editMessageText(ctx.chat.id, session.today_messages[0], "User menu", { parse_mode: 'HTML' })
  } catch (err) { console.log(err) };
  await next();
}

async function tokenSetupMiddleware(ctx, next) {
  try {
    const session = getSession(ctx.from.id);
    const showText = await replyReviewMessage(ctx, session, 'setup');
    await ctx.api.editMessageText(ctx.chat.id, session.today_messages[0], showText, { parse_mode: 'HTML' })
  } catch (err) { console.log(err) }
  await next();
}

async function configurationMiddleware(ctx, next) {
  const session = getSession(ctx.from.id);
  if (await session.token_address.validation(session.token_address.value) === true) {
    try {
      const showText = await replyReviewMessage(ctx, session, 'configuration');
      await ctx.api.editMessageText(ctx.chat.id, session.today_messages[0], showText, { parse_mode: 'HTML' })
    } catch (err) { console.log(err) }

    await next();
  } else {
    const sentMessageId = await ctx.reply("⚠️ You must add the Contract of Your Token first!");
    session.today_messages.push(sentMessageId.message_id);
  }
}

async function informationMiddleware(ctx, next) {
  const session = getSession(ctx.from.id);
  if (await session.token_address.validation(session.token_address.value) === true) {
    try {
      const showText = await replyReviewMessage(ctx, session, 'information');
      await ctx.api.editMessageText(ctx.chat.id, session.today_messages[0], showText, { parse_mode: 'HTML' })
    } catch (err) { console.log(err) }
    await next();
  } else {
    const sentMessageId = await ctx.reply("⚠️ You must add the Contract of Your Token first!");
    session.today_messages.push(sentMessageId.message_id);
  }
}

async function isTokenAddressValidated(ctx, next) {
  const session = getSession(ctx.from.id);
  if (await session.token_address.validation(session.token_address.value) === true) {
    await next();
  } else {
    const sentMessageId = await ctx.reply("⚠️ You must add the Contract of Your Token first!");
    session.today_messages.push(sentMessageId.message_id);
  }
}

async function backMiddleware(ctx, next) {
  const session = getSession(ctx.from.id);
  await removeAllMessages(ctx, 0);
  await ctx.editMessageText("Owner Menu");
  await next();
}
async function backMiddlewareOwnerMenu(ctx, next) {
  const session = getSession(ctx.from.id);
  await removeAllMessages(ctx, 0);
  await ctx.editMessageText("Main Menu");
  await next();
}

async function removeTextWhenBack(ctx, next) {
  const session = getSession(ctx.from.id);
  ctx.editMessageText("Owner Menu");
  await next();
}

function initiateSession(session) {
  const keysOfSession = Object.keys(session);
  for (const item of keysOfSession) {
    if (session[item].hasOwnProperty('validation') && item !== "accepted_currency" && item !== "chain" && item !== "router" && item!== "refundType" && item !== "whitelist_enabled" && item !== "referralEnabled") {
      console.log(item);
      session[item].value = undefined;
    }
  }
}

async function initiateOwnerMenu(submenu, menuData, stackedMenus) {
  if (Array.isArray(menuData)) {
    for (const item of menuData) {
      if ("submenu" in item) {
        const menu1 = new Menu(item.name);

        await initiateOwnerMenu(menu1, item.submenu, []);

        if (item.name === 'my-presales') {
          ongoingPresaleMenu = menu1;
        }
        else if (item.name === 'token-setup') {
          tokenSetupMenu = menu1;
        } else if (item.name === 'presale-configuration') {
          presaleConfigurationMenu = menu1;
        } else if (item.name === 'presale-information') {
          presaleInformationMenu = menu1;
        } else if (item.name === 'owner-menu') {
          ownerMenu = menu1;
        } else if (item.name === 'user-menu') {
          userMenu = menu1;
        }
        if (item.name === "presale-configuration") {
          submenu.text(item.text, configurationMiddleware, (ctx, next) => (ctx.menu.nav(item.name), next()));
        } else if (item.name === "presale-information") {
          submenu.text(item.text, informationMiddleware, (ctx, next) => (ctx.menu.nav(item.name), next()));
        } else if (item.name === "token-setup") {
          submenu.text(item.text, tokenSetupMiddleware, (ctx, next) => (ctx.menu.nav(item.name), next()));
        } else if (item.name === 'owner-menu') {
          submenu.text(item.text, ownerMenuMiddleware, (ctx, next) => (ctx.menu.nav(item.name), next()));
        } else if (item.name === 'user-menu') {
          submenu.text(item.text, userMenuMiddleware, (ctx, next) => (ctx.menu.nav(item.name), next()));
        } else {
          submenu.submenu(item.text, item.name);
        }
        stackedMenus.push(menu1);
        if ("isRow" in item) {
          submenu.row();
        }
        // main.register(menu1);
      } else {
        if ("type" in item && item.type === "select") {
          const choiceMenu = new Menu(item.name);
          for (const selectOption of item.choices) {
            choiceMenu.text(
              (ctx) => {
                if (ctx.from) {
                  const session = getSession(ctx.from.id);
                  if (item.name === "payment-currency") {
                    const session = getSession(ctx.from.id);
                    if (session.chain.value === "Binance") {
                      if (selectOption === 'ETH' && session[item.variable].value === 'BNB') {
                        return "✅ " + 'BNB';
                      }
                    } else {
                      if (selectOption === 'BNB' && session[item.variable].value === 'ETH') {
                        return "✅ " + 'ETH';
                      }
                    }
                  }
                  if (session[item.variable].value === selectOption) {
                    return "✅ " + selectOption;
                  }
                }
                return selectOption;
              },
              async (ctx) => {
                const session = getSession(ctx.from.id);
                session.isExpectingAnswer = "";
                if (session[item.variable].value !== selectOption) {
                  session[item.variable].value = selectOption;
                  const showText = await replyReviewMessage(ctx, session, session[item.variable].category);
                  ctx.editMessageText(showText, { parse_mode: 'HTML' });
                }
              }
            );
          }
          choiceMenu.back("⬅️ Go back");
          submenu.submenu(item.text, item.name);
          stackedMenus.push(choiceMenu);
          // main.register(choiceMenu);
        } else {
          submenu.text(
            async (ctx) => {
              if (ctx.from && "type" in item) {
                if (item.type === "toggle") {
                  const session = getSession(ctx.from.id);
                  if (session[item.variable].value === true) {
                    return "✅ " + item.text;
                  } else if (session[item.variable].value === false) {
                    return "🚫 " + item.text;
                  }
                }
              }
              else if (ctx.from && "variable" in item) {
                const session = getSession(ctx.from.id);
                if (session[item.variable]?.hasOwnProperty("validation")) {
                  // console.log(item.variable);
                  return ((session[item.variable].value !== undefined && session[item.variable].value !== '') ? "✅" : '') + item.text;
                }
              }
              return item.text;
            },
            async (ctx) => {
              let sentMessageId = undefined;
              if ("type" in item && item.type === "launch") {
                const session = getSession(ctx.from.id);
                const walletPubKey = getCurrentWalletPublicKey(session);
                const launchInlineKeyboard = new InlineKeyboard()
                  .text(`✅ Chain - ${session.chain.value}`, "chainReView")
                  .text(
                    `${walletPubKey === ""
                      ? "🚫 Please import wallet"
                      : "✅ " + walletPubKey
                    }`,
                    "walletReView"
                  )
                  .row()
                  .text("Launch", "launch")
                  .text("Cancel", "return")
                  .row()
                  .text('Return', 'return');
                const sentMessageId = await replyReviewLaunch(ctx, session, launchInlineKeyboard, true, undefined);
                console.log("review", sentMessageId);
                session.today_messages.push(sentMessageId.message_id);
              } else if ("variable" in item) {
                const session = getSession(ctx.from.id);
                session.isExpectingAnswer = "";
                session.current_menu = ctx.menu;
                // const resultValidation = await session.token_address.validation(session.token_address.value);
                removeAllMessages(ctx, 0);
                // if (item.name === "import-wallet" || item.name === "token-address" || resultValidation === true) {
                if ("type" in item && item.type === "toggle") {
                  session[item.variable].value = !session[item.variable].value;
                  const showText = await replyReviewMessage(ctx, session, session[item.variable].category);
                  ctx.editMessageText(showText, { parse_mode: 'HTML' });
                  // ctx.menu.update();
                } else {
                  session.isExpectingAnswer = item.variable;
                  if (session.isExpectingAnswer === "importedWallet") {
                    sentMessageId = await ctx.reply(
                      "Please input your private key do not share it to the others",
                      { reply_markup: { force_reply: true } }
                    );
                    session.stucked_messages.push(sentMessageId.message_id);
                  } else {
                    if (
                      item.variable === "startTime" ||
                      item.variable === "endTime"
                    ) {
                      sentMessageId = await ctx.reply(
                        `Timestamp Now is ${Date.now() / 1000
                        }\nCurrent Value is ${session[item.variable].value === undefined ||
                          session[item.variable].value === ""
                          ? "<b>Not Set</b>"
                          : formatDate(session[item.variable].value)
                        }\nPlease input in this format : YYYY-MM-DD HH:MM:SS`, { reply_markup: { force_reply: true }, parse_mode: "HTML" }
                      );
                      session.stucked_messages.push(sentMessageId.message_id)
                    } else {
                      if (session.wallets.length !== 0) {
                        sentMessageId = await ctx.reply(
                          `Please input ${item.text} - Current value is ${session[item.variable].value === undefined ||
                            session[item.variable].value === ""
                            ? "<b>Not Set</b>"
                            : session[item.variable].value
                          }`,
                          { reply_markup: { force_reply: true }, parse_mode: "HTML" }
                        );
                        session.stucked_messages.push(sentMessageId.message_id);
                      } else {
                        sentMessageId = await ctx.reply('⚠️ Please import or create wallet first!');
                        session.isExpectingAnswer = false;
                      }
                    }
                  }
                }
              } else {
                if (item.name == "manage-wallet") {
                  const inlineKeyboard = {
                    inline_keyboard: [
                      [
                        // { text: "Button 1", callback_data: "data_1" },
                        // { text: "Button 2", callback_data: "data_2" },
                      ],
                    ],
                  };
                  const session = getSession(ctx.from.id);
                  if (session.wallets.length === 0) {
                    sentMessageId = await ctx.reply("No wallets imported!", { reply_markup: main });
                  } else {
                    let cnt = 1;
                    for (const wallet of session.wallets) {
                      const button = {
                        text:
                          (cnt === session.selectedWallet ? "✅ " : "") +
                          "Wallet " +
                          cnt +
                          ` (${getWalletPublicKeyFromindex(session, cnt)})`,
                        callback_data: (item.isUserPart ? "user" : "owner") + "wallet_" + cnt,
                      };
                      if (cnt % 2 === 0) {
                        inlineKeyboard.inline_keyboard[inlineKeyboard.inline_keyboard.length - 1].push(button);
                      }
                      // If cnt is even (like 2, 4, 6...), add a new row and push the button to the new row
                      else {
                        inlineKeyboard.inline_keyboard.push([button]);
                      }
                      cnt++;
                    }
                    inlineKeyboard.inline_keyboard.push([{ text: 'Return', callback_data: 'return' }]);
                    sentMessageId = await ctx.reply("Please select wallet to manage", {
                      reply_markup: inlineKeyboard,
                    });
                  }
                } else if (item.name === "ongoing-presales") {
                  const session = getSession(ctx.from.id);
                  if (session.wallets.length === 0) {
                    sentMessageId = await ctx.reply(
                      "⛔️ No wallets selected and can't load your presale info"
                    );
                  } else {
                    const inlineKeyboard = {
                      inline_keyboard: [
                        [
                          // { text: "Button 1", callback_data: "data_1" },
                          // { text: "Button 2", callback_data: "data_2" },
                        ],
                      ],
                    };
                    const currentWallet =
                      session.wallets[session.selectedWallet - 1];
                    PoolInfo.find({ deployerAddress: currentWallet })
                      .then(async (pools) => {
                        const timestampInSeconds = Math.floor(
                          Date.now() / 1000
                        );
                        for (const pool of pools) {
                          if (
                            timestampInSeconds > pool.startTime &&
                            timestampInSeconds < pool.endTime
                          ) {
                            inlineKeyboard.inline_keyboard[0].push({
                              text: pool.token_name,
                              callback_data: "ongoing" + pool.chain + pool.poolAddress,
                            });
                          }
                        }
                        inlineKeyboard.inline_keyboard[0].push({ text: 'Return', callback_data: 'return' });
                        console.log(pools);
                        if (pools.length > 0) {
                          sentMessageId = await ctx.reply(
                            "Please make changes to your ongoing presale",
                            { reply_markup: inlineKeyboard }
                          );
                        } else {
                          sentMessageId = await ctx.reply("⚠️ No ongoing presale at the moment");
                        }
                        session.today_messages.push(sentMessageId.message_id);
                      })
                      .catch((err) => console.log(err));
                  }
                } else if (item.name === "finished-presales") {
                  const session = getSession(ctx.from.id);
                  if (session.wallets.length === 0) {
                    sentMessageId = await ctx.reply(
                      "⛔️ No wallets selected and can't load your presale info"
                    );
                  } else {
                    const inlineKeyboard = {
                      inline_keyboard: [
                        [
                          // { text: "Button 1", callback_data: "data_1" },
                          // { text: "Button 2", callback_data: "data_2" },
                        ],
                      ],
                    };
                    const currentWallet =
                      session.wallets[session.selectedWallet - 1];
                    PoolInfo.find({ deployerAddress: currentWallet })
                      .then(async (pools) => {
                        const timestampInSeconds = Math.floor(
                          Date.now() / 1000
                        );
                        for (const pool of pools) {
                          if (timestampInSeconds > pool.endTime) {
                            inlineKeyboard.inline_keyboard[0].push({
                              text: pool.token_name,
                              callback_data: "finished" + pool.poolAddress,
                            });
                          }
                        }
                        inlineKeyboard.inline_keyboard[0].push({ text: 'Return', callback_data: 'return' });
                        if (pools.length > 0) {
                          sentMessageId = await ctx.reply(
                            "Please make changes to your finished presale",
                            { reply_markup: inlineKeyboard }
                          );
                          session.today_messages.push(sentMessageId.message_id);
                        } else {
                          sentMessageId = await ctx.reply("⚠️ No finished presale at the moment");
                          session.today_messages.push(sentMessageId.message_id);
                        }
                      })
                      .catch((err) => console.log(err));
                  }
                } else if (item.name === "claim-settings") {
                  const session = getSession(ctx.from.id);
                  if (session.wallets.length === 0) {
                    sentMessageId = await ctx.reply(
                      "⛔️ No wallets selected and can't load your presale info"
                    );
                  } else {
                    const inlineKeyboard = {
                      inline_keyboard: [
                        [
                          // { text: "Button 1", callback_data: "data_1" },
                          // { text: "Button 2", callback_data: "data_2" },
                        ],
                      ],
                    };
                    const currentWallet =
                      session.wallets[session.selectedWallet - 1];
                    PoolInfo.find({ deployerAddress: currentWallet })
                      .then(async (pools) => {
                        const timestampInSeconds = Math.floor(
                          Date.now() / 1000
                        );
                        for (const pool of pools) {
                          if (timestampInSeconds < pool.endTime) {
                            inlineKeyboard.inline_keyboard[0].push({
                              text: pool.token_name,
                              callback_data: "claim" + pool.poolAddress,
                            });
                          }
                        }
                        inlineKeyboard.inline_keyboard[0].push({ text: 'Return', callback_data: 'return' });
                        if (pools.length > 0) {
                          sentMessageId = await ctx.reply("Please make changes to claim settings", {
                            reply_markup: inlineKeyboard,
                          });
                        } else {
                          sentMessageId = await ctx.reply("⚠️ No presales to edit claim settings");
                          // console.log("No presale", sentMessageId);
                          session.today_messages.push(sentMessageId.message_id)
                        }
                      })
                      .catch((err) => console.log(err));
                  }
                } else if (item.name === "refund-menu") {
                  const session = getSession(ctx.from.id);
                  if (session.wallets.length === 0) {
                    sentMessageId = await ctx.reply(
                      "⛔️ No wallets selected and can't load your presale info"
                    );
                  } else {
                    const inlineKeyboard = {
                      inline_keyboard: [
                        [
                          // { text: "Button 1", callback_data: "data_1" },
                          // { text: "Button 2", callback_data: "data_2" },
                        ],
                      ],
                    };
                    const currentWallet =
                      session.wallets[session.selectedWallet - 1];
                    PoolInfo.find({ deployerAddress: currentWallet })
                      .then(async (pools) => {
                        const timestampInSeconds = Math.floor(
                          Date.now() / 1000
                        );
                        for (const pool of pools) {
                          if (timestampInSeconds > pool.endTime) {
                            inlineKeyboard.inline_keyboard[0].push({
                              text: pool.token_name,
                              callback_data: "refund" + pool.poolAddress,
                            });
                          }
                        }
                        inlineKeyboard.inline_keyboard[0].push({ text: "Return", callback_data: 'return' });
                        if (pools.length > 0) {
                          sentMessageId = await ctx.reply(
                            "Please make changes to your finished presale",
                            { reply_markup: inlineKeyboard }
                          );
                        } else {
                          sentMessageId = await ctx.reply(
                            "⚠️ No finished presale to refund at the moment"
                          );
                        }
                        session.today_messages.push(sentMessageId.message_id)
                      })
                      .catch((err) => console.log(err));
                  }
                } else if (item.name === "finalize-presale") {
                  const session = getSession(ctx.from.id);
                  if (session.wallets.length === 0) {
                    sentMessageId = await ctx.reply(
                      "⛔️ No wallets selected and can't load your presale info"
                    );
                  } else {
                    const inlineKeyboard = {
                      inline_keyboard: [
                        [
                          // { text: "Button 1", callback_data: "data_1" },
                          // { text: "Button 2", callback_data: "data_2" },
                        ],
                      ],
                    };
                    const currentWallet =
                      session.wallets[session.selectedWallet - 1];
                    PoolInfo.find({ deployerAddress: currentWallet })
                      .then(async (pools) => {
                        const timestampInSeconds = Math.floor(
                          Date.now() / 1000
                        );
                        for (const pool of pools) {
                          if (timestampInSeconds > pool.endTime) {
                            inlineKeyboard.inline_keyboard[0].push({
                              text: pool.token_name,
                              callback_data: "finalize" + pool.poolAddress,
                            });
                          }
                        }
                        inlineKeyboard.inline_keyboard[0].push({ text: 'Return', callback_data: 'return' });
                        if (pools.length > 0) {
                          sentMessageId = await ctx.reply("Please finalize your finished presale", {
                            reply_markup: inlineKeyboard,
                          });
                        } else {
                          sentMessageId = await ctx.reply(
                            "⚠️ No finished presale to finalize at the moment"
                          );
                        }
                      })
                      .catch((err) => console.log(err));
                  }
                } else if (item.name === "find-project") {
                  const session = getSession(ctx.from.id);
                  session.isExpectingAnswer = "find-project";
                  sentMessageId = await ctx.reply(
                    "Search contract address, please input presale address."
                  );
                } else if (item.name === "search") {
                  const session = getSession(ctx.from.id);
                  session.isExpectingAnswer = "search";
                  sentMessageId = await ctx.reply(
                    "Search contract address, please input token address."
                  );
                } else if (item.name === "live-presales") {
                  const inlineKeyboard = {
                    inline_keyboard: [
                      [
                        // { text: "Button 1", callback_data: "data_1" },
                        // { text: "Button 2", callback_data: "data_2" },
                      ],
                    ],
                  };
                  PoolInfo.find({})
                    .then(async (pools) => {
                      const timestampInSeconds = Math.floor(Date.now() / 1000);
                      for (const pool of pools) {
                        if (
                          timestampInSeconds > pool.startTime &&
                          timestampInSeconds < pool.endTime
                        ) {
                          inlineKeyboard.inline_keyboard[0].push({
                            text: pool.token_name,
                            callback_data: "live" + pool.poolAddress,
                          });
                        }
                      }
                      inlineKeyboard.inline_keyboard[0].push({ text: 'Return', callback_data: 'return' })
                      console.log(pools);
                      if (pools.length > 0) {
                        sentMessageId = await ctx.reply("All live presales : ", {
                          reply_markup: inlineKeyboard,
                        });
                      } else {
                        sentMessageId = await ctx.reply("⚠️ No live presales at the moment");
                      }
                      session.today_messages.push(sentMessageId.message_id);
                    })
                    .catch((err) => console.log(err));
                } else if (item.name === "upcoming-presales") {
                  const inlineKeyboard = {
                    inline_keyboard: [
                      [
                        // { text: "Button 1", callback_data: "data_1" },
                        // { text: "Button 2", callback_data: "data_2" },
                      ],
                    ],
                  };
                  PoolInfo.find({})
                    .then(async (pools) => {
                      const timestampInSeconds = Math.floor(Date.now() / 1000);
                      for (const pool of pools) {
                        if (
                          timestampInSeconds < pool.startTime &&
                          timestampInSeconds < pool.endTime
                        ) {
                          inlineKeyboard.inline_keyboard[0].push({
                            text: pool.token_name,
                            callback_data: "upcoming" + pool.poolAddress,
                          });
                        }
                      }
                      inlineKeyboard.inline_keyboard[0].push({ text: 'Return', callback_data: 'return' });
                      console.log(pools);
                      if (pools.length > 0) {
                        sentMessageId = await ctx.reply("All upcoming presales : ", {
                          reply_markup: inlineKeyboard,
                        });
                      } else {
                        sentMessageId = await ctx.reply("⚠️ No upcoming presales at the moment");
                      }
                      session.today_messages.push(sentMessageId.message_id)
                    })
                    .catch((err) => console.log(err));
                } else if (item.name === "create-wallet") {
                  try {
                    // Generate a new Ethereum wallet
                    const wallet = Wallet['default'].generate();

                    // Get the private key (hex string)
                    const privateKey = wallet.getPrivateKeyString();

                    // Get the public key (hex string)
                    const publicKey = wallet.getPublicKeyString();

                    // Get the address (hex string)
                    const address = wallet.getAddressString();

                    const inlineKeyboardCreateWallet = new InlineKeyboard().text(`Deposit`, `deposit_${address}`).text(`Balance`, `balance_${address}`).row().text('Return', 'return');

                    console.log(`Private Key: ${privateKey}`);
                    console.log(`Public Key: ${publicKey}`);
                    console.log(`Address: ${address}`);

                    const session = getSession(ctx.from.id);

                    sentMessageId = await ctx.reply(`Successfully generated New Wallet!\n <b>Private key</b>: <b>${privateKey}</b>\n<b>Address</b>: <b>${address}</b>`, { parse_mode: "HTML", reply_markup: inlineKeyboardCreateWallet });
                    if (!session.wallets.includes(privateKey)) {
                      session.wallets.push(privateKey);
                    }
                    OwnerInfo.findOne({ ownerUsername: ctx.from.username })
                      .then((info) => {
                        console.log('info:', info);
                        if (info) {
                          OwnerInfo.updateOne(info, { ownerWallets: session.wallets })
                            .then((res) => {
                              console.log(`Update Owner ${ctx.from.username}`, res);
                            })
                            .catch((err) =>
                              console.log(
                                `Fail Owner Update ${ctx.from.username}`,
                                err
                              )
                            );
                        } else {
                          const newOwner = new OwnerInfo({
                            ownerUsername: ctx.from.username,
                            ownerWallets: session.wallets,
                          });
                          newOwner
                            .save()
                            .then((doc) => {
                              console.log(`New Owner ${ctx.from.username} saved`);
                            })
                            .catch((err) => {
                              console.log(
                                `New Owner ${ctx.from.username} save failed!!!`
                              );
                            });
                        }
                      })
                      .catch((err) => {
                        console.log("Owner find", err);
                      });
                  } catch (err) {
                    console.log(err);
                    sentMessageId = await ctx.reply('⚠️ Failed creation')
                  }
                } else if (item.name === "contributions") {
                  const session = getSession(ctx.from.id);
                  contributionAction(ctx, session);
                } else {
                  returnAction(ctx);
                }
              }
              const session = getSession(ctx.from.id);
              // console.log("before save : ", sentMessageId);
              if (sentMessageId !== undefined) {
                // console.log('adding today message', sentMessageId);
                session.today_messages.push(sentMessageId.message_id);
              }
            }
          );
        }
        if ("isRow" in item) {
          submenu.row();
        }
      }
      if ("isLast" in item) {
        // console.log("first for register", item.text);

        if (item.name !== "user-menu") {
          if (item.name !== "presale-settings" && item.name !== "contribution-claim")
            submenu.back("⬅️ Go back", backMiddleware);
          else
            submenu.back("⬅️ Go back", backMiddlewareOwnerMenu);
          submenu.text('↩️ Return', (ctx) => {
            returnAction(ctx);
          });
        }
        for (const menus of stackedMenus) {
          submenu.register(menus);
          // console.log(menus);
        }
        stackedMenus.length = 0;
      }
    }
  } else {
    submenu.text(menuData.text, async (ctx) => {
      const sentMessageId = await ctx.reply(`You pressed ${menuData.text}`)
      const session = getSession(ctx.from.id);
      session.today_messages.push(sentMessageId.message_id);
    }
    );
  }
}

async function waitForTransactionReceipt(txHash, session) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {

        const privateKey = session.wallets[session.selectedWallet - 1];
        // Setup provider with the private key
        const provider = new HDWalletProvider({
          privateKeys: [privateKey],
          providerOrUrl: providerURL[session.chain.value],
        });

        const web3 = new Web3(provider);

        const receipt = await web3.eth.getTransactionReceipt(txHash);
        if (receipt && receipt.status === true) {
          clearInterval(interval);
          resolve(receipt);
        } else if (receipt && receipt.status === false) {
          clearInterval(interval);
          reject(new Error("Transaction has failed."));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 5000); // Check every 5 seconds. You can adjust this value.
  });
}

// Your private key (make sure not to expose this in your code or anywhere public)

async function launchPool(privateKey, session, username) {
  try {
    const privateKey = session.wallets[session.selectedWallet - 1];
    // Setup provider with the private key
    const provider = new HDWalletProvider({
      privateKeys: [privateKey],
      providerOrUrl: providerURL[session.chain.value],
    });

    const web3 = new Web3(provider);

    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0];

    const tokenContract = new web3.eth.Contract(
      tokenAbi,
      session.token_address.value
    );
    await tokenContract.methods.approve(
      factoryAddress[session.chain.value],
      "115792089237316195423570985008687907853269984665640564039457"
    ).send({ from: sender });
    setTimeout(async () => {
      // Create a contract instance
      const contract = new web3.eth.Contract(
        factoryABI,
        factoryAddress[session.chain.value]
      );
      const accounts = await web3.eth.getAccounts();
      const sender = accounts[0];

      // Replace 'yourFunction' and arguments with your actual function and its parameters
      const response = await contract.methods
        .createPool(
          {
            poolAddress: sender,
            tokenAddress: session.token_address.value,
            sellAmount: session.sellAmount.value,
            acceptedTokens:
              session.accepted_currency.value === "ETH" || session.accepted_currency.value === "BNB"
                ? 0
                : session.accepted_currency.value === "USDT"
                  ? 1
                  : 2,
            softcap: session.softcap.value,
            startTime: session.startTime.value,
            endTime: session.endTime.value,
            minimumBuyAmount: session.minimumBuyAmount.value,
            maximumBuyAmount: session.maximumBuyAmount.value,
            lockupPeriod: session.lockupPeriod.value,
            liquidityPercentage: session.liquidityPercentage.value,
            referralPercentage: session.referralEnabled.value ? 3 : 0,
            _isPancakeRouter: session.router.value === "Uniswap" ? false : true,
            _whitelistEnabeld: session.whitelist_enabled.value,
          },
          [sender]
        )
        .send({ from: sender, value: "10000000000000000" });

      console.log(response);
      waitForTransactionReceipt(response.transactionHash, session)
        .then((receipt) => {
          console.log("Transaction confirmed", receipt);
          const event = receipt.events.poolCreated;
          if (event) {
            const poolAddress = event.returnValues.poolAddress;
            const newPoolInfo = new PoolInfo({
              poolAddress,
              deployerAddress: sender,
              deployerUsername: username,
              token_address: session.token_address.value,
              token_name: session.token_name.value,
              token_symbol: session.token_symbol.value,
              accepted_currency: session.accepted_currency.value,
              chain: session.chain.value,
              sellAmount:
                session.sellAmount.value === undefined ? 0 : session.sellAmount.value,
              softcap: session.softcap.value === undefined ? 0 : session.softcap.value,
              minimumBuyAmount:
                session.minimumBuyAmount.value === undefined
                  ? 0
                  : session.minimumBuyAmount.value,
              maximumBuyAmount:
                session.maximumBuyAmount.value === undefined
                  ? 0
                  : session.maximumBuyAmount.value,
              whitelist_enabled: session.whitelist_enabled.value,
              referralEnabled: session.referralEnabled.value,
              router: session.router.value,
              refundType: session.refundType.value,
              liquidityPercentage: session.liquidityPercentage.value,
              startTime: session.startTime.value,
              endTime: session.endTime.value,
              lockupPeriod: session.lockupPeriod.value,
              logoURL: session.logoURL.value,
              websiteURL: session.websiteURL.value,
              twitterURL: session.twitterURL.value,
              telegramURL: session.telegramURL.value,
              facebookURL: session.facebookURL.value,
              discordURL: session.discordURL.value,
              githubURL: session.githubURL.value,
              instagramURL: session.instagramURL.value,
              redditURL: session.redditURL.value,
              preview: session.preview.value,
              description: session.description.value,
            });
            newPoolInfo
              .save()
              .then((doc) => console.log(`Pool Info saved ${username}`, doc))
              .catch((err) =>
                console.log(`${username} Pool Info save failed`, err)
              );
          }
        })
        .catch((err) => console.log(err.message));
      // Close the provider
      provider.engine.stop();
    }, 10000);
  } catch (err) {
    console.log(err);
  }
}

async function cancelAndRefundFunc(PK, poolAddress, chain) {
  const provider = new HDWalletProvider({
    privateKeys: [PK],
    providerOrUrl: providerURL[chain],
  });

  const web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  const sender = accounts[0];

  const presaleContract = new web3.eth.Contract(fairlaunchAbi, poolAddress);
  try {
    await presaleContract.methods.cancelAndRefund().send({ from: sender });
  }
  catch (err) {
    console.log(err);
  }
}

async function finalizeAndAddLPFunc(PK, poolAddress, chain) {
  const provider = new HDWalletProvider({
    privateKeys: [PK],
    providerOrUrl: providerURL[chain],
  });

  const web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  const sender = accounts[0];

  const presaleContract = new web3.eth.Contract(fairlaunchAbi, poolAddress);
  try {
    await presaleContract.methods.finalize().send({ from: sender });
  }
  catch (err) {
    console.log(err);
  }
}

async function removeStuckedMessages(ctx, session) {
  try {
    for (const messageId of session.stucked_messages) {
      await ctx.api.deleteMessage(ctx.chat?.id, messageId);
    }

    //clear the list
    session.stucked_messages = [];
  } catch (err) {
    console.error('failed to delete message:', err);
  }
}

async function returnAction(ctx) {
  ctx.answerCallbackQuery({ text: 'Returning main menu' });
  const session = getSession(ctx.from.id);
  await removeAllMessages(ctx, 0);
  ctx.api.editMessageText(ctx.chat.id, session.today_messages[0], 'Main Menu', { reply_markup: main });
}

async function removeAllMessages(ctx, exceptedIndex = -1) {
  const session = getSession(ctx.from.id);
  try {
    let cnt = 0;
    let remainValue = -1;
    for (const messageId of session.today_messages) {
      try {
        if (exceptedIndex !== cnt) {
          await ctx.api.deleteMessage(ctx.chat?.id, messageId);
        } else {
          remainValue = messageId;
        }
      } catch (err) {
        console.log("failed delete message" + messageId, err);
      }

      cnt++;
    }
    if (exceptedIndex !== -1)
      session.today_messages = [remainValue];
    else
      session.today_messages = [];
  } catch (err) {
    console.error('failed to delete message', err);
  }
}

async function mainFunc() {
  try {
    await initiateOwnerMenu(main, menuData, []);

    // bot.use(isTokenAddressValidated);
    bot.use(main);

    // Set bot description (if needed)
    bot.api.setMyDescription("Start Fair Launch");

    // Start the bot after all menus have been set up with a 3-second delay
    setTimeout(() => {
      console.log("bot started");
      bot.start();
    }, 3000);

    bot.command("start", async (ctx) => {
      try {
        const session = getSession(ctx.from.id);
        session.today_messages.push(ctx.message.message_id);
        await removeAllMessages(ctx, -1);
        // ctx.session = initial();
        console.log(ctx.from.username);
        OwnerInfo.findOne({ ownerUsername: ctx.from.username })
          .then((ownerInfo) => {
            console.log(`ownerInfo : ${ownerInfo}`);
            const session = getSession(ctx.from.id);
            session.wallets = ownerInfo.ownerWallets;
          })
          .catch((err) => console.log(err));
        const sentMessageId = await ctx.reply("Main Menu:", { reply_markup: main });
        session.today_messages.push(sentMessageId.message_id);
      } catch (err) {
        console.log(err);
      }
    });
    bot.command("ownermenu", async (ctx) => {
      console.log("owner menu : ", ctx.from.username);
      const session = getSession(ctx.from.id);
      session.today_messages.push(ctx.message.message_id);
      await removeAllMessages(ctx, -1);
      OwnerInfo.findOne({ ownerUsername: ctx.from.username })
        .then((ownerInfo) => {
          console.log(`ownerInfo : ${ownerInfo}`);
          session.wallets = ownerInfo.ownerWallets;
        })
        .catch((err) => console.log(err));
      const sentMessageId = await ctx.reply("Owner Menu:", { reply_markup: ownerMenu });
      session.today_messages.push(sentMessageId.message_id);
    });
    bot.command("usermenu", async (ctx) => {
      console.log("user menu : ", ctx.from.username);
      const session = getSession(ctx.from.id);
      await removeAllMessages(ctx, -1);

      const sentMessageId = await ctx.reply("User Menu:", { reply_markup: userMenu });
      session.today_messages.push(sentMessageId.message_id);

    });
    bot.on("message:text", async (ctx) => {
      const session = getSession(ctx.from.id);

      session.today_messages.push(ctx.message.message_id);
      session.stucked_messages.push(ctx.message.message_id);
      // await removeStuckedMessages(ctx, session);
      let sentMessageId = undefined;
      if (session.isExpectingAnswer && session.isExpectingAnswer !== "") {
        let answer = ctx.message.text;
        // FairlaunchConfigData[session.isExpectingAnswer - 1].value = answer;
        // main.update();

        const walletPubKey = getCurrentWalletPublicKey(session);
        if (
          session.isExpectingAnswer === "startTime" ||
          session.isExpectingAnswer === "endTime"
        ) {
          if (isValidDate(answer) === true) {
            const date = new Date(answer);
            answer = Math.floor(date.getTime() / 1000);
            session[session.isExpectingAnswer].value = answer;
            session.current_menu.update();
            removeAllMessages(ctx, 0);
            const reviewKeyboard = new InlineKeyboard()
              .text(`✅ Chain - ${session.chain.value}`, "chainReView")
              .text(
                `${walletPubKey === ""
                  ? "🚫 Please import wallet"
                  : "✅ " + walletPubKey
                }`,
                "walletReView"
              ).row().text('return', 'return');
            const showText = await replyReviewMessage(ctx, session, session[session.isExpectingAnswer].category);
            await ctx.api.editMessageText(ctx.chat.id, session.today_messages[0], showText, { parse_mode: 'HTML', reply_markup: presaleConfigurationMenu })
            // const sentMessageId = await replyReviewLaunch(ctx, session, presaleConfigurationMenu, false, session[session.isExpectingAnswer].category);
            // console.log("review launch : ", sentMessageId);
            // session.today_messages.push(sentMessageId.nessage_id);
            session.isExpectingAnswer = '';
          } else {
            sentMessageId = await ctx.reply("⚠️ please input valid date again YYYY-MM-DD HH:MM:SS");
            return;
          }
        } else if (session.isExpectingAnswer === "minimumBuyAmount" || session.isExpectingAnswer === "maximumBuyAmount" || session.isExpectingAnswer === "softcap") {
          if (isNumber(answer)) {
            let decimalValue = 18;
            if (session["accepted_currency"].value === "BlazeX")
              decimalValue = 9;
            else if (session["accepted_currency"].value === "USDT")
              decimalValue = 6;
            const answerValueToStore = parseUnits(answer, decimalValue);
            if (await session[session.isExpectingAnswer].validation(answerValueToStore) === true) {
              session[session.isExpectingAnswer].value = answerValueToStore;
              removeAllMessages(ctx, 0);
              const showText = await replyReviewMessage(ctx, session, session[session.isExpectingAnswer].category);

              await ctx.api.editMessageText(ctx.chat.id, session.today_messages[0], showText, { parse_mode: 'HTML', reply_markup: presaleConfigurationMenu })
              session.isExpectingAnswer = '';
            }
            else {
              sentMessageId = await ctx.reply(
                `${session[session.isExpectingAnswer].invalid_description}`
              );
            }
          } else {
            if (await session[session.isExpectingAnswer].validation(answer) === false) {
              sentMessageId = await ctx.reply(
                `${session[session.isExpectingAnswer].invalid_description}`
              );
            }
          }
        } else if (session.isExpectingAnswer === "sellAmount") {
          if (isNumber(answer)) {
            let decimalValue = session["token_decimals"].value;
            const answerValueToStore = parseUnits(answer, decimalValue);
            if (await session[session.isExpectingAnswer].validation(answerValueToStore.toString()) === true) {
              session[session.isExpectingAnswer].value = answerValueToStore;
              removeAllMessages(ctx, 0);
              const showText = await replyReviewMessage(ctx, session, session[session.isExpectingAnswer].category);

              await ctx.api.editMessageText(ctx.chat.id, session.today_messages[0], showText, { parse_mode: 'HTML', reply_markup: presaleConfigurationMenu })
              session.isExpectingAnswer = '';
            }
            else {
              sentMessageId = await ctx.reply(
                `${session[session.isExpectingAnswer].invalid_description}`
              );
            }
          } else {
            if (await session[session.isExpectingAnswer].validation(answer) === false) {
              sentMessageId = await ctx.reply(
                `${session[session.isExpectingAnswer].invalid_description}`
              );
            }
          }
        } else if (session.isExpectingAnswer === "find-project") {
          if (isValidEthereumAddress(answer) == true) {
            session.isExpectingAnswer = "";
            PoolInfo.find({ poolAddress: answer })
              .then(async (pools) => {
                if (pools === null || pools.length === 0) {
                  sentMessageId = await ctx.reply("⚠️ No result!");
                } else {
                  for (const pool of pools) {
                    const inlineKeyboards = {
                      inline_keyboard: [
                        [
                          // { text: "Button 1", callback_data: "data_1" },
                          // { text: "Button 2", callback_data: "data_2" },
                        ],
                      ],
                    };
                    const tokenInfomationResult = getPresaleInformation(pool.poolAddress, pool.token_address, session);
                    const returnText = `Overview of Token\n
                    <b>Project Description</b>: ${pool.description}\n
                    <b>Token Metrics</b>: ${pool.token_name} ${pool.token_symbol}\n
                    <b>Presale Goals</b>: ${pool.softcap}${pool.accepted_currency}\n
                    <b>Presale Stats</b>: ${tokenInformation.totalDepositAmount}${pool.accepted_currency} raised, ${tokenInformation.totalContributors} contributors\n
                    <b>Post Presale Actions</b>: ${pool.router}\n
                    <b>Links Media</b>: ${pool.websiteURL}\n
                    <b>Presale Time</b>: ${formatDate(pool.startTime)} - ${formatDate(pool.endTime)}\n
                    <b>Current Marketcap</b>: ${pool.marketCap}\n
                    <b>Your contributions</b>":  ${tokenInfomationResult.contributionAmount}\n`;

                    inlineKeyboards.inline_keyboard[0].push({
                      text: "Back To Browse Projects",
                      callback_data: ""
                    })
                    inlineKeyboards.inline_keyboard[0].push({
                      text: "Vie Current Price if ended (Link to Dextools)",
                      url: "https://www.dextools.io/app/"
                    })
                    inlineKeyboards.inline_keyboard[0].push({
                      text: "Contribute Now OR SEND",
                      callback_data: `Contribute_${pool.poolAddress}`
                    })
                    inlineKeyboards.inline_keyboard[0].push({
                      text: "Emergency Withdraw",
                      callback_data: `EW_${pool.poolAddress}`
                    })
                    inlineKeyboards.inline_keyboard[0].push({ text: 'Return', callback_data: 'return' });
                    sentMessageId = await ctx.reply(returnText, { reply_markup: inlineKeyboards });
                  }
                }
              })
              .catch((err) => {
                console.log(err);
              });
          } else {
            sentMessageId = await ctx.reply("⚠️ Please input valid address again");
          }
        } else if (session.isExpectingAnswer === "search") {
          if (isValidEthereumAddress(answer) == true) {
            session.isExpectingAnswer = "";
            PoolInfo.find({ token_address: answer })
              .then(async (pools) => {
                if (pools === null || pools.length === 0) {
                  sentMessageId = await ctx.reply("⚠️ No result!");
                } else {
                  for (const pool of pools) {
                    const inlineKeyboards = {
                      inline_keyboard: [
                        [
                          // { text: "Button 1", callback_data: "data_1" },
                          // { text: "Button 2", callback_data: "data_2" },
                        ],
                      ],
                    };
                    const tokenInfomationResult = getPresaleInformation(pool.poolAddress, pool.token_address);
                    const returnText = `Overview of Token\n
                    <b>Project Description</b>: ${pool.description}\n
                    <b>Token Metrics</b>: ${pool.token_name} ${pool.token_symbol}\n
                    <b>Presale Goals</b>: ${pool.softcap}${pool.accepted_currency}\n
                    <b>Presale Stats</b>: ${tokenInformation.totalDepositAmount}${pool.accepted_currency} raised, ${tokenInformation.totalContributors} contributors\n
                    <b>Post Presale Actions</b>: ${pool.router}\n
                    <b>Links Media</b>: ${pool.websiteURL}\n
                    <b>Presale Time</b>: ${formatDate(pool.startTime)} - ${formatDate(pool.endTime)}\n
                    <b>Current Marketcap</b>: ${pool.marketCap}\n
                    <b>Your contributions</b>":  ${tokenInfomationResult.contributionAmount}\n`;

                    inlineKeyboards.inline_keyboard[0].push({
                      text: "Back To Browse Projects",
                      callback_data: ""
                    })
                    inlineKeyboards.inline_keyboard[0].push({
                      text: "Vie Current Price if ended (Link to Dextools)",
                      url: "https://www.dextools.io/app/"
                    })
                    inlineKeyboards.inline_keyboard[0].push({
                      text: "Contribute Now OR SEND",
                      callback_data: `Contribute_${pool.poolAddress}`
                    })
                    inlineKeyboards.inline_keyboard[0].push({
                      text: "Emergency Withdraw",
                      callback_data: `EW_${pool.poolAddress}`
                    })
                    inlineKeyboards.inline_keyboard[0].push({ text: 'Return', callback_data: 'return' });
                    sentMessageId = await ctx.reply(returnText, { reply_markup: inlineKeyboards });
                  }
                }
              })
              .catch((err) => {
                console.log(err);
              });
          } else {
            sentMessageId = await ctx.reply("⚠️ Please input valid address again");
          }
        } else if (session.isExpectingAnswer === "token_address") {
          const resultValidation = await session.token_address.validation(answer);
          if (resultValidation == true) {
            const provider = new HttpProvider(providerURL[session.chain.value]);
            const web3 = new Web3(provider);
            const tokenAddress = answer;
            console.log("answer", tokenAddress);
            try {
              const tokenContract = new web3.eth.Contract(tokenAbi, tokenAddress);

              const name = await tokenContract.methods.name().call();
              session.token_name.value = name;
              console.log("name", name);
              const symbol = await tokenContract.methods.symbol().call();
              session.token_symbol.value = symbol;
              console.log("symbol", symbol);
              const decimals = await tokenContract.methods.decimals().call();
              console.log("decimals", decimals);

              session.token_decimals.value = decimals;
              const supply = await tokenContract.methods.totalSupply().call();
              session.token_supply.value = supply;
              console.log("supply", supply);

              session[session.isExpectingAnswer].value = answer;
              // ctx.reply(`Token Name : ${name}\nToken Symbol : ${symbol}`, {
              //   reply_markup: main,
              // });
              session.current_menu.update();
              removeAllMessages(ctx, 0);
              const reviewKeyboard = new InlineKeyboard()
                .text(`✅ Chain - ${session.chain.value}`, "chainReView")
                .text(
                  `${walletPubKey === ""
                    ? "🚫 Please import wallet"
                    : "✅ " + walletPubKey
                  }`,
                  "walletReView"
                ).row().text('Return', 'return');
              const showText = await replyReviewMessage(ctx, session, session[session.isExpectingAnswer].category);
              // console.log('show Text', showText);
              await ctx.api.editMessageText(ctx.chat.id, session.today_messages[0], showText, { parse_mode: 'HTML', reply_markup: tokenSetupMenu })
              // await bot.api.editMessageReplyMarkup(ctx.chat.id, session.today_messages[0], {reply_markup : tokenSetupMenu});
              // const sentMessageId = await replyReviewLaunch(ctx, session, tokenSetupMenu, false, session[session.isExpectingAnswer].category);
              // console.log("review launch : ", sentMessageId);
              // session.today_messages.push(sentMessageId.message_id);
              session.isExpectingAnswer = "";
            } catch (err) {
              console.log(err);
              sentMessageId = await ctx.reply(
                `⚠️ Can't load token info on ${session.chain.value} testnet, please input again`
              );
            }
          } else {
            sentMessageId = await ctx.reply(session.token_address.invalid_description);
          }
        } else if (session.isExpectingAnswer.startsWith("amountToContribute")) {
          const parts = session.isExpectingAnswer.split("amountToContribute");
          if (isNumber(answer)) {
            session.amountToContribute = answer;
            session.isExpectingAnswer = ""
            const inlineKeyboardContribute = new InlineKeyboard().text(`Contribute ${answer}`, `user_contribute${parts[1]}`);
            sentMessageId = await ctx.reply(`Amount to Contribute : <b>${answer}</b>\n`, { reply_markup: inlineKeyboardContribute });
          } else {
            sentMessageId = await ctx.reply('please input correct amount');
          }
        } else {
          if (await session[session.isExpectingAnswer].validation(answer)) {
            session[session.isExpectingAnswer].value = answer;
            removeAllMessages(ctx, 0);
            if (session.isExpectingAnswer === "importedWallet") {
              if (!session.wallets.includes(answer)) {
                session.wallets.push(answer);
              }
              OwnerInfo.findOne({ ownerUsername: ctx.from.username })
                .then((info) => {
                  if (info) {
                    OwnerInfo.updateOne(info, { ownerWallets: session.wallets })
                      .then((res) => {
                        console.log(`Update Owner ${ctx.from.username}`, res);
                      })
                      .catch((err) =>
                        console.log(
                          `Fail Owner Update ${ctx.from.username}`,
                          err
                        )
                      );
                  } else {
                    const newOwner = new OwnerInfo({
                      ownerUsername: ctx.from.username,
                      ownerWallets: session.wallets,
                    });
                    newOwner
                      .save()
                      .then((doc) => {
                        console.log(`New Owner ${ctx.from.username} saved`);
                      })
                      .catch((err) => {
                        console.log(
                          `New Owner ${ctx.from.username} save failed!!!`
                        );
                      });
                  }
                })
                .catch((err) => {
                  console.log("Owner find", err);
                });
              sentMessageId = await ctx.reply(`Wallet Successfuly Imported`);
            } else {
              session.current_menu.update();
              console.log("current", session.current_menu);
              const reviewKeyboard = new InlineKeyboard()
                .text(`✅ Chain - ${session.chain.value}`, "chainReView")
                .text(
                  `${walletPubKey === ""
                    ? "🚫 Please import wallet"
                    : "✅ " + walletPubKey
                  }`,
                  "walletReView"
                ).row().text('Return', 'return');
              let showMenu;
              if (session[session.isExpectingAnswer].category === "setup") {
                showMenu = tokenSetupMenu;
              } else if (session[session.isExpectingAnswer].category === "configuration") {
                showMenu = presaleConfigurationMenu;
              } else if (session[session.isExpectingAnswer].category === 'information') {
                showMenu = presaleInformationMenu;
              } else {
                showMenu = reviewKeyboard;
              }
              const showText = await replyReviewMessage(ctx, session, session[session.isExpectingAnswer].category);

              await ctx.api.editMessageText(ctx.chat.id, session.today_messages[0], showText, { parse_mode: 'HTML', reply_markup: showMenu })
              // await bot.api.editMessageReplyMarkup(ctx.chat.id, session.today_messages[0], {reply_markup : showMenu})
              // const sentMessageId = await replyReviewLaunch(ctx, session, showMenu, false, session[session.isExpectingAnswer].category);
              // console.log("review : ", sentMessageId)
              // session.today_messages.push(sentMessageId.message_id);
              // ctx.reply(`${session.isExpectingAnswer} is ${answer}`, {
              //   reply_markup: main,
              // });
            }
            session.isExpectingAnswer = "";
          } else {
            sentMessageId = await ctx.reply(
              `${session[session.isExpectingAnswer].invalid_description}`
            );
          }
        }
      } else {
        sentMessageId = await ctx.reply("Send /start to see the menu");
      }
      if (sentMessageId !== undefined)
        session.today_messages.push(sentMessageId.message_id);
    });
    bot.callbackQuery("click-cancel-input", async (ctx) => {
      const session = getSession(ctx.from.id);
      session.isExpectingAnswer = "";
      await ctx.answerCallbackQuery({
        text: "Cancelled",
      });
      returnAction(ctx);
    });
    bot.callbackQuery("launch", async (ctx) => {
      const session = getSession(ctx.from.id);
      const keysOfSession = Object.keys(session);
      let sentMessageId = undefined;
      let validation_result = true;
      let errors = [];
      for (const variable of keysOfSession) {
        if (
          session[variable].hasOwnProperty("validation") &&
          variable !== "importedWallet"
        ) {
          validation_result =
            validation_result &&
            session[variable].validation(session[variable].value);
          if (session[variable].validation(session[variable].value) === false)
            errors.push(
              variable + " : " + session[variable].invalid_description
            );
        }
      }
      if (validation_result === true) {
        if (session.wallets.length > 0) {
          await launchPool(
            session.wallets[session.selectedWallet - 1],
            session
          ).catch((err) => console.log(err));
          await ctx.answerCallbackQuery({
            text: "Launching!!! Please wait while launching",
          });
        } else {
          await ctx.answerCallbackQuery({
            text: "No wallet is conencted, please import wallet first!",
          });
          sentMessageId = await ctx.reply("No wallet is connected, please import wallet first!");
        }
      } else {
        await ctx.answerCallbackQuery({
          text: "Please review your data and input correct data!",
        });
        sentMessageId = await ctx.reply(errors.join("\n"));
      }
      if (sentMessageId !== undefined)
        session.today_messages.push(sentMessageId.message_id);
    });
    bot.on("callback_query", async (ctx) => {
      const data = ctx.callbackQuery.data;
      let sentMessageId = undefined;
      if (data.startsWith("ownerwallet_")) {
        const parts = data.split("ownerwallet_");
        if (parts.length > 1) {
          const session = getSession(ctx.from.id);

          const inlineKeyboardOwnerWallet = new InlineKeyboard()
            // TODO : should indicate same callback data as my presale menu
            .text('My presales', `my-presales`)
            // TODO : should indiciate same callback data as fair launch menu
            .text('Start a Fair Launch', `start-fairlaunch`)
            .row()
            .text('Remove Wallet', `removeWallet_`)
            // TODO : should indicate same callback data as deposit menu
            .text('Deposit', `deposit_${getWalletPublicKeyFromindex(session, session.selectedWallet)}`)
            .row()
            // TODO : should indicate same callback data as send menu
            .text('Send', `send-menu_${session.selectedWallet - 1}`)
            .text('Show Private Key', `showPrivateKey_${session.selectedWallet}`)
            .row()
            .text('Return', `return`)

          // ctx.answerCallbackQuery({ text: "Pressed Wallet " + parts[1] + "!" });
          if (session.selectedWallet !== parseInt(parts[1])) {
            initiateSession(session);

            session.selectedWallet = parseInt(parts[1]);

            let cnt = 1;
            const inlineKeyboard = {
              inline_keyboard: [
                [
                  // { text: "Button 1", callback_data: "data_1" },
                  // { text: "Button 2", callback_data: "data_2" },
                ],
              ],
            };
            for (const wallet of session.wallets) {
              console.log(wallet);
              const button = {
                text:
                  (cnt === session.selectedWallet ? "✅ " : "") +
                  "Wallet " +
                  cnt +
                  ` (${getWalletPublicKeyFromindex(session, cnt)})`,
                callback_data: "ownerwallet_" + cnt,
              };
              if (cnt % 2 === 0) {
                inlineKeyboard.inline_keyboard[inlineKeyboard.inline_keyboard.length - 1].push(button);
              }
              // If cnt is even (like 2, 4, 6...), add a new row and push the button to the new row
              else {
                inlineKeyboard.inline_keyboard.push([button]);
              }
              cnt++;
            }
            inlineKeyboard.inline_keyboard.push([{ text: 'Return', callback_data: 'return' }]);
            const result = await ctx.editMessageReplyMarkup({
              reply_markup: inlineKeyboard,
            });
          }
          // Replace 'yourPrivateKeyHex' with your actual private key in hexadecimal format.

          const addressHex = getCurrentWalletPublicKey(session);

          const balanceResult = await getTotalBalance(addressHex);

          sentMessageId = await ctx.reply(`Current Wallet's information : ${addressHex}\nEtheruem\n  ---- ETH: ${balanceResult.Ethereum.NATIVE}\n  ---- USDT: ${balanceResult.Ethereum.USDT}\n  ---- BalzeX: ${balanceResult.Ethereum.BLAZEX}\nBinance\n  ---- BNB: ${balanceResult.Binance.NATIVE}\n  ---- USDT: ${balanceResult.Binance.USDT}\n  ---- BLAZEX: ${balanceResult.Binance.BLAZEX}`, { reply_markup: inlineKeyboardOwnerWallet });
        }
      }
      else if (data.startsWith("userwallet_")) {
        const parts = data.split("userwallet_");
        if (parts.length > 1) {
          // ctx.answerCallbackQuery({ text: "Pressed Wallet " + parts[1] + "!" });
          const session = getSession(ctx.from.id);
          session.selectedWallet = parseInt(parts[1]);
          // Replace 'yourPrivateKeyHex' with your actual private key in hexadecimal format.

          const addressHex = getCurrentWalletPublicKey(session);

          const inlineKeybardUserWallet = new InlineKeyboard()
            .text('Contributions & Claim', `userContributionAndClaim_${session.wallets[session.selectedWallet - 1]}`)
            .text('Show Private Key', `showPrivateKey_${session.selectedWallet}`)
            .row()
            .text('Remove Wallet', `removeWallet_`)
            .text('Deposit', `deposit_${getWalletPublicKeyFromindex(session, session.selectedWallet)}`)
            .row()
            // TODO : Send should be similar to Deployer Bot
            .text('Send', `send-menu_${session.selectedWallet - 1}`)
            .row()
            .text('Return', 'return');

          sentMessageId = await ctx.reply("Current Owner Wallet's Information : " + addressHex, { reply_markup: inlineKeybardUserWallet });
        }
      } else if (data.startsWith("ongoing")) {
        let poolChain;
        let startString = 'ongoingEtherum';
        if (data.startsWith('ongoingEthereum')) {
          poolChain = 'Ethereum';
        } else if (data.startsWith('ongoingBinance')) {
          poolChain = 'Binance';
          startString = 'ongoingBinance';
        }
        const parts = data.split(startString);
        if (parts.length > 1) {
          const poolAddress = parts[1];
          PoolInfo.find({ poolAddress: poolAddress, chain: poolChain })
            .then(async (pools) => {
              if (pools.length > 0) {
                const session = getSession(ctx.from.id);
                const replyInlineKeyboard = new InlineKeyboard()
                  .text('Refresh Data : ', `ongoing${poolChain}${poolAddress}`)
                  // TODO : editProjectDetail_
                  .text('Edit project details', `editProjectDetail_${poolAddress}`)
                  .row()
                  //TODO : finalizeAddLP_
                  .text('Finalize & Add LP', `finalizeAddLP_${pools[0].chain}_${poolAddress}`)
                  //TODO : cancelRefund_
                  .text('Cancel & Refund', `refund_${pools[0].chain}_${poolAddress}`)
                  .row().text('Return', 'return');

                const tokenInfomationResult = getPresaleInformation(poolAddress, poolAddress, session);
                if (tokenInfomationResult.isFinalized === false) {
                  await showInformationAboutProjectOwner(pools[0], ctx, tokenInfomationResult, session, replyInlineKeyboard);
                }
                // ctx.reply(`The ongoing pool is ${poolAddress}`);
              }
            })
            .catch(async (err) => { console.log(err); sentMessageId = await ctx.reply(`Wrong address inputed`) });
        }
      } else if (data.startsWith("finished")) {
        const parts = data.split("finished");
        if (parts.length > 1) {
          const poolAddress = parts[1];
          PoolInfo.find({ poolAddress: poolAddress })
            .then(async (pools) => {
              if (pools.length > 0) {
                const session = getSession(ctx.from.id);
                const replyInlineKeyboard = new InlineKeyboard()
                  .text('Refund', `refund_${poolAddress}`)
                  .row()
                  //TODO : finalizeAddLP_
                  .text('Finalize & Add LP', `finalizeAddLP_${poolAddress}`)
                  .row()
                  .text('Return', 'return')

                const tokenInfomationResult = getPresaleInformation(poolAddress, poolAddress, session);
                await showInformationAboutProjectOwner(pools[0], ctx, tokenInfomationResult, session, replyInlineKeyboard);
                // ctx.reply(`The ongoing pool is ${poolAddress}`);
              }
            })
            .catch(async (err) => { console.log(err); sentMessageId = await ctx.reply(`Wrong address inputed`) });
        }
      } else if (data.startsWith("Contribute_")) {
        const parts = data.split("Contribute_");
        if (parts.length > 1) {
          const session = getSession(ctx.from.id);
          const poolAddress = parts[1];
          sentMessageId = await ctx.reply(`Amount to Contribute : `);
          session.isExpectingAnswer = `amountToContribute${poolAddress}`;
        }
      } else if (data.startsWith("user_contribute")) {
        const parts = data.split("user_contribute");
        const session = getSession(ctx.from.id);
        if (parts.length > 1) {
          const poolAddress = parts[1];
          sentMessageId = await ctx.reply(`Contributing ${session.amountToContribute}\n`);
          const privateKey = session.wallets[session.selectedWallet - 1];
          // Setup provider with the private key
          const provider = new HDWalletProvider({
            privateKeys: [privateKey],
            providerOrUrl: providerURL[session.chain.value],
          });

          const web3 = new Web3(provider);
          const accounts = await web3.eth.getAccounts();
          const sender = accounts[0];

          const presaleContract = new web3.eth.Contract(fairlaunchAbi, poolAddress);
          try {
            if (session.accepted_currency.value === "ETH" || session.accepted_currency.value === "BNB") {
              await presaleContract.methods.buyWithETH(ethUtil.zeroAddress).send({ from: sender, value: session.amountToContribute });
            } else {
              const tokenContract = new web3.eth.Contract(tokenAbi, session.token_address.value);
              await tokenContract.methods.approve(poolAddress, session.amountToContribute).send({ from: sender });
              setTimeout(async () => {
                await presaleContract.methods.buyWithToken(ethUtil.zeroAddress, session.token_address.value).send({ from: sender, value: session.amountToContribute });
              }, 10000);
            }
            sentMessageId = await ctx.reply('✅ Successfully contributed!!!');
            ContributionInfo.findOne({ userWallet: sender, poolAddress: poolAddress })
              .then(contribution => {
                const currentTime = new Date();
                const timestamp = Number(currentTime * 1000).toFixed(0);

                if (contribution) {
                  ContributionInfo.updateOne(contribution, { contributionAmount: contribution.contributionAmount + session.amountToContribute, contributionTime: timestamp })
                    .then(res => {
                      console.log(`Update contribution ${res}`);
                    })
                    .catch(err => {
                      console.log(`Failed update contribution`);
                    })
                } else {
                  const newContribution = new ContributionInfo({ userWallet: sender, poolAddress: poolAddress, contributionAmount: amountToContribute, contributionTime: timestamp })
                  newContribution
                    .save()
                    .then((doc) => {
                      console.log(`New contribution ${doc}`);
                    })
                    .catch(err => {
                      console.log(`⚠️ New Contribution failed!!!`)
                    })
                }
              }).catch(err => { console.log(err); })
          }
          catch (err) { }
        }
      } else if (data.startsWith("EW_")) {
        const parts = data.split("EW_");
        if (parts.length > 1) {
          const poolAddress = parts[1];
          const EWInlineKeyboard = new InlineKeyboard().text('I am fine with it! Emergency Withdraw!!!', `EW_PROCEED${poolAddress}`).text('Return', 'return');
          sentMessageId = await ctx.reply('It will take 10% fee, please consider if you are fine with it!', { reply_markup: EWInlineKeyboard })
        }
      } else if (data.startsWith('EW_PROCEED')) {
        const parts = data.split('EW_PROCEED');
        if (parts.length > 1) {
          const session = getSession(ctx.from.id)
          const poolAddress = parts[1];

          sentMessageId = await ctx.reply(`⚠️ Emergency Withdrawing\n`);
          const privateKey = session.wallets[session.selectedWallet - 1];
          // Setup provider with the private key
          const provider = new HDWalletProvider({
            privateKeys: [privateKey],
            providerOrUrl: providerURL[session.chain.value],
          });

          const web3 = new Web3(provider);
          const accounts = await web3.eth.getAccounts();
          const sender = accounts[0];

          const presaleContract = new web3.eth.Contract(fairlaunchAbi, poolAddress);
          await presaleContract.methods.emergencyWithdraw().send({ from: sender });

          sentMessageId = await ctx.reply(`✅ Successfully Emergency Withdrawn!!!`)
        }
      } else if (data.startsWith('deposit_')) {
        const parts = data.split('deposit_');
        const walletAddress = parts[1];
        sentMessageId = await ctx.reply(`Wallet Address: ${walletAddress}\nYou can send USDT/BLAZEX/ETH here`);
      } else if (data.startsWith('balance_')) {
        const parts = data.split('balance_');
        const walletAddress = parts[1];

        const balanceResult = await getTotalBalance(walletAddress);

        sentMessageId = await ctx.reply(`Etheruem\n  ---- ETH: ${balanceResult.Ethereum.NATIVE}\n  ---- USDT: ${balanceResult.Ethereum.USDT}\n  ---- BalzeX: ${balanceResult.Ethereum.BLAZEX}\nBinance\n  ---- BNB: ${balanceResult.Binance.NATIVE}\n  ---- USDT: ${balanceResult.Binance.USDT}\n  ---- BLAZEX: ${balanceResult.Binance.BLAZEX}`);
      } else if (data === 'my-presales') {
        sentMessageId = await ctx.reply('My-Presales', { reply_markup: ongoingPresaleMenu });
      } else if (data === 'start-fairlaunch') {
        sentMessageId = await ctx.reply('Start Fairlaunch', { reply_markup: ownerMenu });
      } else if (data.startsWith('removeWallet_')) {
        const session = getSession(ctx.from.id);
        const index = session.selectedWallet - 1;
        if (index > -1) {
          session.wallets.splice(index, 1);
          session.selectedWallet = 1;
          OwnerInfo.findOne({ ownerUsername: ctx.from.username })
            .then((info) => {
              console.log('info:', info);
              if (info) {
                OwnerInfo.updateOne(info, { ownerWallets: session.wallets })
                  .then((res) => {
                    console.log(`Update Owner ${ctx.from.username}`, res);
                    ctx.answerCallbackQuery('Removed successfully');
                  })
                  .catch((err) => {
                    console.log(
                      `Fail Owner Update ${ctx.from.username}`,
                      err
                    );
                    ctx.answerCallbackQuery('Failed remove');
                  }
                  );
              } else {
                const newOwner = new OwnerInfo({
                  ownerUsername: ctx.from.username,
                  ownerWallets: session.wallets,
                });
                newOwner
                  .save()
                  .then((doc) => {
                    console.log(`New Owner ${ctx.from.username} saved`);
                  })
                  .catch((err) => {
                    console.log(
                      `New Owner ${ctx.from.username} save failed!!!`
                    );
                  });
              }
            })
            .catch((err) => {
              console.log("Owner find", err);
            });
        }
      } else if (data === 'send-menu_') {

      } else if (data.startsWith('showPrivateKey_')) {
        const parts = data.split('showPrivateKey_');
        if (parts.length > 1) {
          const session = getSession(ctx.from.id);
          sentMessageId = await ctx.reply(`Private key: <b>${session.wallets[parts[1] - 1]}</b>`, { parse_mode: 'HTML' });
        } else {
          sentMessageId = await ctx.reply(`⚠️ Unable to show you private key.`);
        }
      } else if (data.startsWith('userContributionAndClaim_')) {
        const session = getSession(ctx.from.id);
        contributionAction(ctx, session);
      } else if (data.startsWith('userProject_')) {
        let poolChain = 'Ethereum';
        const session = getSession(ctx.from.id);
        let startString = 'userProject_Etherum_';
        if (data.startsWith('userProject_Binance_')) {
          poolChain = 'Binance';
          startString = 'userProject_Binance_';
        }
        const parts = data.split(startString);
        if (parts.length > 1) {
          const poolAddress = parts[1];
          const privateKey = session.wallets[session.selectedWallet - 1];
          // Setup provider with the private key
          const provider = new HDWalletProvider({
            privateKeys: [privateKey],
            providerOrUrl: providerURL[poolChain],
          });

          const web3 = new Web3(provider);

          const accounts = await web3.eth.getAccounts();
          const sender = accounts[0];
          const presaleContract = new web3.eth.Contract(factoryABI, presale_address);
          const isFinalized = await presaleContract.methods.isFinalized().call({ from: sender });
          PoolInfo.find({ poolAddress: poolAddress, chain: poolChain })
            .then(async (pools) => {
              if (pools === null || pools.length === 0) {
                sentMessageId = await ctx.reply("⚠️ No result!");
              } else {
                for (const pool of pools) {
                  const inlineKeyboardUserProject = new InlineKeyboard();
                  const tokenInfomationResult = getPresaleInformation(pool.poolAddress, pool.token_address, session);
                  let returnText = '';
                  if (isFinalized === false) {
                    `Overview of Token\n
                    <b>Project Description</b>: ${pool.description}\n
                    <b>Token Metrics</b>: ${pool.token_name} ${pool.token_symbol}\n
                    <b>Presale Goals</b>: ${pool.softcap}${pool.accepted_currency}\n
                    <b>Presale Stats</b>: ${tokenInformation.totalDepositAmount}${pool.accepted_currency} raised, ${tokenInformation.totalContributors} contributors\n
                    <b>Post Presale Actions</b>: ${pool.router}\n
                    <b>Links Media</b>: ${pool.websiteURL}\n
                    <b>Presale Time</b>: ${formatDate(pool.startTime)} - ${formatDate(pool.endTime)}\n
                    <b>Current Marketcap</b>: ${pool.marketCap}\n
                    <b>Your contributions</b>":  ${tokenInfomationResult.contributionAmount}\n`;


                    inlineKeyboardUserProject.text(
                      "Back To Browse Projects",
                      ""
                    )
                    inlineKeyboardUserProject.url(
                      "Vie Current Price if ended (Link to Dextools)",
                      "https://www.dextools.io/app/"
                    )

                    inlineKeyboardUserProject.text(
                      "Contribute Now OR SEND",
                      `Contribute_${pool.poolAddress}`
                    )
                    inlineKeyboardUserProject.text(
                      "Emergency Withdraw",
                      `EW_${pool.poolAddress}`
                    )
                    inlineKeyboardUserProject.text('Return', 'return');
                    sentMessageId = await ctx.reply(returnText, { reply_markup: inlineKeyboardUserProject });
                  } else {
                    `Overview of Token\n
                      <b>Project Description</b>: ${pool.description}\n
                      <b>Token Metrics</b>: ${pool.token_name} ${pool.token_symbol}\n
                      <b>Presale Goals</b>: ${pool.softcap}${pool.accepted_currency}\n
                      <b>Presale Stats</b>: ${tokenInformation.totalDepositAmount}${pool.accepted_currency} raised, ${tokenInformation.totalContributors} contributors\n
                      <b>Post Presale Actions</b>: ${pool.router}\n
                      <b>Links Media</b>: ${pool.websiteURL}\n
                      <b>Presale Time</b>: ${formatDate(pool.startTime)} - ${formatDate(pool.endTime)}\n
                      <b>Current Marketcap</b>: ${pool.marketCap}\n
                      <b>Your contributions</b>":  ${tokenInfomationResult.contributionAmount}\n`;

                    inlineKeyboardUserProject.text(
                      "Back To Browse Projects",
                      ""
                    )
                    inlineKeyboardUserProject.url(
                      "Vie Current Price if ended (Link to Dextools)",
                      "https://www.dextools.io/app/"
                    )
                    inlineKeyboardUserProject.text(
                      "Claim",
                      `userClaim_${pool.poolAddress}`
                    )
                    inlineKeyboardUserProject.text('Return', 'return');
                    sentMessageId = await ctx.reply(returnText, { reply_markup: inlineKeyboardUserProject });
                  }
                }
              }
            })
            .catch((err) => {
              console.log(err);
            });
        }
      } else if (data.startsWith('editProjectDetails_')) {

      } else if (data.startsWith('userClaim_')) {
        const parts = data.split('userClaim_');
        if (parts.length > 1) {
          try {
            const poolAddress = parts[1];
            const session = getSession(ctx.from.id);
            const privateKey = session.wallets[session.selectedWallet - 1];
            // Setup provider with the private key
            const provider = new HDWalletProvider({
              privateKeys: [privateKey],
              providerOrUrl: providerURL[session.chain.value],
            });

            const web3 = new Web3(provider);
            const accounts = await web3.eth.getAccounts();
            const sender = accounts[0];

            const presaleContract = new web3.eth.Contract(fairlaunchAbi, poolAddress);
            await presaleContract.methods.claim().send({ from: sender });
            sentMessageId = await ctx.reply('✅ Claiming successfully submitted');
          } catch (err) {
            console.log('user claim!!', err);
          }
        } else {
          console.log('wrong type user claim!!!');
        }
      } else if (data.startsWith('finalizeAddLP_')) {
        let poolChain;
        const session = getSession(ctx.from.id);
        let startString = 'finalizeAddLP_Etherum_';
        if (data.startsWith('finalizeAddLP_Ethereum_')) {
          poolChain = 'Ethereum';
        } else if (data.startsWith('finalizeAddLP_Binance_')) {
          poolChain = 'Binance';
          startString = 'finalizeAddLP_Binance_';
        }

        const parts = data.split(startString);
        if (parts.length > 1) {
          const poolAddress = parts[1];
          try {
            await finalizeAndAddLPFunc(session.walltes[session.selectedWallet - 1], poolAddress, poolChain);
          } catch (err) {
            console.log(err);
            sentMessageId = await ctx.reply(`⚠️ Failed finalize!!!`)
          }
        } else {
          sentMessageId = await ctx.reply(`⚠️ Failed finalize!!!`)
        }
      } else if (data.startsWith('refund_')) {
        let poolChain;
        const session = getSession(ctx.from.id);
        let startString = 'refund_Etherum_';
        if (data.startsWith('refund_Ethereum_')) {
          poolChain = 'Ethereum';
        } else if (data.startsWith('refund_Binance_')) {
          poolChain = 'Binance';
          startString = 'refund_Binance_';
        }

        const parts = data.split(startString);
        if (parts.length > 1) {
          const poolAddress = parts[1];
          try {
            await cancelAndRefundFunc(session.walltes[session.selectedWallet - 1], poolAddress, poolChain);
          } catch (err) {
            console.log(err);
            sentMessageId = await ctx.reply(`⚠️ Failed refund!!!`)
          }
        } else {
          sentMessageId = await ctx.reply(`⚠️ Failed refund!!!`)
        }
      } else if (data === 'return') {
        returnAction(ctx);
      }
      const session = getSession(ctx.from.id);
      if (sentMessageId !== undefined)
        session.today_messages.push(sentMessageId.message_id);
    })
  } catch (err) {
    console.log(err);
  }
}
mainFunc();
