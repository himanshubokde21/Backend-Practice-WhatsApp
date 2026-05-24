import {uuid, pgTable, text, timestamp, } from "drizzle-orm/pg-core"
import conversationTable from "./conversation.schema.ts"
import userTable from "./user.schema"

const messageTable = pgTable("Message", {
    id: uuid("id").primaryKey().defaultRandom(),
    content: text("content"),
    mediaUrl: text("media"),
    conversationId: uuid("conversationId").references(() => conversationTable.id).notNull(),
    mediaType: text("type").notNull(),
    senderId: uuid("senderId").references(() => userTable.id).notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().$onUpdate(() => new Date())
})

export default messageTable