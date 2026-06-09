import {uuid, pgTable, text, timestamp, uniqueIndex} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import conversationTable from "./conversation.schema.ts"
import userTable from "./user.schema"

const messageTable = pgTable("Message", {
    id: uuid("id").primaryKey().defaultRandom(),
    content: text("content"),
    conversationId: uuid("conversationId").references(() => conversationTable.id).notNull(),
    userId: uuid("userId").references(() => userTable.id).notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().$onUpdate(() => new Date())
}, (table) => [
    uniqueIndex("uniqueMessageId").on(sql`lower(${table.id})`),
    uniqueIndex("uniqueUserId").on(sql`lower(${table.userId})`)
])

export default messageTable