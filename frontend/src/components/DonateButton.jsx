'use client';

import Script from 'next/script';

// Wraps Razorpay's hosted "Payment Button" product (configured in the
// Razorpay dashboard under Payment Button ID pl_TOtQ5FRPM8cz0W). Razorpay's
// script renders the actual button as an iframe inside whatever <form> it
// sits in — no backend call, no order creation, nothing else on our side.
//
// This is deliberately separate from DonateForm (the detailed
// amount/purpose/PAN form on the /donate page, which drives the custom
// order-based Razorpay Checkout) — this component is the fast, no-friction
// "Donate Now" action reused in the header, hero/CTA strip, footer, and at
// the top of the donate page.
//
// `id` must be unique per render location: Next.js's <Script> dedupes
// script tags by id, and Razorpay's script attaches to whichever <form> it
// physically sits inside, so each placement needs its own script instance
// or only the first one on the page would actually get a button.
export default function DonateButton({ id, className = '' }) {
  return (
    <form className={className}>
      <Script
        id={`razorpay-donate-btn-${id}`}
        src="https://checkout.razorpay.com/v1/payment-button.js"
        data-payment_button_id="pl_TOtQ5FRPM8cz0W"
        strategy="lazyOnload"
      />
    </form>
  );
}
