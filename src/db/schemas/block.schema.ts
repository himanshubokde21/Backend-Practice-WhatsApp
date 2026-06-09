import { pgTable } from "drizzle-orm/pg-core";
import { uuid, text, timestamp } from "drizzle-orm/pg-core";
import userTable from "./user.schema";
import conversationtable from "./conversation.schema";


const blockTable = pgTable("Block", {
    id: uuid("id").primaryKey().defaultRandom(),
    blockedUser: uuid("blockedUser").references(() => userTable.id).notNull(),
    conversationId: uuid("conversationId").references(() => conversationtable.id),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date())
})

export default blockTable