"use client";

import { MemorialView } from "@/app/memorial/[id]/MemorialView";

// Rich demo memorial data for auditing all features
const demoMemorial = {
  id: "demo-memorial-001",
  slug: "margaret-rose-johnson",
  firstName: "Margaret",
  lastName: "Johnson",
  birthDate: "1942-03-15",
  deathDate: "2024-01-08",
  biography: `Margaret Rose Johnson was a beloved mother, grandmother, and community pillar who touched countless lives with her warmth, wisdom, and unwavering kindness.

A retired elementary school teacher of 35 years, she believed every child had a spark of brilliance waiting to be discovered. Her kitchen was always open, her cookies legendary, and her advice timeless.

She loved tending to her rose garden, playing piano on Sunday mornings, and reading romance novels by the fireplace. Margaret taught us that family is everything, that love should be given freely, and that a good pie can solve most problems.`,
  profilePhotoUrl: "https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&h=400&fit=crop&crop=face",
  coverPhotoUrl: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=800&fit=crop",
  theme: "garden",
  isPublic: true,
  settings: {
    // Living portrait would be generated via /api/ai/living-photo
    // Click the sparkle button to see the generation prompt
  },
  user: {
    id: "user-001",
    name: "Sarah Johnson",
  },
  photos: [
    {
      id: "photo-1",
      url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800",
      caption: "Family reunion, Summer 2019",
      takenAt: "2019-07-15",
    },
    {
      id: "photo-2",
      url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800",
      caption: "In her beloved rose garden",
      takenAt: "2020-05-20",
    },
    {
      id: "photo-3",
      url: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=800",
      caption: "Baking her famous cookies with the grandkids",
      takenAt: "2022-12-24",
    },
    {
      id: "photo-4",
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
      caption: "50th wedding anniversary",
      takenAt: "2015-06-12",
    },
    {
      id: "photo-5",
      url: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800",
      caption: "Teaching her last class before retirement",
      takenAt: "2007-06-15",
    },
  ],
  memories: [
    {
      id: "memory-1",
      content: "Grandma always said 'Love fiercely and forgive quickly.' She lived those words every single day. I'll never forget how she made everyone feel like the most important person in the room.",
      authorName: "Emily Johnson",
      relationship: "Granddaughter",
      createdAt: "2024-01-10T14:30:00Z",
    },
    {
      id: "memory-2",
      content: "Mrs. Johnson was my third-grade teacher, and she changed my life. When everyone else said I couldn't read, she stayed after school every day for a year until I could. I became a teacher because of her.",
      authorName: "Michael Torres",
      relationship: "Former Student",
      createdAt: "2024-01-12T09:15:00Z",
    },
    {
      id: "memory-3",
      content: "Mom's Sunday dinners were legendary. No matter what was happening in life, we all gathered around that big oak table. She taught us that breaking bread together heals everything.",
      authorName: "David Johnson",
      relationship: "Son",
      createdAt: "2024-01-09T18:45:00Z",
    },
    {
      id: "memory-4",
      content: "She welcomed me into the family from day one. When I was nervous about meeting everyone, she pulled me aside and said 'You're already one of us.' I felt that love for 25 years.",
      authorName: "Lisa Johnson",
      relationship: "Daughter-in-law",
      createdAt: "2024-01-11T11:20:00Z",
    },
    {
      id: "memory-5",
      content: "We played bridge together every Thursday for 40 years. She never let me win, but she always made losing feel like fun. Our club won't be the same without her sharp wit.",
      authorName: "Dorothy Chen",
      relationship: "Best Friend",
      createdAt: "2024-01-13T16:00:00Z",
    },
  ],
  candles: [
    {
      id: "candle-1",
      message: "Rest in peace, dear friend. Your light shines on.",
      lighterName: "Martha Williams",
      createdAt: "2024-01-15T08:00:00Z",
    },
    {
      id: "candle-2",
      message: "Thank you for everything you taught me, Grandma.",
      lighterName: "Emma Johnson",
      createdAt: "2024-01-14T20:30:00Z",
    },
    {
      id: "candle-3",
      message: "Forever grateful for your kindness.",
      lighterName: "Anonymous",
      createdAt: "2024-01-16T12:15:00Z",
    },
    {
      id: "candle-4",
      message: null,
      lighterName: "The Rodriguez Family",
      createdAt: "2024-01-17T09:45:00Z",
    },
    {
      id: "candle-5",
      message: "Missing you at book club. Save me a seat up there.",
      lighterName: "Patricia Moore",
      createdAt: "2024-01-18T15:00:00Z",
    },
    {
      id: "candle-6",
      message: "Your smile lit up every room.",
      lighterName: "James Wilson",
      createdAt: "2024-01-19T11:30:00Z",
    },
    {
      id: "candle-7",
      message: null,
      lighterName: "Former Students of Lincoln Elementary",
      createdAt: "2024-01-20T14:00:00Z",
    },
  ],
  events: [
    {
      id: "event-1",
      title: "Celebration of Life",
      description: "Join us to celebrate Margaret's beautiful life with stories, music, and her favorite foods.",
      eventDate: "2024-01-20T14:00:00Z",
    },
    {
      id: "event-2",
      title: "Memorial Garden Dedication",
      description: "A rose garden at Lincoln Elementary will be dedicated in her honor.",
      eventDate: "2024-03-15T10:00:00Z",
    },
  ],
  traditions: [
    {
      id: "tradition-1",
      type: "recipe" as const,
      title: "Famous Chocolate Chip Cookies",
      content: "Preheat oven to 375°F. Cream butter and sugars until fluffy. Add eggs and vanilla. Mix in flour, baking soda, and salt. Fold in chocolate chips. Drop by spoonfuls onto baking sheet. Bake 9-11 minutes until golden. Let cool 5 minutes before removing.",
      ingredients: [
        "2 1/4 cups all-purpose flour",
        "1 cup butter, softened",
        "3/4 cup granulated sugar",
        "3/4 cup packed brown sugar",
        "2 large eggs",
        "1 tsp vanilla extract",
        "1 tsp baking soda",
        "1 tsp salt",
        "2 cups chocolate chips",
      ],
      memory: "The recipe everyone begged for. She'd make triple batches for every bake sale and they'd sell out in minutes.",
      addedBy: "Emily Johnson",
    },
    {
      id: "tradition-2",
      type: "recipe" as const,
      title: "Sunday Pot Roast",
      content: "Season roast generously with salt and pepper. Sear on all sides in Dutch oven. Add onions, carrots, potatoes, and beef broth. Cover and cook at 300°F for 3-4 hours until fork tender. The secret is patience - low and slow.",
      ingredients: [
        "4 lb chuck roast",
        "6 carrots, chunked",
        "6 potatoes, quartered",
        "2 onions, quartered",
        "2 cups beef broth",
        "Salt and pepper",
        "Fresh thyme",
      ],
      occasion: "Every Sunday",
      memory: "35 years of Sunday dinners around that big oak table. She always said the roast brought us together, but it was really her.",
      addedBy: "David Johnson",
    },
    {
      id: "tradition-3",
      type: "recipe" as const,
      title: "Rose Garden Lemonade",
      content: "Combine sugar and water in saucepan, heat until dissolved. Add rose petals, steep 30 minutes. Strain and mix with fresh lemon juice and cold water. Serve over ice with a fresh rose petal garnish.",
      ingredients: [
        "1 cup sugar",
        "1 cup water",
        "1 cup fresh rose petals (unsprayed)",
        "1 cup fresh lemon juice",
        "4 cups cold water",
        "Ice",
      ],
      occasion: "Summer afternoons",
      memory: "Made with roses from her own garden. She'd serve it on the porch and say it tasted like summer itself.",
      addedBy: "Sarah Johnson",
    },
    {
      id: "tradition-4",
      type: "wisdom" as const,
      title: "Love fiercely, forgive quickly",
      content: "Life's too short to hold grudges. The people you love won't be here forever, so love them with everything you've got. And when they mess up - because they will - forgive them fast. You'll never regret choosing love.",
      memory: "She said this at every family gathering, especially when siblings were fighting. It became our family motto.",
      addedBy: "Emily Johnson",
    },
    {
      id: "tradition-5",
      type: "wisdom" as const,
      title: "A good pie can solve most problems",
      content: "When someone's hurting, bring them pie. When you're celebrating, bake a pie. When you don't know what to say, say it with pie. Food is love, and pie is the most loving food there is.",
      memory: "She really believed this. Whenever anyone in town was going through something, Margaret showed up with pie.",
      addedBy: "Lisa Johnson",
    },
    {
      id: "tradition-6",
      type: "skill" as const,
      title: "How to Deadhead Roses",
      content: "Cut at a 45-degree angle, about 1/4 inch above a leaf set with 5 leaves. Always cut to an outward-facing bud to encourage the plant to grow outward, not inward. Do this regularly and your roses will bloom all season.",
      memory: "She taught every grandchild in the garden. Said it was meditation with results.",
      addedBy: "Emma Johnson",
    },
    {
      id: "tradition-7",
      type: "skill" as const,
      title: "The Perfect Pie Crust",
      content: "The secret is cold butter - freeze it, then grate it into the flour. Use ice water, just enough to bring it together. Handle it as little as possible. And always, always let it rest in the fridge for at least an hour before rolling.",
      memory: "She won the county fair pie contest 12 years running. This was her secret.",
      addedBy: "Sarah Johnson",
    },
    {
      id: "tradition-8",
      type: "tradition" as const,
      title: "Christmas Eve Pajamas",
      content: "Every Christmas Eve, after dinner, everyone opens one gift - and it's always pajamas. Then we all put them on, drink hot cocoa, and watch It's a Wonderful Life together.",
      occasion: "Christmas Eve",
      memory: "She started this when David was little. Now there are 14 grandkids continuing it with their own families.",
      addedBy: "David Johnson",
    },
    {
      id: "tradition-9",
      type: "tradition" as const,
      title: "Birthday Pancake Faces",
      content: "On every family member's birthday, the birthday person wakes up to pancakes shaped and decorated to look like their face. Complete with fruit features and whipped cream hair.",
      occasion: "Birthdays",
      memory: "She'd get up at 5am to make these. The grandkids would shriek with delight seeing their pancake portraits.",
      addedBy: "Emily Johnson",
    },
    {
      id: "tradition-10",
      type: "saying" as const,
      title: "Well, isn't that something!",
      content: "Her reaction to everything surprising, good or bad. Flat tire? 'Well, isn't that something!' Grandkid gets straight A's? 'Well, isn't that something!' It was never sarcastic - always genuine wonder at life's twists.",
      memory: "We all say it now. It's become the family's way of handling surprises with grace.",
      addedBy: "Lisa Johnson",
    },
    {
      id: "tradition-11",
      type: "saying" as const,
      title: "Love you more than all the stars",
      content: "How she said goodnight to every grandchild. She'd tuck them in, kiss their forehead, and whisper 'Love you more than all the stars.' Then she'd point to the window and say 'And that's a LOT of stars.'",
      memory: "Every grandkid grew up hearing this. Now they say it to their own children.",
      addedBy: "Emma Johnson",
    },
  ],
  favorites: [
    {
      id: "music-1",
      songTitle: "What a Wonderful World",
      artist: "Louis Armstrong",
      genre: "Jazz",
      significance: "Would hum this while tending her roses. Said it reminded her to notice the beautiful things.",
      addedBy: "Sarah Johnson",
    },
    {
      id: "music-2",
      songTitle: "Moon River",
      artist: "Andy Williams",
      genre: "Pop",
      significance: "Her and Dad's song. They danced to it at their wedding and every anniversary after.",
      addedBy: "David Johnson",
    },
    {
      id: "music-3",
      songTitle: "Amazing Grace",
      artist: "Hymn",
      genre: "Gospel",
      significance: "Sang this in the church choir for 40 years. Her solo at Easter was legendary.",
      addedBy: "Emily Johnson",
    },
    {
      id: "music-4",
      songTitle: "Let It Be",
      artist: "The Beatles",
      genre: "Rock",
      significance: "Played at their 50th anniversary party. She said the lyrics were her life philosophy.",
      addedBy: "Lisa Johnson",
    },
    {
      id: "music-5",
      songTitle: "Somewhere Over the Rainbow",
      artist: "Judy Garland",
      genre: "Classical",
      significance: "Her favorite movie was The Wizard of Oz. She watched it every year with the grandkids.",
      addedBy: "Emma Johnson",
    },
    {
      id: "music-6",
      songTitle: "You Are My Sunshine",
      artist: "Johnny Cash",
      genre: "Country",
      significance: "The lullaby she sang to all her children and grandchildren. We sang it at her service.",
      addedBy: "David Johnson",
    },
  ],
};

export default function DemoMemorialPage() {
  return (
    <div>
      {/* Demo Mode Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 px-4 text-sm font-medium sticky top-0 z-50">
        Demo Mode - This is a sample memorial for testing and auditing features | Edit mode enabled
      </div>

      <MemorialView memorial={demoMemorial} userRole="owner" />
    </div>
  );
}
