"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { PRODUCTS, Product } from "@/config/products";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function sr(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const getSizes = (width: number) => {
  const isMobile = width < 768;
  const unified = isMobile ? 180 : 280;
  return {
    TSHIRT_SIZE: unified,
    BULK_SIZE: unified,
    isMobile,
  };
};

type ShirtSize = "S" | "M" | "L" | "XL";

interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  selectedSize?: ShirtSize;
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
}

type DragState = {
  id: string;
  startX: number;
  startY: number;
  startItemX: number;
  startItemY: number;
};

type InventoryMap = Record<string, Record<ShirtSize, number>>;

function buildInitialInventory(): InventoryMap {
  const inventory: InventoryMap = {};
  for (const product of PRODUCTS) {
    if (product.type !== "tshirt" || !product.sizes) continue;
    const sizeMap = { S: 0, M: 0, L: 0, XL: 0 };
    for (const size of product.sizes) {
      sizeMap[size.label] = size.stock;
    }
    inventory[product.id] = sizeMap;
  }
  return inventory;
}

function generateInitialItems(windowWidth: number, windowHeight: number): FloatingItem[] {
  const { TSHIRT_SIZE, BULK_SIZE } = getSizes(windowWidth);
  return PRODUCTS.map((product, i) => {
    const isBulk = product.type === "cd" || product.type === "necklace";
    const cardWidth = isBulk ? BULK_SIZE : TSHIRT_SIZE;
    const approxCardHeight = cardWidth + 38; // image + title/price area + frame
    const safeTop = windowWidth < 768 ? 120 : 95;
    const safeBottom = windowWidth < 768 ? 16 : 24;
    const safeSide = windowWidth < 768 ? 8 : 18;
    const minX = safeSide;
    const maxX = Math.max(minX, windowWidth - cardWidth - safeSide);
    const minY = safeTop;
    const maxY = Math.max(minY, windowHeight - approxCardHeight - safeBottom);
    const x = minX + sr(i * 7 + 1) * (maxX - minX || 1);
    const y = minY + sr(i * 13 + 2) * (maxY - minY || 1);
    return {
      id: product.id,
      product,
      x,
      y,
      rotation: (sr(i * 3 + 3) - 0.5) * 16,
      width: cardWidth,
      floatVariant: i % 3,
      delay: sr(i * 5 + 5) * 10,
      duration: sr(i * 17 + 6) * 6 + 10,
      z: 10 + i,
      dragging: false,
    };
  });
}

