import { pgTable, text, uuid, timestamp} from "drizzle-orm/pg-core";
import userTable from "./user.schema.ts";


const contactTable = pgTable("Contact", {
    id: uuid("id").primaryKey().defaultRandom(),
    user: uuid("user").notNull().references(() => userTable.id),
    contactUser: text("contactUSer").references(() => userTable.username),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date())
})

export default contactTable