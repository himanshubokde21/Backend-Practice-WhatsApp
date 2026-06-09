import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import conversationtable from "./conversation.schema";
import userTable from "./user.schema";

const conversationParticipantTable = pgTable("Conversation Participant", {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversationId").references(() => conversationtable.id).notNull(),
    userId: uuid("userId").references(() => userTable.id).notNull(),
    role: text("role").notNull()
})

export default conversationParticipantTable