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

const licenseHeader = `/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

`;

const excludedDirs = ['node_modules', '.next', '.git', 'dist', 'build', 'bundle'];
const includedExtensions = ['.ts', '.tsx', '.js', '.jsx'];

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return includedExtensions.includes(ext);
}

function shouldSkipDirectory(dirName) {
  return excludedDirs.includes(dirName);
}

function addLicenseHeader(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file already has the license header
    if (content.includes('@license') && content.includes('Copyright 2025 Google LLC')) {
      console.log(`Skipping ${filePath} - already has license header`);
      return;
    }
    
    // Add license header at the beginning
    const newContent = licenseHeader + content;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Added license header to ${filePath}`);
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
        if (!shouldSkipDirectory(item)) {
          processDirectory(fullPath);
        }
      } else if (stat.isFile() && shouldProcessFile(fullPath)) {
        addLicenseHeader(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }
}

// Start processing from the project root (parent of scripts directory)
const projectRoot = path.dirname(__dirname);
console.log(`Processing files in ${projectRoot}`);
processDirectory(projectRoot);
console.log('License header addition complete!');