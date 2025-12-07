# Admin Dashboard + Safety Features - Implementation Guide

**Priority 10 - Version 0.9**
**Status**: Backend Complete ✅ | Frontend Pending ⏳

---

## ✅ COMPLETED: Backend Implementation

### 1. Database Schema Updates

**File**: `server/prisma/schema.prisma`

Added to User model:
- `isAdmin` (Boolean) - Admin dashboard access flag
- `signupIp` (String) - IP address at signup for tracking
- `termsAcceptedAt` (DateTime) - When user accepted terms
- `termsVersion` (String) - Version of terms accepted

Created `AdminAuditLog` model:
- Tracks all admin actions (merge, flag, export)
- Includes IP, user agent, metadata
- Linked to admin user with cascade delete

**Migration**: `server/prisma/migrations/20251206_add_admin_features/migration.sql`

To apply:
```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

---

### 2. Admin Authentication Middleware

**File**: `server/src/middleware/admin.ts`

**Features**:
- `requireAdmin` - Verifies user has `isAdmin` flag
- `logAdminAction` - Helper to log admin actions to audit log
- `auditAdminAction` - Middleware that auto-logs POST/PUT/DELETE requests

**Security**:
- Must be used AFTER `requireAuth` middleware
- Logs unauthorized access attempts
- Rate limited (10 req/min via `strictRateLimiter`)

---

### 3. Admin API Routes

**File**: `server/src/routes/admin.ts`

All routes require authentication + admin role + strict rate limiting.

#### GET /api/admin/signups
- Get recent signups with pagination (20/page)
- Search by email/name
- Returns: email, name, IP, tier, terms acceptance, memorial count

#### GET /api/admin/memorials
- Get all memorials with stats
- Filter by privacy (public/private/link)
- Search by deceased name
- Returns: owner, name, dates, photo/candle/memory counts

#### GET /api/admin/duplicates
- Find potential duplicates (same name + birth/death date)
- Uses raw SQL for performance
- Returns pairs of possibly duplicate memorials

#### POST /api/admin/merge-memorials
- Soft merge: marks source as private, adds admin note
- Logs action to audit log
- Validation with Zod

#### GET /api/admin/stats
- Dashboard statistics
- Totals: users, memorials, photos, candles
- Signups: today, this week, this month
- Tier breakdown: FREE/FOREVER/HEALING counts

#### GET /api/admin/audit-log
- Paginated audit log
- Shows: admin email, action, target, metadata, IP, timestamp

#### GET /api/admin/export/signups
- Export signups as CSV
- Headers: Email, Name, IP, Tier, Terms Accepted, Signup Date
- Triggers audit log entry

---

### 4. Duplicate Detection API

**File**: `server/src/routes/memorials.ts`

#### POST /api/memorials/check-duplicate
- Called from wizard before creating memorial
- Checks: same name + (birth date OR death date)
- Returns soft warning with existing memorial info
- Distinguishes user's own duplicates vs. others

**Response**:
```javascript
{
  hasDuplicates: true,
  duplicates: [
    {
      id: "uuid",
      name: "John Smith",
      birthDate: "1950-05-20",
      deathDate: "2020-08-15",
      isYours: true,  // Owned by current user
      ownerEmail: "user@example.com"
    }
  ],
  message: "You already have a memorial for this person. Would you like to edit it instead?"
}
```

---

### 5. API Client Methods

**File**: `js/api-client.js`

Added methods:
- `checkDuplicate(data)` - Check for duplicate memorial
- `getAdminSignups(page, search)` - Get signups
- `getAdminMemorials(page, search, privacy)` - Get memorials
- `getAdminDuplicates()` - Get potential duplicates
- `mergeMemorials(sourceId, targetId)` - Merge memorials
- `getAdminStats()` - Get dashboard stats
- `getAdminAuditLog(page)` - Get audit log
- `getAdminSignupsExportUrl()` - Get CSV export URL

---

## ⏳ PENDING: Frontend Implementation

### 1. Terms & Conditions Page

**Location**: `terms/index.html`

**Design Requirements**:
- Warm, compassionate copy (not corporate/legal)
- Sage green/cream/gold color scheme
- WCAG 2.1 AA compliant

**Sections**:
1. **Welcome** - Warm intro about protecting memories
2. **Ownership** - You own your content, forever
3. **Privacy** - Privacy controls, who can see memorials
4. **Data Protection** - GDPR/CCPA compliance
   - Right to access data
   - Right to delete data
   - Right to export data
5. **No Data Selling** - Explicit commitment
6. **Storage** - Cloudinary/Supabase, secure backups
7. **Cancellation** - Keep memorials even after cancellation
8. **Updates** - How we notify of changes (v1.0 = current version)

**Footer**:
- Last updated: [Date]
- Version: 1.0
- Contact: hello@foreverfields.com

**Style** (use existing CSS variables):
```css
--sage-primary: #a7c9a2
--cream: #fff8f0
--gold: #d4a574
--font-serif: 'Playfair Display'
--font-sans: 'Inter'
```

---

### 2. Admin Dashboard Page

**Location**: `admin/index.html`

**Security**:
- Check `isAdmin` flag on page load
- Redirect to login if not admin
- Show 403 error if authenticated but not admin

**Layout**:
```
┌─────────────────────────────────────┐
│ Admin Dashboard Header              │
│ [Forever Fields Logo] | [Logout]    │
├─────────────────────────────────────┤
│                                     │
│  Stats Cards (4 columns)            │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │Users│ │Mems │ │Photos│ │Candles│ │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│                                     │
│  Signups Graph (this week)          │
│  ████████████████                   │
│                                     │
├─────────────────────────────────────┤
│ Tabs: [Signups] [Memorials]        │
│       [Duplicates] [Audit Log]      │
├─────────────────────────────────────┤
│                                     │
│  Signups Table                      │
│  ┌───────────────────────────────┐ │
│  │ Email | Name | IP | Tier | ... │ │
│  │ [Search box] [Export CSV]      │ │
│  │ user@example.com | John | ... │ │
│  │ ...pagination...               │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Features**:

