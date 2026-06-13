
const IsStringArray = (arr: string[]) => {
    try {
        return Array.isArray(arr) && (arr.length == 0 || typeof arr[0] == 'string')
    } catch (error) {
        throw error
    }
}

export default IsStringArray