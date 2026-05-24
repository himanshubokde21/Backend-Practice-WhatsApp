
const hashPassword = async (oldPass: string) => {
    return await bcrypt.hash(oldPass, 10)
}

const verifyPassword = async (password: string, hashedPassword: string) => {
    return await bcrypt
}

export { hashPassword }