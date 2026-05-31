import { pgTable } from "drizzle-orm/pg-core";
import { uuid, text, timestamp } from "drizzle-orm/pg-core";
import userTable from "./user.schema";


const blockTable = pgTable("Block", {
    id: uuid("id").primaryKey().defaultRandom(),
    blockUserByUsername: text("blockUserUsername").references(() => userTable.username),
    blockUserByPhoneNo: text("blockUserPhoneNo").references(() => userTable.phoneNo),
    blockBy: uuid("blockBy").references(() => userTable.id),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date())
})

export default blockTable