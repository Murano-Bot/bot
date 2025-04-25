# Hosting Your Twitch Chatbot

There are several options for hosting your Twitch chatbot, ranging from running it on your local machine to deploying it on cloud platforms. Here's a guide to help you choose the best option for your needs.

## 1. Local Hosting

### Advantages
- Free (uses your existing computer)
- Easy to set up and maintain
- Direct access to logs and immediate control

### Disadvantages
- Bot goes offline when your computer is off or internet connection drops
- Uses your computer's resources
- Not ideal for 24/7 operation

### Setup Instructions
1. Make sure Node.js is installed on your computer
2. Navigate to the bot directory
3. Run `npm install` to install dependencies
4. Configure your `.env` file with your Twitch credentials
5. Start the bot with `npm start`

### Running in Background (Windows)
To keep the bot running in the background:
1. Install PM2: `npm install -g pm2`
2. Start the bot: `pm2 start index.js --name twitch-bot`
3. Set PM2 to start on boot: `pm2 startup` (follow the instructions)
4. Save the PM2 configuration: `pm2 save`

## 2. Cloud Hosting

### Option A: Virtual Private Server (VPS)

Services like DigitalOcean, Linode, AWS EC2, or Google Cloud Compute Engine provide virtual servers.

#### Advantages
- Full control over the server
- 24/7 uptime
- Reasonable cost ($5-10/month for basic needs)

#### Setup Instructions

**Option 1: Manual Setup**
1. Sign up for a VPS provider (DigitalOcean, Linode, etc.)
2. Create a new server (smallest plan is usually sufficient)
3. Connect to your server via SSH
4. Install Node.js:
   ```bash
   curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
5. Clone your bot repository or upload the files
6. Navigate to the bot directory
7. Run `npm install` to install dependencies
8. Configure your `.env` file with your Twitch credentials
9. Install PM2: `npm install -g pm2`
10. Start the bot: `pm2 start index.js --name twitch-bot`
11. Set PM2 to start on boot: `pm2 startup` (follow the instructions)
12. Save the PM2 configuration: `pm2 save`

**Option 2: Using the Deployment Script**
1. Sign up for a VPS provider (DigitalOcean, Linode, etc.)
2. Create a new server (smallest plan is usually sufficient)
3. Connect to your server via SSH
4. Clone your bot repository or upload the files
5. Navigate to the bot directory
6. Make the deployment script executable:
   ```bash
   chmod +x deploy.sh
   ```
7. Run the deployment script:
   ```bash
   ./deploy.sh
   ```
8. Follow the prompts to complete the setup

The deployment script will automatically:
- Install Node.js if not already installed
- Install PM2 if not already installed
- Install project dependencies
- Create the .env file if it doesn't exist
- Start the bot with PM2
- Configure PM2 to start on boot

### Option B: Platform as a Service (PaaS)

Services like Heroku, Railway, or Render provide simplified deployment.

#### Advantages
- Easier to deploy and maintain
- Often has free tiers
- Automatic scaling and management

#### Disadvantages
- Less control over the environment
- Free tiers may have limitations (sleep after inactivity)

#### Setup Instructions for Heroku
1. Sign up for a Heroku account
2. Install the Heroku CLI
3. Login to Heroku: `heroku login`
4. Create a new Heroku app: `heroku create your-bot-name`
5. Add a Procfile to your project root:
   ```
   worker: node index.js
   ```
6. Set environment variables in Heroku:
   ```bash
   heroku config:set BOT_USERNAME=your_bot_username
   heroku config:set OAUTH_TOKEN=oauth:your_oauth_token
   heroku config:set CHANNEL=your_channel_name
   ```
7. Deploy your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku master
   ```
8. Ensure the worker is running: `heroku ps:scale worker=1`

## 3. Specialized Bot Hosting Services

Some services are specifically designed for hosting bots:

- [Glitch](https://glitch.com/) - Free hosting with easy setup
- [Replit](https://replit.com/) - Free hosting with collaborative development
- [Railway](https://railway.app/) - Developer-friendly platform with free tier

These platforms often have simpler deployment processes but may have limitations on the free tiers.
