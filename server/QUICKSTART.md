# Forever Fields Backend - Quick Start Guide

> **Get your backend running in under 10 minutes!**

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js 20+ installed ([download](https://nodejs.org/))
- ✅ A code editor (VS Code recommended)
- ✅ A terminal/command prompt
- ✅ Internet connection

## Step-by-Step Setup

### 1. Install Dependencies (2 minutes)

```bash
cd server
npm install
```

### 2. Set Up Free Services (5 minutes)

#### A. Supabase (Database + Auth)

1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. Click "New Project"
3. Fill in:
   - **Name**: forever-fields
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
4. Wait 2 minutes for setup
5. Go to **Settings** → **API** and copy:
   - Project URL
   - anon/public key
   - service_role key
6. Go to **Settings** → **Database** and copy:
   - Connection string URI (replace `[YOUR-PASSWORD]`)

#### B. Cloudinary (File Storage)

1. Go to [cloudinary.com](https://cloudinary.com) → Sign up (free)
2. Dashboard shows:
   - Cloud name
   - API Key
   - API Secret
3. Copy these values

#### C. Email Service (Choose One)

**Option 1: Gmail** (Development Only)
1. Enable 2FA on Gmail
2. Generate App Password: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - User: your email
   - Pass: 16-char app password

**Option 2: SendGrid** (Production)
1. Go to [sendgrid.com](https://sendgrid.com) → Sign up (free)
2. Create API key with Mail Send permission
3. Use:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - User: `apikey`
   - Pass: your API key

### 3. Configure Environment (2 minutes)

```bash
# Copy example file
cp .env.example .env

# Edit .env with your values
# Use your favorite editor (nano, vim, VS Code, etc.)
```

**Required Variables:**
```bash
DATABASE_URL=postgresql://... # From Supabase Step A.6
SUPABASE_URL=https://xxx.supabase.co # From Step A.5
SUPABASE_ANON_KEY=eyJ... # From Step A.5
SUPABASE_SERVICE_ROLE_KEY=eyJ... # From Step A.5
CLOUDINARY_CLOUD_NAME=xxx # From Step B
CLOUDINARY_API_KEY=xxx # From Step B
CLOUDINARY_API_SECRET=xxx # From Step B
SMTP_HOST=smtp.gmail.com # From Step C
SMTP_PORT=587
SMTP_USER=your@email.com # From Step C
SMTP_PASS=your-password # From Step C
SMTP_FROM=Forever Fields <noreply@domain.com>
JWT_SECRET=your-secret-min-32-chars # Generate: openssl rand -base64 32
```

### 4. Set Up Database (1 minute)

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# (Optional) View database
npx prisma studio
```

### 5. Start Server (30 seconds)

```bash
npm run dev
```

**Expected output:**
```
🚀 Forever Fields Backend
📍 Environment: development
🌐 Server: http://localhost:3000
🎯 Port: 3000
✅ Ready to serve requests
```

### 6. Test It! (1 minute)

#### Health Check
```bash
curl http://localhost:3000/health
```

**Expected:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

#### Request Magic Link
```bash
curl -X POST http://localhost:3000/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected:**
```json
{
  "message": "If an account exists, a magic link has been sent to your email"
}
```

✅ **Check your email for the magic link!**

## Automated Setup (Even Faster!)

### Linux/Mac
```bash
bash scripts/setup.sh
```

### Windows
```bash
scripts\setup.bat
```

## Common Issues & Solutions

### Issue: "Prisma migrate failed"
**Solution:** Check your `DATABASE_URL` in `.env` is correct.

### Issue: "Email not sending"
**Solution:**
- Verify SMTP credentials
- Check spam folder
- Try Mailtrap.io for testing: [mailtrap.io](https://mailtrap.io)

### Issue: "Port 3000 already in use"
**Solution:** Change `PORT=3001` in `.env`

### Issue: "Module not found"
**Solution:** Run `npm install` again

## Next Steps

### 1. Run Tests
```bash
npm test
```

### 2. Explore API
- Open Postman or Thunder Client
- Import routes from API documentation
- Test authentication flow

### 3. Connect Frontend
Update frontend `.env`:
```bash
VITE_API_URL=http://localhost:3000
```

### 4. Deploy to Production
See [DEPLOYMENT.md](./DEPLOYMENT.md) for Render.com deployment guide.

## Project Structure Overview

```
server/
├── src/
│   ├── routes/        # API endpoints
│   ├── middleware/    # Auth, validation, security
│   ├── services/      # Business logic
│   └── config/        # Environment setup
├── prisma/
│   └── schema.prisma  # Database schema
├── tests/
│   └── integration.test.js  # Full flow tests
└── .env              # Your secrets (DO NOT COMMIT)
```

## Essential Commands

```bash
# Development
npm run dev              # Start dev server with hot reload

# Database
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Create/run migrations
npx prisma studio        # Open database GUI

# Production
npm run build            # Compile TypeScript
npm start                # Run production server

# Testing
npm test                 # Run integration tests
```

## API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | ❌ |
| POST | `/api/auth/magic-link` | Request magic link | ❌ |
| GET | `/api/auth/callback` | Verify magic link | ❌ |
| GET | `/api/memorials/mine` | Get my memorials | ✅ |
| POST | `/api/memorials` | Create memorial | ✅ |
| GET | `/api/memorials/:id` | Get memorial | ❌* |
| PUT | `/api/memorials/:id` | Update memorial | ✅ |
| POST | `/api/candles` | Light candle | ❌ |
| POST | `/api/uploads/sign` | Get upload URL | ✅ |

*Public/link memorials don't require auth

## Security Features Included

- ✅ **Magic Link Auth** - 15-min expiry, single-use tokens
- ✅ **Rate Limiting** - Prevents abuse and DDoS
- ✅ **Input Validation** - Zod schemas on all routes
- ✅ **SQL Injection Protection** - Prisma ORM
- ✅ **XSS Protection** - Helmet.js + CSP headers
- ✅ **CORS** - Restricted to frontend only
- ✅ **HTTPS** - Enforced in production
- ✅ **Row Level Security** - Database-level protection

See [SECURITY.md](./SECURITY.md) for complete security documentation.

## Documentation Links

- **[README.md](./README.md)** - Complete documentation
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[SECURITY.md](./SECURITY.md)** - Security features & best practices
- **[.env.example](./.env.example)** - Environment variable reference

## Getting Help

### Quick Debugging

```bash
# Check logs in real-time
npm run dev

# View database
npx prisma studio

# Test specific endpoint
curl -v http://localhost:3000/api/memorials/mine \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Resources

- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

### Support

- Check `README.md` for detailed documentation
- Review `DEPLOYMENT.md` for production setup
- Open GitHub issue for bugs
- Email: support@foreverfields.com

---

**🎉 Congratulations! Your backend is running!**

Now you can:
1. ✅ Connect your frontend
2. ✅ Create memorials
3. ✅ Test authentication
4. ✅ Deploy to production

**Happy coding!** 🚀

---

**Version**: v0.0-secure-backend | **Status**: Production Ready ✅
