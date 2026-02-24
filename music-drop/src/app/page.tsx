import FloatingImages from "./components/FloatingImages";

export default function LandingPage() {
  return (
    <>
      <FloatingImages />

      <main className="relative min-h-screen bg-white flex flex-col items-center pb-16">

        {/* Nav */}
        <nav className="w-full max-w-lg flex justify-between items-center px-6 pt-8 pb-2">
          <span className="text-brand-pink font-black text-xl tracking-tighter lowercase">
            there&amp;back
          </span>
          <span className="font-black text-black text-xl lowercase">thetwins</span>
        </nav>

        {/* Hero */}
        <section className="w-full max-w-lg px-6 pt-6 pb-8">
          <h1 className="hero-title">
            pre-save to unlock<br />holding on
          </h1>
        </section>

        {/* CoBrand Pre-Save Embed */}
        <section className="w-full max-w-lg px-4 mb-8">
          <iframe
            src="https://drop.cobrand.com/d/TheTwins/newmusic"
            className="w-full rounded-card border-0"
            style={{ minHeight: "520px" }}
            title="Pre-Save — holding on by TheTwins"
            scrolling="no"
            frameBorder="0"
          />
        </section>

        {/* Message */}
        <section className="w-full max-w-lg px-6">
          <p className="label-bold">
            big corporations put walls up where bridges should be built
            .........................
            ....we are going to get this song to you, to bring us together.
          </p>
        </section>

      </main>
    </>
  );
}
