// src/lib/seedPlans.ts
import type {
  Activity,
  ActivityType,
  Country,
  ItineraryDay,
  TimeOfDay,
  TripPlan,
} from "./types";

// Small helper so seeded ids are stable & readable (feedback keys depend on them).
function act(
  id: string,
  title: string,
  type: ActivityType,
  timeOfDay: TimeOfDay,
  description: string,
  location?: string,
  tags?: string[]
): Activity {
  return { id, title, type, timeOfDay, description, location, tags };
}

function day(
  id: string,
  dayNumber: number,
  title: string,
  destination: string,
  country: Country,
  summary: string,
  activities: Activity[]
): ItineraryDay {
  return { id, dayNumber, title, destination, country, summary, activities };
}

// ===========================================================================
// PLAN A — Vietnam + Northern Thailand
// ===========================================================================
const planA: TripPlan = {
  id: "plan-a",
  title: "Vietnam + Northern Thailand",
  route: ["Hanoi", "Ninh Binh", "Chiang Mai"],
  countries: ["Vietnam", "Thailand"],
  durationDays: 12,
  ptoDays: 7,
  ptoEfficiency: 8,
  vibeTags: ["food", "culture", "nature", "relaxed markets", "two cultures"],
  logisticsDifficulty: "moderate",
  transferBurden: "1 short train/drive + 1 regional flight (Hanoi→Chiang Mai via BKK)",
  scores: {
    lucasFit: 9,
    girlfriendFit: 8,
    culture: 9,
    relaxation: 7,
    food: 10,
    history: 7,
    nature: 8,
    coreMemory: 9,
  },
  pros: [
    "Two genuinely distinct cultures without a brutal travel day",
    "Arguably the best street food on the whole shortlist",
    "Ninh Binh scenery is a quiet, jaw-dropping counterpoint to two busy cities",
    "Chiang Mai is the soft landing — walkable, mellow, great cafes",
  ],
  cons: [
    "One connection through Bangkok eats most of a travel day",
    "Hanoi traffic is intense if you need easing-in time",
  ],
  whyChoose:
    "You want the food-and-culture trip with a built-in decompression at the end. Hanoi for energy, Ninh Binh for awe, Chiang Mai to slow the pulse.",
  whySkip:
    "Skip if you'd rather not fly between countries mid-trip, or if beaches are non-negotiable.",
  destinations: [
    { id: "a-hanoi", name: "Hanoi", country: "Vietnam", nights: 4, blurb: "Frenetic, lyrical Old Quarter; egg coffee, lake walks, and the best bun cha you'll have." },
    { id: "a-ninhbinh", name: "Ninh Binh", country: "Vietnam", nights: 2, blurb: "Limestone karsts over flooded rice fields — 'Halong Bay on land' without the cruise crowds." },
    { id: "a-chiangmai", name: "Chiang Mai", country: "Thailand", nights: 5, blurb: "Moated old city of temples, night markets, and Nimman cafe culture in the cool northern hills." },
  ],
  days: [
    day("a-d1", 1, "Land in Hanoi, ease into the Old Quarter", "Hanoi", "Vietnam",
      "Arrive, drop bags, and let the Old Quarter introduce itself slowly on foot.",
      [
        act("a-d1-a1", "Walk the Old Quarter's '36 streets'", "neighborhood", "afternoon", "Wander the guild streets where each lane historically sold one trade — silk, tin, bamboo. No agenda, just looking up.", "Old Quarter", ["wandering"]),
        act("a-d1-a2", "Egg coffee at Giang Cafe", "food", "afternoon", "The original ca phe trung — coffee under a meringue of whipped egg yolk and condensed milk, down a tiny alley.", "Giang Cafe", ["coffee", "iconic"]),
        act("a-d1-a3", "Sunset at Hoan Kiem Lake", "culture", "evening", "Loop the lake, cross the red Huc Bridge to Ngoc Son Temple as the lanterns come on.", "Hoan Kiem Lake"),
      ]),
    day("a-d2", 2, "Hanoi history + street food crawl", "Hanoi", "Vietnam",
      "A morning of heavier history balanced by an afternoon eating your way across the city.",
      [
        act("a-d2-a1", "Temple of Literature", "history", "morning", "Vietnam's first university (1070), a series of serene courtyards and the stelae of doctoral laureates.", "Temple of Literature", ["history"]),
        act("a-d2-a2", "Bun cha lunch", "food", "afternoon", "Grilled pork patties in sweet-sour broth with herbs and noodles — the dish Hanoi does best.", "Bun Cha Huong Lien", ["must-eat"]),
        act("a-d2-a3", "Hoa Lo Prison", "history", "afternoon", "Sobering, well-curated museum in the former French colonial prison later nicknamed the 'Hanoi Hilton'.", "Hoa Lo"),
        act("a-d2-a4", "Evening street-food crawl", "food", "evening", "Banh mi, bun rieu, nem, and bia hoi on plastic stools — graze rather than sit for one meal.", "Old Quarter", ["street food"]),
      ]),
    day("a-d3", 3, "Lan Ha Bay day on the water", "Hanoi", "Vietnam",
      "A full day boat out to the quieter sister bay of Halong — karsts, kayaks, swimming.",
      [
        act("a-d3-a1", "Lan Ha / Halong Bay cruise", "nature", "flexible", "Day cruise through emerald water and limestone towers; kayak into a hidden lagoon away from the big crowds.", "Lan Ha Bay", ["nature", "core memory"]),
        act("a-d3-a2", "Late banh cuon dinner back in town", "food", "evening", "Silky steamed rice rolls with minced pork and fried shallots to end a long day out.", "Old Quarter"),
      ]),
    day("a-d4", 4, "Hanoi cafes + transfer prep", "Hanoi", "Vietnam",
      "A slower city day — markets, a museum, coffee with a view — before heading south tomorrow.",
      [
        act("a-d4-a1", "Dong Xuan Market", "market", "morning", "Hanoi's largest covered market; wholesale chaos upstairs, a food alley behind it.", "Dong Xuan"),
        act("a-d4-a2", "Vietnamese Women's Museum", "culture", "afternoon", "Genuinely excellent museum on matrilineal cultures, street vendors, and wartime roles.", "Women's Museum"),
        act("a-d4-a3", "Rooftop coffee over the Old Quarter", "relax", "afternoon", "A coconut coffee from a rooftop, watching the motorbike rivers below.", "Old Quarter", ["coffee"]),
      ]),
    day("a-d5", 5, "Transfer to Ninh Binh, Mua Cave at golden hour", "Ninh Binh", "Vietnam",
      "Short drive/train south into karst country; climb for the view that sells the region.",
      [
        act("a-d5-a1", "Drive/train to Ninh Binh", "transit", "morning", "~2 hours south. Check into a homestay among the rice fields.", "Ninh Binh", ["transfer"]),
        act("a-d5-a2", "Mua Cave viewpoint climb", "nature", "afternoon", "~500 stone steps to a dragon-topped ridge overlooking the Tam Coc river bend. Time it for late light.", "Mua Cave", ["core memory", "viewpoint"]),
        act("a-d5-a3", "Goat hotpot dinner (de nui)", "food", "evening", "Ninh Binh's specialty — local mountain goat, grilled and in hotpot.", "Ninh Binh"),
      ]),
    day("a-d6", 6, "Trang An boats + Hoa Lu", "Ninh Binh", "Vietnam",
      "The signature rowboat journey through caves and the old 10th-century capital.",
      [
        act("a-d6-a1", "Trang An boat tour", "nature", "morning", "Two to three hours rowed through flooded caves and past riverside temples — a UNESCO landscape, and where Kong: Skull Island filmed.", "Trang An", ["core memory", "boat"]),
        act("a-d6-a2", "Hoa Lu ancient capital", "history", "afternoon", "Temples on the site of Vietnam's 10th-century capital, ringed by limestone.", "Hoa Lu", ["history"]),
        act("a-d6-a3", "Cycle the rice paddies", "nature", "afternoon", "Rent bikes and drift the back lanes between karsts and ducks at dusk.", "Ninh Binh", ["cycling"]),
      ]),
    day("a-d7", 7, "Fly to Chiang Mai", "Chiang Mai", "Thailand",
      "The one real travel day — back to Hanoi airport and on to northern Thailand.",
      [
        act("a-d7-a1", "Transfer Ninh Binh → Hanoi → Chiang Mai", "transit", "flexible", "Drive to Hanoi airport, fly via Bangkok. Land in a noticeably calmer city.", "—", ["transfer"]),
        act("a-d7-a2", "First khao soi", "food", "evening", "Northern Thai curry noodle soup with crispy noodles on top — the dish you'll keep reordering.", "Chiang Mai", ["must-eat"]),
        act("a-d7-a3", "Wander the moat at night", "neighborhood", "evening", "Quiet first lap of the old city's lantern-lit lanes inside the ancient moat.", "Old City"),
      ]),
    day("a-d8", 8, "Old City temples + Sunday Walking Street", "Chiang Mai", "Thailand",
      "Temple-hop on foot by day; lose the evening to the city's best market (if it's a Sunday).",
      [
        act("a-d8-a1", "Wat Phra Singh & Wat Chedi Luang", "culture", "morning", "The two anchor temples of the old city — gilded viharns and a half-ruined Lanna chedi.", "Old City", ["temples"]),
        act("a-d8-a2", "Lunch in Nimmanhaemin", "food", "afternoon", "Design-y cafe district — specialty coffee, modern Thai, slow morning energy.", "Nimman", ["coffee"]),
        act("a-d8-a3", "Sunday Walking Street", "market", "evening", "Ratchadamnoen Road closes to traffic; crafts, street food, and lantern light end to end.", "Ratchadamnoen Rd", ["market", "core memory"]),
      ]),
    day("a-d9", 9, "Ethical elephant sanctuary day", "Chiang Mai", "Thailand",
      "A full day at a no-riding sanctuary — feed, walk, and observe rescued elephants.",
      [
        act("a-d9-a1", "Elephant Nature Park", "experience", "flexible", "Long-running ethical sanctuary; observe and feed rescued elephants, no riding, no shows.", "Mae Taeng Valley", ["core memory", "ethical"]),
        act("a-d9-a2", "Riverside dinner", "food", "evening", "Casual northern Thai dinner along the Ping River back in town.", "Ping River"),
      ]),
    day("a-d10", 10, "Doi Suthep + Nimman cafes", "Chiang Mai", "Thailand",
      "A mountaintop temple in the morning, an easy afternoon of cafes and shophouses.",
      [
        act("a-d10-a1", "Wat Phra That Doi Suthep", "culture", "morning", "Climb the 300-step naga staircase to the golden mountain temple overlooking the city.", "Doi Suthep", ["temples", "viewpoint"]),
        act("a-d10-a2", "Warorot Market", "market", "afternoon", "Local, un-touristy market — dried goods, northern snacks, flowers.", "Warorot", ["market"]),
        act("a-d10-a3", "Cafe-hop Nimman", "relax", "afternoon", "Slow afternoon between specialty roasters and concept shops.", "Nimman", ["coffee", "relax"]),
      ]),
    day("a-d11", 11, "Thai cooking class + last market", "Chiang Mai", "Thailand",
      "Learn three dishes you'll actually remake, then a final wander.",
      [
        act("a-d11-a1", "Half-day cooking class", "experience", "morning", "Market tour then hands-on khao soi, curry paste, and mango sticky rice.", "Chiang Mai", ["cooking", "core memory"]),
        act("a-d11-a2", "Last-night night bazaar", "market", "evening", "Final souvenir and snack run through the Night Bazaar.", "Night Bazaar"),
      ]),
    day("a-d12", 12, "Fly home", "Chiang Mai", "Thailand",
      "Slow morning coffee, then the long way home.",
      [
        act("a-d12-a1", "Farewell coffee + depart", "relax", "morning", "One more cup in Nimman before the airport.", "Chiang Mai", ["transfer"]),
      ]),
  ],
};

