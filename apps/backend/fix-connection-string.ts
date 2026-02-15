// Helper script to properly URL-encode the database password

const originalPassword = 'j8mLCQ&Nd5?Jxs#Y';
const encodedPassword = encodeURIComponent(originalPassword);

console.log('🔧 Database Connection String Fix\n');
console.log('Original password:', originalPassword);
console.log('Encoded password:', encodedPassword);
console.log('\n📝 Your corrected DATABASE_URL should be:\n');
console.log(`DATABASE_URL="postgresql://postgres:${encodedPassword}@db.qjwcoifwaklasmfzujeb.supabase.co:5432/postgres"`);
console.log('\n💡 Copy the line above and replace the DATABASE_URL in your .env file');