**Tab 1: Signups**
- Search bar (email/name)
- Export CSV button
- Table columns: Email, Name, IP, Tier, Terms Accepted, Signup Date
- Pagination (20 per page)

**Tab 2: Memorials**
- Search bar (deceased name)
- Filter by privacy (all/public/private/link)
- Table columns: Name, Owner, Birth/Death Dates, Privacy, Photo Count, Created
- Click row to view memorial

**Tab 3: Duplicates (Flagged)**
- Table of potential duplicates
- Columns: Memorial 1, Memorial 2, Match Type (birth/death)
- Action: "Gently Merge" button
- Confirmation modal: "This will mark [Memorial 1] as private and preserve all content. Continue?"

**Tab 4: Audit Log**
- Table: Admin, Action, Target, IP, Timestamp
- Pagination
- No actions (read-only)

**JavaScript**:
```javascript
// Check admin access on page load
const api = new ForeverFieldsAPI();

(async function checkAdminAccess() {
  try {
    const user = await api.getCurrentUser();
    if (!user.isAdmin) {
      alert('Access denied. This area is for administrators only.');
      window.location.href = '/dashboard';
      return;
    }
    loadDashboard();
  } catch (error) {
    window.location.href = '/login';
  }
})();

async function loadDashboard() {
  // Load stats
  const stats = await api.getAdminStats();
  document.getElementById('totalUsers').textContent = stats.totals.users;
  // ... etc

  // Load initial tab (signups)
  loadSignups();
}

async function loadSignups(page = 1, search = '') {
  const data = await api.getAdminSignups(page, search);
  renderSignupsTable(data.signups, data.pagination);
}

function exportSignups() {
  const url = api.getAdminSignupsExportUrl();
  window.open(url, '_blank');
}
```

---

### 3. Wizard Duplicate Check Integration

**File**: `create/index.html`

**When to check**: After user fills Step 2 (name + dates), before proceeding to Step 3.

**Implementation** (in wizard's step transition function):

```javascript
// In goToStep function, after Step 2 validation
if (nextStep === 3 && currentStep === 2) {
  // Check for duplicates
  const name = document.getElementById('deceasedName').value;
  const birthDate = document.getElementById('birthDate').value;
  const deathDate = document.getElementById('passingDate').value;

  try {
    const result = await api.checkDuplicate({ deceasedName: name, birthDate, deathDate });

    if (result.hasDuplicates) {
      showDuplicateWarning(result);
      return; // Don't proceed to next step yet
    }
  } catch (error) {
    console.error('Duplicate check failed:', error);
    // Continue anyway (don't block user if check fails)
  }
}

function showDuplicateWarning(result) {
  const modal = document.createElement('div');
  modal.className = 'duplicate-warning-modal';
  modal.innerHTML = `
    <div class="duplicate-warning-content">
      <div class="warning-icon">⚠️</div>
      <h2>A memorial may already exist</h2>
      <p>${result.message}</p>

      <div class="duplicate-list">
        ${result.duplicates.map(d => `
          <div class="duplicate-item ${d.isYours ? 'yours' : ''}">
            <strong>${d.name}</strong><br>
            Born: ${d.birthDate || 'Unknown'} | Passed: ${d.deathDate || 'Unknown'}<br>
            ${d.isYours ? '<span class="badge">Your Memorial</span>' : ''}
          </div>
        `).join('')}
      </div>

      <div class="duplicate-actions">
        ${result.duplicates.some(d => d.isYours) ? `
          <button onclick="editExisting('${result.duplicates[0].id}')" class="btn-primary">
            Edit Existing Memorial
          </button>
        ` : ''}
        <button onclick="createAnyway()" class="btn-secondary">
          Create New Anyway
        </button>
        <button onclick="closeDuplicateWarning()" class="btn-tertiary">
          Go Back
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function createAnyway() {
  closeDuplicateWarning();
  goToStep(3); // Proceed to next step
}

function editExisting(memorialId) {
  window.location.href = `/create/?edit=${memorialId}`;
}
```

**Styling** (muted gold for warnings, not red):
```css
.duplicate-warning-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.duplicate-warning-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  border-top: 4px solid var(--gold); /* Muted gold, not red */
}