// ===========================================================================
// PLAN B — Vietnam + Cambodia
// ===========================================================================
const planB: TripPlan = {
  id: "plan-b",
  title: "Vietnam + Cambodia",
  route: ["Hanoi", "Ninh Binh", "Siem Reap"],
  countries: ["Vietnam", "Cambodia"],
  durationDays: 12,
  ptoDays: 7,
  ptoEfficiency: 8,
  vibeTags: ["history", "temples", "ancient civilization", "culture", "food"],
  logisticsDifficulty: "moderate",
  transferBurden: "1 short train/drive + 1 regional flight (Hanoi→Siem Reap)",
  scores: {
    lucasFit: 9,
    girlfriendFit: 7,
    culture: 9,
    relaxation: 6,
    food: 8,
    history: 10,
    nature: 7,
    coreMemory: 10,
  },
  pros: [
    "Angkor is a genuine bucket-list, core-memory anchor",
    "Strong narrative arc: living city → quiet nature → ancient empire",
    "Hanoi + Ninh Binh front-load the food and scenery",
  ],
  cons: [
    "Heavier on temples — needs pacing so it doesn't feel like a checklist",
    "Siem Reap heat and early sunrise starts can be tiring",
    "Less beach/relax time than the Thailand options",
  ],
  whyChoose:
    "You want the trip with the biggest 'I can't believe we're standing here' moment. Angkor at sunrise carries the whole itinerary.",
  whySkip:
    "Skip if the history-to-relaxation ratio feels too high for your girlfriend, or if you want beach days.",
  destinations: [
    { id: "b-hanoi", name: "Hanoi", country: "Vietnam", nights: 4, blurb: "Old Quarter energy, lake walks, and the food that anchors the first half." },
    { id: "b-ninhbinh", name: "Ninh Binh", country: "Vietnam", nights: 2, blurb: "Karst-and-rice-field calm before the temples." },
    { id: "b-siemreap", name: "Siem Reap", country: "Cambodia", nights: 5, blurb: "Gateway to Angkor — sunrise temples, a lively old market, and warm Khmer hospitality." },
  ],
  days: [
    day("b-d1", 1, "Land in Hanoi", "Hanoi", "Vietnam",
      "Arrive and let the Old Quarter unfold on foot.",
      [
        act("b-d1-a1", "Old Quarter wander + egg coffee", "neighborhood", "afternoon", "Settle in with a loop of the guild streets and a ca phe trung.", "Old Quarter", ["coffee", "wandering"]),
        act("b-d1-a2", "Hoan Kiem Lake at dusk", "culture", "evening", "Huc Bridge and Ngoc Son Temple as the lanterns light up.", "Hoan Kiem Lake"),
      ]),
    day("b-d2", 2, "Hanoi history + food", "Hanoi", "Vietnam",
      "Temple of Literature, then graze the city.",
      [
        act("b-d2-a1", "Temple of Literature", "history", "morning", "Vietnam's first university — serene courtyards and laureate stelae.", "Temple of Literature", ["history"]),
        act("b-d2-a2", "Bun cha lunch", "food", "afternoon", "The Hanoi classic — grilled pork, herbs, dipping broth.", "Old Quarter", ["must-eat"]),
        act("b-d2-a3", "Water puppet theatre", "culture", "evening", "Thang Long water puppets — an 11th-century art form set to live music.", "Thang Long Theatre"),
      ]),
    day("b-d3", 3, "Lan Ha Bay day cruise", "Hanoi", "Vietnam",
      "Out on the water for the day among the karsts.",
      [
        act("b-d3-a1", "Lan Ha / Halong Bay cruise", "nature", "flexible", "Kayak a hidden lagoon and swim off the boat in the quieter bay.", "Lan Ha Bay", ["nature", "core memory"]),
      ]),
    day("b-d4", 4, "Hanoi markets + museum", "Hanoi", "Vietnam",
      "A slower city day before heading south.",
      [
        act("b-d4-a1", "Dong Xuan Market", "market", "morning", "The big covered market and its food alley.", "Dong Xuan", ["market"]),
        act("b-d4-a2", "Vietnamese Women's Museum", "culture", "afternoon", "One of Hanoi's best museums on everyday life and history.", "Women's Museum"),
      ]),
    day("b-d5", 5, "Transfer to Ninh Binh + Mua Cave", "Ninh Binh", "Vietnam",
      "South to karst country and the ridge-top view.",
      [
        act("b-d5-a1", "Drive/train to Ninh Binh", "transit", "morning", "~2 hours to a rice-field homestay.", "Ninh Binh", ["transfer"]),
        act("b-d5-a2", "Mua Cave viewpoint", "nature", "afternoon", "500 steps to the dragon ridge over the Tam Coc bend.", "Mua Cave", ["viewpoint", "core memory"]),
      ]),
    day("b-d6", 6, "Trang An boats + cycling", "Ninh Binh", "Vietnam",
      "The signature rowboat day plus a paddy-field cycle.",
      [
        act("b-d6-a1", "Trang An boat tour", "nature", "morning", "Rowed through caves and past riverside temples in a UNESCO landscape.", "Trang An", ["boat", "core memory"]),
        act("b-d6-a2", "Bich Dong Pagoda", "culture", "afternoon", "A three-tier cave pagoda built into the cliff.", "Bich Dong"),
        act("b-d6-a3", "Cycle the rice fields", "nature", "afternoon", "Back lanes between karsts at golden hour.", "Ninh Binh", ["cycling"]),
      ]),
    day("b-d7", 7, "Fly to Siem Reap", "Siem Reap", "Cambodia",
      "Travel day into the heart of the old Khmer empire.",
      [
        act("b-d7-a1", "Transfer Ninh Binh → Hanoi → Siem Reap", "transit", "flexible", "Drive to Hanoi, fly to Siem Reap. Slower, warmer, lower-key.", "—", ["transfer"]),
        act("b-d7-a2", "Pub Street + Night Market", "neighborhood", "evening", "Ease in with Khmer amok curry and a wander through the night market stalls.", "Old Market area", ["market", "food"]),
      ]),
    day("b-d8", 8, "Angkor Wat sunrise + Angkor Thom", "Siem Reap", "Cambodia",
      "The big one — sunrise over Angkor Wat, then the walled city of Angkor Thom.",
      [
        act("b-d8-a1", "Angkor Wat sunrise", "history", "morning", "Pre-dawn tuk-tuk to watch the towers emerge over the reflecting pool. The trip's centerpiece.", "Angkor Wat", ["core memory", "sunrise"]),
        act("b-d8-a2", "Bayon & Angkor Thom", "history", "morning", "The 200+ serene stone faces of the Bayon inside the old royal city.", "Angkor Thom", ["temples"]),
        act("b-d8-a3", "Ta Prohm (tree temple)", "history", "afternoon", "Silk-cotton roots swallowing the stone — the 'Tomb Raider' temple.", "Ta Prohm", ["core memory"]),
      ]),
    day("b-d9", 9, "Banteay Srei + circus night", "Siem Reap", "Cambodia",
      "A finer, farther temple, then an evening that isn't a temple at all.",
      [
        act("b-d9-a1", "Banteay Srei", "history", "morning", "Pink sandstone temple with the most intricate carving at Angkor.", "Banteay Srei", ["temples"]),
        act("b-d9-a2", "Angkor National Museum", "culture", "afternoon", "Context for everything you've seen — galleries of Khmer sculpture.", "Siem Reap"),
        act("b-d9-a3", "Phare Cambodian Circus", "experience", "evening", "Acrobatics and storytelling by graduates of an NGO arts school — genuinely moving.", "Phare", ["core memory"]),
      ]),
    day("b-d10", 10, "Tonle Sap + cooking class", "Siem Reap", "Cambodia",
      "Water and food day for contrast with the stone.",
      [
        act("b-d10-a1", "Kompong Phluk floating village", "culture", "morning", "Stilt houses and a flooded forest on the great lake — go with a community-minded operator.", "Tonle Sap", ["culture"]),
        act("b-d10-a2", "Khmer cooking class", "experience", "afternoon", "Market tour then amok, fresh spring rolls, and green mango salad.", "Siem Reap", ["cooking"]),
      ]),
    day("b-d11", 11, "Slow morning + Psar Chas", "Siem Reap", "Cambodia",
      "Decompress before the flight home.",
      [
        act("b-d11-a1", "Old Market (Psar Chas)", "market", "morning", "Spices, silver, krama scarves, and a coffee in the lanes.", "Psar Chas", ["market"]),
        act("b-d11-a2", "Spa or pool afternoon", "relax", "afternoon", "An affordable massage and a slow hotel-pool afternoon to recover.", "Siem Reap", ["relax"]),
      ]),
    day("b-d12", 12, "Fly home", "Siem Reap", "Cambodia",
      "Depart Siem Reap.",
      [
        act("b-d12-a1", "Depart", "transit", "morning", "Airport transfer and the long way home.", "Siem Reap", ["transfer"]),
      ]),
  ],
};

