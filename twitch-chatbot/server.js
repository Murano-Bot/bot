require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const multer = require('multer');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'twitch-chatbot-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Default admin user (only used if no users exist)
const defaultAdmin = {
  username: 'admin',
  password: 'admin',
  isAdmin: true
};

// In-memory user store (in a real app, use a database)
let users = [];

// Check if users.json exists, if not create it with default admin
async function initializeUsers() {
  try {
    const usersPath = path.join(__dirname, 'data', 'users.json');
    
    // Create data directory if it doesn't exist
    try {
      await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
    
    try {
      const data = await fs.readFile(usersPath, 'utf8');
      users = JSON.parse(data);
    } catch (err) {
      // If file doesn't exist or is invalid, create default admin
      const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);
      users = [{
        id: 1,
        username: defaultAdmin.username,
        password: hashedPassword,
        isAdmin: defaultAdmin.isAdmin
      }];
      await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
      console.log('Created default admin user: admin/admin');
    }
  } catch (err) {
    console.error('Error initializing users:', err);
  }
}

// Save users to file
async function saveUsers() {
  try {
    const usersPath = path.join(__dirname, 'data', 'users.json');
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

// Configure passport
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

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.find(u => u.id === id);
  done(null, user);
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Middleware to check if user is admin
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).render('error', { message: 'Access denied. Admin privileges required.' });
}

// Bot process management
let botProcess = null;

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

// Routes

// Home page
app.get('/', isAuthenticated, (req, res) => {
  res.render('dashboard', { 
    user: req.user,
    botStatus: botProcess ? 'running' : 'stopped'
  });
});

// Login page
app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('login', { message: req.flash('error') });
});

// Login process
app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

// Logout
app.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

// Settings page
app.get('/settings', isAuthenticated, async (req, res) => {
  try {
    // Read current .env file
    const envPath = path.join(__dirname, '.env');
    const envContent = await fs.readFile(envPath, 'utf8');
    
    // Parse .env content
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        envVars[key] = value;
      }
    });
    
    res.render('settings', { 
      user: req.user,
      envVars: envVars,
      message: req.flash('message')
    });
  } catch (err) {
    console.error('Error reading .env file:', err);
    res.render('settings', { 
      user: req.user,
      envVars: {},
      message: 'Error loading settings'
    });
  }
});

// Save settings
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

// Commands page
app.get('/commands', isAuthenticated, async (req, res) => {
  try {
    const commandsDir = path.join(__dirname, 'commands');
    const files = await fs.readdir(commandsDir);
    
    const commands = [];
    for (const file of files) {
      if (file.endsWith('.js')) {
        const commandPath = path.join(commandsDir, file);
        const content = await fs.readFile(commandPath, 'utf8');
        commands.push({
          name: file.replace('.js', ''),
          file: file,
          content: content
        });
      }
    }
    
    res.render('commands', { 
      user: req.user,
      commands: commands,
      message: req.flash('message')
    });
  } catch (err) {
    console.error('Error reading commands:', err);
    res.render('commands', { 
      user: req.user,
      commands: [],
      message: 'Error loading commands'
    });
  }
});

// Edit command
app.get('/commands/edit/:name', isAuthenticated, async (req, res) => {
  try {
    const commandName = req.params.name;
    const commandPath = path.join(__dirname, 'commands', `${commandName}.js`);
    
    const content = await fs.readFile(commandPath, 'utf8');
    
    res.render('edit-command', { 
      user: req.user,
      command: {
        name: commandName,
        content: content
      },
      message: req.flash('message')
    });
  } catch (err) {
    console.error('Error reading command:', err);
    req.flash('message', 'Error loading command');
    res.redirect('/commands');
  }
});

// Save command
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

// New command
app.get('/commands/new', isAuthenticated, (req, res) => {
  res.render('new-command', { 
    user: req.user,
    message: req.flash('message')
  });
});

// Create command
app.post('/commands/new', isAuthenticated, async (req, res) => {
  try {
    const { name, content } = req.body;
    
    // Validate name
    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      req.flash('message', 'Invalid command name. Use only letters, numbers, hyphens, and underscores.');
      return res.redirect('/commands/new');
    }
    
    const commandPath = path.join(__dirname, 'commands', `${name}.js`);
    
    // Check if command already exists
    try {
      await fs.access(commandPath);
      req.flash('message', 'Command already exists');
      return res.redirect('/commands/new');
    } catch (err) {
      // File doesn't exist, we can create it
    }
    
    await fs.writeFile(commandPath, content);
    
    req.flash('message', `Command ${name} created successfully`);
    res.redirect('/commands');
  } catch (err) {
    console.error('Error creating command:', err);
    req.flash('message', 'Error creating command');
    res.redirect('/commands/new');
  }
});

