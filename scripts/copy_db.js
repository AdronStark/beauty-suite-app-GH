const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'prisma', 'dev.db');
const dest = path.join(__dirname, '.next', 'server', 'chunks', 'prisma', 'dev.db');

// Ensure destination exists (it might not if we are just testing, but in Vercel it should)
// Actually, Prisma Client looks for it relative to the generated client or schema.
// A better approach for Vercel + SQLite is to ensure the file is in the root or accessible.

console.log('Copying DB...');
if (fs.existsSync(src)) {
    console.log('Found source DB:', src);
    // On Vercel, simply having it in the repo is usually enough IF it is tracked.
    // If it is NOT tracked, we can't copy it because it won't be there to copy!
    // So priority #1 is GIT TRACKING.
} else {
    console.error('Source DB NOT found:', src);
}
