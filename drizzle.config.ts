import 'dotenv' 
import { defineConfig } from "drizzle-kit"

export default defineConfig({
    out: './src/db/migrations',
    dialect: 'postgresql',
    schema: './src/db/schemas',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    }

})