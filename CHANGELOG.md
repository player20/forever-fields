# Changelog

All notable changes to the Forever Fields project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0-pet] - 2024-12-04

### Added

#### Pet Memorial Mode System
- **Soft name-triggered prompt** (`js/pet-mode.js`)
  - Detects common pet names (60+ names: dogs, cats, other pets)
  - Luna, Max, Bella, Charlie, Cooper, Daisy, Bailey, Molly, etc.
  - 1-second debounce on name input to avoid annoying prompts
  - Case-insensitive matching with prefix detection (e.g., "Luna the Cat")
  - Friendly modal prompt asking "Creating a Pet Memorial?"
  - Shows benefits: paw print accents, Rainbow Bridge wording, pet songs, pet candle animations
  - 30-day dismissal cooldown to prevent re-prompting too frequently
  - localStorage-based dismissal tracking (key: `ff_pet_mode_dismissed`)

- **Pet Mode Theming** (`css/style.css`)
  - **Paw print decorations** throughout the interface
  - body.pet-mode class triggers pet-specific styling
  - Paw prints before/after content (🐾 emoji)
  - Pet-specific color scheme with warm tones
  - Softer animations and friendlier visual language

- **Pet-Specific Wording**
  - "Date of Birth" → "Gotcha Day (Adoption Date)"
  - "Date of Passing" → "Rainbow Bridge Date"
  - "Born:" → "Gotcha Day:"
  - "Passed:" → "Rainbow Bridge:"
  - "About Them" → "About Your Beloved Pet"
  - Context-aware wording updates in wizard and memorial pages

- **Pet Candle Animation** (`css/style.css`)
  - Custom candle flame animation for pet memorials
  - @keyframes petCandleFlame - Gentle, warm glow
  - Softer color palette (warm yellows and oranges)
  - Applied automatically when body.pet-mode is active

- **Rainbow Bridge Theme** (`css/style.css`)
  - Rainbow gradient for date labels in pet mode
  - Linear gradient: red → orange → yellow → green → blue → purple
  - Applied to .hero-dates with text gradient clipping
  - Warm, comforting visual representation

- **Pet Mode Toggle** (`js/pet-mode.js`)
  - Toggle switch in memorial settings to enable/disable pet mode
  - enablePetMode() - Activates pet theme and wording
  - disablePetMode() - Reverts to human memorial mode
  - togglePetMode() - Switches between modes
  - localStorage persistence (key: `ff_pet_mode_active`)
  - Dispatches petModeChanged custom event for other modules

- **Wizard Integration** (`create/index.html`)
  - Pet mode prompt appears in step 2 (Memorial Basics)
  - Triggers after user types common pet name
  - Hidden input field (isPet) added to form on enable
  - Label and placeholder updates for pet-specific fields
  - Section header changes to "🐾 About Your Beloved Pet"

- **Memorial Page Integration** (`memorial/index.html`)
  - data-is-pet attribute on body element
  - Automatic pet mode initialization on page load
  - Date label updates (Born/Passed → Gotcha Day/Rainbow Bridge)
  - Paw print decorations added via CSS
  - Pet mode indicator in settings

#### Database & Backend
- **isPet field** already in Prisma schema (line 49)
  - Boolean field with default value of false
  - Stored in memorials table as is_pet column
  - Automatically handled by existing CRUD routes
  - Included in memorial creation (POST /api/memorials)
  - Included in memorial updates (PUT /api/memorials/:id)
  - Returned in memorial GET responses

#### Pet Mode Styles
- **Pet Mode Prompt Modal** (`css/style.css`)
  - .pet-mode-prompt-modal - Full-screen overlay
  - .pet-mode-prompt-content - Centered card with rounded corners
  - .pet-mode-prompt-icon - Large paw print emoji (🐾)
  - .pet-mode-features - Bulleted list of pet mode benefits
  - .pet-mode-prompt-actions - Yes/No button group
  - @keyframes petModeBounce - Gentle bounce animation on entry
  - Cream and sage green color scheme matching Forever Fields

- **Pet Mode Body Class** (`css/style.css`)
  - body.pet-mode triggers all pet-specific styling
  - Paw print decorations via ::before and ::after pseudo-elements
  - Positioned at top-right and bottom-left corners
  - Font size: 4rem with opacity: 0.1 for subtle effect
  - Z-index: 0 to stay behind content

- **Pet Candle Styles** (`css/style.css`)
  - body.pet-mode .candle-flame - Custom animation
  - @keyframes petCandleFlame - Warm, gentle glow
  - Softer colors (gold to light yellow)
  - Slower animation speed for calming effect

- **Rainbow Bridge Gradient** (`css/style.css`)
  - body.pet-mode .hero-dates
  - 6-color rainbow gradient (90deg linear)
  - #ff6b6b → #ffa500 → #ffd700 → #90ee90 → #87ceeb → #9370db
  - -webkit-background-clip: text for gradient text effect
  - -webkit-text-fill-color: transparent for proper rendering

- **Pet Mode Toggle Switch** (`css/style.css`)
  - .pet-mode-toggle - Switch control for settings
  - Matches Forever Fields design system
  - Smooth transitions and hover effects
  - Mobile responsive with touch-friendly size

