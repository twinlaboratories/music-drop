"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { PRODUCTS, TSHIRT_SIZE, BULK_SIZE, Product, ProductType } from "@/config/products";

// Initialize Stripe (publishable key will be loaded from env)
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// Seeded PRNG — stable fractional value 0–1 from any integer seed
function sr(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface FloatingItem {
  id: string;
  product: Product;
  x: number;
  y: number;
  rotation: number;
  width: number;
  floatVariant: number;
  delay: number;
  duration: number;
  z: number;
  dragging: boolean;
  quantity: number;
}

type DragState = {
  id: string;
  startMouseX: number;
  startMouseY: number;
  startItemX: number;
  startItemY: number;
  promoted: boolean;
};

// Generate stable initial items
function generateInitialItems(): FloatingItem[] {
  const W = 1200;
  const H = 900;
  
  return PRODUCTS.map((product, i) => {
    const isBulk = product.type === "cd" || product.type === "necklace";
    const width = isBulk ? BULK_SIZE : TSHIRT_SIZE;
    
    const x = sr(i * 7 + 1) * W * 0.85 - 20;
    const y = sr(i * 13 + 2) * H * 1.4 - H * 0.2;
    
    return {
      id: product.id,
      product,
      x,
      y,
      rotation: (sr(i * 3 + 3) - 0.5) * 30,
      width,
      floatVariant: i % 3,
      delay: sr(i * 5 + 5) * 10,
      duration: sr(i * 17 + 6) * 6 + 10,
      z: 10 + i,
      dragging: false,
      quantity: 1,
    };
  });
}

// Sample product images for demo (in production, these come from product data)
const getProductImages = (product: Product): string[] => {
  // For demo, return multiple placeholder images
  // In production, this would be actual product images from your data
  return [
    product.image,
    product.image,
    product.image, // Duplicate for demo purposes
  ];
};

export default function MerchStore() {
  const [items, setItems] = useState<FloatingItem[]>(generateInitialItems);
  const [mounted, setMounted] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const drag = useRef<DragState | null>(null);
  const topZ = useRef(100);

  // Mark as mounted and adjust positions
  useEffect(() => {
    setMounted(true);
    const W = window.innerWidth;
    const H = window.innerHeight;
    setItems((prev) =>
      prev.map((item, i) => ({
        ...item,
        x: sr(i * 7 + 1) * W * 0.85 - 20,
        y: sr(i * 13 + 2) * H * 1.4 - H * 0.2,
      }))
    );
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    // Ignore clicks on buttons or interactive elements
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.tagName === "INPUT" ||
      target.closest("[data-no-drag]")
    ) {
      return;
    }

    e.preventDefault();
    topZ.current += 1;
    setItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (!item) return prev;
      drag.current = {
        id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startItemX: item.x,
        startItemY: item.y,
        promoted: false,
      };
      return prev.map((it) =>
        it.id === id ? { ...it, dragging: true, z: topZ.current } : it
      );
    });
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    // Ignore touches on buttons or interactive elements
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.tagName === "INPUT" ||
      target.closest("[data-no-drag]")
    ) {
      return;
    }

    e.preventDefault();
    const touch = e.touches[0];
    topZ.current += 1;
    setItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (!item) return prev;
      drag.current = {
        id,
        startMouseX: touch.clientX,
        startMouseY: touch.clientY,
        startItemX: item.x,
        startItemY: item.y,
        promoted: false,
      };
      return prev.map((it) =>
        it.id === id ? { ...it, dragging: true, z: topZ.current } : it
      );
    });
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag.current) return;
      const { id, startMouseX, startMouseY, startItemX, startItemY } = drag.current;
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;
      if (!drag.current.promoted && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        drag.current.promoted = true;
      }
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, x: startItemX + dx, y: startItemY + dy } : it
        )
      );
    };

    const onUp = () => {
      drag.current = null;
      setItems((prev) => prev.map((it) => ({ ...it, dragging: false })));
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!drag.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const { id, startMouseX, startMouseY, startItemX, startItemY } = drag.current;
      const dx = touch.clientX - startMouseX;
      const dy = touch.clientY - startMouseY;
      if (!drag.current.promoted && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        drag.current.promoted = true;
      }
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, x: startItemX + dx, y: startItemY + dy } : it
        )
      );
    };

    const onTouchEnd = () => {
      drag.current = null;
      setItems((prev) => prev.map((it) => ({ ...it, dragging: false })));
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, quantity: Math.max(1, Math.min(10, it.quantity + delta)) }
          : it
      )
    );
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setModalQuantity(1);
    setCurrentImageIndex(0);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const addToCartFromModal = () => {
    if (!selectedProduct) return;

    setCart((prev) => {
      const existing = prev.find((ci) => ci.product.id === selectedProduct.id);
      if (existing) {
        return prev.map((ci) =>
          ci.product.id === selectedProduct.id
            ? { ...ci, quantity: ci.quantity + modalQuantity }
            : ci
        );
      }
      return [...prev, { product: selectedProduct, quantity: modalQuantity }];
    });

    // Remove t-shirts from store immediately (only one of each)
    if (selectedProduct.type === "tshirt") {
      setItems((prev) => prev.filter((it) => it.id !== selectedProduct.id));
    }

    closeModal();
  };

  const addToCart = (item: FloatingItem) => {
    // Add to cart
    setCart((prev) => {
      const existing = prev.find((ci) => ci.product.id === item.product.id);
      if (existing) {
        return prev.map((ci) =>
          ci.product.id === item.product.id
            ? { ...ci, quantity: ci.quantity + item.quantity }
            : ci
        );
      }
      return [...prev, { product: item.product, quantity: item.quantity }];
    });

    // Remove t-shirts from store immediately (only one of each)
    if (item.product.type === "tshirt") {
      setItems((prev) => prev.filter((it) => it.id !== item.id));
    }
  };

  const removeFromCart = (productId: string) => {
    const removedItem = cart.find((ci) => ci.product.id === productId);
    
    setCart((prev) => prev.filter((ci) => ci.product.id !== productId));

    // Add t-shirts back to store when removed from cart
    if (removedItem && removedItem.product.type === "tshirt") {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const index = PRODUCTS.findIndex((p) => p.id === productId);
      
      setItems((prev) => {
        // Check if already in items (shouldn't happen but safety check)
        if (prev.some((it) => it.id === productId)) return prev;
        
        const newItem: FloatingItem = {
          id: productId,
          product: removedItem.product,
          x: sr(index * 7 + 1) * W * 0.85 - 20,
          y: sr(index * 13 + 2) * H * 1.4 - H * 0.2,
          rotation: (sr(index * 3 + 3) - 0.5) * 30,
          width: TSHIRT_SIZE,
          floatVariant: index % 3,
          delay: sr(index * 5 + 5) * 10,
          duration: sr(index * 17 + 6) * 6 + 10,
          z: topZ.current + 1,
          dragging: false,
          quantity: 1,
        };
        return [...prev, newItem];
      });
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!stripePromise || cart.length === 0) return;
    
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            price_data: {
              currency: "usd",
              product_data: {
                name: item.product.name,
                images: [item.product.image],
              },
              unit_amount: item.product.price,
            },
            quantity: item.quantity,
          })),
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!mounted) return null;

  const modalImages = selectedProduct ? getProductImages(selectedProduct) : [];
  const isBulkProduct = selectedProduct && (selectedProduct.type === "cd" || selectedProduct.type === "necklace");

  return (
    <>
      {/* Cart summary */}
      <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 max-w-xs">
        <h3 className="font-black text-lg lowercase mb-2 text-brand-pink">cart ({cart.length})</h3>
        {cart.length === 0 ? (
          <p className="text-sm text-gray-500 lowercase">drag items to browse • tap to view</p>
        ) : (
          <>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center text-sm">
                  <span className="truncate flex-1 lowercase">{item.product.name}</span>
                  <span className="font-bold mx-2">x{item.quantity}</span>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-red-500 hover:text-red-700 px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t pt-2">
              <p className="font-black text-lg">${(cartTotal / 100).toFixed(2)}</p>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full mt-2 bg-brand-pink text-white font-black py-2 rounded-full hover:bg-pink-600 transition-colors disabled:opacity-50 lowercase"
              >
                {isCheckingOut ? "processing..." : "checkout"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Floating products */}
      <div
        className="fixed inset-0 overflow-visible"
        style={{ zIndex: 10, pointerEvents: "none" }}
        aria-hidden="true"
      >
        {items.map((item) => {
          const isBulk = item.product.type === "cd" || item.product.type === "necklace";
          
          return (
            <div
              key={item.id}
              className="absolute select-none"
              style={{
                left: item.x,
                top: item.y,
                width: item.width,
                zIndex: item.z,
                transform: `rotate(${item.rotation}deg)`,
                cursor: item.dragging ? "grabbing" : "grab",
                transition: item.dragging
                  ? "none"
                  : "left 700ms cubic-bezier(0.22, 1, 0.36, 1), top 700ms cubic-bezier(0.22, 1, 0.36, 1)",
                pointerEvents: "auto",
                touchAction: "none",
              }}
              onMouseDown={(e) => onMouseDown(e, item.id)}
              onTouchStart={(e) => onTouchStart(e, item.id)}
            >
              <div
                className={item.product.frameColor === "pink" ? "pink-frame" : "lime-frame"}
                style={{
                  animationName: item.dragging ? "none" : `float-${item.floatVariant}`,
                  animationDuration: `${item.duration}s`,
                  animationDelay: `-${item.delay}s`,
                }}
              >
                {/* Product image - clickable to open modal */}
                <div
                  data-no-drag
                  className="bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors"
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                  }}
                  onClick={() => openProductModal(item.product)}
                >
                  {/* Placeholder for product image */}
                  <div className="text-center p-2">
                    <div className="text-4xl mb-1">
                      {item.product.type === "tshirt" && "👕"}
                      {item.product.type === "cd" && "💿"}
                      {item.product.type === "necklace" && "📿"}
                    </div>
                    <p className="text-xs font-bold lowercase leading-tight">{item.product.name}</p>
                    <p className="text-sm font-black mt-1">${(item.product.price / 100).toFixed(2)}</p>
                    {item.product.size && (
                      <p className="text-xs text-gray-500 lowercase">size: {item.product.size}</p>
                    )}
                  </div>
                </div>

                {/* Quick add button */}
                <button
                  onClick={() => addToCart(item)}
                  className="w-full bg-black text-white font-black py-2 text-sm lowercase hover:bg-gray-800 active:scale-95 transition-all"
                >
                  add to cart
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Gallery */}
            <div className="relative bg-gray-100 aspect-square">
              {/* Main Image */}
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-8xl">
                  {selectedProduct.type === "tshirt" && "👕"}
                  {selectedProduct.type === "cd" && "💿"}
                  {selectedProduct.type === "necklace" && "📿"}
                </div>
              </div>

              {/* Image Navigation */}
              {modalImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : modalImages.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev < modalImages.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                  >
                    →
                  </button>
                  {/* Image Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {modalImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentImageIndex ? "bg-brand-pink" : "bg-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors font-bold"
              >
                ×
              </button>
            </div>

            {/* Product Details */}
            <div className="p-6">
              <h2 className="text-2xl font-black lowercase mb-2">{selectedProduct.name}</h2>
              <p className="text-3xl font-black text-brand-pink mb-4">
                ${(selectedProduct.price / 100).toFixed(2)}
              </p>

              {selectedProduct.description && (
                <p className="text-gray-600 mb-4 lowercase">{selectedProduct.description}</p>
              )}

              {selectedProduct.size && (
                <div className="mb-4">
                  <span className="text-sm font-bold text-gray-500 lowercase">size: </span>
                  <span className="font-black">{selectedProduct.size}</span>
                </div>
              )}

              {/* Quantity Selector for bulk items */}
              {isBulkProduct && (
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-bold lowercase">quantity:</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold hover:bg-gray-300 active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <span className="font-black text-xl w-8 text-center">{modalQuantity}</span>
                    <button
                      onClick={() => setModalQuantity((q) => Math.min(10, q + 1))}
                      className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold hover:bg-gray-300 active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <button
                onClick={addToCartFromModal}
                className="w-full bg-brand-pink text-white font-black py-4 rounded-full text-lg lowercase hover:bg-pink-600 active:scale-95 transition-all"
              >
                add to cart • ${((selectedProduct.price * modalQuantity) / 100).toFixed(2)}
              </button>

              {/* Note for t-shirts */}
              {selectedProduct.type === "tshirt" && (
                <p className="text-center text-sm text-gray-500 mt-3 lowercase">
                  one of a kind • only 1 available
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
