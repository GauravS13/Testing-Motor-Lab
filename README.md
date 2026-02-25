This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database Selection

This project supports both **MySQL** and **Microsoft SQL Server (MSSQL)**. To switch between them:

1.  If you haven't already, copy `.env.example` to `.env` and fill in your database credentials.
2.  Open `.env` and set `DB_TYPE` to either `"mysql"` or `"mssql"`.
    - If using `"mssql"`, ensure the `MSSQL_URL` environment variable is defined. SQL Server must be set to **"SQL Server and Windows Authentication mode"** (mixed mode) and you must provide `MSSQL_USER` and `MSSQL_PASSWORD`.
    - If using `"mysql"`, ensure the `DATABASE_URL` environment variable is defined.
3.  Run the following command to synchronize the Prisma schema and regenerate the client:
    ```bash
    pnpm db:switch
    ```

> [!IMPORTANT]
> Failure to run `pnpm db:switch` after changing the `DB_TYPE` will result in a `PrismaClientInitializationError` due to a driver adapter mismatch.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
