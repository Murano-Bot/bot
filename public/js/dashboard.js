/**
 * Dashboard JavaScript for Twitch Chatbot
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Add animation to dashboard cards
  const dashboardCards = document.querySelectorAll('.dashboard-card');
  dashboardCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.classList.add('shadow');
    });
    card.addEventListener('mouseleave', () => {
      card.classList.remove('shadow');
    });
  });

  // Handle form submissions with confirmation
  const confirmForms = document.querySelectorAll('form[data-confirm]');
  confirmForms.forEach(form => {
    form.addEventListener('submit', function(event) {
      const confirmMessage = this.getAttribute('data-confirm');
      if (!confirm(confirmMessage)) {
        event.preventDefault();
      }
    });
  });

  // Bot status polling (if on dashboard page)
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
          
          // Update button
          const startButton = document.getElementById('start-bot-button');
          const stopButton = document.getElementById('stop-bot-button');
          
          if (startButton) startButton.style.display = 'none';
          if (stopButton) stopButton.style.display = 'block';
        } else {
          statusIcon.className = 'bi bi-circle-fill bot-status-stopped me-2';
          statusText.textContent = 'Stopped';
          
          // Update button
          const startButton = document.getElementById('start-bot-button');
          const stopButton = document.getElementById('stop-bot-button');
          
          if (startButton) startButton.style.display = 'block';
          if (stopButton) stopButton.style.display = 'none';
        }
      } catch (error) {
        console.error('Error polling bot status:', error);
      }
    }, 5000);
  }

  // Password strength meter
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

  // Settings form validation
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', function(event) {
      const twitchUsername = document.getElementById('BOT_USERNAME').value;
      const twitchToken = document.getElementById('OAUTH_TOKEN').value;
      const twitchChannel = document.getElementById('CHANNEL').value;
      
      if (!twitchUsername || !twitchToken || !twitchChannel) {
        event.preventDefault();
        alert('Twitch credentials are required (Username, OAuth Token, and Channel)');
      }
    });
  }
});
