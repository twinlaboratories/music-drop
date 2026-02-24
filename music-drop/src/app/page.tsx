import SignupForm from "./components/SignupForm";

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center min-h-screen">
      <nav className="w-full max-w-2xl flex justify-between p-6">
        <span className="text-brand-pink font-black text-xl tracking-tighter">there&back</span>
        <span className="font-bold text-gray-900">TheTwins</span>
      </nav>

      <section className="max-w-xl px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-black leading-[1.1] text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-brand-pink">
          big corporations put walls up where bridges should be built...
        </h1>
        <p className="mt-8 font-bold text-lg">pre-save to listen to holding on now:</p>
      </section>
      
      <section className="w-full max-w-md px-4 pb-20">
        <div className="bg-card-bg rounded-card p-8 shadow-2xl border border-white/5">
          <SignupForm />
        </div>
      </section>

    </main>
  );
}