#### Testing
- **Pet Mode Test Suite** (`server/tests/pet-mode.test.js`)
  - 8 comprehensive test scenarios
  - Test 1: Pet mode JS file check (features, functions, pet names)
  - Test 2: Pet mode CSS check (styles, animations, themes)
  - Test 3: Pet name detection logic (60+ names, case-insensitive)
  - Test 4: Pet mode wording changes (Gotcha Day, Rainbow Bridge)
  - Test 5: localStorage persistence (dismissal, active state)
  - Test 6: Pet mode toggle (enable, disable, toggle methods)
  - Test 7: Pet mode animations (bounce, candle, paw prints)
  - Test 8: Integration check (script inclusion in HTML pages)
  - Manual testing checklist included
  - Run with: `npm run test:pet`

### Changed
- **Server version**: `0.7.0-lang` → `0.8.0-pet`
- **Create wizard** (`create/index.html`): Includes pet-mode.js script
- **Memorial page** (`memorial/index.html`): Includes pet-mode.js script and data-is-pet attribute
- **CSS styles** (`css/style.css`): Added 200+ lines of pet mode styling
- **Package.json**: Added test:pet script

### User Experience
- ✅ Soft, name-based pet detection (no forced prompts)
- ✅ Friendly modal with clear benefits list
- ✅ Paw print accents throughout interface
- ✅ "Gotcha Day" and "Rainbow Bridge" wording
- ✅ Rainbow gradient theme for dates
- ✅ Pet-specific candle animations
- ✅ Toggle on/off in settings
- ✅ 30-day dismissal cooldown (respects user preference)
- ✅ Persistent pet mode preference (localStorage)
- ✅ Automatic theme activation on memorial load

### Pet Mode Features
- 🐾 Common Pet Names (60+):
  - Dogs: Max, Bella, Charlie, Lucy, Cooper, Daisy, Bailey, Sadie, Lola, Buddy, Molly, Stella, Tucker, Bear, Zoey, Duke, Maggie, Jack, Sophie, Riley, Chloe, Buster, Penny, Rocky, Ginger, Shadow, Pepper, Oliver, Ruby, Milo
  - Cats: Luna, Oliver, Leo, Milo, Charlie, Simba, Max, Jack, Loki, Tiger, Smokey, Shadow, Kitty, Mittens, Oreo, Whiskers, Felix, Chloe, Sophie, Misty
  - Other: Snowball, Midnight, Patches, Peanut, Cookie, Fluffy, Angel, Princess, Buddy, Gizmo

- 🌈 Rainbow Bridge Theming:
  - Six-color gradient for memorial dates
  - Warm, comforting visual representation
  - Automatically applied when pet mode is active

- 🕯️ Pet Candle Animations:
  - Softer, gentler flame animation
  - Warm color palette (gold to light yellow)
  - Slower animation speed for calming effect

- 🐾 Paw Print Accents:
  - Subtle decorations at corners of page
  - Low opacity (0.1) to avoid distraction
  - Scalable (4rem font size) for visibility
  - Behind content (z-index: 0)

### Security
All security features from previous versions maintained:
- ✅ isPet field validated in Zod schemas
- ✅ Role checks on memorial updates (existing)
- ✅ No new security concerns introduced
- ✅ Client-side only pet mode logic (no API changes)
- ✅ localStorage safely stores user preferences

### Browser Support
- ✅ Chrome/Edge (Desktop & Mobile) - Full support
- ✅ Firefox (Desktop & Mobile) - Full support
- ✅ Safari (iOS & macOS) - Full support
- ✅ All modern browsers with localStorage and CSS3 support

---

## [0.7.0-lang] - 2024-12-04

### Added

#### Multilingual Support System
- **8 Language Support** (`js/language-switcher.js`)
  - English (en) - Default
  - Español (es) - Spanish
  - Tiếng Việt (vi) - Vietnamese
  - العربية (ar) - Arabic with RTL support
  - Tagalog (tl) - Filipino
  - Français (fr) - French
  - Português (pt) - Portuguese
  - 中文 (zh) - Chinese (Simplified)

- **Auto-Detection** on First Visit
  - Detects browser language using `navigator.language`
  - Falls back to localStorage if previously set
  - Defaults to English if language not supported
  - Automatic language code extraction (e.g., es-ES → es)
  - Smart detection for regional variants

- **Translation Engine**
  - Google Translate API integration (free tier)
  - Batch translation for performance (50 items per batch)
  - Intelligent text extraction (direct text only, preserves child elements)
  - Placeholder, title, and aria-label translation
  - CSS pseudo-element translation support
  - Smooth transition effects during translation
  - Fallback to English on API errors

- **Language Switcher UI**
  - Globe icon dropdown in header
  - 8 language options with native names
  - Current language code display
  - Active language highlighting
  - Smooth dropdown animations
  - Mobile-responsive select menu
  - Keyboard navigation (Arrow keys, Enter, Escape)
  - Click-outside to close

- **RTL (Right-to-Left) Support**
  - Automatic direction switching for Arabic
  - HTML `dir` attribute management
  - RTL-specific class (`rtl-active`) for styling
  - Preserved layout integrity for RTL languages

- **Persistence & Storage**
  - localStorage key: `ff_language`
  - Language preference saved on selection
  - Automatic restoration on page load
  - Persists across sessions

