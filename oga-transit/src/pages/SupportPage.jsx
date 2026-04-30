/**
 * pages/SupportPage.jsx — Customer Support Page
 * 
 * A simple support page with:
 *   - Contact options (phone, WhatsApp, email)
 *   - FAQ accordion
 *   - A message form
 */

import { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";

// List of frequently asked questions
const FAQS = [
  {
    question: "How do I change or cancel my booking?",
    answer: "You can modify or cancel your booking up to 3 hours before departure. Go to My Bookings, find your trip, and click 'Modify'. Full refunds are available for cancellations made 24+ hours before departure.",
  },
  {
    question: "What is the luggage allowance?",
    answer: "Each passenger is allowed one large bag (up to 20kg) stored under the bus, plus one small carry-on bag. Extra luggage can be added at booking for a small fee.",
  },
  {
    question: "Are there stops along the route?",
    answer: "Yes! Most routes have 1–2 rest stops lasting 15–20 minutes. Stop locations are shown in the app during your journey.",
  },
  {
    question: "Is Wi-Fi available on the bus?",
    answer: "Wi-Fi is available on all Executive Coach routes. Standard routes do not currently have Wi-Fi but this is being rolled out in 2026.",
  },
];

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-14">

      {/* Page header */}
      <div className="text-center mb-12">
        <p className="text-green-700 text-xs font-bold uppercase tracking-widest mb-2">
          We're here for you
        </p>
        <h1 className="font-black text-stone-900 text-4xl mb-3">
          24/7 Support
        </h1>
        <p className="text-stone-500 text-sm max-w-md mx-auto">
          Got a question or issue? Reach us any way you like — our team is always ready.
        </p>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <ContactCard icon="📞" label="Call Us"      value="0800-OGA-TRANSIT" sub="Toll free · 24/7" />
        <ContactCard icon="💬" label="WhatsApp"     value="+234 800 123 4567"  sub="Reply in minutes" />
        <ContactCard icon="✉️" label="Email"        value="help@ogatransit.ng" sub="Response within 2hrs" />
      </div>

      {/* Two column: FAQ + Message form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FAQSection />
        <MessageForm />
      </div>

    </div>
  );
}

// One contact method card
function ContactCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 text-center shadow-sm hover:border-green-300 transition-colors cursor-pointer">
      <div className="text-3xl mb-3">{icon}</div>
      <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="font-bold text-stone-900 text-sm mb-0.5">{value}</p>
      <p className="text-stone-400 text-xs">{sub}</p>
    </div>
  );
}

// Accordion FAQ section
function FAQSection() {
  // Track which FAQ is currently open (-1 = none)
  const [openIndex, setOpenIndex] = useState(-1);

  function toggle(index) {
    // If clicking the same one, close it; otherwise open the new one
    setOpenIndex((prev) => (prev === index ? -1 : index));
  }

  return (
    <div>
      <h2 className="font-bold text-stone-900 text-xl mb-4">Frequently Asked Questions</h2>
      <div className="space-y-2">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div key={index} className="bg-white border border-stone-200 rounded-xl overflow-hidden">

              {/* Question row — clicking toggles the answer */}
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-semibold text-stone-800 text-sm">{faq.question}</span>
                {/* Rotate the arrow when open */}
                <span className={`text-stone-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </button>

              {/* Answer — only shown when isOpen is true */}
              {isOpen && (
                <div className="px-4 pb-4">
                  <p className="text-stone-500 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}

// Contact message form
function MessageForm() {
  const [submitted, setSubmitted] = useState(false);
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-bold text-green-800 text-lg mb-2">Message Sent!</h3>
        <p className="text-green-700 text-sm">We'll get back to you within 2 hours.</p>
        <button onClick={() => setSubmitted(false)} className="mt-4 text-sm text-green-700 underline">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <Card title="Send us a Message" className="p-5">

      <div className="space-y-3">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
            Your Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chidi Okeke"
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>

        {/* Message textarea */}
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue or question..."
            rows={4}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:border-green-500 transition-colors resize-none"
          />
        </div>

        <Button fullWidth onClick={() => setSubmitted(true)}>
          Send Message
        </Button>
      </div>

    </Card>
  );
}
