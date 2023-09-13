require("dotenv").config();
const { Web3 } = require("web3");
const ethUtil = require("ethereumjs-util");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const factoryABI = require("./abis/factoryABI");
const tokenAbi = require("./abis/tokenAbi");
const {
  isValidEthereumAddress,
  isNumber,
  isValidURL,
  isValidPrivateKey,
  isValidDate,
} = require("./libs/validators");
const { ownerMenuData, userMenuData } = require("./libs/menuDatas");
const replyReviewLaunch = require("./libs/actions");
const HDWalletProvider = require("@truffle/hdwallet-provider");
// ERC-20 Token ABI with only the necessary parts for fetching name and symbol

const factoryAddress = {
  Binance: "0x0c4385B14D9FB669750b3118c11BBcF1e11330c0",
  Ethereum: "0x7b4d204D50ae503985F89245501c6a48574309F4",
};

const { Bot, InlineKeyboard } = require("grammy");
const { Menu } = require("@grammyjs/menu");

const bot = new Bot(process.env.BOT_TOKEN);

const sessions = {};
function formatDate(date) {
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
      token_address: {
        value: undefined,
        validation: (val) => {
          return isValidEthereumAddress(val);
        },
        invalid_description: "Please input valid token address",
      },
      token_name: {
        value: undefined,
        validation: (val) => {
          return val !== undefined;
        },
        invalid_description: "Please input valid token name",
      },
      token_symbol: {
        value: undefined,
        validation: (val) => {
          return val !== undefined;
        },
        invalid_description: "Please input valid token symbol",
      },
      accepted_currency: {
        value: "ETH",
        validation: (val) => {
          return true;
        },
        invalid_description: "Please input valid currency",
      }, // ETH USDT BLAZEX
      chain: {
        value: "Ethereum",
        validation: (val) => {
          return true;
        },
        invalid_description: "Please input valid chain",
      },
      sellAmount: {
        value: undefined,
        validation: (val) => {
          return val !== undefined && isNumber(val) && val > 0;
        },
        invalid_description: "Please input valid number",
      },
      softcap: {
        value: undefined,
        validation: (val) => {
          return val !== undefined && isNumber(val);
        },
        invalid_description: "Please input valid number",
      },
      minimumBuyAmount: {
        value: undefined,
        validation: (val) => {
          return val !== undefined && isNumber(val);
        },
        invalid_description: "Please input valid number",
      },
      maximumBuyAmount: {
        value: undefined,

        invalid_description:
          "Please input valid number (must be greater than minimum buy amount)",
      },
      whitelist_enabled: {
        value: undefined,
        validation: (val) => {
          return val !== undefined;
        },
        invalid_description: "Please input true or false",
      },
      referralEnabled: {
        value: undefined,
        validation: (val) => {
          return val !== undefined;
        },
        invalid_description: "Please input true or false",
      },
      router: {
        value: "Uniswap",
        validation: (val) => {
          return true;
        },
        invalid_description:
          "Please input valid string (Uniswap or PancakeSwap)",
      }, // Uniswap Pancakeswap
      refundType: {
        value: "Burn",
        validation: (val) => {
          return true;
        },
        invalid_description: "Please input valid string (Burn or Refund)",
      },
      liquidityPercentage: {
        value: undefined,
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
        validation: (val) => {
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
        invalid_description:
          "Please input valid number (must be bigger than 60 days)",
      },
      logoURL: {
        value: undefined,
        validation: (val) => {
          return val !== undefined && isValidURL(val) && val.length > 0;
        },
        invalid_description: "Please input valid URL",
      },
      websiteURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        invalid_description: "Please input valid URL",
      },
      twitterURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        invalid_description: "Please input valid URL",
      },
      telegramURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        invalid_description: "Please input valid URL",
      },
      facebookURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        invalid_description: "Please input valid URL",
      },
      discordURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        invalid_description: "Please input valid URL",
      },
      githubURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        invalid_description: "Please input valid URL",
      },
      instagramURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        invalid_description: "Please input valid URL",
      },
      redditURL: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        invalid_description: "Please input valid URL",
      },
      preview: {
        value: "",
        validation: (val) => {
          return val !== undefined && isValidURL(val);
        },
        invalid_description: "Please input valid URL",
      },
      description: {
        value: "",
        validation: (val) => {
          return true;
        },
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
      isExpectingAnswer: "",
      selectedWallet: 1,
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
      if (isNumber(val)) {
        return val === 0 || val > sessions[userId].minimumBuyAmount.value;
      }
      return false;
    };
  }
  return sessions[userId];
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
  const privateKeyHex = session.wallets[index - 1].slice(2);

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

