// Product Configuration
// Update this file when you want to add/change products

export type ProductType = "tshirt" | "cd" | "necklace";
export type ShirtColor = "white" | "black";

export interface Product {
  id: string;
  name: string;
  price: number; // in cents (e.g., 3500 = $35.00)
  type: ProductType;
  image: string; // path from /public/
  images?: string[];
  description?: string;
  frameColor: "pink" | "lime";
  color?: ShirtColor;
  sizes?: Array<{
    label: "S" | "M" | "L" | "XL";
    stock: number;
  }>;
}

// ============================================
// EDIT THESE PRODUCTS FOR YOUR STORE
// ============================================

export const PRODUCTS: Product[] = [
  // WHITE T-SHIRT LISTING
  {
    id: "tshirt-white",
    name: "Asianpaper Tee - White",
    price: 2000, // £20.00
    type: "tshirt",
    image: "/merch/white/IMG_0550-23bc6383-31a3-4c7e-8722-1cc0fcaeb029.png",
    images: [
      "/merch/white/IMG_0550-23bc6383-31a3-4c7e-8722-1cc0fcaeb029.png",
      "/merch/white/IMG_0551-ec858adb-1276-4c04-8251-a1deab4ab830.png",
      "/merch/white/IMG_0552-c4b24f02-53d2-442a-8c7b-c17f56a8d858.png",
      "/merch/white/IMG_0553-4f955850-7a68-4bf9-946a-d038ef537d87.png",
      "/merch/white/IMG_0554-dd3ff245-d261-4aa7-b63c-00640bc77fb6.png",
      "/merch/white/IMG_0555-72831d6e-8bf3-4e52-a449-618cfb6c70d4.png",
      "/merch/white/IMG_0556-120445a4-5d85-46ac-bbaf-99f81fce539b.png",
      "/merch/white/IMG_0557-e4031f26-8d32-4e29-bc8e-c522396b2c0a.png",
      "/merch/white/IMG_0560-b57363a1-04f0-4ded-8cf5-5cf9c3238465.png",
      "/merch/white/IMG_0561-8e1f3ee5-31fd-4993-a3bf-79e40a9e2688.png",
    ],
    color: "white",
    frameColor: "pink",
    sizes: [
      { label: "S", stock: 1 },
      { label: "L", stock: 9 },
      { label: "XL", stock: 2 },
    ],
  },

  // BLACK T-SHIRT LISTING (update images + stock when available)
  {
    id: "tshirt-black",
    name: "Asianpaper Tee - Black",
    price: 2000, // £20.00
    type: "tshirt",
    image: "/merch/black/IMG_0547-ca9718cd-c20d-4676-a81b-3250160a60d3.png",
    images: [
      "/merch/black/IMG_0547-ca9718cd-c20d-4676-a81b-3250160a60d3.png",
      "/merch/black/IMG_0548-74f98e3a-fe5e-4dc7-a140-3b4a82fba147.png",
      "/merch/black/IMG_0549-800fb834-c126-454a-9b6a-35f290bbd2a1.png",
      "/merch/black/IMG_0558-cac16963-5a3f-4c41-bc85-acba8b054137.png",
      "/merch/black/IMG_0559-77a250cb-974e-4c4a-8221-c9129ac10721.png",
    ],
    color: "black",
    frameColor: "lime",
    sizes: [
      { label: "M", stock: 1 },
      { label: "L", stock: 2 },
      { label: "XL", stock: 2 },
    ],
  },

  // CD - Multiple available (2x size of t-shirts)
  {
    id: "cd-album",
    name: "There & Back CD",
    price: 800, // £8.00
    type: "cd",
    image: "/merch/cd/IMG_5220-2369acfd-c438-4ba5-b567-1e3b0814e6d6.png",
    images: [
      "/merch/cd/IMG_5220-2369acfd-c438-4ba5-b567-1e3b0814e6d6.png",
      "/merch/cd/IMG_5221-a0582d33-21f1-4dc0-987b-98577cf7528c.png",
      "/merch/cd/IMG_5222-70a0dbfc-4bf7-42e5-939d-201aebe11aa1.png",
    ],
    description: "Limited edition CD",
    frameColor: "pink",
  },

  // NECKLACE - Multiple available (2x size of t-shirts)
  {
    id: "necklace-item",
    name: "Twin Logo Pendant",
    price: 500, // £5.00
    type: "necklace",
    image: "/merch/pendant/IMG_5216-1fe80bc2-fb41-41f0-835b-6a841b2ca125.png",
    images: [
      "/merch/pendant/IMG_5216-1fe80bc2-fb41-41f0-835b-6a841b2ca125.png",
      "/merch/pendant/IMG_5217-3149270d-f02d-4b84-8e36-d4a0d0f6ccd1.png",
      "/merch/pendant/IMG_5218-381a03d3-05f5-450f-adb8-f716b4203ca3.png",
      "/merch/pendant/IMG_5219-966bdb51-89ae-4d85-a64a-e50dbb46b488.png",
    ],
    description: "Twin logo pendant",
    frameColor: "lime",
  },
];

// Display sizes
export const TSHIRT_SIZE = 140; // px
export const BULK_SIZE = TSHIRT_SIZE * 2; // 280px for CDs and necklaces

export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p])) as Record<string, Product>;
