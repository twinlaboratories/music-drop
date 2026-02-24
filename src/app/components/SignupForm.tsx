"use client"; 
import { useState } from "react";

export default function SignupForm() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    console.log("Sending to API:", email);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-gray-400 text-xs font-bold uppercase tracking-widest">Email Address</label>
        <input 
          type="email" 
          placeholder="your@email.com"
          className="bg-black/50 border border-white/10 p-4 rounded-xl text-white focus:border-brand-pink outline-none transition-all"
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button className="bg-white text-black font-black py-4 rounded-full hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer">
        SIGN UP FOR RELEASE 
      </button>
    </form>
  );
}