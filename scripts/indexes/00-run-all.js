// scripts/indexes/00-run-all.js

require('dotenv').config({ path: '../../.env.local' });
const { execSync } = require('child_process');
const path = require('path');

const scripts = [
  '01-ambassador-application-indexes.js',
  '02-announcement-indexes.js',
  '03-contact-submission-indexes.js',
  '04-faq-indexes.js',
  '05-kidprofile-indexes.js',
  '06-lotterycode-indexes.js',
  '07-lotterycodebatch-indexes.js',
  '08-order-indexes.js',
  '09-product-indexes.js',
  '10-productcode-indexes.js',
  '11-review-indexes.js',
  '12-user-indexes.js'
];

console.log('🚀 Starting Index Migration for All Models\n');
console.log('═'.repeat(60));

let successCount = 0;
let failedScripts = [];

for (const script of scripts) {
  const scriptPath = path.join(__dirname, script);
  const modelName = script.replace('-indexes.js', '').replace(/^\d+-/, '');
  
  console.log(`\n📦 Running: ${modelName}...`);
  console.log('─'.repeat(60));
  
  try {
    execSync(`node "${scriptPath}"`, { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    successCount++;
  } catch (error) {
    console.error(`\n❌ Failed: ${script}`);
    failedScripts.push(script);
  }
}

console.log('\n');
console.log('═'.repeat(60));
console.log('📊 MIGRATION SUMMARY');
console.log('═'.repeat(60));
console.log(`✅ Successful: ${successCount}/${scripts.length}`);

if (failedScripts.length > 0) {
  console.log(`❌ Failed: ${failedScripts.length}`);
  console.log('Failed scripts:', failedScripts.join(', '));
  process.exit(1);
} else {
  console.log('🎉 ALL INDEXES CREATED SUCCESSFULLY!');
  console.log('🔐 Your app is now running with secure readWrite permissions!');
  process.exit(0);
}
