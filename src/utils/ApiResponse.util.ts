class ApiResponse{
    public status: number
    public data = {}
    public msg: string
    public success: boolean

    constructor(status: number, data: Object, msg = "Success", success: boolean = true) {
        this.status = status
        this.msg = msg
        this.data = data
        this.success = status < 400
    }
}

export default ApiResponse