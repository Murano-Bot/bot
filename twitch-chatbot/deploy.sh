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
