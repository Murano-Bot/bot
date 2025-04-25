# Authentication System

This document explains the authentication system used in the Twitch chatbot's web interface.

## Overview

The authentication system provides secure access to the web interface, allowing only authorized users to manage the bot. It includes:

1. User authentication with username and password
2. Session management
3. Role-based access control (admin vs. regular user)
4. Password hashing and security
5. User management

## Architecture

The authentication system is built using:

1. **Passport.js**: Authentication middleware for Node.js
2. **Express-session**: Session management
3. **Bcrypt**: Password hashing
4. **Connect-flash**: Flash messages for user feedback

## User Storage

Users are stored in a JSON file (`data/users.json`) with the following structure:

```json
[
  {
    "id": 1,
    "username": "admin",
    "password": "$2b$10$...", // Hashed password
    "isAdmin": true
  },
  {
    "id": 2,
    "username": "user",
    "password": "$2b$10$...", // Hashed password
    "isAdmin": false
  }
]
```

The system automatically creates a default admin user (username: `admin`, password: `admin`) on first run if no users exist.

## Authentication Flow

1. User visits the login page
2. User enters username and password
3. Passport.js verifies the credentials against the stored users
4. If valid, a session is created and the user is redirected to the dashboard
5. If invalid, an error message is displayed and the user remains on the login page

```javascript
// Example from server.js - Login process
app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));
```

## Local Authentication Strategy

The system uses Passport's LocalStrategy for username/password authentication:

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

## Session Management

Sessions are used to maintain authentication state across requests:

```javascript
// Example from server.js
app.use(session({
  secret: process.env.SESSION_SECRET || 'twitch-chatbot-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
```

Passport serializes and deserializes users to and from the session:

```javascript
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.find(u => u.id === id);
  done(null, user);
});
```

## Password Security

Passwords are securely hashed using bcrypt before storage:

```javascript
// Example from server.js - Adding a new user
const hashedPassword = await bcrypt.hash(password, 10);
const newUser = {
  id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
  username,
  password: hashedPassword,
  isAdmin: isAdmin === 'on'
};
```

When a user attempts to log in, the provided password is hashed and compared to the stored hash:

```javascript
const isMatch = await bcrypt.compare(password, user.password);
```

## Access Control

The system includes middleware functions to restrict access to authenticated users and admin users:

```javascript
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
```

These middleware functions are used to protect routes:

```javascript
// Example protected route
app.get('/settings', isAuthenticated, async (req, res) => {
  // Route handler code
});

// Example admin-only route
app.get('/users', isAuthenticated, isAdmin, (req, res) => {
  // Route handler code
});
```

## User Management

### Adding Users

Admins can add new users through the web interface:

```javascript
// Example from server.js - Adding a user
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
```

### Deleting Users

Admins can delete users (except themselves):

```javascript
// Example from server.js - Deleting a user
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
```

### Changing Passwords

Users can change their own passwords:

```javascript
// Example from server.js - Changing password
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

## Password Strength Meter

The web interface includes a password strength meter to encourage strong passwords:

```javascript
// Example from public/js/dashboard.js
const passwordInput = document.getElementById('newPassword');
const passwordStrength = document.getElementById('password-strength');

if (passwordInput && passwordStrength) {
  passwordInput.addEventListener('input', function() {
    const password = this.value;
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Contains number
    if (/[0-9]/.test(password)) strength += 1;
    
    // Contains special character
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    // Update strength meter
    passwordStrength.className = 'progress-bar';
    
    if (strength === 0) {
      passwordStrength.style.width = '0%';
      passwordStrength.classList.add('bg-danger');
    } else if (strength <= 2) {
      passwordStrength.style.width = '33%';
      passwordStrength.classList.add('bg-danger');
    } else if (strength <= 4) {
      passwordStrength.style.width = '66%';
      passwordStrength.classList.add('bg-warning');
    } else {
      passwordStrength.style.width = '100%';
      passwordStrength.classList.add('bg-success');
    }
  });
}
```

## Logout

Users can log out to end their session:

```javascript
// Example from server.js - Logout
app.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});
```

## Security Considerations

### Session Security

1. The session secret should be a strong, random string
2. Sessions are not saved for unauthenticated users (`saveUninitialized: false`)
3. Sessions are not resaved if unchanged (`resave: false`)

### Password Security

1. Passwords are hashed using bcrypt with a cost factor of 10
2. Password strength is encouraged through the strength meter
3. Password validation ensures matching confirmation

### Error Handling

1. Authentication errors are displayed to the user
2. Failed login attempts return generic error messages to prevent username enumeration
3. All errors are logged for debugging

## Best Practices

1. Change the default admin password immediately after setup
2. Use a strong, random `SESSION_SECRET` environment variable
3. Implement rate limiting for login attempts (not currently implemented)
4. Consider adding two-factor authentication for additional security
5. Regularly audit user accounts and remove unused accounts

## Conclusion

The authentication system provides a secure way to manage access to the Twitch chatbot's web interface. By following the best practices outlined in this document, you can ensure that your bot's management interface remains secure.
