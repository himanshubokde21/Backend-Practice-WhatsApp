import { UploadApiResponse } from "cloudinary"
import messageTable from "./db/schemas/message.schema"
import fileParticipantTable from "./db/schemas/fileParticipant.schema"

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