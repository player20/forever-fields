/**
 * Demo Data Store
 * Provides persistent storage for demo mode using a JSON file
 * Data persists across server restarts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// Path to the demo data file (in project root)
const DATA_DIR = join(process.cwd(), "data");
const DATA_FILE = join(DATA_DIR, "demo-memorials.json");

// Types for demo data
export interface DemoMemorial {
  id: string;
  slug: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  nickname: string | null;
  birth_date: string | null;
  death_date: string | null;
  birth_place: string | null;
  resting_place: string | null;
  obituary: string | null;
  profile_photo_url: string | null;
  cover_photo_url: string | null;
  is_public: boolean;
  privacy_level: string;
  view_count: number;
  user_id: string;
  theme: string;
  created_at: string;
  updated_at: string;
  photos: DemoPhoto[];
  stories: DemoStory[];
  guestbook_entries: DemoGuestbookEntry[];
  candle_lightings: DemoCandleLighting[];
  events: DemoEvent[];
  timeline_events?: DemoTimelineEvent[];
  ai_features_enabled?: boolean;
}

export interface DemoPhoto {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
}

export interface DemoStory {
  id: string;
  title: string;
  content: string;
  author: string;
  relationship: string | null;
  created_at: string;
}

export interface DemoGuestbookEntry {
  id: string;
  name: string;
  message: string;
  created_at: string;
}

export interface DemoCandleLighting {
  id: string;
  name: string | null;
  message: string | null;
  lit_at: string;
}

export interface DemoEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
}

export interface DemoTimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  icon?: string;
}

interface DemoStore {
  memorials: Record<string, DemoMemorial>;
  users: Record<string, DemoUser>;
}

interface DemoUser {
  id: string;
  email: string;
  name: string;
  subscription_tier: string;
}

// Default demo data
const DEFAULT_DEMO_DATA: DemoStore = {
  users: {
    "demo-user-123": {
      id: "demo-user-123",
      email: "demo@foreverfields.com",
      name: "Demo User",
      subscription_tier: "heritage",
    },
  },
  memorials: {
    "demo-memorial-1": {
      id: "demo-memorial-1",
      slug: "margaret-rose-sullivan",
      first_name: "Margaret",
      middle_name: "Rose",
      last_name: "Sullivan",
      nickname: "Maggie",
      birth_date: "1935-06-15",
      death_date: "2023-11-28",
      birth_place: "Boston, MA",
      resting_place: "Oak Hill Cemetery, Boston",
      obituary:
        "Margaret Rose Sullivan, beloved mother, grandmother, and friend, passed peacefully surrounded by family. Known for her warm smile and legendary apple pie, Maggie touched countless lives with her kindness and generosity. She was a devoted volunteer at the local library for over 30 years and never missed a Sunday dinner with family.",
      profile_photo_url: null,
      cover_photo_url: null,
      is_public: true,
      privacy_level: "public",
      view_count: 342,
      user_id: "demo-user-123",
      theme: "garden",
      created_at: "2023-12-01T10:00:00Z",
      updated_at: "2024-01-15T14:30:00Z",
      photos: [
        {
          id: "p1",
          url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80",
          caption: "Family Christmas 2022",
          taken_at: "2022-12-25",
        },
        {
          id: "p2",
          url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
          caption: "In her beloved garden",
          taken_at: "2020-06-15",
        },
        {
          id: "p3",
          url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
          caption: "Wedding day, 1958",
          taken_at: "1958-06-20",
        },
      ],
      stories: [
        {
          id: "s1",
          title: "The Apple Pie Legacy",
          content:
            "Every Thanksgiving, Mom would start baking at 5am. The whole house would fill with the smell of cinnamon and butter. She used Grandma's recipe, passed down through four generations. Even now, I can't make apple pie without thinking of her standing at that old kitchen counter, flour on her apron, humming her favorite hymns.",
          author: "Sarah Sullivan",
          relationship: "Daughter",
          created_at: "2024-01-05T14:00:00Z",
        },
        {
          id: "s2",
          title: "Library Adventures",
          content:
            "When I was little, Grandma would take me to the library every Saturday. She'd help me pick out books and we'd read them together in the children's corner. She made every story come alive with different voices. Those Saturday mornings are some of my most treasured memories.",
          author: "Emily Chen",
          relationship: "Granddaughter",
          created_at: "2024-01-08T10:30:00Z",
        },
      ],
      guestbook_entries: [
        {
          id: "g1",
          name: "John Thompson",
          message:
            "Maggie was the kindest neighbor anyone could ask for. She always had cookies for the kids and wise words for the adults. Heaven gained a beautiful soul.",
          created_at: "2024-01-10T09:00:00Z",
        },
        {
          id: "g2",
          name: "Mary Williams",
          message:
            "Her smile could light up any room. We volunteered together at the library for 15 years. I'll miss our coffee chats and her wonderful stories. Rest in peace, dear friend.",
          created_at: "2024-01-12T14:30:00Z",
        },
      ],
      candle_lightings: [
        {
          id: "c1",
          name: "Sarah Sullivan",
          message: "Missing you always, Mom. Your light lives on in all of us.",
          lit_at: "2024-01-20T18:00:00Z",
        },
        {
          id: "c2",
          name: "Michael Sullivan",
          message: "Love you, Grandma. Thanks for teaching me to fish.",
          lit_at: "2024-01-21T20:00:00Z",
        },
        {
          id: "c3",
          name: "Emily Chen",
          message: "Reading your favorite book tonight, Grandma.",
          lit_at: "2024-01-22T21:00:00Z",
        },
        {
          id: "c4",
          name: null,
          message: null,
          lit_at: "2024-01-23T12:00:00Z",
        },
      ],
      events: [
        {
          id: "e1",
          title: "One Year Remembrance",
          description: "Join us for a gathering to celebrate Maggie's life",
          event_date: "2024-11-28T14:00:00Z",
        },
      ],
    },
    "demo-memorial-2": {
      id: "demo-memorial-2",
      slug: "robert-james-chen",
      first_name: "Robert",
      middle_name: "James",
      last_name: "Chen",
      nickname: "Bobby",
      birth_date: "1942-03-22",
      death_date: "2024-01-05",
      birth_place: "San Francisco, CA",
      resting_place: "Golden Gate Memorial Park",
      obituary:
        "Robert James Chen lived a life of adventure and purpose. A retired engineer who helped build bridges across California, Bobby was known for his infectious laughter and love of fishing. He spent his retirement teaching woodworking to local youth, believing in the importance of passing skills to the next generation.",
      profile_photo_url: null,
      cover_photo_url: null,
      is_public: true,
      privacy_level: "public",
      view_count: 156,
      user_id: "demo-user-123",
      theme: "ocean",
      created_at: "2024-01-10T09:00:00Z",
      updated_at: "2024-01-20T11:00:00Z",
      photos: [
        {
          id: "p4",
          url: "https://images.unsplash.com/photo-1504309092620-4d0ec726efa4?w=800&q=80",
          caption: "Annual fishing trip",
          taken_at: "2023-07-04",
        },
        {
          id: "p5",
          url: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=80",
          caption: "Teaching woodworking",
          taken_at: "2023-09-15",
        },
      ],
      stories: [
        {
          id: "s3",
          title: "Building Bridges",
          content:
            "Dad always said he built bridges so families could stay connected. Every time we drive across the Bay Bridge, I think of him up there in his hard hat, making sure every bolt was perfect. He brought that same dedication to everything he did.",
          author: "Lisa Chen",
          relationship: "Daughter",
          created_at: "2024-01-12T16:00:00Z",
        },
      ],
      guestbook_entries: [],
      candle_lightings: [
        {
          id: "c5",
          name: "Lisa Chen",
          message: "We miss you every day, Dad",
          lit_at: "2024-01-15T19:00:00Z",
        },
        {
          id: "c6",
          name: "Workshop Student",
          message: "Thank you for teaching me. I finished my first chair.",
          lit_at: "2024-01-18T15:00:00Z",
        },
      ],
      events: [],
    },
    "demo-memorial-3": {
      id: "demo-memorial-3",
      slug: "eleanor-grace-williams",
      first_name: "Eleanor",
      middle_name: "Grace",
      last_name: "Williams",
      nickname: null,
      birth_date: "1948-09-10",
      death_date: "2023-08-15",
      birth_place: "Chicago, IL",
      resting_place: "Rosehill Cemetery, Chicago",
      obituary:
        "Eleanor Grace Williams was a dedicated teacher who spent 35 years shaping young minds at Lincoln Elementary. Known for her patience and creativity, she inspired countless students to love learning. In retirement, she pursued her passion for watercolor painting.",
      profile_photo_url: null,
      cover_photo_url: null,
      is_public: true,
      privacy_level: "public",
      view_count: 89,
      user_id: "demo-user-123",
      theme: "garden",
      created_at: "2023-08-20T15:00:00Z",
      updated_at: "2023-12-01T09:00:00Z",
      photos: [
        {
          id: "p6",
          url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
          caption: "Last day of school, 2010",
          taken_at: "2010-06-15",
        },
      ],
      stories: [],
      guestbook_entries: [],
      candle_lightings: [
        {
          id: "c7",
          name: "Former Student",
          message: "You made math fun. I became an engineer because of you.",
          lit_at: "2023-09-01T10:00:00Z",
        },
      ],
      events: [],
    },
    "historical-thomas-jefferson": {
      id: "historical-thomas-jefferson",
      slug: "thomas-jefferson",
      first_name: "Thomas",
      middle_name: null,
      last_name: "Jefferson",
      nickname: null,
      birth_date: "1743-04-13",
      death_date: "1826-07-04",
      birth_place: "Shadwell, Virginia",
      resting_place: "Monticello, Charlottesville, Virginia",
      obituary: `On the 4th of July, 1826—the 50th anniversary of the Declaration of Independence—Thomas Jefferson, author of that sacred document and third President of these United States, departed this earthly realm at Monticello, his beloved mountain home.

Born April 13, 1743, in Albemarle County, Virginia, Mr. Jefferson dedicated his 83 years to the pursuit of liberty, knowledge, and the advancement of republican government. A philosopher, architect, inventor, and statesman, he leaves behind a nation transformed by his vision of freedom and self-governance.

His final words, inquiring whether the Fourth had arrived, remind us that his life was inextricably bound to the birth of American liberty. Mr. Jefferson is survived by his daughter Martha and numerous grandchildren who carry forward his legacy.

Among his countless contributions: the Declaration of Independence, the Virginia Statute for Religious Freedom, and the founding of the University of Virginia—three achievements he wished inscribed upon his tombstone, above even the presidency.

Rest now, dear patriot. Your words—"We hold these truths to be self-evident, that all men are created equal"—echo through the ages, a beacon for generations yet unborn.`,
      profile_photo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Thomas_Jefferson_by_Rembrandt_Peale%2C_1800.jpg/440px-Thomas_Jefferson_by_Rembrandt_Peale%2C_1800.jpg",
      cover_photo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Monticello_2010-10-29.jpg/1280px-Monticello_2010-10-29.jpg",
      is_public: true,
      privacy_level: "public",
      view_count: 12847,
      user_id: "demo-user-123",
      theme: "classic",
      created_at: "2023-07-04T12:00:00Z",
      updated_at: "2024-07-04T12:00:00Z",
      ai_features_enabled: true,
      photos: [
        {
          id: "tj-p1",
          url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Thomas_Jefferson_by_Rembrandt_Peale%2C_1800.jpg/440px-Thomas_Jefferson_by_Rembrandt_Peale%2C_1800.jpg",
          caption: "Portrait by Rembrandt Peale, 1800",
          taken_at: "1800-01-01",
        },
        {
          id: "tj-p2",
          url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Monticello_2010-10-29.jpg/1280px-Monticello_2010-10-29.jpg",
          caption: "Monticello - Jefferson's beloved home",
          taken_at: "1772-01-01",
        },
        {
          id: "tj-p3",
          url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Declaration_of_Independence_%281819%29%2C_by_John_Trumbull.jpg/1280px-Declaration_of_Independence_%281819%29%2C_by_John_Trumbull.jpg",
          caption: "Signing of the Declaration of Independence",
          taken_at: "1776-07-04",
        },
        {
          id: "tj-p4",
          url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Rotunda_UVa_from_north_2006.jpg/1280px-Rotunda_UVa_from_north_2006.jpg",
          caption: "University of Virginia Rotunda - Founded by Jefferson",
          taken_at: "1826-01-01",
        },
        {
          id: "tj-p5",
          url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Thomas_Jefferson_Memorial_At_Dusk_1.jpg/1280px-Thomas_Jefferson_Memorial_At_Dusk_1.jpg",
          caption: "Jefferson Memorial, Washington D.C.",
          taken_at: "1943-04-13",
        },
        {
          id: "tj-p6",
          url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Thomas_Jefferson_by_Gilbert_Stuart.jpg/440px-Thomas_Jefferson_by_Gilbert_Stuart.jpg",
          caption: "Portrait by Gilbert Stuart, 1805",
          taken_at: "1805-01-01",
        },
      ],
      stories: [
        {
          id: "tj-s1",
          title: "Author of Liberty",
          content: "In the summer of 1776, a young Thomas Jefferson sat in a rented room in Philadelphia, tasked with drafting a document that would change the world. Working at a portable writing desk of his own design, he penned the words that would ignite a revolution: 'We hold these truths to be self-evident, that all men are created equal.' The Continental Congress made changes, but the soul of the Declaration remained Jefferson's vision of human liberty.",
          author: "Historical Society",
          relationship: "Historian",
          created_at: "2024-01-01T12:00:00Z",
        },
        {
          id: "tj-s2",
          title: "The Library That Built a Nation",
          content: "After the British burned the Library of Congress in 1814, Jefferson offered his personal collection of 6,487 books to rebuild it. Congress paid $23,950 for what was then the largest private library in America. Jefferson, ever the bibliophile, immediately began collecting again. His books became the foundation of the modern Library of Congress.",
          author: "Library of Congress",
          relationship: "Institution",
          created_at: "2024-01-02T12:00:00Z",
        },
        {
          id: "tj-s3",
          title: "Architect of Democracy",
          content: "Beyond politics, Jefferson was a brilliant architect. He designed Monticello over 40 years, incorporating neoclassical elements inspired by his time in France. He also designed the Virginia State Capitol and the 'academical village' of the University of Virginia, which he considered one of his three greatest achievements.",
          author: "Monticello Foundation",
          relationship: "Preservation Society",
          created_at: "2024-01-03T12:00:00Z",
        },
        {
          id: "tj-s4",
          title: "Correspondence with Adams",
          content: "After years of political rivalry, Thomas Jefferson and John Adams reconciled in their later years, exchanging 158 letters on philosophy, government, and their shared history. In a remarkable coincidence, both died on July 4, 1826—exactly 50 years after the Declaration of Independence. Adams's last words were reportedly 'Thomas Jefferson survives,' not knowing his friend had died hours earlier.",
          author: "American Historical Association",
          relationship: "Historian",
          created_at: "2024-01-04T12:00:00Z",
        },
        {
          id: "tj-s5",
          title: "The Farmer President",
          content: "Jefferson was a passionate farmer and gardener. At Monticello, he cultivated over 300 varieties of vegetables and 170 varieties of fruit. He introduced many European plants to America and kept detailed garden journals. He invented an improved moldboard plow and experimented with crop rotation. 'No occupation is so delightful to me as the culture of the earth,' he wrote.",
          author: "Thomas Jefferson Foundation",
          relationship: "Preservation Organization",
          created_at: "2024-01-05T12:00:00Z",
        },
      ],
      guestbook_entries: [
        {
          id: "tj-g1",
          name: "History Student",
          message: "Your words in the Declaration of Independence inspired me to study history. The pursuit of liberty continues because of your vision. Thank you, Mr. President.",
          created_at: "2024-07-04T10:00:00Z",
        },
        {
          id: "tj-g2",
          name: "Monticello Visitor",
          message: "Just visited Monticello with my family. Walking through your home and gardens, we felt connected to American history in a profound way. Your legacy lives on.",
          created_at: "2024-06-15T14:00:00Z",
        },
        {
          id: "tj-g3",
          name: "UVA Alumni",
          message: "As a graduate of Mr. Jefferson's University, I am forever grateful for your vision of public education. The Rotunda remains a beacon of learning.",
          created_at: "2024-05-20T09:00:00Z",
        },
      ],
      candle_lightings: [
        {
          id: "tj-c1",
          name: "American Citizen",
          message: "On this Independence Day, we remember the author of our liberty.",
          lit_at: "2024-07-04T12:00:00Z",
        },
        {
          id: "tj-c2",
          name: "History Teacher",
          message: "Teaching your words to the next generation. Your light continues to guide.",
          lit_at: "2024-07-04T08:00:00Z",
        },
        {
          id: "tj-c3",
          name: "Virginia Native",
          message: "From your beloved Virginia, we honor your memory.",
          lit_at: "2024-04-13T12:00:00Z",
        },
        {
          id: "tj-c4",
          name: null,
          message: null,
          lit_at: "2024-07-04T18:00:00Z",
        },
        {
          id: "tj-c5",
          name: null,
          message: null,
          lit_at: "2024-07-04T20:00:00Z",
        },
      ],
      events: [
        {
          id: "tj-e1",
          title: "Independence Day Commemoration",
          description: "Annual remembrance of Thomas Jefferson on the anniversary of his passing and the Declaration's signing",
          event_date: "2024-07-04T12:00:00Z",
        },
        {
          id: "tj-e2",
          title: "Birthday Celebration at Monticello",
          description: "Celebrate Jefferson's birthday with special tours and historical reenactments",
          event_date: "2024-04-13T10:00:00Z",
        },
      ],
      timeline_events: [
        {
          id: "tl-1",
          year: "1743",
          title: "Birth",
          description: "Born at Shadwell plantation in Albemarle County, Virginia",
          icon: "baby",
        },
        {
          id: "tl-2",
          year: "1762",
          title: "Education",
          description: "Graduated from the College of William & Mary",
          icon: "graduation",
        },
        {
          id: "tl-3",
          year: "1772",
          title: "Marriage",
          description: "Married Martha Wayles Skelton; began building Monticello",
          icon: "heart",
        },
        {
          id: "tl-4",
          year: "1776",
          title: "Declaration of Independence",
          description: "Authored the Declaration of Independence at age 33",
          icon: "document",
        },
        {
          id: "tl-5",
          year: "1779-1781",
          title: "Governor of Virginia",
          description: "Served as the second Governor of Virginia during the Revolutionary War",
          icon: "building",
        },
        {
          id: "tl-6",
          year: "1785-1789",
          title: "Minister to France",
          description: "Served as U.S. Minister to France, witnessing the early French Revolution",
          icon: "globe",
        },
        {
          id: "tl-7",
          year: "1790-1793",
          title: "Secretary of State",
          description: "First Secretary of State under President George Washington",
          icon: "briefcase",
        },
        {
          id: "tl-8",
          year: "1797-1801",
          title: "Vice President",
          description: "Served as Vice President under John Adams",
          icon: "flag",
        },
        {
          id: "tl-9",
          year: "1801-1809",
          title: "President of the United States",
          description: "Third President; Louisiana Purchase doubled the nation's size",
          icon: "star",
        },
        {
          id: "tl-10",
          year: "1819",
          title: "University of Virginia Founded",
          description: "Founded the University of Virginia, designing its buildings and curriculum",
          icon: "school",
        },
        {
          id: "tl-11",
          year: "1826",
          title: "Death",
          description: "Died at Monticello on July 4th, the 50th anniversary of the Declaration",
          icon: "candle",
        },
      ],
    },
  },
};

/**
 * Ensure the data directory exists
 */
