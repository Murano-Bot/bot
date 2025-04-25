const fs = require('fs');
const path = require('path');

// Source and destination directories
const sourceDir = path.join(__dirname, 'twitch-chatbot');
const destDir = __dirname;

console.log('Source directory:', sourceDir);
console.log('Destination directory:', destDir);

// Function to copy a file
function copyFile(source, destination) {
  try {
    // Create destination directory if it doesn't exist
    const destDirname = path.dirname(destination);
    if (!fs.existsSync(destDirname)) {
      fs.mkdirSync(destDirname, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(source, destination);
    console.log(`Copied: ${source} -> ${destination}`);
  } catch (err) {
    console.error(`Error copying ${source}: ${err.message}`);
  }
}

// Function to recursively copy a directory
function copyDirectory(source, destination) {
  // Skip if source is the destination or a subdirectory of destination
  if (source === destDir || source.startsWith(destDir + path.sep)) {
    console.log(`Skipping directory: ${source} (it's the destination or a subdirectory)`);
    return;
  }
  
  console.log(`Processing directory: ${source} -> ${destination}`);
  
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  
  // Get all files and directories in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });
  
  // Process each entry
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively copy directory
      copyDirectory(sourcePath, destPath);
    } else {
      // Copy file
      copyFile(sourcePath, destPath);
    }
  }
}

// Main function
function moveFiles() {
  console.log('Moving files from twitch-chatbot to root directory...');
  
  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory ${sourceDir} does not exist.`);
    return;
  }
  
  // Copy all files and directories
  copyDirectory(sourceDir, destDir);
  
  console.log('All files moved successfully!');
  console.log('You can now delete the twitch-chatbot directory if desired.');
}

// Run the script
moveFiles();
