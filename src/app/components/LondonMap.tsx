"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { dropLocations, LONDON_CENTER } from "@/config/dropLocations";

// Logo palette (rainbow gradient): magenta → orange → yellow → lime.
const PALETTE = {
  magenta: "#FF0088",
  pink: "#FF2D78",
  orange: "#FF7A00",
  yellow: "#FFD400",
  lime: "#7FFF00",
};

// Free OpenFreeMap vector tiles — no API key, no usage limits.
const OPENFREEMAP_TILES = "https://tiles.openfreemap.org/planet";

// A minimal dark style: black background with the city geometry traced in the
// logo's neon colors, plus extruded 3D buildings coloured by height.
const neonStyle: StyleSpecification = {
  version: 8,
  sources: {
    openmaptiles: {
      type: "vector",
      url: OPENFREEMAP_TILES,
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#000000" },
    },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: { "fill-color": "#0a0410" },
    },
    {
      id: "roads-minor",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["!in", "class", "motorway", "trunk", "primary"],
      paint: {
        "line-color": PALETTE.magenta,
        "line-opacity": 0.18,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.3, 16, 1.5],
      },
    },
    {
      id: "roads-major",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", "class", "motorway", "trunk", "primary"],
      paint: {
        "line-color": PALETTE.orange,
        "line-opacity": 0.5,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.8, 16, 3.5],
      },
    },
    {
      id: "3d-buildings",
      type: "fill-extrusion",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 13,
      filter: ["!=", ["get", "hide_3d"], true],
      paint: {
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          ["get", "render_height"],
          0, PALETTE.magenta,
          25, PALETTE.pink,
          60, PALETTE.orange,
          120, PALETTE.yellow,
          200, PALETTE.lime,
        ],
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          13, 0,
          14, ["get", "render_height"],
        ],
        "fill-extrusion-base": ["get", "render_min_height"],
        "fill-extrusion-opacity": 0.85,
      },
    },
  ],
};

export default function LondonMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const indexRef = useRef<number>(-1);
  const touringRef = useRef<boolean>(false);

  // Advance to the next drop location each time the logo is clicked: fly the
  // camera there and pop open its label.
  const tourNextLocation = useCallback(() => {
    const map = mapRef.current;
    if (!map || dropLocations.length === 0) return;

    // Entering tour mode stops the idle auto-rotation.
    touringRef.current = true;

    indexRef.current = (indexRef.current + 1) % dropLocations.length;
    const loc = dropLocations[indexRef.current];

    // Close any open popups before moving.
    markersRef.current.forEach((m) => {
      const p = m.getPopup();
      if (p && p.isOpen()) m.togglePopup();
    });

    map.flyTo({
      center: [loc.lng, loc.lat],
      zoom: 15.5,
      pitch: 60,
      bearing: -20,
      duration: 2600,
      essential: true,
    });

    map.once("moveend", () => {
      const marker = markersRef.current[indexRef.current];
      const popup = marker?.getPopup();
      if (marker && popup && !popup.isOpen()) marker.togglePopup();
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: neonStyle,
      center: LONDON_CENTER,
      zoom: 13.5,
      pitch: 60,
      bearing: -20,
      antialias: true,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    // Gentle, continuous rotation for a living 3D feel while idle. Pauses while
    // the user interacts, and stops entirely once the location tour begins.
    let rotating = true;
    let rafId = 0;
    const spin = () => {
      if (rotating && !touringRef.current && mapRef.current) {
        mapRef.current.setBearing(mapRef.current.getBearing() + 0.02);
      }
      rafId = requestAnimationFrame(spin);
    };
    const pause = () => {
      rotating = false;
    };
    const resume = () => {
      if (!touringRef.current) rotating = true;
    };
    map.on("mousedown", pause);
    map.on("touchstart", pause);
    map.on("dragstart", pause);
    map.on("moveend", resume);

    map.on("load", () => {
      rafId = requestAnimationFrame(spin);

      // Drop-location pins, styled as glowing logo-coloured markers.
      markersRef.current = dropLocations.map((loc) => {
        const el = document.createElement("div");
        el.className = "drop-pin";
        if (!loc.revealed) el.classList.add("drop-pin--mystery");

        const popup = new maplibregl.Popup({
          offset: 18,
          closeButton: false,
          className: "drop-popup",
        }).setHTML(
          loc.revealed
            ? `<strong>${loc.name}</strong>${
                loc.hint ? `<span>${loc.hint}</span>` : ""
              }`
            : `<strong>secret drop</strong><span>location coming soon</span>`
        );

        return new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([loc.lng, loc.lat])
          .setPopup(popup)
          .addTo(map);
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {/* Twins logo, small, centered. Click to tour the drop locations.
          `mix-blend-screen` drops the logo's black background so it glows
          over the map instead of showing as a black square. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <button
          type="button"
          onClick={tourNextLocation}
          aria-label="Show next secret drop location"
          className="pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95"
        >
          <Image
            src="/twins-logo.png"
            alt="The Twins"
            width={96}
            height={96}
            priority
            className="w-24 h-auto select-none mix-blend-screen"
          />
        </button>
      </div>
    </>
  );
}