// ===========================================================================
// PLAN C — Thailand North + South
// ===========================================================================
const planC: TripPlan = {
  id: "plan-c",
  title: "Thailand North + South",
  route: ["Chiang Mai", "Krabi / Railay"],
  countries: ["Thailand"],
  durationDays: 12,
  ptoDays: 7,
  ptoEfficiency: 7,
  vibeTags: ["easy logistics", "food", "beaches", "nature", "markets"],
  logisticsDifficulty: "easy",
  transferBurden: "1 domestic flight (Chiang Mai→Krabi)",
  scores: {
    lucasFit: 7,
    girlfriendFit: 9,
    culture: 7,
    relaxation: 9,
    food: 9,
    history: 5,
    nature: 9,
    coreMemory: 8,
  },
  pros: [
    "Easiest logistics on the list — one country, one domestic flight",
    "Best balance of culture-then-beach; strong 'relax' score",
    "Railay's cliffs and longtail boats are a genuine wow",
  ],
  cons: [
    "Single country means less cultural contrast",
    "Lighter on deep history than the Vietnam/Cambodia options",
  ],
  whyChoose:
    "You want the lowest-stress, highest-relaxation version: northern culture and food, then cliffs-and-beaches to finish.",
  whySkip:
    "Skip if 'two countries / two cultures' is the whole point of the trip for you.",
  destinations: [
    { id: "c-chiangmai", name: "Chiang Mai", country: "Thailand", nights: 5, blurb: "Temples, markets, cooking classes, and cool-hill cafe culture." },
    { id: "c-krabi", name: "Krabi / Railay", country: "Thailand", nights: 6, blurb: "Limestone cliffs straight out of the sea, longtail boats, and beaches reachable only by water." },
  ],
  days: [
    day("c-d1", 1, "Land in Chiang Mai", "Chiang Mai", "Thailand",
      "Arrive and settle into the old city.",
      [
        act("c-d1-a1", "Moat-side evening wander", "neighborhood", "evening", "First lap of the lantern-lit old city.", "Old City", ["wandering"]),
        act("c-d1-a2", "First khao soi", "food", "evening", "The northern curry-noodle soup you'll reorder all week.", "Chiang Mai", ["must-eat"]),
      ]),
    day("c-d2", 2, "Old City temples + Nimman", "Chiang Mai", "Thailand",
      "Temple-hop, then coffee culture.",
      [
        act("c-d2-a1", "Wat Phra Singh & Wat Chedi Luang", "culture", "morning", "The old city's two anchor temples.", "Old City", ["temples"]),
        act("c-d2-a2", "Nimman cafes + lunch", "food", "afternoon", "Design district coffee and modern Thai.", "Nimman", ["coffee"]),
        act("c-d2-a3", "Saturday/Sunday Walking Street", "market", "evening", "Whichever weekend market is running — crafts and street food end to end.", "Old City", ["market", "core memory"]),
      ]),
    day("c-d3", 3, "Ethical elephant sanctuary", "Chiang Mai", "Thailand",
      "A full sanctuary day — no riding.",
      [
        act("c-d3-a1", "Elephant Nature Park", "experience", "flexible", "Observe and feed rescued elephants in the Mae Taeng valley.", "Mae Taeng", ["core memory", "ethical"]),
      ]),
    day("c-d4", 4, "Doi Inthanon nature day", "Chiang Mai", "Thailand",
      "Up to Thailand's highest peak and its waterfalls.",
      [
        act("c-d4-a1", "Doi Inthanon National Park", "nature", "flexible", "Twin royal pagodas, cloud-forest trails, and Wachirathan waterfall.", "Doi Inthanon", ["nature", "viewpoint"]),
        act("c-d4-a2", "Karen village lunch", "culture", "afternoon", "Terraced rice and a community-run lunch on the mountain.", "Doi Inthanon"),
      ]),
    day("c-d5", 5, "Cooking class + fly south", "Chiang Mai", "Thailand",
      "Cook in the morning, then catch the short hop to Krabi.",
      [
        act("c-d5-a1", "Half-day cooking class", "experience", "morning", "Market tour then khao soi and curry paste from scratch.", "Chiang Mai", ["cooking"]),
        act("c-d5-a2", "Fly Chiang Mai → Krabi", "transit", "afternoon", "Easy ~2-hour domestic flight; transfer to Ao Nang or Railay.", "—", ["transfer"]),
      ]),
    day("c-d6", 6, "Boat to Railay", "Krabi / Railay", "Thailand",
      "Settle into the cliff-ringed peninsula reachable only by longtail.",
      [
        act("c-d6-a1", "Longtail to Railay", "transit", "morning", "10-minute boat from Ao Nang to a beach with no road in.", "Railay", ["boat"]),
        act("c-d6-a2", "Phra Nang Cave Beach", "nature", "afternoon", "Arguably Thailand's most beautiful beach, under a towering cliff.", "Phra Nang", ["core memory", "beach"]),
        act("c-d6-a3", "Sunset from Railay West", "relax", "evening", "Drinks on the sand as the karsts go pink.", "Railay West", ["relax"]),
      ]),
    day("c-d7", 7, "Four Islands longtail tour", "Krabi / Railay", "Thailand",
      "Classic island-hop by longtail boat.",
      [
        act("c-d7-a1", "Four Islands tour", "nature", "flexible", "Tup, Chicken, Poda, and Phra Nang — snorkeling and a sandbar that appears at low tide.", "Krabi", ["core memory", "beach"]),
      ]),
    day("c-d8", 8, "Climb or kayak day", "Krabi / Railay", "Thailand",
      "Choose your adventure on the cliffs or in the mangroves.",
      [
        act("c-d8-a1", "Beginner rock climbing", "experience", "morning", "Railay is a world-famous climbing spot; intro routes for first-timers on real limestone.", "Railay", ["adventure"]),
        act("c-d8-a2", "Or: Ao Thalane kayak", "nature", "morning", "Paddle quiet mangrove channels and sea caves instead.", "Ao Thalane", ["nature"]),
        act("c-d8-a3", "Beachfront Thai dinner", "food", "evening", "Whole grilled fish and som tam by the water.", "Railay", ["food"]),
      ]),
    day("c-d9", 9, "Hong Islands lagoon", "Krabi / Railay", "Thailand",
      "The hidden emerald lagoon and viewpoint.",
      [
        act("c-d9-a1", "Hong Islands tour", "nature", "flexible", "A near-enclosed lagoon and the 'Hong viewpoint' panorama; quieter than the Four Islands.", "Hong Islands", ["beach", "viewpoint"]),
      ]),
    day("c-d10", 10, "Emerald Pool + Tiger Cave", "Krabi / Railay", "Thailand",
      "Inland nature and a big-view temple climb.",
      [
        act("c-d10-a1", "Emerald Pool & Hot Springs", "nature", "morning", "A jungle-fed turquoise pool and natural hot-spring terraces in the Khao Phra Bang Khram reserve.", "Khlong Thom", ["nature"]),
        act("c-d10-a2", "Tiger Cave Temple climb", "culture", "afternoon", "1,260 steps to a hilltop golden Buddha and a 360° view (optional, brutal, worth it).", "Wat Tham Suea", ["viewpoint", "temples"]),
      ]),
    day("c-d11", 11, "Slow beach + Krabi night market", "Krabi / Railay", "Thailand",
      "A deliberately empty day, then the town's weekend market.",
      [
        act("c-d11-a1", "Unstructured beach day", "relax", "flexible", "Swim, read, nap — the day with nothing scheduled.", "Railay", ["relax"]),
        act("c-d11-a2", "Krabi Town Walking Street", "market", "evening", "Weekend night market with live music and cheap, excellent food (Fri–Sun).", "Krabi Town", ["market"]),
      ]),
    day("c-d12", 12, "Fly home", "Krabi / Railay", "Thailand",
      "Depart from Krabi.",
      [
        act("c-d12-a1", "Depart Krabi", "transit", "morning", "Boat back, then airport.", "Krabi", ["transfer"]),
      ]),
  ],
};

