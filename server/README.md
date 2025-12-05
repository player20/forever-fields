# Forever Fields Backend API

> **v0.0-secure-backend** - Production-ready backend for Forever Fields memorial platform

[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.6.3-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/prisma-5.22.0-blueviolet)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

A secure, production-ready Node.js backend for Forever Fields - a platform for creating and managing digital memorials for humans and pets.

## 🌟 Features

### Core Features
- ✅ **Magic Link Authentication** - Passwordless login with 15-min expiry, single-use tokens
- ✅ **Memorial Management** - Full CRUD for human & pet memorials with privacy controls
- ✅ **Secure File Uploads** - Cloudinary integration with signed uploads
- ✅ **Virtual Candles** - Public tribute system with rate limiting
- ✅ **Time Capsules** - Delayed message delivery
- ✅ **Moderation Queue** - Pending items approval system
- ✅ **QR Codes** - Physical memorial markers
- ✅ **Push Notifications** - Web push for memorial updates

### Security Features
- 🔒 **Rate Limiting** - 5/min auth, 20/min general, 3/min candles
- 🔒 **Helmet.js** - Security headers (CSP, HSTS, XSS protection)
- 🔒 **CORS** - Restricted cross-origin access
- 🔒 **Zod Validation** - Type-safe input validation on all routes
- 🔒 **Row Level Security** - Supabase RLS policies
- 🔒 **HTTPS Only** - Automatic redirect in production
- 🔒 **Secure Error Handling** - No detail leakage
- 🔒 **Role-Based Access Control** - Owner/editor/viewer permissions

## 🏗️ Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: Supabase Auth + Magic Links
- **File Storage**: Cloudinary
- **Email**: Nodemailer (SMTP)
- **Validation**: Zod
- **Security**: Helmet, express-rate-limit, CORS
- **Deployment**: Render.com + Docker

## 📁 Project Structure

```
server/
├── src/
│   ├── config/           # Environment & service configs
│   │   ├── env.ts
│   │   ├── database.ts
│   │   ├── supabase.ts
│   │   └── cloudinary.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # JWT authentication
│   │   ├── authorization.ts  # Role-based access
│   │   ├── security.ts   # Rate limiting, Helmet, CORS
│   │   └── validate.ts   # Zod validation
│   ├── routes/           # API route handlers
│   │   ├── auth.ts       # Magic link auth
│   │   ├── memorials.ts  # Memorial CRUD
│   │   ├── uploads.ts    # Cloudinary uploads
│   │   ├── pending.ts    # Moderation queue
│   │   ├── candles.ts    # Virtual candles
│   │   ├── timeCapsules.ts
│   │   ├── qr.ts
│   │   └── push.ts
│   ├── services/         # Business logic
│   │   └── email.ts      # Email templates
│   ├── validators/       # Zod schemas
│   │   └── schemas.ts
│   ├── utils/            # Utility functions
│   │   └── tokens.ts
│   ├── app.ts            # Express app setup
│   └── index.ts          # Entry point
├── prisma/
│   └── schema.prisma     # Database schema (9 tables)
├── tests/
│   └── integration.test.js  # Full flow test
├── Dockerfile
├── render.yaml
├── .env.example
├── DEPLOYMENT.md
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- Supabase account (free tier)
- Cloudinary account (free tier)
- SMTP email service (Gmail for dev, SendGrid for prod)

### 1. Clone & Install

```bash
cd server
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your credentials (see Configuration section)
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio
npx prisma studio
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

### 5. Run Tests

```bash
# Set test email
export TEST_EMAIL="your-email@example.com"

# Run integration tests
npm test
```

## ⚙️ Configuration

### Required Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database (from Supabase)
DATABASE_URL=postgresql://user:pass@host:port/db