function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Load the demo store from disk (always reads fresh - no caching to avoid Next.js module issues)
 */
function loadStore(): DemoStore {
  ensureDataDir();

  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(data) as DemoStore;
    }
  } catch (error) {
    console.error("Error loading demo store:", error);
  }

  // Initialize with default data
  const defaultStore = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA)) as DemoStore;
  saveStore(defaultStore);
  return defaultStore;
}

/**
 * Save the demo store to disk
 */
function saveStore(store: DemoStore): void {
  ensureDataDir();

  try {
    writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving demo store:", error);
  }
}

/**
 * Get all memorials
 */
export function getAllMemorials(): DemoMemorial[] {
  const store = loadStore();
  return Object.values(store.memorials);
}

/**
 * Get memorial by ID or slug
 */
export function getMemorial(idOrSlug: string): DemoMemorial | null {
  const store = loadStore();

  // Check by ID first
  if (store.memorials[idOrSlug]) {
    return store.memorials[idOrSlug];
  }

  // Check by slug
  const memorial = Object.values(store.memorials).find(
    (m) => m.slug === idOrSlug
  );
  return memorial || null;
}

/**
 * Create a new memorial
 */
export function createMemorial(
  memorial: Omit<DemoMemorial, "photos" | "stories" | "guestbook_entries" | "candle_lightings" | "events">
): DemoMemorial {
  const store = loadStore();

  const fullMemorial: DemoMemorial = {
    ...memorial,
    photos: [],
    stories: [],
    guestbook_entries: [],
    candle_lightings: [],
    events: [],
  };

  store.memorials[memorial.id] = fullMemorial;
  saveStore(store);

  return fullMemorial;
}

