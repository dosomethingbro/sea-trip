// src/lib/croatia/seed.ts
//
// The fixed Croatia itinerary, transcribed from the printed plan. Days are
// static; their activities are the initial seed of the mutable per-day lists.

import type { CroatiaActivity, CroatiaDay, CroatiaTrip } from "./types";

export const CROATIA_TRIP: Omit<CroatiaTrip, "days"> = {
  title: "Croatia",
  subtitle: "Split · Korčula · Dubrovnik — July 2–11, 2026",
  travelers: ["Lucas", "Girlfriend"],
};

export const CROATIA_DAYS: CroatiaDay[] = [
  {
    id: "d1",
    dayNumber: 1,
    dateISO: "2026-07-02",
    dateLabel: "Thu, Jul 2",
    location: "Travel",
    title: "Leave SF → Split",
    summary: "Depart SFO in the afternoon, overnight transatlantic to Zurich.",
  },
  {
    id: "d2",
    dayNumber: 2,
    dateISO: "2026-07-03",
    dateLabel: "Fri, Jul 3",
    location: "Split",
    title: "Arrive in Split",
    summary: "Land in Split, check in on the Riva, and ease into the trip with dinner.",
    lodging: { name: "Imperial Riva Residence", address: "Alješijina 6, 21000 Split, Croatia" },
  },
  {
    id: "d3",
    dayNumber: 3,
    dateISO: "2026-07-04",
    dateLabel: "Sat, Jul 4",
    location: "Split",
    title: "Explore Split",
    summary: "A full, unhurried day wandering Diocletian's Palace and the old town.",
    lodging: { name: "Imperial Riva Residence", address: "Alješijina 6, 21000 Split, Croatia" },
  },
  {
    id: "d4",
    dayNumber: 4,
    dateISO: "2026-07-05",
    dateLabel: "Sun, Jul 5",
    location: "Split",
    title: "Islands & Split",
    summary: "Half-day island hopping and snorkeling in the morning, Split in the afternoon.",
    lodging: { name: "Imperial Riva Residence", address: "Alješijina 6, 21000 Split, Croatia" },
  },
  {
    id: "d5",
    dayNumber: 5,
    dateISO: "2026-07-06",
    dateLabel: "Mon, Jul 6",
    location: "Travel",
    title: "Split → Korčula",
    summary: "Low-key morning, then the TP-line catamaran to Korčula and old town at golden hour.",
    lodging: { name: "Luciana", address: "Ulica Biskupa Luke Tolentića 3, 20260 Korčula, Croatia" },
  },
  {
    id: "d6",
    dayNumber: 6,
    dateISO: "2026-07-07",
    dateLabel: "Tue, Jul 7",
    location: "Korcula",
    title: "Korčula",
    summary: "Potential island/snorkeling trip in the morning, exploring the island in the afternoon.",
    lodging: { name: "Luciana", address: "Ulica Biskupa Luke Tolentića 3, 20260 Korčula, Croatia" },
  },
  {
    id: "d7",
    dayNumber: 7,
    dateISO: "2026-07-08",
    dateLabel: "Wed, Jul 8",
    location: "Travel",
    title: "Korčula → Dubrovnik · Luke's Birthday",
    summary: "Sleep in and celebrate, catamaran to Dubrovnik, then old town and a birthday dinner.",
    lodging: { name: "Apartment Vista Ragusa", address: "Srednji Kono 18a, 20000 Dubrovnik, Croatia" },
    isBirthday: true,
  },
  {
    id: "d8",
    dayNumber: 8,
    dateISO: "2026-07-09",
    dateLabel: "Thu, Jul 9",
    location: "Dubrovnik",
    title: "Explore Dubrovnik",
    summary: "A full day in Dubrovnik — old town walls, viewpoints, and the sea.",
    lodging: { name: "Apartment Vista Ragusa", address: "Srednji Kono 18a, 20000 Dubrovnik, Croatia" },
  },
  {
    id: "d9",
    dayNumber: 9,
    dateISO: "2026-07-10",
    dateLabel: "Fri, Jul 10",
    location: "Dubrovnik",
    title: "Explore Dubrovnik",
    summary: "Last full day to soak up Dubrovnik before the journey home.",
    lodging: { name: "Apartment Vista Ragusa", address: "Srednji Kono 18a, 20000 Dubrovnik, Croatia" },
  },
  {
    id: "d10",
    dayNumber: 10,
    dateISO: "2026-07-11",
    dateLabel: "Sat, Jul 11",
    location: "Travel",
    title: "Return Home",
    summary: "Fly Dubrovnik → Zurich → SFO.",
  },
];

