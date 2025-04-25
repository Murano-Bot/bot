# Deployment Guide

This document provides detailed instructions for deploying the Twitch chatbot to various environments.

## Prerequisites

Before deploying the bot, ensure you have:

1. Node.js (v16 or higher) installed
2. A Twitch account for your bot
3. OAuth token for your bot account
4. A Discord bot token (for Discord integration)
5. Twitch API credentials (for stream status and clips)

## Local Deployment

### Development Environment

For local development and testing:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/twitch-chatbot.git
   cd twitch-chatbot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your credentials:
   ```
   # Twitch Credentials
   BOT_USERNAME=your_bot_username
   OAUTH_TOKEN=oauth:your_oauth_token
   CHANNEL=your_channel_name
   
   # Discord Credentials
   DISCORD_TOKEN=your_discord_bot_token
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_GUILD_ID=your_discord_server_id
   DISCORD_LIVE_CHANNEL_ID=your_live_announcements_channel_id
   DISCORD_CLIPS_CHANNEL_ID=your_clips_channel_id
   
   # Twitch API Credentials
   TWITCH_CLIENT_ID=your_twitch_client_id
   TWITCH_CLIENT_SECRET=your_twitch_client_secret
   TWITCH_BROADCASTER_ID=your_twitch_broadcaster_id
   ```