// Delete command
app.post('/commands/delete/:name', isAuthenticated, async (req, res) => {
  try {
    const commandName = req.params.name;
    const commandPath = path.join(__dirname, 'commands', `${commandName}.js`);
    
    await fs.unlink(commandPath);
    
    req.flash('message', `Command ${commandName} deleted successfully`);
    res.redirect('/commands');
  } catch (err) {
    console.error('Error deleting command:', err);
    req.flash('message', 'Error deleting command');
    res.redirect('/commands');
  }
});

// Discord commands page
app.get('/discord-commands', isAuthenticated, async (req, res) => {
  try {
    const commandsDir = path.join(__dirname, 'discord-commands');
    const files = await fs.readdir(commandsDir);
    
    const commands = [];
    for (const file of files) {
      if (file.endsWith('.js')) {
        const commandPath = path.join(commandsDir, file);
        const content = await fs.readFile(commandPath, 'utf8');
        commands.push({
          name: file.replace('.js', ''),
          file: file,
          content: content
        });
      }
    }
    
    res.render('discord-commands', { 
      user: req.user,
      commands: commands,
      message: req.flash('message')
    });
  } catch (err) {
    console.error('Error reading Discord commands:', err);
    res.render('discord-commands', { 
      user: req.user,
      commands: [],
      message: 'Error loading Discord commands'
    });
  }
});

// Edit Discord command
app.get('/discord-commands/edit/:name', isAuthenticated, async (req, res) => {
  try {
    const commandName = req.params.name;
    const commandPath = path.join(__dirname, 'discord-commands', `${commandName}.js`);
    
    const content = await fs.readFile(commandPath, 'utf8');
    
    res.render('edit-discord-command', { 
      user: req.user,
      command: {
        name: commandName,
        content: content
      },
      message: req.flash('message')
    });
  } catch (err) {
    console.error('Error reading Discord command:', err);
    req.flash('message', 'Error loading Discord command');
    res.redirect('/discord-commands');
  }
});

// Save Discord command
app.post('/discord-commands/edit/:name', isAuthenticated, async (req, res) => {
  try {
    const commandName = req.params.name;
    const { content } = req.body;
    
    const commandPath = path.join(__dirname, 'discord-commands', `${commandName}.js`);
    await fs.writeFile(commandPath, content);
    
    req.flash('message', `Discord command ${commandName} saved successfully`);
    res.redirect('/discord-commands');
  } catch (err) {
    console.error('Error saving Discord command:', err);
    req.flash('message', 'Error saving Discord command');
    res.redirect('/discord-commands');
  }
});

// Bot control
app.post('/bot/start', isAuthenticated, (req, res) => {
  startBot();
  res.redirect('/');
});

app.post('/bot/stop', isAuthenticated, (req, res) => {
  stopBot();
  res.redirect('/');
});

// API endpoints
app.get('/api/bot-status', isAuthenticated, (req, res) => {
  res.json({
    status: botProcess ? 'running' : 'stopped',
    uptime: botProcess ? process.uptime() : 0
  });
});

// User management (admin only)
app.get('/users', isAuthenticated, isAdmin, (req, res) => {
  res.render('users', { 
    user: req.user,
    users: users,
    message: req.flash('message')
  });
});

// Add user
app.post('/users/add', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { username, password, isAdmin } = req.body;
    
    // Check if username already exists
    if (users.find(u => u.username === username)) {
      req.flash('message', 'Username already exists');
      return res.redirect('/users');
    }
    
    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      password: hashedPassword,
      isAdmin: isAdmin === 'on'
    };
    
    users.push(newUser);
    await saveUsers();
    
    req.flash('message', 'User added successfully');
    res.redirect('/users');
  } catch (err) {
    console.error('Error adding user:', err);
    req.flash('message', 'Error adding user');
    res.redirect('/users');
  }
});

// Delete user
app.post('/users/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Prevent deleting yourself
    if (userId === req.user.id) {
      req.flash('message', 'Cannot delete your own account');
      return res.redirect('/users');
    }
    
    users = users.filter(u => u.id !== userId);
    await saveUsers();
    
    req.flash('message', 'User deleted successfully');
    res.redirect('/users');
  } catch (err) {
    console.error('Error deleting user:', err);
    req.flash('message', 'Error deleting user');
    res.redirect('/users');
  }
});

// Change password
app.get('/change-password', isAuthenticated, (req, res) => {
  res.render('change-password', { 
    user: req.user,
    message: req.flash('message')
  });
});

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

// Initialize users and start server
initializeUsers().then(() => {
  app.listen(PORT, () => {
    console.log(`Web interface running on http://localhost:${PORT}`);
  });
});
