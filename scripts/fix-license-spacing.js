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

const excludedDirs = ['node_modules', '.next', '.git', 'dist', 'build', 'bundle'];
const includedExtensions = ['.ts', '.tsx', '.js', '.jsx'];

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return includedExtensions.includes(ext);
}

function shouldSkipDirectory(dirName) {
  return excludedDirs.includes(dirName);
}

function fixLicenseSpacing(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file has the license header
    if (!content.includes('@license') || !content.includes('Copyright 2025 Google LLC')) {
      return;
    }
    
    // Find the end of the license header
    const licenseEndIndex = content.indexOf(licenseHeaderEnd);
    if (licenseEndIndex === -1) {
      return;
    }
    
    // Find the position after the license header
    const afterLicenseIndex = licenseEndIndex + licenseHeaderEnd.length;
    const afterLicenseContent = content.substring(afterLicenseIndex);
    
    // Ensure there's exactly one new line after the license header
    // Remove all leading whitespace and newlines, then add exactly one newline
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
        if (!shouldSkipDirectory(item)) {
          processDirectory(fullPath);
        }
      } else if (stat.isFile() && shouldProcessFile(fullPath)) {
        fixLicenseSpacing(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }
}

// Start processing from the project root (parent of scripts directory)
const projectRoot = path.dirname(__dirname);
console.log(`Fixing license spacing in ${projectRoot}`);
processDirectory(projectRoot);
console.log('License spacing fix complete!');