export default function MerchStore() {
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const [items, setItems] = useState<FloatingItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [inventory, setInventory] = useState<InventoryMap>(buildInitialInventory);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<ShirtSize | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const drag = useRef<DragState | null>(null);
  const topZ = useRef(100);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    setWindowSize({ width, height });
    setItems(generateInitialItems(width, height));
    setMounted(true);

    const handleResize = () => {
      const nextWidth = window.innerWidth;
      const nextHeight = window.innerHeight;
      setWindowSize({ width: nextWidth, height: nextHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startDrag = useCallback((clientX: number, clientY: number, id: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;

    drag.current = {
      id,
      startX: clientX,
      startY: clientY,
      startItemX: item.x,
      startItemY: item.y,
    };

    topZ.current += 1;
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, dragging: true, z: topZ.current } : it))
    );
  }, [items]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!drag.current) return;
      const { id, startX, startY, startItemX, startItemY } = drag.current;
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, x: startItemX + (e.clientX - startX), y: startItemY + (e.clientY - startY) } : it
        )
      );
    };
    const onMouseUp = () => {
      if (!drag.current) return;
      drag.current = null;
      setItems((prev) => prev.map((it) => ({ ...it, dragging: false })));
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!drag.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const { id, startX, startY, startItemX, startItemY } = drag.current;
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, x: startItemX + (touch.clientX - startX), y: startItemY + (touch.clientY - startY) }
            : it
        )
      );
    };
    const onTouchEnd = () => {
      if (!drag.current) return;
      drag.current = null;
      setItems((prev) => prev.map((it) => ({ ...it, dragging: false })));
    };
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(null);
    setModalQuantity(1);
    setCurrentImageIndex(0);
  };

  const closeModal = () => setSelectedProduct(null);

  const addToCartFromModal = () => {
    if (!selectedProduct) return;

    const isShirt = selectedProduct.type === "tshirt";
    if (isShirt) {
      if (!selectedSize) return;
      const available = inventory[selectedProduct.id]?.[selectedSize] ?? 0;
      if (available < modalQuantity) return;
      setInventory((prev) => ({
        ...prev,
        [selectedProduct.id]: {
          ...prev[selectedProduct.id],
          [selectedSize]: prev[selectedProduct.id][selectedSize] - modalQuantity,
        },
      }));
    }

    const cartKey = `${selectedProduct.id}:${selectedSize ?? "NA"}`;
    setCart((prev) => {
      const existing = prev.find((item) => `${item.productId}:${item.selectedSize ?? "NA"}` === cartKey);
      if (!existing) {
        return [
          ...prev,
          {
            productId: selectedProduct.id,
            name: selectedProduct.name,
            image: selectedProduct.image,
            price: selectedProduct.price,
            quantity: modalQuantity,
            selectedSize: selectedSize ?? undefined,
          },
        ];
      }
      return prev.map((item) =>
        `${item.productId}:${item.selectedSize ?? "NA"}` === cartKey
          ? { ...item, quantity: item.quantity + modalQuantity }
          : item
      );
    });

    closeModal();
  };

  const removeFromCart = (targetKey: string) => {
    const removed = cart.find((item) => `${item.productId}:${item.selectedSize ?? "NA"}` === targetKey);
    if (removed && removed.selectedSize) {
      const size = removed.selectedSize as ShirtSize;
      setInventory((prev) => ({
        ...prev,
        [removed.productId]: {
          ...prev[removed.productId],
          [size]: (prev[removed.productId]?.[size] ?? 0) + removed.quantity,
        },
      }));
    }
    setCart((prev) => prev.filter((item) => `${item.productId}:${item.selectedSize ?? "NA"}` !== targetKey));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!stripePromise || cart.length === 0) return;
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedSize: item.selectedSize ?? null,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "Checkout failed");
      const stripe = await stripePromise;
      if (stripe) {
        await (stripe as any).redirectToCheckout({ sessionId: data.sessionId });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!mounted) return null;

  const { isMobile } = getSizes(windowSize.width);
  const modalImages = selectedProduct?.images?.length ? selectedProduct.images : selectedProduct ? [selectedProduct.image] : [];

  const selectedSizeStock =
    selectedProduct?.type === "tshirt" && selectedSize
      ? inventory[selectedProduct.id]?.[selectedSize] ?? 0
      : 999;
  const quantityMax = Math.max(1, Math.min(10, selectedSizeStock));

  return (
    <>
      <div
        className={`fixed z-50 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 ${
          isMobile ? "top-3 right-3 left-3 max-w-none" : "top-4 right-4 max-w-xs"
        }`}
      >
        <h3 className="font-black text-base lowercase mb-1 text-brand-pink">cart ({cart.length})</h3>
        {cart.length === 0 ? (
          <p className="text-xs text-gray-500 lowercase">drag handle • tap image to view</p>
        ) : (
          <>
            <div className={`space-y-1 overflow-y-auto mb-2 ${isMobile ? "max-h-24" : "max-h-48"}`}>
              {cart.map((item) => {
                const key = `${item.productId}:${item.selectedSize ?? "NA"}`;
                return (
                  <div key={key} className="flex justify-between items-center text-xs">
                    <span className="truncate flex-1 lowercase">
                      {item.name}{item.selectedSize ? ` (${item.selectedSize})` : ""}
                    </span>
                    <span className="font-bold">({item.quantity})</span>
                    <button
                      onClick={() => removeFromCart(key)}
                      className="text-red-500 hover:text-red-700 px-2 ml-1 text-base leading-none"
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="border-t pt-1">
              <p className="font-black text-base">£{(cartTotal / 100).toFixed(2)}</p>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full mt-1 bg-brand-pink text-white font-black py-1.5 rounded-full text-sm hover:bg-pink-600 transition-colors disabled:opacity-50 lowercase"
              >
                {isCheckingOut ? "processing..." : "checkout"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="fixed inset-0 overflow-visible" style={{ zIndex: 10, pointerEvents: "none" }} aria-hidden="true">
        {items.map((item) => (
          <div
            key={item.id}
            className="absolute select-none"
            style={{
              left: item.x,
              top: item.y,
              width: item.width,
              zIndex: item.z,
              transform: `rotate(${item.rotation}deg)`,
              cursor: item.dragging ? "grabbing" : "default",
              transition: item.dragging ? "none" : "left 450ms cubic-bezier(0.22,1,0.36,1), top 450ms cubic-bezier(0.22,1,0.36,1)",
              pointerEvents: "auto",
            }}
          >
            <div
              className={item.product.frameColor === "pink" ? "pink-frame" : "lime-frame"}
              style={{
                animationName: item.dragging ? "none" : `float-${item.floatVariant}`,
                animationDuration: `${item.duration}s`,
                animationDelay: `-${item.delay}s`,
              }}
            >
              <div
                data-drag-handle
                className="bg-black/80 text-white text-[10px] font-bold tracking-wide uppercase px-2 py-1 cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => startDrag(e.clientX, e.clientY, item.id)}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  startDrag(touch.clientX, touch.clientY, item.id);
                }}
              >
                drag
              </div>

              <button
                type="button"
                onClick={() => openProductModal(item.product)}
                className="w-full bg-gray-100 block"
                aria-label={`View ${item.product.name}`}
              >
                <img src={item.product.image} alt={item.product.name} className="w-full aspect-square object-cover" />
                <div className={`text-center ${isMobile ? "p-1" : "p-2"}`}>
                  <p className={`font-bold lowercase leading-tight ${isMobile ? "text-[10px]" : "text-xs"}`}>{item.product.name}</p>
                  <p className={`font-black mt-0.5 ${isMobile ? "text-xs" : "text-sm"}`}>£{(item.product.price / 100).toFixed(2)}</p>
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gray-100 aspect-square">
              {modalImages.length > 0 && (
                <img
                  src={modalImages[currentImageIndex]}
                  alt={`${selectedProduct.name} ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              )}

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
                </>
              )}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-black lowercase mb-1">{selectedProduct.name}</h2>
              <p className="text-2xl sm:text-3xl font-black text-brand-pink mb-3">£{(selectedProduct.price / 100).toFixed(2)}</p>

              {selectedProduct.description && (
                <p className="text-gray-600 mb-3 text-sm lowercase">{selectedProduct.description}</p>
              )}

              {selectedProduct.type === "tshirt" && selectedProduct.sizes && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-600 lowercase mb-2">select size</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedProduct.sizes.map((size) => {
                      const stock = inventory[selectedProduct.id]?.[size.label] ?? 0;
                      const disabled = stock <= 0;
                      const active = selectedSize === size.label;
                      return (
                        <button
                          key={size.label}
                          onClick={() => {
                            if (disabled) return;
                            setSelectedSize(size.label);
                            setModalQuantity(1);
                          }}
                          className={`px-3 py-1.5 rounded-full border text-sm font-bold ${
                            disabled
                              ? "opacity-40 cursor-not-allowed"
                              : active
                              ? "bg-black text-white border-black"
                              : "bg-white text-black border-black/30"
                          }`}
                        >
                          {size.label} ({stock})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mb-4">
                <span className="font-bold lowercase text-sm">quantity:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center font-bold hover:bg-gray-300 active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <span className="font-black text-lg w-6 text-center">{modalQuantity}</span>
                  <button
                    onClick={() => setModalQuantity((q) => Math.min(quantityMax, q + 1))}
                    className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center font-bold hover:bg-gray-300 active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={addToCartFromModal}
                disabled={selectedProduct.type === "tshirt" && !selectedSize}
                className="w-full bg-brand-pink text-white font-black py-3 sm:py-4 rounded-full text-base sm:text-lg lowercase hover:bg-pink-600 active:scale-95 transition-all disabled:opacity-50"
              >
                add to cart • £{((selectedProduct.price * modalQuantity) / 100).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
