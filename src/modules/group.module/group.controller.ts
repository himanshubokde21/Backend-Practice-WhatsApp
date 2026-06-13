import db from "../../../db";
import conversationParticipantTable from "../../db/schemas/conversationPaticipant.schema.";
import ApiError from "../../utils/ApiError.util";
import asyncHandler from "../../utils/asynHandler.util";
import { FastifyReply, FastifyRequest } from "fastify";
import { eq, and, inArray, or } from "drizzle-orm"
import groupTable from "../../db/schemas/group.schema";
import ApiResponse from "../../utils/ApiResponse.util";
import conversationService from "../../services/conversation.service.ts";
import localUpload from "../../utils/localUpload.util.ts";
import { deleteFromCloudinary, uploadOnCloudinary } from "../../utils/cloudinary.util.ts";
import { UploadApiResponse } from "cloudinary";
import { conversationParticipantType, conversationType } from "../../constant.ts";
import { validationService } from "../../services/validation.service.ts";
import IsStringArray from "../../utils/IsStringArray.util.ts";

const createGroup = asyncHandler(async (req: FastifyRequest<{
    Body: {
        members: string[],
        groupImg: string,
        groupName: string,
    }
}>, rep: FastifyReply) => {

    const userId = req.user?.id as string
    let fields: Record<string, string | string[]> = {}
    let localpath: string = ""

    for await (const part of req.parts()) {

        if (part?.type == "field") {

            if (!part.value && !IsStringArray(part.value as string[])) {
                throw new ApiError(400, "Bad Request")
            }

            if (IsStringArray(part.value as string[])) {
                fields[part.fieldname] = part.value as string[]
            }

            else {
                fields[part.fieldname] = part.value as string
            }
            
        }

        else if (part?.type == "file") {

            if (!part.filename) {
                throw new ApiError(400, "Bad Request!")
            }

            const [_, media] = await Promise.all([
                localpath = await localUpload(part) as string,
                uploadOnCloudinary(localpath) 
            ])

            fields[part.fieldname] = media?.url as string
            fields[part.fieldname + "Id"] = media?.public_id as string
        }
    }

    try {
        
        const conversation = await conversationService.createConversation(userId, fields.conversationType as string) as conversationType

        const [group] = await db
        .insert(groupTable)
        .values({
            createdBy: userId,
            conversationId: conversation.id,
            groupImg: fields.groupImg as string,
            groupImgId: fields.groupImgId as string,
            groupName: fields.groupName as string,
        })
        .returning()

        if (!group) {
            throw new ApiError(500, "Internal Server Error!")
        }

        const participants = (fields.members as string[]).map((member) => {
            conversationService.addParticipant(userId, member, conversation.id)
        })

        return rep
        .status(200)
        .send(
            new ApiResponse(200, {Group: group, Participants: participants}, "Group Created Successful!")
        )

    } catch (error) {
        req.log.error(error)
        throw error
    }

})