// Stable seed activities. Locked items (flights, check-ins, catamaran legs)
// anchor the trip and can't be swapped or removed.
type SeedActivity = Omit<CroatiaActivity, "dayId" | "position">;

const SEED_BY_DAY: Record<string, SeedActivity[]> = {
  d1: [
    { id: "a-d1-1", slot: "afternoon", timeLabel: "2:25pm", title: "Leave SFO — Flight UA 44", description: "Depart San Francisco for Zurich.", category: "flight", location: "Travel", source: "seed", locked: true },
    { id: "a-d1-2", slot: "evening", title: "Overnight to Europe", description: "Transatlantic red-eye. Sleep if you can.", category: "transfer", location: "Travel", source: "seed", locked: true },
  ],
  d2: [
    { id: "a-d2-1", slot: "morning", timeLabel: "10:20am", title: "Arrive Zurich", description: "Layover in Zurich.", category: "transfer", location: "Travel", source: "seed", locked: true },
    { id: "a-d2-2", slot: "afternoon", timeLabel: "3:00pm", title: "Leave Zurich — Flight LX4254", description: "Connecting flight Zurich → Split.", category: "flight", location: "Travel", source: "seed", locked: true },
    { id: "a-d2-3", slot: "afternoon", timeLabel: "4:25pm", title: "Arrive in Split", description: "Touch down in Split.", category: "flight", location: "Split", source: "seed", locked: true },
    { id: "a-d2-4", slot: "afternoon", title: "Check in — Imperial Riva Residence", description: "Alješijina 6, 21000 Split.", category: "lodging", location: "Split", source: "seed", locked: true },
    { id: "a-d2-5", slot: "evening", title: "Explore & grab dinner", description: "Wander the Riva and find a first-night dinner.", category: "food", location: "Split", source: "seed" },
  ],
  d3: [
    { id: "a-d3-1", slot: "all-day", title: "Explore Split", description: "Diocletian's Palace, the old town lanes, and the waterfront at your own pace.", category: "culture", location: "Split", source: "seed" },
  ],
  d4: [
    { id: "a-d4-1", slot: "morning", timeLabel: "AM", title: "Island hopping / snorkeling — half day", description: "Half-day boat trip out of Split for swimming and snorkeling.", category: "experience", location: "Split", source: "seed" },
    { id: "a-d4-2", slot: "afternoon", timeLabel: "PM", title: "Explore Split", description: "Back in town for the afternoon and evening.", category: "culture", location: "Split", source: "seed" },
  ],
  d5: [
    { id: "a-d5-1", slot: "morning", title: "Low-key morning", description: "Slow start, coffee, last wander around Split.", category: "relax", location: "Split", source: "seed" },
    { id: "a-d5-2", slot: "afternoon", timeLabel: "12:15pm", title: "TP-line catamaran to Korčula", description: "Depart Split for Korčula on the TP-line catamaran.", category: "transfer", location: "Travel", source: "seed", locked: true },
    { id: "a-d5-3", slot: "afternoon", timeLabel: "3:00pm", title: "Arrive in Korčula", description: "Arrive in Korčula.", category: "transfer", location: "Korcula", source: "seed", locked: true },
    { id: "a-d5-4", slot: "afternoon", title: "Check in — Luciana", description: "Ulica Biskupa Luke Tolentića 3, 20260 Korčula.", category: "lodging", location: "Korcula", source: "seed", locked: true },
    { id: "a-d5-5", slot: "evening", title: "Explore old town Korčula", description: "Wander the walled old town at golden hour.", category: "culture", location: "Korcula", source: "seed" },
  ],
  d6: [
    { id: "a-d6-1", slot: "morning", title: "Potential island / snorkeling trip", description: "Optional morning boat trip around the islands.", category: "experience", location: "Korcula", source: "seed" },
    { id: "a-d6-2", slot: "afternoon", title: "Explore the island", description: "Beaches, vineyards, and small towns around Korčula.", category: "nature", location: "Korcula", source: "seed" },
  ],
  d7: [
    { id: "a-d7-1", slot: "morning", title: "Luke's birthday — sleep in & breakfast", description: "Celebrate the birthday with a slow morning and a good breakfast.", category: "celebration", location: "Korcula", source: "seed", locked: true },
    { id: "a-d7-2", slot: "afternoon", timeLabel: "12:20pm", title: "TP-line catamaran to Dubrovnik", description: "Depart Korčula for Dubrovnik on the TP-line catamaran.", category: "transfer", location: "Travel", source: "seed", locked: true },
    { id: "a-d7-3", slot: "afternoon", timeLabel: "2:15pm", title: "Arrive in Dubrovnik", description: "Arrive in Dubrovnik.", category: "transfer", location: "Dubrovnik", source: "seed", locked: true },
    { id: "a-d7-4", slot: "afternoon", title: "Check in — Apartment Vista Ragusa", description: "Srednji Kono 18a, 20000 Dubrovnik.", category: "lodging", location: "Dubrovnik", source: "seed", locked: true },
    { id: "a-d7-5", slot: "evening", title: "Explore Dubrovnik old town", description: "First look at the walled city.", category: "culture", location: "Dubrovnik", source: "seed" },
    { id: "a-d7-6", slot: "evening", title: "Birthday dinner", description: "A special dinner for Luke's birthday.", category: "celebration", location: "Dubrovnik", source: "seed" },
  ],
  d8: [
    { id: "a-d8-1", slot: "all-day", title: "Explore Dubrovnik", description: "Walk the city walls, find viewpoints, and swim off the rocks.", category: "culture", location: "Dubrovnik", source: "seed" },
  ],
  d9: [
    { id: "a-d9-1", slot: "all-day", title: "Explore Dubrovnik", description: "More of Dubrovnik at a relaxed pace.", category: "culture", location: "Dubrovnik", source: "seed" },
  ],
  d10: [
    { id: "a-d10-1", slot: "morning", timeLabel: "9:30am", title: "Leave Dubrovnik — Flight LX2267", description: "Depart Dubrovnik for Zurich.", category: "flight", location: "Travel", source: "seed", locked: true },
    { id: "a-d10-2", slot: "morning", timeLabel: "11:25am", title: "Arrive Zurich", description: "Layover in Zurich.", category: "transfer", location: "Travel", source: "seed", locked: true },
    { id: "a-d10-3", slot: "afternoon", timeLabel: "1:35pm", title: "Leave Zurich — Flight UA45", description: "Connecting flight Zurich → SFO.", category: "flight", location: "Travel", source: "seed", locked: true },
    { id: "a-d10-4", slot: "afternoon", timeLabel: "4:35pm", title: "Arrive in SFO", description: "Home.", category: "flight", location: "Travel", source: "seed", locked: true },
  ],
};

export function buildSeedActivities(): CroatiaActivity[] {
  const out: CroatiaActivity[] = [];
  for (const day of CROATIA_DAYS) {
    const items = SEED_BY_DAY[day.id] ?? [];
    items.forEach((item, i) => {
      out.push({ ...item, dayId: day.id, position: i });
    });
  }
  return out;
}
