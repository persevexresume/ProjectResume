const USER_ID_MAP_KEY = 'persevex_db_user_id_map_v1'

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isUuid = (value = '') => UUID_V4_REGEX.test(String(value || '').trim())

const loadIdMap = () => {
    try {
        const raw = localStorage.getItem(USER_ID_MAP_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
        return {}
    }
}

const saveIdMap = (map) => {
    try {
        localStorage.setItem(USER_ID_MAP_KEY, JSON.stringify(map || {}))
    } catch {
        // Ignore storage errors and keep in-memory flow working.
    }
}

const toHex = (value) => (value >>> 0).toString(16).padStart(8, '0')

const fnv1a32 = (input) => {
    let hash = 0x811c9dc5
    const text = String(input || '')
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i)
        hash = Math.imul(hash, 0x01000193)
    }
    return hash >>> 0
}

const deterministicUuidFromSeed = (seed) => {
    const s = String(seed || '')
    const p1 = toHex(fnv1a32(`${s}|1`))
    const p2 = toHex(fnv1a32(`${s}|2`))
    const p3 = toHex(fnv1a32(`${s}|3`))
    const p4 = toHex(fnv1a32(`${s}|4`))

    const raw = `${p1}${p2}${p3}${p4}`.slice(0, 32)
    const bytes = raw.split('')

    // UUID v4 variant bits
    bytes[12] = '4'
    bytes[16] = ((parseInt(bytes[16], 16) & 0x3) | 0x8).toString(16)

    return `${bytes.slice(0, 8).join('')}-${bytes.slice(8, 12).join('')}-${bytes.slice(12, 16).join('')}-${bytes.slice(16, 20).join('')}-${bytes.slice(20, 32).join('')}`
}

export const getDbUserId = (user) => {
    const raw = String(user?.studentId || user?.uid || user?.id || '').trim()
    if (!raw) return ''
    if (isUuid(raw)) return raw

    const map = loadIdMap()
    if (map[raw] && isUuid(map[raw])) {
        return map[raw]
    }

    const generated = deterministicUuidFromSeed(raw)
    map[raw] = generated
    saveIdMap(map)
    return generated
}

export const isDbUuid = (value) => isUuid(value)

export const getDbUserIdCandidates = (user) => {
    const candidates = []
    const seen = new Set()

    const add = (value) => {
        const token = String(value || '').trim()
        if (!token) return
        const resolved = isUuid(token) ? token : getDbUserId({ studentId: token })
        if (!resolved || !isUuid(resolved) || seen.has(resolved)) return
        seen.add(resolved)
        candidates.push(resolved)
    }

    add(user?.studentId)
    add(user?.uid)
    add(user?.id)
    add(user?.user_id)

    return candidates
}
