const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const fetch = require('node-fetch');
const DiscordCommandHandler = require('./discord-command-handler');

class DiscordBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });
    
    this.isLive = false;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.checkStreamInterval = null;
    this.checkClipsInterval = null;
    this.lastClipTime = new Date();
    
    // Create command handler
    this.commandHandler = new DiscordCommandHandler(this.client);
    
    // Initialize event handlers
    this.initEventHandlers();
  }
  
  initEventHandlers() {
    this.client.on('ready', async () => {
      console.log(`Discord bot logged in as ${this.client.user.tag}`);
      
      // Set bot status
      this.client.user.setPresence({
        activities: [{ 
          name: `${process.env.CHANNEL}'s Twitch`,
          type: ActivityType.Watching
        }],
        status: 'online'
      });
      
      // Initialize command handler
      await this.commandHandler.initialize();
      
      // Start checking stream status
      this.startStreamChecking();
      
      // Start checking for new clips
      this.startClipsChecking();
    });
    
    this.client.on('error', error => {
      console.error('Discord client error:', error);
    });
  }
  
  connect() {
    return this.client.login(process.env.DISCORD_TOKEN);
  }
  
  async getTwitchAccessToken() {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }
    
    try {
      const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        // Set expiry time (subtract 100 seconds to be safe)
        this.tokenExpiry = Date.now() + (data.expires_in - 100) * 1000;
        return this.accessToken;
      } else {
        throw new Error('Failed to get Twitch access token');
      }
    } catch (error) {
      console.error('Error getting Twitch access token:', error);
      return null;
    }
  }
  
  async checkStreamStatus() {
    try {
      const token = await this.getTwitchAccessToken();
      if (!token) return;
      
      const response = await fetch(`https://api.twitch.tv/helix/streams?user_id=${process.env.TWITCH_BROADCASTER_ID}`, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      // Stream is live
      if (data.data && data.data.length > 0) {
        const streamData = data.data[0];
        
        // If we weren't live before, announce the stream
        if (!this.isLive) {
          this.isLive = true;
          await this.announceStream(streamData);
        }
      } 
      // Stream is offline
      else if (this.isLive) {
        this.isLive = false;
        console.log('Stream is now offline');
      }
    } catch (error) {
      console.error('Error checking stream status:', error);
    }
  }
  
  async announceStream(streamData) {
    try {
      const liveChannel = this.client.channels.cache.get(process.env.DISCORD_LIVE_CHANNEL_ID);
      
      if (!liveChannel) {
        console.error('Could not find the live announcement channel');
        return;
      }
      
      // Get user data for the thumbnail
      const token = await this.getTwitchAccessToken();
      const userResponse = await fetch(`https://api.twitch.tv/helix/users?id=${process.env.TWITCH_BROADCASTER_ID}`, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${token}`
        }
      });
      
      const userData = await userResponse.json();
      const user = userData.data[0];
      
      // Create rich embed for the live announcement
      const embed = new EmbedBuilder()
        .setColor('#6441A4')
        .setTitle(`${streamData.user_name} is now live on Twitch!`)
        .setURL(`https://twitch.tv/${streamData.user_login}`)
        .setDescription(streamData.title)
        .addFields(
          { name: 'Game', value: streamData.game_name || 'No game specified', inline: true },
          { name: 'Viewers', value: streamData.viewer_count.toString(), inline: true }
        )
        .setImage(streamData.thumbnail_url.replace('{width}', '1280').replace('{height}', '720') + `?t=${Date.now()}`)
        .setThumbnail(user.profile_image_url)
        .setTimestamp()
        .setFooter({ text: 'Twitch Integration Bot' });
      
      await liveChannel.send({ 
        content: '@everyone The stream is now live!', 
        embeds: [embed] 
      });
      
      console.log('Live announcement sent to Discord');
    } catch (error) {
      console.error('Error announcing stream:', error);
    }
  }
  
  async checkForNewClips() {
    try {
      const token = await this.getTwitchAccessToken();
      if (!token) return;
      
      // Get clips created after the last check time
      const startedAt = this.lastClipTime.toISOString();
      const response = await fetch(
        `https://api.twitch.tv/helix/clips?broadcaster_id=${process.env.TWITCH_BROADCASTER_ID}&started_at=${startedAt}`, 
        {
          headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        // Update the last clip time to the most recent clip
        this.lastClipTime = new Date();
        
        // Post each clip to Discord
        for (const clip of data.data) {
          await this.postClipToDiscord(clip);
        }
      }
    } catch (error) {
      console.error('Error checking for new clips:', error);
    }
  }
  
  async postClipToDiscord(clipData) {
    try {
      const clipsChannel = this.client.channels.cache.get(process.env.DISCORD_CLIPS_CHANNEL_ID);
      
      if (!clipsChannel) {
        console.error('Could not find the clips channel');
        return;
      }
      
      // Create rich embed for the clip
      const embed = new EmbedBuilder()
        .setColor('#6441A4')
        .setTitle(clipData.title)
        .setURL(clipData.url)
        .setDescription(`Clipped by ${clipData.creator_name}`)
        .setImage(clipData.thumbnail_url)
        .setTimestamp(new Date(clipData.created_at))
        .setFooter({ text: 'Twitch Clip' });
      
      await clipsChannel.send({ embeds: [embed] });
      console.log(`Posted clip to Discord: ${clipData.title}`);
    } catch (error) {
      console.error('Error posting clip to Discord:', error);
    }
  }
  
  startStreamChecking() {
    // Check immediately on startup
    this.checkStreamStatus();
    
    // Then check every minute
    this.checkStreamInterval = setInterval(() => {
      this.checkStreamStatus();
    }, 60000); // 60 seconds
  }
  
  startClipsChecking() {
    // Check every 2 minutes for new clips
    this.checkClipsInterval = setInterval(() => {
      this.checkForNewClips();
    }, 120000); // 120 seconds
  }
  
  shutdown() {
    // Clear intervals
    if (this.checkStreamInterval) {
      clearInterval(this.checkStreamInterval);
    }
    
    if (this.checkClipsInterval) {
      clearInterval(this.checkClipsInterval);
    }
    
    // Disconnect from Discord
    this.client.destroy();
    console.log('Discord bot shut down');
  }
}

module.exports = DiscordBot;
