/**
 * components/PaystackCheckout.jsx — Payment Checkout Modal
 *
 * ⚠️  TEMPLATE — Not yet connected to Paystack live API
 *
 * To go live, your senior dev needs to:
 *   1. npm install @paystack/inline-js
 *   2. Get a public key from dashboard.paystack.com
 *   3. Replace the TODO comment in handlePaystackPay() below
 *
 * This component handles three payment methods:
 *   - Card     → card number / expiry / CVV form
 *   - Transfer → shows Oga Transit bank account details
 *   - USSD     → shows the USSD shortcode to dial
 *
 * Props:
 *   - amount        : total in Naira (e.g. 9350)
 *   - email         : passenger email (for Paystack receipt)
 *   - passengerName : shown on the checkout header
 *   - bookingRef    : reference (e.g. OGA-2025-0012)
 *   - route         : { from, to } for display
 *   - onSuccess     : called when payment is complete → triggers booking confirm
 *   - onClose       : called when user closes the modal
 */

import { useState } from "react";

/* ─── Paystack public key placeholder ───────────────────────────
   Replace this with your real key from dashboard.paystack.com
   Format: pk_test_xxxxxxxxxxxxxxxxxxxx  (test)
           pk_live_xxxxxxxxxxxxxxxxxxxx  (production)
──────────────────────────────────────────────────────────────── */
const PAYSTACK_PUBLIC_KEY = "pk_test_YOUR_KEY_HERE"; // TODO: replace before going live

