import { pool } from "./db";
import { NEW_POSTS } from "./blog-seeds";
import { NEW_POSTS_2 } from "./blog-seeds-2";

// ── Content types ─────────────────────────────────────────────────────────────
export type ContentSection =
  | { t: "p";     v: string }
  | { t: "h2";    v: string }
  | { t: "h3";    v: string }
  | { t: "ul";    v: string[] }
  | { t: "ol";    v: string[] }
  | { t: "tip";   v: string }
  | { t: "warn";  v: string }
  | { t: "facts"; v: { k: string; val: string }[] }
  | { t: "quote"; v: string };

export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  destination_name: string | null;
  destination_iata: string | null;
  country: string | null;
  region: string | null;
  continent: string | null;
  hero_emoji: string;
  hero_image_url: string | null;
  rental_airport: string | null;
  hotel_city: string | null;
  has_tours: boolean;
  content_json: ContentSection[];
  best_time_to_visit: string | null;
  tags: string[];
  seo_title: string;
  seo_description: string;
  reading_time_mins: number;
  featured: boolean;
  published: boolean;
  published_at: Date;
};

// ── Seed posts ────────────────────────────────────────────────────────────────

const POSTS: Omit<BlogPost, "id" | "published_at" | "hero_image_url" | "has_tours">[] = [

  // ── 1. Everest Base Camp ────────────────────────────────────────────────────
  {
    slug: "everest-base-camp-trek-guide",
    title: "Everest Base Camp Trek: The Complete Guide (2025/2026)",
    excerpt: "Everything you need to know about the Everest Base Camp trek — permits, itinerary, costs, altitude sickness, and what no guidebook will tell you.",
    seo_title: "Everest Base Camp Trek Guide 2025 | Route, Cost, Permits & Tips",
    seo_description: "Complete Everest Base Camp trek guide covering permits, day-by-day itinerary, costs ($1,200–$2,500), altitude sickness, and packing list. Plan your EBC trek with confidence.",
    category: "trek-report",
    destination_name: "Everest Base Camp",
    destination_iata: "KTM",
    country: "Nepal",
    region: "South Asia",
    continent: null,
    rental_airport: null,
    hotel_city: null,
    hero_emoji: "🏔️",
    best_time_to_visit: "March–May and October–November",
    tags: ["nepal", "trekking", "himalaya", "everest", "adventure", "ebc"],
    reading_time_mins: 14,
    featured: true,
    published: true,
    content_json: [
      { t: "p", v: "At 5,364 metres above sea level, Everest Base Camp isn't the summit of the world's highest mountain — it's the place where you stand at the foot of it, look up, and understand how small you are. The trek to reach it is one of the most rewarding experiences on the planet: 12–16 days of walking through Sherpa villages, rhododendron forests, glacial moraines, and Buddhist monasteries, with a mountain view that makes every ache worthwhile." },
      { t: "facts", v: [
        { k: "Max altitude", val: "5,364 m / 17,598 ft" },
        { k: "Duration", val: "12–16 days" },
        { k: "Distance", val: "~130 km round trip" },
        { k: "Difficulty", val: "Moderate – Challenging" },
        { k: "Best season", val: "Mar–May & Oct–Nov" },
        { k: "Start point", val: "Lukla (fly from Kathmandu)" },
        { k: "Daily cost", val: "$50–$100 (teahouse + meals + tea)" },
        { k: "Total budget", val: "$1,200–$2,500 incl. permits & Lukla flights" },
        { k: "Fly into", val: "Kathmandu (KTM)" },
      ]},
      { t: "h2", v: "Is Everest Base Camp Right for You?" },
      { t: "p", v: "The honest answer: if you can hike 6–8 hours a day with a daypack on uneven terrain, and you're willing to acclimatise properly, you can do this trek. You don't need to be a mountaineer or even an experienced trekker. What you need is patience — with the altitude, with the weather, and with yourself. Many people who consider themselves 'not sporty' have completed EBC. Many fit people have turned back due to altitude sickness. Fitness helps; going slowly matters more." },
      { t: "h2", v: "Best Time to Trek" },
      { t: "p", v: "Spring (March–May) offers warmer temperatures, longer daylight hours, and rhododendrons in full bloom. October and November are the classic post-monsoon months — crystal-clear skies, spectacular views, and the busiest trails. December through February is possible but brutal above Dingboche (-20°C at night). The monsoon (June–September) brings heavy rain, leeches, and trail erosion — avoid it unless you enjoy suffering." },
      { t: "h2", v: "How to Get There" },
      { t: "p", v: "Fly to Kathmandu (KTM) first. From there, take a 35-minute mountain flight to Lukla's Tenzing-Hillary Airport — one of the world's most dramatic runway approaches, with a sheer cliff drop at one end. Book the Kathmandu→Lukla flight well in advance; seats fill 3–4 months ahead during peak season and weather cancellations are common." },
      { t: "tip", v: "Book morning Lukla flights — afternoon departures are cancelled far more often due to cloud build-up. During peak October–November, consider flying via Ramechhap (2.5 hrs east of Kathmandu) to avoid Lukla congestion. Budget 1–2 extra days in Kathmandu as a weather buffer." },
      { t: "h2", v: "Permits and Entry Fees" },
      { t: "ul", v: [
        "TIMS Card (Trekkers' Information Management System) — approximately USD 20/person",
        "Sagarmatha National Park Entry Permit — approximately USD 34/person",
        "Khumbu Pasang Lhamu Rural Municipality Fee — approximately USD 3/person",
        "Total permit cost: roughly USD 57 — arranged in Kathmandu (Tourism Board office, Thamel) or at checkpoints",
      ]},
      { t: "h2", v: "Classic Day-by-Day Itinerary" },
      { t: "ol", v: [
        "Day 1 — Fly Kathmandu → Lukla (2,860 m), trek to Phakding (2,610 m) — 3–4 hrs easy",
        "Day 2 — Phakding → Namche Bazaar (3,440 m) — 5–6 hrs with a steep final climb through forest",
        "Day 3 — Acclimatisation day in Namche. Day hike to Everest View Hotel (3,880 m) for your first sight of Everest",
        "Day 4 — Namche → Tengboche (3,867 m) — 5–6 hrs. Arrive in time for evening prayers at Tengboche Monastery",
        "Day 5 — Tengboche → Dingboche (4,410 m) — 5–6 hrs through high alpine valley",
        "Day 6 — Acclimatisation day in Dingboche. Hike to Nagarjun Hill (5,100 m) for views of Lhotse and Makalu",
        "Day 7 — Dingboche → Lobuche (4,940 m) — 4–5 hrs on a rocky moraine path",
        "Day 8 — Lobuche → Gorak Shep (5,170 m) → Everest Base Camp (5,364 m) → back to Gorak Shep — 7–8 hrs total. Your biggest day",
        "Day 9 — Early hike to Kala Patthar (5,550 m) for the iconic Everest sunrise view. Descend to Pheriche (4,371 m)",
        "Day 10 — Pheriche → Namche Bazaar — 6–7 hrs (the descent is fast)",
        "Day 11 — Namche → Lukla — 6–7 hrs",
        "Day 12 — Fly Lukla → Kathmandu (weather permitting — always build in a buffer day)",
      ]},
      { t: "h2", v: "Altitude Sickness: The Thing That Stops Most People" },
      { t: "p", v: "Acute Mountain Sickness (AMS) is not a sign of weakness — it's physiology. Roughly 75% of trekkers experience symptoms above 3,000 m: headache, nausea, fatigue, dizziness. The golden rules are simple: ascend no more than 300–500 m per day above 3,000 m, take your acclimatisation days seriously (don't skip Namche rest day to 'save time'), drink 3–4 litres of water daily, and never push through worsening symptoms. If your condition deteriorates, descend immediately. Altitude kills when ignored." },
      { t: "warn", v: "Never take sleeping pills at altitude — they suppress breathing during sleep. If symptoms worsen at Namche, Dingboche, or Gorak Shep, descend at least 500 m before sleeping. Carry a pulse oximeter; a SpO2 reading below 80% is a medical warning sign. Your Lukla flight and hotel money mean nothing if you're in trouble above 4,000 m." },
      { t: "h2", v: "Teahouse Life: What to Expect" },
      { t: "p", v: "The entire EBC route is serviced by teahouses — family-run guesthouses that provide a bed and meals. Rooms are basic: bed, blanket, shared bathroom. Heating is minimal above Dingboche. Bring a sleeping bag rated to -15°C. Wi-Fi exists but is slow and costs extra (usually $2–5/night). Charging devices at power points costs $2–5 per charge. Everything above Namche costs more because porters and yaks carry it up. Expect dal bhat, momos, soup, and the occasional Snickers bar." },
      { t: "tip", v: "Eat dal bhat whenever you're tired. It comes with unlimited refills of rice, lentils, vegetables, and achar (pickle). It's the dish that fuels porters carrying 35 kg loads — it'll fuel you too. It's also the cheapest thing on every menu." },
      { t: "h2", v: "Guide or No Guide?" },
      { t: "p", v: "The trail is well-marked and you can trek independently. But a local guide (USD 30–50/day) dramatically enriches the experience — they read the mountain weather, speak Sherpa with local communities, and provide safety context no app can. A porter (USD 20–25/day) carries your heavy bag so you can actually enjoy the walk. Hire locally rather than through international agencies — more money stays in the community that way." },
      { t: "h2", v: "What to Pack" },
      { t: "ul", v: [
        "Layering system: moisture-wicking base layer, insulating mid-layer, waterproof shell",
        "Down jacket — essential above Namche Bazaar",
        "Trekking poles — your knees will thank you on every descent",
        "Broken-in waterproof trekking boots — new boots are blisters waiting to happen",
        "Sleeping bag rated to -15°C (or liner + teahouse blanket above Namche)",
        "Headlamp with spare batteries — power cuts happen",
        "UV-protection sunglasses and SPF 50+ sunscreen — UV is intense at altitude",
        "Diamox (Acetazolamide) — get a prescription before you travel; reduces AMS risk",
        "Power bank (20,000 mAh) — charging on the trail is expensive and unreliable",
        "USD cash — ATMs exist in Namche but charge high fees and often run out",
        "Snacks from Kathmandu — energy gels, nuts, protein bars are 2–3x cheaper in the city",
      ]},
      { t: "h2", v: "Essential Tips from the Trail" },
      { t: "ul", v: [
        "Get travel insurance that explicitly covers high-altitude trekking (above 5,000 m) and helicopter evacuation — this is non-negotiable",
        "Kala Patthar (5,550 m) often gives better Everest views than Base Camp itself — never skip it",
        "The tea is not free above Namche. A cup of hot lemon costs $3–5 at Gorak Shep. Budget accordingly",
        "Plastic bags are banned in Sagarmatha National Park — bring reusable bags",
        "Download offline maps (Maps.me, AllTrails) before leaving Kathmandu — signal disappears above Namche",
        "Book your accommodation before the trip during Oct–Nov peak — teahouses fill completely",
      ]},
    ],
  },

  // ── 2. Kathmandu ────────────────────────────────────────────────────────────
  {
    slug: "kathmandu-travel-guide",
    title: "Kathmandu Travel Guide: What First-Timers Need to Know",
    excerpt: "Kathmandu is chaotic, spiritual, and completely unforgettable. Here's an honest guide covering temples, neighbourhoods, food, scams to avoid, and what nobody posts on Instagram.",
    seo_title: "Kathmandu Travel Guide 2025 | Things to Do, Cost & Tips for First-Timers",
    seo_description: "First-timer's guide to Kathmandu: top temples, where to stay, what to eat, how much to budget ($30–$80/day), and the scams to know before you arrive.",
    category: "destination-guide",
    destination_name: "Kathmandu",
    destination_iata: "KTM",
    country: "Nepal",
    region: "South Asia",
    continent: null,
    rental_airport: null,
    hotel_city: null,
    hero_emoji: "🛕",
    best_time_to_visit: "October–November and February–April",
    tags: ["nepal", "kathmandu", "temples", "culture", "city-guide", "asia"],
    reading_time_mins: 10,
    featured: true,
    published: true,
    content_json: [
      { t: "p", v: "Kathmandu doesn't ease you in gently. The moment you step outside Tribhuvan Airport, you're in a city of honking motorbikes, incense smoke, cow traffic jams, and a skyline of both ancient pagodas and ugly concrete blocks. It's loud, dusty, and sensory-overloading — and within 48 hours, most travellers are completely in love with it." },
      { t: "facts", v: [
        { k: "Country", val: "Nepal" },
        { k: "Altitude", val: "1,400 m / 4,600 ft" },
        { k: "Language", val: "Nepali (English widely spoken in tourist areas)" },
        { k: "Currency", val: "Nepalese Rupee (NPR) — ~133 NPR to 1 USD" },
        { k: "Daily budget", val: "$30 (backpacker) to $80 (mid-range)" },
        { k: "Visa", val: "On arrival for most nationalities — USD 30 for 15 days" },
        { k: "Best seasons", val: "Oct–Nov and Feb–Apr" },
        { k: "Airport", val: "Tribhuvan International (KTM)" },
      ]},
      { t: "h2", v: "Arriving at Tribhuvan Airport" },
      { t: "p", v: "Tribhuvan is small, manageable, and not as chaotic as you might fear. Get your visa on arrival at the immigration counters before baggage claim (bring passport photos and USD 30 cash). Once through, get a local SIM card — Ncell and NTC both sell them at the airport for around $3–5 with data. Take a pre-paid taxi from the official booth inside the terminal (around NPR 700–800 to Thamel, roughly $5–6) and ignore drivers who approach you outside." },
      { t: "tip", v: "Nepal power uses Type C/D plugs at 230V. If you're arriving with a dying phone, know that the airport's charging points are limited. Your hotel in Thamel will have power strips — ask at check-in." },
      { t: "h2", v: "Where to Stay: Understanding the Neighbourhoods" },
      { t: "ul", v: [
        "Thamel — The tourist hub. Busy, loud, full of trekking gear shops, rooftop restaurants, and other travellers. Perfect base if you're preparing for a trek or want easy access to everything.",
        "Patan (Lalitpur) — A quieter, more artistic district just south of Kathmandu. Beautiful Durbar Square, better food scene, and a more 'real city' feel. Great for 2nd-time visitors.",
        "Bhaktapur — A separate medieval city 13 km east. Best visited as a day trip; staying overnight lets you see it without the day-trip crowds.",
        "Boudhanath area — Near the famous stupa. Quieter than Thamel, slightly spiritual energy, popular with long-term travellers and meditators.",
      ]},
      { t: "h2", v: "Top Things to Do in Kathmandu" },
      { t: "ol", v: [
        "Boudhanath Stupa — One of the world's largest Buddhist stupas. Walk clockwise around it at dusk when the prayer wheels are spinning and monks are doing their evening rounds. Free to walk around; small entry fee to the stupa courtyard.",
        "Pashupatinath Temple — Nepal's most sacred Hindu temple, built on the banks of the Bagmati River. Non-Hindus cannot enter the main temple but the surrounding ghats and cremation platforms are open and deeply atmospheric.",
        "Swayambhunath (Monkey Temple) — A Buddhist stupa on a hilltop above the city. The 365 steps up are worth it for the city panorama. Watch the resident rhesus macaques steal snacks from tourists.",
        "Kathmandu Durbar Square — The old royal palace complex. Damaged significantly by the 2015 earthquake but still magnificent. Best explored in the morning before tour groups arrive.",
        "Thamel Market — Walk it at least once. Buy nothing the first day; prices drop 30–40% after even minimal negotiation.",
        "Garden of Dreams — A restored Edwardian garden in the middle of Thamel. Peaceful, unusual, and the perfect place to escape the noise for an hour.",
        "Asan Bazaar — The real neighbourhood market. Spices, vegetables, dried fish, and hardware. No tourists, all local. Wander north from Thamel.",
      ]},
      { t: "h2", v: "Day Trips from Kathmandu" },
      { t: "ul", v: [
        "Bhaktapur Durbar Square (1 hr east) — A remarkably well-preserved medieval city. The 55-Window Palace and Nyatapola Temple are extraordinary. Entry USD 15; worth every cent.",
        "Nagarkot (1.5 hrs east) — A ridge-top village with sunrise views of the Himalayan range including Everest on clear days. Take a local bus or hire a taxi.",
        "Panauti (1.5 hrs east) — Almost no tourists. Two ancient temples at the confluence of two rivers. One of the most photogenic spots in the Kathmandu Valley.",
        "Dhulikhel (1.5 hrs east) — Another Himalayan viewpoint, slightly less visited than Nagarkot. Good hiking options nearby.",
        "Dakshinkali Temple (1 hr south) — An active Kali temple where animal sacrifices are performed on Tuesdays and Saturdays. Not for the faint-hearted, but deeply genuine.",
      ]},
      { t: "h2", v: "What to Eat in Kathmandu" },
      { t: "ul", v: [
        "Dal Bhat — Nepal's national dish. Steamed rice, lentil soup, vegetable curry, and achar (pickle). Eaten twice a day by most Nepalis. Filling, healthy, and very cheap ($2–4).",
        "Momos — Tibetan-origin dumplings filled with meat or vegetables. Steam or fry them. Find them everywhere; the best are in small local restaurants, not tourist-facing spots.",
        "Thakali Set Meal — A more elaborate dal bhat variation from the Thak Khola region. Often served with gundruk (fermented leafy greens) and a variety of side dishes.",
        "Yomari — A sweet rice-flour dumpling filled with chaku (molasses) or khuwa (milk solids). Seasonal Newari delicacy; ask locals where to find them.",
        "Butter Tea (Po cha) — Tibetan-style tea made with yak butter, salt, and milk. An acquired taste but warming at altitude.",
        "Rooftop restaurants in Thamel — Have dinner at least once overlooking the neighbourhood. Slightly expensive by local standards but still extremely cheap by Western ones.",
      ]},
      { t: "h2", v: "What Nobody Tells You About Kathmandu" },
      { t: "ul", v: [
        "Air quality is genuinely poor during dry season (Nov–Feb). A basic dust mask or high-quality face mask is not paranoid — it's sensible.",
        "Power cuts (load shedding) used to be constant; they're much better now but can still happen. Carry a headlamp.",
        "Dogs own the night. Street dogs sleep all day and roam in packs after dark. They won't attack you unless you spook them. Give them a wide berth.",
        "The '5 km rule' for taxis doesn't apply in Kathmandu — always negotiate the fare before you get in. Better still, use a rideshare app like inDrive.",
        "The 2015 earthquake damaged many historic structures. Some temples look 'restored' with clearly new brickwork. That's honest and ongoing — Nepal is still rebuilding.",
        "Altitude affects you even at 1,400 m if you've just flown from sea level. Some people get mild headaches in Kathmandu. Stay hydrated on arrival day.",
      ]},
      { t: "h2", v: "Budget Breakdown" },
      { t: "facts", v: [
        { k: "Budget guesthouse (Thamel)", val: "$8–$20/night" },
        { k: "Mid-range hotel", val: "$35–$80/night" },
        { k: "Dal bhat at local place", val: "$2–$4" },
        { k: "Rooftop restaurant meal", val: "$6–$15" },
        { k: "Local beer (Everest/Gorkha)", val: "$1.50–$3" },
        { k: "Taxi across city", val: "$2–$5" },
        { k: "Bhaktapur day trip (taxi + entry)", val: "$25–$35 total" },
        { k: "Total daily budget (backpacker)", val: "$30–$45" },
        { k: "Total daily budget (mid-range)", val: "$60–$100" },
      ]},
    ],
  },

  // ── 3. Pokhara ──────────────────────────────────────────────────────────────
  {
    slug: "pokhara-travel-guide",
    title: "Pokhara Travel Guide: Nepal's Himalayan Gateway",
    excerpt: "Pokhara is where Nepal slows down. Lakeside cafés, paragliding above the Annapurna range, and the starting point for some of the world's finest treks.",
    seo_title: "Pokhara Travel Guide 2025 | Things to Do, Lakeside Area & Treks",
    seo_description: "Complete guide to Pokhara, Nepal — things to do, Phewa Lake, paragliding, Sarangkot sunrise, budget tips, and how to use it as a base for Annapurna treks.",
    category: "destination-guide",
    destination_name: "Pokhara",
    destination_iata: "PKR",
    country: "Nepal",
    region: "South Asia",
    continent: null,
    rental_airport: null,
    hotel_city: null,
    hero_emoji: "🌅",
    best_time_to_visit: "October–November and February–April",
    tags: ["nepal", "pokhara", "lakeside", "annapurna", "paragliding", "trekking"],
    reading_time_mins: 8,
    featured: false,
    published: true,
    content_json: [
      { t: "p", v: "After the noise of Kathmandu, Pokhara feels like a long exhale. Situated at 827 metres beside the reflective waters of Phewa Lake, with the white wall of the Annapurna Himalaya directly behind it, Pokhara is the most visually stunning city in Nepal — and the most relaxed. People come to rest between treks, to paraglide, to watch the sunrise turn the mountains pink, and to sit by the lake doing precisely nothing for longer than planned." },
      { t: "facts", v: [
        { k: "Distance from Kathmandu", val: "~200 km — 6–8 hrs by bus or 25 min by flight" },
        { k: "Altitude", val: "827 m / 2,713 ft" },
        { k: "Lake", val: "Phewa Lake (3rd largest in Nepal)" },
        { k: "Trek gateway", val: "Annapurna Circuit, Annapurna Base Camp, Poon Hill" },
        { k: "Best seasons", val: "Oct–Nov and Feb–Apr" },
        { k: "Airport", val: "Pokhara International (PKR)" },
        { k: "Daily budget", val: "$25 (backpacker) to $70 (mid-range)" },
      ]},
      { t: "h2", v: "Getting There" },
      { t: "p", v: "From Kathmandu, you have two options. A 25-minute flight (USD 90–140 one way) is worth it for the mountain views on approach alone — try to sit on the left side (window seat A/B) for the Himalayan panorama. The tourist bus (USD 12–18) takes 6–8 hours on a winding mountain road — scenic but tough. Local buses are cheaper still but take longer. Skip the night bus; the road is not the place to sleep." },
      { t: "h2", v: "The Lakeside Area" },
      { t: "p", v: "Pokhara's main tourist strip runs along the eastern shore of Phewa Lake. It's relaxed, walkable, and lined with cafés, bookshops, gear rentals, and rooftop restaurants. It's exactly what it sounds like — slightly backpacker-ish, slightly hippie, completely comfortable. The rowboat rentals on the lake ($4–6/hr) are obligatory: paddle out to Tal Barahi Temple on a small island at sunrise before the tour groups arrive." },
      { t: "h2", v: "Top Things to Do in Pokhara" },
      { t: "ol", v: [
        "Paragliding from Sarangkot — a 30–45 minute tandem flight above the Annapurna range and Phewa Lake. Costs $80–$100 with a certified operator. One of the great experiences in Asia.",
        "Sarangkot Sunrise — wake up at 4:30 AM and take a taxi to the Sarangkot viewpoint (1,592 m) to watch the Annapurna massif and Machapuchare (Fishtail Peak) turn golden. Free; bring warm layers.",
        "Phewa Lake boat and temple — rent a wooden rowboat and paddle to Tal Barahi Island Temple. The Annapurna reflection in the lake on a calm morning is extraordinary.",
        "Davis Falls and Gupteshwor Cave — a waterfall that disappears underground into a cave system. Worth a combined visit (30 mins total, small entry fee).",
        "International Mountain Museum — genuinely excellent. Covers the history of Himalayan mountaineering with exhibits on every 8,000 m peak. USD 5 entry.",
        "Begnas Lake — 15 km east of Pokhara's tourist strip. Almost no tourists, local fishing boats, excellent cycling. Rent a bicycle in Lakeside and ride there in the morning.",
        "Shanti Stupa (World Peace Pagoda) — a Japanese Buddhist stupa on a hilltop across the lake. Hike up from the south shore or take a boat across then a 20-minute walk. Best at dusk.",
      ]},
      { t: "h2", v: "Treks Starting from Pokhara" },
      { t: "ul", v: [
        "Poon Hill (4 days, moderate) — the most popular short trek in Nepal. Classic viewpoint of Dhaulagiri and Annapurna South at sunrise. Perfect if you have limited time.",
        "Annapurna Base Camp — ABC (7–10 days, moderate) — shorter and lower than EBC (4,130 m), but with dramatic close-up views of the Annapurna massif. Less crowded than EBC.",
        "Annapurna Circuit (14–21 days, challenging) — the full classic, crossing the Thorong La Pass (5,416 m). One of the great long treks on earth.",
        "Mardi Himal Trek (4–6 days, moderate) — a lesser-known route with excellent views and far fewer trekkers. A hidden gem.",
      ]},
      { t: "h2", v: "Where to Eat" },
      { t: "p", v: "The Lakeside strip has everything from Israeli breakfast spots to Nepali thali restaurants to pizza places. Moondance Restaurant is a local institution. For the best dal bhat, walk 10 minutes away from the lakeside into the residential streets — prices halve and the food is more authentic. Pokhara has good coffee culture; Himalayan Java (founded here) does proper espresso." },
      { t: "tip", v: "Avoid restaurants that put their menus in 12 languages and have a photo of every dish. Walk towards the residential streets behind the tourist strip. You'll pay a third of the price for better food. Ask your hotel's kitchen staff where they eat." },
      { t: "h2", v: "Practical Tips" },
      { t: "ul", v: [
        "The Lakeside area has regular power cuts — carry a power bank",
        "Monsoon (June–September) means rain and leeches. The lake views also disappear in cloud.",
        "Altitude is mild here (827 m) — no acclimatisation needed before trekking",
        "Trekking gear is available to rent or buy in Lakeside at competitive prices — you don't need to buy everything in Kathmandu",
        "Bargain for everything except food — trekking gear is typically listed at double the fair price",
      ]},
    ],
  },

  // ── 4. Annapurna Circuit ────────────────────────────────────────────────────
  {
    slug: "annapurna-circuit-trek-guide",
    title: "Annapurna Circuit Trek: Complete Guide (2025/2026)",
    excerpt: "The Annapurna Circuit is one of the world's great long treks — 160 km through six climate zones, over a 5,416 m mountain pass. Here's how to do it right.",
    seo_title: "Annapurna Circuit Trek Guide 2025 | Route, Permits, Cost & Itinerary",
    seo_description: "Complete Annapurna Circuit trek guide: day-by-day itinerary, Thorong La Pass tips, permits, costs, best season, and whether it's better than Everest Base Camp.",
    category: "trek-report",
    destination_name: "Annapurna Circuit",
    destination_iata: "PKR",
    country: "Nepal",
    region: "South Asia",
    continent: null,
    rental_airport: null,
    hotel_city: null,
    hero_emoji: "⛰️",
    best_time_to_visit: "March–May and October–November",
    tags: ["nepal", "trekking", "annapurna", "himalaya", "adventure", "thorong-la"],
    reading_time_mins: 12,
    featured: false,
    published: true,
    content_json: [
      { t: "p", v: "For decades, the Annapurna Circuit was considered the finest trek on earth. It still is, if you do it right. A full circuit takes you through six distinct climate zones — subtropical lowlands, rice terraces, pine forests, high desert, glacial valleys, and barren moonscape above 5,000 m — before crossing the Thorong La Pass at 5,416 m and descending into the pilgrimage town of Muktinath. Few multi-week walks on the planet match its variety." },
      { t: "facts", v: [
        { k: "Total distance", val: "160–230 km (depending on route variation)" },
        { k: "Duration", val: "14–21 days" },
        { k: "Highest point", val: "Thorong La Pass — 5,416 m / 17,769 ft" },
        { k: "Difficulty", val: "Challenging" },
        { k: "Best season", val: "Mar–May & Oct–Nov" },
        { k: "Start", val: "Besisahar (from Pokhara or Kathmandu)" },
        { k: "End", val: "Pokhara (via Nayapul) or Jomsom (jeep to Pokhara)" },
        { k: "Budget", val: "$600–$1,500 depending on guide, pace, and season" },
      ]},
      { t: "h2", v: "Annapurna Circuit vs Everest Base Camp" },
      { t: "p", v: "This is the question every trekker debates. EBC is more dramatic in a single-peak sense — it ends at the foot of the highest mountain on earth. The Circuit wins on variety: you walk through landscapes that feel like different countries within a single trek. EBC is more accessible (clearer trail, more infrastructure). The Circuit is wilder, culturally richer, and at the end of the day, a more complete trekking experience. If you can only do one — do both separately on two trips." },
      { t: "h2", v: "Permits Required" },
      { t: "ul", v: [
        "TIMS Card (Trekkers' Information Management System) — approximately USD 20/person",
        "Annapurna Conservation Area Permit (ACAP) — approximately USD 34/person",
        "Both can be arranged at the Nepal Tourism Board in Kathmandu or Pokhara — bring passport photos",
      ]},
      { t: "h2", v: "The Classic Route (Simplified)" },
      { t: "ol", v: [
        "Besisahar → Bahundanda (Day 1–2) — Gentle start through terraced rice fields and subtropical forest",
        "Bagarchhap → Manang (Day 3–6) — The valley narrows; climate shifts from tropical to alpine",
        "Manang Acclimatisation Day — Essential. Hike to Ice Lake (4,600 m) or Gangapurna Lake. Do not skip this day.",
        "High Camp (4,850 m) — Sleep here, not at Thorong Phedi. The extra acclimatisation helps enormously.",
        "Thorong La Pass (5,416 m) — The summit of the trek. Start before dawn (4–5 AM) to beat afternoon wind and cloud. Descent to Muktinath takes 3–4 hours.",
        "Muktinath → Jomsom (Day 8–9) — Pilgrimage town with a sacred Hindu-Buddhist temple. Explore Kagbeni if time allows.",
        "Jomsom → Tatopani (Day 10–11) — Hot springs at Tatopani are mandatory after the pass crossing.",
        "Tatopani → Ghorepani → Poon Hill (Day 12–13) — A sunrise side detour with panoramic Annapurna and Dhaulagiri views.",
        "Poon Hill → Nayapul → Pokhara (Day 14) — End of the circuit. Bus or taxi to Pokhara.",
      ]},
      { t: "h2", v: "Thorong La Pass: The Day Everyone Talks About" },
      { t: "p", v: "Crossing Thorong La is the physical and emotional centrepiece of the circuit. Most trekkers wake at 3–4 AM to start the 4–5 hour ascent in darkness, timing the crossing before afternoon winds and clouds arrive. The final push above 5,000 m is slow and breathless but manageable. The descent to Muktinath is steep and long. What waits at the top is a small tea stall, prayer flags strung across the saddle, and a view that makes the entire journey make sense." },
      { t: "warn", v: "Thorong La is a serious high-altitude pass. Do not attempt it if you feel unwell, have AMS symptoms, or if weather is deteriorating. People have died on this pass underestimating conditions. Accept a delay rather than push through. The pass is typically closed from December to February due to snow and ice." },
      { t: "h2", v: "What Makes the Circuit Special" },
      { t: "ul", v: [
        "The ethnic and cultural diversity — you walk through Gurung, Manangi, and Mustang communities each with distinct languages and traditions",
        "Manang's altitude and remoteness — at 3,519 m, this high-altitude farming village feels genuinely off-grid",
        "The Upper Mustang landscape beyond Jomsom — a high-altitude desert that looks more like Tibet than Nepal",
        "Kagbeni village — a medieval walled settlement at the gateway to Upper Mustang. Worth an extra night",
        "Tatopani hot springs — you've earned them after the pass",
        "Poon Hill sunrise — one of the iconic Himalayan viewpoints, a perfect finish",
      ]},
      { t: "tip", v: "The jeep road now runs much of the lower and middle circuit, which reduced the walking route for some sections. To avoid road walking, consider taking jeeps through the less scenic lower sections and saving your legs for the high-altitude sections above Chame." },
    ],
  },

  // ── 5. Nepal Budget ─────────────────────────────────────────────────────────
  {
    slug: "nepal-budget-travel-guide",
    title: "Nepal on a Budget: How Much Does It Actually Cost in 2025?",
    excerpt: "Nepal is one of Asia's best value destinations — but only if you know how. Here's an honest breakdown of what things actually cost and how to make your money go further.",
    seo_title: "Nepal Budget Travel Guide 2025 | Daily Costs, Tips & How to Save",
    seo_description: "Honest breakdown of Nepal travel costs in 2025 — accommodation, food, trekking, transport, and permits. What budget travellers actually spend day-to-day.",
    category: "travel-tips",
    destination_name: "Nepal",
    destination_iata: "KTM",
    country: "Nepal",
    region: "South Asia",
    continent: null,
    rental_airport: null,
    hotel_city: null,
    hero_emoji: "💡",
    best_time_to_visit: "October–November and February–April",
    tags: ["nepal", "budget", "travel-tips", "costs", "backpacking", "planning"],
    reading_time_mins: 8,
    featured: false,
    published: true,
    content_json: [
      { t: "p", v: "Nepal has a reputation for being expensive because people see trekking costs and assume that's everything. It's not. Daily life in Nepal is remarkably cheap, and even the trekking costs are modest compared to guided wilderness experiences elsewhere. A traveller who plans properly can spend two weeks in Nepal — including a major trek — for under $1,500 total. Here's what things actually cost." },
      { t: "h2", v: "The Three Budget Levels" },
      { t: "facts", v: [
        { k: "Backpacker", val: "$30–$45/day — dorm or cheap guesthouse, dal bhat twice a day, local buses" },
        { k: "Mid-range", val: "$60–$100/day — private hotel room, mix of local and tourist restaurants, occasional taxi" },
        { k: "Comfortable", val: "$120–$200/day — 3-4 star hotel, guided activities, better trekking setup" },
      ]},
      { t: "h2", v: "Accommodation Costs" },
      { t: "ul", v: [
        "Kathmandu dorm bed (Thamel) — $5–$10/night",
        "Kathmandu budget private room — $12–$25/night",
        "Kathmandu mid-range hotel — $40–$80/night",
        "Pokhara Lakeside guesthouse — $10–$20/night",
        "Teahouse on trek (EBC/Annapurna) — $3–$10/night (usually free if you eat all meals there)",
        "Note: Teahouse accommodation is almost always tied to eating at that guesthouse — rooms are a loss leader for food sales",
      ]},
      { t: "h2", v: "Food: The Dal Bhat Rule" },
      { t: "p", v: "Dal bhat is the national dish and the national bargain. Two plates a day — morning and evening — provides all the calories and nutrition a trekker needs, and costs $2–$5 per meal in local restaurants. On trek, it comes with unlimited rice refills (you can ask for more dhal, vegetable curry, and achar as many times as you want). Eating dal bhat twice a day is not just budget-friendly — it's what every porter, guide, and local eats. It works." },
      { t: "facts", v: [
        { k: "Dal bhat (local restaurant)", val: "$2–$4" },
        { k: "Momos (10 pieces)", val: "$1.50–$3" },
        { k: "Rooftop restaurant meal (Thamel)", val: "$6–$14" },
        { k: "Local beer (Everest/Gorkha 650ml)", val: "$1.50–$3" },
        { k: "Coffee (espresso)", val: "$1.50–$3" },
        { k: "Fresh fruit juice", val: "$1–$2" },
        { k: "Dal bhat on trek (above 3,500 m)", val: "$6–$12" },
      ]},
      { t: "h2", v: "Getting Around Nepal" },
      { t: "ul", v: [
        "Tourist bus Kathmandu → Pokhara — $12–$18 (6–8 hours)",
        "Flight Kathmandu → Pokhara — $90–$140 one way (25 minutes, worth it for views)",
        "Flight Kathmandu → Lukla — $200–$280 round trip (essential for EBC trek start)",
        "Local city bus in Kathmandu — NPR 20–30 (~$0.20) per journey",
        "Taxi across Kathmandu city — $2–$5 (negotiate before getting in, or use inDrive app)",
        "Motorbike rental (Pokhara) — $8–$15/day",
      ]},
      { t: "h2", v: "Trekking Costs Broken Down" },
      { t: "facts", v: [
        { k: "EBC permits (TIMS + National Park)", val: "~$57/person" },
        { k: "Annapurna permits (TIMS + ACAP)", val: "~$54/person" },
        { k: "Local guide (per day)", val: "$30–$50" },
        { k: "Porter (per day)", val: "$20–$25" },
        { k: "Teahouse room + meals (per day)", val: "$30–$60 depending on altitude" },
        { k: "EBC trek total (independent)", val: "$700–$1,000 for 12–14 days" },
        { k: "EBC trek total (with guide + porter)", val: "$1,200–$2,000" },
        { k: "Annapurna Circuit total", val: "$600–$1,500 for 14–21 days" },
      ]},
      { t: "h2", v: "Money, Banking and Currency" },
      { t: "p", v: "Nepalese Rupees (NPR) can be obtained at the airport (rates are fair) or at money exchange booths in Thamel. ATMs are widely available in Kathmandu and Pokhara but charge fees ($3–5 per withdrawal). Above Namche Bazaar on the EBC route, ATMs exist but are unreliable — carry sufficient USD cash. USD, EUR, and GBP are easily exchanged everywhere. Keep a supply of small denomination notes for local restaurants and buses." },
      { t: "h2", v: "Free and Cheap Things to Do" },
      { t: "ul", v: [
        "Walk around Boudhanath Stupa at dusk — free (small entry fee to inner courtyard only)",
        "Morning ritual at Pashupatinath Temple ghats — free for non-Hindus to observe from the eastern bank",
        "Swayambhunath sunrise — small entry fee, walk up 365 steps for city panorama",
        "Hike above Pokhara — dozens of trails from Lakeside into the hills with no fees",
        "Sit in Kathmandu's courtyards and squares — free, endlessly interesting",
        "Visit local neighbourhood markets (Asan Bazaar, Indra Chowk) — free and completely authentic",
      ]},
      { t: "h2", v: "Budget Tips That Actually Work" },
      { t: "ul", v: [
        "Eat where locals eat — step one street back from any tourist strip and prices drop 40–60%",
        "Hire trekking guides and porters directly (ask your hotel), not through agencies — better pay for them, lower cost for you",
        "Buy gear in Kathmandu or Pokhara — quality is good, prices are reasonable, and you avoid carrying heavy kit on the flight",
        "Take local buses rather than tourist buses where time allows — 5x cheaper",
        "Travel in shoulder season (February–March or late November) — fewer tourists, some accommodation discounts, still good weather",
        "Drink tap water with a purification tablet or filter rather than buying plastic bottles — saves money and is far better for Nepal's environment",
        "Nepal is not a place to scrimp on travel insurance — get comprehensive cover including high-altitude trekking and emergency helicopter evacuation",
      ]},
      { t: "quote", v: "The people who regret Nepal are the ones who rushed it. Take one more week than you think you need." },
    ],
  },
];

