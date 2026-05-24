import { pgTable, uuid, boolean } from "drizzle-orm/pg-core";
import userTable from "./user.schema";
import conversationtable from "./conversation.schema";

const conversationSettingTable = pgTable("Conversation Setting", {
    id: uuid("id").primaryKey().defaultRandom(),
    isMute: boolean("mute").notNull().$default(() => false),
    isBlock: boolean("block").notNull().$default(() => false),
    isFavourite: boolean("favourite").notNull().$default(() => false),
    isArchived: boolean("archived").notNull().$default(() => false),
    userId: uuid("userId").references(() => userTable.id).notNull(),
    conversationId: uuid("conversationId").references(() => conversationtable.id).notNull()
})

export default conversationSettingTable
