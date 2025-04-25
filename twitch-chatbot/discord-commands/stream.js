const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stream')
    .setDescription('Check if the Twitch stream is live'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      // Get access token
      const tokenResponse = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
        method: 'POST'
      });
      
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        return interaction.editReply('Failed to authenticate with Twitch API.');
      }
      
      // Check stream status
      const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_login=${process.env.CHANNEL}`, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      
      const streamData = await streamResponse.json();
      
      // Get user data for profile image
      const userResponse = await fetch(`https://api.twitch.tv/helix/users?login=${process.env.CHANNEL}`, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      
      const userData = await userResponse.json();
      const user = userData.data[0];
      
      if (streamData.data && streamData.data.length > 0) {
        // Stream is live
        const stream = streamData.data[0];
        
        const embed = new EmbedBuilder()
          .setColor('#6441A4')
          .setTitle(`${stream.user_name} is LIVE on Twitch!`)
          .setURL(`https://twitch.tv/${stream.user_login}`)
          .setDescription(stream.title)
          .addFields(
            { name: 'Game', value: stream.game_name || 'No game specified', inline: true },
            { name: 'Viewers', value: stream.viewer_count.toString(), inline: true },
            { name: 'Started At', value: new Date(stream.started_at).toLocaleString(), inline: true }
          )
          .setImage(stream.thumbnail_url.replace('{width}', '1280').replace('{height}', '720') + `?t=${Date.now()}`)
          .setThumbnail(user.profile_image_url)
          .setTimestamp()
          .setFooter({ text: 'Twitch Integration Bot' });
        
        return interaction.editReply({ embeds: [embed] });
      } else {
        // Stream is offline
        const embed = new EmbedBuilder()
          .setColor('#6441A4')
          .setTitle(`${process.env.CHANNEL} is currently offline`)
          .setDescription('The stream is not live at the moment.')
          .setThumbnail(user.profile_image_url)
          .setTimestamp()
          .setFooter({ text: 'Twitch Integration Bot' });
        
        return interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error executing stream command:', error);
      return interaction.editReply('There was an error checking the stream status.');
    }
  }
};
