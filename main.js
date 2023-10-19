require("dotenv").config();
const Web3 = require("web3");
const ethUtil = require("ethereumjs-util");
const Wallet = require("ethereumjs-wallet");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const TelegramBot = require("node-telegram-bot-api");
const { parseUnits, BigNumber, formatUnits } = require("ethers");
const { ethers } = require("ethers");
const factoryABI = require("./abis/factoryABI");
const fairlaunchAbi = require("./abis/FairLaunch");
const tokenAbi = require("./abis/tokenAbi");
const bcrypt = require("bcrypt");
const { encrypt, decrypt } = require("./libs/encryptions");
const fetch = require("node-fetch");
const saltRounds = 10;
const {
  isValidEthereumAddress,
  isNumber,
  isValidURL,
  isValidPrivateKey,
  isValidDate,
} = require("./libs/validators");
const { menuData } = require("./libs/menuDatas");
const {
  replyReviewLaunch,
  getPresaleInformation,
  replyReviewMessage,
  replyCertainCategoryMessage,
  showInformationAboutProjectOwner,
} = require("./libs/actions");
const getTotalBalance = require("./libs/walletFuncs");
const HDWalletProvider = require("@truffle/hdwallet-provider");
// ERC-20 Token ABI with only the necessary parts for fetching name and symbol

const factoryAddress = {
  Binance: "0x8AB7CFc7a966Ba2A83A83B750C2c1c7f3768Aa39",
  Ethereum: "0x21742CE2a230CCBdea505b4ecEC540826D171573",
};

// Your Ethereum node's RPC URL (could be local, Infura, Alchemy, etc.)
const providerURL = {
  Binance: "https://bsc-testnet.publicnode.com",
  Ethereum: "https://goerli.infura.io/v3/81f1f856e5854cda96f939fe2a658c40",
};

const { Bot, InlineKeyboard, session } = require("grammy");
const { Menu } = require("@grammyjs/menu");
const mongoose = require("mongoose");
const { parse } = require("dotenv");
const mongoUri =
  "mongodb+srv://kham:eWgvFVyLVMknCK2@cluster0.0kwh7.mongodb.net/";

const password = "MyStreetPassword";

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
  sellAmount: String,
  softcap: String,
  minimumBuyAmount: String,
  maximumBuyAmount: String,
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
const ContributionInfo = mongoose.model(
  "ContributionInfo",
  contributionDataSchema
);

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

function parseSoftCap(softcap, accepted_currency) {
  let decimalValue = 18;
  if (accepted_currency === "BlazeX") decimalValue = 9;
  else if (accepted_currency === "USDT") decimalValue = 6;
  return formatUnits(softcap, decimalValue);
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
        },
      },
      token_decimals: {
        value: undefined,
        category: "setup",
        validation: (val) => {
          return val !== undefined;
        },
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
        invalid_description:
          "1. Must input valid Number\n2. Must Have Added The Contract In the Token Address\n3. Must have connected wallet first\n4.Must have enough Tokens of that Address in his wallet.",
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
            return val > 51;
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
          console.log("now time", Math.floor(Date.now() / 1000));
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
            return val > 60;
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
        notRequired: true,
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
        notRequired: true,
        invalid_description: "You need use https://",
      },
      discordURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        category: "information",
        notRequired: true,
        invalid_description: "You need use https://",
      },
      githubURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        category: "information",
        notRequired: true,
        invalid_description: "You need use https://",
      },
      instagramURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        category: "information",
        notRequired: true,
        invalid_description: "You need use https://",
      },
      redditURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        notRequired: true,
        category: "information",
        invalid_description: "You need use https://",
      },
      preview: {
        value: undefined,
        notRequired: true,
        category: "preview",
        validation : (val) => {
          return true;
        },
        invalid_description: "You need upload a photo",
      },
      description: {
        value: "",
        validation: (val) => {
          return true;
        },
        notRequired: true,
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
        sessions[userId].token_address.invalid_description =
          "⚠️ Please input valid address";
        return false;
      }
      console.log("valid address");
      if (sessions[userId].wallets.length === 0) return false;
      const privateKey =
        sessions[userId].wallets[sessions[userId].selectedWallet - 1];
      // Setup provider with the private key
      const provider = new HDWalletProvider({
        privateKeys: [privateKey],
        providerOrUrl: providerURL[sessions[userId].chain.value],
      });

      const web3 = new Web3(provider);

      const sender = getCurrentWalletPublicKey(sessions[userId]);
      try {
        const tokenContract = new web3.eth.Contract(tokenAbi, val);
        const result = await tokenContract.methods
          .balanceOf(sender)
          .call({ from: sender });
        if (result == 0 || result === "0n") {
          sessions[userId].token_address.invalid_description =
            "⚠️ The contract exists, but you don't have any tokens in your wallet.";
          return false;
        }
      } catch (err) {
        console.log(err);
        return false;
      }

      return true;
    };
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
        const minimumVal =
          sessions[userId].minimumBuyAmount.value === undefined
            ? "0"
            : sessions[userId].minimumBuyAmount.value;
        console.log("minimum", minimumVal);
        console.log("max", BigInt(val));
        console.log("min", BigInt(minimumVal));
        return val === 0 || BigInt(val) > BigInt(minimumVal);
      }
      return false;
    };

    sessions[userId].sellAmount.validation = async (val) => {
      if (val === undefined || isNumber(val) === false || val <= 0) {
        sessions[userId].sellAmount.invalid_description =
          "⚠️ Please input valid number";
        return false;
      } else if (sessions[userId].token_address.value === undefined) {
        sessions[userId].sellAmount.invalid_description =
          "⚠️ Must have added the contract in the Token Address";
        return false;
      } else if (sessions[userId].wallets.length === 0) {
        sessions[userId].sellAmount.invalid_description =
          "⚠️ Must have connected wallet first!";
        return false;
      } else {
        const privateKey =
          sessions[userId].wallets[sessions[userId].selectedWallet - 1];
        // Setup provider with the private key
        const provider = new HDWalletProvider({
          privateKeys: [privateKey],
          providerOrUrl: providerURL[sessions[userId].chain.value],
        });

        const web3 = new Web3(provider);
        const sender = getCurrentWalletPublicKey(sessions[userId]);

        const tokenContract = new web3.eth.Contract(
          tokenAbi,
          sessions[userId].token_address.value
        );

        const result = await tokenContract.methods
          .balanceOf(sender)
          .call({ from: sender });
        const decimalNumber = await tokenContract.methods.decimals().call({from : sender});
        if (formatUnits(result, parseInt(decimalNumber)) * 1.0 < formatUnits(val, parseInt(decimalNumber)) * 1.0) {
          sessions[userId].sellAmount.invalid_description =
            "⚠️ Must have enough tokens of that address in his wallet";
          return false;
        }
        sessions[userId].sellAmount.invalid_description =
          "1. Must input valid Number\n2. Must Have Added The Contract In the Token Address\n3. Must have connected wallet first\n4.Must have enough Tokens of that Address in his wallet.";
        return true;
      }
      return true;
    };
  }
  return sessions[userId];
}

function checkPassword(pwd, ctxId) {}

function encryptAndSavePWD(userPWD, ctxId) {
  bcrypt.hash(userPassword, saltRounds, function (err, hash) {
    if (err) throw err;

    // Save the hash in MongoDB
    // ... your MongoDB saving code here ...
  });
}
// 0x137bf66ebb4e4796491e7a0ed4ea8334b54f5bbe
function encryptPK(pk) {}

function decryptPK(password, enc_pk) {}

