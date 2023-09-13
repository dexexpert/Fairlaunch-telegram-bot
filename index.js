// const express = require("express");
// const expressApp = express();
// const axios = require("axios");
// const path = require("path");
// const port = process.env.PORT || 3000;
// expressApp.use(express.static("static"));
// expressApp.use(express.json());
require("dotenv").config();
const { Bot } = require("grammy");
const {
  MenuTemplate,
  MenuMiddleware,
  createBackMainMenuButtons,
} = require("grammy-inline-menu");

const sessions = {};

function getSession(userId) {
  if (!sessions[userId]) {
    sessions[userId] = {
      token_address: "",
      accepted_currency: "ETH", // ETH USDT BLAZEX
      softcap: 0,
      hardcap: 0,
      minimumBuyAmount: 0,
      maximumBuyAmount: 0,
      whitelist_enabled: false,
      router: "Uniswap", // Uniswap Pancakeswap
      liquidityPercentage: 0,
      startTime: 0,
      endTime: 0,
      lockupPeriod: 0,
      logoURl: "",
      websiteURL: "",
      twitterURL: "",
      telegramURL: "",
      facebookURL: "",
      discordURL: "",
      isExpectingAnswer : 0
    };
  }
  return sessions[userId];
}

const FairlaunchConfigData = [
  {
    text: "Token Address",
    actionName: "token_address",
    secondChoiceText: "token_address",
    description: "please input the token address here",
    type: "text",
    isOneRow: false,
  },
  {
    text: "Select Currency",
    actionName: "accepted_currency",
    secondChoiceText: ["ETH", "USDT", "BLAZEX"],
    description: "please select accepted currency",
    type: "select",
    isOneRow: false,
  },
  {
    text: "Softcap",
    actionName: "softcap",
    secondChoiceText: "softcap",
    description: "please input softcap",
    type: "number",
    isOneRow: false,
  },
  {
    text: "Hardcap",
    actionName: "hardcap",
    secondChoiceText: "hardcap",
    description: "please input hardcap",
    type: "number",
    isOneRow: true,
  },
  {
    text: "Minimum buy amount",
    actionName: "minimumBuyAmount",
    secondChoiceText: "minimumBuyAmount",
    description: "please input minimum buy amount",
    type: "number",
    isOneRow: false,
  },
  {
    text: "Maximum buy amount",
    actionName: "maximumBuyAmount",
    secondChoiceText: "maximumBuyAmount",
    description: "please input maximum buy amount",
    type: "number",
    isOneRow: true,
  },
  {
    text: "Dex router",
    actionName: "router",
    secondChoiceText: ["Uniswap", "Pancakeswap"],
    description: "please select dex router",
    type: "select",
    isOneRow: true,
  },
  {
    text: "Whitelist Option",
    actionName: "whitelist_enabled",
    secondChoiceText: "whitelist_enabled",
    description: "please toggle whitelist on or off",
    type: "boolean",
    isOneRow: true,
  },
  {
    text: "Start time",
    actionName: "startTime",
    secondChoiceText: "startTime",
    description:
      "please specify the start time in this format : yyyy/mm/dd hh:mm:ss",
    type: "text",
    isOneRow: false,
  },
  {
    text: "End time",
    actionName: "endTime",
    secondChoiceText: "endTime",
    description:
      "please specify the end time in this format : yyyy/mm/dd hh:mm:ss",
    type: "text",
    isOneRow: true,
  },
  {
    text: "Liquidity percentage",
    actionName: "liquidityPercentage",
    secondChoiceText: "liquidityPercentage",
    description: "please specify the liquidity percentage\nminimum 40 %",
    type: "number",
    isOneRow: false,
  },
  {
    text: "Liquidity lockup Period",
    actionName: "lockupPeriod",
    secondChoiceText: "lockupPeriod",
    description:
      "please specify the liquidity lockup period\n(At least 60 days with a locker system)",
    type: "number",
    isOneRow: true,
  },
  {
    text: "Update logo",
    actionName: "logoURL",
    secondChoiceText: "logoURL",
    description: "please specify the link of your logo, should be valid link",
    type: "link",
    isOneRow: false,
  },
  {
    text: "Website",
    actionName: "websiteURL",
    secondChoiceText: "websiteURL",
    description:
      "please specify the link of your website, should be valid link",
    type: "link",
    isOneRow: true,
  },
  {
    text: "Twitter",
    actionName: "twitterURL",
    secondChoiceText: "twitterURL",
    description:
      "please specify the link of your twitter, should be valid link",
    type: "link",
    isOneRow: false,
  },
  {
    text: "Telegram",
    actionName: "telegramURL",
    secondChoiceText: "telegramURL",
    description:
      "please specify the link of your telegram, should be valid link",
    type: "link",
    isOneRow: true,
  },
  {
    text: "Facebook",
    actionName: "facebookURL",
    secondChoiceText: "facebookURL",
    description:
      "please specify the link of your facebook, should be valid link",
    type: "link",
    isOneRow: false,
  },
  {
    text: "Discord",
    actionName: "discordURL",
    secondChoiceText: "discordURL",
    description:
      "please specify the link of your discord, should be valid link",
    type: "link",
    isOneRow: true,
  },
];

