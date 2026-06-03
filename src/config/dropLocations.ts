// Secret merch drop locations shown as pins on the 3D London map.
//
// To add a real drop, append an entry below. `lng`/`lat` are decimal degrees
// (longitude first, then latitude). You can grab coordinates from Google Maps
// by right-clicking a spot and copying the "lat, lng" pair (remember to swap
// the order here: lng, then lat).
//
// Set `revealed: false` to keep a pin on the map without giving away the exact
// spot yet (it renders as a mystery pin without a name in the popup).

export type DropLocation = {
  id: string;
  name: string;
  lng: number;
  lat: number;
  /** Optional short detail shown in the popup, e.g. an address/date/hint. */
  hint?: string;
  /** When false, the pin shows as "location coming soon" with no name. */
  revealed?: boolean;
};

// DEMO drop locations (subject to change). Coordinates geocoded from the
// venue postcodes. Clicking the twins logo tours through these in order.
export const dropLocations: DropLocation[] = [
  {
    id: "village-underground",
    name: "Village Underground",
    lng: -0.07797,
    lat: 51.52347,
    hint: "54 Holywell Ln, EC2A 3PQ",
    revealed: true,
  },
  {
    id: "colour-factory",
    name: "Colour Factory",
    lng: -0.02311,
    lat: 51.54296,
    hint: "8 Queen’s Yard, E9 5EN",
    revealed: true,
  },
  {
    id: "the-cause",
    name: "The Cause",
    lng: 0.01714,
    lat: 51.50476,
    hint: "60 Dock Rd, E16 1YZ",
    revealed: true,
  },
  {
    id: "93-feet-east",
    name: "93 Feet East",
    lng: -0.0722,
    lat: 51.52089,
    hint: "150 Brick Ln, E1 6QL",
    revealed: true,
  },
  {
    id: "mot-unit-18",
    name: "MOT Unit 18",
    lng: -0.05143,
    lat: 51.48447,
    hint: "Surrey Canal Rd, SE16 5RT",
    revealed: true,
  },
  {
    id: "fire",
    name: "Fire",
    lng: -0.12379,
    lat: 51.48472,
    hint: "39 Parry St, SW8 1RT",
    revealed: true,
  },
  {
    id: "windmill-brixton",
    name: "Windmill Brixton",
    lng: -0.12247,
    lat: 51.45452,
    hint: "22 Blenheim Gardens, SW2 5BZ",
    revealed: true,
  },
  {
    id: "corsica-studios",
    name: "Corsica Studios",
    lng: -0.09851,
    lat: 51.494,
    hint: "4/5 Elephant Rd, SE17 1LB",
    revealed: true,
  },
  {
    id: "the-silver-building",
    name: "The Silver Building",
    lng: 0.0175,
    lat: 51.50454,
    hint: "Dock Rd, E16 2AB",
    revealed: true,
  },
  {
    id: "earth-hackney",
    name: "EartH (Hackney)",
    lng: -0.07538,
    lat: 51.55089,
    hint: "11-17 Stoke Newington Rd, N16 8BH",
    revealed: true,
  },
];

// Map starting view. Centered on central London.
export const LONDON_CENTER: [number, number] = [-0.0780, 51.5135];