4. Start the bot:
   - For web interface: `npm start` (then visit http://localhost:3000)
   - For CLI only: `npm run bot`

### Running in Background (Windows)

To keep the bot running in the background on Windows:

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Start the bot with PM2:
   - For web interface: `pm2 start server.js --name twitch-dashboard`
   - For CLI only: `pm2 start index.js --name twitch-bot`

3. Set PM2 to start on boot:
   ```bash
   pm2 startup
   ```
   Follow the instructions provided by the command.

4. Save the PM2 configuration:
   ```bash
   pm2 save
   ```

5. Monitor the bot:
   ```bash
   pm2 monit
   ```

### Running in Background (Linux)

To keep the bot running in the background on Linux:

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Start the bot with PM2:
   - For web interface: `pm2 start server.js --name twitch-dashboard`
   - For CLI only: `pm2 start index.js --name twitch-bot`

3. Set PM2 to start on boot:
   ```bash
   pm2 startup
   ```
   Follow the instructions provided by the command.

4. Save the PM2 configuration:
   ```bash
   pm2 save
   ```

5. Monitor the bot:
   ```bash
   pm2 monit
   ```

### Running in Background (macOS)

To keep the bot running in the background on macOS:

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Start the bot with PM2:
   - For web interface: `pm2 start server.js --name twitch-dashboard`
   - For CLI only: `pm2 start index.js --name twitch-bot`

3. Set PM2 to start on boot:
   ```bash
   pm2 startup
   ```
   Follow the instructions provided by the command.

4. Save the PM2 configuration:
   ```bash
   pm2 save
   ```

5. Monitor the bot:
   ```bash
   pm2 monit
   ```

## Cloud Deployment

### Virtual Private Server (VPS)

#### Manual Setup

1. Sign up for a VPS provider (DigitalOcean, Linode, AWS EC2, etc.)
2. Create a new server (smallest plan is usually sufficient)
3. Connect to your server via SSH:
   ```bash
   ssh username@server_ip
   ```

4. Install Node.js:
   ```bash
   curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

5. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/twitch-chatbot.git
   cd twitch-chatbot
   ```

6. Install dependencies:
   ```bash
   npm install
   ```

7. Create a `.env` file with your credentials:
   ```bash
   nano .env
   ```
   Add your credentials as shown in the local deployment section.

8. Install PM2:
   ```bash
   npm install -g pm2
   ```

9. Start the bot with PM2:
   - For web interface: `pm2 start server.js --name twitch-dashboard`
   - For CLI only: `pm2 start index.js --name twitch-bot`

10. Set PM2 to start on boot:
    ```bash
    pm2 startup
    ```
    Follow the instructions provided by the command.

11. Save the PM2 configuration:
    ```bash
    pm2 save
    ```

#### Using the Deployment Script

For Linux VPS, you can use the included deployment script:

1. Connect to your server via SSH:
   ```bash
   ssh username@server_ip
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/twitch-chatbot.git
   cd twitch-chatbot
   ```

3. Make the deployment script executable:
   ```bash
   chmod +x deploy.sh
   ```

4. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

5. Follow the prompts to complete the setup.

### Heroku

1. Sign up for a [Heroku](https://heroku.com/) account

2. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

3. Login to Heroku:
   ```bash
   heroku login
   ```

4. Create a new Heroku app:
   ```bash
   heroku create your-bot-name
   ```

5. Add a `Procfile` to your project root (if not already present):
   ```
   web: node server.js
   ```

6. Set environment variables in Heroku:
   ```bash
   # Twitch Credentials
   heroku config:set BOT_USERNAME=your_bot_username
   heroku config:set OAUTH_TOKEN=oauth:your_oauth_token
   heroku config:set CHANNEL=your_channel_name
   
   # Discord Credentials
   heroku config:set DISCORD_TOKEN=your_discord_bot_token
   heroku config:set DISCORD_CLIENT_ID=your_discord_client_id
   heroku config:set DISCORD_GUILD_ID=your_discord_server_id
   heroku config:set DISCORD_LIVE_CHANNEL_ID=your_live_announcements_channel_id
   heroku config:set DISCORD_CLIPS_CHANNEL_ID=your_clips_channel_id
   
   # Twitch API Credentials
   heroku config:set TWITCH_CLIENT_ID=your_twitch_client_id
   heroku config:set TWITCH_CLIENT_SECRET=your_twitch_client_secret
   heroku config:set TWITCH_BROADCASTER_ID=your_twitch_broadcaster_id
   
   # Web Interface Credentials
   heroku config:set SESSION_SECRET=your_random_session_secret
   ```

7. Deploy your code:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push heroku master
   ```

8. Scale the web dyno:
   ```bash
   heroku ps:scale web=1
   ```

9. Open the app:
   ```bash
   heroku open
   ```

### Railway

[Railway](https://railway.app/) is a platform that makes it easy to deploy your applications.

1. Sign up for a Railway account

2. Install the Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

3. Login to Railway:
   ```bash
   railway login
   ```

4. Initialize a new project:
   ```bash
   railway init
   ```

5. Link your GitHub repository:
   ```bash
   railway link
   ```

6. Set environment variables:
   ```bash
   railway variables set BOT_USERNAME=your_bot_username
   railway variables set OAUTH_TOKEN=oauth:your_oauth_token
   # Set all other required variables
   ```

7. Deploy your project:
   ```bash
   railway up
   ```

### Replit

[Replit](https://replit.com/) is a browser-based IDE that can also host your bot.

1. Sign up for a Replit account

2. Create a new Repl and import from GitHub

3. Set up environment variables in the Repl's Secrets tab

4. Add a `.replit` file to your project:
   ```
   language = "nodejs"
   run = "npm start"
   ```

5. Click the "Run" button to start your bot

## Docker Deployment

### Building the Docker Image

1. Create a `Dockerfile` in your project root:
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   
   RUN npm install
   
   COPY . .
   
   EXPOSE 3000
   
   CMD ["node", "server.js"]
   ```

2. Build the Docker image:
   ```bash
   docker build -t twitch-chatbot .
   ```

3. Run the Docker container:
   ```bash
   docker run -p 3000:3000 --env-file .env twitch-chatbot
   ```

### Docker Compose

1. Create a `docker-compose.yml` file:
   ```yaml
   version: '3'
   services:
     bot:
       build: .
       ports:
         - "3000:3000"
       env_file:
         - .env
       restart: unless-stopped
   ```

2. Start the container:
   ```bash
   docker-compose up -d
   ```

3. View logs:
   ```bash
   docker-compose logs -f
   ```

## Security Considerations

### Web Interface Security

When deploying the web interface to production:

1. Use HTTPS:
   - On Heroku, HTTPS is provided automatically
   - On a VPS, use [Let's Encrypt](https://letsencrypt.org/) with [Certbot](https://certbot.eff.org/)
   - Consider using a reverse proxy like Nginx or Apache

2. Change the default admin password immediately after deployment

3. Set a strong, random `SESSION_SECRET` environment variable

4. Consider IP restrictions for the web interface

### Environment Variables

1. Never commit your `.env` file to version control

2. Use a secure method to store and transfer credentials

3. Regularly rotate sensitive credentials like OAuth tokens

4. Use different credentials for development and production environments

## Monitoring and Maintenance

### Logging

The bot logs important events to the console. When running in production:

1. Consider using a logging service like [Loggly](https://www.loggly.com/) or [Papertrail](https://www.papertrail.com/)

2. Set up log rotation if running on a VPS

### Uptime Monitoring

To ensure your bot stays online:

1. Use a service like [UptimeRobot](https://uptimerobot.com/) to monitor your bot's web interface

2. Set up alerts for when your bot goes offline

### Updates and Maintenance

1. Regularly update dependencies:
   ```bash
   npm update
   ```

2. Check for security vulnerabilities:
   ```bash
   npm audit
   ```

3. Set up automatic backups of your bot's data

## Troubleshooting

### Common Issues

1. **Bot disconnects frequently**:
   - Check your internet connection
   - Ensure your hosting provider has stable uptime
   - Verify your OAuth token is valid

2. **Discord commands not registering**:
   - Ensure your bot has the `applications.commands` scope
   - Check that your `DISCORD_CLIENT_ID` and `DISCORD_GUILD_ID` are correct
   - Verify your bot has the necessary permissions

3. **Web interface not accessible**:
   - Check if the server is running
   - Verify the port is not blocked by a firewall
   - Ensure your hosting provider allows the port to be exposed

### Getting Help

If you encounter issues:

1. Check the logs for error messages
2. Consult the [GitHub repository](https://github.com/yourusername/twitch-chatbot) for known issues
3. Open a new issue on GitHub with detailed information about your problem

## Conclusion

By following this deployment guide, you should be able to successfully deploy your Twitch chatbot to various environments. Choose the deployment option that best fits your needs and budget.

Remember to keep your bot's credentials secure and regularly update your dependencies to ensure the best performance and security.