- **Dynamic Content Translation**
  - MutationObserver for new content
  - Auto-translates dynamically added elements
  - Debounced translation (500ms) for performance
  - Preserves original text in memory Map
  - Restores original when switching back to English

- **Smart Content Filtering**
  - Skips user-generated content (memorials, names, dates)
  - Preserves proper names and email addresses
  - Skips code, scripts, and style elements
  - Respects `data-no-translate` attribute
  - Date format detection and preservation

- **Accessibility Features**
  - ARIA attributes (aria-expanded, aria-label)
  - Full keyboard navigation
  - Focus management
  - Screen reader friendly
  - Semantic HTML structure

#### Testing
- **Multilingual Test Suite** (`server/tests/multilingual.test.js`)
  - 8 comprehensive test scenarios
  - Test 1: Language switcher file check
  - Test 2: HTML integration verification
  - Test 3: Translation API connectivity
  - Test 4: Browser language detection simulation
  - Test 5: RTL support validation
  - Test 6: localStorage persistence check
  - Test 7: Dynamic content translation
  - Test 8: Accessibility features audit
  - Run with: `npm run test:lang`

### Changed
- **Server version**: `0.6.0-pwa` → `0.7.0-lang`
- **All HTML pages**: Include language-switcher.js script
- **Header**: Language switcher dropdown added
- **html element**: Dynamic `lang` and `dir` attributes

### User Experience
- ✅ Auto-detect browser language on first visit
- ✅ Dropdown with 8 language options
- ✅ Native language names for easy recognition
- ✅ Smooth translation transitions
- ✅ Persistent language preference
- ✅ RTL layout for Arabic
- ✅ Dynamic content automatically translated
- ✅ Keyboard navigation support
- ✅ Mobile-friendly select menu

### Browser Support
- ✅ Chrome/Edge (Desktop & Mobile) - Full support
- ✅ Firefox (Desktop & Mobile) - Full support
- ✅ Safari (iOS & macOS) - Full support
- ✅ Samsung Internet - Full support
- ⚠️  Older browsers - May need polyfills for fetch API

### Security & Privacy
- ✅ No personal data sent to translation API
- ✅ Client-side translation (no server logs)
- ✅ Original text stored in memory only
- ✅ No API key required (public endpoint)
- ✅ Safe HTML injection (textContent only)
- ✅ XSS prevention (no innerHTML usage)

---

## [0.6.0-pwa] - 2024-12-04

### Added

#### Progressive Web App (PWA) Features
- **PWA Manifest** (`manifest.json`)
  - Complete manifest with name, icons, and theme colors
  - App shortcuts for Create Memorial and Dashboard
  - Share target integration for memorial creation
  - Optimized for mobile and desktop installation
  - Forever Fields branding (sage green theme color)

- **Service Worker** (`service-worker.js`)
  - Offline caching strategy for core assets
  - Cache-first with network fallback for pages
  - Network-first for API requests
  - Automatic cache versioning and cleanup
  - Push notification handling
  - Background sync support (for future features)
  - Update detection and user prompts

- **Smart Install Banner** (`js/pwa.js`)
  - Appears after 10 seconds on mobile devices
  - Deferred prompt handling for better UX
  - Dismissal with 7-day cooldown period
  - Smooth slide-up animation
  - Install/Close actions with analytics
  - Respects user preferences (localStorage)

- **PWA Install Styles** (`css/style.css`)
  - Branded install banner with sage green gradient
  - Responsive design for mobile and tablet
  - Update available notification banner
  - Smooth animations and transitions
  - Accessibility-friendly (keyboard navigation, ARIA labels)

#### Push Notification System
- **Web Push Integration** (`server/src/routes/push.ts`)
  - Full web-push npm package integration
  - VAPID key configuration and validation
  - Subscription management (create, read, delete)
  - GET `/api/push/vapid-public-key` - Public key for subscriptions
  - POST `/api/push/subscribe` - Save push subscription (auth required)
  - DELETE `/api/push/unsubscribe` - Remove subscription (auth required)
  - GET `/api/push/subscriptions` - List user subscriptions (auth required)
  - POST `/api/push/send` - Send notification to user or memorial (auth required)

- **Push Notification Triggers**
  - `sendCandleLitNotification()` - Notify when candle is lit
  - `sendMemoryAddedNotification()` - Notify when memory is shared
  - `sendAnniversaryNotification()` - Notify on memorial anniversaries
  - Automatic cleanup of expired/invalid subscriptions (410 Gone)
  - Retry logic with exponential backoff
  - Error handling and logging

