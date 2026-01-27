import type { Product } from "@/types/shop";

export const PRODUCT_CATALOG: Product[] = [
  // Photo Books
  {
    id: "photo_book_standard",
    category: "photo_books",
    name: "Classic Photo Book",
    description: "Beautiful hardcover photo book with up to 50 pages. Perfect for preserving cherished memories.",
    basePrice: 49.99,
    images: ["/products/photo-book-standard.jpg"],
    options: [
      { id: "size", name: "Size", values: ["8x8", "8x11", "11x14"], priceModifiers: { "8x8": 0, "8x11": 20, "11x14": 40 } },
      { id: "pages", name: "Pages", values: ["20", "30", "40", "50"], priceModifiers: { "20": 0, "30": 10, "40": 20, "50": 30 } },
      { id: "cover", name: "Cover Style", values: ["Matte", "Glossy"], priceModifiers: { "Matte": 0, "Glossy": 5 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 100,
      maxTextLength: 500,
      textFields: [
        { name: "title", placeholder: "In Loving Memory of...", required: true },
        { name: "subtitle", placeholder: "1945 - 2024", required: false },
        { name: "dedication", placeholder: "Dedicated to our beloved...", required: false }
      ]
    },
    productionDays: 7,
    rushAvailable: true,
    rushDays: 3,
    rushPriceMultiplier: 1.5,
    weight: 32,
    dimensions: { width: 8, height: 8, depth: 0.5 },
    inStock: true,
    requiresProofApproval: true
  },
  {
    id: "photo_book_premium",
    category: "photo_books",
    name: "Premium Layflat Photo Book",
    description: "Luxurious layflat binding ensures seamless panoramic spreads. Archival quality paper.",
    basePrice: 89.99,
    images: ["/products/photo-book-premium.jpg"],
    options: [
      { id: "size", name: "Size", values: ["10x10", "12x12", "12x15"], priceModifiers: { "10x10": 0, "12x12": 30, "12x15": 50 } },
      { id: "pages", name: "Pages", values: ["20", "30", "40", "50", "60"], priceModifiers: { "20": 0, "30": 15, "40": 30, "50": 45, "60": 60 } },
      { id: "paper", name: "Paper Type", values: ["Luster", "Pearl", "Deep Matte"], priceModifiers: { "Luster": 0, "Pearl": 10, "Deep Matte": 15 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 150,
      maxTextLength: 1000,
      textFields: [
        { name: "title", placeholder: "In Loving Memory of...", required: true },
        { name: "subtitle", placeholder: "1945 - 2024", required: false },
        { name: "dedication", placeholder: "Dedicated to our beloved...", required: false },
        { name: "quote", placeholder: "A favorite quote or verse...", required: false }
      ]
    },
    productionDays: 10,
    rushAvailable: true,
    rushDays: 5,
    rushPriceMultiplier: 1.75,
    weight: 48,
    dimensions: { width: 10, height: 10, depth: 0.75 },
    inStock: true,
    requiresProofApproval: true
  },
  {
    id: "photo_book_leather",
    category: "photo_books",
    name: "Heirloom Leather Photo Book",
    description: "Genuine leather cover with gold embossing. A treasured keepsake for generations.",
    basePrice: 149.99,
    images: ["/products/photo-book-leather.jpg"],
    options: [
      { id: "size", name: "Size", values: ["10x10", "12x12"], priceModifiers: { "10x10": 0, "12x12": 40 } },
      { id: "leather", name: "Leather Color", values: ["Black", "Brown", "Burgundy", "Navy"], priceModifiers: {} },
      { id: "embossing", name: "Embossing", values: ["None", "Name Only", "Name & Dates", "Custom Text"], priceModifiers: { "None": 0, "Name Only": 15, "Name & Dates": 20, "Custom Text": 30 } },
      { id: "pages", name: "Pages", values: ["30", "40", "50", "60"], priceModifiers: { "30": 0, "40": 20, "50": 40, "60": 60 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 150,
      maxTextLength: 1000,
      textFields: [
        { name: "title", placeholder: "In Loving Memory of...", required: true },
        { name: "embossing_text", placeholder: "Text for cover embossing...", required: false },
        { name: "dedication", placeholder: "Dedicated to our beloved...", required: false }
      ]
    },
    productionDays: 14,
    rushAvailable: true,
    rushDays: 7,
    rushPriceMultiplier: 2,
    weight: 64,
    dimensions: { width: 10, height: 10, depth: 1 },
    inStock: true,
    requiresProofApproval: true
  },

  // QR Plaques
  {
    id: "qr_plaque_bronze",
    category: "qr_plaques",
    name: "Bronze Memorial QR Plaque",
    description: "Weather-resistant bronze plaque with laser-engraved QR code linking to the memorial page.",
    basePrice: 79.99,
    images: ["/products/qr-plaque-bronze.jpg"],
    options: [
      { id: "size", name: "Size", values: ["3x3", "4x4", "5x5"], priceModifiers: { "3x3": 0, "4x4": 25, "5x5": 50 } },
      { id: "mounting", name: "Mounting", values: ["Adhesive", "Screw Holes", "Stake"], priceModifiers: { "Adhesive": 0, "Screw Holes": 5, "Stake": 15 } },
      { id: "finish", name: "Finish", values: ["Polished", "Antiqued", "Brushed"], priceModifiers: {} }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: false,
      allowText: true,
      allowDesign: false,
      maxTextLength: 100,
      textFields: [
        { name: "name", placeholder: "Full Name", required: true },
        { name: "dates", placeholder: "1945 - 2024", required: true }
      ]
    },
    productionDays: 10,
    rushAvailable: true,
    rushDays: 5,
    rushPriceMultiplier: 1.5,
    weight: 24,
    dimensions: { width: 4, height: 4, depth: 0.25 },
    inStock: true,
    requiresProofApproval: true
  },
  {
    id: "qr_plaque_granite",
    category: "qr_plaques",
    name: "Granite Memorial QR Marker",
    description: "Elegant black granite marker with etched QR code. Suitable for cemetery placement.",
    basePrice: 129.99,
    images: ["/products/qr-plaque-granite.jpg"],
    options: [
      { id: "size", name: "Size", values: ["6x6", "8x8", "10x10"], priceModifiers: { "6x6": 0, "8x8": 50, "10x10": 100 } },
      { id: "shape", name: "Shape", values: ["Square", "Heart", "Oval"], priceModifiers: { "Square": 0, "Heart": 30, "Oval": 20 } },
      { id: "design", name: "Border Design", values: ["None", "Simple", "Floral", "Religious"], priceModifiers: { "None": 0, "Simple": 15, "Floral": 25, "Religious": 25 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 1,
      maxTextLength: 150,
      textFields: [
        { name: "name", placeholder: "Full Name", required: true },
        { name: "dates", placeholder: "Birth - Death", required: true },
        { name: "epitaph", placeholder: "Short epitaph or verse...", required: false }
      ]
    },
    productionDays: 14,
    rushAvailable: false,
    weight: 160,
    dimensions: { width: 6, height: 6, depth: 1 },
    inStock: true,
    requiresProofApproval: true
  },
  {
    id: "qr_plaque_stainless",
    category: "qr_plaques",
    name: "Stainless Steel QR Tag",
    description: "Modern stainless steel tag with QR code. Perfect for garden memorials or keepsakes.",
    basePrice: 34.99,
    images: ["/products/qr-plaque-stainless.jpg"],
    options: [
      { id: "size", name: "Size", values: ["2x2", "3x3"], priceModifiers: { "2x2": 0, "3x3": 15 } },
      { id: "chain", name: "Include Chain", values: ["No", "Yes"], priceModifiers: { "No": 0, "Yes": 8 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: false,
      allowText: true,
      allowDesign: false,
      maxTextLength: 50,
      textFields: [
        { name: "name", placeholder: "Name", required: true }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.5,
    weight: 4,
    dimensions: { width: 2, height: 2, depth: 0.1 },
    inStock: true,
    requiresProofApproval: false
  },
  {
    id: "qr_plaque_ceramic",
    category: "qr_plaques",
    name: "Ceramic Photo QR Tile",
    description: "Full-color ceramic tile with photo and QR code. UV-resistant for outdoor use.",
    basePrice: 59.99,
    images: ["/products/qr-plaque-ceramic.jpg"],
    options: [
      { id: "size", name: "Size", values: ["4x4", "6x6", "8x8"], priceModifiers: { "4x4": 0, "6x6": 20, "8x8": 40 } },
      { id: "frame", name: "Frame", values: ["None", "Bronze Frame", "Silver Frame"], priceModifiers: { "None": 0, "Bronze Frame": 25, "Silver Frame": 25 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 1,
      maxTextLength: 100,
      textFields: [
        { name: "name", placeholder: "Full Name", required: true },
        { name: "dates", placeholder: "1945 - 2024", required: false }
      ]
    },
    productionDays: 7,
    rushAvailable: true,
    rushDays: 3,
    rushPriceMultiplier: 1.75,
    weight: 16,
    dimensions: { width: 4, height: 4, depth: 0.25 },
    inStock: true,
    requiresProofApproval: true
  },

  // Memorial Cards
  {
    id: "memorial_card_standard",
    category: "memorial_cards",
    name: "Memorial Prayer Cards",
    description: "Traditional prayer cards with photo and prayer. Pack of 100.",
    basePrice: 49.99,
    images: ["/products/memorial-card-standard.jpg"],
    options: [
      { id: "quantity", name: "Quantity", values: ["100", "200", "300", "500"], priceModifiers: { "100": 0, "200": 30, "300": 55, "500": 85 } },
      { id: "finish", name: "Finish", values: ["Matte", "Glossy", "Linen"], priceModifiers: { "Matte": 0, "Glossy": 5, "Linen": 10 } },
      { id: "lamination", name: "Lamination", values: ["None", "Single Side", "Both Sides"], priceModifiers: { "None": 0, "Single Side": 15, "Both Sides": 25 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 1,
      maxTextLength: 300,
      textFields: [
        { name: "name", placeholder: "Full Name", required: true },
        { name: "dates", placeholder: "Birth - Death", required: true },
        { name: "prayer", placeholder: "Prayer or poem...", required: false },
        { name: "verse", placeholder: "Scripture verse...", required: false }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.5,
    weight: 8,
    inStock: true,
    requiresProofApproval: true,
    minimumQuantity: 100,
    bulkDiscounts: [
      { quantity: 200, discount: 0.1 },
      { quantity: 500, discount: 0.15 }
    ]
  },
  {
    id: "memorial_card_folded",
    category: "memorial_cards",
    name: "Folded Memorial Programs",
    description: "Elegant folded programs with full obituary, photos, and order of service. Pack of 100.",
    basePrice: 89.99,
    images: ["/products/memorial-card-folded.jpg"],
    options: [
      { id: "quantity", name: "Quantity", values: ["50", "100", "150", "200"], priceModifiers: { "50": -20, "100": 0, "150": 40, "200": 75 } },
      { id: "size", name: "Size", values: ["5.5x8.5", "8.5x11"], priceModifiers: { "5.5x8.5": 0, "8.5x11": 30 } },
      { id: "paper", name: "Paper", values: ["100lb Gloss", "100lb Matte", "Linen"], priceModifiers: { "100lb Gloss": 0, "100lb Matte": 5, "Linen": 15 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 10,
      maxTextLength: 2000,
      textFields: [
        { name: "name", placeholder: "Full Name", required: true },
        { name: "dates", placeholder: "Birth - Death", required: true },
        { name: "obituary", placeholder: "Full obituary text...", required: true },
        { name: "order_of_service", placeholder: "Order of service...", required: false },
        { name: "pallbearers", placeholder: "Pallbearer names...", required: false },
        { name: "acknowledgments", placeholder: "Family acknowledgments...", required: false }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.75,
    weight: 16,
    inStock: true,
    requiresProofApproval: true,
    minimumQuantity: 50
  },
  {
    id: "memorial_card_bookmark",
    category: "memorial_cards",
    name: "Memorial Bookmarks",
    description: "Keepsake bookmarks with photo and verse. Pack of 50.",
    basePrice: 34.99,
    images: ["/products/memorial-bookmark.jpg"],
    options: [
      { id: "quantity", name: "Quantity", values: ["50", "100", "200"], priceModifiers: { "50": 0, "100": 25, "200": 45 } },
      { id: "tassel", name: "Tassel", values: ["None", "White", "Gold", "Silver", "Black"], priceModifiers: { "None": 0, "White": 10, "Gold": 10, "Silver": 10, "Black": 10 } },
      { id: "lamination", name: "Lamination", values: ["Yes", "No"], priceModifiers: { "Yes": 0, "No": -5 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 1,
      maxTextLength: 200,
      textFields: [
        { name: "name", placeholder: "Full Name", required: true },
        { name: "dates", placeholder: "1945 - 2024", required: true },
        { name: "verse", placeholder: "Favorite verse or quote...", required: false }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.5,
    weight: 4,
    inStock: true,
    requiresProofApproval: true,
    minimumQuantity: 50
  },
  {
    id: "thank_you_card",
    category: "memorial_cards",
    name: "Thank You Cards",
    description: "Personalized thank you cards for those who supported during difficult times. Pack of 50.",
    basePrice: 39.99,
    images: ["/products/thank-you-card.jpg"],
    options: [
      { id: "quantity", name: "Quantity", values: ["25", "50", "100", "150"], priceModifiers: { "25": -10, "50": 0, "100": 35, "150": 65 } },
      { id: "style", name: "Style", values: ["Classic", "Modern", "Floral", "Religious"], priceModifiers: {} },
      { id: "envelopes", name: "Envelopes", values: ["White", "Cream", "Gray"], priceModifiers: {} }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 1,
      maxTextLength: 500,
      textFields: [
        { name: "family_name", placeholder: "The Smith Family", required: true },
        { name: "message", placeholder: "Thank you message...", required: true }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.5,
    weight: 8,
    inStock: true,
    requiresProofApproval: true,
    minimumQuantity: 25
  },

  // Canvas Prints
  {
    id: "canvas_small",
    category: "canvas_prints",
    name: "Gallery Canvas - Small",
    description: "Museum-quality canvas print stretched on solid wood frame. 8x10 or 11x14.",
    basePrice: 39.99,
    images: ["/products/canvas-small.jpg"],
    options: [
      { id: "size", name: "Size", values: ["8x10", "11x14"], priceModifiers: { "8x10": 0, "11x14": 20 } },
      { id: "wrap", name: "Edge Wrap", values: ["Mirror", "Black", "White", "Gallery"], priceModifiers: { "Mirror": 0, "Black": 5, "White": 5, "Gallery": 10 } },
      { id: "frame", name: "Floating Frame", values: ["None", "Black", "White", "Natural"], priceModifiers: { "None": 0, "Black": 35, "White": 35, "Natural": 40 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: false,
      maxPhotos: 1,
      maxTextLength: 100,
      textFields: [
        { name: "caption", placeholder: "Optional caption...", required: false }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.5,
    weight: 16,
    dimensions: { width: 8, height: 10, depth: 1.5 },
    inStock: true,
    requiresProofApproval: false
  },
  {
    id: "canvas_medium",
    category: "canvas_prints",
    name: "Gallery Canvas - Medium",
    description: "Museum-quality canvas print. 16x20 or 18x24.",
    basePrice: 69.99,
    images: ["/products/canvas-medium.jpg"],
    options: [
      { id: "size", name: "Size", values: ["16x20", "18x24"], priceModifiers: { "16x20": 0, "18x24": 25 } },
      { id: "wrap", name: "Edge Wrap", values: ["Mirror", "Black", "White", "Gallery"], priceModifiers: { "Mirror": 0, "Black": 5, "White": 5, "Gallery": 10 } },
      { id: "frame", name: "Floating Frame", values: ["None", "Black", "White", "Natural"], priceModifiers: { "None": 0, "Black": 55, "White": 55, "Natural": 60 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: false,
      maxPhotos: 1,
      maxTextLength: 100,
      textFields: [
        { name: "caption", placeholder: "Optional caption...", required: false }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.5,
    weight: 32,
    dimensions: { width: 16, height: 20, depth: 1.5 },
    inStock: true,
    requiresProofApproval: false
  },
  {
    id: "canvas_large",
    category: "canvas_prints",
    name: "Gallery Canvas - Large",
    description: "Statement piece canvas print. 24x36 or 30x40.",
    basePrice: 119.99,
    images: ["/products/canvas-large.jpg"],
    options: [
      { id: "size", name: "Size", values: ["24x36", "30x40"], priceModifiers: { "24x36": 0, "30x40": 50 } },
      { id: "wrap", name: "Edge Wrap", values: ["Mirror", "Black", "White", "Gallery"], priceModifiers: { "Mirror": 0, "Black": 10, "White": 10, "Gallery": 15 } },
      { id: "frame", name: "Floating Frame", values: ["None", "Black", "White", "Natural"], priceModifiers: { "None": 0, "Black": 95, "White": 95, "Natural": 105 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: false,
      maxPhotos: 1,
      maxTextLength: 100,
      textFields: [
        { name: "caption", placeholder: "Optional caption...", required: false }
      ]
    },
    productionDays: 7,
    rushAvailable: true,
    rushDays: 3,
    rushPriceMultiplier: 1.5,
    weight: 64,
    dimensions: { width: 24, height: 36, depth: 1.5 },
    inStock: true,
    requiresProofApproval: false
  },

  // Memorial Jewelry
  {
    id: "jewelry_pendant",
    category: "jewelry",
    name: "Thumbprint Heart Pendant",
    description: "Sterling silver heart pendant engraved with actual thumbprint. Includes chain.",
    basePrice: 89.99,
    images: ["/products/jewelry-pendant.jpg"],
    options: [
      { id: "metal", name: "Metal", values: ["Sterling Silver", "14K Gold Plated", "14K Gold"], priceModifiers: { "Sterling Silver": 0, "14K Gold Plated": 30, "14K Gold": 350 } },
      { id: "chain_length", name: "Chain Length", values: ["16\"", "18\"", "20\"", "24\""], priceModifiers: {} },
      { id: "shape", name: "Shape", values: ["Heart", "Oval", "Round", "Dog Tag"], priceModifiers: { "Heart": 0, "Oval": 10, "Round": 0, "Dog Tag": 15 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: false,
      maxPhotos: 1,
      maxTextLength: 30,
      textFields: [
        { name: "engraving_front", placeholder: "Name", required: false },
        { name: "engraving_back", placeholder: "Dates or message", required: false }
      ]
    },
    productionDays: 14,
    rushAvailable: false,
    weight: 1,
    inStock: true,
    requiresProofApproval: true
  },
  {
    id: "jewelry_bracelet",
    category: "jewelry",
    name: "Memorial Bead Bracelet",
    description: "Handmade beaded bracelet with custom charm. Cremation ash bead optional.",
    basePrice: 49.99,
    images: ["/products/jewelry-bracelet.jpg"],
    options: [
      { id: "size", name: "Wrist Size", values: ["Small (6\")", "Medium (7\")", "Large (8\")"], priceModifiers: {} },
      { id: "beads", name: "Bead Style", values: ["Rose Quartz", "Onyx", "Howlite", "Lava Stone"], priceModifiers: {} },
      { id: "ash_bead", name: "Include Ash Bead", values: ["No", "Yes"], priceModifiers: { "No": 0, "Yes": 45 } },
      { id: "charm", name: "Charm", values: ["Heart", "Angel Wing", "Cross", "Tree of Life", "Infinity"], priceModifiers: {} }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: false,
      allowText: true,
      allowDesign: false,
      maxTextLength: 20,
      textFields: [
        { name: "charm_engraving", placeholder: "Initial or date", required: false }
      ]
    },
    productionDays: 10,
    rushAvailable: false,
    weight: 1,
    inStock: true,
    requiresProofApproval: false
  },

  // Keepsakes
  {
    id: "memorial_ornament",
    category: "keepsakes",
    name: "Photo Memorial Ornament",
    description: "Porcelain ornament with custom photo. Perfect for holiday remembrance.",
    basePrice: 24.99,
    images: ["/products/memorial-ornament.jpg"],
    options: [
      { id: "shape", name: "Shape", values: ["Round", "Heart", "Star", "Angel"], priceModifiers: { "Round": 0, "Heart": 5, "Star": 5, "Angel": 10 } },
      { id: "ribbon", name: "Ribbon Color", values: ["Gold", "Silver", "Red", "White"], priceModifiers: {} }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: false,
      maxPhotos: 1,
      maxTextLength: 50,
      textFields: [
        { name: "name", placeholder: "Name", required: true },
        { name: "year", placeholder: "Year", required: false }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.5,
    weight: 2,
    inStock: true,
    requiresProofApproval: false
  },
  {
    id: "memorial_blanket",
    category: "keepsakes",
    name: "Photo Collage Blanket",
    description: "Super-soft fleece blanket with custom photo collage. 50x60 inches.",
    basePrice: 69.99,
    images: ["/products/memorial-blanket.jpg"],
    options: [
      { id: "size", name: "Size", values: ["50x60", "60x80"], priceModifiers: { "50x60": 0, "60x80": 30 } },
      { id: "material", name: "Material", values: ["Fleece", "Sherpa", "Woven"], priceModifiers: { "Fleece": 0, "Sherpa": 25, "Woven": 40 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 20,
      maxTextLength: 100,
      textFields: [
        { name: "title", placeholder: "In Loving Memory", required: false }
      ]
    },
    productionDays: 7,
    rushAvailable: true,
    rushDays: 3,
    rushPriceMultiplier: 1.5,
    weight: 32,
    inStock: true,
    requiresProofApproval: true
  },

  // Flowers & Donations
  {
    id: "flower_arrangement",
    category: "flowers",
    name: "Sympathy Flower Arrangement",
    description: "Beautiful fresh flower arrangement delivered to service or home.",
    basePrice: 79.99,
    images: ["/products/flower-arrangement.jpg"],
    options: [
      { id: "size", name: "Size", values: ["Standard", "Deluxe", "Premium"], priceModifiers: { "Standard": 0, "Deluxe": 40, "Premium": 80 } },
      { id: "style", name: "Style", values: ["Traditional", "Garden", "Modern", "All White"], priceModifiers: {} },
      { id: "container", name: "Container", values: ["Basket", "Vase", "Ceramic Pot"], priceModifiers: { "Basket": 0, "Vase": 15, "Ceramic Pot": 20 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: false,
      allowText: true,
      allowDesign: false,
      maxTextLength: 200,
      textFields: [
        { name: "card_message", placeholder: "Card message...", required: true },
        { name: "from", placeholder: "From...", required: true }
      ]
    },
    productionDays: 1,
    rushAvailable: true,
    rushDays: 0,
    rushPriceMultiplier: 1.25,
    weight: 64,
    inStock: true,
    requiresProofApproval: false
  },
  {
    id: "donation_tree",
    category: "donations",
    name: "Memorial Tree Planting",
    description: "Plant a tree in their memory through One Tree Planted. Includes certificate.",
    basePrice: 25.00,
    images: ["/products/donation-tree.jpg"],
    options: [
      { id: "quantity", name: "Number of Trees", values: ["1", "5", "10", "25"], priceModifiers: { "1": 0, "5": 100, "10": 225, "25": 600 } },
      { id: "location", name: "Planting Region", values: ["North America", "South America", "Africa", "Asia", "Australia"], priceModifiers: {} }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: false,
      allowText: true,
      allowDesign: false,
      maxTextLength: 200,
      textFields: [
        { name: "honoree_name", placeholder: "In Memory of...", required: true },
        { name: "dedication", placeholder: "Dedication message...", required: false }
      ]
    },
    productionDays: 3,
    rushAvailable: false,
    weight: 0,
    inStock: true,
    requiresProofApproval: false
  }
];