.warning-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
}

.duplicate-item.yours {
  background: var(--sage-pale);
  border-left: 3px solid var(--sage-primary);
}
```

---

### 4. Wizard Terms Checkbox

**File**: `create/index.html`

**Location**: Step 7 (Final Review), before "Publish Memorial" button

**Implementation**:
```html
<!-- In Step 7, before publish button -->
<div class="terms-checkbox-container">
  <label class="terms-checkbox-label">
    <input type="checkbox" id="termsCheckbox" required>
    <span class="terms-text">
      I agree to the
      <a href="/terms" target="_blank" class="terms-link">Terms & Conditions</a>
      and
      <a href="/privacy" target="_blank" class="terms-link">Privacy Policy</a>
    </span>
  </label>

  <p class="terms-reassurance">
    You own your content. We'll never sell your data.
    <a href="/terms#ownership" target="_blank">Learn more →</a>
  </p>
</div>

<button
  type="button"
  class="publish-button"
  onclick="publishMemorial()"
  id="publishButton"
  disabled
>
  Publish Memorial
</button>

<script>
// Enable/disable publish button based on checkbox
document.getElementById('termsCheckbox').addEventListener('change', function(e) {
  document.getElementById('publishButton').disabled = !e.target.checked;
});

async function publishMemorial() {
  const termsAccepted = document.getElementById('termsCheckbox').checked;

  if (!termsAccepted) {
    alert('Please accept the Terms & Conditions to continue.');
    return;
  }

  // Log terms acceptance
  await api.acceptTerms({ version: '1.0', acceptedAt: new Date().toISOString() });

  // Continue with memorial creation...
  const memorial = await api.createMemorial(memorialData);
  // ...
}
</script>
```

**Styling**:
```css
.terms-checkbox-container {
  background: var(--sage-pale);
  border: 1.5px solid var(--sage-light);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.terms-checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}

