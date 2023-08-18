import dotenv from "dotenv";
import minimist from "minimist";
import { Client } from "discord.js";
import { googleSearch, duckduckgoSearch } from "./searchEngine";
import { constantStrings } from "./constants";

dotenv.config();

let discordToken = "";

if (process.env.NODE_ENV == "development") {
  discordToken = process.env["DISCORD_TOKEN_DEV"];
} else {
  discordToken = process.env["DISCORD_TOKEN"];
}

// This is your client. Some people call it `bot`, some people call it `self`,
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Client();
client.login(discordToken);

client.once("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(
    `Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`
  );
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  //client.user.setActivity(`Serving ${client.guilds.size} servers`);
  client.user.setActivity("Hentai Images", { type: "WATCHING" });
});

client.on("message", async (message) => {
  // This event will run on every single message received, from any channel or DM.

  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if (message.author.bot) return;

  // ignore image url
  if (message.content.startsWith("http://")) return;
  if (message.content.startsWith("https://")) return;

  // ignore if new line or tab exists
  if (message.content.includes("\n")) return;
  if (message.content.includes("\t")) return;

  // trigger word: end with .jpg or .gif
  if (
    !message.content.endsWith(".jpg") &&
    !message.content.endsWith(".gif") &&
    !message.content.endsWith(".duckjpg") &&
    !message.content.endsWith(".duckgif")
  ) {
    return;
  }

  const messageArray = message.content.split(".");
  const searchTerm = messageArray.slice(0, -1).join(".");
  const targetExtension = messageArray[messageArray.length - 1];

  let replyMessage = constantStrings.defaultMessage;

  if (searchTerm !== null && searchTerm !== "") {
    if (targetExtension === "duckjpg" || targetExtension === "duckgif") {
      duckduckgoSearch(searchTerm, targetExtension)
        .then((imgLink) => {
          replyMessage = imgLink;
        })
        .catch((error) => {
          replyMessage = constantStrings.errorMessage;

          if (error.response) {
            console.error(error.response.data);
          } else {
            console.error(error);
          }
        })
        .finally(() => {
          message.channel.send(replyMessage);
        });
    } else {
      googleSearch(searchTerm, targetExtension)
        .then((result) => {
          replyMessage = result;
        })
        .catch((error) => {
          replyMessage = constantStrings.errorMessage;

          if (error.response) {
            console.error(error.response.data);
          } else {
            console.error(error);
          }
        })
        .finally(() => {
          message.channel.send(replyMessage);
        });
    }
  }
});

client.on("messageReactionAdd", (reaction, _) => {
  const message = reaction.message;
  // ... check to see if the bot sent the reacted message ...
  if (message.author.id != client.user.id) return;

  // ... and ensure that the reacted emoji is the wastedbasket emoji.
  if (reaction.emoji.name == "🗑️" || reaction.emoji.name == "💩") {
    reaction.message.delete().then(() => {
      setTimeout(
        () => message.channel.send(constantStrings.deleteMessage),
        1000
      );
    });
  }
});
