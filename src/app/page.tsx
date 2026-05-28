import MerchStore from "./components/MerchStore";

export default function StorePage() {
  return (
    <>
      <MerchStore />

      <main className="relative min-h-screen flex flex-col items-center pb-16 bg-gradient-to-br from-[#FF69B4]/30 via-[#ADFF2F]/25 to-white">

        {/* Nav */}
        <nav className="w-full max-w-lg flex justify-between items-center px-6 pt-8 pb-2 z-40">
          <span className="text-brand-pink font-black text-xl tracking-tighter lowercase">
            there&amp;back
          </span>
          <span className="font-black text-black text-xl lowercase">merch</span>
        </nav>

        {/* Hero */}
        <section className="w-full max-w-lg px-6 pt-6 pb-4 z-40">
          <h1 className="hero-title">
            official<br />merchandise
          </h1>
        </section>

        {/* Instructions */}
        <section className="w-full max-w-lg px-6 z-40">
          <p className="label-bold text-left">
            drag to browse • tap items to view
          </p>
        </section>

      </main>
    </>
  );
}