/**
 * Update a memorial
 */
export function updateMemorial(
  idOrSlug: string,
  updates: Partial<DemoMemorial>
): DemoMemorial | null {
  const store = loadStore();
  const memorial = getMemorial(idOrSlug);

  if (!memorial) {
    return null;
  }

  const updatedMemorial = {
    ...memorial,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  store.memorials[memorial.id] = updatedMemorial;
  saveStore(store);

  return updatedMemorial;
}

/**
 * Delete a memorial
 */
export function deleteMemorial(idOrSlug: string): boolean {
  const store = loadStore();
  const memorial = getMemorial(idOrSlug);

  if (!memorial) {
    return false;
  }

  delete store.memorials[memorial.id];
  saveStore(store);

  return true;
}

/**
 * Add a photo to a memorial
 */
export function addPhoto(memorialId: string, photo: DemoPhoto): DemoMemorial | null {
  const memorial = getMemorial(memorialId);
  if (!memorial) return null;

  memorial.photos.push(photo);
  return updateMemorial(memorialId, { photos: memorial.photos });
}

/**
 * Add a story to a memorial
 */
export function addStory(memorialId: string, story: DemoStory): DemoMemorial | null {
  const memorial = getMemorial(memorialId);
  if (!memorial) return null;

  memorial.stories.push(story);
  return updateMemorial(memorialId, { stories: memorial.stories });
}

/**
 * Add a guestbook entry to a memorial
 */
export function addGuestbookEntry(
  memorialId: string,
  entry: DemoGuestbookEntry
): DemoMemorial | null {
  const memorial = getMemorial(memorialId);
  if (!memorial) return null;

  memorial.guestbook_entries.push(entry);
  return updateMemorial(memorialId, { guestbook_entries: memorial.guestbook_entries });
}

/**
 * Add a candle lighting to a memorial
 */
export function addCandleLighting(
  memorialId: string,
  candle: DemoCandleLighting
): DemoMemorial | null {
  const memorial = getMemorial(memorialId);
  if (!memorial) return null;

  memorial.candle_lightings.push(candle);
  return updateMemorial(memorialId, { candle_lightings: memorial.candle_lightings });
}

/**
 * Increment view count for a memorial
 */
export function incrementViewCount(idOrSlug: string): number {
  const memorial = getMemorial(idOrSlug);
  if (!memorial) return 0;

  const newCount = memorial.view_count + 1;
  updateMemorial(idOrSlug, { view_count: newCount });
  return newCount;
}

/**
 * Reset demo data to defaults
 */
export function resetDemoData(): void {
  const defaultStore = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA)) as DemoStore;
  saveStore(defaultStore);
}

/**
 * Get demo user
 */
export function getDemoUser(): DemoUser {
  const store = loadStore();
  return store.users["demo-user-123"];
}