- **Enhanced Candle Route** (`server/src/routes/candles.ts`)
  - Integrated push notification trigger
  - Sends notification to memorial owner on candle lit
  - Non-blocking async notification dispatch
  - Graceful error handling (doesn't block candle creation)

- **Push Notification Client** (`js/pwa.js`)
  - `subscribeToPushNotifications()` - Request permission and subscribe
  - `unsubscribeFromPushNotifications()` - Unsubscribe from push
  - `isPushNotificationsEnabled()` - Check subscription status
  - VAPID public key fetching
  - Subscription persistence in localStorage
  - Auto-sync when user logs in

- **Service Worker Push Handlers** (`service-worker.js`)
  - Push event handler with JSON payload parsing
  - Rich notifications with title, body, icon, badge
  - Custom actions (View, Dismiss)
  - Notification click handling (open memorial page)
  - Notification close tracking
  - Vibration patterns for mobile devices

#### HTML Integration
- **PWA Meta Tags** (added to all HTML pages)
  - `<link rel="manifest" href="/manifest.json">`
  - `<meta name="theme-color" content="#A7C9A2">`
  - Apple mobile web app meta tags
  - Service worker script inclusion

#### Testing
- **PWA & Push Test Suite** (`server/tests/pwa-push.test.js`)
  - 8 comprehensive test scenarios
  - Test 1: Get VAPID public key
  - Test 2: Subscribe to push notifications
  - Test 3: Get user subscriptions
  - Test 4: Send test push notification
  - Test 5: Light candle (trigger push)
  - Test 6: Unsubscribe from push
  - Test 7: PWA manifest check
  - Test 8: Service worker check
  - Manual testing checklist included
  - Run with: `npm run test:pwa`

### Changed
- **Server version**: `0.4.0-wow` → `0.6.0-pwa` (skipped v0.5 chronologically, but v0.5-song exists)
- **Candles API**: Now triggers push notifications to memorial owners
- **HTML pages**: All pages now include PWA manifest and service worker
- **API Client**: Enhanced with push subscription methods

### Security
All security features maintained plus:
- ✅ VAPID keys for authenticated push (requires configuration)
- ✅ Push subscription requires authentication
- ✅ Push sending requires authentication
- ✅ Rate limiting on all push endpoints
- ✅ Endpoint validation and sanitization
- ✅ Automatic cleanup of invalid subscriptions
- ✅ No sensitive data in push payloads
- ✅ Service worker scope restricted to origin

### User Experience
- ✅ Install app to home screen (iOS and Android)
- ✅ Works offline (cached pages load)
- ✅ Push notifications for new candles
- ✅ Push notifications for new memories
- ✅ Anniversary reminders (scheduled)
- ✅ Smart install prompt (appears after engagement)
- ✅ Update notifications (new version available)
- ✅ Standalone app mode (no browser UI)

### Configuration Required
To enable push notifications, you must:
1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Add to `.env` file:
   ```
   VAPID_PUBLIC_KEY=<your-public-key>
   VAPID_PRIVATE_KEY=<your-private-key>
   VAPID_SUBJECT=mailto:support@foreverfields.com
   ```
3. Restart server

### Browser Support
- ✅ Chrome/Edge (Desktop & Mobile) - Full support
- ✅ Firefox (Desktop & Mobile) - Full support
- ✅ Safari (iOS 16.4+) - Full support (PWA + Push)
- ✅ Samsung Internet - Full support
- ⚠️  Safari (macOS) - PWA install manual, push supported

---

## [0.5.0-song] - 2024-12-04

### Added

#### Favorite Song Player System
- **Song player with Spotify and YouTube support**
  - Spotify iframe embeds for 30-second previews (or full song if logged in)
  - YouTube iframe embeds for full song playback
  - Automatic platform detection from URLs
  - Modal-based player with clean UI

- **Wizard Integration** (`create/index.html`)
  - New "Their Favorite Song" section in step 4 (Memories)
  - Single URL input field accepting Spotify or YouTube links
  - Real-time URL validation with platform detection
  - Visual feedback showing which platform was detected
  - Pattern validation for correct URL formats

- **Memorial Page Player** (`memorial-template/js/memorial.js`)
  - Play button shows when song is available
  - Modal player with embedded Spotify or YouTube iframe
  - Automatic song ID extraction from URLs
  - Stop playback when modal closes
  - Keyboard support (ESC to close)
  - Toast notifications for feedback

- **URL Validation**
  - Supports Spotify track URLs: `https://open.spotify.com/track/[ID]`
  - Supports YouTube full URLs: `https://www.youtube.com/watch?v=[ID]`
  - Supports YouTube short URLs: `https://youtu.be/[ID]`
  - Client-side validation with regex patterns
  - Visual feedback (green border for valid, red for invalid)

#### UI Components
- **Song URL Field** with validation
  - Placeholder examples for both platforms
  - Real-time platform detection
  - Character validation with regex
  - Help text with URL format examples

- **Song Player Modal** (`memorial-template/css/memorial.css`)
  - Responsive design (max-width: 600px)
  - 380px height for optimal embed size
  - Cream background with rounded corners
  - Platform info text (30-sec preview vs. full song)
  - Smooth animations and transitions

- **JavaScript Handlers**
  - `toggleSong()` - Opens song player modal
  - `createSongPlayerModal()` - Dynamically creates modal
  - `loadSongPlayer(url, platform)` - Loads appropriate embed
  - `closeSongPlayer()` - Closes modal and stops playback
  - `detectSongPlatform(url)` - Detects Spotify or YouTube
  - `extractSpotifyId(url)` - Extracts Spotify track ID
  - `extractYoutubeId(url)` - Extracts YouTube video ID

#### Testing
- **Song Player Test Suite** (`server/tests/song-player.test.js`)
  - 8 comprehensive test scenarios
  - Tests Spotify URL creation and retrieval
  - Tests YouTube URL creation and retrieval
  - Tests YouTube short URL (youtu.be) format
  - Tests updating song URLs
  - Tests memorials with both URLs present
  - Tests ID extraction for both platforms
  - Verifies embed URL generation
  - Run with: `npm run test:song`

### Changed
- **Server version**: `0.3.0-qr` → `0.5.0-song`
- **Memorial wizard**: Enhanced step 4 with song URL field
- **Memorial template**: Replaced placeholder song button with functional player

### Database Schema
No database changes required - uses existing fields:
- `memorial.songSpotifyUri` - Spotify track URL
- `memorial.songYoutubeUrl` - YouTube video URL

### Security
All security features from previous versions maintained:
- ✅ URL validation (client-side regex patterns)
- ✅ Iframe sandboxing for embeds
- ✅ No sensitive data in song URLs
- ✅ Role checks on memorial updates (existing)

### Testing
- ✅ 8 new song player tests
- ✅ Tests both Spotify and YouTube integrations
- ✅ Tests URL parsing and ID extraction
- ✅ Tests both URL formats (full and short)
- ✅ Verifies embed URL generation

---

## [0.4.0-wow] - 2024-12-04

### Added

#### Time Capsule System
- **Time capsule creation with delayed reveal**
  - Users can create messages for future unlock dates
  - Supports text messages, voice recordings, and video messages
  - Automatic unlock on specified date
  - All time capsules go through pending queue for approval

- **Backend Time Capsule Routes** (`server/src/routes/timeCapsules.ts`)
  - `POST /api/time-capsules` - Create new time capsule (public access)
    - Validates unlock date is in the future
    - Only allows time capsules on public/link-accessible memorials
    - Creates pending item with type 'time_capsule'
    - Rate limited for abuse prevention
  - `GET /api/time-capsules/:memorialId` - Get unlocked time capsules
    - Fetches approved time capsule pending items
    - Filters by unlock date (only shows if unlockDate <= now)
    - Returns transformed time capsule objects
    - Public access (no auth required)
  - `POST /api/time-capsules/:id/open` - Mark capsule as opened
    - Records opened timestamp for statistics
    - Validates capsule is unlocked before allowing open
    - Rate limited

- **Wizard Time Capsule UI** (`create/index.html`)
  - New "Time Capsule" section in step 4 (Memories)
  - Message textarea with 1000 character limit and live counter
  - Unlock date picker with future date validation
  - Voice recording upload button (50MB max)
  - Video upload button (50MB max)
  - Media preview showing attached file name and size
  - Remove media button to clear selections
  - Moderation reassurance message (approval required)

- **API Client Methods** (`memorial-template/js/api-client.js`)
  - `getTimeCapsules(memorialId)` - Fetch unlocked capsules
  - `createTimeCapsule(capsuleData)` - Create new time capsule
  - `openTimeCapsule(capsuleId)` - Mark capsule as opened
  - All methods use noAuth for public access

#### First Candle Celebration System
- **First candle detection and celebration**
  - Detects when the first candle is lit on a memorial
  - Triggers special golden glow animation
  - Personalized message with deceased's name
  - Auto-dismisses after 5 seconds

- **Enhanced Candle Route** (`server/src/routes/candles.ts`)
  - Modified `POST /api/candles` to detect first candle
  - Counts existing candles before creation
  - Returns `isFirstCandle` boolean flag
  - Returns `totalCandles` count
  - Maintains existing rate limiting and validation

- **First Candle Celebration Animation** (`memorial-template/js/memorial.js`)
  - `showFirstCandleCelebration()` function
  - Dynamically creates celebration overlay
  - Shows large candle emoji with pulsing animation
  - "First Candle Lit!" title
  - Personalized message: "You just lit the first candle on [Name]'s memorial"
  - Golden glow radial gradient background effect
  - Smooth entrance/exit animations

- **Celebration Styles** (`memorial-template/css/memorial.css`)
  - `.first-candle-celebration` - Full-screen overlay with dark backdrop
  - `.celebration-content` - Centered card with cream gradient
  - `.celebration-candle` - Large emoji (5rem) with glow animation
  - `@keyframes celebration-slide-up` - Entrance animation
  - `@keyframes candle-glow` - Pulsing candle with drop-shadow
  - `@keyframes glow-pulse` - Radial gradient background pulse
  - `.celebration-title` - Gold serif title with text-shadow
  - `.golden-glow` - Radial gradient overlay effect

#### Testing
- **Time Capsule & First Candle Test Suite** (`server/tests/time-capsule-first-candle.test.js`)
  - 7 comprehensive test scenarios with colored console output
  - Test 1: Create time capsule with future unlock date
  - Test 2: Verify locked capsules don't show
  - Test 3: Create time capsule with past date (already unlocked)
  - Test 4: Light first candle (triggers celebration)
  - Test 5: Light second candle (no celebration)
  - Test 6: Retrieve all candles
  - Test 7: Validation tests (past dates, private memorials)
  - Run with: `npm run test:wow`

### Changed
- **Server version**: `0.3.0-qr` → `0.4.0-wow`
- **Candle API response**: Now includes `isFirstCandle` and `totalCandles`
- **Memorial wizard**: Enhanced step 4 with time capsule section
- **Memorial template**: Added celebration animation for first candle

### Database Schema
Uses existing schema:
- `pendingItem.type = 'time_capsule'` - Time capsules stored as pending items
- `pendingItem.dataJson` - Stores messageText, voiceUrl, videoUrl, unlockDate
- `candle` table - No changes required

### Security
All security features maintained:
- ✅ Time capsules require approval (pending queue)
- ✅ Unlock date validation (must be in future)
- ✅ Privacy checks (no time capsules on private memorials)
- ✅ Rate limiting on all endpoints
- ✅ Zod validation for input data
- ✅ File size limits (50MB for voice/video)

### User Experience
- ✅ First candle milestone celebrated with animation
- ✅ Time capsules revealed automatically on unlock date
- ✅ Clear feedback on time capsule approval process
- ✅ Media upload previews with file info
- ✅ Character counters for message fields
- ✅ Visual validation for unlock dates

---

## [0.3.0-qr] - 2024-12-04

### Added

#### QR Code Generation System
- **QR code generator** with `qrcode` npm package (v1.5.3)
  - High error correction level (H) for reliability
  - Customizable colors and dimensions
  - Data URL and buffer output formats
  - Automatic Cloudinary upload and storage

- **4 Design Templates** with Cloudinary transformations
  - **Minimalist** - Clean white/sage design with no overlay
  - **Marble** - Elegant gray marble texture with gold border
  - **Garden** - Natural sage/green pattern with botanical feel
  - **Gold Filigree** - Ornate cream/gold with decorative overlay
  - Each design uses Cloudinary overlays for professional appearance

- **Backend QR Routes** (`server/src/routes/qr.ts`)
  - Enhanced `GET /api/qr/:memorialId` - Generate and return QR code
  - Query params: `?design=<design>&download=<true|false>`
  - Generates QR linking to memorial page
  - Uploads to Cloudinary with design transformations
  - Stores QR metadata in database
  - Public access (no authentication required)
  - Rate limited for abuse prevention

#### Prayer Card PDF System
- **Printable 4x6" prayer cards** using `pdfmake` (v0.2.10)
  - **Front side**: Portrait, name, dates, age, biography, decorative borders
  - **Back side**: QR code, scanning instructions, Forever Fields branding
  - Professional PDF generation with custom page dimensions (288x432 points)
  - Integrated QR code generation for back of card
  - Different messaging for pets vs. humans
  - Automatic age calculation

- **Backend Prayer Card Routes** (`server/src/routes/prayer-card.ts`)
  - New `GET /api/prayer-card/:memorialId` - Generate and download PDF
  - Query params: `?design=<design>` (for QR code design)
  - Returns PDF as downloadable attachment
  - File naming: `prayer-card-<Name>.pdf`
  - Public access with rate limiting

#### UI Components (Memorial Template)
- **Share & Download Section** (`memorial-template/index.html`)
  - New section after memorial actions
  - QR Code download button with design selector
  - Prayer Card download button with PDF generation
  - Responsive grid layout

- **QR Design Modal** with visual design picker
  - 4 clickable design options with previews
  - Emoji icons representing each design style
  - Instant download on selection
  - Toast notifications for feedback

- **Prayer Card Modal** with download confirmation
  - Simple download interface
  - PDF generation explanation
  - One-click download button

- **CSS Styling** (`memorial-template/css/memorial.css`)
  - `.download-actions` - Responsive grid of download buttons
  - `.download-action-btn` - Card-style action buttons with hover effects
  - `.qr-designs` - Design picker grid layout
  - `.qr-design-option` - Individual design cards with gradients
  - All styles follow Forever Fields design system

- **JavaScript Handlers** (`memorial-template/js/memorial.js`)
  - `openQRModal()` - Opens QR design selector
  - `handleQRDownload(design)` - Downloads QR with selected design
  - `openPrayerCardModal()` - Opens prayer card modal
  - `handlePrayerCardDownload()` - Triggers PDF download
  - Toast notifications for all actions
  - Modal close handlers (overlay click, X button, ESC key)

#### API Client Enhancements (`memorial-template/js/api-client.js`)
- `generateQRCode(memorialId, design)` - Generate QR code
- `getQRCodeDownloadUrl(memorialId, design)` - Get download URL
- `createQRCode(memorialId, design)` - Create/update QR record
- `getPrayerCardDownloadUrl(memorialId, design)` - Get PDF URL
- `downloadPrayerCard(memorialId, design)` - Trigger PDF download

#### Testing
- **QR & Prayer Card Test Suite** (`server/tests/qr-prayer-card.test.js`)
  - 8 comprehensive test scenarios
  - Tests all 4 QR code designs
  - Tests QR code download endpoint
  - Tests prayer card PDF generation
  - Tests prayer card with design parameter
  - Tests rate limiting
  - Tests 404 handling for non-existent memorials
  - Run with: `npm run test:qr`

### Changed
- **Server version**: `0.2.0-photos` → `0.3.0-qr`
- **Server package.json**: Added `qrcode`, `pdfmake`, and type definitions

### Dependencies Added
- `qrcode` (^1.5.3) - QR code generation
- `pdfmake` (^0.2.10) - PDF document generation
- `html2canvas` (^1.4.1) - Future use for custom PDF rendering
- `@types/qrcode` (^1.5.5) - TypeScript types
- `@types/pdfmake` (^0.2.9) - TypeScript types

### Security
All security features from previous versions maintained plus:
- ✅ Rate limiting on QR and PDF endpoints (public access)
- ✅ Memorial ID validation (Zod schemas)
- ✅ 404 responses for non-existent memorials
- ✅ No sensitive data exposure in QR codes or PDFs
- ✅ Cloudinary signed uploads for QR code storage

### Testing
- ✅ 8 new QR & prayer card tests
- ✅ Tests all 4 QR code design templates
- ✅ Tests PDF generation and download
- ✅ Tests rate limiting and error handling
- ✅ Tests 404 responses for invalid memorial IDs

---

## [0.2.0-photos] - 2024-12-04

### Added

#### Photo Upload System
- **Unlimited photo uploads** with Cloudinary integration
  - Cloudinary npm package (v2) for signed uploads
  - Auto-optimization (WebP format, quality auto:good)
  - AI content moderation (AWS Rekognition via `aws_rek:explicit`)
  - Auto-tagging (aws_rek_tagging with 60% confidence)
  - Responsive breakpoints (5 sizes from 200px-1600px)

- **Backend Upload Routes** (`server/src/routes/uploads.ts`)
  - Enhanced `POST /api/uploads/sign` - Get signed Cloudinary URL
  - New `POST /api/uploads/complete` - Complete upload (creates pending item)
  - New `GET /api/uploads/memorial/:memorialId` - Get approved photos (public)

- **Drag-Drop Photo Uploader** (`memorial-template/js/photo-uploader.js`)
  - PhotoUploader class with full drag-and-drop support
  - Multiple file handling (up to 20 photos, 10MB each)
  - FileReader for client-side previews before upload
  - Real-time progress tracking
  - Direct Cloudinary upload with signed parameters
  - Error handling with toast notifications

- **Photo Gallery** (memorial page integration)
  - Responsive grid layout for approved photos
  - Click to view full-size in modal
  - Lazy loading for performance
  - Integrated into memorial template

- **Wizard Photo Upload Step** (`create/index.html`)
  - New step 5 in memorial creation wizard
  - Integrated PhotoUploader component
  - 7-step wizard (was 6 steps)

- **Photo Upload Test Suite** (`server/tests/photo-upload.test.js`)
  - 8 comprehensive test scenarios
  - Tests upload → pending → approve → view workflow
  - Tests rejection workflow
  - Run with: `npm run test:photos`

#### API Client Enhancements
- `completeUpload(memorialId, cloudinaryResult)` - Complete Cloudinary upload
- `getMemorialPhotos(memorialId)` - Get approved photos (public access)

### Changed
- **Server version**: `0.1.0-memorial` → `0.2.0-photos`
- **Memorial wizard**: Expanded from 6 to 7 steps (added Photos step)

### Security
All security features from v0.1-memorial maintained plus:
- ✅ AI content moderation (explicit content detection)
- ✅ Role checks on uploads (owner/editor only)
- ✅ Rate limiting on uploads (10 per 15 min)
- ✅ File type validation (images only)
- ✅ File size limits (10MB max per photo)
- ✅ Moderation queue (all photos require approval)
- ✅ Cloudinary signed uploads (no direct public access)

### Testing
- ✅ 8 new photo upload tests
- ✅ All tests pass with valid ACCESS_TOKEN
- ✅ Full workflow coverage (upload/approve/reject/view)

---

## [0.1.0-memorial] - 2024-12-04

### Added

#### Memorial Template (`memorial-template/`)
- **Beautiful memorial page template** with warm, compassionate design
  - Responsive HTML/CSS/JS template
  - Forever Fields design system (sage greens, creams, golds)
  - Playfair Display serif + Inter sans-serif typography
  - Mobile, tablet, and desktop optimized

- **Complete API integration**
  - `api-client.js` - Full API communication layer
  - `memorial.js` - Page controller and interactions
  - Automatic memorial data loading
  - Candle lighting (public, no auth required)
  - Time capsule display (unlocked only)
  - Privacy-aware rendering (public/link/private)

- **Interactive features**
  - Virtual candle lighting with modal
  - Memory sharing form (UI ready)
  - Toast notifications
  - Song playback placeholder
  - Character counters
  - Loading and error states

- **Accessibility**
  - Full keyboard navigation
  - Screen reader friendly (ARIA labels)
  - Reduced motion support
  - Semantic HTML structure
  - Focus indicators

- **Demo page** (`memorial-template/demo/index.html`)
  - Live feature demonstration
  - Usage examples
  - API integration guide
  - Testing instructions

#### Backend Enhancements

- **Memorial CRUD routes** (verified and documented)
  - `POST /api/memorials` - Create memorial
  - `GET /api/memorials/mine` - List owned memorials
  - `GET /api/memorials/:id` - View memorial (public access)
  - `PUT /api/memorials/:id` - Update memorial (owner only)
  - `DELETE /api/memorials/:id` - Delete memorial (owner only)

- **Comprehensive test suite** (`server/tests/memorial-crud.test.js`)
  - 10 test scenarios
  - Full CRUD flow coverage
  - Security testing (unauthorized access, privacy, duplicates)
  - Input validation testing
  - Candle lighting integration test
  - Automatic cleanup
  - Run with: `npm run test:memorial`

- **Enhanced package.json**
  - Added `test:memorial` script
  - Version bumped to 0.1.0-memorial

#### Documentation

- **Memorial Template README** (`memorial-template/README.md`)
  - Quick start guide
  - Customization instructions
  - API integration details
  - Privacy modes explained
  - Testing guide
  - Browser support matrix

- **CHANGELOG.md** (this file)
  - Semantic versioning
  - Keep a Changelog format
  - Detailed feature tracking

### Changed

- **Server version**: `0.0.0-secure-backend` → `0.1.0-memorial`
- **Package.json scripts**: Added memorial-specific tests

### Security

All security features from v0.0-secure-backend are maintained:
- ✅ Magic link authentication (15-min expiry, single-use)
- ✅ Rate limiting (3/min candles, 100/min general API)
- ✅ Role-based access control (owner/editor/viewer)
- ✅ Input validation with Zod on all routes
- ✅ Privacy enforcement (public/link/private)
- ✅ XSS protection in memorial template
- ✅ CORS and HTTPS enforcement
- ✅ No error detail leakage

### Testing

- ✅ 10 new memorial CRUD tests
- ✅ All tests pass with valid ACCESS_TOKEN
- ✅ Security tests for unauthorized access
- ✅ Privacy mode enforcement tests
- ✅ Duplicate prevention tests
- ✅ Public candle lighting tests

---

## [0.0.0-secure-backend] - 2024-12-03

### Added

#### Backend Infrastructure

- **Complete Node.js 20 + Express backend**
  - TypeScript strict mode
  - Production-ready architecture
  - Graceful shutdown handling
  - Environment validation with Zod

- **Database (Prisma + Supabase PostgreSQL)**
  - 10 tables with Row Level Security (RLS) comments
  - users, memorials, pending_items, invitations
  - candles, time_capsules, social_links, qrcodes
  - push_subscriptions, magic_links
  - Unique constraints for duplicate prevention
  - Optimized indexes

- **Authentication System**
  - Magic link authentication (passwordless)
  - 32-character cryptographically secure tokens
  - 15-minute expiration
  - Single-use tokens
  - Supabase Auth integration
  - JWT token management

- **Security Implementation**
  - Helmet.js (CSP, HSTS, XSS protection)
  - CORS restricted to frontend URL
  - Rate limiting (5/15min auth, 100/15min general)
  - HTTPS enforcement in production
  - Zod validation on all routes
  - SQL injection prevention (Prisma ORM)
  - No error detail leakage

- **API Routes** (22 endpoints)
  - Auth: magic-link, callback
  - Memorials: CRUD operations
  - Candles: light, get
  - Time Capsules: create, get, open
  - Uploads: Cloudinary signed URLs
  - Pending Items: approve, reject
  - QR Codes: create, get
  - Push Notifications: subscribe, unsubscribe

- **Middleware**
  - Authentication (JWT verification)
  - Authorization (role-based access)
  - Rate limiting (multiple tiers)
  - Input validation (Zod schemas)
  - Error handling (secure)

#### Deployment

- **Docker** (`Dockerfile`)
  - Multi-stage build
  - Non-root user
  - Health checks
  - Production optimized

- **Render.com** (`render.yaml`)
  - One-click deployment
  - Auto-scaling configuration
  - Environment variable management

#### Documentation (4,000+ lines)

- **README.md** - Complete project documentation
- **QUICKSTART.md** - 10-minute setup guide
- **DEPLOYMENT.md** - Production deployment with Supabase RLS SQL
- **SECURITY.md** - OWASP Top 10 mitigation details
- **PROJECT_SUMMARY.md** - Complete overview

#### Testing

- **Integration test suite** (`server/tests/integration.test.js`)
  - 10 comprehensive test scenarios
  - Magic link authentication flow
  - Memorial CRUD operations
  - Security testing (rate limits, unauthorized access)
  - Run with: `npm test`

#### Setup Scripts

- **Linux/Mac**: `scripts/setup.sh`
- **Windows**: `scripts/setup.bat`
- **Automated**: dependency installation, Prisma generation, migrations

### Security Highlights

- ✅ **OWASP Top 10** - All vulnerabilities mitigated
- ✅ **Magic Links** - 15-min expiry, single-use, 32-char tokens
- ✅ **Rate Limiting** - Multi-tier protection
- ✅ **Input Validation** - Zod schemas on all routes
- ✅ **Privacy Controls** - Public/link/private memorials
- ✅ **Duplicate Prevention** - Unique constraints enforced
- ✅ **Role-Based Access** - Owner/editor/viewer permissions

### Infrastructure

- **Free Tier Compatible** - $0/month to start
  - Render.com (web hosting)
  - Supabase (database + auth)
  - Cloudinary (file storage)
  - SendGrid (email)

---

## Versioning

- **v0.0.x** - Secure backend foundation
- **v0.1.x** - Memorial CRUD + template
- **v0.2.x** - Grief support features (planned)
- **v0.3.x** - Family tree features (planned)
- **v1.0.0** - Full production release (planned)

---

**Legend**:
- `Added` - New features
- `Changed` - Changes to existing functionality
- `Deprecated` - Features marked for removal
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security improvements