function formatWalletAddress(address) {
  return address.slice(0, 5) + "..." + address.slice(-3);
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
    ContributionInfo.find({
      userWallet: new RegExp(
        "^" + getCurrentWalletPublicKey(session) + "$",
        "i"
      ),
    })
      .then(async (contributions) => {
        if (contributions.length > 0) {
          const projectsInlineKeyboard = new InlineKeyboard();
          for (const contributionItem of contributions) {
            console.log("contributionItem", contributionItem);
            await PoolInfo.findOne({
              poolAddress: new RegExp(
                "^" + contributionItem.poolAddress + "$",
                "i"
              ),
              chain: session.chain.value,
            })
              .then(async (pools) => {
                if (pools === null) {
                  sentMessageId = await ctx.reply(
                    `⚠️ No result! for ${contributionItem.poolAddress}`
                  );
                } else {
                  const privateKey =
                    session.wallets[session.selectedWallet - 1];
                  // Setup provider with the private key
                  const provider = new HDWalletProvider({
                    privateKeys: [privateKey],
                    providerOrUrl: providerURL[session.chain.value],
                  });

                  const web3 = new Web3(provider);

                  const accounts = await web3.eth.getAccounts();
                  const sender = accounts[0];
                  const presaleContract = new web3.eth.Contract(
                    fairlaunchAbi,
                    contributionItem.poolAddress
                  );
                  const isFinalized = await presaleContract.methods
                    .isFinalized()
                    .call({ from: sender });
                  console.log(isFinalized, "isFinalized");
                  projectsInlineKeyboard.text(
                    `${pools.token_name} - ${pools.accepted_currency} ${
                      isFinalized === true ? "✅ You can claim" : ""
                    }`,
                    `userProject_${pools.chain}_${pools.poolAddress}`
                  );
                }
              })
              .catch((err) => {
                console.log(err);
              });
          }
          sentMessageId = await ctx.reply(`Your contributed pools are here`, {
            reply_markup: projectsInlineKeyboard,
          });
          session.today_messages.push(sentMessageId.message_id);
        } else {
          sentMessageId = await ctx.reply(
            "⚠️ You have no contributed presales"
          );
          
          session.today_messages.push(sentMessageId.message_id);
        }
      })
      .catch(async (err) => {
        console.log(err);
        sentMessageId = await ctx.reply(`⚠️ Failed fetching contributions`);
      });
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
let fairlaunchCreationMenu;

const cancelInlineKeyboard = new InlineKeyboard().text(
  "cancel",
  "click-cancel-input"
);

const returnKeyboard = new InlineKeyboard().text("Return", "return");

async function ownerMenuMiddleware(ctx, next) {
  try {
    const session = getSession(ctx.from.id);
    await ctx.api.editMessageText(
      ctx.chat.id,
      session.today_messages[0],
      "Owner Menu",
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.log(err);
  }

  await next();
}

async function userMenuMiddleware(ctx, next) {
  try {
    const session = getSession(ctx.from.id);
    await ctx.api.editMessageText(
      ctx.chat?.id,
      session.today_messages[0],
      "User menu",
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.log(err);
  }
  await next();
}

async function tokenSetupMiddleware(ctx, next) {
  try {
    const session = getSession(ctx.from.id);
    const showText = await replyReviewMessage(ctx, session, "setup");
    await ctx.api.editMessageText(
      ctx.chat.id,
      session.today_messages[0],
      showText,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.log(err);
  }
  await next();
}

async function configurationMiddleware(ctx, next) {
  const session = getSession(ctx.from.id);
  if (
    (await session.token_address.validation(session.token_address.value)) ===
    true
  ) {
    try {
      const showText = await replyReviewMessage(ctx, session, "configuration");
      await ctx.api.editMessageText(
        ctx.chat.id,
        session.today_messages[0],
        showText,
        { parse_mode: "HTML" }
      );
    } catch (err) {
      console.log(err);
    }

    await next();
  } else {
    const sentMessageId = await ctx.reply(
      "⚠️ You must add the Contract of Your Token first!"
    );
    session.today_messages.push(sentMessageId.message_id);
  }
}

async function informationMiddleware(ctx, next) {
  const session = getSession(ctx.from.id);
  if (
    (await session.token_address.validation(session.token_address.value)) ===
    true
  ) {
    try {
      const showText = await replyReviewMessage(ctx, session, "information");
      await ctx.api.editMessageText(
        ctx.chat.id,
        session.today_messages[0],
        showText,
        { parse_mode: "HTML" }
      );
    } catch (err) {
      console.log(err);
    }
    await next();
  } else {
    const sentMessageId = await ctx.reply(
      "⚠️ You must add the Contract of Your Token first!"
    );
    session.today_messages.push(sentMessageId.message_id);
  }
}

async function isTokenAddressValidated(ctx, next) {
  const session = getSession(ctx.from.id);
  if (
    (await session.token_address.validation(session.token_address.value)) ===
    true
  ) {
    await next();
  } else {
    const sentMessageId = await ctx.reply(
      "⚠️ You must add the Contract of Your Token first!"
    );
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
    if (
      session[item].hasOwnProperty("validation") &&
      item !== "accepted_currency" &&
      item !== "chain" &&
      item !== "router" &&
      item !== "refundType" &&
      item !== "whitelist_enabled" &&
      item !== "referralEnabled"
    ) {
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

        if (item.name === "my-presales") {
          ongoingPresaleMenu = menu1;
        } else if (item.name === "token-setup") {
          tokenSetupMenu = menu1;
        } else if (item.name === "presale-configuration") {
          presaleConfigurationMenu = menu1;
        } else if (item.name === "presale-information") {
          presaleInformationMenu = menu1;
        } else if (item.name === "owner-menu") {
          ownerMenu = menu1;
        } else if (item.name === "user-menu") {
          userMenu = menu1;
        } else if (item.name === "create") {
          fairlaunchCreationMenu = menu1;
        }
        if (item.name === "presale-configuration") {
          submenu.text(
            item.text,
            configurationMiddleware,
            (ctx, next) => (ctx.menu.nav(item.name), next())
          );
        } else if (item.name === "presale-information") {
          submenu.text(
            item.text,
            informationMiddleware,
            (ctx, next) => (ctx.menu.nav(item.name), next())
          );
        } else if (item.name === "token-setup") {
          submenu.text(
            item.text,
            tokenSetupMiddleware,
            (ctx, next) => (ctx.menu.nav(item.name), next())
          );
        } else if (item.name === "owner-menu") {
          submenu.text(
            item.text,
            ownerMenuMiddleware,
            (ctx, next) => (ctx.menu.nav(item.name), next())
          );
        } else if (item.name === "user-menu") {
          submenu.text(
            item.text,
            userMenuMiddleware,
            (ctx, next) => (ctx.menu.nav(item.name), next())
          );
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
                      if (
                        selectOption === "ETH" &&
                        session[item.variable].value === "BNB"
                      ) {
                        return "✅ " + "BNB";
                      }
                    } else {
                      if (
                        selectOption === "BNB" &&
                        session[item.variable].value === "ETH"
                      ) {
                        return "✅ " + "ETH";
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
                  const showText = await replyReviewMessage(
                    ctx,
                    session,
                    session[item.variable].category
                  );
                  ctx.editMessageText(showText, { parse_mode: "HTML" });
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
              } else if (ctx.from && "variable" in item) {
                const session = getSession(ctx.from.id);
                if (session[item.variable]?.hasOwnProperty("validation")) {
                  return (
                    (session[item.variable].value !== undefined &&
                    session[item.variable].value !== ""
                      ? "✅"
                      : "") + item.text
                  );
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
                    `${
                      walletPubKey === ""
                        ? "🚫 Please import wallet"
                        : "✅ " + walletPubKey
                    }`,
                    "walletReView"
                  )
                  .row()
                  .text("Launch", "launch")
                  .text("Cancel", "returnToCreateFairlaunch")
                  .row()
                  .text("⬅️ Go Back", "returnToCreateFairlaunch")
                  .text("Return", "return");
                const sentMessageId = await replyReviewLaunch(
                  ctx,
                  session,
                  launchInlineKeyboard,
                  true,
                  undefined
                );
                console.log("review", sentMessageId);
                session.today_messages.push(sentMessageId.message_id);
              } else if ("variable" in item) {
                const session = getSession(ctx.from.id);
                session.isExpectingAnswer = "";
                session.current_menu = ctx.menu;
                // const resultValidation = await session.token_address.validation(session.token_address.value);
                await removeAllMessages(ctx, 0);
                // if (item.name === "import-wallet" || item.name === "token-address" || resultValidation === true) {
                if ("type" in item && item.type === "toggle") {
                  session[item.variable].value = !session[item.variable].value;
                  const showText = await replyReviewMessage(
                    ctx,
                    session,
                    session[item.variable].category
                  );
                  ctx.editMessageText(showText, { parse_mode: "HTML" });
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
                        `Timestamp Now is ${
                          Date.now() / 1000
                        }\nCurrent Value is ${
                          session[item.variable].value === undefined ||
                          session[item.variable].value === ""
                            ? "<b>Not Set</b>"
                            : formatDate(session[item.variable].value)
                        }\nPlease input in this format : YYYY-MM-DD HH:MM:SS`,
                        {
                          reply_markup: { force_reply: true },
                          parse_mode: "HTML",
                        }
                      );
                      session.stucked_messages.push(sentMessageId.message_id);
                    } else {
                      if (session.wallets.length !== 0) {
                        let showValue = item.variable === "preview" ? "Set" : session[item.variable].value;
                        if (showValue === undefined || showValue === "")
                          showValue = "<b>Not Set</b>";
                        else if (item.variable === "sellAmount") {
                          showValue = formatUnits(
                            showValue,
                            session.token_decimals.value
                          );
                        } else if (
                          item.variable === "softcap" ||
                          item.variable === "minimumBuyAmount" ||
                          item.variable === "maximumBuyAmount"
                        ) {
                          showValue = parseSoftCap(
                            showValue,
                            session["accepted_currency"].value
                          );
                        }
                        if(item.variable === "preview" && session.preview.value !== undefined) {
                          sentMessageId = await ctx.replyWithPhoto(session.preview.value, 
                            {reply_markup : 
                              {force_reply : true}, 
                              parse_mode : 'HTML', 
                              caption : "This is current preview please input Preview image"});
                        }
                        else{
                          sentMessageId = await ctx.reply(
                            `Please input ${item.text} - Current value is ${showValue}`,
                            {
                              reply_markup: { force_reply: true },
                              parse_mode: "HTML",
                            }
                          );
                        }
                        session.stucked_messages.push(sentMessageId.message_id);
                      } else {
                        sentMessageId = await ctx.reply(
                          "⚠️ Please import or create wallet first!"
                        );
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
                    sentMessageId = await ctx.reply("No wallets imported!", {
                      reply_markup: main,
                    });
                  } else {
                    let cnt = 1;
                    for (const wallet of session.wallets) {
                      const button = {
                        text:
                          (cnt === session.selectedWallet ? "✅ " : "") +
                          "Wallet " +
                          cnt +
                          ` (${formatWalletAddress(
                            getWalletPublicKeyFromindex(session, cnt)
                          )})`,
                        callback_data:
                          (item.isUserPart ? "user" : "owner") +
                          "wallet_" +
                          cnt,
                      };
                      if (cnt % 2 === 0) {
                        inlineKeyboard.inline_keyboard[
                          inlineKeyboard.inline_keyboard.length - 1
                        ].push(button);
                      }
                      // If cnt is even (like 2, 4, 6...), add a new row and push the button to the new row
                      else {
                        inlineKeyboard.inline_keyboard.push([button]);
                      }
                      cnt++;
                    }
                    inlineKeyboard.inline_keyboard.push([
                      {text : "⬅️ Go back", callback_data : item.isUserPart ? "returnToUserMenu" : "returnToOwnerMenu"}
                    ]);
                    inlineKeyboard.inline_keyboard.push([
                      { text: "Return", callback_data: "return" },
                    ]);
                    sentMessageId = await ctx.reply(
                      "Please select wallet to manage",
                      {
                        reply_markup: inlineKeyboard,
                      }
                    );
                    session.today_messages.push(sentMessageId.message_id);
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
                    const currentWallet = getCurrentWalletPublicKey(session);
                    PoolInfo.find({
                      deployerAddress: new RegExp(
                        "^" + currentWallet + "$",
                        "i"
                      ),
                    })
                      .then(async (pools) => {
                        const timestampInSeconds = Math.floor(
                          Date.now() / 1000
                        );
                        let ongoingCount = 0;
                        for (const pool of pools) {
                          if (
                            timestampInSeconds > pool.startTime &&
                            timestampInSeconds < pool.endTime
                          ) {
                            inlineKeyboard.inline_keyboard.push([
                              {
                                text: pool.token_name,
                                callback_data:
                                  "ongoing" + pool.chain + pool.poolAddress,
                              },
                            ]);
                            ongoingCount++;
                          }
                        }
                        inlineKeyboard.inline_keyboard.push([
                          {text : "⬅️ Go back", callback_data : "returnOwnerMenu"}
                        ]);
                        inlineKeyboard.inline_keyboard.push([
                          {
                            text: "Return",
                            callback_data: "return",
                          },
                        ]);
                        console.log(pools);
                        if (ongoingCount > 0) {
                          sentMessageId = await ctx.reply(
                            "Please make changes to your ongoing presale",
                            { reply_markup: inlineKeyboard }
                          );
                        } else {
                          sentMessageId = await ctx.reply(
                            "⚠️ No ongoing presale at the moment"
                          );
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
                    const currentWallet = getCurrentWalletPublicKey(session);
                    PoolInfo.find({
                      deployerAddress: new RegExp(
                        "^" + currentWallet + "$",
                        "i"
                      ),
                    })
                      .then(async (pools) => {
                        const timestampInSeconds = Math.floor(
                          Date.now() / 1000
                        );
                        let finishedCount = 0;
                        for (const pool of pools) {
                          if (timestampInSeconds > pool.endTime) {
                            inlineKeyboard.inline_keyboard.push([
                              {
                                text: pool.token_name,
                                callback_data: "finished" + pool.poolAddress,
                              },
                            ]);
                            finishedCount++;
                          }
                        }
                        inlineKeyboard.inline_keyboard.push([
                          {
                            text: "⬅️ Go back",
                            callback_data: "returnToOwnerMenu",
                          },
                        ]);
                        inlineKeyboard.inline_keyboard.push([
                          {
                            text: "Return",
                            callback_data: "return",
                          },
                        ]);
                        if (finishedCount > 0) {
                          sentMessageId = await ctx.reply(
                            "Please make changes to your finished presale",
                            { reply_markup: inlineKeyboard }
                          );
                          session.today_messages.push(sentMessageId.message_id);
                        } else {
                          sentMessageId = await ctx.reply(
                            "⚠️ No finished presale at the moment"
                          );
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
                    const currentWallet = getCurrentWalletPublicKey(session);
                    let claimSettingsCount = 0;
                    PoolInfo.find({
                      deployerAddress: new RegExp(
                        "^" + currentWallet + "$",
                        "i"
                      ),
                    })
                      .then(async (pools) => {
                        const timestampInSeconds = Math.floor(
                          Date.now() / 1000
                        );
                        for (const pool of pools) {
                          if (timestampInSeconds < pool.endTime) {
                            inlineKeyboard.inline_keyboard.push([
                              {
                                text: pool.token_name,
                                callback_data:
                                  "claim" + pool.chain + pool.poolAddress,
                              },
                            ]);
                            claimSettingsCount++;
                          }
                        }
                        
                        inlineKeyboard.inline_keyboard.push([
                          {
                            text: "⬅️ Go back",
                            callback_data: "returnToUserMenu",
                          },
                        ]);
                        inlineKeyboard.inline_keyboard.push([
                          {
                            text: "Return",
                            callback_data: "return",
                          },
                        ]);
                        if (claimSettingsCount > 0) {
                          sentMessageId = await ctx.reply(
                            "Please make changes to claim settings",
                            {
                              reply_markup: inlineKeyboard,
                            }
                          );
                          session.today_messages.push(sentMessageId.message_id);
                        } else {
                          sentMessageId = await ctx.reply(
                            "⚠️ No presales to edit claim settings"
                          );
                          // console.log("No presale", sentMessageId);
                          session.today_messages.push(sentMessageId.message_id);
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
                    const currentWallet = getCurrentWalletPublicKey(session);
                    let refundMenuCount = 0;
                    PoolInfo.find({
                      deployerAddress: new RegExp(
                        "^" + currentWallet + "$",
                        "i"
                      ),
                    })
                      .then(async (pools) => {
                        const timestampInSeconds = Math.floor(
                          Date.now() / 1000
                        );
                        for (const pool of pools) {
                          if (timestampInSeconds > pool.endTime) {
                            inlineKeyboard.inline_keyboard.push([
                              {
                                text: pool.token_name,
                                callback_data:
                                  "refund_" + pool.chain + pool.poolAddress,
                              },
                            ]);
                            refundMenuCount++;
                          }
                        }
                        inlineKeyboard.inline_keyboard.push([
                          {
                            text: "⬅️ Go back",
                            callback_data: "returnToOwnerMenu",
                          },
                        ]);
                        inlineKeyboard.inline_keyboard.push([
                          {
                            text: "Return",
                            callback_data: "return",
                          },
                        ]);
                        if (refundMenuCount > 0) {
                          sentMessageId = await ctx.reply(
                            "Please make changes to your finished presale",
                            { reply_markup: inlineKeyboard }
                          );
                          session.today_messages.push(sentMessageId.message_id);
                        } else {
                          sentMessageId = await ctx.reply(
                            "⚠️ No finished presale to refund at the moment"
                          );
                        }
                        session.today_messages.push(sentMessageId.message_id);
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
                    let finalizeCount = 0;
                    const currentWallet = getCurrentWalletPublicKey(session);
                    PoolInfo.find({
                      deployerAddress: new RegExp(
                        "^" + currentWallet + "$",
                        "i"
                      ),
                    })
                      .then(async (pools) => {
                        const timestampInSeconds = Math.floor(
                          Date.now() / 1000
                        );
                        for (const pool of pools) {
                          if (timestampInSeconds > pool.endTime) {
                            inlineKeyboard.inline_keyboard.push([
                              {
                                text: pool.token_name,
                                callback_data:
                                  "finalizeAddLP_" +
                                  pool.chain +
                                  pool.poolAddress,
                              },
                            ]);
                            finalizeCount++;
                          }
                        }
                        inlineKeyboard.inline_keyboard.push([
                          {
                            text: "⬅️ Go back",
                            callback_data: "returnToOwnerMenu",
                          },
                        ]);
                        inlineKeyboard.inline_keyboard.push([
                          {
                            text: "Return",
                            callback_data: "return",
                          },
                        ]);
                        if (finalizeCount > 0) {
                          sentMessageId = await ctx.reply(
                            "Please finalize your finished presale",
                            {
                              reply_markup: inlineKeyboard,
                            }
                          );
                          session.today_messages.push(sentMessageId.message_id);
                        } else {
                          sentMessageId = await ctx.reply(
                            "⚠️ No finished presale to finalize at the moment"
                          );
                          session.today_messages.push(sentMessageId.message_id);
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
                  let liveCount = 0;
                  PoolInfo.find({})
                    .then(async (pools) => {
                      const timestampInSeconds = Math.floor(Date.now() / 1000);
                      for (const pool of pools) {
                        if (
                          timestampInSeconds > pool.startTime &&
                          timestampInSeconds < pool.endTime
                        ) {
                          inlineKeyboard.inline_keyboard.push([
                            {
                              text: pool.token_name,
                              callback_data:
                                "live" + pool.chain + pool.poolAddress,
                            },
                          ]);
                          liveCount++;
                        }
                      }
                      inlineKeyboard.inline_keyboard.push([
                        {
                          text: "⬅️ Go back",
                          callback_data: "returnToUserMenu",
                        },
                      ]);
                      inlineKeyboard.inline_keyboard.push([
                        {
                          text: "Return",
                          callback_data: "return",
                        },
                      ]);
                      console.log(pools);
                      if (liveCount > 0) {
                        sentMessageId = await ctx.reply(
                          "All live presales : ",
                          {
                            reply_markup: inlineKeyboard,
                          }
                        );
                      } else {
                        sentMessageId = await ctx.reply(
                          "⚠️ No live presales at the moment"
                        );
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
                  let upcomingCount = 0;
                  PoolInfo.find({})
                    .then(async (pools) => {
                      const timestampInSeconds = Math.floor(Date.now() / 1000);
                      console.log("upcoming", timestampInSeconds);
                      for (const pool of pools) {
                        if (
                          timestampInSeconds < pool.startTime &&
                          timestampInSeconds < pool.endTime
                        ) {
                          inlineKeyboard.inline_keyboard.push([
                            {
                              text: pool.token_name,
                              callback_data:
                                "upcoming" + pool.chain + pool.poolAddress,
                            },
                          ]);
                          upcomingCount++;
                        }
                      }
                      inlineKeyboard.inline_keyboard.push([
                        {
                          text: "⬅️ Go back",
                          callback_data: "returnToUserMenu",
                        },
                      ]);
                      inlineKeyboard.inline_keyboard.push([
                        {
                          text: "Return",
                          callback_data: "return",
                        },
                      ]);
                      console.log(pools);
                      if (upcomingCount > 0) {
                        sentMessageId = await ctx.reply(
                          "All upcoming presales : ",
                          {
                            reply_markup: inlineKeyboard,
                          }
                        );
                      } else {
                        sentMessageId = await ctx.reply(
                          "⚠️ No upcoming presales at the moment"
                        );
                      }
                      session.today_messages.push(sentMessageId.message_id);
                    })
                    .catch((err) => console.log(err));
                } else if (item.name === "create-wallet") {
                  try {
                    // Generate a new Ethereum wallet
                    const wallet = Wallet["default"].generate();

                    // Get the private key (hex string)
                    const privateKey = wallet.getPrivateKeyString();

                    // Get the public key (hex string)
                    const publicKey = wallet.getPublicKeyString();

                    // Get the address (hex string)
                    const address = wallet.getAddressString();

                    const inlineKeyboardCreateWallet = new InlineKeyboard()
                      .text(`Deposit`, `deposit_${address}`)
                      .text(`Balance`, `balance_${address}`)
                      .row()
                      .text("⬅️ Go back", "returnToOwnerMenu")
                      .text("Return", "return");

                    console.log(`Private Key: ${privateKey}`);
                    console.log(`Public Key: ${publicKey}`);
                    console.log(`Address: ${address}`);

                    const session = getSession(ctx.from.id);

                    sentMessageId = await ctx.reply(
                      `Successfully generated New Wallet!\n <b>Private key</b>: <b>${privateKey}</b>\n<b>Address</b>: <b>${address}</b>`,
                      {
                        parse_mode: "HTML",
                        reply_markup: inlineKeyboardCreateWallet,
                      }
                    );
                    session.today_messages.push(sentMessageId.message_id);
                    if (!session.wallets.includes(privateKey)) {
                      session.wallets.push(privateKey);
                    }
                    const saveWalletInfo = [];
                    for (const pk of session.wallets) {
                      const encryptedPK = encrypt(pk);
                      saveWalletInfo.push(encryptedPK);
                    }
                    OwnerInfo.findOne({ ownerUsername: ctx.from.username })
                      .then((info) => {
                        console.log("info:", info);
                        if (info) {
                          OwnerInfo.updateOne(info, {
                            ownerWallets: saveWalletInfo,
                          })
                            .then((res) => {
                              console.log(
                                `Update Owner ${ctx.from.username}`,
                                res
                              );
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
                            ownerWallets: saveWalletInfo,
                          });
                          newOwner
                            .save()
                            .then((doc) => {
                              console.log(
                                `New Owner ${ctx.from.username} saved`
                              );
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
                    sentMessageId = await ctx.reply("⚠️ Failed creation");
                  }
                } else if (item.name === "contributions") {
                  const session = getSession(ctx.from.id);
                  contributionAction(ctx, session);
                } else if (item.name === "my-presales") {
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
                    const currentWallet = getCurrentWalletPublicKey(session);
                    PoolInfo.find({
                      deployerAddress: new RegExp(
                        "^" + currentWallet + "$",
                        "i"
                      ),
                    })
                      .then(async (pools) => {
                        const timestampInSeconds = Math.floor(
                          Date.now() / 1000
                        );
                        let presaleCount = 0;
                        for (const pool of pools) {
                          if (
                            timestampInSeconds > pool.startTime &&
                            timestampInSeconds < pool.endTime
                          ) {
                            inlineKeyboard.inline_keyboard.push([
                              {
                                text: pool.token_name + "  (ongoing)",
                                callback_data:
                                  "ongoing" + pool.chain + pool.poolAddress,
                              },
                            ]);
                            presaleCount++;
                          } else if (timestampInSeconds <= pool.startTime) {
                            inlineKeyboard.inline_keyboard.push([
                              {
                                text: pool.token_name + "  (upcoming)",
                                callback_data:
                                  "ownerUpcoming" +
                                  pool.chain +
                                  pool.poolAddress,
                              },
                            ]);
                            presaleCount++;
                          } else if (timestampInSeconds >= pool.endTime) {
                            inlineKeyboard.inline_keyboard.push([
                              {
                                text: pool.token_name + "  (finished)",
                                callback_data:
                                  "finished" + pool.chain + pool.poolAddress,
                              },
                            ]);
                            presaleCount++;
                          }
                        }
                        inlineKeyboard.inline_keyboard.push([
                          {
                            text: "⬅️ Go back",
                            callback_data: "returnToOwnerMenu",
                          },
                        ]);
                        inlineKeyboard.inline_keyboard.push([
                          {
                            text: "Return",
                            callback_data: "return",
                          },
                        ]);
                        console.log(pools);
                        if (presaleCount > 0) {
                          sentMessageId = await ctx.reply(
                            "Please make changes to your presale",
                            { reply_markup: inlineKeyboard }
                          );
                        } else {
                          sentMessageId = await ctx.reply(
                            "⚠️ No presale you have launched"
                          );
                        }
                        session.today_messages.push(sentMessageId.message_id);
                      })
                      .catch((err) => console.log(err));
                  }
                } else if (item.name === "claim") {
                  const session = getSession(ctx.from.id);
                  const wallet1 = getCurrentWalletPublicKey(session);
                  console.log("claim entered");
                  const inlineKeyboardClaim = new InlineKeyboard();
                  ContributionInfo.find({userWallet : new RegExp("^" + wallet1 + "$", "i")})
                  .then(async contributions => {
                    let cnt = 1;
                    for(const contribution of contributions){
                      const privateKey = session.wallets[session.selectedWallet - 1];
                      // Setup provider with the private key
                      const provider = new HDWalletProvider({
                        privateKeys: [privateKey],
                        providerOrUrl: providerURL[session.chain.value],
                      });

                      const web3 = new Web3(provider);
                      const accounts = await web3.eth.getAccounts();
                      const sender = accounts[0];
                      const presaleContract = new web3.eth.Contract(
                        fairlaunchAbi,
                        contribution.poolAddress
                      );
                      const isFinalized = await presaleContract.methods.isFinalized().call({from : sender});
                      const finalizeStatus = await presaleContract.methods.finalizeStatus().call({from:sender});
                      if(isFinalized === true && finalizeStatus === true){
                        const tokenContract = new web3.eth.Contract(
                          tokenAbi,
                          session.token_address.value
                        );
                        const name = await tokenContract.methods.name().call({from : sender});
                        if(cnt % 2 === 0)
                          inlineKeyboardClaim.row();
                        inlineKeyboardClaim.text(name, `userClaim_${contribution.poolAddress}`);
                        cnt ++;
                      }
                    }
                    if(cnt > 1){
                      inlineKeyboardClaim.row();
                      inlineKeyboardClaim.text("⬅️ Go back", "returnToUserMenu");
                      inlineKeyboardClaim.text("Return", "return");
                      sentMessageId = await ctx.reply('Please claim your token allocation', {reply_markup : inlineKeyboardClaim});
                    } else {
                      sentMessageId = await ctx.reply('⚠️ No available claim at the moment');
                    }
                    session.today_messages.push(sentMessageId.message_id);
                  })
                  .catch(err => console.log(err))
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
          if (
            item.name !== "presale-settings" &&
            item.name !== "contribution-claim"
          )
            submenu.back("⬅️ Go back", backMiddleware);
          else submenu.back("⬅️ Go back", backMiddlewareOwnerMenu);
          submenu.text("↩️ Return", (ctx) => {
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
      const sentMessageId = await ctx.reply(`You pressed ${menuData.text}`);
      const session = getSession(ctx.from.id);
      session.today_messages.push(sentMessageId.message_id);
    });
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

async function launchPool(ctx, privateKey, session, username) {
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
    console.log("sender", sender);
    await removeAllMessages(ctx, -1);

    let sentMessageId = "";
    sentMessageId = await ctx.reply(
      "Under progress of approving tokens to smart contract!!!\n Please wait for a while!!!\n"
    );
    session.today_messages.push(sentMessageId.message_id);

    const tokenContract = new web3.eth.Contract(
      tokenAbi,
      session.token_address.value
    );
    console.log("token address", session.token_address.value);
    console.log("factory address", factoryAddress[session.chain.value]);
    const result = await tokenContract.methods
      .approve(factoryAddress[session.chain.value], session.token_supply.value)
      .send({ from: sender });
    await removeAllMessages(ctx, -1);

    sentMessageId = await ctx.reply(
      `Approving successful! Transaction hash is ${result.transactionHash}\nUnder progressing of fairlaunch creation!!!\n Please wait for a while!!!!\n`
    );
    session.today_messages.push(sentMessageId.message_id);
    console.log("result", result);
    console.log("success approve");
    setTimeout(async () => {
      // Create a contract instance
      try {
        console.log("poolCreate", factoryAddress[session.chain.value]);
        const contract = new web3.eth.Contract(
          factoryABI,
          factoryAddress[session.chain.value]
        );
        const accounts = await web3.eth.getAccounts();
        const sender = accounts[0];

        let poolAddress = "";
        // Replace 'yourFunction' and arguments with your actual function and its parameters
        const response = await contract.methods
          .createPool(
            {
              poolAddress: sender,
              tokenAddress: session.token_address.value,
              sellAmount: session.sellAmount.value,
              acceptedTokens:
                session.accepted_currency.value === "ETH" ||
                session.accepted_currency.value === "BNB"
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
              _isPancakeRouter:
                session.router.value === "Uniswap" ? false : true,
              _whitelistEnabeld: session.whitelist_enabled.value,
            },
            [sender]
          )
          .send({ from: sender, value : "10000000000000000"});

        console.log(response);
        if (response.events && response.events.poolCreated) {
          const event = response.events.poolCreated;
          console.log("poolCreated event found!", event);

          // Extracting the values
          poolAddress = event.returnValues.poolAddress;
          const deployerAddress = event.returnValues.deployerAddress;
          await removeAllMessages(ctx, -1);
          const transactionLinkHead = session.chain.value === "Binance" ? "https://testnet.bscscan.com/address/" : "https://goerli.etherscan.io/address/";
          sentMessageId = await ctx.reply(
            `Launched successfully!!! address is ${poolAddress}\n${
              transactionLinkHead+poolAddress
            }`,
            { reply_markup: returnKeyboard }
          );
          session.today_messages.push(sentMessageId.message_id);
          console.log("Pool Address:", poolAddress);
          console.log("Deployer Address:", deployerAddress);

          if (poolAddress !== "") {
            const newPoolInfo = new PoolInfo({
              poolAddress,
              deployerAddress: sender,
              deployerUsername: ctx.from.username,
              token_address: session.token_address.value,
              token_name: session.token_name.value,
              token_symbol: session.token_symbol.value,
              accepted_currency: session.accepted_currency.value,
              chain: session.chain.value,
              sellAmount:
                session.sellAmount.value === undefined
                  ? 0
                  : session.sellAmount.value,
              softcap:
                session.softcap.value === undefined ? 0 : session.softcap.value,
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
              .then((doc) =>
                console.log(`Pool Info saved ${ctx.from.username}`, doc)
              )
              .catch((err) =>
                console.log(`${ctx.from.username} Pool Info save failed`, err)
              );
          }
        } else {
          await removeAllMessages(ctx, -1);
          sentMessageId = await ctx.reply(`Pool Creation failed!!!`, {
            reply_markup: returnKeyboard,
          });
          session.today_messages.push(sentMessageId.message_id);
        }
        // waitForTransactionReceipt(response.transactionHash, session)
        //   .then(async (receipt) => {
        //     console.log("Transaction confirmed", receipt);

        //     receipt.logs.forEach(async (log) => {
        //       const event = contract._decodeEventABI.call(
        //         {
        //           name: "poolCreated",
        //           jsonInterface: contract._jsonInterface,
        //         },
        //         log
        //       );

        //       if (event && event.event === "poolCreated") {
        //         console.log("poolCreated event found!", event);

        //         // Extracting the values
        //         poolAddress = event.returnValues.poolAddress;
        //         const deployerAddress = event.returnValues.deployerAddress;
        //         const returnKeyboard = new InlineKeyboard().text(
        //           "Return",
        //           "return"
        //         );
        //         await removeAllMessages(ctx, -1);
        //         sentMessageId = await ctx.reply(
        //           `Launched successfully!!! address is ${poolAddress}`,
        //           { reply_markup: returnKeyboard }
        //         );
        //         session.today_messages.push(sentMessageId.message_id);
        //         console.log("Pool Address:", poolAddress);
        //         console.log("Deployer Address:", deployerAddress);
        //       }
        //     });
        //     if (poolAddress !== "") {
        //       const newPoolInfo = new PoolInfo({
        //         poolAddress,
        //         deployerAddress: sender,
        //         deployerUsername: username,
        //         token_address: session.token_address.value,
        //         token_name: session.token_name.value,
        //         token_symbol: session.token_symbol.value,
        //         accepted_currency: session.accepted_currency.value,
        //         chain: session.chain.value,
        //         sellAmount:
        //           session.sellAmount.value === undefined
        //             ? 0
        //             : session.sellAmount.value,
        //         softcap:
        //           session.softcap.value === undefined
        //             ? 0
        //             : session.softcap.value,
        //         minimumBuyAmount:
        //           session.minimumBuyAmount.value === undefined
        //             ? 0
        //             : session.minimumBuyAmount.value,
        //         maximumBuyAmount:
        //           session.maximumBuyAmount.value === undefined
        //             ? 0
        //             : session.maximumBuyAmount.value,
        //         whitelist_enabled: session.whitelist_enabled.value,
        //         referralEnabled: session.referralEnabled.value,
        //         router: session.router.value,
        //         refundType: session.refundType.value,
        //         liquidityPercentage: session.liquidityPercentage.value,
        //         startTime: session.startTime.value,
        //         endTime: session.endTime.value,
        //         lockupPeriod: session.lockupPeriod.value,
        //         logoURL: session.logoURL.value,
        //         websiteURL: session.websiteURL.value,
        //         twitterURL: session.twitterURL.value,
        //         telegramURL: session.telegramURL.value,
        //         facebookURL: session.facebookURL.value,
        //         discordURL: session.discordURL.value,
        //         githubURL: session.githubURL.value,
        //         instagramURL: session.instagramURL.value,
        //         redditURL: session.redditURL.value,
        //         preview: session.preview.value,
        //         description: session.description.value,
        //       });
        //       newPoolInfo
        //         .save()
        //         .then((doc) => console.log(`Pool Info saved ${username}`, doc))
        //         .catch((err) =>
        //           console.log(`${username} Pool Info save failed`, err)
        //         );
        //     }
        //   })
        //   .catch(async (err) => {
        //     console.log(err.message);
        //     const returnKeyboard = new InlineKeyboard().text(
        //       "Return",
        //       "return"
        //     );
        //     await removeAllMessages(ctx, -1);
        //     sentMessageId = await ctx.reply("Failed creating fairlaunch", {
        //       reply_markup: returnKeyboard,
        //     });
        //     session.today_messages.push(sentMessageId.message_id);
        //   });
        // Close the provider
        provider.engine.stop();
        return poolAddress;
      } catch (err) {
        console.log(err);

        await removeAllMessages(ctx, -1);
        sentMessageId = await ctx.reply(`Failed creating fairlaunch\n${err}`, {
          reply_markup: returnKeyboard,
        });
        session.today_messages.push(sentMessageId.message_id);
      }
    }, 10000);
    return "";
  } catch (err) {
    console.log(err);
    await removeAllMessages(ctx, -1);
    sentMessageId = await ctx.reply(`Failed creating fairlaunch\n${err}`, {
      reply_markup: returnKeyboard,
    });
    session.today_messages.push(sentMessageId.message_id);
    return "";
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
    return "success";
  } catch (err) {
    console.log(err);
    return err;
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
    return "success";
  } catch (err) {
    console.log(err);
    return err;
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
    console.error("failed to delete message:", err);
  }
}

async function returnAction(ctx, returnMenu) {
  ctx.answerCallbackQuery({ text: "Returning main menu" });
  const session = getSession(ctx.from.id);
  await removeAllMessages(ctx, -1);
  if(returnMenu === undefined) {
    const sentMessageId = await ctx.reply("Main Menu", { reply_markup: main });
    session.today_messages.push(sentMessageId.message_id);
  } else {
    const sentMessageId = await ctx.reply("Owner Menu", {reply_markup : returnMenu});
    session.today_messages.push(sentMessageId.message_id);
  }
}

async function removeAllMessages(ctx, exceptedIndex = -1) {
  const session = getSession(ctx.from.id);
  try {
    let cnt = 0;
    let remainValue = -1;
    console.log(session.today_messages);
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
    if (exceptedIndex !== -1) session.today_messages = [remainValue];
    else session.today_messages = [];
  } catch (err) {
    console.error("failed to delete message", err);
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
            const saveWalletInfo = [];
            for (const encryptedPK of ownerInfo.ownerWallets) {
              const decryptedPK = decrypt(encryptedPK);
              saveWalletInfo.push(decryptedPK);
            }
            session.wallets = saveWalletInfo;
          })
          .catch((err) => console.log(err));
        const sentMessageId = await ctx.reply("Main Menu:", {
          reply_markup: main,
        });
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
          const saveWalletInfo = [];
          for (const encryptedPK of ownerInfo.ownerWallets) {
            const decryptedPK = decrypt(encryptedPK);
            saveWalletInfo.push(decryptedPK);
          }
          session.wallets = saveWalletInfo;
        })
        .catch((err) => console.log(err));
      const sentMessageId = await ctx.reply("Owner Menu:", {
        reply_markup: ownerMenu,
      });
      session.today_messages.push(sentMessageId.message_id);
    });
    bot.command("usermenu", async (ctx) => {
      console.log("user menu : ", ctx.from.username);
      const session = getSession(ctx.from.id);
      await removeAllMessages(ctx, -1);

      const sentMessageId = await ctx.reply("User Menu:", {
        reply_markup: userMenu,
      });
      session.today_messages.push(sentMessageId.message_id);
    });
    bot.on("message:text", async (ctx) => {
      try {
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
            let validationResult = true;
            if(isValidDate(answer) === false) {
              validationResult = false;
            }
            else{
              const date = new Date(answer);
              const answerInNumber = Math.floor(date.getTime() / 1000);
               if(session.isExpectingAnswer === "startTime") {
                validationResult = session.startTime.validation(answerInNumber);
              }
              else validationResult = session.endTime.validation(answerInNumber);
            }
            if (validationResult === true) {
              const date = new Date(answer);
              answer = Math.floor(date.getTime() / 1000);
              session[session.isExpectingAnswer].value = answer;
              session.current_menu.update();
              await removeAllMessages(ctx, 0);
              const reviewKeyboard = new InlineKeyboard()
                .text(`✅ Chain - ${session.chain.value}`, "chainReView")
                .text(
                  `${
                    walletPubKey === ""
                      ? "🚫 Please import wallet"
                      : "✅ " + walletPubKey
                  }`,
                  "walletReView"
                )
                .row()
                .text("return", "return");
              const showText = await replyReviewMessage(
                ctx,
                session,
                session[session.isExpectingAnswer].category
              );
              await ctx.api.editMessageText(
                ctx.chat.id,
                session.today_messages[0],
                showText,
                { parse_mode: "HTML", reply_markup: presaleConfigurationMenu }
              );
              // const sentMessageId = await replyReviewLaunch(ctx, session, presaleConfigurationMenu, false, session[session.isExpectingAnswer].category);
              // console.log("review launch : ", sentMessageId);
              // session.today_messages.push(sentMessageId.nessage_id);
              session.isExpectingAnswer = "";
            } else {
              sentMessageId = await ctx.reply(
                "⚠️ please input valid date again YYYY-MM-DD HH:MM:SS (must be greater than now and the duration shouldn't exceed 7 days)"
              );
              session.today_messages.push(sentMessageId.message_id);
              return;
            }
          } else if (
            session.isExpectingAnswer === "minimumBuyAmount" ||
            session.isExpectingAnswer === "maximumBuyAmount" ||
            session.isExpectingAnswer === "softcap"
          ) {
            if (isNumber(answer)) {
              let decimalValue = 18;
              if (session["accepted_currency"].value === "BlazeX")
                decimalValue = 9;
              else if (session["accepted_currency"].value === "USDT")
                decimalValue = 6;
              const answerValueToStore = parseUnits(answer, decimalValue);
              if (
                (await session[session.isExpectingAnswer].validation(
                  answerValueToStore
                )) === true
              ) {
                session[session.isExpectingAnswer].value = answerValueToStore;
                await removeAllMessages(ctx, 0);
                const showText = await replyReviewMessage(
                  ctx,
                  session,
                  session[session.isExpectingAnswer].category
                );

                await ctx.api.editMessageText(
                  ctx.chat.id,
                  session.today_messages[0],
                  showText,
                  { parse_mode: "HTML", reply_markup: presaleConfigurationMenu }
                );
                session.isExpectingAnswer = "";
              } else {
                sentMessageId = await ctx.reply(
                  `${session[session.isExpectingAnswer].invalid_description}`
                );
              }
            } else {
              if (
                (await session[session.isExpectingAnswer].validation(
                  answer
                )) === false
              ) {
                sentMessageId = await ctx.reply(
                  `${session[session.isExpectingAnswer].invalid_description}`
                );
              }
            }
          } else if (session.isExpectingAnswer === "sellAmount") {
            if (isNumber(answer)) {
              let decimalValue = session["token_decimals"].value;
              const answerValueToStore = parseUnits(answer, decimalValue);
              if (
                (await session[session.isExpectingAnswer].validation(
                  answerValueToStore.toString()
                )) === true
              ) {
                session[session.isExpectingAnswer].value = answerValueToStore;
                await removeAllMessages(ctx, 0);
                const showText = await replyReviewMessage(
                  ctx,
                  session,
                  session[session.isExpectingAnswer].category
                );

                await ctx.api.editMessageText(
                  ctx.chat.id,
                  session.today_messages[0],
                  showText,
                  { parse_mode: "HTML", reply_markup: presaleConfigurationMenu }
                );
                session.isExpectingAnswer = "";
              } else {
                sentMessageId = await ctx.reply(
                  `${session[session.isExpectingAnswer].invalid_description}`
                );
              }
            } else {
              if (
                (await session[session.isExpectingAnswer].validation(
                  answer
                )) === false
              ) {
                sentMessageId = await ctx.reply(
                  `${session[session.isExpectingAnswer].invalid_description}`
                );
              }
            }
          } else if (session.isExpectingAnswer === "find-project") {
              session.isExpectingAnswer = "";
              PoolInfo.find({
                $or: [
                  {poolAddress: new RegExp(answer, "i")},
                  {token_name : new RegExp("^" + answer, "i")}
                ]
              })
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
                      const tokenInformationResult =
                        await getPresaleInformation(
                          pool.poolAddress,
                          pool.token_address,
                          session
                        );

                      inlineKeyboards.inline_keyboard[0].push({
                        text: "Back To Browse Projects",
                        callback_data: "back",
                      });
                      inlineKeyboards.inline_keyboard[0].push({
                        text: "Vie Current Price if ended (Link to Dextools)",
                        url: "https://www.dextools.io/app/",
                      });
                      inlineKeyboards.inline_keyboard.push([
                        {
                          text: "Contribute",
                          callback_data: `Contribute_${pool.poolAddress}`,
                        },
                      ]);
                      inlineKeyboards.inline_keyboard.push([{
                        text : "Send",
                        callback_data : `SendContirbute_${pool.poolAddress}`
                      }])
                      inlineKeyboards.inline_keyboard[1].push({
                        text: "Emergency Withdraw",
                        callback_data: `EW_${pool.poolAddress}`,
                      });
                      inlineKeyboards.inline_keyboard.push([
                        {
                          text: "⬅️ Go back",
                          callback_data: "returnToUserMenu",
                        },
                      ]);
                      inlineKeyboards.inline_keyboard.push([
                        {
                          text: "Return",
                          callback_data: "return",
                        },
                      ]);
                      if (tokenInformationResult.isFinalized === false) {
                        await removeAllMessages(ctx, -1);
                        await showInformationAboutProjectOwner(
                          pool,
                          ctx,
                          tokenInformationResult,
                          session,
                          inlineKeyboards
                        );
                      }
                    }
                  }
                })
                .catch((err) => {
                  console.log(err);
                });
            
          } else if (session.isExpectingAnswer === "search") {
            if (isValidEthereumAddress(answer) == true) {
              session.isExpectingAnswer = "";
              PoolInfo.find({
                token_address: new RegExp("^" + answer + "$", "i"),
              })
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
                      const tokenInformationResult =
                        await getPresaleInformation(
                          pool.poolAddress,
                          pool.token_address
                        );

                      inlineKeyboards.inline_keyboard[0].push({
                        text: "Back To Browse Projects",
                        callback_data: "back",
                      });
                      inlineKeyboards.inline_keyboard[0].push({
                        text: "Vie Current Price if ended (Link to Dextools)",
                        url: "https://www.dextools.io/app/",
                      });
                      inlineKeyboards.inline_keyboard.push([
                        {
                          text: "Contribute",
                          callback_data: `Contribute_${pool.poolAddress}`,
                        },
                      ]);
                      inlineKeyboards.inline_keyboard.push([{
                        text : "Send",
                        callback_data : `SendContirbute_${pool.poolAddress}`
                      }])
                      inlineKeyboards.inline_keyboard[1].push({
                        text: "Emergency Withdraw",
                        callback_data: `EW_${pool.poolAddress}`,
                      });
                      inlineKeyboards.inline_keyboard.push([
                        {
                          text: "⬅️ Go back",
                          callback_data: "returnToUserMenu",
                        },
                      ]);
                      inlineKeyboards.inline_keyboard.push([
                        {
                          text: "Return",
                          callback_data: "return",
                        },
                      ]);
                      if (tokenInformationResult.isFinalized === false) {
                        await removeAllMessages(ctx, -1);
                        await showInformationAboutProjectOwner(
                          pool,
                          ctx,
                          tokenInformationResult,
                          session,
                          inlineKeyboards
                        );
                      }
                    }
                  }
                })
                .catch((err) => {
                  console.log(err);
                });
            } else {
              sentMessageId = await ctx.reply(
                "⚠️ Please input valid address again"
              );
            }
          } else if (session.isExpectingAnswer === "token_address") {
            const resultValidation = await session.token_address.validation(
              answer
            );
            if (resultValidation == true) {
              const provider = new Web3.providers.HttpProvider(
                providerURL[session.chain.value]
              );
              const web3 = new Web3(provider);
              const tokenAddress = answer;
              console.log("answer", tokenAddress);
              try {
                const tokenContract = new web3.eth.Contract(
                  tokenAbi,
                  tokenAddress
                );

                const name = await tokenContract.methods.name().call();
                session.token_name.value = name;
                console.log("name", name);
                const symbol = await tokenContract.methods.symbol().call();
                session.token_symbol.value = symbol;
                console.log("symbol", symbol);
                const decimals = await tokenContract.methods.decimals().call();
                console.log("decimals", decimals);

                session.token_decimals.value = parseInt(decimals);
                const supply = await tokenContract.methods.totalSupply().call();
                session.token_supply.value = supply;
                console.log("supply", supply);

                session[session.isExpectingAnswer].value = answer;
                // ctx.reply(`Token Name : ${name}\nToken Symbol : ${symbol}`, {
                //   reply_markup: main,
                // });
                session.current_menu.update();
                await removeAllMessages(ctx, 0);
                const reviewKeyboard = new InlineKeyboard()
                  .text(`✅ Chain - ${session.chain.value}`, "chainReView")
                  .text(
                    `${
                      walletPubKey === ""
                        ? "🚫 Please import wallet"
                        : "✅ " + walletPubKey
                    }`,
                    "walletReView"
                  )
                  .row()
                  .text("Return", "return");
                const showText = await replyReviewMessage(
                  ctx,
                  session,
                  session[session.isExpectingAnswer].category
                );
                // console.log('show Text', showText);
                await ctx.api.editMessageText(
                  ctx.chat.id,
                  session.today_messages[0],
                  showText,
                  { parse_mode: "HTML", reply_markup: tokenSetupMenu }
                );
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
              sentMessageId = await ctx.reply(
                session.token_address.invalid_description
              );
            }
          } else if (
            session.isExpectingAnswer.startsWith("amountToContribute")
          ) {
            const parts = session.isExpectingAnswer.split("amountToContribute");
            if (isNumber(answer)) {
              PoolInfo.findOne({poolAddress : new RegExp("^" + parts[1] + "$", "i")}).then(async pool => {session.amountToContribute = answer;
              if(parseSoftCap(pool.minimumBuyAmount, pool.accepted_currency) * 1.0 < answer * 1.0 && 
                parseSoftCap(pool.maximumBuyAmount, pool.accepted_currency) * 1.0 > answer * 1.0){
              session.isExpectingAnswer = "";
              const inlineKeyboardContribute = new InlineKeyboard().text(
                `Contribute ${answer}`,
                `user_contribute${parts[1]}`
              );
              sentMessageId = await ctx.reply(
                `Amount to Contribute (${pool.accepted_currency}) :<b>${answer}</b>\n`,
                { reply_markup: inlineKeyboardContribute, parse_mode: "HTML" }
              );
              session.today_messages.push(sentMessageId.message_id);
                }else{
                  sentMessageId = await ctx.reply(`⚠️ Your contribution amount invalid\nMinimum buy amount: ${parseSoftCap(pool.minimumBuyAmount, pool.accepted_currency)} ${pool.accepted_currency}\nMaximum buy amount: ${
                    parseSoftCap(pool.maximumBuyAmount, pool.accepted_currency)
                  } ${pool.accepted_currency}`)
                  session.today_messages.push(sentMessageId.message_id);
                }
            }).catch(err => console.log(err))
              
            } else {
              sentMessageId = await ctx.reply("please input correct amount");
            }
          } else if(session.isExpectingAnswer !== "preview") {
            if (await session[session.isExpectingAnswer].validation(answer)) {
              session[session.isExpectingAnswer].value = answer;
              await removeAllMessages(ctx, 0);
              if (session.isExpectingAnswer === "importedWallet") {
                if (!session.wallets.includes(answer)) {
                  session.wallets.push(answer);
                }
                const saveWalletInfo = [];
                for (const pk of session.wallets) {
                  const encryptedPK = encrypt(pk);
                  saveWalletInfo.push(encryptedPK);
                }
                OwnerInfo.findOne({ ownerUsername: ctx.from.username })
                  .then((info) => {
                    if (info) {
                      OwnerInfo.updateOne(info, {
                        ownerWallets: saveWalletInfo,
                      })
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
                        ownerWallets: saveWalletInfo,
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
                    `${
                      walletPubKey === ""
                        ? "🚫 Please import wallet"
                        : "✅ " + walletPubKey
                    }`,
                    "walletReView"
                  )
                  .row()
                  .text("⬅️ Go back", "returnToOwnerMenu")
                  .text("Return", "return");
                let showMenu;
                if (session[session.isExpectingAnswer].category === "setup") {
                  showMenu = tokenSetupMenu;
                } else if (
                  session[session.isExpectingAnswer].category ===
                  "configuration"
                ) {
                  showMenu = presaleConfigurationMenu;
                } else if (
                  session[session.isExpectingAnswer].category === "information"
                ) {
                  showMenu = presaleInformationMenu;
                } else {
                  showMenu = reviewKeyboard;
                }
                const showText = await replyReviewMessage(
                  ctx,
                  session,
                  session[session.isExpectingAnswer].category
                );

                await ctx.api.editMessageText(
                  ctx.chat.id,
                  session.today_messages[0],
                  showText,
                  { parse_mode: "HTML", reply_markup: showMenu }
                );
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
          } else {
            ctx.reply('Upload a photo for preview!');
          }
        } else {
          sentMessageId = await ctx.reply("Send /start to see the menu");
        }
        if (sentMessageId !== undefined)
          session.today_messages.push(sentMessageId.message_id);
      } catch (err) {
        console.log(err);
      }
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
          variable !== "importedWallet" &&
          !session[variable].hasOwnProperty("notRequired")
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
      if(validation_result === true) {
        const privateKey = session.wallets[session.selectedWallet - 1];
        const provider = new HDWalletProvider({
          privateKeys : [privateKey],
          providerOrUrl : providerURL[session.chain.value]
        })
        const web3 =new Web3(provider);
        const accounts = await web3.eth.getAccounts();
        const sender = accounts[0];

        const tokenContract = new web3.eth.Contract(tokenAbi, session.token_address.value);
        const result = await tokenContract.methods.balanceOf(sender).call({from : sender});
        const decimalValue = await tokenContract.methods.decimals().call({from:sender});
        const requiredTokenAmount = (100.0 + session.liquidityPercentage.value * 1.0) * formatUnits(session.sellAmount.value, parseInt(decimalValue)) / 100.0;
        const currentTokenAmount = formatUnits(result, parseInt(decimalValue)) * 1.0;
        if(currentTokenAmount < requiredTokenAmount) {
          errors.push(`⚠️ Required token amount is ${requiredTokenAmount}, You don't have enough tokens in your wallet.\nYour balance : ${currentTokenAmount}`);
          validation_result = false;
        }
      }

      if (validation_result === true) {
        if (session.wallets.length > 0) {
          await ctx.answerCallbackQuery({
            text: "Launching!!! Please wait while launching",
          });
          const poolAddress = await launchPool(
            ctx,
            session.wallets[session.selectedWallet - 1],
            session
          ).catch((err) => console.log(err));
        } else {
          await ctx.answerCallbackQuery({
            text: "No wallet is conencted, please import wallet first!",
          });
          sentMessageId = await ctx.reply(
            "No wallet is connected, please import wallet first!"
          );
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
            .text("My presales", `returnToOwnerMenu`)
            .text("Start a Fair Launch", `start-fairlaunch`)
            .row()
            .text("Remove Wallet", `removeWallet_`)
            .text(
              "Deposit",
              `deposit_${getWalletPublicKeyFromindex(
                session,
                session.selectedWallet
              )}`
            )
            .row()
            // TODO : should indicate same callback data as send menu
            .text("Send", `send-menu_${session.selectedWallet - 1}`)
            .text(
              "Show Private Key",
              `showPrivateKey_${session.selectedWallet}`
            )
            .row()
            .text("⬅️ Go back", 'returnToOwnerMenu')
            .text("Return", `return`);

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
                inlineKeyboard.inline_keyboard[
                  inlineKeyboard.inline_keyboard.length - 1
                ].push(button);
              }
              // If cnt is even (like 2, 4, 6...), add a new row and push the button to the new row
              else {
                inlineKeyboard.inline_keyboard.push([button]);
              }
              cnt++;
            }
            inlineKeyboard.inline_keyboard.push([
              { text: "⬅️ Go back", callback_data: "returnToOwnerMenu" },
            ]);
            inlineKeyboard.inline_keyboard.push([
              { text: "Return", callback_data: "return" },
            ]);
            const result = await ctx.editMessageReplyMarkup({
              reply_markup: inlineKeyboard,
            });
          }
          // Replace 'yourPrivateKeyHex' with your actual private key in hexadecimal format.

          const addressHex = getCurrentWalletPublicKey(session);

          const balanceResult = await getTotalBalance(addressHex);

          sentMessageId = await ctx.reply(
            `Current Wallet's information : ${addressHex}\nEtheruem\n  ---- ETH: ${balanceResult.Ethereum.NATIVE}\n  ---- USDT: ${balanceResult.Ethereum.USDT}\n  ---- BalzeX: ${balanceResult.Ethereum.BLAZEX}\nBinance\n  ---- BNB: ${balanceResult.Binance.NATIVE}\n  ---- USDT: ${balanceResult.Binance.USDT}\n  ---- BLAZEX: ${balanceResult.Binance.BLAZEX}`,
            { reply_markup: inlineKeyboardOwnerWallet, parse_mode: "HTML" }
          );
          session.today_messages.push(sentMessageId.message_id);
        }
      } else if (data.startsWith("userwallet_")) {
        const parts = data.split("userwallet_");
        if (parts.length > 1) {
          // ctx.answerCallbackQuery({ text: "Pressed Wallet " + parts[1] + "!" });
          const session = getSession(ctx.from.id);
          session.selectedWallet = parseInt(parts[1]);
          // Replace 'yourPrivateKeyHex' with your actual private key in hexadecimal format.

          const addressHex = getCurrentWalletPublicKey(session);

          const inlineKeybardUserWallet = new InlineKeyboard()
            .text(
              "Contributions & Claim",
              `userCC${
                session.selectedWallet - 1
              }`
            )
            .text(
              "Show Private Key",
              `showPrivateKey_${session.selectedWallet}`
            )
            .row()
            .text("Remove Wallet", `removeWallet_`)
            .text(
              "Deposit",
              `deposit_${getWalletPublicKeyFromindex(
                session,
                session.selectedWallet
              )}`
            )
            .row()
            // TODO : Send should be similar to Deployer Bot
            .text("Send", `send-menu_${session.selectedWallet - 1}`)
            .row()
            .text("⬅️ Go back", "returnToUserMenu")
            .text("Return", "return");

          sentMessageId = await ctx.reply(
            "Current Owner Wallet's Information : " + addressHex,
            { reply_markup: inlineKeybardUserWallet }
          );
          session.today_messages.push(sentMessageId.message_id);
        }
      } else if (data.startsWith("upcoming")) {
        let poolChain;
        let startString = "upcomingEthereum";
        if (data.startsWith("upcomingEthereum")) {
          poolChain = "Ethereum";
        } else if (data.startsWith("upcomingBinance")) {
          poolChain = "Binance";
          startString = "upcomingBinance";
        }
        const parts = data.split(startString);
        if (parts.length > 1) {
          const poolAddress = parts[1];
          PoolInfo.find({
            poolAddress: new RegExp("^" + poolAddress + "$", "i"),
            chain: new RegExp("^" + poolChain + "$", "i"),
          })
            .then(async (pools) => {
              if (pools.length > 0) {
                const session = getSession(ctx.from.id);
                const replyInlineKeyboard = new InlineKeyboard()
                  .row()
                  .text("Return", "return");
                const tokenInformationResult = await getPresaleInformation(
                  poolAddress,
                  poolAddress,
                  session
                );
                if (tokenInformationResult.isFinalized === false) {
                  await removeAllMessages(ctx, -1);
                  await showInformationAboutProjectOwner(
                    pools[0],
                    ctx,
                    tokenInformationResult,
                    session,
                    replyInlineKeyboard
                  );
                }
              }
            })
            .catch(async (err) => {
              console.log(err);
              sentMessageId = await ctx.reply(`Wrong address inputed`);
              const session = getSession(ctx.from.id);
              session.today_messages.push(sentMessageId.message_id);
            });
        }
      } else if (data.startsWith("ownerUpcoming")) {
        let poolChain;
        let startString = "ownerUpcomingEthereum";
        if (data.startsWith("ownerUpcomingEthereum")) {
          poolChain = "Ethereum";
        } else if (data.startsWith("ownerUpcomingBinance")) {
          poolChain = "Binance";
          startString = "ownerUpcomingBinance";
        }
        const parts = data.split(startString);
        if (parts.length > 1) {
          const poolAddress = parts[1];
          PoolInfo.find({
            poolAddress: new RegExp("^" + poolAddress + "$", "i"),
            chain: new RegExp("^" + poolChain + "$", "i"),
          })
            .then(async (pools) => {
              if (pools.length > 0) {
                const session = getSession(ctx.from.id);
                const replyInlineKeyboard = new InlineKeyboard()
                  .row()
                  .text("Return", "return");
                const tokenInformationResult = await getPresaleInformation(
                  poolAddress,
                  poolAddress,
                  session
                );
                if (tokenInformationResult.isFinalized === false) {
                  await removeAllMessages(ctx, -1);
                  await showInformationAboutProjectOwner(
                    pools[0],
                    ctx,
                    tokenInformationResult,
                    session,
                    replyInlineKeyboard
                  );
                }
              }
            })
            .catch(async (err) => {
              console.log(err);
              sentMessageId = await ctx.reply(`Wrong address inputed`);
              const session = getSession(ctx.from.id);
              session.today_messages.push(sentMessageId.message_id);
            });
        }
      } else if (data.startsWith("ongoing")) {
        let poolChain;
        let startString = "ongoingEthereum";
        if (data.startsWith("ongoingEthereum")) {
          poolChain = "Ethereum";
        } else if (data.startsWith("ongoingBinance")) {
          poolChain = "Binance";
          startString = "ongoingBinance";
        }
        const parts = data.split(startString);
        if (parts.length > 1) {
          const poolAddress = parts[1];
          PoolInfo.find({
            poolAddress: new RegExp("^" + poolAddress + "$", "i"),
            chain: new RegExp("^" + poolChain + "$", "i"),
          })
            .then(async (pools) => {
              if (pools.length > 0) {
                const session = getSession(ctx.from.id);
                const replyInlineKeyboard = new InlineKeyboard()
                  .text("Refresh Data : ", `ongoing${poolChain}${poolAddress}`)
                  // TODO : editProDetail_
                  .text(
                    "Edit project details",
                    `editProDetail_${poolChain}${poolAddress}`
                  )
                  .row()
                  .text(
                    "Finalize & Add LP",
                    `finalizeAddLP_${poolChain}${poolAddress}`
                  )
                  .text(
                    "Cancel & Refund",
                    `refund_${poolChain}${poolAddress}`
                  )
                  .row()
                  .text("⬅️ Go back", "returnToOwnerMenu")
                  .text("Return", "return");

                const tokenInformationResult = await getPresaleInformation(
                  poolAddress,
                  poolAddress,
                  session
                );
                if (tokenInformationResult.isFinalized === false) {
                  await removeAllMessages(ctx, -1);
                  await showInformationAboutProjectOwner(
                    pools[0],
                    ctx,
                    tokenInformationResult,
                    session,
                    replyInlineKeyboard
                  );
                }
                // ctx.reply(`The ongoing pool is ${poolAddress}`);
              }
            })
            .catch(async (err) => {
              console.log(err);
              sentMessageId = await ctx.reply(`Wrong address inputed`);
              const session = getSession(ctx.from.id);
              session.today_messages.push(sentMessageId.message_id);
            });
        }
      } else if (data.startsWith("finished")) {
        let poolChain;
        let startString = "finishedEthereum";
        if (data.startsWith("finishedEthereum")) {
          poolChain = "Ethereum";
        } else if (data.startsWith("finishedBinance")) {
          poolChain = "Binance";
          startString = "finishedBinance";
        }
        const parts = data.split(startString);
        if (parts.length > 1) {
          const poolAddress = parts[1];
          PoolInfo.find({
            poolAddress: new RegExp("^" + poolAddress + "$", "i"),
          })
            .then(async (pools) => {
              if (pools.length > 0) {
                const session = getSession(ctx.from.id);
                const replyInlineKeyboard = new InlineKeyboard()
                  .text("Refund", `refund_${pools[0].chain}${poolAddress}`)
                  .row()
                  .text(
                    "Finalize & Add LP",
                    `finalizeAddLP_${pools[0].chain}${poolAddress}`
                  )
                  .row()
                  .text("⬅️ Go back", "returnToOwnerMenu")
                  .text("Return", "return");

                const tokenInformationResult = await getPresaleInformation(
                  poolAddress,
                  poolAddress,
                  session
                );
                await removeAllMessages(ctx, -1);
                await showInformationAboutProjectOwner(
                  pools[0],
                  ctx,
                  tokenInformationResult,
                  session,
                  replyInlineKeyboard
                );
                // ctx.reply(`The ongoing pool is ${poolAddress}`);
              }
            })
            .catch(async (err) => {
              console.log(err);
              sentMessageId = await ctx.reply(`Wrong address inputed`);
              const session = getSession(ctx.from.id);
              session.today_messages.push(sentMessageId.message_id);
            });
        }
      } else if (data.startsWith("Contribute_")) {
        const parts = data.split("Contribute_");
        if (parts.length > 1) {
          const session = getSession(ctx.from.id);
          const poolAddress = parts[1];
          PoolInfo.findOne({poolAddress : new RegExp("^" + poolAddress + "$", "i")}).then(async pool => {
            session.isExpectingAnswer = "";
          sentMessageId = await ctx.reply(`Amount to Contribute (${pool.accepted_currency}): `, {reply_markup : {force_reply : true}});
          session.today_messages.push(sentMessageId.message_id);
          session.isExpectingAnswer = `amountToContribute${poolAddress}`;}).catch(err => console.log(err))
        }
      } else if (data.startsWith("user_contribute")) {
        const parts = data.split("user_contribute");
        const session = getSession(ctx.from.id);
        if (parts.length > 1) {
          const poolAddress = parts[1];
          sentMessageId = await ctx.reply(
            `Contributing ${session.amountToContribute}\n`
          );
          session.today_messages.push(sentMessageId.message_id);
          const privateKey = session.wallets[session.selectedWallet - 1];
          // Setup provider with the private key
          const provider = new HDWalletProvider({
            privateKeys: [privateKey],
            providerOrUrl: providerURL[session.chain.value],
          });

          const web3 = new Web3(provider);
          const accounts = await web3.eth.getAccounts();
          const sender = accounts[0];

          const presaleContract = new web3.eth.Contract(
            fairlaunchAbi,
            poolAddress
          );
          try {
            let transactionResult;
            if (
              session.accepted_currency.value === "ETH" ||
              session.accepted_currency.value === "BNB"
            ) {
              transactionResult = await presaleContract.methods
                .buyWithETH(ethUtil.zeroAddress())
                .send({ from: sender, value: parseUnits(session.amountToContribute, 18).toString() });
            } else {
              const tokenContract = new web3.eth.Contract(
                tokenAbi,
                session.token_address.value
              );
              const numberOfDecimals = await tokenContract.methods.decimals().call({from : sender});
              const contributionAmountinWei = parseUnits(session.amountToContribute, numberOfDecimals);
              await tokenContract.methods
                .approve(poolAddress, parseUnits(session.amountToContribute, numberOfDecimals).toString())
                .send({ from: sender });
              setTimeout(async () => {
                transactionResult = await presaleContract.methods
                  .buyWithToken(
                    parseUnits(session.amountToContribute, numberOfDecimals).toString(),
                    ethUtil.zeroAddress(),
                  )
                  .send({ from: sender});
              }, 10000);
            }
            const transactionLinkHead = session.chain.value === "Binance" ? "https://testnet.bscscan.com/tx/" : "https://goerli.etherscan.io/tx/";
            sentMessageId = await ctx.reply(`✅ Successfully contributed!!!\n${transactionLinkHead+transactionResult.transactionHash}`, {
              reply_markup: returnKeyboard,
            });
            session.today_messages.push(sentMessageId.message_id);
            ContributionInfo.findOne({
              userWallet: new RegExp("^" + sender + "$", "i"),
              poolAddress: new RegExp("^" + poolAddress + "$", "i"),
            })
              .then((contribution) => {
                const currentTime = new Date();
                const timestamp = Number(currentTime / 1000).toFixed(0);

                if (contribution) {
                  ContributionInfo.updateOne(contribution, {
                    contributionAmount:
                      contribution.contributionAmount +
                      session.amountToContribute,
                    contributionTime: timestamp,
                  })
                    .then((res) => {
                      console.log(`Update contribution ${res}`);
                    })
                    .catch((err) => {
                      console.log(`Failed update contribution`);
                    });
                } else {
                  const newContribution = new ContributionInfo({
                    userWallet: sender,
                    poolAddress: poolAddress,
                    contributionAmount: session.amountToContribute,
                    contributionTime: timestamp,
                  });
                  newContribution
                    .save()
                    .then((doc) => {
                      console.log(`New contribution ${doc}`);
                    })
                    .catch((err) => {
                      console.log(`⚠️ New Contribution failed!!!`);
                    });
                }
              })
              .catch(async (err) => {
                console.log(err);
                sentMessageId = await ctx.reply(`⚠️ Failed Contribution\n${err}`);
                session.today_messages.push(sentMessageId.message_id);
              });
          } catch (err) {
            console.log(err);
            sentMessageId = await ctx.reply(`⚠️ Failed Contribution\n${err}`);
            session.today_messages.push(sentMessageId.message_id);
          }
        }
      } else if (data.startsWith("EW_")) {
        const parts = data.split("EW_");
        if (parts.length > 1) {
          const poolAddress = parts[1];
          const session = getSession(ctx.from.id);
          const EWInlineKeyboard = new InlineKeyboard()
            .text("Emergency Withdraw!!!", `EWPROCEED${poolAddress}`)
            .text("Return", "return");
          const privateKey = session.wallets[session.selectedWallet - 1];
          // Setup provider with the private key
          const provider = new HDWalletProvider({
            privateKeys: [privateKey],
            providerOrUrl: providerURL[session.chain.value],
          });

          const web3 = new Web3(provider);
          const accounts = await web3.eth.getAccounts();
          const sender = accounts[0];

          const presaleContract = new web3.eth.Contract(
            fairlaunchAbi,
            poolAddress
          );

          const userRes = await presaleContract.methods
            .users(sender)
            .call({ from: sender });
          const acceptedCurrencyValue = await presaleContract.methods
            .acceptedTokens()
            .call({ from: sender });
          let acceptedCurrencyString =
            session.chain.value === "Ethereum" ? "ETH" : "BNB";
          if (
            acceptedCurrencyValue === "1" ||
            acceptedCurrencyValue === "1n" ||
            acceptedCurrencyValue === 1
          ) {
            acceptedCurrencyString = "USDT";
          } else if (
            acceptedCurrencyValue === "2" ||
            acceptedCurrencyValue === "2n" ||
            acceptedCurrencyValue === 2
          ) {
            acceptedCurrencyString = "BlazeX";
          }
          console.log("userRes", userRes);
          if (
            userRes._amount === "0" ||
            userRes._amount === "0n" ||
            userRes._amount === 0
          ) {
            sentMessageId = await ctx.reply(
              "You didn't purchase during this presale!"
            );
            session.today_messages.push(sentMessageId.message_id);
          } else {
            const formattedContributionAmount = parseSoftCap(
              userRes._amount,
              acceptedCurrencyString
            );
            sentMessageId = await ctx.reply(
              `You bought ${formattedContributionAmount} ${acceptedCurrencyString} during this Presale. Be aware that an emergency withdrawal will incur a 10% fee on your original purchase.`,
              { reply_markup: EWInlineKeyboard }
            );
            session.today_messages.push(sentMessageId.message_id);
          }
        }
      } else if (data.startsWith("EWPROCEED")) {
        const parts = data.split("EWPROCEED");
        if (parts.length > 1) {
          try{
            const session = getSession(ctx.from.id);
            const poolAddress = parts[1];

            sentMessageId = await ctx.reply(`⚠️ Emergency Withdrawing\n`);
            session.today_messages.push(sentMessageId.message_id);
            const privateKey = session.wallets[session.selectedWallet - 1];
            // Setup provider with the private key
            const provider = new HDWalletProvider({
              privateKeys: [privateKey],
              providerOrUrl: providerURL[session.chain.value],
            });

            const web3 = new Web3(provider);
            const accounts = await web3.eth.getAccounts();
            const sender = accounts[0];

            console.log("pool Address is : ", poolAddress);

            const presaleContract = new web3.eth.Contract(
              fairlaunchAbi,
              poolAddress
            );

            await presaleContract.methods
              .emergencyWithdraw()
              .send({ from: sender });

            sentMessageId = await ctx.reply(
              `✅ Successfully Emergency Withdrawn!!!`,
              { reply_markup: returnKeyboard }
            );
            session.today_messages.push(sentMessageId.message_id);
          }catch(err) {
            const session = getSession(ctx.from.id);
            console.log(err);
            sentMessageId = await ctx.reply(`Failed emergency withdraw!\n${err?.message}`);
            session.today_messages.push(sentMessageId.message_id);
          }
        }
      } else if (data.startsWith("deposit_")) {
        const parts = data.split("deposit_");
        const walletAddress = parts[1];
        const session = getSession(ctx.from.id);
        sentMessageId = await ctx.reply(
          `Wallet Address: ${walletAddress}\nYou can send USDT/BLAZEX/ETH here`
        );
        session.today_messages.push(sentMessageId.message_id);
      } else if (data.startsWith("balance_")) {
        const parts = data.split("balance_");
        const walletAddress = parts[1];

        const balanceResult = await getTotalBalance(walletAddress);
        const session = getSession(ctx.from.id);

        sentMessageId = await ctx.reply(
          `Etheruem\n  ---- ETH: ${balanceResult.Ethereum.NATIVE}\n  ---- USDT: ${balanceResult.Ethereum.USDT}\n  ---- BalzeX: ${balanceResult.Ethereum.BLAZEX}\nBinance\n  ---- BNB: ${balanceResult.Binance.NATIVE}\n  ---- USDT: ${balanceResult.Binance.USDT}\n  ---- BLAZEX: ${balanceResult.Binance.BLAZEX}`
        );
        session.today_messages.push(sentMessageId.message_id);
      } else if (data === "my-presales") {
        const session = getSession(ctx.from.id);
        sentMessageId = await ctx.reply("My-Presales", {
          reply_markup: ongoingPresaleMenu,
        });
        session.today_messages.push(sentMessageId.message_id);
      } else if (data === "start-fairlaunch") {
        await removeAllMessages(ctx, -1);
        const session = getSession(ctx.from.id);
        sentMessageId = await ctx.reply("Start Fairlaunch", {
          reply_markup: ownerMenu,
        });
        session.today_messages.push(sentMessageId.message_id);
      } else if (data.startsWith("removeWallet_")) {
        const session = getSession(ctx.from.id);
        const index = session.selectedWallet - 1;
        if (index > -1) {
          session.wallets.splice(index, 1);
          session.selectedWallet = 1;
          const saveWalletInfo = [];
          for (const pk of session.wallets) {
            const encryptedPK = encrypt(pk);
            saveWalletInfo.push(encryptedPK);
          }
          OwnerInfo.findOne({ ownerUsername: ctx.from.username })
            .then((info) => {
              console.log("info:", info);
              if (info) {
                OwnerInfo.updateOne(info, { ownerWallets: saveWalletInfo })
                  .then((res) => {
                    console.log(`Update Owner ${ctx.from.username}`, res);
                    ctx.answerCallbackQuery("Removed successfully");
                  })
                  .catch((err) => {
                    console.log(`Fail Owner Update ${ctx.from.username}`, err);
                    ctx.answerCallbackQuery("Failed remove");
                  });
              } else {
                const newOwner = new OwnerInfo({
                  ownerUsername: ctx.from.username,
                  ownerWallets: saveWalletInfo,
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
      } else if (data.startsWith("send-menu_")) {
        const parts = data.split();
      } else if (data.startsWith("showPrivateKey_")) {
        const parts = data.split("showPrivateKey_");
        if (parts.length > 1) {
          const session = getSession(ctx.from.id);
          sentMessageId = await ctx.reply(
            `Private key: <b>${session.wallets[parts[1] - 1]}</b>`,
            { parse_mode: "HTML" }
          );
        } else {
          sentMessageId = await ctx.reply(`⚠️ Unable to show you private key.`);
        }
      } else if (data.startsWith("userCC")) {
        const session = getSession(ctx.from.id);
        contributionAction(ctx, session);
      } else if (data.startsWith("userProject_")) {
        let poolChain = "Ethereum";
        const session = getSession(ctx.from.id);
        let startString = "userProject_Ethereum_";
        if (data.startsWith("userProject_Binance_")) {
          poolChain = "Binance";
          startString = "userProject_Binance_";
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
          const presaleContract = new web3.eth.Contract(
            fairlaunchAbi,
            poolAddress
          );
          const isFinalized = await presaleContract.methods
            .isFinalized()
            .call({ from: sender });
          PoolInfo.find({
            poolAddress: new RegExp("^" + poolAddress + "$", "i"),
            chain: new RegExp("^" + poolChain + "$", "i"),
          })
            .then(async (pools) => {
              if (pools === null || pools.length === 0) {
                sentMessageId = await ctx.reply("⚠️ No result!");
              } else {
                for (const pool of pools) {
                  const inlineKeyboardUserProject = new InlineKeyboard();
                  const tokenInformationResult = await getPresaleInformation(
                    pool.poolAddress,
                    pool.token_address,
                    session
                  );
                  let returnText = "";
                  if (isFinalized === false) {
                    inlineKeyboardUserProject.text(
                      "Back To Browse Projects",
                      "back"
                    );
                    inlineKeyboardUserProject.url(
                      "Vie Current Price if ended (Link to Dextools)",
                      "https://www.dextools.io/app/"
                    );

                    inlineKeyboardUserProject.row();

                    inlineKeyboardUserProject.text(
                      "Contribute",
                      `Contribute_${pool.poolAddress}`
                    );
                    inlineKeyboardUserProject.text(
                      "Send",
                      `SendContirbute_${pool.poolAddress}`
                    )
                    inlineKeyboardUserProject.text(
                      "Emergency Withdraw",
                      `EW_${pool.poolAddress}`
                    );
                    inlineKeyboardUserProject.row();
                    inlineKeyboardUserProject.text("⬅️ Go back", "returnToUserMenu")
                    inlineKeyboardUserProject.text("Return", "return");
                    await removeAllMessages(ctx, -1);
                    await showInformationAboutProjectOwner(
                      pool,
                      ctx,
                      tokenInformationResult,
                      session,
                      inlineKeyboardUserProject
                    );
                  } else {
                    inlineKeyboardUserProject.text(
                      "Back To Browse Projects",
                      "back"
                    );
                    inlineKeyboardUserProject.url(
                      "Vie Current Price if ended (Link to Dextools)",
                      "https://www.dextools.io/app/"
                    );
                    inlineKeyboardUserProject.row();
                    inlineKeyboardUserProject.text(
                      "Claim",
                      `userClaim_${pool.poolAddress}`
                    );
                    inlineKeyboardUserProject.text("⬅️ Go back", "returnToUserMenu")
                    inlineKeyboardUserProject.text("Return", "return");
                    await removeAllMessages(ctx, -1);
                    await showInformationAboutProjectOwner(
                      pool,
                      ctx,
                      tokenInformationResult,
                      session,
                      inlineKeyboardUserProject
                    );
                  }
                  if (sentMessageId !== undefined)
                    session.today_messages.push(sentMessageId.message_id);
                }
              }
            })
            .catch((err) => {
              console.log(err);
            });
        }
      } else if (data.startsWith("live")) {
        let poolChain;
        let startString = "liveEthereum";
        if (data.startsWith("liveEthereum")) {
          poolChain = "Ethereum";
        } else if (data.startsWith("liveBinance")) {
          poolChain = "Binance";
          startString = "liveBinance";
        }
        const parts = data.split(startString);
        if (parts.length > 1) {
          const poolAddress = parts[1];
          const session = getSession(ctx.from.id);
          PoolInfo.find({
            poolAddress: new RegExp("^" + poolAddress + "$", "i"),
          })
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
                  const tokenInformationResult = await getPresaleInformation(
                    pool.poolAddress,
                    pool.token_address,
                    session
                  );
                  inlineKeyboards.inline_keyboard[0].push({
                    text: "Back To Browse Projects",
                    callback_data: "back",
                  });
                  inlineKeyboards.inline_keyboard[0].push({
                    text: "Vie Current Price if ended (Link to Dextools)",
                    url: "https://www.dextools.io/app/",
                  });
                  inlineKeyboards.inline_keyboard.push([
                    {
                      text: "Contribute",
                      callback_data: `Contribute_${pool.poolAddress}`,
                    },
                  ]);
                  inlineKeyboards.inline_keyboard.push([{
                    text : "Send",
                    callback_data : `SendContirbute_${pool.poolAddress}`
                  }])
                  inlineKeyboards.inline_keyboard[1].push({
                    text: "Emergency Withdraw",
                    callback_data: `EW_${pool.poolAddress}`,
                  });
                  inlineKeyboards.inline_keyboard.push([
                    {
                      text: "⬅️ Go back",
                      callback_data: "returnToUserMenu",
                    },
                  ]);
                  inlineKeyboards.inline_keyboard.push([
                    {
                      text: "Return",
                      callback_data: "return",
                    },
                  ]);
                  if (tokenInformationResult.isFinalized === false) {
                    await removeAllMessages(ctx, -1);
                    await showInformationAboutProjectOwner(
                      pool,
                      ctx,
                      tokenInformationResult,
                      session,
                      inlineKeyboards
                    );
                  }
                }
              }
            })
            .catch((err) => {
              console.log(err);
            });
        }
      } else if (data.startsWith("claim")) {

        //TODO
        let poolChain;
        let startString = "claimEthereum";
        if (data.startsWith("claimEthereum")) {
          poolChain = "Ethereum";
        } else if (data.startsWith("claimBinance")) {
          poolChain = "Binance";
          startString = "claimBinance";
        }
        const parts = data.split(startString);
        if (parts.length > 1) {
          const poolAddress = parts[1];
          const session = getSession(ctx.from.id);
          const wallet1 = await session.getCurrentWalletPublicKey(session);
          ContributionInfo.find({poolAddress : new RegExp("^" + poolAddress + "$", "i"), userWallet : new RegExp("^" + wallet1 + "$", "i")})
          .then(async contributions => {

          })
          .catch(err => console.log(err))
        }
      } else if (data.startsWith("refund_")) {
        let poolChain;
        let startString = "refund_Ethereum";
        if (data.startsWith("refund_Ethereum")) {
          poolChain = "Ethereum";
        } else if (data.startsWith("refund_Binance")) {
          poolChain = "Binance";
          startString = "refund_Binance";
        }
        const parts = data.split(startString);
        if (parts.length > 1) {
          const poolAddress = parts[1];
          const session = getSession(ctx.from.id);
          sentMessageId = await ctx.reply(
            "Cancel and Refund is in progress ...\nPlease wait"
          );
          session.today_messages.push(sentMessageId.message_id);
          const result = await cancelAndRefundFunc(
            session.wallets[session.selectedWallet - 1],
            poolAddress,
            poolChain
          );
          if (result === "success") {
            await removeAllMessages(ctx, 0);
            sentMessageId = await ctx.reply(
              "✅ Successfully Cancelled"
            );
          } else {
            await removeAllMessages(ctx, 0);
            sentMessageId = await ctx.reply(`⚠️ Failed finalization\n ${result}`);
          }
          session.today_messages.push(sentMessageId.message_id);
        }
      } else if (data.startsWith("finalizeAddLP_")) {
        let poolChain;
        let startString = "finalizeAddLP_Ethereum";
        if (data.startsWith("finalizeAddLP_Ethereum")) {
          poolChain = "Ethereum";
        } else if (data.startsWith("finalizeAddLP_Binance")) {
          poolChain = "Binance";
          startString = "finalizeAddLP_Binance";
        }
        const parts = data.split(startString);
        if (parts.length > 1) {
          const poolAddress = parts[1];
          const session = getSession(ctx.from.id);
          sentMessageId = await ctx.reply(
            "Finalizing Presale and Adding LP ....\nPlease wait"
          );
          session.today_messages.push(sentMessageId.message_id);
          const result = await finalizeAndAddLPFunc(
            session.wallets[session.selectedWallet - 1],
            poolAddress,
            poolChain
          );
          if (result === "success") {
            await removeAllMessages(ctx, 0);
            sentMessageId = await ctx.reply(
              "✅ Successfully finalized and added lp"
            );
          } else {
            await removeAllMessages(ctx, 0);
            sentMessageId = await ctx.reply("⚠️" + ` ${result}`, {
              reply_markup: returnKeyboard,
            });
          }
          session.today_messages.push(sentMessageId.message_id);
        }
      } else if (data.startsWith("editProDetail_")){
        let poolChain;
        let startString = "editProDetail_Ethereum";
        if (data.startsWith("editProDetail_Ethereum")) {
          poolChain = "Ethereum";
        } else if (data.startsWith("editProDetail_Binance")) {
          poolChain = "Binance";
          startString = "editProDetail_Binance";
        }
        const parts = data.split(startString);
        const session = getSession(ctx.from.id);
        if(parts.length > 1) {
          const poolAddress = parts[1];
          PoolInfo.find({
            poolAddress: new RegExp("^" + poolAddress + "$", "i"),
            chain: new RegExp("^" + poolChain + "$", "i"),
          })
            .then(async (pools) => {
              if (pools === null || pools.length === 0) {
                sentMessageId = await ctx.reply("⚠️ No result!");
              } else {
                for (const pool of pools) {
                  const inlineKeyboardUserProject = new InlineKeyboard();
                  inlineKeyboardUserProject.text('Logo URL', `edit_logo${poolAddress}`);
                  inlineKeyboardUserProject.text('Website', `edit_Website${poolAddress}`).row();
                  inlineKeyboardUserProject.text('Telegram', `edit_Telegram${poolAddress}`);
                  inlineKeyboardUserProject.text('Twitter', `edit_Twitter${poolAddress}`).row();
                  inlineKeyboardUserProject.text('Facebook', `edit_Facebook${poolAddress}`);
                  inlineKeyboardUserProject.text('Github', `edit_Github${poolAddress}`).row();
                  inlineKeyboardUserProject.text('Discord', `edit_Discord${poolAddress}`);
                  inlineKeyboardUserProject.text('Instagram', `edit_Instagram${poolAddress}`).row();
                  inlineKeyboardUserProject.text('Reddit', `edit_Reddit${poolAddress}`);
                  inlineKeyboardUserProject.text('Preview', `edit_Preview${poolAddress}`).row();
                  inlineKeyboardUserProject.text('Description', `edit_Description${poolAddress}`).row();
                  let returnText = "";
                  inlineKeyboardUserProject.text('⬅️ Go back', 'returnToOwnerMenu');
                  inlineKeyboardUserProject.text("Return", "return");
                  await removeAllMessages(ctx, -1);
                  delete pool._id;
                  returnText = await replyCertainCategoryMessage(ctx, pool, "information");
                  sentMessageId = await ctx.reply(returnText, {reply_markup: inlineKeyboardUserProject, parse_mode : 'HTML'});
                  if (sentMessageId !== undefined)
                    session.today_messages.push(sentMessageId.message_id);
                }
              }
            })
            .catch((err) => {
              console.log(err);
            });
        } else{
          console.log("Wrong address inputed");
        }
      } else if (data === "return") {
        await returnAction(ctx);
      } else if (data === "returnToCreateFairlaunch") {
        await returnAction(ctx, fairlaunchCreationMenu);
      } else if (data === "back") {
        await returnAction(ctx, userMenu);
      } else if (data === "returnToOwnerMenu") {
        await returnAction(ctx, ownerMenu);
      } else if (data === "returnToUserMenu") {
        await returnAction(ctx, userMenu);
      }
    });
    bot.on(":photo", async (ctx) => {
      const session = getSession(ctx.from.id);
      session.today_messages.push(ctx.message.message_id);
      if(session.isExpectingAnswer === "preview"){
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        const file = await ctx.api.getFile(photo.file_id);

        const fileURL = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
          session[session.isExpectingAnswer].value = photo.file_id;
          session.current_menu.update();
          console.log(session.preview.value);
          session.isExpectingAnswer = "";
          await removeAllMessages(ctx, 0);
      }
    })
  } catch (err) {
    console.log(err);
  }
}
mainFunc();
