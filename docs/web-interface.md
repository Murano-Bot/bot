# Web Interface

This document explains the web interface features of the Twitch chatbot.

## Overview

The web interface provides a user-friendly dashboard for managing the Twitch chatbot. It allows users to:

1. Start and stop the bot
2. Configure Twitch and Discord credentials
3. Edit and create Twitch commands
4. Edit Discord slash commands
5. Manage user accounts

## Architecture

The web interface is built using:

1. **Express.js**: Web server framework
2. **Passport.js**: Authentication middleware
3. **Pug**: Template engine
4. **Bootstrap**: Frontend framework
5. **Ace Editor**: Code editor for command editing

The main components are:

1. **Server (`server.js`)**: Main entry point for the web interface
2. **Views (`views/*.pug`)**: Pug templates for rendering pages
3. **Public Assets (`public/`)**: Static files (CSS, JavaScript, images)
4. **Data Storage (`data/`)**: JSON files for storing user data

## Authentication System

The web interface uses a local authentication strategy with Passport.js:

1. Users are stored in a JSON file (`data/users.json`)
2. Passwords are hashed using bcrypt
3. Sessions are used to maintain authentication state

```javascript
// Example from server.js
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = users.find(u => u.username === username);
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));
```

### User Management

The web interface includes user management features:

1. Default admin user (admin/admin) is created on first run
2. Admins can add new users
3. Admins can delete users
4. Users can change their passwords
5. Role-based access control (admin vs. regular user)

## Dashboard

The dashboard provides an overview of the bot's status and quick access to key features:

1. Bot status indicator (running/stopped)
2. Start/stop controls
3. Quick links to settings and commands
4. Getting started guide

```javascript
// Example from server.js - Bot status endpoint
app.get('/api/bot-status', isAuthenticated, (req, res) => {
  res.json({
    status: botProcess ? 'running' : 'stopped',
    uptime: botProcess ? process.uptime() : 0
  });
});
```

## Bot Process Management

The web interface can start and stop the bot process:

1. Uses Node.js child_process to spawn the bot
2. Captures stdout and stderr for logging
3. Monitors the process status
4. Provides controls to start/stop the bot

```javascript
// Example from server.js
function startBot() {
  if (botProcess) {
    console.log('Bot is already running');
    return;
  }
  
  console.log('Starting bot...');
  botProcess = spawn('node', ['index.js'], {
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  botProcess.stdout.on('data', (data) => {
    console.log(`Bot stdout: ${data}`);
  });
  
  botProcess.stderr.on('data', (data) => {
    console.error(`Bot stderr: ${data}`);
  });
  
  botProcess.on('close', (code) => {
    console.log(`Bot process exited with code ${code}`);
    botProcess = null;
  });
}

function stopBot() {
  if (!botProcess) {
    console.log('Bot is not running');
    return;
  }
  
  console.log('Stopping bot...');
  botProcess.kill();
  botProcess = null;
}
```

## Settings Management

The settings page allows users to configure the bot:

1. Twitch credentials (username, OAuth token, channel)
2. Discord credentials (token, client ID, guild ID, channel IDs)
3. Twitch API credentials (client ID, client secret, broadcaster ID)

The settings are stored in the `.env` file and loaded by the bot when it starts.

```javascript
// Example from server.js - Save settings
app.post('/settings', isAuthenticated, async (req, res) => {
  try {
    const { 
      BOT_USERNAME, OAUTH_TOKEN, CHANNEL,
      DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID,
      DISCORD_LIVE_CHANNEL_ID, DISCORD_CLIPS_CHANNEL_ID,
      TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_BROADCASTER_ID
    } = req.body;
    
    // Create .env content
    let envContent = `# Twitch Credentials
BOT_USERNAME=${BOT_USERNAME || ''}
OAUTH_TOKEN=${OAUTH_TOKEN || ''}
CHANNEL=${CHANNEL || ''}

# Discord Credentials
DISCORD_TOKEN=${DISCORD_TOKEN || ''}
DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID || ''}
DISCORD_GUILD_ID=${DISCORD_GUILD_ID || ''}
DISCORD_LIVE_CHANNEL_ID=${DISCORD_LIVE_CHANNEL_ID || ''}
DISCORD_CLIPS_CHANNEL_ID=${DISCORD_CLIPS_CHANNEL_ID || ''}

# Twitch API Credentials (for stream status and clips)
TWITCH_CLIENT_ID=${TWITCH_CLIENT_ID || ''}
TWITCH_CLIENT_SECRET=${TWITCH_CLIENT_SECRET || ''}
TWITCH_BROADCASTER_ID=${TWITCH_BROADCASTER_ID || ''}
`;
    
    // Write to .env file
    const envPath = path.join(__dirname, '.env');
    await fs.writeFile(envPath, envContent);
    
    req.flash('message', 'Settings saved successfully');
    res.redirect('/settings');
  } catch (err) {
    console.error('Error saving settings:', err);
    req.flash('message', 'Error saving settings');
    res.redirect('/settings');
  }
});
```

## Command Management

### Twitch Commands

The web interface allows users to:

1. View all available Twitch commands
2. Edit existing commands
3. Create new commands
4. Delete commands