const updateGroupTitle = asyncHandler(async (req: FastifyRequest<{
    Params: {
        conversationId: string,
        groupId: string,
    },
    Body: {
        newGroupName: string
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { conversationId, groupId } = req.params
    const { newGroupName } = req.body

    if (!conversationId.trim() || !groupId.trim() || !newGroupName) {
        throw new ApiError(403, "Bad Request!")
    }

    try {
        
        const res = await db
        .transaction(async (tx) => {

            const [userPArticipant] = await tx
            .select()
            .from(conversationParticipantTable)
            .where(
                and(
                    eq(conversationParticipantTable.userId, userId),
                    eq(conversationParticipantTable.conversationId, conversationId)
                )
            )

            if (!userPArticipant || userPArticipant.role != "owner") {
                throw new ApiError(403, "Forbidden")
            }

            const [updatedGroup] = await tx
            .update(groupTable)
            .set({
                groupName: newGroupName
            })
            .where(
                and(
                    eq(groupTable.id, groupId),
                    eq(groupTable.conversationId, conversationId)
                )
            )
            .returning()

            if (!updatedGroup) {
                throw new ApiError(500, "Internal Server Error!")
            }

            return updatedGroup

        }) 

        return rep
        .status(200)
        .send(
            new ApiResponse(200, res, "Group Details Updated")
        )

    } catch (error) {
        req.log.error(error)
        throw error
    }
})

const updateGroupImg = asyncHandler(async (req: FastifyRequest<{
    Body: {
        newGroupImg: string
    },
    Params: {
        conversationId: string,
        groupId: string,
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { newGroupImg } = req.body
    const { conversationId, groupId } = req.params
    let media: UploadApiResponse | null = null

    if (!newGroupImg.trim() || !conversationId.trim() || !groupId) {
        throw new ApiError(400, "Bad Request!")
    }

    try {
        media = await Promise.resolve(uploadOnCloudinary(newGroupImg)) as UploadApiResponse

        const res = await db
        .transaction(async (tx) => {
            const [participant] = await tx
            .select()
            .from(conversationParticipantTable)
            .where(
                and(
                    eq(conversationParticipantTable.userId, userId),
                    eq(conversationParticipantTable.conversationId, conversationId)
                )
            )

            if (!participant || participant.role != "onwer") {
                throw new ApiError(403, "Forbidden!")
            }

            const [group] = await tx
            .select()
            .from(groupTable)
            .where(
                and(
                    eq(groupTable.conversationId, conversationId),
                    eq(groupTable.id, groupId)
                )
            )

            if (!group) {
                throw new ApiError(409, "Group Not Found!")
            }

            const oldGroupImgId = group.groupImgId

            const [updatedGroupDetails] = await tx
            .update(groupTable)
            .set({
                groupImg: media?.url,
                groupImgId: media?.public_id
            })
            .returning()

            if (!updatedGroupDetails) {
                throw new ApiError(500, "Internal Server Error!")
            }

            await deleteFromCloudinary(oldGroupImgId)
            return updatedGroupDetails
        })

        return rep
        .status(200)
        .send(
            new ApiResponse(200, res, "Updated Group Details!")
        )

    } catch (error) {
        await deleteFromCloudinary(media?.public_id as string)
        req.log.error(error)
        throw error
    }
})

const addParticipant = asyncHandler(async (req: FastifyRequest<{
    Params: {
        conversationId: string,
        groupId: string,
    },
    Body: {
        participantId: string,
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const {participantId} = req.body
    const { conversationId, groupId } = req.params

    if (!participantId.trim() || !conversationId.trim() || !groupId.trim()) {
         throw new ApiError(400, "Bad Request!")
    }

    try {
        const [participant] = await db
        .select()
        .from(conversationParticipantTable)
        .where(
            and(
                eq(conversationParticipantTable.conversationId, conversationId),
                eq(conversationParticipantTable.userId, userId)
            )
        )

        if (!participant || participant.role != "owner") {
            throw new ApiError(403, "Forbidden!")
        }

        const [group] = await db
        .select()
        .from(groupTable)
        .where(
            eq(groupTable.id, groupId)
        )

        if (!group) {
            throw new ApiError(409, "Group Not Found!")
        }

        const addedParticipant = await conversationService.addParticipant(userId, participantId, conversationId) as conversationParticipantType

        return rep
        .status(200)
        .send(
            new ApiResponse(200, addedParticipant, "Participant Added!")
        )

    } catch (error) {
        req.log.error(error)
        throw error
    }


})

const removeParticipant = asyncHandler(async (req: FastifyRequest<{
    Params: {
        conversationId: string,
        groupId: string
    },
    Body: {
        participantId: string,
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { conversationId, groupId } = req.params
    const { participantId } = req.body

    if (!conversationId || !participantId || !groupId) {
        throw new ApiError(400, "Bad Request!")
    }

    try {
        await db
        .transaction(async (tx) => {
            const participants = await tx
            .select()
            .from(conversationParticipantTable)
            .where(
                and(
                    eq(conversationParticipantTable.conversationId, conversationId),
                    inArray(conversationParticipantTable.userId, [userId, participantId])
                )
            )

            if (participants.length != 2) {
                throw new ApiError(403, "Forbidden!")
            }

            const [group] = await tx
            .select()
            .from(groupTable)
            .where(
                eq(groupTable.id, groupId)
            )

            if (!group) {
                throw new ApiError(409, "Group Not Found!")
            }

            const [deletedParticipant] = await tx
            .delete(conversationParticipantTable)
            .where(
                and(
                    eq(conversationParticipantTable.conversationId, conversationId),
                    eq(conversationParticipantTable.userId, participantId)
                )
            )
            .returning()

            if (!deletedParticipant) {
                throw new ApiError(500, "Internal Server Error")
            }

        })

        return rep
        .status(200)
        .send(
            new ApiResponse(200, {}, "Participant Deleted Successful!")
        )
    } catch (error) {
        req.log.error(error)
        throw error
    }
})

const leaveGroup = asyncHandler(async (req: FastifyRequest<{
    Params: {
        groupId: string,
        conversationId: string,
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { groupId, conversationId } = req.params

    validationService.validateFields([groupId, conversationId])

    try {
        await db
        .transaction(async (tx) => {
            const [participant] = await tx
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

            const [group] = await tx
            .select()
            .from(groupTable)
            .where(
                and(
                    eq(groupTable.id, groupId),
                    eq(groupTable.conversationId, conversationId)
                )
            )

            if (!group) {
                throw new ApiError(404, "Group Not Found!")
            }

            const [leftUser] = await tx
            .delete(conversationParticipantTable)
            .where(
                and(
                    eq(conversationParticipantTable.conversationId, conversationId),
                    eq(conversationParticipantTable.userId, userId)
                )
            )
            .returning()

            if (!leftUser) {
                throw new ApiError(500, "Internal server Error!")
            }

        })

        return rep
        .status(200)
        .send(
            new ApiResponse(200, {}, "User Leaved the Group Successful!")
        )
    } catch (error) {
        req.log.error(error)
        throw error
    }
})

const promoteAdmin = asyncHandler(async (req: FastifyRequest<{
    Params: {
        conversationId: string,
        groupId: string,
    },
    Body: {
        participantId: string
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { conversationId, groupId } = req.params
    const { participantId } = req.body

    validationService.validateFields([conversationId, groupId, participantId])

    try {
        const res = await db 
        .transaction(async (tx) => {
            const participants = await tx
            .select()
            .from(conversationParticipantTable)
            .where(
                and(
                    eq(conversationParticipantTable.conversationId, conversationId),
                    or(
                        and(
                            eq(conversationParticipantTable.userId, userId),
                            eq(conversationParticipantTable.role, "owner")
                        ),
                        eq(conversationParticipantTable.userId, participantId)
                    )
                )
            )

            if (participants.length != 2) {
                throw new ApiError(403, "Forbidden!")
            }

            const [group] = await tx
            .select()
            .from(groupTable)
            .where(
                and(
                    eq(groupTable.conversationId, conversationId),
                    eq(groupTable.id, groupId)
                )
            )

            if (!group) {
                throw new ApiError(404, "Group Not Found!")
            }

            const [updatedParticipant] = await tx
            .update(conversationParticipantTable)
            .set({
                role: "onwer"
            })
            .where(
                and(
                    eq(conversationParticipantTable.conversationId, conversationId),
                    eq(conversationParticipantTable.userId, participantId)
                )
            )
            .returning()

            if (!updatedParticipant) {
                throw new ApiError(500, "Internal Server Error!")
            }

            return updatedParticipant

        })

        return rep
        .status(200)
        .send(
            new ApiResponse(200, res, "Updated Participant Details Successful!")
        )

    } catch (error) {
        req.log.error(error)
        throw error
    }
})

const demoteAdmin = asyncHandler(async (req: FastifyRequest<{
    Params: {
        conversationId: string,
        groupId: string
    },
    Body: {
        participantId: string
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { participantId } = req.body
    const { conversationId, groupId } = req.params

    validationService.validateFields([participantId, conversationId, groupId])

    try {
        const res = await db
        .transaction(async (tx) => {

            const participants = await tx
            .select()
            .from(conversationParticipantTable)
            .where(
                and(
                    eq(conversationParticipantTable.conversationId, conversationId),
                    or(
                        and(
                            eq(conversationParticipantTable.userId, userId),
                            eq(conversationParticipantTable.role, "owner")
                        ),
                        eq(conversationParticipantTable.userId, participantId)
                    )
                )
            )

            if (participants.length != 2) {
                throw new ApiError(403, "Forbidden!")
            }

            const [group] = await tx
            .select()
            .from(groupTable)
            .where(
                and(
                    eq(groupTable.id, groupId),
                    eq(groupTable.conversationId, conversationId)
                )
            )

            if (!group) {
                throw new ApiError(404, "Group Not Found!")
            }

            const [updatedParticipant] = await tx
            .update(conversationParticipantTable)
            .set({
                role: "member"
            })
            .where(
                and(
                    eq(conversationParticipantTable.conversationId, conversationId),
                    eq(conversationParticipantTable.userId, participantId)
                )
            )
            .returning()

            if (!updatedParticipant) {
                throw new ApiError(500, "Internal Server Error!")
            }

            return updatedParticipant

        })

        return rep
        .status(200)
        .send(
            new ApiResponse(200, res, "Updated Participant Details Successful!")
        )
    } catch (error) {
        req.log.error(error)
        throw error
    }
})

const getGroupParticipants = asyncHandler(async (req: FastifyRequest<{
    Params: {
        conversationId: string,
        groupId: string
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { groupId, conversationId } = req.params

    validationService.validateFields([groupId, conversationId])

    try {
        const res = await db
        .transaction(async (tx) => {

            const [participant] = await tx
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

            const [group] = await tx
            .select()
            .from(groupTable)
            .where(
                and(
                    eq(groupTable.id, groupId),
                    eq(groupTable.conversationId, conversationId)
                )
            )

            if (!group) {
                throw new ApiError(404, "Group Not Found!")
            }

            const allParticipants = await tx
            .select()
            .from(conversationParticipantTable)
            .where(
                eq(conversationParticipantTable.conversationId, conversationId)
            )

            return allParticipants

        })

        return rep
        .status(200)
        .send(
            new ApiResponse(200, res, "Fetched All Participant From Group!")
        )
    } catch (error) {
        req.log.error(error)
        throw error
    }
})

export {
    createGroup,
    updateGroupTitle,
    updateGroupImg,
    addParticipant,
    removeParticipant,
    leaveGroup,
    promoteAdmin,
    demoteAdmin,
    getGroupParticipants
}