#!/usr/bin/env node

/**
 * Test script to verify the bot builds and can be imported
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 Testing NRGhax Discord Bot Build...\n');

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Check main entry point
const indexPath = path.join(distPath, 'index.js');
if (!fs.existsSync(indexPath)) {
  console.error('❌ Main entry point not found at dist/index.js');
  process.exit(1);
}

// Check command files
const commandsPath = path.join(distPath, 'commands');
const requiredCommands = ['ping.js', 'hack.js'];

for (const cmd of requiredCommands) {
  const cmdPath = path.join(commandsPath, cmd);
  if (!fs.existsSync(cmdPath)) {
    console.error(`❌ Command file not found: ${cmd}`);
    process.exit(1);
  }
  console.log(`✅ Found command: ${cmd}`);
}

// Check service files
const servicesPath = path.join(distPath, 'services');
const requiredServices = ['errorService.js', 'roleSyncService.js'];

for (const service of requiredServices) {
  const servicePath = path.join(servicesPath, service);
  if (!fs.existsSync(servicePath)) {
    console.error(`❌ Service file not found: ${service}`);
    process.exit(1);
  }
  console.log(`✅ Found service: ${service}`);
}

// Try to load the commands to ensure they're valid
try {
  const pingCommand = require(path.join(commandsPath, 'ping.js'));
  console.log('✅ Ping command loaded successfully');
  
  const hackCommand = require(path.join(commandsPath, 'hack.js'));
  console.log('✅ Hack command loaded successfully');
} catch (error) {
  console.error('❌ Error loading commands:', error.message);
  process.exit(1);
}

// Check environment example file
const envExamplePath = path.join(__dirname, '.env.example');
if (!fs.existsSync(envExamplePath)) {
  console.error('❌ .env.example file not found');
  process.exit(1);
}
console.log('✅ Environment example file found');

// Check Docker files
const dockerFiles = ['Dockerfile', 'docker-compose.yml', 'Dockerfile.dev'];
for (const file of dockerFiles) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Docker file not found: ${file}`);
    process.exit(1);
  }
  console.log(`✅ Found Docker file: ${file}`);
}

// Check documentation
const docs = ['README.md', 'SELF_HOSTING.md'];
for (const doc of docs) {
  const docPath = path.join(__dirname, doc);
  if (!fs.existsSync(docPath)) {
    console.error(`❌ Documentation not found: ${doc}`);
    process.exit(1);
  }
  console.log(`✅ Found documentation: ${doc}`);
}

console.log('\n🎉 All checks passed! The bot is ready to deploy.');
console.log('\nNext steps:');
console.log('1. Copy .env.example to .env and fill in your credentials');
console.log('2. Run "npm run deploy-commands" to register slash commands');
console.log('3. Run "npm start" to start the bot');
console.log('\nFor development: "npm run dev"');
console.log('For Docker: "docker-compose up -d"');