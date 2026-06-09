import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import userTable from "./user.schema";
import conversationtable from "./conversation.schema";


const groupTable = pgTable("Group", {
    id: uuid("id").primaryKey().defaultRandom(),
    groupImg: text("groupImg").notNull(),
    groupName: text("groupName").notNull(),
    members: uuid("members").references(() => userTable.id),
    conversationId: uuid("conversationId").references(() => conversationtable.id).notNull(),
})

export default groupTable