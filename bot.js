const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const schedule = require("node-schedule");

// Replace these with your actual tokens and IDs
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = "UCYHad4wPZcAqnVtH9wSbA8g"; // YouTube channel ID to monitor

// Mapping keywords to Discord channel IDs
const CHANNEL_KEYWORDS = {
  "#news": "1313280883297484880/1332423150289555577", // Replace with your Discord channel ID for gaming
  "legal breakdown": "1313280883297484880/1332428102696964297", // Replace with your Discord channel ID for tutorials
  "interview:": "1313280883297484880/1332428321178517574", // Replace with your Discord channel ID for vlogs
  "democracy watch": "1313280883297484880/1332428155268497499",
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let lastVideoId = null;

async function checkYouTube() {
  try {
    // Fetch the latest video from the YouTube channel
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search`,
      {
        params: {
          part: "snippet",
          channelId: YOUTUBE_CHANNEL_ID,
          maxResults: 1,
          order: "date",
          key: YOUTUBE_API_KEY,
        },
      }
    );

    const video = response.data.items[0];
    if (video && video.id.videoId !== lastVideoId) {
      lastVideoId = video.id.videoId;
      const videoDescription = video.snippet.description.toLowerCase(); // Use the video description
      const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;

      let matched = false;

      // Check the description for keywords and send to the appropriate channel
      for (const [keyword, channelId] of Object.entries(CHANNEL_KEYWORDS)) {
        if (videoDescription.includes(keyword)) {
          // Match keywords
          const channel = await client.channels.fetch(channelId);
          await channel.send(`New "${keyword}" video uploaded! ${videoUrl}`);
          matched = true;
          break; // Stop after finding the first matching keyword
        }
      }

      // Optional: Handle cases where no keyword matches
      if (!matched) {
        console.log(`No matching keyword found for video: ${videoUrl}`);
      }
    }
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
  }
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Schedule the bot to check YouTube every 10 minutes
  schedule.scheduleJob("*/1 * * * *", checkYouTube);
});

// Log in to Discord
client.login(DISCORD_TOKEN);