Commands are stored as individual JavaScript files in the `commands` directory.

```javascript
// Example from server.js - Edit command
app.post('/commands/edit/:name', isAuthenticated, async (req, res) => {
  try {
    const commandName = req.params.name;
    const { content } = req.body;
    
    const commandPath = path.join(__dirname, 'commands', `${commandName}.js`);
    await fs.writeFile(commandPath, content);
    
    req.flash('message', `Command ${commandName} saved successfully`);
    res.redirect('/commands');
  } catch (err) {
    console.error('Error saving command:', err);
    req.flash('message', 'Error saving command');
    res.redirect('/commands');
  }
});
```

### Discord Commands

Similarly, users can:

1. View all available Discord slash commands
2. Edit existing commands

Discord commands are stored as individual JavaScript files in the `discord-commands` directory.

## Code Editor

The web interface includes a code editor for editing commands:

1. Uses Ace Editor for syntax highlighting
2. Supports JavaScript syntax
3. Provides a template for new commands
4. Validates command structure

```javascript
// Example from views/edit-command.pug
block scripts
  script(src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.15.2/ace.js")
  script.
    document.addEventListener('DOMContentLoaded', function() {
      const textarea = document.getElementById('content');
      const editor = ace.edit(textarea.parentNode);
      editor.setTheme("ace/theme/monokai");
      editor.session.setMode("ace/mode/javascript");
      editor.session.setValue(textarea.value);
      
      // Hide the textarea and show the editor
      textarea.style.display = 'none';
      editor.container.style.height = '400px';
      editor.container.style.width = '100%';
      
      // Update the textarea value when the form is submitted
      const form = textarea.closest('form');
      form.addEventListener('submit', function() {
        textarea.value = editor.getValue();
      });
    });
```

## Real-time Updates

The dashboard includes real-time updates for the bot status:

1. Uses AJAX to poll the server for status updates
2. Updates the UI to reflect the current status
3. Provides visual indicators for the bot status

```javascript
// Example from public/js/dashboard.js
const botStatusElement = document.getElementById('bot-status');
if (botStatusElement) {
  // Poll bot status every 5 seconds
  setInterval(async () => {
    try {
      const response = await fetch('/api/bot-status');
      const data = await response.json();
      
      // Update status indicator
      const statusIcon = document.getElementById('bot-status-icon');
      const statusText = document.getElementById('bot-status-text');
      
      if (data.status === 'running') {
        statusIcon.className = 'bi bi-circle-fill bot-status-running me-2';
        statusText.textContent = 'Running';
      } else {
        statusIcon.className = 'bi bi-circle-fill bot-status-stopped me-2';
        statusText.textContent = 'Stopped';
      }
    } catch (error) {
      console.error('Error polling bot status:', error);
    }
  }, 5000);
}
```

## Security Features

The web interface includes several security features:

1. Password hashing with bcrypt
2. Session-based authentication
3. CSRF protection
4. Input validation
5. Error handling

```javascript
// Example from server.js - Password change
app.post('/change-password', isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      req.flash('message', 'Current password is incorrect');
      return res.redirect('/change-password');
    }
    
    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      req.flash('message', 'New passwords do not match');
      return res.redirect('/change-password');
    }
    
    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const userIndex = users.findIndex(u => u.id === req.user.id);
    users[userIndex].password = hashedPassword;
    await saveUsers();
    
    req.flash('message', 'Password changed successfully');
    res.redirect('/');
  } catch (err) {
    console.error('Error changing password:', err);
    req.flash('message', 'Error changing password');
    res.redirect('/change-password');
  }
});
```

## Responsive Design

The web interface is built with responsive design principles:

1. Uses Bootstrap for responsive layout
2. Works on desktop and mobile devices
3. Adapts to different screen sizes
4. Provides a consistent user experience across devices

## Customization

The web interface includes custom styling:

1. Twitch-themed color scheme
2. Custom CSS for consistent branding
3. Bootstrap Icons for visual elements
4. Animated elements for better user experience

```css
/* Example from public/css/custom.css */
:root {
  --twitch-purple: #6441a5;
  --twitch-purple-dark: #533a8b;
  --twitch-purple-light: #9146ff;
  --discord-blue: #5865F2;
  --discord-blue-dark: #4752C4;
}

.sidebar {
  background-color: var(--twitch-purple);
}

.navbar-brand {
  background-color: var(--twitch-purple-dark);
}

.btn-primary {
  background-color: var(--twitch-purple);
  border-color: var(--twitch-purple);
}
```

## Error Handling

The web interface includes comprehensive error handling:

1. Try-catch blocks for async operations
2. Error pages for HTTP errors
3. Flash messages for user feedback
4. Console logging for debugging

```javascript
// Example from server.js - Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something went wrong!' });
});
```

## Running the Web Interface

To start the web interface:

```bash
npm start
```

This will start the Express server on port 3000 (or the port specified in the `PORT` environment variable). You can then access the web interface by navigating to `http://localhost:3000` in your web browser.

The default login credentials are:

- Username: `admin`
- Password: `admin`

It's recommended to change the default password after the first login.