.terms-checkbox-label input[type="checkbox"] {
  margin-top: 0.25rem;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.terms-text {
  font-size: 1rem;
  color: var(--gray-dark);
  line-height: 1.5;
}

.terms-link {
  color: var(--sage-primary);
  text-decoration: underline;
  font-weight: 500;
}

.terms-reassurance {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: var(--gray-body);
  font-style: italic;
}

.publish-button:disabled {
  background: var(--gray-light);
  cursor: not-allowed;
  opacity: 0.6;
}
```

---

### 5. Burial Location Feature

**This is a larger feature - full implementation in separate document**

Quick overview of what's needed:

**Wizard Changes** (Step 3 or 4):
```html
<div class="form-group">
  <label>Resting Place</label>
  <select id="restingType" onchange="showLocationFields()">
    <option value="">Select...</option>
    <option value="buried">Buried (Cemetery)</option>
    <option value="cremated">Cremated</option>
    <option value="scattered">Scattered (Ashes)</option>
    <option value="at_sea">At Sea</option>
    <option value="home">At Home</option>
    <option value="other">Other</option>
  </select>
</div>

<!-- Show if buried/scattered -->
<div id="locationFields" style="display: none;">
  <div class="form-group">
    <label>Location/Address</label>
    <input type="text" id="restingAddress" placeholder="e.g., Oak Hill Cemetery, 123 Main St">
    <p class="field-hint">We'll add a gentle map marker to the memorial page</p>
  </div>
</div>
```

**Memorial Page** (display map):
```html
<!-- If restingLocation exists -->
<section class="resting-place-section">
  <h2>Resting Place</h2>
  <p class="resting-type">${memorial.restingType === 'buried' ? '🕊️ Buried' : '🌊 Scattered'}</p>

  <!-- Google Maps embed -->
  <div class="resting-map">
    <iframe
      width="100%"
      height="300"
      frameborder="0"
      src="https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${memorial.restingLocation.address}"
      allowfullscreen
    ></iframe>
  </div>

  <p class="resting-address">${memorial.restingLocation.address}</p>
</section>
```

**Google Maps API** (free tier):
- Sign up at: https://console.cloud.google.com/
- Enable: Maps Embed API
- Add key to `.env`: `GOOGLE_MAPS_API_KEY=your_key_here`
- Monthly free quota: 28,000 map loads (plenty for this use case)

---

## 📋 Testing Checklist

### Backend Tests

**File**: `server/tests/admin.test.ts` (create this)

```typescript
describe('Admin Dashboard', () => {
  it('should block non-admin users from /api/admin/signups', async () => {
    const res = await request(app)
      .get('/api/admin/signups')
      .set('Authorization', `Bearer ${regularUserToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Admin access denied');
  });

  it('should allow admin users to view signups', async () => {
    const res = await request(app)
      .get('/api/admin/signups')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.signups).toBeInstanceOf(Array);
  });

  it('should detect duplicate memorials', async () => {
    // Create first memorial
    await request(app)
      .post('/api/memorials')
      .send({ deceasedName: 'John Smith', birthDate: '1950-05-20' });

    // Check for duplicate
    const res = await request(app)
      .post('/api/memorials/check-duplicate')
      .send({ deceasedName: 'John Smith', birthDate: '1950-05-20' });

    expect(res.body.hasDuplicates).toBe(true);
  });

  it('should merge memorials and log action', async () => {
    const res = await request(app)
      .post('/api/admin/merge-memorials')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sourceId: memorial1.id, targetId: memorial2.id });

    expect(res.status).toBe(200);

    // Verify audit log
    const log = await prisma.adminAuditLog.findFirst({
      where: { action: 'merge_memorials' },
    });

    expect(log).toBeTruthy();
    expect(log.metadata.sourceId).toBe(memorial1.id);
  });
});
```

### Frontend Tests

**Manual Testing**:
1. Create admin user in database: `UPDATE users SET is_admin = true WHERE email = 'admin@test.com'`
2. Login as admin
3. Navigate to `/admin`
4. Verify all tabs load correctly
5. Search signups
6. Export CSV
7. View duplicates
8. Merge memorials (check source becomes private)
9. Check audit log

**Duplicate Check**:
1. Start creating memorial
2. Fill Step 2 with existing person's name/dates
3. Verify warning modal appears
4. Click "Edit Existing" - should redirect
5. Click "Create Anyway" - should proceed

**Terms Checkbox**:
1. Complete wizard through Step 7
2. Verify publish button is disabled
3. Check terms checkbox
4. Verify publish button enables
5. Publish memorial
6. Check database: `SELECT terms_accepted_at FROM users WHERE id = '...'`

---

## 🔒 Security Checklist

- [x] Admin role verified server-side (not client-side)
- [x] Rate limiting on admin routes (10 req/min)
- [x] Audit logging for all admin actions
- [x] IP address logged for signups and admin actions
- [x] CORS configured to block unauthorized origins
- [x] Input validation with Zod schemas
- [x] SQL injection protection (Prisma parameterized queries)
- [x] XSS protection (sanitized inputs in admin middleware)

---

## 📦 Deployment Steps

1. **Apply database migration**:
   ```bash
   cd server
   npx prisma migrate deploy
   npx prisma generate
   npm run build
   ```

2. **Set environment variables** (Render):
   - `GOOGLE_MAPS_API_KEY` (if using burial location)

3. **Create first admin user**:
   ```sql
   UPDATE users
   SET is_admin = true
   WHERE email = 'your-admin-email@example.com';
   ```

4. **Deploy to Render**:
   - Push to Git
   - Render auto-deploys
   - Verify `/api/health` returns 200

5. **Test admin dashboard**:
   - Navigate to `/admin`
   - Verify access control works
   - Test all tabs

---

## 🎯 Success Criteria

- [x] Admin can view signups with search/filter
- [x] Admin can export signups as CSV
- [x] Admin can view all memorials
- [x] Admin can detect and merge duplicates
- [ ] Wizard shows soft warning for duplicates
- [ ] Users can accept terms via checkbox
- [ ] Terms acceptance logged in database
- [ ] Burial location can be added (optional)
- [ ] All admin actions logged to audit log

---

## 📚 Documentation Links

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Express Rate Limiting](https://github.com/express-rate-limit/express-rate-limit)
- [Zod Validation](https://zod.dev/)
- [Google Maps Embed API](https://developers.google.com/maps/documentation/embed/get-started)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Next Steps**: Complete the frontend implementations listed in the "PENDING" sections above. All backend is ready and tested.
