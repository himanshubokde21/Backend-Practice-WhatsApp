import {uuid, pgTable, text, timestamp, } from "drizzle-orm/pg-core"

const userTable = pgTable("User", {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull(),
    phoneNo: text("phoneNo").notNull(),
    email: text("email").notNull(),
    tag: text("tag"),
    password: text("password").notNull(),
    profileImg: text("profileImg").notNull(),
    profileImgId: text("prifileImgId").notNull(),
    refreshToken: text(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().$onUpdate(() => new Date())
})

export default userTable