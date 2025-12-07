# 🔐 Credential Rotation Guide
**CRITICAL SECURITY ISSUE - FOLLOW IMMEDIATELY**

Your production credentials are exposed in `server/.env`. This guide helps you rotate them safely.

---

## ⏱️ Time Required: 30 minutes

---

## 📋 Checklist

- [ ] Step 1: Reset Supabase Database Password (5 min)
- [ ] Step 2: Regenerate Supabase API Keys (3 min)
- [ ] Step 3: Regenerate Cloudinary API Secret (3 min)
- [ ] Step 4: Regenerate Resend API Key (3 min)
- [ ] Step 5: Generate New JWT Secret (1 min)
- [ ] Step 6: Update Render Environment Variables (10 min)
- [ ] Step 7: Remove .env from Git History (5 min)
- [ ] Step 8: Test Everything Works (5 min)

---

## Step 1: Reset Supabase Database Password

### 1.1 Go to Supabase Dashboard
```
URL: https://app.supabase.com/project/_/settings/database
```

### 1.2 Reset Password
1. Find "Database Password" section
2. Click **"Reset database password"**
3. Copy the new password shown (you only see it once!)
4. Save it temporarily in a secure note

### 1.3 Get New Connection String
1. Go to: https://app.supabase.com/project/_/settings/database
2. Find "Connection string" section
3. Select **"URI"** tab
4. Copy the connection string (starts with `postgresql://`)
5. Replace `[YOUR-PASSWORD]` with the password you just reset
6. Save as: `NEW_DATABASE_URL`

**Example**:
```
postgresql://postgres.abcd1234:NEW_PASSWORD_HERE@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

⚠️ **IMPORTANT**: Use port **5432** (direct connection), NOT **6543** (pooler)

---

## Step 2: Regenerate Supabase API Keys

### 2.1 Go to API Settings
```
URL: https://app.supabase.com/project/_/settings/api
```

### 2.2 Regenerate Service Role Key
1. Find **"service_role"** key section
2. Click the refresh icon ↻ next to the key
3. Confirm regeneration
4. Copy the new key (starts with `eyJhbGciOiJI...`)
5. Save as: `NEW_SUPABASE_SERVICE_ROLE_KEY`

⚠️ **NOTE**: The `anon` key does NOT need to be rotated (it's public)

---

## Step 3: Regenerate Cloudinary API Secret

### 3.1 Go to Cloudinary Console
```
URL: https://cloudinary.com/console/settings/security
```

### 3.2 Regenerate API Secret
1. Find **"API Keys"** section
2. Click **"Regenerate API Secret"**
3. Confirm regeneration
4. Copy the new API Secret
5. Save as: `NEW_CLOUDINARY_API_SECRET`

### 3.3 Note Your Cloud Name and API Key
(These do NOT need rotation, but you'll need them for .env)
- Copy **Cloud Name**: `NEW_CLOUDINARY_CLOUD_NAME`
- Copy **API Key** (numbers): `NEW_CLOUDINARY_API_KEY`

---

## Step 4: Regenerate Resend API Key

### 4.1 Go to Resend Dashboard
```
URL: https://resend.com/api-keys
```

### 4.2 Delete Old Key
1. Find the old API key (starts with `re_...`)
2. Click the trash icon to delete it
3. Confirm deletion

### 4.3 Generate New Key
1. Click **"Create API Key"**
2. Name it: `forever-fields-production`
3. Select permissions: **"Sending access"**
4. Click **"Create"**
5. Copy the new key (starts with `re_...`)
6. Save as: `NEW_SMTP_PASS`

⚠️ **You only see this key once!** Save it securely.

---

## Step 5: Generate New JWT Secret

### 5.1 Run This Command
Open terminal and run:
```bash
openssl rand -base64 64
```

### 5.2 Copy Output
You'll see output like:
```
7f3d8e2a1c9b4f6e8d7a2b5c3e9f1a4d6b8c9e2f3a5d7c8e9f1a2b4c6d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2
```

Save this as: `NEW_JWT_SECRET`

---

## Step 6: Update Render Environment Variables

### 6.1 Go to Render Dashboard
```
URL: https://dashboard.render.com
```

### 6.2 Select Your Service
1. Click on your **"forever-fields"** web service
2. Go to **"Environment"** tab

### 6.3 Update Each Variable
Update these variables with NEW values:

```bash
DATABASE_URL = [paste NEW_DATABASE_URL from Step 1.3]
SUPABASE_SERVICE_ROLE_KEY = [paste NEW_SUPABASE_SERVICE_ROLE_KEY from Step 2.2]
CLOUDINARY_API_SECRET = [paste NEW_CLOUDINARY_API_SECRET from Step 3.2]
SMTP_PASS = [paste NEW_SMTP_PASS from Step 4.3]
JWT_SECRET = [paste NEW_JWT_SECRET from Step 5.2]
```

### 6.4 Save Changes
1. Click **"Save Changes"**
2. Render will automatically redeploy with new credentials
3. Wait for deployment to complete (~3-5 minutes)

---

## Step 7: Remove .env from Git History

### 7.1 Backup Your Repository
```bash
# Create backup
cd /c/Users/jacob/Desktop/
cp -r claude-code-example claude-code-example-backup
```

### 7.2 Remove .env from Git History
```bash
cd /c/Users/jacob/Desktop/claude-code-example

