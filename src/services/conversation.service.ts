import ApiError from "../utils/ApiError.util";
import { CONVERSATIONTYPES } from "../constant";
import db from "../../db";
import conversationTable from "../db/schemas/conversation.schema.ts";
import conversationParticipantTable from "../db/schemas/conversationPaticipant.schema.";
import { and, eq } from "drizzle-orm";
import userTable from "../db/schemas/user.schema.ts";

const conversationService = {
    createConversation : async (userId: string, conversationType: string) => {

        try {
            const res = await db.transaction(async (tx) => {
                const [conversation] = await tx
                .insert(conversationTable)
                .values({
                    conversationType: CONVERSATIONTYPES[conversationType]
                })
                .returning()

                await tx
                .insert(conversationParticipantTable)
                .values({
                    conversationId: conversation.id,
                    role: "owner",
                    userId: userId
                })
                .returning()

                return conversation
            })

            return res

        } catch (error) {
            return error
        }
    },

    addParticipant : async (userId: string, participantId: string, conversationId: string) => {

        try {
        
            const res = await db.transaction(async (tx) => {

                const [userParticipant] = await tx 
                .select()
                .from(conversationParticipantTable)
                .where(
                    and(
                        eq(conversationParticipantTable.conversationId, conversationId),
                        eq(conversationParticipantTable.userId, userId)
                    )
                )

                if (!userParticipant) {
                    throw new ApiError(403, "Forbidden")
                }

                const [participantUser] = await tx
                .select()
                .from(userTable)
                .where(
                    eq(userTable.id, participantId)
                )

                if (!participantUser) {
                    throw new ApiError(409, "User Not Found!")
                }
    
                const [participant] = await tx
                .insert(conversationParticipantTable)
                .values({
                    conversationId: conversationId.trim(),
                    userId: participantId.trim()
                })
                .returning()
    
                return participant
    
            })
    
        } catch (error) {
            return error
        }

    }
}

export default conversationService
