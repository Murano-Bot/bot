const fs = require('fs');
const path = require('path');

// Test copying a single file
const sourceFile = path.join(__dirname, 'twitch-chatbot', 'README.md');
const destFile = path.join(__dirname, 'README-copy.md');

console.log('Source file:', sourceFile);
console.log('Destination file:', destFile);

try {
  // Check if source file exists
  if (fs.existsSync(sourceFile)) {
    console.log('Source file exists');
    
    // Copy the file
    fs.copyFileSync(sourceFile, destFile);
    console.log('File copied successfully');
  } else {
    console.error('Source file does not exist');
  }
} catch (err) {
  console.error('Error copying file:', err);
}