export default function PaystackCheckout({
  amount,
  email,
  passengerName,
  bookingRef,
  route,
  onSuccess,
  onClose,
}) {
  const [method,     setMethod]     = useState("card"); // "card" | "transfer" | "ussd"
  const [step,       setStep]       = useState("method"); // "method" | "pay" | "processing" | "done"
  const [cardNumber, setCardNumber] = useState("");
  const [expiry,     setExpiry]     = useState("");
  const [cvv,        setCvv]        = useState("");
  const [cardName,   setCardName]   = useState(passengerName || "");
  const [error,      setError]      = useState("");

  // Format card number with spaces every 4 digits
  function formatCard(val) {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }

  // Format expiry as MM/YY
  function formatExpiry(val) {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    if (clean.length >= 3) return clean.slice(0, 2) + "/" + clean.slice(2);
    return clean;
  }

  // ── Validate card form ──
  function validateCard() {
    const rawCard = cardNumber.replace(/\s/g, "");
    if (rawCard.length < 16)       return "Enter a valid 16-digit card number.";
    if (expiry.length < 5)         return "Enter a valid expiry date (MM/YY).";
    if (cvv.length < 3)            return "Enter a valid CVV.";
    if (!cardName.trim())          return "Enter the name on the card.";
    return null;
  }

  // ── Handle pay button ──
  async function handlePay() {
    setError("");

    if (method === "card") {
      const validationError = validateCard();
      if (validationError) { setError(validationError); return; }
    }

    setStep("processing");

    // ── TODO: Paystack Integration ──────────────────────────────
    // When going live, replace the setTimeout below with:
    //
    // import PaystackPop from "@paystack/inline-js";
    // const paystack = new PaystackPop();
    // paystack.newTransaction({
    //   key:       PAYSTACK_PUBLIC_KEY,
    //   email:     email,
    //   amount:    amount * 100, // Paystack uses kobo
    //   ref:       bookingRef,
    //   currency:  "NGN",
    //   channels:  method === "card"     ? ["card"]
    //            : method === "transfer" ? ["bank_transfer"]
    //            :                        ["ussd"],
    //   onSuccess: (transaction) => {
    //     setStep("done");
    //     onSuccess(transaction.reference);
    //   },
    //   onCancel: () => {
    //     setStep("pay");
    //     setError("Payment was cancelled.");
    //   },
    // });
    // ── End TODO ────────────────────────────────────────────────

    // TEMPLATE: simulate a 2s payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStep("done");
    setTimeout(() => onSuccess("TEMPLATE-REF-" + Date.now()), 800);
  }

  return (
    // Full-screen modal overlay
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* ── Modal Header ── */}
        <div className="bg-green-950 px-6 py-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400 text-xs font-bold uppercase tracking-widest">
                🔒 Secure Checkout
              </span>
              {/* Paystack badge */}
              <span className="bg-green-800 text-green-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                Powered by Paystack
              </span>
            </div>
            <p className="text-white font-black text-xl">
              ₦{amount?.toLocaleString()}
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              {route?.from} → {route?.to} · {bookingRef}
            </p>
          </div>
          {step !== "processing" && step !== "done" && (
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white text-2xl leading-none mt-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Steps ── */}

        {/* STEP 1 — Choose payment method */}
        {step === "method" && (
          <div className="p-6">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
              How would you like to pay?
            </p>
            <div className="flex flex-col gap-3 mb-6">
              {[
                { id: "card",     icon: "💳", label: "Debit / Credit Card",  sub: "Visa, Mastercard, Verve" },
                { id: "transfer", icon: "🏦", label: "Bank Transfer",         sub: "Instant bank transfer" },
                { id: "ussd",     icon: "📱", label: "USSD",                   sub: "Dial from any phone" },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setMethod(opt.id)}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all
                    ${method === opt.id
                      ? "border-green-600 bg-green-50"
                      : "border-stone-200 hover:border-green-300"
                    }
                  `}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${method === opt.id ? "text-green-800" : "text-stone-800"}`}>
                      {opt.label}
                    </p>
                    <p className="text-stone-400 text-xs">{opt.sub}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    method === opt.id ? "border-green-600 bg-green-600" : "border-stone-300"
                  }`}>
                    {method === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep("pay")}
              className="w-full bg-green-700 text-white font-black py-3.5 rounded-xl hover:bg-green-800 transition-colors"
            >
              Continue →
            </button>
          </div>
        )}

        {/* STEP 2a — Card payment form */}
        {step === "pay" && method === "card" && (
          <div className="p-6">
            <button
              onClick={() => { setStep("method"); setError(""); }}
              className="text-green-700 text-sm font-semibold mb-4 flex items-center gap-1 hover:text-green-600"
            >
              ← Change method
            </button>

            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4">
              Enter Card Details
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg px-3 py-2 mb-4">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Card number */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCard(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-green-500 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                    {cardNumber.startsWith("4") ? "💳" :
                     cardNumber.startsWith("5") ? "💳" : "💳"}
                  </span>
                </div>
              </div>

              {/* Name on card */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Name on Card
                </label>
                <input
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  placeholder="As it appears on the card"
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Expiry + CVV side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                    Expiry Date
                  </label>
                  <input
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                    CVV
                  </label>
                  <input
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                    type="password"
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Security note */}
            <p className="text-xs text-stone-400 mt-4 flex items-center gap-1.5">
              🔒 Your card details are encrypted and secure
            </p>

            <button
              onClick={handlePay}
              className="w-full bg-green-700 text-white font-black py-3.5 rounded-xl hover:bg-green-800 transition-colors mt-5"
            >
              Pay ₦{amount?.toLocaleString()} →
            </button>
          </div>
        )}

        {/* STEP 2b — Bank Transfer */}
        {step === "pay" && method === "transfer" && (
          <div className="p-6">
            <button
              onClick={() => setStep("method")}
              className="text-green-700 text-sm font-semibold mb-4 flex items-center gap-1 hover:text-green-600"
            >
              ← Change method
            </button>

            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4">
              Transfer to this Account
            </p>

            {/* Bank account details */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-5">
              <div className="space-y-3">
                <BankDetailRow label="Bank Name"      value="Guaranty Trust Bank (GTB)" />
                <BankDetailRow label="Account Number" value="0123456789" copyable />
                <BankDetailRow label="Account Name"   value="Oga Transit Systems Ltd" />
                <BankDetailRow label="Amount"         value={`₦${amount?.toLocaleString()}`} highlight />
                <BankDetailRow label="Reference"      value={bookingRef} copyable />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <p className="text-amber-700 text-xs font-semibold">
                ⚠️ Important: Use <strong>{bookingRef}</strong> as your transfer narration so we can confirm your payment automatically.
              </p>
            </div>

            <button
              onClick={handlePay}
              className="w-full bg-green-700 text-white font-black py-3.5 rounded-xl hover:bg-green-800 transition-colors"
            >
              I've Made the Transfer ✓
            </button>
          </div>
        )}

        {/* STEP 2c — USSD */}
        {step === "pay" && method === "ussd" && (
          <div className="p-6">
            <button
              onClick={() => setStep("method")}
              className="text-green-700 text-sm font-semibold mb-4 flex items-center gap-1 hover:text-green-600"
            >
              ← Change method
            </button>

            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4">
              Dial this USSD Code
            </p>

            {/* Bank selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Select Your Bank
              </label>
              <USSDCodes amount={amount} bookingRef={bookingRef} />
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 mb-5">
              <p className="text-stone-500 text-xs">
                💡 Dial the code above from the phone number linked to your bank account. The payment will reflect within seconds.
              </p>
            </div>

            <button
              onClick={handlePay}
              className="w-full bg-green-700 text-white font-black py-3.5 rounded-xl hover:bg-green-800 transition-colors"
            >
              I've Completed the Payment ✓
            </button>
          </div>
        )}

        {/* STEP 3 — Processing */}
        {step === "processing" && (
          <div className="p-10 text-center">
            <div className="text-5xl mb-4 animate-spin">⚙️</div>
            <p className="font-bold text-stone-800 text-lg mb-1">Processing Payment...</p>
            <p className="text-stone-400 text-sm">Please wait, do not close this window.</p>
          </div>
        )}

        {/* STEP 4 — Success */}
        {step === "done" && (
          <div className="p-10 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="font-black text-stone-900 text-xl mb-1">Payment Successful!</p>
            <p className="text-stone-400 text-sm">Your booking is being confirmed...</p>
          </div>
        )}

      </div>
    </div>
  );
}


/* ── Bank transfer detail row ── */
function BankDetailRow({ label, value, copyable, highlight }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-stone-500 text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-bold text-sm ${highlight ? "text-green-700 text-base" : "text-stone-800"}`}>
          {value}
        </span>
        {copyable && (
          <button
            onClick={copy}
            className="text-xs text-green-700 border border-green-300 px-2 py-0.5 rounded-lg hover:bg-green-50 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}


/* ── USSD codes per bank ── */
function USSDCodes({ amount, bookingRef }) {
  const [selectedBank, setSelectedBank] = useState("gtb");

  const banks = [
    { id: "gtb",      name: "GTBank",    code: `*737*2*${amount}*085#` },
    { id: "access",   name: "Access",    code: `*901*000*${amount}#` },
    { id: "zenith",   name: "Zenith",    code: `*966*${amount}*085*${bookingRef}#` },
    { id: "uba",      name: "UBA",       code: `*919*3*085*${amount}#` },
    { id: "firstbank",name: "FirstBank", code: `*894*${amount}*085#` },
  ];

  const selected = banks.find(b => b.id === selectedBank);

  return (
    <div>
      {/* Bank selector pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {banks.map(bank => (
          <button
            key={bank.id}
            onClick={() => setSelectedBank(bank.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              selectedBank === bank.id
                ? "bg-green-700 text-white border-green-700"
                : "border-stone-200 text-stone-600 hover:border-green-400"
            }`}
          >
            {bank.name}
          </button>
        ))}
      </div>

      {/* USSD code display */}
      {selected && (
        <div className="bg-green-950 rounded-xl p-4 text-center">
          <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2">
            Dial this code
          </p>
          <p className="text-white font-black text-2xl tracking-wider mb-3">
            {selected.code}
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(selected.code)}
            className="text-xs text-green-400 border border-green-700 px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors"
          >
            Copy Code
          </button>
        </div>
      )}
    </div>
  );
}
