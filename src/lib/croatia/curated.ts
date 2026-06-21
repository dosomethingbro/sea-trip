// src/lib/croatia/curated.ts
//
// Hand-curated, vetted activity ideas per location. This is the "curated" half
// of the swap pool; the "AI" half is generated live via web search. Tuned to
// Lucas + Tobi: authentic local food, scenery, relaxed pacing, a couple of
// memorable experiences — not a tourist checklist.

import type {
  ActivityCategory,
  ActivityDetails,
  CroatiaLocation,
  DaySlot,
} from "./types";

export interface CuratedIdea {
  title: string;
  description: string;
  category: ActivityCategory;
  slot: DaySlot;
  tags: string[];
  details?: ActivityDetails;
}

export const CURATED_IDEAS: Record<Exclude<CroatiaLocation, "Travel">, CuratedIdea[]> = {
  Split: [
    {
      title: "Diocletian's Palace cellars & substructures",
      description: "Wander the atmospheric Roman cellars beneath the palace, then up into Peristyle square.",
      category: "history",
      slot: "morning",
      tags: ["history", "iconic"],
      details: {
        area: "Old Town, Split",
        travelTime: "In the old town — walkable from anywhere central",
        bestTime: "Open ~8:30am; go early to beat tour groups",
        priceLevel: "€",
        reviews: { rating: 4.6, count: 18500, source: "Google" },
      },
    },
    {
      title: "Marjan Hill walk & swim",
      description: "Pine-shaded trails above the city with viewpoints, ending at a quiet swimming cove.",
      category: "nature",
      slot: "morning",
      tags: ["nature", "scenery", "swim"],
      details: {
        area: "Marjan, west of the old town",
        travelTime: "15–20-min walk from the Riva to the first viewpoint",
        bestTime: "Morning, before midday heat",
        priceLevel: "Free",
        reviews: { rating: 4.7, count: 9200, source: "Google" },
      },
    },
    {
      title: "Konoba dinner in Varoš",
      description: "Slow dinner at a family konoba in the old fishermen's quarter — peka, fresh fish, local wine.",
      category: "food",
      slot: "evening",
      tags: ["food", "local", "authentic"],
      details: {
        area: "Varoš, Split",
        travelTime: "5-min walk uphill from the Riva",
        bestTime: "Book peka 24h ahead; arrive ~8pm",
        priceLevel: "€€",
        reviews: { rating: 4.5, count: 1400, source: "TripAdvisor" },
      },
    },
    {
      title: "Pazar green market & Matejuška",
      description: "Graze the morning market, then watch fishing boats and sunset at Matejuška harbor.",
      category: "experience",
      slot: "afternoon",
      tags: ["market", "local", "relaxed"],
      details: {
        area: "East gate + west harbor, Split",
        travelTime: "Both a few minutes from the old town",
        bestTime: "Market mornings; Matejuška at sunset",
        priceLevel: "Free",
        reviews: { rating: 4.4, count: 5300, source: "Google" },
      },
    },
    {
      title: "Bačvice & beach bars",
      description: "Join locals playing picigin in the shallows, then easygoing beach-bar evening.",
      category: "beach",
      slot: "afternoon",
      tags: ["beach", "local", "relaxed"],
      details: {
        area: "Bačvice, Split",
        travelTime: "10-min walk east of the ferry port",
        bestTime: "Late afternoon into evening",
        priceLevel: "€",
        reviews: { rating: 4.2, count: 7600, source: "Google" },
      },
    },
    {
      title: "Day trip to Trogir",
      description: "Short hop to the UNESCO old town of Trogir — compact, walkable, gorgeous.",
      category: "culture",
      slot: "all-day",
      tags: ["history", "day-trip"],
      details: {
        area: "Trogir (27 km west of Split)",
        travelTime: "~40-min bus or boat from Split",
        bestTime: "Half day; mornings are calmer",
        priceLevel: "€€",
        reviews: { rating: 4.7, count: 12100, source: "Google" },
      },
    },
  ],
  Korcula: [
    {
      title: "Wine tasting in Lumbarda (Grk)",
      description: "Taste the rare native Grk white at a small family vineyard near Lumbarda's sand beaches.",
      category: "food",
      slot: "afternoon",
      tags: ["wine", "local", "scenery"],
      details: {
        area: "Lumbarda, Korčula",
        travelTime: "~15-min taxi/bike from Korčula town",
        bestTime: "Afternoon; pair with a sand-beach swim",
        priceLevel: "€€",
        reviews: { rating: 4.8, count: 640, source: "Google" },
      },
    },
    {
      title: "Moreška sword dance",
      description: "Catch the centuries-old Korčula sword dance performed in the old town (summer evenings).",
      category: "culture",
      slot: "evening",
      tags: ["culture", "unique", "live"],
      details: {
        area: "Old Town, Korčula",
        travelTime: "In the old town",
        bestTime: "Mon & Thu evenings in summer; book ahead",
        seasonNote: "Performances run June–September",
        priceLevel: "€€",
        reviews: { rating: 4.6, count: 880, source: "TripAdvisor" },
      },
    },
    {
      title: "Sea kayak around the old town",
      description: "Paddle the calm channel with views back at the walled peninsula.",
      category: "experience",
      slot: "morning",
      tags: ["active", "scenery", "water"],
      details: {
        area: "Korčula channel",
        travelTime: "Launches from town waterfront",
        bestTime: "Morning, before the afternoon breeze",
        priceLevel: "€€",
        reviews: { rating: 4.7, count: 410, source: "Google" },
      },
    },
    {
      title: "Pupnatska Luka beach",
      description: "One of the island's most beautiful coves — turquoise water, worth the drive.",
      category: "beach",
      slot: "afternoon",
      tags: ["beach", "scenery", "swim"],
      details: {
        area: "South coast, Korčula",
        travelTime: "~30-min drive from Korčula town",
        bestTime: "Midday–afternoon for the best water",
        priceLevel: "Free",
        reviews: { rating: 4.7, count: 2300, source: "Google" },
      },
    },
    {
      title: "Sunset cocktails at Massimo",
      description: "Climb into a stone tower bar for drinks lowered by pulley at sunset.",
      category: "nightlife",
      slot: "evening",
      tags: ["sunset", "unique", "relaxed"],
      details: {
        area: "Old Town towers, Korčula",
        travelTime: "In the old town",
        bestTime: "Arrive ~45 min before sunset for a spot",
        priceLevel: "€€",
        reviews: { rating: 4.4, count: 1500, source: "TripAdvisor" },
      },
    },
    {
      title: "Konoba dinner with island wine",
      description: "Dinner at a rustic konoba — žrnovski makaruni pasta and Pošip wine.",
      category: "food",
      slot: "evening",
      tags: ["food", "local", "authentic"],
      details: {
        area: "Žrnovo / old town, Korčula",
        travelTime: "Town konobas walkable; Žrnovo ~10-min taxi",
        bestTime: "Reserve for ~8pm",
        priceLevel: "€€",
        reviews: { rating: 4.6, count: 720, source: "Google" },
      },
    },
  ],
  Dubrovnik: [
    {
      title: "City walls at opening (beat the heat & crowds)",
      description: "Walk the full circuit right when it opens for cool air and empty ramparts.",
      category: "history",
      slot: "morning",
      tags: ["iconic", "history", "early"],
      details: {
        area: "Old Town walls, Dubrovnik",
        travelTime: "Pile Gate entrance, walkable in the old town",
        bestTime: "Right at 8am opening",
        priceLevel: "€€€",
        reviews: { rating: 4.7, count: 41000, source: "Google" },
      },
    },
    {
      title: "Lokrum Island swim & peacocks",
      description: "Quick ferry to the green island for a swim, botanical gardens, and shade.",
      category: "nature",
      slot: "afternoon",
      tags: ["nature", "swim", "scenery"],
      details: {
        area: "Lokrum Island",
        travelTime: "~15-min ferry from the old port",
        bestTime: "Afternoon; last ferries early evening",
        priceLevel: "€€",
        reviews: { rating: 4.7, count: 8800, source: "Google" },
      },
    },
    {
      title: "Buža bar cliff swim",
      description: "Drinks from a hole-in-the-wall bar perched on the cliffs, with a swim off the rocks.",
      category: "beach",
      slot: "afternoon",
      tags: ["swim", "sunset", "iconic"],
      details: {
        area: "Outside the south walls, Dubrovnik",
        travelTime: "Through a gap in the old-town walls",
        bestTime: "Late afternoon into sunset",
        priceLevel: "€€",
        reviews: { rating: 4.5, count: 6100, source: "Google" },
      },
    },
    {
      title: "Cable car up Srđ at sunset",
      description: "Ride up Mount Srđ for the classic golden-hour view over the red roofs and sea.",
      category: "experience",
      slot: "evening",
      tags: ["sunset", "scenery", "iconic"],
      details: {
        area: "Mount Srđ, Dubrovnik",
        travelTime: "Cable car base ~10-min walk from old town",
        bestTime: "Go up ~1 hr before sunset",
        priceLevel: "€€",
        reviews: { rating: 4.6, count: 15400, source: "Google" },
      },
    },
    {
      title: "Birthday dinner with a view",
      description: "Special-occasion dinner — terrace tables over the water in or near the old town.",
      category: "celebration",
      slot: "evening",
      tags: ["food", "special", "view"],
      details: {
        area: "Old Town / Ploče, Dubrovnik",
        travelTime: "Walkable in/near the old town",
        bestTime: "Reserve a sunset terrace table well ahead",
        priceLevel: "€€€",
        reviews: { rating: 4.6, count: 2100, source: "TripAdvisor" },
      },
    },
    {
      title: "Kayak to Betina Cave beach",
      description: "Guided sea-kayak under the walls to a hidden cave beach — great memory-maker.",
      category: "experience",
      slot: "afternoon",
      tags: ["active", "water", "memorable"],
      details: {
        area: "Below the city walls, Dubrovnik",
        travelTime: "Launches near Pile Gate beach",
        bestTime: "Afternoon or sunset tours",
        priceLevel: "€€",
        reviews: { rating: 4.8, count: 3400, source: "Google" },
      },
    },
  ],
};
