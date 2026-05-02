/**
 * pages/SupportPage.jsx — Staff Support Page
 */

import { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";

const FAQS = [
  {
    question: "What time does booking open and close?",
    answer: "Bookings open at 12:00 AM and close at 4:00 PM daily. You can edit or cancel your booking before 2:00 PM. After 2:00 PM bookings are locked but new bookings are still allowed until 4:00 PM.",
  },
  {
    question: "Can I book more than one seat?",
    answer: "No. Each staff member is allowed one seat per day on the shuttle. This ensures fair access for all staff.",
  },
  {
    question: "How do I change my seat after booking?",
    answer: "Go to My Bookings, find today's booking, and click 'Change Seat'. You can change your seat as long as it is before 2:00 PM. After 2:00 PM seat changes are no longer allowed.",
  },
  {
    question: "What happens if I miss the shuttle?",
    answer: "The shuttle departs at the scheduled time. If you miss it, your booking will not be automatically cancelled. Contact the admin or support team for assistance.",
  },
  {
    question: "How do I cancel my booking?",
    answer: "Go to My Bookings and click 'Cancel Booking'. Cancellations are only allowed before 2:00 PM. If you need to cancel after this time, contact the admin directly.",
  },
  {
    question: "I can't log in to my account. What should I do?",
    answer: "Make sure you are using the correct email address and password. If you have forgotten your password, contact your admin to have it reset. Self-service password reset is not currently available.",
  },
  {
    question: "The seat I selected is showing as taken but I didn't book it. What do I do?",
    answer: "Seat availability updates in real time. Another staff member may have booked that seat at the same time. Please select a different available seat. If the issue persists contact support.",
  },
  {
    question: "Who do I contact if I have an issue with my booking?",
    answer: "You can reach the support team via phone, WhatsApp, or email using the contact details on this page. An admin can also resolve booking issues directly from the admin portal.",
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
          Support
        </h1>
        <p className="text-stone-500 text-sm max-w-md mx-auto">
          Got a question or issue with the shuttle booking? Reach us any way you like.
        </p>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <ContactCard icon="📞" label="Call Us"  value="0800-000-0000"       sub="Mon–Fri · 7AM–6PM" />
        <ContactCard icon="💬" label="WhatsApp" value="+234 800 000 0000"   sub="Reply in minutes" />
        <ContactCard icon="✉️" label="Email"    value="support@busportal.ng" sub="Response within 2hrs" />
      </div>

      {/* Two column: FAQ + Message form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FAQSection />
        <MessageForm />
      </div>

    </div>
  );
}

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

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(-1);

  function toggle(index) {
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
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-semibold text-stone-800 text-sm">{faq.question}</span>
                <span className={`text-stone-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </button>
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