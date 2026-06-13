import {
    pgTable,
    uuid,
    timestamp,
    unique,
    text
} from "drizzle-orm/pg-core";
import conversationTable from "./conversation.schema.ts";
import userTable from "./user.schema.ts";

const conversationParticipantTable = pgTable("Conversation Participant",
    {
        id: uuid("id").primaryKey().defaultRandom(),

        conversationId: uuid("conversationId")
            .references(() => conversationTable.id)
            .notNull(),

        userId: uuid("user_id")
            .references(() => userTable.id)
            .notNull(),

        role: text("role")
            .notNull()
            .default("member"),

        joinedAt: timestamp("joined_at")
            .defaultNow()
            .notNull()
})


export default conversationParticipantTable