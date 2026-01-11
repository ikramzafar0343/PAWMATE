/**
 * Helper script to URL-encode passwords for MongoDB Atlas connection strings
 * 
 * Usage: node scripts/encode-password.js "YourPassword@123#"
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function urlEncodePassword(password) {
  // URL encode special characters
  return encodeURIComponent(password);
}

function showExample() {
  const examples = [
    { original: 'MyP@ss#123', encoded: 'MyP%40ss%23123' },
    { original: 'P@ssw0rd!', encoded: 'P%40ssw0rd%21' },
    { original: 'Test$123', encoded: 'Test%24123' },
    { original: 'Pass&Word', encoded: 'Pass%26Word' },
  ];

  console.log('\n📝 Examples:');
  examples.forEach(ex => {
    console.log(`   Original: ${ex.original}`);
    console.log(`   Encoded:  ${ex.encoded}`);
    console.log(`   Connection string: mongodb+srv://username:${ex.encoded}@cluster.mongodb.net/pawmate`);
    console.log('');
  });
}

if (process.argv[2]) {
  // Password provided as argument
  const password = process.argv[2];
  const encoded = urlEncodePassword(password);
  console.log(`\n✅ URL-Encoded Password:`);
  console.log(`   Original: ${password}`);
  console.log(`   Encoded:  ${encoded}`);
  console.log(`\n📝 Use this in your .env file:`);
  console.log(`   MONGO_URI=mongodb+srv://username:${encoded}@cluster.mongodb.net/pawmate?retryWrites=true&w=majority`);
  process.exit(0);
}

console.log('🔐 MongoDB Atlas Password Encoder');
console.log('================================\n');
console.log('Enter your MongoDB Atlas database password to get the URL-encoded version.');
console.log('(Press Ctrl+C to exit)\n');

showExample();

rl.question('Enter password: ', (password) => {
  if (!password) {
    console.log('❌ No password provided');
    rl.close();
    process.exit(1);
  }

  const encoded = urlEncodePassword(password);
  
  console.log(`\n✅ URL-Encoded Password:`);
  console.log(`   Original: ${password}`);
  console.log(`   Encoded:  ${encoded}`);
  console.log(`\n📝 Use this in your backend/.env file:`);
  console.log(`   MONGO_URI=mongodb+srv://username:${encoded}@cluster.mongodb.net/pawmate?retryWrites=true&w=majority`);
  console.log(`\n⚠️  Remember to replace "username" with your actual database username`);
  console.log(`   and "cluster.mongodb.net" with your actual cluster address.\n`);
  
  rl.close();
  process.exit(0);
});

