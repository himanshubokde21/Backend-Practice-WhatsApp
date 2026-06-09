import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";


const conversationTable = pgTable("Conversation", {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationType: text("type").notNull(),
    title: text("title").notNull(),
    titleImg: text("titleImg").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().$onUpdate(() => new Date())

})

export default conversationTable