const main = new Menu("root-menu")
  .submenu("Owner Menu", "owner-menu")
  .submenu("User Menu", "user-menu");

const cancelInlineKeyboard = new InlineKeyboard().text(
  "cancel",
  "click-cancel-input"
);
async function initiateOwnerMenu(submenu, menuData, stackedMenus) {
  if (Array.isArray(menuData)) {
    for (const item of menuData) {
      if ("submenu" in item) {
        const menu1 = new Menu(item.name);
        await initiateOwnerMenu(menu1, item.submenu, []);
        submenu.submenu(item.text, item.name);
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
                  if (session[item.variable].value === selectOption) {
                    return "✅ " + selectOption;
                  }
                }
                return selectOption;
              },
              (ctx) => {
                const session = getSession(ctx.from.id);
                session.isExpectingAnswer = "";
                if(session[item.variable].value !== selectOption){
                  session[item.variable].value = selectOption;
                  ctx.menu.update();
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
            (ctx) => {
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
              return item.text;
            },
            (ctx) => {
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
                  .text("Cancel", "cancel-launch");
                replyReviewLaunch(ctx, session, launchInlineKeyboard);
              } else if ("variable" in item) {
                const session = getSession(ctx.from.id);
                session.isExpectingAnswer = "";
                if ("type" in item && item.type === "toggle") {
                  session[item.variable].value = !session[item.variable].value;
                  ctx.menu.update();
                } else {
                  session.isExpectingAnswer = item.variable;
                  if (session.isExpectingAnswer === "importedWallet") {
                    ctx.reply(
                      "Please input your private key do not share it to the others"
                    );
                  } else {
                    if (
                      item.variable === "startTime" ||
                      item.variable === "endTime"
                    ) {
                      ctx.reply(
                        `Current timestamp is ${
                          Date.now() / 1000
                        }\nPlease input in this format : YYYY-MM-DD HH:MM:SS`
                      );
                    }
                    ctx.reply(
                      `Please input ${item.text} - Current value is ${
                        session[item.variable].value === undefined ||
                        session[item.variable].value === ""
                          ? "<b>Not Set</b>"
                          : session[item.variable].value
                      }`,
                      { reply_markup: cancelInlineKeyboard, parse_mode: "HTML" }
                    );
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
                    ctx.reply("No wallets imported!", { reply_markup: main });
                  } else {
                    let cnt = 1;
                    for (const wallet of session.wallets) {
                      inlineKeyboard.inline_keyboard[0].push({
                        text:
                          (cnt === session.selectedWallet ? "✅ " : "") +
                          "Wallet " +
                          cnt +
                          ` (${getWalletPublicKeyFromindex(session, cnt)})`,
                        callback_data: "wallet_" + cnt,
                      });
                      cnt++;
                    }
                    ctx.reply("Please select wallet to manage", {
                      reply_markup: inlineKeyboard,
                    });
                  }
                } else {
                  ctx.reply(`Running!`, { reply_markup: main });
                }
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

        submenu.back("⬅️ Go back");
        for (const menus of stackedMenus) {
          submenu.register(menus);
          // console.log(menus);
        }
        stackedMenus.length = 0;
      }
    }
  } else {
    submenu.text(menuData.text, (ctx) =>
      ctx.reply(`You pressed ${menuData.text}`)
    );
  }
}

// Your Ethereum node's RPC URL (could be local, Infura, Alchemy, etc.)
const providerURL = {
  Binance: "https://bsc-testnet.public.blastapi.io",
  Ethereum: "https://goerli.infura.io/v3/81f1f856e5854cda96f939fe2a658c40",
};

// Your private key (make sure not to expose this in your code or anywhere public)

async function launchPool(privateKey, session) {
  try {
    // Setup provider with the private key
    const provider = new HDWalletProvider({
      privateKeys: [privateKey],
      providerOrUrl: providerURL[session.chain],
    });

    const web3 = new Web3(provider);

    const tokenContract = new web3.eth.Contract(
      tokenAbi,
      session.token_address
    );
    await tokenContract.methods.approve(
      factoryAddress[session.chain],
      "115792089237316195423570985008687907853269984665640564039457"
    );
    setTimeout(async () => {
      // Create a contract instance
      const contract = new web3.eth.Contract(
        factoryABI,
        factoryAddress[session.chain]
      );
      const accounts = await web3.eth.getAccounts();
      const sender = accounts[0];

      // Replace 'yourFunction' and arguments with your actual function and its parameters
      const response = await contract.methods
        .createPool(
          {
            poolAddress: sender,
            tokenAddress: session.token_address,
            sellAmount: session.sellAmount,
            acceptedTokens:
              session.accepted_currency === "ETH"
                ? 0
                : session.accepted_currency === "USDT"
                ? 1
                : 2,
            softcap: session.softcap,
            startTime: session.startTime,
            endTime: session.endTime,
            minimumBuyAmount: session.minimumBuyAmount,
            maximumBuyAmount: session.maximumBuyAmount,
            lockupPeriod: session.lockupPeriod,
            liquidityPercentage: session.liquidityPercentage,
            referralPercentage: session.referralEnabled ? 3 : 0,
            _isPancakeRouter: session.router === "Uniswap" ? false : true,
            _whitelistEnabeld: session.whitelist_enabled,
          },
          [sender]
        )
        .send({ from: sender, value: "10000000000000000" });

      console.log(response);
      // Close the provider
      provider.engine.stop();
    }, 10000);
  } catch (err) {
    console.log(err);
  }
}

async function mainFunc() {
  try {
    // Define main menu first

    // Define userMenu
    const userMenu = new Menu("user-menu");

    // Define ownerMenu and initiate its submenus
    const ownerMenu = new Menu("owner-menu");
    await initiateOwnerMenu(ownerMenu, ownerMenuData, []);
    // ownerMenu.back("⬅️ Go back");
    await initiateOwnerMenu(userMenu, userMenuData, []);
    // userMenu.back("⬅️ Go back");
    main.register(userMenu);
    main.register(ownerMenu);

    bot.use(main);

    // Set bot description (if needed)
    bot.api.setMyDescription("Start Fair Launch");

    // Start the bot after all menus have been set up with a 3-second delay
    setTimeout(() => {
      console.log("bot started");
      bot.start();
    }, 3000);

    bot.command("start", (ctx) => {
      console.log(ctx.from.username);
      ctx.reply("Main Menu:", { reply_markup: main });
    });
    bot.command("ownermenu", (ctx) => {
      console.log("owner menu : ", ctx.from.username);
      ctx.reply("Owner Menu:", { reply_markup: ownerMenu });
    });
    bot.command("usermenu", (ctx) => {
      console.log("user menu : ", ctx.from.username);
      ctx.reply("User Menu:", { reply_markup: userMenu });
    });
    bot.on("message:text", async (ctx) => {
      const session = getSession(ctx.from.id);

      if (session.isExpectingAnswer && session.isExpectingAnswer !== "") {
        let answer = ctx.message.text;
        // FairlaunchConfigData[session.isExpectingAnswer - 1].value = answer;

        const walletPubKey = getCurrentWalletPublicKey(session);
        if (
          session.isExpectingAnswer === "startTime" ||
          session.isExpectingAnswer === "endTime"
        ) {
          if (isValidDate(answer) === true) {
            const date = new Date(answer);
            answer = Math.floor(date.getTime() / 1000);
          } else {
            ctx.reply("please input valid date again YYYY-MM-DD HH:MM:SS");
            return;
          }
        }

        if (session.isExpectingAnswer === "token_address") {
          if (isValidEthereumAddress(answer) == true) {
            const web3 = new Web3(providerURL[session.chain.value]);
            const tokenAddress = answer;
            const tokenContract = new web3.eth.Contract(tokenAbi, tokenAddress);
            try {
              const name = await tokenContract.methods.name().call();
              const symbol = await tokenContract.methods.symbol().call();

              session.token_name.value = name;
              session.token_symbol.value = symbol;

              session[session.isExpectingAnswer] = answer;
              session.isExpectingAnswer = "";
              // ctx.reply(`Token Name : ${name}\nToken Symbol : ${symbol}`, {
              //   reply_markup: main,
              // });
              const reviewKeyboard = new InlineKeyboard()
                .text(`✅ Chain - ${session.chain.value}`, "chainReView")
                .text(
                  `${
                    walletPubKey === ""
                      ? "🚫 Please import wallet"
                      : "✅ " + walletPubKey
                  }`,
                  "walletReView"
                );
              replyReviewLaunch(ctx, session, reviewKeyboard);
            } catch (err) {
              console.log(err);
              ctx.reply(
                "Can't load token info on bsc testnet, please input again"
              );
            }
          } else {
            ctx.reply("please input valid address again");
          }
        } else {
          if (session[session.isExpectingAnswer].validation(answer)) {
            session[session.isExpectingAnswer].value = answer;
            if (session.isExpectingAnswer === "importedWallet") {
              console.log(answer);
              if (!session.wallets.includes(answer)) {
                session.wallets.push(answer);
              }
              ctx.reply(`Wallet Successfuly Imported`);
            } else {
              const reviewKeyboard = new InlineKeyboard()
                .text(`✅ Chain - ${session.chain.value}`, "chainReView")
                .text(
                  `${
                    walletPubKey === ""
                      ? "🚫 Please import wallet"
                      : "✅ " + walletPubKey
                  }`,
                  "walletReView"
                );
              replyReviewLaunch(ctx, session, reviewKeyboard);
              // ctx.reply(`${session.isExpectingAnswer} is ${answer}`, {
              //   reply_markup: main,
              // });
            }
            session.isExpectingAnswer = "";
          } else {
            ctx.reply(
              `${session[session.isExpectingAnswer].invalid_description}`
            );
          }
        }
      } else {
        ctx.reply("Send /start to see the menu");
      }
    });
    bot.callbackQuery("click-cancel-input", async (ctx) => {
      const session = getSession(ctx.from.id);
      session.isExpectingAnswer = "";
      await ctx.answerCallbackQuery({
        text: "Cancelled",
      });
      ctx.reply("Main Menu", { reply_markup: main });
    });
    bot.callbackQuery("launch", async (ctx) => {
      const session = getSession(ctx.from.id);
      const keysOfSession = Object.keys(session);
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
          ctx.reply("No wallet is connected, please import wallet first!");
        }
      } else {
        await ctx.answerCallbackQuery({
          text: "Please review your data and input correct data!",
        });
        ctx.reply(errors.join("\n"));
      }
    });
    bot.on("callback_query", (ctx) => {
      const data = ctx.callbackQuery.data;
      if (data.startsWith("wallet_")) {
        const parts = data.split("wallet_");
        if (parts.length > 1) {
          ctx.answerCallbackQuery({ text: "Pressed Wallet " + parts[1] + "!" });
          const session = getSession(ctx.from.id);
          session.selectedWallet = parseInt(parts[1]);
          // Replace 'yourPrivateKeyHex' with your actual private key in hexadecimal format.
          console.log(session.wallets[session.selectedWallet - 1]);

          const addressHex = getCurrentWalletPublicKey(session);

          ctx.reply("Current Wallet's Information : " + addressHex);
        }
      }
    });
  } catch (err) {
    console.log(err);
  }
}
mainFunc();
