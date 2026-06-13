import ApiError from "../utils/ApiError.util"

const validationService = {
    validateFields: (fields: string[]) => {
        fields.forEach((field: string) => {
            if (!field.trim()) {
                throw new ApiError(400, "Bad Request!")
            }
        })
    }
}

export { validationService }