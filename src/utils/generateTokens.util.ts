import app from "../app.ts"

const generateAccessToken = async (payload: { id: string, username: string, email: string, phoneNo: string}) => {
    return app.jwt.sign(
        payload,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY!}
    )
}

const generateRefreshToken = async (payload: string) => {
    return app.jwt.sign(
        { payload },
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY!}
    )
}

export { generateAccessToken, generateRefreshToken }