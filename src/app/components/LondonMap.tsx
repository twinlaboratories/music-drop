"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LONDON_CENTER } from "@/config/dropLocations";

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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: neonStyle,
      center: LONDON_CENTER,
      zoom: 14.5,
      pitch: 60,
      bearing: -20,
      canvasContextAttributes: { antialias: true },
      attributionControl: false,
    });
    mapRef.current = map;

    // Gentle, continuous rotation for a living 3D feel while idle. Pauses while
    // the user interacts with the map, then resumes.
    let rotating = true;
    let rafId = 0;
    const spin = () => {
      if (rotating && mapRef.current) {
        mapRef.current.setBearing(mapRef.current.getBearing() + 0.02);
      }
      rafId = requestAnimationFrame(spin);
    };
    const pause = () => {
      rotating = false;
    };
    const resume = () => {
      rotating = true;
    };
    map.on("mousedown", pause);
    map.on("touchstart", pause);
    map.on("dragstart", pause);
    map.on("moveend", resume);

    map.on("load", () => {
      rafId = requestAnimationFrame(spin);
    });

    return () => {
      cancelAnimationFrame(rafId);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {/* Twins logo, small, centered. `mix-blend-screen` drops the logo's
          black background so it glows over the map. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Image
          src="/twins-logo.png"
          alt="The Twins"
          width={96}
          height={96}
          priority
          className="w-24 h-auto select-none mix-blend-screen"
        />
      </div>
    </>
  );
}
