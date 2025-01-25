const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const schedule = require("node-schedule");
const http = require("http");

// Replace these with your actual tokens and IDs
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = "UCQANb2YPwAtK-IQJrLaaUFw"; // YouTube channel ID to monitor

// Mapping keywords to Discord channel IDs
const CHANNEL_KEYWORDS = {
  "#news:": "1332459667523244102", // Remove the server ID portion before the slash
  "legal breakdown": "1332428102696964297",
  "interview:": "1332459912877576263",
  "democracy watch": "1332459881344798786",
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let lastVideoId = null;

async function checkYouTube() {
  try {
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

    // Add response data logging for debugging
    if (
      !response.data ||
      !response.data.items ||
      response.data.items.length === 0
    ) {
      console.log("No videos found or invalid response format:", response.data);
      return;
    }

    const video = response.data.items[0];
    if (video && video.id.videoId !== lastVideoId) {
      lastVideoId = video.id.videoId;
      const videoDescription = video.snippet.description.toLowerCase(); // Use the video description
      const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;

      let matched = false;

      // Check the description for keywords and send to the appropriate channel
      for (const [keyword, channelId] of Object.entries(CHANNEL_KEYWORDS)) {
        if (videoDescription.includes(keyword)) {
          try {
            const channel = await client.channels.fetch(channelId);
            if (!channel) {
              console.error(`Channel not found for ID: ${channelId}`);
              continue;
            }
            await channel.send(`New "${keyword}" video uploaded! ${videoUrl}`);
            matched = true;
            break; // Stop after finding the first matching keyword
          } catch (error) {
            console.error(
              `Error sending message to channel ${channelId}:`,
              error.message
            );
            continue;
          }
        }
      }

      // Optional: Handle cases where no keyword matches
      if (!matched) {
        console.log(`No matching keyword found for video: ${videoUrl}`);
      }
    }
  } catch (error) {
    // Enhanced error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("YouTube API Error:");
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
      console.error("Headers:", error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error setting up request:", error.message);
    }
  }
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Changed to check every 10 minutes instead of every minute
  schedule.scheduleJob("*/10 * * * *", checkYouTube);
});

// Log in to Discord
client.login(DISCORD_TOKEN);

http.createServer(function (req, res) {}).listen(3000, function(){
 console.log("server start at port 3000"); //the server object listens on port 3000
});
