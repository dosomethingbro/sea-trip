// src/lib/croatia/curated.ts
//
// Hand-curated, vetted activity ideas per location. This is the "curated" half
// of the swap pool; the "AI" half is generated live via web search. Tuned to
// Lucas + girlfriend: authentic local food, scenery, relaxed pacing, a couple
// of memorable experiences — not a tourist checklist.

import type { ActivityCategory, CroatiaLocation, DaySlot } from "./types";

export interface CuratedIdea {
  title: string;
  description: string;
  category: ActivityCategory;
  slot: DaySlot;
  tags: string[];
}

export const CURATED_IDEAS: Record<Exclude<CroatiaLocation, "Travel">, CuratedIdea[]> = {
  Split: [
    { title: "Diocletian's Palace cellars & substructures", description: "Wander the atmospheric Roman cellars beneath the palace, then up into Peristyle square.", category: "history", slot: "morning", tags: ["history", "iconic"] },
    { title: "Marjan Hill walk & swim", description: "Pine-shaded trails above the city with viewpoints, ending at a quiet swimming cove.", category: "nature", slot: "morning", tags: ["nature", "scenery", "swim"] },
    { title: "Konoba dinner in Varoš", description: "Slow dinner at a family konoba in the old fishermen's quarter — peka, fresh fish, local wine.", category: "food", slot: "evening", tags: ["food", "local", "authentic"] },
    { title: "Pazar green market & Matejuška", description: "Graze the morning market, then watch fishing boats and sunset at Matejuška harbor.", category: "experience", slot: "afternoon", tags: ["market", "local", "relaxed"] },
    { title: "Bačvice & beach bars", description: "Join locals playing picigin in the shallows, then easygoing beach-bar evening.", category: "beach", slot: "afternoon", tags: ["beach", "local", "relaxed"] },
    { title: "Day trip to Trogir", description: "Short hop to the UNESCO old town of Trogir — compact, walkable, gorgeous.", category: "culture", slot: "all-day", tags: ["history", "day-trip"] },
  ],
  Korcula: [
    { title: "Wine tasting in Lumbarda (Grk)", description: "Taste the rare native Grk white at a small family vineyard near Lumbarda's sand beaches.", category: "food", slot: "afternoon", tags: ["wine", "local", "scenery"] },
    { title: "Moreška sword dance", description: "Catch the centuries-old Korčula sword dance performed in the old town (summer evenings).", category: "culture", slot: "evening", tags: ["culture", "unique", "live"] },
    { title: "Sea kayak around the old town", description: "Paddle the calm channel with views back at the walled peninsula.", category: "experience", slot: "morning", tags: ["active", "scenery", "water"] },
    { title: "Pupnatska Luka beach", description: "One of the island's most beautiful coves — turquoise water, worth the drive.", category: "beach", slot: "afternoon", tags: ["beach", "scenery", "swim"] },
    { title: "Sunset cocktails at Massimo", description: "Climb into a stone tower bar for drinks lowered by pulley at sunset.", category: "nightlife", slot: "evening", tags: ["sunset", "unique", "relaxed"] },
    { title: "Konoba dinner with island wine", description: "Dinner at a rustic konoba — žrnovski makaruni pasta and Pošip wine.", category: "food", slot: "evening", tags: ["food", "local", "authentic"] },
  ],
  Dubrovnik: [
    { title: "City walls at opening (beat the heat & crowds)", description: "Walk the full circuit right when it opens for cool air and empty ramparts.", category: "history", slot: "morning", tags: ["iconic", "history", "early"] },
    { title: "Lokrum Island swim & peacocks", description: "Quick ferry to the green island for a swim, botanical gardens, and shade.", category: "nature", slot: "afternoon", tags: ["nature", "swim", "scenery"] },
    { title: "Buža bar cliff swim", description: "Drinks from a hole-in-the-wall bar perched on the cliffs, with a swim off the rocks.", category: "beach", slot: "afternoon", tags: ["swim", "sunset", "iconic"] },
    { title: "Cable car up Srđ at sunset", description: "Ride up Mount Srđ for the classic golden-hour view over the red roofs and sea.", category: "experience", slot: "evening", tags: ["sunset", "scenery", "iconic"] },
    { title: "Birthday dinner with a view", description: "Special-occasion dinner — terrace tables over the water in or near the old town.", category: "celebration", slot: "evening", tags: ["food", "special", "view"] },
    { title: "Kayak to Betina Cave beach", description: "Guided sea-kayak under the walls to a hidden cave beach — great memory-maker.", category: "experience", slot: "afternoon", tags: ["active", "water", "memorable"] },
  ],
};
