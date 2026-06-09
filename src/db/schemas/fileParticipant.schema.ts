import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import conversationtable from "./conversation.schema";
import messageTable from "./message.schema";

const fileParticipantTable = pgTable("fileParticipant", {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversationId").references(() => conversationtable.id).notNull(),
    messageId: uuid("messageId").references(() => messageTable.id).notNull(),
    mediaUrl: text("media").notNull(),
    mediaType: text("type").notNull(),
    mediaId: text("mediaId").notNull()
})

export default fileParticipantTable