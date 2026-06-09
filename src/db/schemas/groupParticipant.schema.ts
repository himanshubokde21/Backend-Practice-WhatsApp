import { pgTable, uuid } from "drizzle-orm/pg-core";
import groupTable from "./group.schema";
import userTable from "./user.schema";


const groupParticipantTable = pgTable("Group Participant", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").references(() => userTable.id).notNull(),
    groupId: uuid("groupId").references(() => groupTable.id).notNull(),
})

export default groupParticipantTable