// ===========================================================================
// PLAN D — Vietnam Only Deep Dive
// ===========================================================================
const planD: TripPlan = {
  id: "plan-d",
  title: "Vietnam Only Deep Dive",
  route: ["Hanoi", "Ninh Binh", "Hue", "Hoi An"],
  countries: ["Vietnam"],
  durationDays: 12,
  ptoDays: 7,
  ptoEfficiency: 9,
  vibeTags: ["culture", "food", "history", "less hopping", "lanterns"],
  logisticsDifficulty: "easy",
  transferBurden: "1 internal flight + the scenic Hai Van Pass drive",
  scores: {
    lucasFit: 9,
    girlfriendFit: 8,
    culture: 9,
    relaxation: 8,
    food: 10,
    history: 8,
    nature: 8,
    coreMemory: 8,
  },
  pros: [
    "No international hopping — deepest dive, least logistics friction",
    "Hoi An's lantern-lit old town is the single most charming stop on the list",
    "Best food trip overall; each region has its own signature dishes",
    "Built-in beach time at An Bang without a separate beach leg",
  ],
  cons: [
    "Only one country — no big cultural contrast",
    "Central Vietnam in late November can catch the tail of the rainy season",
  ],
  whyChoose:
    "You'd rather go deep than wide. North-to-central Vietnam delivers food, history, scenery, and a beach without ever changing countries.",
  whySkip:
    "Skip if the 'two countries' goal matters more than depth, or if you want guaranteed dry beach weather.",
  destinations: [
    { id: "d-hanoi", name: "Hanoi", country: "Vietnam", nights: 3, blurb: "Old Quarter energy and the north's food." },
    { id: "d-ninhbinh", name: "Ninh Binh", country: "Vietnam", nights: 2, blurb: "Karst-and-rice-field calm." },
    { id: "d-hue", name: "Hue", country: "Vietnam", nights: 2, blurb: "Imperial capital — citadel, royal tombs, and the Perfume River." },
    { id: "d-hoian", name: "Hoi An", country: "Vietnam", nights: 4, blurb: "Lantern-lit trading town, tailors, beaches, and central Vietnam's best food." },
  ],
  days: [
    day("d-d1", 1, "Land in Hanoi", "Hanoi", "Vietnam",
      "Arrive and ease into the Old Quarter.",
      [
        act("d-d1-a1", "Old Quarter wander + egg coffee", "neighborhood", "afternoon", "Guild streets and a ca phe trung to start.", "Old Quarter", ["coffee"]),
        act("d-d1-a2", "Hoan Kiem Lake at dusk", "culture", "evening", "Huc Bridge and Ngoc Son Temple.", "Hoan Kiem Lake"),
      ]),
    day("d-d2", 2, "Hanoi history + street food", "Hanoi", "Vietnam",
      "History in the morning, eat your way through the afternoon.",
      [
        act("d-d2-a1", "Temple of Literature", "history", "morning", "Vietnam's first university.", "Temple of Literature", ["history"]),
        act("d-d2-a2", "Bun cha lunch", "food", "afternoon", "The Hanoi classic.", "Old Quarter", ["must-eat"]),
        act("d-d2-a3", "Street-food crawl", "food", "evening", "Banh mi, bun rieu, nem, bia hoi on plastic stools.", "Old Quarter", ["street food"]),
      ]),
    day("d-d3", 3, "Lan Ha Bay day", "Hanoi", "Vietnam",
      "Out on the water among the karsts.",
      [
        act("d-d3-a1", "Lan Ha / Halong Bay cruise", "nature", "flexible", "Kayak a hidden lagoon, swim off the boat.", "Lan Ha Bay", ["nature", "core memory"]),
      ]),
    day("d-d4", 4, "To Ninh Binh + Mua Cave", "Ninh Binh", "Vietnam",
      "South to karst country.",
      [
        act("d-d4-a1", "Drive/train to Ninh Binh", "transit", "morning", "~2 hours to a homestay.", "Ninh Binh", ["transfer"]),
        act("d-d4-a2", "Mua Cave viewpoint", "nature", "afternoon", "500 steps to the dragon ridge.", "Mua Cave", ["viewpoint"]),
      ]),
    day("d-d5", 5, "Trang An boats + cycling", "Ninh Binh", "Vietnam",
      "Rowboats through caves and a paddy cycle.",
      [
        act("d-d5-a1", "Trang An boat tour", "nature", "morning", "Through caves and past temples in a UNESCO landscape.", "Trang An", ["boat", "core memory"]),
        act("d-d5-a2", "Cycle the rice fields", "nature", "afternoon", "Back lanes at golden hour.", "Ninh Binh", ["cycling"]),
      ]),
    day("d-d6", 6, "Fly to Hue, imperial citadel", "Hue", "Vietnam",
      "Internal flight to the old imperial capital.",
      [
        act("d-d6-a1", "Fly Hanoi → Hue", "transit", "morning", "Quick internal flight (drive back to Hanoi or fly from nearby).", "—", ["transfer"]),
        act("d-d6-a2", "Imperial Citadel", "history", "afternoon", "The walled Nguyen-dynasty city and Forbidden Purple City.", "Hue Citadel", ["history", "core memory"]),
        act("d-d6-a3", "Bun bo Hue dinner", "food", "evening", "The fiery lemongrass beef noodle soup, in its home city.", "Hue", ["must-eat"]),
      ]),
    day("d-d7", 7, "Royal tombs + Perfume River", "Hue", "Vietnam",
      "The dynastic tombs and a river boat.",
      [
        act("d-d7-a1", "Tu Duc & Khai Dinh tombs", "history", "morning", "Two of the most atmospheric royal tombs — one garden-like, one ornate and European-influenced.", "Hue", ["history"]),
        act("d-d7-a2", "Thien Mu Pagoda by boat", "culture", "afternoon", "Dragon-boat up the Perfume River to the seven-tier pagoda.", "Perfume River", ["boat"]),
      ]),
    day("d-d8", 8, "Hai Van Pass to Hoi An", "Hoi An", "Vietnam",
      "One of Asia's great coastal drives, ending in the lantern town.",
      [
        act("d-d8-a1", "Hai Van Pass scenic drive", "nature", "morning", "The cloud-topped mountain pass with sweeping South China Sea views; stop at Lang Co beach.", "Hai Van Pass", ["scenic", "core memory"]),
        act("d-d8-a2", "Hoi An Ancient Town by lantern light", "neighborhood", "evening", "Pedestrian old town glowing with silk lanterns; release a candle boat on the river.", "Ancient Town", ["core memory", "lanterns"]),
      ]),
    day("d-d9", 9, "My Son + Hoi An food", "Hoi An", "Vietnam",
      "Cham ruins by morning, Hoi An's specialties by night.",
      [
        act("d-d9-a1", "My Son Sanctuary", "history", "morning", "Brick Hindu towers of the Cham civilization in a jungle valley — go early to beat heat and crowds.", "My Son", ["history"]),
        act("d-d9-a2", "Cao lau + white rose", "food", "afternoon", "Two dishes you can only get right here — pork noodles and shrimp dumplings.", "Hoi An", ["must-eat"]),
        act("d-d9-a3", "Night market + lantern boat", "market", "evening", "Lantern stalls and a candlelit boat on the Thu Bon.", "Hoi An", ["market", "lanterns"]),
      ]),
    day("d-d10", 10, "Basket boats + cooking class", "Hoi An", "Vietnam",
      "Coconut grove, vegetable village, and a hands-on class.",
      [
        act("d-d10-a1", "Tra Que herb village + basket boat", "experience", "morning", "Learn to row the round coracle in the coconut palms and tour the organic herb village.", "Tra Que", ["experience"]),
        act("d-d10-a2", "Hoi An cooking class", "experience", "afternoon", "Market tour then white rose, banh xeo, and clay-pot fish.", "Hoi An", ["cooking", "core memory"]),
      ]),
    day("d-d11", 11, "An Bang beach + tailor pickup", "Hoi An", "Vietnam",
      "A relaxed beach day and the made-to-measure tradition.",
      [
        act("d-d11-a1", "An Bang Beach", "relax", "morning", "Easygoing beach with sun-loungers and seafood shacks.", "An Bang", ["beach", "relax"]),
        act("d-d11-a2", "Tailor fitting", "experience", "afternoon", "Order custom clothes early in your stay, collect today — Hoi An's signature craft.", "Hoi An", ["shopping"]),
        act("d-d11-a3", "Riverside farewell dinner", "food", "evening", "Last central-Vietnam meal by the water.", "Hoi An"),
      ]),
    day("d-d12", 12, "Fly home from Da Nang", "Hoi An", "Vietnam",
      "Short transfer to Da Nang airport.",
      [
        act("d-d12-a1", "Transfer to Da Nang + depart", "transit", "morning", "~45 minutes to the airport.", "Da Nang", ["transfer"]),
      ]),
  ],
};

