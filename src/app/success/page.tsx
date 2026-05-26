export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FF69B4]/30 via-[#ADFF2F]/25 to-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="hero-title mb-4">thank you!</h1>
        <p className="text-gray-600 mb-6 lowercase">
          your order has been placed. you&apos;ll receive a confirmation email shortly.
        </p>
        <a
          href="/"
          className="inline-block bg-brand-pink text-white font-black py-3 px-8 rounded-full hover:bg-pink-600 transition-colors lowercase"
        >
          back to store
        </a>
      </div>
    </main>
  );
}