# Supabase Auth
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Email (SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxx
SMTP_FROM=Forever Fields <noreply@domain.com>

# Security
JWT_SECRET=your-32-char-minimum-secret

# Optional: Web Push
VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx
VAPID_SUBJECT=mailto:admin@domain.com
```

See [.env.example](.env.example) for complete details.

## 📚 API Documentation

### Authentication

#### Request Magic Link
```bash
POST /api/auth/magic-link
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Auth Callback (via email link)
```bash
GET /api/auth/callback?token={32-char-token}
# Redirects to frontend with access_token
```

### Memorials

#### Get My Memorials
```bash
GET /api/memorials/mine
Authorization: Bearer {token}
```

#### Create Memorial
```bash
POST /api/memorials
Authorization: Bearer {token}
Content-Type: application/json

{
  "deceasedName": "John Doe",
  "birthDate": "1950-01-15T00:00:00.000Z",
  "deathDate": "2023-12-01T00:00:00.000Z",
  "shortBio": "Beloved father and friend...",
  "isPet": false,
  "privacy": "private"
}
```

#### Get Memorial (public/link)
```bash
GET /api/memorials/{id}
# No auth required for public/link memorials
```

#### Update Memorial
```bash
PUT /api/memorials/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "privacy": "public",
  "shortBio": "Updated bio..."
}
```

### Candles

#### Light a Candle
```bash
POST /api/candles
Content-Type: application/json

{
  "memorialId": "uuid",
  "message": "Rest in peace",
  "name": "Anonymous"
}
```

### Uploads

#### Get Signed Upload URL
```bash
POST /api/uploads/sign
Authorization: Bearer {token}
Content-Type: application/json

{
  "fileType": "image",
  "fileName": "portrait.jpg",
  "memorialId": "uuid"
}
```

See full API documentation in [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🗄️ Database Schema

9 tables with Row Level Security (RLS):

1. **users** - User accounts
2. **memorials** - Memorial pages
3. **pending_items** - Moderation queue
4. **invitations** - Collaborative access
5. **candles** - Virtual tributes
6. **time_capsules** - Delayed messages
7. **social_links** - Social media links
8. **qrcodes** - QR code designs
9. **push_subscriptions** - Push notifications
10. **magic_links** - Auth tokens (bonus)

See [prisma/schema.prisma](./prisma/schema.prisma) for full schema with RLS comments.

## 🔐 Security Implementation

### Authentication Flow

1. User requests magic link via email
2. Server generates 32-char secure token (crypto.randomBytes)
3. Token stored in DB with 15-min expiry
4. Email sent with one-tap link
5. User clicks link → server validates token
6. Token marked as used (single-use)
7. Supabase session created
8. User redirected with access token

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| Auth (magic link) | 5 per 15 min |
| General API | 100 per 15 min |
| Candles | 3 per 1 min |
| Uploads | 10 per 15 min |

### Input Validation

All inputs validated with Zod schemas:
- Email format validation
- UUID validation
- String length limits
- Date format validation
- URL validation
- Custom business logic (e.g., duplicate detection)

### Duplicate Prevention

Memorials identified by:
- `deceased_name_lower` + `birth_date` OR
- `deceased_name_lower` + `death_date`

Enforced via unique constraints in Prisma schema.

## 🚢 Deployment

### Deploy to Render.com

See comprehensive guide: [DEPLOYMENT.md](./DEPLOYMENT.md)

**Quick Deploy:**

1. Push to GitHub
2. Connect repository to Render
3. Create PostgreSQL database
4. Create Web Service with `render.yaml`
5. Set environment variables
6. Deploy

**Estimated Time**: 15 minutes

**Cost**: $0 (free tier)

### Docker Deployment

```bash
# Build
docker build -t forever-fields-backend .

# Run
docker run -p 3000:3000 --env-file .env forever-fields-backend
```

## 🧪 Testing

### Integration Tests

```bash
# Run full flow test
npm test

# With specific API URL
API_URL=https://your-api.onrender.com npm test

# With test token (for authenticated tests)
TEST_TOKEN="32-char-token" npm test
```

Tests include:
1. ✅ Health check
2. ✅ Magic link request
3. ✅ Auth callback
4. ✅ Create memorial
5. ✅ Get memorials
6. ✅ Unauthorized edit (security)
7. ✅ Rate limiting (security)
8. ✅ Public memorial access
9. ✅ Input validation (security)
10. ✅ Light candle

### Manual Testing

Use the provided test script or tools like:
- **Postman**: Import collection
- **curl**: Command-line requests
- **Thunder Client**: VS Code extension

## 📊 Performance

### Free Tier Limits

- **Render**: 512MB RAM, shared CPU
- **Supabase**: 500MB database, 50K MAU
- **Cloudinary**: 25GB storage, 25GB bandwidth

### Optimization Tips

1. Enable Prisma query caching
2. Add Redis for sessions
3. Use Cloudinary transformations
4. Implement CDN for static assets
5. Upgrade to paid tiers for production

## 🛠️ Development

### Scripts

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript
npm start            # Run production build
npm test             # Run integration tests
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
```

### Code Style

- TypeScript strict mode
- ESLint + Prettier (optional)
- Conventional commits
- Security-first approach

## 🤝 Contributing

This is a showcase project for Forever Fields. For contributions:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file

## 🔗 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Render Docs](https://render.com/docs)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## 📞 Support

- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: Open GitHub issue
- **Email**: support@foreverfields.com

---

**Built with ❤️ for Forever Fields**

**Version**: v0.0-secure-backend | **Status**: Production Ready ✅
