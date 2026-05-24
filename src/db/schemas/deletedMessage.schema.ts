import { uuid, timestamp, pgTable } from "drizzle-orm/pg-core"
import messageTable from "./message.schema"
import userTable from "./user.schema"

const deletedMessageTable = pgTable("Deleted Message", {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("messageId").references(() => messageTable.id).notNull(),
    userId: uuid("userId").references(() => userTable.id).notNull(),
    deletedAt: timestamp("deletedAt").notNull().defaultNow()
})

export default deletedMessageTable