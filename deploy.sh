#!/bin/bash
# Twitch Chatbot Deployment Script for Linux VPS
# This script helps set up and run the Twitch chatbot on a Linux server

echo "=== Twitch Chatbot Deployment ==="
echo "This script will help you set up and run your Twitch chatbot."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Installing Node.js..."
    curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "Node.js installed successfully."
else
    echo "Node.js is already installed: $(node -v)"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing PM2..."
    sudo npm install -g pm2
    echo "PM2 installed successfully."
else
    echo "PM2 is already installed."
fi

# Install dependencies
echo "Installing project dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    echo "# Twitch Credentials" > .env
    
    # Prompt for Twitch credentials
    read -p "Enter your bot's Twitch username: " username
    read -p "Enter your OAuth token (including oauth: prefix): " token
    read -p "Enter the channel name to join: " channel
    
    # Write to .env file
    echo "BOT_USERNAME=$username" >> .env
    echo "OAUTH_TOKEN=$token" >> .env
    echo "CHANNEL=$channel" >> .env
    
    echo "" >> .env
    echo "# Discord Credentials" >> .env
    
    # Ask if user wants to set up Discord integration
    read -p "Do you want to set up Discord integration? (y/n): " setup_discord
    
    if [ "$setup_discord" = "y" ] || [ "$setup_discord" = "Y" ]; then
        read -p "Enter your Discord bot token: " discord_token
        read -p "Enter your Discord client ID: " discord_client_id
        read -p "Enter your Discord server (guild) ID: " discord_guild_id
        read -p "Enter your Discord live announcements channel ID: " live_channel_id
        read -p "Enter your Discord clips channel ID: " clips_channel_id
        
        echo "DISCORD_TOKEN=$discord_token" >> .env
        echo "DISCORD_CLIENT_ID=$discord_client_id" >> .env
        echo "DISCORD_GUILD_ID=$discord_guild_id" >> .env
        echo "DISCORD_LIVE_CHANNEL_ID=$live_channel_id" >> .env
        echo "DISCORD_CLIPS_CHANNEL_ID=$clips_channel_id" >> .env
        
        echo "" >> .env
        echo "# Twitch API Credentials (for stream status and clips)" >> .env
        
        read -p "Enter your Twitch client ID: " twitch_client_id
        read -p "Enter your Twitch client secret: " twitch_client_secret
        read -p "Enter your Twitch broadcaster ID: " twitch_broadcaster_id
        
        echo "TWITCH_CLIENT_ID=$twitch_client_id" >> .env
        echo "TWITCH_CLIENT_SECRET=$twitch_client_secret" >> .env
        echo "TWITCH_BROADCASTER_ID=$twitch_broadcaster_id" >> .env
    else
        echo "Discord integration not set up. You can configure it later by editing the .env file."
    fi
    
    echo ".env file created successfully."
else
    echo ".env file already exists."
fi

# Start the bot with PM2
echo "Starting the bot with PM2..."
pm2 start index.js --name twitch-bot

# Set PM2 to start on boot
echo "Setting PM2 to start on boot..."
pm2 startup
pm2 save

echo "=== Deployment Complete ==="
echo "Your Twitch chatbot is now running with PM2."
echo "You can check its status with: pm2 status"
echo "View logs with: pm2 logs twitch-bot"
echo "Stop the bot with: pm2 stop twitch-bot"
