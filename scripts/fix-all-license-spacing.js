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

function fixLicenseSpacing(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file has the license header
    if (!content.includes('@license') || !content.includes('Copyright 2025 Google LLC')) {
      return;
    }
    
    // Find the license header end pattern
    const licenseEndPattern = / \* SPDX-License-Identifier: Apache-2\.0\s*\n \*\//;
    const match = content.match(licenseEndPattern);
    if (!match) {
      return;
    }
    
    // Find the position after the license header
    const afterLicenseIndex = match.index + match[0].length;
    const afterLicenseContent = content.substring(afterLicenseIndex);
    
    // Check if there's already exactly one newline after the license header
    if (afterLicenseContent.startsWith('\n') && !afterLicenseContent.startsWith('\n\n')) {
      return; // Already has exactly one newline
    }
    
    // Remove any existing newlines and add exactly one
    const trimmedAfterLicense = afterLicenseContent.replace(/^\s*\n*\s*/, '\n');
    
    // Reconstruct the content
    const newContent = content.substring(0, afterLicenseIndex) + trimmedAfterLicense;
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Fixed license spacing in ${filePath}`);
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
        fixLicenseSpacing(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }
}

// Process only the src directory
const srcPath = path.join(path.dirname(__dirname), 'src');
console.log(`Fixing license spacing in ${srcPath}`);
processDirectory(srcPath);
console.log('License spacing fix complete!');