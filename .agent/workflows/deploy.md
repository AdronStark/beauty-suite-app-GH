---
description: How to deploy the application to Vercel
---
1. Run the `prepare-vercel.js` script to generate the Vercel-specific Prisma schema.
2. Commit all changes, including the generated `prisma/schema.postgres.prisma` if it was modified.
3. Push the changes to the `main` branch.
4. Vercel will automatically trigger a deployment.
5. Monitor the deployment in the Vercel dashboard.

**IMPORTANT**: Do NOT auto-run the commit and push steps unless explicitly requested by the USER.
