import { Person, Room, TaskPreset } from "@/types";

export const INITIAL_PEOPLE: Omit<Person, "createdAt" | "updatedAt">[] = [
  {
    id: "p-eva",
    name: "Eva",
    email: "eva@example.com",
    emoji: "👩",
    active: true,
  },
  {
    id: "p-anna",
    name: "Anna",
    email: "anna@example.com",
    emoji: "👧",
    active: true,
  },
];

export const INITIAL_ROOMS: Omit<Room, "createdAt" | "updatedAt">[] = [
  { id: "r-kuchyn", name: "Kuchyň", active: true, sortOrder: 1 },
  { id: "r-obyvak", name: "Obývák", active: true, sortOrder: 2 },
  { id: "r-koupelna", name: "Koupelna", active: true, sortOrder: 3 },
  { id: "r-wc", name: "WC", active: true, sortOrder: 4 },
  { id: "r-chodba", name: "Chodba", active: true, sortOrder: 5 },
  { id: "r-loznice", name: "Ložnice", active: true, sortOrder: 6 },
];

export const INITIAL_PRESETS: Omit<TaskPreset, "createdAt" | "updatedAt">[] = [
  // Kitchen
  { id: "tp-k1", name: "Vyklidit myčku", category: "Kitchen", icon: "🍽️", active: true, sortOrder: 1 },
  { id: "tp-k2", name: "Naplnit myčku", category: "Kitchen", icon: "🍽️", active: true, sortOrder: 2 },
  { id: "tp-k3", name: "Umýt nádobí", category: "Kitchen", icon: "🧽", active: true, sortOrder: 3 },
  { id: "tp-k4", name: "Uklidit kuchyň", category: "Kitchen", icon: "🍳", active: true, sortOrder: 4 },
  { id: "tp-k5", name: "Uklidit kuchyňskou linku", category: "Kitchen", icon: "✨", active: true, sortOrder: 5 },
  { id: "tp-k6", name: "Otřít pracovní desku", category: "Kitchen", icon: "🧽", active: true, sortOrder: 6 },
  { id: "tp-k7", name: "Vyčistit dřez", category: "Kitchen", icon: "🚰", active: true, sortOrder: 7 },
  { id: "tp-k8", name: "Vyčistit varnou desku", category: "Kitchen", icon: "🔥", active: true, sortOrder: 8 },
  { id: "tp-k9", name: "Uklidit jídelní stůl", category: "Kitchen", icon: "🪑", active: true, sortOrder: 9 },

  // Cleaning
  { id: "tp-c1", name: "Vysát", category: "Cleaning", icon: "🧹", active: true, sortOrder: 10 },
  { id: "tp-c2", name: "Vytřít", category: "Cleaning", icon: "🪣", active: true, sortOrder: 11 },
  { id: "tp-c3", name: "Utřít prach", category: "Cleaning", icon: "✨", active: true, sortOrder: 12 },
  { id: "tp-c4", name: "Uklidit", category: "Cleaning", icon: "📦", active: true, sortOrder: 13 },
  { id: "tp-c5", name: "Uklidit věci ze země", category: "Cleaning", icon: "🧸", active: true, sortOrder: 14 },

  // Bathroom / WC
  { id: "tp-b1", name: "Uklidit koupelnu", category: "Bathroom", icon: "🚿", active: true, sortOrder: 20 },
  { id: "tp-b2", name: "Vyčistit sprchu / vanu", category: "Bathroom", icon: "🛁", active: true, sortOrder: 21 },
  { id: "tp-b3", name: "Umýt umyvadlo", category: "Bathroom", icon: "🚰", active: true, sortOrder: 22 },
  { id: "tp-b4", name: "Vyčistit WC", category: "Bathroom", icon: "🚽", active: true, sortOrder: 23 },
  { id: "tp-b5", name: "Umýt zrcadlo", category: "Bathroom", icon: "🪞", active: true, sortOrder: 24 },
  { id: "tp-b6", name: "Vyměnit ručníky", category: "Bathroom", icon: "🧺", active: true, sortOrder: 25 },
  { id: "tp-b7", name: "Doplnit toaletní papír", category: "Bathroom", icon: "🧻", active: true, sortOrder: 26 },

  // Waste
  { id: "tp-w1", name: "Vynést směsný odpad", category: "Waste", icon: "🗑️", active: true, sortOrder: 30 },
  { id: "tp-w2", name: "Vynést plast", category: "Waste", icon: "🟡", active: true, sortOrder: 31 },
  { id: "tp-w3", name: "Vynést papír", category: "Waste", icon: "🔵", active: true, sortOrder: 32 },
  { id: "tp-w4", name: "Vynést sklo", category: "Waste", icon: "🟢", active: true, sortOrder: 33 },
  { id: "tp-w5", name: "Vynést bioodpad", category: "Waste", icon: "🟤", active: true, sortOrder: 34 },
  { id: "tp-w6", name: "Dát nový pytel do koše", category: "Waste", icon: "🚮", active: true, sortOrder: 35 },

  // Laundry
  { id: "tp-l1", name: "Dát prádlo do pračky", category: "Laundry", icon: "🧺", active: true, sortOrder: 40 },
  { id: "tp-l2", name: "Pověsit prádlo", category: "Laundry", icon: "👕", active: true, sortOrder: 41 },
  { id: "tp-l3", name: "Vyndat prádlo ze sušičky", category: "Laundry", icon: "🌀", active: true, sortOrder: 42 },
  { id: "tp-l4", name: "Složit prádlo", category: "Laundry", icon: "👚", active: true, sortOrder: 43 },
  { id: "tp-l5", name: "Uklidit prádlo", category: "Laundry", icon: "👗", active: true, sortOrder: 44 },

  // General
  { id: "tp-g1", name: "Uklidit boty", category: "General", icon: "👟", active: true, sortOrder: 50 },
  { id: "tp-g2", name: "Uklidit chodbu", category: "General", icon: "🚪", active: true, sortOrder: 51 },
  { id: "tp-g3", name: "Zalít květiny", category: "General", icon: "🪴", active: true, sortOrder: 52 },
  { id: "tp-g4", name: "Uklidit vlastní věci", category: "General", icon: "🎒", active: true, sortOrder: 53 },
  { id: "tp-g5", name: "Uklidit po sobě", category: "General", icon: "🧹", active: true, sortOrder: 54 },
  { id: "tp-g6", name: "Ukliď si ten bordel!", category: "General", icon: "💥", active: true, sortOrder: 55 },
];
