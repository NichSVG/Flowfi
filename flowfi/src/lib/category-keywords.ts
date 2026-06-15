export const CATEGORY_KEYWORDS: Record<string, { keywords: string[]; subcategory?: string; parent?: string }> = {
  // ── INCOME ────────────────────────────────────────────────────────────────────
  "Salary": {
    keywords: ["gaji", "salary", "payroll", "upah", "tunjangan", "THR", "gaji pokok", "take home pay"],
    subcategory: "Salary", parent: "Income",
  },
  "Business": {
    keywords: ["freelance", "project", "konsultasi", "consulting", "jasa", "service", "client", "revenue", "pendapatan", "omzet", "omset"],
    subcategory: "Business", parent: "Income",
  },
  "Investment": {
    keywords: ["investasi", "saham", "stock", "reksadana", "dividen", "dividend", "crypto", "bitcoin", "bunga bank", "deposito"],
    subcategory: "Investment", parent: "Income",
  },
  "Refund": {
    keywords: ["refund", "retur", "return", "cashback", "pengembalian", "nota kredit", "kor ", "freemonth"],
    subcategory: "Other", parent: "Income",
  },

  // ── HOUSING ──────────────────────────────────────────────────────────────────
  "Rent": {
    keywords: ["rent", "sewa", "kost", "kontrakan", "indekos"],
    subcategory: "Rent", parent: "Housing",
  },
  "Mortgage": {
    keywords: ["mortgage", "kpr", "cicilan rumah", "angsuran rumah"],
    subcategory: "Rent", parent: "Housing",
  },
  "Utilities": {
    keywords: ["listrik", "pln", "token listrik", "air", "pdam", "gas", "elpiji", "pgn", "waste", "sampah", "kebersihan"],
    subcategory: "Utilities", parent: "Housing",
  },
  "Maintenance_Housing": {
    keywords: ["perbaikan", "repair", "tukang", "renovasi", "maintenance", "service ac", "ac service", "cat rumah", "ledeng", "plumber"],
    subcategory: "Other", parent: "Housing",
  },
  "Furniture": {
    keywords: ["furniture", "mebel", "meja", "kursi", "lemari", "kasur", "sofa", "ikea", "informa"],
    subcategory: "Furniture", parent: "Housing",
  },

  // ── FOOD & DINING ────────────────────────────────────────────────────────────
  "Food & Dining": {
    keywords: [
      // General food terms
      "warung", "rumah makan", "restoran", "restaurant", "kantin", "warteg",
      "makan", "nasi", "mie", "ayam", "bakso", "sate", "soto", "bakmi",
      "pecel", "lele", "gorengan", "tahu", "tempe", "sambal", "rendang",
      "padang", "sunda", "jawa", "madura", "betawi",
      // Fast food & chains
      "mcdonald", "mcd", "kfc", "pizza", "burger", "subway", "wendys",
      "pepper lunch", "yoshinoya", "hokben", "marugame", "ichiban",
      "jco", "dunkin", "starbucks", "chatime", "gong cha", "koi",
      "rotiboy", "roti unyil", "breadtalk", "hokkaido", "cheese tart",
      // Indonesian food merchants from bank statements
      "pecel lele masjan", "sambal bakar", "foodsomnia", "kantin fifi",
      "kantin jakys", "kantin ribka", "kantin mak surip", "kantin ss",
      "kantin cincin", "gorengan buk min", "gorengan bu min",
      "bakmie ko ayong", "bakmie", "liwet kopral", "somay pandawa",
      "ayam geprek", "ayam bakar", "ayam & bebek talita", "otak otak",
      "warung futsal one", "warung bu daryati", "warung madura",
      "warung ibu nur", "warung jpo", "de foodies", "local's corner",
      "captain greenville", "kedai melati", "pukis", "tahu bulat",
      "tahu sumedang", "martabak", "pempek", "seblak", "cilok",
      "nana thai kitchen", "butter baby", "sancha", "gultik",
      "huang nan kopi", "hu nan kopi", "fore coffee", "reset coffee",
      "jw coffee", "uk matcha", "chulos bakehouse",
      // Restaurants
      "pepper lunch", "famous amos", "five guys", "jamesons",
      "mcdonald", "mcd juanda", "subway wang plaza",
      "roti unyil venus", "mc setyo dharmawan",
      // Food delivery
      "gofood", "grabfood", "shopeefood", "delivery",
      // Convenience stores & groceries
      "alfamart", "alfa_", "indomaret", "minimarket", "familymart",
      "superindo", "supermarket", "grocery", "pasar", "astro",
      "k3mart", "toko novi", "flik",
      // Coffee & drinks
      "coffee", "kopi", "cafe", "tea", "teh", "matcha", "juice",
      "snack", "gorengan", "cemilan",
    ],
    subcategory: "Food & Dining",
  },

  // ── TRANSPORTATION ───────────────────────────────────────────────────────────
  "Fuel": {
    keywords: ["bensin", "fuel", "spbu", "pertamina", "shell", "solar", "pertalite", "pertamax"],
    subcategory: "Fuel", parent: "Transportation",
  },
  "Public Transport": {
    keywords: ["bus", "kereta", "train", "mrt", "lrt", "transjakarta", "tjapp", "krl", "commuter", "angkot", "busway", "gojek", "grab", "taxi", "gocar", "grabcar", "bluebird", "maxim", "uber", "gojek recurring"],
    subcategory: "Public Transport", parent: "Transportation",
  },
  "Parking/Toll": {
    keywords: ["parkir", "parking", "toll", "tol", "e-toll", "ghl*park"],
    subcategory: "Parking/Toll", parent: "Transportation",
  },
  "Maintenance_Vehicle": {
    keywords: ["bengkel", "service mobil", "service motor", "cuci mobil", "cuci motor", "ban", "oli", "spooring"],
    subcategory: "Other", parent: "Transportation",
  },

  // ── SHOPPING ─────────────────────────────────────────────────────────────────
  "Clothing": {
    keywords: ["baju", "fashion", "pakaian", "sepatu", "shoes", "celana", "jaket", "dress", "kemeja", "shopee", "tokopedia", "lazada", "blibli", "bukalapak", "tiktok shop", "shein", "temu", "decathlon", "tts by tkpd"],
    subcategory: "Clothing", parent: "Shopping",
  },
  "Electronics": {
    keywords: ["elektronik", "handphone", "laptop", "komputer", "gadget", "hp", "tablet", "headphone", "charger", "printer", "iseller"],
    subcategory: "Electronics", parent: "Shopping",
  },
  "Home Goods": {
    keywords: ["home goods", "peralatan rumah", "dapur", "kitchen", "cleaning", "pembersih", "sabun", "shampoo", "tissue", "toiletries", "handuk", "sprei"],
    subcategory: "Home", parent: "Shopping",
  },
  "Beauty": {
    keywords: ["beauty", "kosmetik", "makeup", "skincare", "cream", "parfum", "perfume", "lotion", "wardah", "barbershop", "barber", "salon", "haircut", "potong rambut", "lanang barbershop"],
    subcategory: "Beauty", parent: "Shopping",
  },

  // ── HEALTHCARE ───────────────────────────────────────────────────────────────
  "Medical": {
    keywords: ["dokter", "doctor", "rumah sakit", "hospital", "klinik", "clinic", "puskesmas", "dental", "gigi", "dentist", "mata", "optik", "lasik", "therapy", "terapi", "psikolog", "asuransi kesehatan", "bpjs kesehatan", "prudential", "allianz", "manulife"],
    subcategory: "Medical", parent: "Healthcare",
  },
  "Pharmacy": {
    keywords: ["apotek", "farmasi", "obat", "medicine", "vitamin", "suplemen", "pharmacy", "guardian", "century", "k24"],
    subcategory: "Pharmacy", parent: "Healthcare",
  },
  "Fitness": {
    keywords: ["gym", "fitness", "olahraga", "sport", "senam", "yoga", "fitness first", "gold gym", "ftl gym", "badminton", "futsal", "garuda badminton"],
    subcategory: "Fitness", parent: "Healthcare",
  },

  // ── ENTERTAINMENT ───────────────────────────────────────────────────────────
  "Entertainment": {
    keywords: [
      "bioskop", "cinema", "xxi", "cgv", "film", "movie",
      "game", "steam", "steamgames", "playstation", "xbox", "nintendo", "mobile legends", "pubg", "genshin",
      "konser", "concert", "event", "tiket", "festival",
      "hobi", "hobby", "music", "musik",
      "gaming", "tokyo gamingspace", "warnet", "esports", "sky vr",
      "loklok", "tiktok", "google themes",
      "iims", "pameran", "exhibition", "expo",
      "coursiv",
    ],
    subcategory: "Entertainment",
  },

  // ── EDUCATION ────────────────────────────────────────────────────────────────
  "Education": {
    keywords: ["sekolah", "school", "universitas", "university", "kuliah", "spp", "tuition", "kursus", "course", "training", "bootcamp", "udemy", "coursera", "buku", "book", "gramedia", "coursiv", "fotocopy", "fotokopi", "print", "percetakan", "gilar fotocopy"],
    subcategory: "Education",
  },

  // ── TRAVEL ───────────────────────────────────────────────────────────────────
  "Transport_Travel": {
    keywords: ["pesawat", "flight", "airline", "garuda", "lion air", "airasia", "travel", "shuttle", "ferry", "kapal", "sewa mobil", "car rental", "visa", "passport", "paspor", "imigrasi", "digitravel", "traveloka", "tiket.com", "tiketux"],
    subcategory: "Transport", parent: "Travel",
  },
  "Accommodation": {
    keywords: ["hotel", "penginapan", "homestay", "villa", "airbnb", "booking.com", "agoda", "hostel", "langkawi", "genting", "perak"],
    subcategory: "Accommodation", parent: "Travel",
  },
  "Travel_Activities": {
    keywords: ["wisata", "tour", "tiket masuk", "entrance fee", "theme park", "museum", "snorkeling", "diving"],
    subcategory: "Activities", parent: "Travel",
  },

  // ── BILLS & SUBSCRIPTIONS ────────────────────────────────────────────────────
  "Phone": {
    keywords: ["pulsa", "telkomsel", "xl", "axis", "indosat", "smartfren", "phone bill", "tagihan hp", "mobile phone", "ioh ", "ioh_"],
    subcategory: "Phone", parent: "Bills & Subscriptions",
  },
  "Internet": {
    keywords: ["internet", "wifi", "telkom", "indihome", "biznet", "cbn", "myrepublic", "first media", "iconnet", "fiber"],
    subcategory: "Internet", parent: "Bills & Subscriptions",
  },
  "Streaming": {
    keywords: ["netflix", "spotify", "youtube", "disney", "hbo", "vidio", "wetv", "iqiyi", "apple music", "crunchyroll", "tv kabel", "cable tv", "mnc vision", "transvision", "nex parabola"],
    subcategory: "Streaming", parent: "Bills & Subscriptions",
  },
  "Software": {
    keywords: ["chatgpt", "openai", "google one", "google storage", "icloud", "dropbox", "microsoft 365", "adobe", "canva", "figma", "notion", "domain", "hosting", "google wallet"],
    subcategory: "Software", parent: "Bills & Subscriptions",
  },

  // ── FINANCIAL ────────────────────────────────────────────────────────────────
  "Savings": {
    keywords: ["tabungan", "savings", "menabung", "setor", "deposito", "dana darurat", "emergency fund", "dana pensiun", "blusaving", "bluspending"],
    subcategory: "Savings", parent: "Financial",
  },
  "Investments": {
    keywords: ["reksadana", "mutual fund", "saham", "stock", "obligasi", "bond", "sukuk", "emas", "crypto", "bitcoin", "binance", "indodax"],
    subcategory: "Investments", parent: "Financial",
  },
  "Loans": {
    keywords: ["cicilan", "loan", "kredit", "angsuran", "installment", "pinjaman", "kta", "kartu kredit", "credit card"],
    subcategory: "Loans", parent: "Financial",
  },
  "Taxes": {
    keywords: ["pajak", "tax", "pph", "ppn", "pbb", "e-billing", "spt"],
    subcategory: "Taxes", parent: "Financial",
  },
  "Bank Fees": {
    keywords: ["biaya admin", "admin fee", "bank fee", "transfer fee", "biaya transfer", "biaya tarik tunai", "biaya decline", "biaya sms", "biaya pembuatan"],
    subcategory: "Bank Fees", parent: "Financial",
  },
  "E-Wallet": {
    keywords: ["gopayid", "gopay", "ovo", "dana", "shopeepay", "top up e-wallet", "topup e-wallet"],
    subcategory: "E-Wallet", parent: "Financial",
  },

  // ── FAMILY ────────────────────────────────────────────────────────────────────
  "Family": {
    keywords: ["childcare", "daycare", "baby", "bayi", "susu", "diapers", "popok", "mainan", "toys", "school fees", "uang sekolah", "family support", "nafkah"],
    subcategory: "Family",
  },

  // ── GIFTS & DONATIONS ────────────────────────────────────────────────────────
  "Gifts & Donations": {
    keywords: ["hadiah", "kado", "gift", "donasi", "donation", "sedekah", "zakat", "infaq", "amal", "paroki", "gereja", "masjid", "kitabisa", "charity", "pgpm", "pgdp", "maria bunda", "santo frans", "donation"],
    subcategory: "Gifts & Donations",
  },

  // ── MISCELLANEOUS ────────────────────────────────────────────────────────────
  "Miscellaneous": {
    keywords: [],
    subcategory: "Miscellaneous",
  },
};
