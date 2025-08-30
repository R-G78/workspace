# Environment Setup

This application requires proper environment configuration to work correctly. Make sure you have:

1. Created a `.env` file in the root directory
2. Added the required `DATABASE_URL` for Prisma:

```bash
DATABASE_URL="mysql://user:password@host:port/database"
```

If you're seeing 500 errors from the API endpoints, check:

1. Your `.env` file exists and contains `DATABASE_URL`
2. The database is accessible
3. You've run `prisma generate` after any schema changes
4. The database schema matches `prisma/schema.prisma`

## Development Quick Start

1. Copy `.env.example` to `.env`
2. Fill in your database credentials in `DATABASE_URL`
3. Run:
   ```bash
   pnpm install
   pnpm prisma generate
   pnpm dev
   ```

## API Endpoints

The application uses serverless API endpoints:

- `/api/patients` - Patient management (GET, POST, PUT)
- `/api/triage` - Triage management (GET, POST)

All endpoints require a valid `DATABASE_URL` environment variable.
