const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Configuration
const rootDir = path.join(__dirname, 'frontend', 'src');
const fileExtensions = ['.tsx', '.ts', '.jsx', '.js'];
const apiUrlPattern = /["']http:\/\/localhost:5000\/api\/([^"']+)["']/g;
const importStatement = `import { apiEndpoint } from "@/config";`;
const debugMode = true; // Set to true to see more detailed logs

async function findFiles(dir, fileList = []) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);
    
    if (fileStat.isDirectory()) {
      // Recursively search directories
      fileList = await findFiles(filePath, fileList);
    } else {
      // Check if file has one of the target extensions
      const ext = path.extname(file);
      if (fileExtensions.includes(ext)) {
        fileList.push(filePath);
      }
    }
  }
  
  return fileList;
}

async function updateFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    const originalContent = content;
    
    // Check if file contains API URL pattern
    const hasApiUrl = content.includes('http://localhost:5000/api/');
    
    if (!hasApiUrl) {
      return { filePath, updated: false, message: 'No API URLs found' };
    }
    
    if (debugMode) {
      console.log(`Found API URLs in: ${path.relative(__dirname, filePath)}`);
    }
    
    // Replace API URLs with apiEndpoint calls
    content = content.replace(/["']http:\/\/localhost:5000\/api\/([^"']+)["']/g, (match, endpoint) => {
      if (debugMode) {
        console.log(`  Replacing: ${match} -> apiEndpoint("${endpoint}")`);
      }
      return `apiEndpoint("${endpoint}")`;
    });
    
    // Add import statement if it doesn't exist and if we made changes
    if (content !== originalContent && !content.includes('import { apiEndpoint }')) {
      // Find the last import statement
      const importLines = content.split('\n').filter(line => line.trim().startsWith('import '));
      
      if (importLines.length > 0) {
        // Insert after the last import
        const lastImportIndex = content.lastIndexOf(importLines[importLines.length - 1]);
        const lastImportEndIndex = lastImportIndex + importLines[importLines.length - 1].length;
        
        content = 
          content.substring(0, lastImportEndIndex) + 
          '\n' + importStatement + 
          content.substring(lastImportEndIndex);
        
        if (debugMode) {
          console.log(`  Added import statement after: ${importLines[importLines.length - 1]}`);
        }
      } else {
        // Insert at the beginning of the file
        content = importStatement + '\n\n' + content;
        
        if (debugMode) {
          console.log(`  Added import statement at the beginning of the file`);
        }
      }
    }
    
    // Write the updated content back to the file
    if (content !== originalContent) {
      await writeFile(filePath, content, 'utf8');
      return { filePath, updated: true, message: 'Updated API URLs' };
    }
    
    return { filePath, updated: false, message: 'No changes needed' };
  } catch (error) {
    return { filePath, updated: false, message: `Error: ${error.message}` };
  }
}

async function main() {
  try {
    console.log('Searching for files with API URLs...');
    const files = await findFiles(rootDir);
    console.log(`Found ${files.length} files to check.`);
    
    let updatedCount = 0;
    
    for (const file of files) {
      const result = await updateFile(file);
      
      if (result.updated) {
        updatedCount++;
        console.log(`✅ Updated: ${path.relative(__dirname, result.filePath)}`);
      }
    }
    
    console.log(`\nCompleted! Updated ${updatedCount} files.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
