const MASTER_PROFILE_BACKUP_KEY = 'persevex_master_profile_backup_v1'

const loadBackupMap = () => {
  try {
    const raw = localStorage.getItem(MASTER_PROFILE_BACKUP_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const saveBackupMap = (map) => {
  try {
    localStorage.setItem(MASTER_PROFILE_BACKUP_KEY, JSON.stringify(map || {}))
  } catch {
    // Ignore storage write errors.
  }
}

const normalizeToken = (value) => String(value || '').trim().toLowerCase()

const getIdentityTokens = (user) => {
  const tokens = new Set()

  const add = (value) => {
    const token = normalizeToken(value)
    if (token) tokens.add(token)
  }

  add(user?.email)
  add(user?.studentId)
  add(user?.uid)
  add(user?.id)
  add(user?.user_id)

  return [...tokens]
}

export const saveMasterProfileBackup = (user, profile) => {
  if (!profile || typeof profile !== 'object') return

  const tokens = getIdentityTokens(user)
  if (!tokens.length) return

  const map = loadBackupMap()
  const entry = {
    profile,
    savedAt: new Date().toISOString()
  }

  tokens.forEach((token) => {
    map[token] = entry
  })

  saveBackupMap(map)
}

export const loadMasterProfileBackup = (user) => {
  const tokens = getIdentityTokens(user)
  if (!tokens.length) return null

  const map = loadBackupMap()

  for (const token of tokens) {
    const entry = map[token]
    if (entry?.profile && typeof entry.profile === 'object') {
      return entry.profile
    }
  }

  return null
}
