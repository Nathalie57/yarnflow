#!/usr/bin/env node

/**
 * PWA Validation Script for YarnFlow
 * Checks that all required PWA assets are present and valid
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_ICONS = [
  'icons/icon-72x72.png',
  'icons/icon-96x96.png',
  'icons/icon-128x128.png',
  'icons/icon-144x144.png',
  'icons/icon-152x152.png',
  'icons/icon-192x192.png',
  'icons/icon-384x384.png',
  'icons/icon-512x512.png',
  'icons/icon-maskable-192x192.png',
  'icons/icon-maskable-512x512.png',
  'icons/shortcut-new.png',
  'icons/shortcut-projects.png',
  'icons/shortcut-ai.png'
];

const PUBLIC_DIR = path.join(__dirname, 'public');

let errors = 0;
let warnings = 0;

console.log('🔍 Validating PWA configuration...\n');

// Check manifest.json
console.log('📄 Checking manifest.json...');
const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('❌ manifest.json not found!');
  errors++;
} else {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // Check required fields
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    requiredFields.forEach(field => {
      if (!manifest[field]) {
        console.error(`❌ Missing required field: ${field}`);
        errors++;
      }
    });

    // Check icons array
    if (manifest.icons && manifest.icons.length < 2) {
      console.warn('⚠️  Manifest should have at least 2 icons (192x192 and 512x512)');
      warnings++;
    }

    console.log('✅ manifest.json is valid');
  } catch (e) {
    console.error('❌ manifest.json is invalid JSON:', e.message);
    errors++;
  }
}

// Check icons
console.log('\n🎨 Checking icons...');
REQUIRED_ICONS.forEach(icon => {
  const iconPath = path.join(PUBLIC_DIR, icon);
  if (!fs.existsSync(iconPath)) {
    console.error(`❌ Missing icon: ${icon}`);
    errors++;
  } else {
    const stats = fs.statSync(iconPath);
    if (stats.size < 100) {
      console.warn(`⚠️  Icon ${icon} seems too small (${stats.size} bytes)`);
      warnings++;
    }
  }
});

if (errors === 0) {
  console.log('✅ All required icons present');
}

// Check service worker config
console.log('\n⚙️  Checking vite.config.js...');
const viteConfigPath = path.join(__dirname, 'vite.config.js');
if (!fs.existsSync(viteConfigPath)) {
  console.error('❌ vite.config.js not found!');
  errors++;
} else {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

  if (!viteConfig.includes('VitePWA')) {
    console.error('❌ VitePWA plugin not configured in vite.config.js');
    errors++;
  } else {
    console.log('✅ VitePWA plugin configured');
  }

  if (!viteConfig.includes('workbox')) {
    console.warn('⚠️  Workbox configuration not found');
    warnings++;
  } else {
    console.log('✅ Workbox caching configured');
  }
}

// Check HTML meta tags
console.log('\n🏷️  Checking index.html...');
const htmlPath = path.join(__dirname, 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('❌ index.html not found!');
  errors++;
} else {
  const html = fs.readFileSync(htmlPath, 'utf8');

  if (!html.includes('rel="manifest"')) {
    console.error('❌ Manifest link tag missing in index.html');
    errors++;
  } else {
    console.log('✅ Manifest link tag present');
  }

  if (!html.includes('name="theme-color"')) {
    console.warn('⚠️  theme-color meta tag missing');
    warnings++;
  } else {
    console.log('✅ Theme color configured');
  }

  if (!html.includes('apple-mobile-web-app')) {
    console.warn('⚠️  Apple PWA meta tags missing');
    warnings++;
  } else {
    console.log('✅ Apple PWA tags present');
  }
}

// Check PWAPrompt component
console.log('\n🔔 Checking PWAPrompt component...');
const promptPath = path.join(__dirname, 'src/components/PWAPrompt.jsx');
if (!fs.existsSync(promptPath)) {
  console.warn('⚠️  PWAPrompt.jsx component not found (install prompts disabled)');
  warnings++;
} else {
  console.log('✅ PWAPrompt component present');
}

// Final summary
console.log('\n' + '='.repeat(50));
if (errors === 0 && warnings === 0) {
  console.log('✅ PWA validation passed! No errors or warnings.');
  console.log('🚀 Your app is ready to be installed as a PWA!');
  process.exit(0);
} else if (errors === 0) {
  console.log(`⚠️  PWA validation passed with ${warnings} warning(s).`);
  console.log('✅ Your app should work as a PWA, but consider fixing warnings.');
  process.exit(0);
} else {
  console.log(`❌ PWA validation failed with ${errors} error(s) and ${warnings} warning(s).`);
  console.log('Please fix the errors before deploying as a PWA.');
  process.exit(1);
}
