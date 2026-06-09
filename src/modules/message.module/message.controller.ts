import asyncHandler from "../../utils/asynHandler.util.ts";
import type { FastifyRequest, FastifyReply } from "fastify";
import ApiError from "../../utils/ApiError.util.ts";
import db from "../../../db.ts";
import localUpload from "../../utils/localUpload.util.ts";
import messageTable from "../../db/schemas/message.schema.ts"
import { MEDIATYPES, DELETETYPES } from "../../constant.ts";
import fileParticipantTable from "../../db/schemas/fileParticipant.schema.ts";
import ApiResponse from "../../utils/ApiResponse.util.ts"
import blockTable from "../../db/schemas/block.schema.ts"
import { eq, and, isNull, sql, or } from "drizzle-orm";
import conversationParticipantTable from "../../db/schemas/conversationPaticipant.schema..ts"
import type { messageType, CloudinaryUpload, fileType } from "../../constant.ts";
import { uploadOnCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.util.ts"
import conversationTable from "../../db/schemas/conversation.schema.ts";
import deletedMessageTable from "../../db/schemas/deletedMessage.schema.ts";

const sendMessage = asyncHandler(async (req: FastifyRequest<{
    Params: {
        conversationId: string,
        mediaType: string
    }
}>, rep: FastifyReply) => {

    const userId = req.user?.id as string
    let content: string = ""
    let mediaPaths: string[] = []
    const { conversationId, mediaType } = req.params

    if (!conversationId.trim() || !mediaType.trim() || !(mediaType in MEDIATYPES)) {
        throw new ApiError(400, "Bad Request!")
    }

    const [conversation] = await db
    .select()
    .from(conversationTable)
    .where(
        eq(conversationTable.id, conversationId)
    )

    if (!conversation) {
        throw new ApiError(500, "Forbidden!")
    }

    const [user] = await db
    .select({
        userId: conversationParticipantTable.userId,
        role: conversationParticipantTable.role,
    })
    .from(conversationParticipantTable)
    .where(
        and(
            eq(conversationParticipantTable.conversationId, conversationId),
            eq(conversationParticipantTable.userId, userId)
        )
    )

    if (!user) {
        throw new ApiError(403, "Forbidden!")
    }

    const [isBlock] = await db
        .select()
        .from(blockTable)
        .innerJoin(
            conversationTable,
            eq(conversationTable.id, blockTable.conversationId)
        )
        .where(
            and(
                eq(blockTable.blockedUser, userId),
                eq(blockTable.conversationId, conversationId),
                eq(conversationTable.conversationType, "direct")
            )
        )

    if (isBlock) {
        throw new ApiError(403, "Forbidden!")
    }


    for await (const part of req.parts()) {

        if (part.type === "file") {

            if (MEDIATYPES[mediaType] == "empty") continue

            const localPath = await localUpload(part) as string
            mediaPaths.push(localPath)
        }

        else if (part.type === "field") {
            content = part.value as string
        }
    }

    if (mediaPaths.length > 0 && mediaPaths?.every((ele) => ele.trim() === "")) {
        throw new ApiError(400, "Bad Request!")
    }

    if (content.trim() == "" && mediaPaths.length == 0) {
        throw new ApiError(400, "Bad Request!")
    }

    let files: string[] = []
    let message: messageType | undefined

    const mediaUrls: CloudinaryUpload[] = (await Promise.all(mediaPaths.map(media => uploadOnCloudinary(media)))).filter(Boolean) as CloudinaryUpload[]

    try {
        await db
        .transaction(async (tx) => {
    
            [message] = await tx
            .insert(messageTable)
            .values({
                content: content,
                conversationId: conversationId,
                userId: userId
            })
            .returning();
    
            if (!message) {
                throw new ApiError(500, "Internal Server Error!")
            }
            
            const messageId = message.id
    
            if (mediaUrls.length > 0) {
    
                const insertedFiles = await tx
                .insert(fileParticipantTable)
                .values(
                    mediaUrls.map(
                        (media: CloudinaryUpload) => 
                            ({
                                mediaUrl: media.url, 
                                mediaId: media.public_id,
                                mediaType: MEDIATYPES[mediaType], 
                                conversationId: conversationId, 
                                messageId: messageId
                            }))
                )
                .returning({id: fileParticipantTable.id})
    
                files = insertedFiles.map(file => file.id)
            }
        })
    } catch (error) {
        await Promise.all(
            mediaUrls.map((media: CloudinaryUpload) => deleteFromCloudinary(media?.public_id))
        )

        throw new ApiError(500, "Internal Server Error!")
    }

    const replyBody = {messageId: message?.id, content: message?.content, mediaType: mediaType, media: files, senderId: user.userId, conversationId: conversation.id}

    return rep
    .status(200)
    .send(
        new ApiResponse(200, replyBody, "Message Send Successful!")
    )

})

const deleteMessage = asyncHandler(async (req: FastifyRequest<{
    Params:{ 
    conversationId: string,
    messageId: string,
    deleteType: string
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { conversationId, messageId, deleteType } = req.params

    const fields = [conversationId, messageId, deleteType]

    if (!fields.every((ele: string) => ele?.trim())) {
        throw new ApiError(400, "Bad Request!")
    }

    const [message] = await db
    .select()
    .from(messageTable)
    .where(
        and(
            eq(messageTable.id, messageId),
            eq(messageTable.conversationId, conversationId)
        )
    )

    if (!message) {
        throw new ApiError(404, "Resource Not Found!")
    }

    const [user] = await db
    .select()
    .from(conversationParticipantTable)
    .where(
        and(
            eq(conversationParticipantTable.userId, userId),
            eq(conversationParticipantTable.conversationId, conversationId)
        )
    )

    if (!user) {
        throw new ApiError(403, "Forbidden!")
    }

    if (!(deleteType in DELETETYPES)) {
        throw new ApiError(400, "Bad Request!")
    }

    if (message.userId != user.userId && DELETETYPES[deleteType] == "everyone") {
        throw new ApiError(403, "Forbidden!")
    }

    else if (DELETETYPES[deleteType] == "me") {
        
        const [deleteMessage] = await db
        .insert(deletedMessageTable) 
        .values({
            messageId: message.id,
            userId: user.userId
        })
        .returning()

        if (!deleteMessage) {
            throw new ApiError(409, "Conflict!")
        }
    }


    else if (message.userId == user.userId && DELETETYPES[deleteType] == "everyone") {
        const mediaUrls = await db
        .select()
        .from(fileParticipantTable)
        .where(
            and(
                eq(fileParticipantTable.messageId, message.id),
                eq(fileParticipantTable.conversationId, user.conversationId)
            )
        )

        try {
            
            await Promise.all(mediaUrls.map((media) => deleteFromCloudinary(media.mediaId)))

            await db.transaction(async (tx) => {
                
                const [deleteMedia] = await tx
                .delete(fileParticipantTable)
                .where(
                    and(
                        eq(fileParticipantTable.conversationId, conversationId),
                        eq(fileParticipantTable.messageId, messageId)
                    )
                )
                .returning()
                
                if (!deleteMedia) {
                    throw new ApiError(500, "Internal Server Error!")
                }
                const [deleteMessage] = await tx
                .delete(messageTable)
                .where(
                    and(
                        eq(messageTable.id, messageId),
                        eq(messageTable.userId, user.userId)
                    )
                )
                .returning()
                
                if (!deleteMessage) {
                    throw new ApiError(500, "Internal Server Error!")
                }
        })
        } catch (error) {
            throw new ApiError(500, "Internal Server Error!")
        }

    }

    return rep
    .status(200)
    .send(
        new ApiResponse(200, {}, "Message Deleted Successful!")
    )

})

const seeMessages = asyncHandler(async (req: FastifyRequest<{
    Params: {
        conversationId: string,
    },
    Querystring: {
        page: number,
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { conversationId } = req.params
    const { page } = req.query
    
    if (!conversationId.trim()) {
        throw new ApiError(400, "Bad Request!")
    }

    const [participant] = await db
    .select()
    .from(conversationParticipantTable)
    .where(
        and(
            eq(conversationParticipantTable.conversationId, conversationId),
            eq(conversationParticipantTable.userId, userId)
        )
    )

    if(!participant) {
        throw new ApiError(403, "Forbidden!")
    }

    const offset = ((page-1) * 10)

    const allMessages = await db
    .select({
        id: messageTable.id,
        createdAt: messageTable.createdAt,
        updatedAt: messageTable.updatedAt,
        content: messageTable.content,
        user: messageTable.userId,
        role: sql<string>`
            SELECT ${conversationParticipantTable.role} 
            FROM ${conversationParticipantTable}
            WHERE ${conversationParticipantTable.conversationId} = ${conversationId}
            AND ${conversationParticipantTable.userId} = ${messageTable.userId}
        `,
        files: sql`
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', ${fileParticipantTable.id},
                        'mediaUrl', ${fileParticipantTable.mediaUrl},
                        'mediaType', ${fileParticipantTable.mediaType},
                    )
                ) FILTER (WHERE ${fileParticipantTable.id} IS NOT NULL),
                '[]'
            )
        `.as("files")
    })
    .from(messageTable)
    .leftJoin(
        deletedMessageTable,
        and(
            eq(deletedMessageTable.messageId, messageTable.id),
            eq(deletedMessageTable.userId, userId)
        )
    )
    .leftJoin(
        fileParticipantTable,
        eq(fileParticipantTable.messageId, messageTable.id)
    )
    .where(
        and(
            eq(messageTable.conversationId, conversationId),
            isNull(deletedMessageTable.id)
        )
    )
    .orderBy(messageTable.createdAt)
    .offset(offset)
    .limit(10)

    return rep
    .status(200)
    .send(
        new ApiResponse(200, allMessages, "Fetched All Messages Successful!")
    )

})

const editMessage = asyncHandler(async (req: FastifyRequest<{
    Params: {
        messageId: string,
        conversationId: string,
    },
    Body: {
        newContent: string,
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { conversationId, messageId } = req.params
    const { newContent } = req.body

    if (!conversationId.trim() || !messageId.trim() || !newContent.trim()) {
        throw new ApiError(400, "Bad Request!")
    }

    const [participant] = await db
    .select()
    .from(conversationParticipantTable)
    .where(
        and(
            eq(conversationParticipantTable.conversationId, conversationId),
            eq(conversationParticipantTable.userId, userId)
        )
    )

    if (!participant) {
     throw new ApiError(403, "Forbidden!")   
    }

    const [message] = await db
    .update(messageTable)
    .set({   
        content: newContent,
    })
    .where(
        and(
            eq(messageTable.id, messageId),
            eq(messageTable.userId, userId)
        )
    )
    .returning({
        id: messageTable.id,
        user: messageTable.userId,
        updatedAt: messageTable.updatedAt,
        conversationId: messageTable.conversationId,
        createdAt: messageTable.createdAt,
        role: sql<string>`(
            SELECT role FROM ${conversationParticipantTable}
            WHERE ${conversationParticipantTable.conversationId} = ${conversationId}
            AND ${conversationParticipantTable.userId} = ${userId}
        )`,
        files: sql`(
            SELECT COALESCE(
                json_agg(
                    json_build_object(
                        'id', ${fileParticipantTable.id},
                        'mediaType', ${fileParticipantTable.mediaType},
                        'mediaUrl', ${fileParticipantTable.mediaUrl}  
                    )
                ) FILTER ( WHERE ${fileParticipantTable.id} IS NOT NULL ),
                '[]'::json
                )
            FROM ${fileParticipantTable}
            WHERE ${fileParticipantTable.conversationId} = ${conversationId}
            AND ${fileParticipantTable.messageId} = ${messageId}
        )`.as ("files")
    })

    if(!message) {
        throw new ApiError(403, "Forbidden!")
    }

    return rep
    .status(200)
    .send(
        new ApiResponse(200, message, "Message Edited Successful!")
    )

})

const replyMessage = asyncHandler(async (req: FastifyRequest<{
    Params: {
        conversationId: string,
        messageId: string,
        mediaType: string,
    }
}>,  rep: FastifyReply) => {

    const userId = req.user?.id as string
    let content: string = ""
    let mediaPaths: string[] = []
    const { messageId, conversationId, mediaType } = req.params

    for await (const part of req.parts()) {
        if (part?.type == "field") {
            content = part.value as string || ""
        } 
        else if (part?.type == "file") {
            const path = await localUpload(part)

            if (!path) {
                throw new ApiError(400, "Bad Request!")
            }

            mediaPaths.push(path)
        } 
    }

    if (!messageId || !conversationId || !Object.hasOwn(MEDIATYPES, mediaType)) {
        throw new ApiError(400, "Bad Request!")
    }

    if (!content.trim() && mediaPaths.length == 0) {
        throw new ApiError(400, "Bad Request!")
    }

    const [participant] = await db
    .select()
    .from(conversationParticipantTable)
    .where(
        and(
            eq(conversationParticipantTable.conversationId, conversationId),
            eq(conversationParticipantTable.userId, userId)
        )
    )

    if (!participant) {
        throw new ApiError(403, "Forbidden!")
    }

    const [isBlock] = await db
    .select()
    .from(blockTable)
    .innerJoin(conversationTable,
        eq(conversationTable.id, conversationId)
    )
    .where(
        and(
            eq(blockTable.conversationId, conversationId),
            eq(blockTable.blockedUser, userId),
            eq(conversationTable.conversationType, "direct")
        )
    )

    if (isBlock) {
        throw new ApiError(403, "Forbidden!")
    }

    const [selectedMessage] = await db
    .select({
        id: messageTable.id,
        user: messageTable.userId,
        createdAt: messageTable.createdAt,
        updatedAt: messageTable.updatedAt,
        conversationId: messageTable.conversationId,
        content: messageTable.content,
        files: sql`
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', ${fileParticipantTable.id},
                        'mediaType', ${fileParticipantTable.mediaType},
                        'mediaUrl', ${fileParticipantTable.mediaUrl}
                    )
                ) FILTER (WHERE ${fileParticipantTable.id} IS NOT NULL),
                '[]'
            )
        `.as("files")
    })
    .from(messageTable)
    .leftJoin(
        fileParticipantTable,
        and(
            eq(fileParticipantTable.conversationId, conversationId),
            eq(fileParticipantTable.messageId, messageId)
        )
    )
    .where(
        and(
            eq(messageTable.conversationId, conversationId),
            eq(messageTable.id, messageId)
        )
    )

    if (!selectedMessage) {
        throw new ApiError(409, "Conflict!")
    }

    let repliedMessage: messageType | undefined
    let files: string[] = []

    try {

        const mediaUrls: CloudinaryUpload[] = await Promise.all(mediaPaths.map((path) => uploadOnCloudinary(path))) as CloudinaryUpload[]

        await db
        .transaction(async (tx) => {

            [repliedMessage] = await tx
            .insert(messageTable)
            .values({
                content: content,
                conversationId: conversationId,
                userId: userId
            })
            .returning()

            if (!repliedMessage) {
                throw new ApiError(500, "Internal Server Error!")
            }

            if (mediaUrls.length > 0) {

                const repliedMessageId = repliedMessage.id

                const insertedFile = await tx
                .insert(fileParticipantTable)
                .values(
                    mediaUrls.map((media: CloudinaryUpload) => ({
                        mediaUrl: media.url,
                        mediaType: MEDIATYPES[mediaType],
                        mediaId: media.public_id,
                        conversationId: conversationId,
                        messageId: repliedMessageId
                    }))
                )
                .returning({id: fileParticipantTable.id})

                files = insertedFile.map((file) => file.id)
            }
        })
    } catch (error) {
        throw new ApiError(500, "Internal Server Error!")
    }

    return rep
    .status(200)
    .send(
        new ApiResponse(
            200, 
            {
                selectedMessage: selectedMessage,
                repliedMessage: { 
                    message: repliedMessage,
                    files: files
                }
            },
            "Replied To Message Successful!"
        )
    )

})

const forwardMessage = asyncHandler(async (req: FastifyRequest<{
    Params: {
        messageId: string
        firstConversationId: string
        secondConversationId: string
    }
}>,
    rep: FastifyReply) => {
    
    const userId = req.user?.id as string

    const { messageId, firstConversationId, secondConversationId  } = req.params

    if (!messageId?.trim() || !firstConversationId?.trim() || !secondConversationId?.trim()) {
        throw new ApiError(400, "Bad Request!")
    }

    if (firstConversationId === secondConversationId) {
        throw new ApiError(400, "Cannot forward message to same conversation!")
    }

    const participants = await db
    .select({
        conversationId:
        conversationParticipantTable.conversationId
    })
    .from(conversationParticipantTable)
    .where(
        and(
            eq(conversationParticipantTable.userId, userId),
            or(
                eq(conversationParticipantTable.conversationId, firstConversationId),
                eq(conversationParticipantTable.conversationId, secondConversationId)
            )
        )
    )

    if (participants.length !== 2) {
        throw new ApiError(403, "Forbidden!")
    }

    const [sourceMessage] = await db
    .select()
    .from(messageTable)
    .where(
        and(
            eq(messageTable.id, messageId),
            eq(messageTable.conversationId, firstConversationId)
        )
    )

    if (!sourceMessage) {
        throw new ApiError(404, "Message Not Found!")
    }

    const sourceFiles = await db
    .select()
    .from(fileParticipantTable)
    .where(
        and(
            eq(fileParticipantTable.messageId, messageId),
            eq(fileParticipantTable.conversationId, firstConversationId)
        )
    )

    try {

        const result = await db.transaction(async (tx) => {

            const [forwardedMessage] = await tx
            .insert(messageTable)
            .values({
                content: sourceMessage.content ?? "",
                userId,
                conversationId:
                secondConversationId,
            })
            .returning()

            if (!forwardedMessage) {
                throw new ApiError(500, "Failed to forward message!")
            }

            let forwardedFiles: fileType[] = []

            if (sourceFiles.length > 0) {

                forwardedFiles = await tx
                .insert(fileParticipantTable)
                .values(
                    sourceFiles.map((file) => ({
                        mediaId: file.mediaId,
                        mediaUrl: file.mediaUrl,
                        mediaType: file.mediaType,
                        conversationId:secondConversationId,

                        messageId:
                        forwardedMessage.id
                    }))
                )
                .returning()
            }

            return {
                message: forwardedMessage,
                files: forwardedFiles
            }
        })

        return rep
        .status(200)
        .send(
            new ApiResponse(200, result, "Message Forwarded Successful!")
        )

    } catch (error) {
        if (error instanceof ApiError) {
            throw error
        }

        req.log.error(error)

        throw new ApiError(500, "Internal Server Error!")
    }
})

export {
    sendMessage,
    deleteMessage,
    seeMessages,
    editMessage,
    replyMessage,
    forwardMessage,
}