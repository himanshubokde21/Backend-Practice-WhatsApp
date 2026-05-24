class ApiError extends Error{
    public status: number
    constructor(status: number, msg: string) {
        super(msg)
        this.status = status
        Error.captureStackTrace(this, this.constructor)
    }
}

export default ApiError