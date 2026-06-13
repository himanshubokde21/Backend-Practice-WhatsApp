import { UploadApiResponse } from "cloudinary"
import messageTable from "./db/schemas/message.schema"
import fileParticipantTable from "./db/schemas/fileParticipant.schema"
import conversationTable from "./db/schemas/conversation.schema"
import conversationParticipantTable from "./db/schemas/conversationPaticipant.schema."

export const MEDIATYPES = Object.freeze({
    FILE: "file",
    IMAGE: "image",
    EMPTY: "empty"
})

export const DELETETYPES = Object.freeze({
    ME: "me",
    EVERYONE: "everyone"
})

export type messageType = Pick<
    typeof messageTable.$inferSelect,
    "id" | "content" | "conversationId" | "createdAt" | "updatedAt" | "userId" 
> 

export type CloudinaryUpload = UploadApiResponse

export type fileType = Pick<
    typeof fileParticipantTable.$inferInsert,
    "id" | "mediaType" | "conversationId" | "mediaId" | "mediaUrl" | "messageId"
>

export const CONVERSATIONTYPES = Object.freeze({
    DIRECT: "direct",
    GROUP: "group"
})

export type conversationType = Pick<
    typeof conversationTable.$inferSelect,
    "id" | "createdAt" | "updatedAt" | "conversationType" 
>

export type conversationParticipantType = Pick<
    typeof conversationParticipantTable.$inferInsert,
    "conversationId" | "id" | "joinedAt" | "role" | "userId"
>