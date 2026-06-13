import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import userTable from "./user.schema";
import conversationtable from "./conversation.schema";


const groupTable = pgTable("Group", {
    id: uuid("id").primaryKey().defaultRandom(),
    groupImg: text("groupImg").notNull(),
    groupName: text("groupName").notNull(),
    groupImgId: text("groupImgId").notNull(),
    createdBy: uuid("createdBy").references(() => userTable.id).notNull(),
    conversationId: uuid("conversationId").references(() => conversationtable.id).notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().$onUpdate(() => new Date())
})

export default groupTable