// ===========================================================================
// PLAN E — Cambodia + Thailand
// ===========================================================================
const planE: TripPlan = {
  id: "plan-e",
  title: "Cambodia + Thailand",
  route: ["Siem Reap", "Chiang Mai", "Krabi / Railay"],
  countries: ["Cambodia", "Thailand"],
  durationDays: 12,
  ptoDays: 7,
  ptoEfficiency: 6,
  vibeTags: ["temples", "Thai food", "markets", "nature", "beaches"],
  logisticsDifficulty: "involved",
  transferBurden: "2 flights (Siem Reap→Chiang Mai, Chiang Mai→Krabi)",
  scores: {
    lucasFit: 8,
    girlfriendFit: 8,
    culture: 8,
    relaxation: 8,
    food: 9,
    history: 9,
    nature: 9,
    coreMemory: 9,
  },
  pros: [
    "Has it all: ancient temples, northern culture, and a beach finish",
    "Strong arc — front-load Angkor while you're fresh, end on the beach",
    "Both 'core memory' anchors (Angkor + Railay) in one trip",
  ],
  cons: [
    "Most travel days of any option — two flights mid-trip",
    "Three bases in 12 days means more packing/unpacking",
    "Highest logistics difficulty; least margin if a flight slips",
  ],
  whyChoose:
    "You want maximum variety and you're willing to absorb two flights to get temples, culture, and beaches in one loop.",
  whySkip:
    "Skip if the extra flight and the three-base pace sound tiring, or if you'd rather go deeper in fewer places.",
  destinations: [
    { id: "e-siemreap", name: "Siem Reap", country: "Cambodia", nights: 4, blurb: "Angkor sunrise temples and Khmer warmth." },
    { id: "e-chiangmai", name: "Chiang Mai", country: "Thailand", nights: 4, blurb: "Temples, markets, and cool-hill cafe culture." },
    { id: "e-krabi", name: "Krabi / Railay", country: "Thailand", nights: 4, blurb: "Cliff beaches and longtail island-hopping to finish." },
  ],
  days: [
    day("e-d1", 1, "Land in Siem Reap", "Siem Reap", "Cambodia",
      "Arrive and ease in around the old market.",
      [
        act("e-d1-a1", "Pub Street + Night Market", "neighborhood", "evening", "Amok curry and a wander through the stalls.", "Old Market area", ["market", "food"]),
      ]),
    day("e-d2", 2, "Angkor Wat sunrise + Angkor Thom", "Siem Reap", "Cambodia",
      "The centerpiece day, done while you're freshest.",
      [
        act("e-d2-a1", "Angkor Wat sunrise", "history", "morning", "The towers emerging over the reflecting pool at dawn.", "Angkor Wat", ["core memory", "sunrise"]),
        act("e-d2-a2", "Bayon & Angkor Thom", "history", "morning", "The stone faces of the Bayon in the old royal city.", "Angkor Thom", ["temples"]),
        act("e-d2-a3", "Ta Prohm tree temple", "history", "afternoon", "Roots swallowing the ruins.", "Ta Prohm", ["core memory"]),
      ]),
    day("e-d3", 3, "Banteay Srei + circus", "Siem Reap", "Cambodia",
      "A finer temple and a non-temple evening.",
      [
        act("e-d3-a1", "Banteay Srei", "history", "morning", "Pink sandstone and the finest carving at Angkor.", "Banteay Srei", ["temples"]),
        act("e-d3-a2", "Khmer cooking class", "experience", "afternoon", "Amok, spring rolls, green mango salad.", "Siem Reap", ["cooking"]),
        act("e-d3-a3", "Phare Cambodian Circus", "experience", "evening", "Acrobatic storytelling from an NGO arts school.", "Phare", ["core memory"]),
      ]),
    day("e-d4", 4, "Fly to Chiang Mai", "Chiang Mai", "Thailand",
      "First flight, into the cool north.",
      [
        act("e-d4-a1", "Fly Siem Reap → Chiang Mai", "transit", "afternoon", "Regional flight; settle into the old city.", "—", ["transfer"]),
        act("e-d4-a2", "First khao soi", "food", "evening", "Northern curry noodles to start.", "Chiang Mai", ["must-eat"]),
      ]),
    day("e-d5", 5, "Old City temples + walking street", "Chiang Mai", "Thailand",
      "Temples by day, the weekend market by night.",
      [
        act("e-d5-a1", "Wat Phra Singh & Wat Chedi Luang", "culture", "morning", "The old city's anchor temples.", "Old City", ["temples"]),
        act("e-d5-a2", "Nimman cafes", "food", "afternoon", "Specialty coffee and modern Thai.", "Nimman", ["coffee"]),
        act("e-d5-a3", "Walking Street market", "market", "evening", "Crafts and street food end to end.", "Old City", ["market", "core memory"]),
      ]),
    day("e-d6", 6, "Elephant sanctuary", "Chiang Mai", "Thailand",
      "Full ethical sanctuary day.",
      [
        act("e-d6-a1", "Elephant Nature Park", "experience", "flexible", "Observe and feed rescued elephants, no riding.", "Mae Taeng", ["core memory", "ethical"]),
      ]),
    day("e-d7", 7, "Cooking class + fly to Krabi", "Krabi / Railay", "Thailand",
      "Cook, then second flight to the coast.",
      [
        act("e-d7-a1", "Half-day cooking class", "experience", "morning", "Khao soi and curry paste from scratch.", "Chiang Mai", ["cooking"]),
        act("e-d7-a2", "Fly Chiang Mai → Krabi", "transit", "afternoon", "~2-hour domestic flight; transfer to Ao Nang/Railay.", "—", ["transfer"]),
      ]),
    day("e-d8", 8, "Boat to Railay", "Krabi / Railay", "Thailand",
      "Onto the cliff peninsula.",
      [
        act("e-d8-a1", "Longtail to Railay", "transit", "morning", "Short boat to a road-free beach.", "Railay", ["boat"]),
        act("e-d8-a2", "Phra Nang Cave Beach", "nature", "afternoon", "The cliff-backed beach.", "Phra Nang", ["beach", "core memory"]),
      ]),
    day("e-d9", 9, "Four Islands tour", "Krabi / Railay", "Thailand",
      "Longtail island-hopping.",
      [
        act("e-d9-a1", "Four Islands tour", "nature", "flexible", "Snorkeling and the low-tide sandbar.", "Krabi", ["beach", "core memory"]),
      ]),
    day("e-d10", 10, "Hong Islands lagoon", "Krabi / Railay", "Thailand",
      "The hidden lagoon and viewpoint.",
      [
        act("e-d10-a1", "Hong Islands tour", "nature", "flexible", "Enclosed lagoon and panorama, quieter than Four Islands.", "Hong Islands", ["beach", "viewpoint"]),
      ]),
    day("e-d11", 11, "Slow beach + Krabi market", "Krabi / Railay", "Thailand",
      "An unstructured day and the town market.",
      [
        act("e-d11-a1", "Unstructured beach day", "relax", "flexible", "Swim, read, nothing scheduled.", "Railay", ["relax"]),
        act("e-d11-a2", "Krabi Town Walking Street", "market", "evening", "Weekend night market (Fri–Sun).", "Krabi Town", ["market"]),
      ]),
    day("e-d12", 12, "Fly home", "Krabi / Railay", "Thailand",
      "Depart from Krabi.",
      [
        act("e-d12-a1", "Depart Krabi", "transit", "morning", "Boat back, then airport.", "Krabi", ["transfer"]),
      ]),
  ],
};

export const SEED_PLANS: TripPlan[] = [planA, planB, planC, planD, planE].map((p) => ({
  ...p,
  seed: true,
}));