// ── DB init + seed ─────────────────────────────────────────────────────────────

async function upsertPost(post: Omit<typeof NEW_POSTS[0], never>) {
  await pool.query(
    `INSERT INTO blog_posts
      (slug, title, excerpt, category, destination_name, destination_iata, country, region, continent,
       hero_emoji, content_json, best_time_to_visit, tags, seo_title, seo_description,
       reading_time_mins, featured, published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     ON CONFLICT (slug) DO NOTHING`,
    [
      post.slug, post.title, post.excerpt, post.category,
      post.destination_name, post.destination_iata, post.country, post.region,
      (post as any).continent ?? null,
      post.hero_emoji, JSON.stringify(post.content_json), post.best_time_to_visit,
      post.tags, post.seo_title, post.seo_description,
      post.reading_time_mins, post.featured, post.published,
    ]
  );
}

export async function initBlogTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id               SERIAL PRIMARY KEY,
      slug             VARCHAR(255) UNIQUE NOT NULL,
      title            TEXT NOT NULL,
      excerpt          TEXT NOT NULL,
      category         TEXT NOT NULL DEFAULT 'destination-guide',
      destination_name TEXT,
      destination_iata TEXT,
      country          TEXT,
      region           TEXT,
      continent        TEXT,
      hero_emoji       TEXT NOT NULL DEFAULT '✈️',
      content_json     JSONB NOT NULL DEFAULT '[]',
      best_time_to_visit TEXT,
      tags             TEXT[] NOT NULL DEFAULT '{}',
      seo_title        TEXT NOT NULL DEFAULT '',
      seo_description  TEXT NOT NULL DEFAULT '',
      reading_time_mins INTEGER NOT NULL DEFAULT 8,
      featured         BOOLEAN NOT NULL DEFAULT FALSE,
      published        BOOLEAN NOT NULL DEFAULT TRUE,
      published_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Add continent column if it doesn't exist yet (migration for existing tables)
  await pool.query(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS continent TEXT`);
  // Add hero_image_url column if it doesn't exist yet
  await pool.query(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS hero_image_url TEXT`);
  // Add rental_airport column if it doesn't exist yet
  await pool.query(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS rental_airport TEXT`);
  // Add hotel_city column if it doesn't exist yet
  await pool.query(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS hotel_city TEXT`);
  // Add has_tours column for ActivityWidget injection
  await pool.query(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS has_tours BOOLEAN DEFAULT FALSE`);

  // Backfill continent for existing Nepal posts
  await pool.query(`UPDATE blog_posts SET continent = 'Asia' WHERE country = 'Nepal' AND continent IS NULL`);

  // Seed original Nepal posts (ON CONFLICT DO NOTHING — safe to re-run)
  for (const post of POSTS) {
    await upsertPost({ ...(post as any), continent: 'Asia' });
  }

  // Seed all new destination posts
  for (const post of NEW_POSTS) {
    await upsertPost(post);
  }

  // Seed second batch of destination posts
  for (const post of NEW_POSTS_2) {
    await upsertPost(post);
  }
}

// ── Queries ────────────────────────────────────────────────────────────────────

function rowToPost(row: any): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    destination_name: row.destination_name,
    destination_iata: row.destination_iata,
    country: row.country,
    region: row.region,
    continent: row.continent ?? null,
    hero_emoji: row.hero_emoji,
    hero_image_url: row.hero_image_url ?? null,
    rental_airport: row.rental_airport ?? null,
    hotel_city: row.hotel_city ?? null,
    has_tours: row.has_tours ?? false,
    content_json: row.content_json ?? [],
    best_time_to_visit: row.best_time_to_visit,
    tags: row.tags ?? [],
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    reading_time_mins: row.reading_time_mins,
    featured: row.featured,
    published: row.published,
    published_at: row.published_at,
  };
}

export async function getBlogPosts(limit = 100, continent?: string): Promise<BlogPost[]> {
  if (continent) {
    const { rows } = await pool.query(
      `SELECT * FROM blog_posts WHERE published = TRUE AND continent = $1 ORDER BY featured DESC, published_at DESC LIMIT $2`,
      [continent, limit]
    );
    return rows.map(rowToPost);
  }
  const { rows } = await pool.query(
    `SELECT * FROM blog_posts WHERE published = TRUE ORDER BY featured DESC, published_at DESC LIMIT $1`,
    [limit]
  );
  return rows.map(rowToPost);
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const { rows } = await pool.query(
    "SELECT * FROM blog_posts WHERE slug = $1 AND published = TRUE",
    [slug]
  );
  return rows.length ? rowToPost(rows[0]) : null;
}

export async function getRelatedPosts(slug: string, country: string | null, limit = 3): Promise<BlogPost[]> {
  const { rows } = await pool.query(
    `SELECT * FROM blog_posts
     WHERE published = TRUE AND slug != $1 AND (country = $2 OR $2 IS NULL)
     ORDER BY featured DESC, published_at DESC LIMIT $3`,
    [slug, country, limit]
  );
  return rows.map(rowToPost);
}

export async function getAllPublishedSlugs(): Promise<{ slug: string; published_at: Date }[]> {
  const { rows } = await pool.query(
    "SELECT slug, published_at FROM blog_posts WHERE published = TRUE ORDER BY published_at DESC"
  );
  return rows;
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export async function getAllBlogPostsAdmin(): Promise<BlogPost[]> {
  const { rows } = await pool.query(
    "SELECT * FROM blog_posts ORDER BY published_at DESC"
  );
  return rows.map(rowToPost);
}

export type BlogPostInput = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  destination_name?: string | null;
  destination_iata?: string | null;
  country?: string | null;
  region?: string | null;
  continent?: string | null;
  hero_emoji: string;
  content_json: import("./blog").ContentSection[];
  best_time_to_visit?: string | null;
  tags: string[];
  seo_title: string;
  seo_description: string;
  reading_time_mins: number;
  featured: boolean;
  published: boolean;
};

export async function createBlogPost(data: BlogPostInput): Promise<BlogPost> {
  const { rows } = await pool.query(
    `INSERT INTO blog_posts
       (slug, title, excerpt, category, destination_name, destination_iata,
        country, region, continent, hero_emoji, content_json, best_time_to_visit,
        tags, seo_title, seo_description, reading_time_mins, featured, published,
        published_at, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
             CASE WHEN $18 THEN NOW() ELSE '2099-01-01' END, NOW(), NOW())
     RETURNING *`,
    [
      data.slug, data.title, data.excerpt, data.category,
      data.destination_name ?? null, data.destination_iata ?? null,
      data.country ?? null, data.region ?? null, data.continent ?? null,
      data.hero_emoji, JSON.stringify(data.content_json),
      data.best_time_to_visit ?? null,
      data.tags, data.seo_title, data.seo_description,
      data.reading_time_mins, data.featured, data.published,
    ]
  );
  return rowToPost(rows[0]);
}

export async function updateBlogPost(id: number, data: Partial<BlogPostInput>): Promise<BlogPost | null> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  const add = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); vals.push(val); };

  if (data.slug !== undefined)             add("slug", data.slug);
  if (data.title !== undefined)            add("title", data.title);
  if (data.excerpt !== undefined)          add("excerpt", data.excerpt);
  if (data.category !== undefined)         add("category", data.category);
  if (data.destination_name !== undefined) add("destination_name", data.destination_name);
  if (data.destination_iata !== undefined) add("destination_iata", data.destination_iata);
  if (data.country !== undefined)          add("country", data.country);
  if (data.region !== undefined)           add("region", data.region);
  if (data.continent !== undefined)        add("continent", data.continent);
  if (data.hero_emoji !== undefined)       add("hero_emoji", data.hero_emoji);
  if (data.content_json !== undefined)     add("content_json", JSON.stringify(data.content_json));
  if (data.best_time_to_visit !== undefined) add("best_time_to_visit", data.best_time_to_visit);
  if (data.tags !== undefined)             add("tags", data.tags);
  if (data.seo_title !== undefined)        add("seo_title", data.seo_title);
  if (data.seo_description !== undefined)  add("seo_description", data.seo_description);
  if (data.reading_time_mins !== undefined) add("reading_time_mins", data.reading_time_mins);
  if (data.featured !== undefined)         add("featured", data.featured);
  if (data.published !== undefined) {
    add("published", data.published);
    add("published_at", data.published ? new Date() : new Date("2099-01-01"));
  }
  add("updated_at", new Date());

  if (sets.length === 0) return null;
  vals.push(id);
  const { rows } = await pool.query(
    `UPDATE blog_posts SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    vals
  );
  return rows.length ? rowToPost(rows[0]) : null;
}

export async function deleteBlogPost(id: number): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM blog_posts WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