const acceptedCurrencyTemplate = new MenuTemplate("Select Currency");
acceptedCurrencyTemplate.select(
  FairlaunchConfigData[1].text,
  FairlaunchConfigData[1].secondChoiceText,
  {
    isSet: (ctx, key) => {
      const session = getSession(ctx.from.id);
      return session[FairlaunchConfigData[1].actionName] === key;
    },
    set: (ctx, key) => {
      const session = getSession(ctx.from.id);
      session[FairlaunchConfigData[1].actionName] = key;
      return true;
    },
  }
);

acceptedCurrencyTemplate.manualRow(createBackMainMenuButtons());

const routerTemplate = new MenuTemplate("Select Router");
routerTemplate.select(
  FairlaunchConfigData[7].text,
  FairlaunchConfigData[7].secondChoiceText,
  {
    isSet: (ctx, key) => {
      const session = getSession(ctx.from.id);
      return session[FairlaunchConfigData[7].actionName] === key;
    },
    set: (ctx, key) => {
      const session = getSession(ctx.from.id);
      session[FairlaunchConfigData[7].actionName] = key;
      return true;
    },
  }
);

routerTemplate.manualRow(createBackMainMenuButtons());

const menuTemplate = new MenuTemplate((ctx) => `Fairlaunch settings`);

FairlaunchConfigData.forEach((element, index) => {
  if (element.type === "boolean") {
    menuTemplate.toggle(element.text, element.actionName, {
      joinLastRow: element.isOneRow,
      isSet: (ctx) => {
        const session = getSession(ctx.from.id);
        return session[element.actionName];
      },
      set: (ctx, newState) => {
        const session = getSession(ctx.from.id);
        session[element.actionName] = newState;
        return true;
      },
    });
  } else if (element.type === "select") {
    if (element.actionName === "accepted_currency") {
      menuTemplate.submenu(
        element.text,
        element.actionName,
        acceptedCurrencyTemplate
      );
    } else {
      menuTemplate.submenu(element.text, element.actionName, routerTemplate);
    }
  } else {
    menuTemplate.interact(element.text, element.secondChoiceText, {
      joinLastRow: element.isOneRow,
      do: async (ctx) => {
        const session = getSession(ctx.from.id);
        await ctx.reply(
          `${element.description} - (current ${element.text} is ${
            session[element.actionName]
          })`, 
        );
        session.isExpectingAnswer = index + 1;
        await ctx.answerCallbackQuery();
        return false;
      },
    });
  }
});
// launchSettingsMenuTemplate.interact('Token Address', 'token_address', {
//   do : async ctx => {
//     await ctx.reply('please input the token address here');
//     return false;
//   }
// })
// launchSettingsMenuTemplate.interact('Token Address', 'token_address', {
//   do : async ctx => {
//     await ctx.reply('please input the token address here');
//     return false;
//   }
// })

const bot = new Bot(process.env.BOT_TOKEN);

const menuMiddleware = new MenuMiddleware("/", menuTemplate);
bot.command("start", (ctx) => {
  menuMiddleware.replyToContext(ctx);
  console.log(`start from ${ctx.from.id, ctx.from.username}`);
});
bot.on("message:text", (ctx) => {
  const session = getSession(ctx.from.id);

  if (session.isExpectingAnswer > 0) {
    const answer = ctx.message.text;
    // FairlaunchConfigData[session.isExpectingAnswer - 1].value = answer;
    ctx.reply(
      `${
        FairlaunchConfigData[session.isExpectingAnswer - 1].text
      } is ${answer}.`
    );
    session[FairlaunchConfigData[session.isExpectingAnswer - 1].actionName] = answer;
    session.isExpectingAnswer = 0;
  } else {
    ctx.reply("Send /start to see the menu");
  }
});
bot.use(menuMiddleware);

bot.api.setMyDescription("Start Fair Launch");

bot.start();
