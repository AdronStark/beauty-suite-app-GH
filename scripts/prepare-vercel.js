const fs = require('fs');
const { execSync } = require('child_process');

if (process.env.VERCEL) {
    console.log('🚀 Detected Vercel environment. Switching to Postgres schema...');

    // 1. Swap Schema
    try {
        fs.copyFileSync('prisma/schema.postgres.prisma', 'prisma/schema.prisma');
        console.log('✅ Schema swapped to Postgres.');
    } catch (err) {
        console.error('❌ Failed to swap schema:', err);
        process.exit(1);
    }

    // 2. Generate Client
    console.log('🔄 Generating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // 3. Push DB Schema (Safe-ish for dev/initial setup, accepts data loss if schema changed drastically)
    // Warning: In critical prod, we should use migrations. For this app stage, push is perfect.
    console.log('📤 Pushing DB Schema to Neon...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });

} else {
    console.log('💻 Local environment detected. Skipping Postgres setup.');
    // Standard generation for local SQLite
    execSync('npx prisma generate', { stdio: 'inherit' });
}
