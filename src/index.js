// Load up the discord.js library
import { Client } from "discord.js";
import { discordToken } from "./config";

import { googleSearch, duckduckgoSearch } from "./searchEngine";

// This is your client. Some people call it `bot`, some people call it `self`,
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Client();

client.once("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(
    `Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`
  );
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  //client.user.setActivity(`Serving ${client.guilds.size} servers`);
  client.user.setActivity("Search Engine", { type: "Searching img on" });
});

client.on("message", async (message) => {
  // This event will run on every single message received, from any channel or DM.

  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if (message.author.bot) return;

  // Also good practice to ignore any message that does not start with our cmdPrefix,
  // which is set in the configuration file.
  if (!message.content.endsWith(".jpg")) return;

  const searchTerm = message.content.split(".").slice(0, -1).join(".");

  let replyMessage = "null";

  if (searchTerm !== null && searchTerm !== "") {
    googleSearch(searchTerm)
      .then((result) => {
        replyMessage = result;
      })
      .catch((_) => {
        replyMessage = `好像掛了QQ`;
      })
      .finally(() => {
        message.channel.send(replyMessage);
      });

    // duckduckgoSearch(parms)
    //   .then((data) => {
    //     replyMessage = data[0].image;
    //   })
    //   .catch((_) => {
    //     replyMessage = `好像掛了QQ`;
    //   })
    //   .finally(() => {
    //     message.channel.send(replyMessage);
    //   });
  }
});

client.login(discordToken);
