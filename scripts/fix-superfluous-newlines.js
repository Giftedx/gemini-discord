/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixSuperfluousNewlines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file has the license header
    if (!content.includes('@license') || !content.includes('Copyright 2025 Google LLC')) {
      return;
    }
    
    // Use a regex to find the license header and what comes after it
    const licensePattern = /(\/\*\*\s*\n\s*\*\s*@license\s*\n\s*\*\s*Copyright\s+2025\s+Google\s+LLC\s*\n\s*\*\s*SPDX-License-Identifier:\s+Apache-2\.0\s*\n\s*\*\/\s*)(.*)/s;
    const match = content.match(licensePattern);
    
    if (!match) {
      return;
    }
    
    const licenseHeader = match[1];
    const afterLicense = match[2];
    
    // Check if there are multiple newlines after the license header
    if (afterLicense.startsWith('\n\n')) {
      // Remove extra newlines, keeping only one
      const trimmedAfterLicense = afterLicense.replace(/^\n+/, '\n');
      
      // Reconstruct the content
      const newContent = licenseHeader + trimmedAfterLicense;
      
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Fixed superfluous newlines in ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        processDirectory(fullPath);
      } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
        fixSuperfluousNewlines(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }
}

// Process only the src directory
const srcPath = path.join(path.dirname(__dirname), 'src');
console.log(`Fixing superfluous newlines in ${srcPath}`);
processDirectory(srcPath);
console.log('Superfluous newlines fix complete!');