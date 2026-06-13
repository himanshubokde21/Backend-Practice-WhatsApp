import { FastifyReply, FastifyRequest } from "fastify";
import asyncHandler from "../../utils/asynHandler.util";
import ApiError from "../../utils/ApiError.util";
import { messageType, CONVERSATIONTYPES } from "../../constant";
import db from "../../../db";
import conversationTable from "../../db/schemas/conversation.schema.ts";
import ApiResponse from "../../utils/ApiResponse.util";
import conversationParticipantTable from "../../db/schemas/conversationPaticipant.schema.";
import userTable from "../../db/schemas/user.schema.ts";
import { eq, and } from "drizzle-orm"
import messageTable from "../../db/schemas/message.schema.ts";
import deletedMessage from "../../db/schemas/deletedMessage.schema.ts"
import conversationService from "../../services/conversation.service.ts";


const createConversation = asyncHandler(async (req: FastifyRequest<{
    Body: {
        conversationType: string
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { conversationType } = req.body

    if (!conversationType.trim() || !Object.hasOwn(CONVERSATIONTYPES, conversationType)) {
        throw new ApiError(400, "Bad Request!")
    }

    try {

        const res = conversationService.createConversation(userId, conversationType)

        return rep
        .status(200)
        .send(
            new ApiResponse(200, res, "Conversation Created Successful!")
        )
    } catch (error) {
        req.log.error(error)
        throw error
    }
    
})

const addToConversation = asyncHandler(async (req: FastifyRequest<{
    Params: {
        conversationId: string,
        participantId: string
    },

    Body: {
        conversationType: string,
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { conversationType } = req.body
    const { conversationId, participantId } = req.params

    if (!conversationType || !conversationId.trim() || !participantId.trim()) {
        throw new ApiError(400, "Bad Request!")
    }

    if (conversationType != "group") {
        throw new ApiError(403, "Forbidden!")
    }

    try {
        const res = conversationService.addParticipant(userId, participantId, conversationId)

        return rep
        .status(200)
        .send(
            new ApiResponse(200, res, "Participant Added Successful")
        )
    } catch (error) {
        req.log.error(error)
        throw error
    }

})

const getConversations = asyncHandler(async (req: FastifyRequest, rep: FastifyReply) => {
    const userId = req.user?.id as string

    const conversations = await db
    .select({
        conversationId: conversationParticipantTable.conversationId,
        role: conversationParticipantTable.role
    })
    .from(conversationParticipantTable)
    .where(
        eq(conversationParticipantTable.userId, userId)
    )

    return rep
    .status(200)
    .send(
        new ApiResponse(200, conversations, "Fetched All Conversations Successful!")
    )
})

const getConversationById = asyncHandler(async(req: FastifyRequest<{
    Params: {
        conversationId: string
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { conversationId } = req.params
    
    if (!conversationId.trim()) {
        throw new ApiError(400, "Bad Request!")
    }

    const [conversation] = await db
    .select({
        conversationId: conversationParticipantTable.conversationId,
        userId: conversationParticipantTable.userId,
        role: conversationParticipantTable.role
    })
    .from(conversationParticipantTable)
    .where(
        and(
            eq(conversationParticipantTable.conversationId, conversationId.trim()),
            eq(conversationParticipantTable.userId, userId)
        )
    )

    if (!conversation) {
        throw new ApiError(409, "Conversation Not Found!")
    }

    return rep
    .status(200)
    .send(
        new ApiResponse(200, conversation, "Fetched Conversation Successful!")
    )
})

const deleteConversation = asyncHandler(async (req: FastifyRequest<{
    Params: {
        conversationId: string
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { conversationId } = req.params

    try {
        await db
        .transaction(async (tx) => {

            const [conversation] = await tx
            .select()
            .from(conversationTable)
            .where(
                eq(conversationTable.id, conversationId)
            )

            if (!conversation) {
                throw new ApiError(409, "Conversation Not Found!")
            }

            const [userPaticipant] = await tx
            .select()
            .from(conversationParticipantTable)
            .where(
                and(
                    eq(conversationParticipantTable.conversationId, conversationId),
                    eq(conversationParticipantTable.userId, userId)
                )
            )

            if (userPaticipant.role == "owner") {
                await tx
                .delete(conversationParticipantTable)
                .where(
                    eq(conversationParticipantTable.conversationId, conversationId)
                )

                await tx
                .delete(conversationTable)
                .where(
                    eq(conversationTable.id, conversationId)
                )
            }
            else {
                await tx
                .delete(conversationParticipantTable)
                .where(
                    and(
                        eq(conversationParticipantTable.userId, userId),
                        eq(conversationParticipantTable.conversationId, conversationId)
                    )
                )

                const conversationSize = await tx
                .select()
                .from(conversationParticipantTable)
                .where(
                        eq(conversationParticipantTable.conversationId, conversationId)
                )

                if (conversationSize.length == 0) {
                    await tx
                    .delete(conversationTable)
                    .where(
                        eq(conversationTable.id, conversationId)
                    )
                } 
            }
        })

        return rep
        .status(200)
        .send(
            new ApiResponse(200, {}, "Conversation Deleted Successful!")
        )
    }

    catch (err) {
        req.log.error(err)
        throw err
    }

})

const clearConversation = asyncHandler(async (req: FastifyRequest<{
    Params: {
        conversationId: string
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { conversationId } = req.params

    if (!conversationId.trim()) {
        throw new ApiError(400, "Bad Request!")
    }

    try {
        
        await db.transaction(async (tx) => {

            const [conversation] = await tx
            .select()
            .from(conversationTable)
            .where(
                eq(conversationTable.id, conversationId)
            )

            if (!conversation) {
                throw new ApiError(403, "Forbiden!")
            }

            const [userParticipant] = await tx 
            .select()
            .from(conversationParticipantTable)
            .where(
                and(
                    eq(conversationParticipantTable.conversationId, conversationId),
                    eq(conversationParticipantTable.userId, userId)
                )
            )

            if (userParticipant.role == "owner") {
                await tx
                .delete(messageTable)
                .where(
                    eq(messageTable.conversationId, conversationId)
                )
            }

            else {
                const messages = await tx
                .select()
                .from(messageTable)
                .where(
                    eq(messageTable.conversationId, conversationId)
                )

                await tx
                .insert(deletedMessage)
                .values(
                    messages.map((msg: messageType) => ({
                        messageId: msg.id,
                        userId: userId
                    }))
                )
            }
    
        }) 

        return rep
        .status(200)
        .send(
            new ApiResponse(200, {}, "Cleared Conversation Successful!")
        )
    } catch (error) {
        req.log.error(error)
        throw error
    }

})

export {
    createConversation,
    addToConversation,
    getConversations,
    getConversationById,
    deleteConversation,
    clearConversation,
}