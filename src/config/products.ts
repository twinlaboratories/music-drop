// Product Configuration
// Update this file when you want to add/change products

export type ProductType = "tshirt" | "cd" | "necklace";

export interface Product {
  id: string;
  name: string;
  price: number; // in cents (e.g., 3500 = $35.00)
  type: ProductType;
  image: string; // path from /public/
  description?: string;
  frameColor: "pink" | "lime";
  size?: string; // for display purposes
}

// ============================================
// EDIT THESE PRODUCTS FOR YOUR STORE
// ============================================

export const PRODUCTS: Product[] = [
  // T-SHIRTS - Each is unique (only 1 available)
  // When added to cart, they disappear from store
  {
    id: "tshirt-01",
    name: "There&Back Tee #1",
    price: 3500, // $35.00
    type: "tshirt",
    image: "/merch/tshirt-01.jpg",
    frameColor: "pink",
    size: "M", // Optional: S, M, L, XL, etc.
  },
  {
    id: "tshirt-02",
    name: "There&Back Tee #2",
    price: 3500,
    type: "tshirt",
    image: "/merch/tshirt-02.jpg",
    frameColor: "lime",
    size: "L",
  },
  {
    id: "tshirt-03",
    name: "There&Back Tee #3",
    price: 3500,
    type: "tshirt",
    image: "/merch/tshirt-03.jpg",
    frameColor: "pink",
    size: "M",
  },
  {
    id: "tshirt-04",
    name: "There&Back Tee #4",
    price: 3500,
    type: "tshirt",
    image: "/merch/tshirt-04.jpg",
    frameColor: "lime",
    size: "XL",
  },
  {
    id: "tshirt-05",
    name: "There&Back Tee #5",
    price: 3500,
    type: "tshirt",
    image: "/merch/tshirt-05.jpg",
    frameColor: "pink",
    size: "S",
  },
  {
    id: "tshirt-06",
    name: "There&Back Tee #6",
    price: 3500,
    type: "tshirt",
    image: "/merch/tshirt-06.jpg",
    frameColor: "lime",
    size: "L",
  },

  // CD - Multiple available (2x size of t-shirts)
  {
    id: "cd-album",
    name: "There&Back CD",
    price: 1500, // $15.00
    type: "cd",
    image: "/merch/cd.jpg",
    description: "Limited edition CD",
    frameColor: "pink",
  },

  // NECKLACE - Multiple available (2x size of t-shirts)
  {
    id: "necklace-item",
    name: "TheTwins Pendant",
    price: 4500, // $45.00
    type: "necklace",
    image: "/merch/necklace.jpg",
    description: "Exclusive pendant necklace",
    frameColor: "lime",
  },
];

// Display sizes
export const TSHIRT_SIZE = 140; // px
export const BULK_SIZE = TSHIRT_SIZE * 2; // 280px for CDs and necklaces