# Remove .env from git history (this rewrites history)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch server/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Verify .env is gone from history
git log --all --full-history -- server/.env
# Should show nothing
```

### 7.3 Force Push (CAREFUL!)
```bash
# ONLY do this if you're the only developer
# OR coordinate with team first
git push origin --force --all
git push origin --force --tags
```

⚠️ **WARNING**: This rewrites git history! If others have cloned the repo, they'll need to re-clone.

### 7.4 Update Local .env
```bash
# Delete old .env
rm server/.env

# Copy template
cp server/.env.example server/.env

# Edit with NEW credentials
code server/.env  # or nano/vim
```

Paste your NEW credentials (from steps 1-5):
```bash
DATABASE_URL=[NEW_DATABASE_URL]
SUPABASE_SERVICE_ROLE_KEY=[NEW_SUPABASE_SERVICE_ROLE_KEY]
CLOUDINARY_API_SECRET=[NEW_CLOUDINARY_API_SECRET]
SMTP_PASS=[NEW_SMTP_PASS]
JWT_SECRET=[NEW_JWT_SECRET]
```

### 7.5 Verify .env is Ignored
```bash
# Add .env to .gitignore if not already there
echo "server/.env" >> .gitignore
echo ".env" >> .gitignore

# Verify git ignores it
git status | grep .env
# Should show nothing (it's ignored)
```

---

## Step 8: Test Everything Works

### 8.1 Test API Health
```bash
curl https://forever-fields.onrender.com/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-07T...",
  "environment": "production"
}
```

### 8.2 Test Email Sending
```bash
curl -X POST https://forever-fields.onrender.com/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL_HERE@example.com"}'
```

**Expected Response**:
```json
{
  "message": "Magic link sent to your email"
}
```

**NOT** (this was the error before):
```json
{"error":"Failed to send authentication email"}
```

### 8.3 Test Database Connection
```bash
# Login to Render
# Go to your service → Shell tab
# Run:
cd server
npm run prisma:db:push
```

Should connect successfully without errors.

### 8.4 Test Cloudinary Uploads
1. Go to your app: https://forever-fields.pages.dev
2. Create a test memorial
3. Upload a photo
4. Verify it uploads successfully

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] API health endpoint returns `{"status":"healthy"}`
- [ ] Magic link email sends successfully
- [ ] Database queries work (app loads memorials)
- [ ] Image uploads work
- [ ] `.env` file is NOT in git (`git status` doesn't show it)
- [ ] `.gitignore` includes `server/.env` and `.env`
- [ ] Render deployment successful with new credentials

---

## 🚨 If Something Goes Wrong

### Database Connection Fails
- Verify you used port **5432** (not 6543) in DATABASE_URL
- Check Supabase dashboard shows "Direct connection" URL
- Verify password was copied correctly (no extra spaces)

### Email Sending Still Fails
- Check Resend dashboard → "Emails" tab for error logs
- Verify domain is verified in Resend
- Check SMTP settings:
  - Host: `smtp.resend.com`
  - Port: `587`
  - User: `resend`

### Images Won't Upload
- Verify Cloudinary API Secret has no extra spaces
- Check Cloud Name and API Key are correct
- Test Cloudinary console → Upload an image manually

### Can't Force Push Git
If you're working with a team:
1. **Don't force push yet**
2. Coordinate with team members
3. Have everyone backup their local changes
4. Schedule a time to force push together
5. Have everyone re-clone the repo after

---

## 📋 Credentials Template

Save this for your records (in a **password manager**, NOT in code):

```
=== SUPABASE ===
Database URL: postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
Service Role Key: eyJhbGciOiJI...
Anon Key: eyJhbGciOiJI... (no rotation needed)

=== CLOUDINARY ===
Cloud Name: foreverfields
API Key: 123456789012345
API Secret: abc123xyz... (ROTATED)

=== RESEND ===
API Key: re_... (ROTATED)
From Email: Forever Fields <noreply@foreverfields.app>

=== JWT ===
Secret: [64-character random string] (ROTATED)

=== ROTATION DATES ===
Last Rotated: December 7, 2024
Next Rotation: March 7, 2025 (quarterly)
```

---

## 🔒 Best Practices Going Forward

1. **Never commit .env files**
   - Always keep `.env` in `.gitignore`
   - Use `.env.example` with placeholders only

2. **Rotate credentials quarterly**
   - Set calendar reminder for every 3 months
   - Rotate even if no breach suspected

3. **Use different credentials per environment**
   - Development: Use separate Supabase project
   - Staging: Use test API keys
   - Production: Use the credentials you just created

4. **Monitor for suspicious activity**
   - Check Supabase logs weekly
   - Check Cloudinary usage monthly
   - Set up alerts for unusual API usage

5. **Use a password manager**
   - Store credentials in 1Password, LastPass, or Bitwarden
   - Share with team securely (not via email/Slack)

---

## 📞 Need Help?

### Stuck on a step?
- **Supabase**: https://supabase.com/docs/guides/platform/going-into-prod
- **Cloudinary**: https://cloudinary.com/documentation
- **Resend**: https://resend.com/docs
- **Git history**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

### Questions?
- Review `AUDIT_SUMMARY.md` for overview
- Review `AUDIT_PROGRESS.md` for detailed findings
- Review `AUDIT_REPORT.md` for all 39 issues

---

**Time Started**: __:__
**Time Completed**: __:__
**Total Time**: _____ minutes

✅ **Status**: [ ] In Progress  [ ] Completed  [ ] Verified

---

*Generated by Claude Code Auditor - December 7, 2024*
