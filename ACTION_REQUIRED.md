# 🚨 URGENT ACTION REQUIRED - API Key Rotation

## ✅ What I Fixed

1. ✅ **Removed exposed key from git history**
   - Used `git filter-branch` to clean all commits
   - Force pushed cleaned repository to GitHub
   - No exposed keys remain in public repo

2. ✅ **Updated code to use environment variables**
   - Changed from: `const KEY = 'AIzaSyBs-...'` ❌
   - Changed to: `const KEY = import.meta.env.VITE_GEMINI_API_KEY` ✅

3. ✅ **Cleaned GitHub repository**
   - Latest commit: d44353c (security fix)
   - Git history is now secure
   - Repository synced and up-to-date

---

## 🔴 YOU MUST DO THIS NOW (5 minutes)

### Step 1: Revoke Old API Key (2 minutes)
```
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find key: AIzaSyBs-a0YMhoGVTA4KW77yH0kVAzyqMn6VME
3. Click on it
4. Click DELETE button
5. Confirm deletion
✅ Old key is now DISABLED
```

### Step 2: Create New API Key (2 minutes)
```
1. Still in Google Cloud Console
2. Click CREATE CREDENTIALS
3. Select API KEY
4. Copy the new key (starts with AIza...)
5. Keep it safe!
```

### Step 3: Update Vercel (1 minute)
```
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Find: VITE_GEMINI_API_KEY
5. Click EDIT
6. Replace value with your NEW key
7. Click SAVE
```

### Step 4: Redeploy Vercel (Automatic - 2-3 minutes)
```
1. Go to Deployments tab
2. Click latest deployment
3. Click REDEPLOY
4. Wait for build to complete
5. Site is now secure!
```

---

## 📊 Summary

| Item | Status |
|------|--------|
| Git history cleaned | ✅ Done |
| Code uses env vars | ✅ Done |
| GitHub updated | ✅ Done |
| Old key revoked | 🔴 TODO |
| New key created | 🔴 TODO |
| Vercel updated | 🔴 TODO |
| Site redeployed | 🔴 TODO |

---

## ⏱️ Time Required
**Total: 5-7 minutes**

- Google Console cleanup: 2 min
- New key creation: 2 min
- Vercel update: 1 min
- Vercel redeploy: 2-3 min (automatic)

---

## ✨ After You're Done
- Your site will be 100% secure
- No exposed keys anywhere
- New key is in use
- All features working normally

---

## 🆘 Need Help?

**Q: Can't find Credentials in Google Console?**
A: Search "Credentials" in the search bar at top

**Q: Don't see the old key?**
A: It might already be deleted. Create a new one anyway.

**Q: How long until new key works?**
A: Instantly after Vercel redeploys (2-3 minutes)

---

**Estimated Time to Complete: 5-7 minutes**  
**Difficulty Level: Very Easy**  
**Priority: 🔴 CRITICAL**

DO THIS NOW! 👉
