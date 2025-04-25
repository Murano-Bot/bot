const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clips')
    .setDescription('Get recent clips from the Twitch channel')
    .addIntegerOption(option => 
      option.setName('count')
        .setDescription('Number of clips to show (1-5)')
        .setMinValue(1)
        .setMaxValue(5)
        .setRequired(false)),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      // Get the number of clips to show (default to 3)
      const count = interaction.options.getInteger('count') || 3;
      
      // Get access token
      const tokenResponse = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
        method: 'POST'
      });
      
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        return interaction.editReply('Failed to authenticate with Twitch API.');
      }
      
      // Get broadcaster ID if not already in env
      let broadcasterId = process.env.TWITCH_BROADCASTER_ID;
      
      if (!broadcasterId) {
        const userResponse = await fetch(`https://api.twitch.tv/helix/users?login=${process.env.CHANNEL}`, {
          headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        });
        
        const userData = await userResponse.json();
        
        if (!userData.data || userData.data.length === 0) {
          return interaction.editReply('Could not find the Twitch channel.');
        }
        
        broadcasterId = userData.data[0].id;
      }
      
      // Get clips
      const clipsResponse = await fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}&first=${count}`, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      
      const clipsData = await clipsResponse.json();
      
      if (!clipsData.data || clipsData.data.length === 0) {
        return interaction.editReply('No clips found for this channel.');
      }
      
      // Create embeds for each clip
      const embeds = clipsData.data.map(clip => {
        return new EmbedBuilder()
          .setColor('#6441A4')
          .setTitle(clip.title)
          .setURL(clip.url)
          .setDescription(`Clipped by ${clip.creator_name}`)
          .addFields(
            { name: 'Views', value: clip.view_count.toString(), inline: true },
            { name: 'Created', value: new Date(clip.created_at).toLocaleDateString(), inline: true }
          )
          .setImage(clip.thumbnail_url)
          .setTimestamp()
          .setFooter({ text: 'Twitch Clip' });
      });
      
      // Send the embeds
      return interaction.editReply({ 
        content: `Here are the ${clipsData.data.length} most recent clips from ${process.env.CHANNEL}:`,
        embeds: embeds.slice(0, 10) // Discord has a limit of 10 embeds per message
      });
    } catch (error) {
      console.error('Error executing clips command:', error);
      return interaction.editReply('There was an error fetching clips.');
    }
  }
};
