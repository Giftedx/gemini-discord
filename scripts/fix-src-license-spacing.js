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

const licenseHeaderEnd = ` * SPDX-License-Identifier: Apache-2.0
 */`;

function fixLicenseSpacing(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file has the license header
    if (!content.includes('@license') || !content.includes('Copyright 2025 Google LLC')) {
      console.log(`Skipping ${filePath} - no license header found`);
      return;
    }
    
    // Find the end of the license header - look for the pattern with space before asterisk
    const licenseEndPattern = / \* SPDX-License-Identifier: Apache-2\.0\s*\n \*\//;
    const match = content.match(licenseEndPattern);
    if (!match) {
      console.log(`Skipping ${filePath} - license header end not found`);
      return;
    }
    
    // Find the position after the license header
    const afterLicenseIndex = match.index + match[0].length;
    const afterLicenseContent = content.substring(afterLicenseIndex);
    
    // Check if there's already a newline after the license header
    if (afterLicenseContent.startsWith('\n')) {
      console.log(`Skipping ${filePath} - already has newline after license header`);
      return; // Already has a newline
    }
    
    // Add a newline after the license header
    const newContent = content.substring(0, afterLicenseIndex) + '\n' + afterLicenseContent;
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed license spacing in ${filePath}`);
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
        console.log(`Processing file: ${fullPath}`);
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