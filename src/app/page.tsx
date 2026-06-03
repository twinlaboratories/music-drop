import LondonMap from "./components/LondonMap";

// The sale is currently closed. The full store is preserved in
// src/app/_store/StorePage.tsx — to re-open a future sale, replace the
// closed-sale screen below with:
//
//   import StorePage from "./_store/StorePage";
//   export default StorePage;
//
// The background is a 3D map of London where secret merch drop locations are
// pinned. Tapping the centered twins logo tours through them. Edit the list in
// src/config/dropLocations.ts.
export default function Page() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <LondonMap />
    </main>
  );
}
