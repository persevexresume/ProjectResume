export const getDbUserId = (user) => {
    const raw = (user?.studentId || user?.uid || user?.id || '').trim()
    if (!raw) return ''
    return raw
}
