'use client';

import { useEffect, useRef } from 'react';

// Wraps Razorpay's hosted "Payment Button" product (configured in the
// Razorpay dashboard under Payment Button ID pl_TOtQ5FRPM8cz0W). Razorpay's
// script looks for its OWN <script> tag's parent <form> at execution time
// and renders the button as an iframe inside that exact form.
//
// This deliberately does NOT use next/script. Next's `afterInteractive`
// and `lazyOnload` strategies inject the <script> tag into <head>/<body>,
// not literally at the JSX position where <Script> is written — so
// Razorpay's script never finds a parent <form> and throws "Payment
// Button is not added. Add Button script inside 'form' tag." on every
// page load (this is exactly the bug reported in production). A plain
// useEffect + real DOM appendChild guarantees the script tag is an actual
// child of our own <form> ref, which is the one thing Razorpay's script
// depends on.
//
// This is deliberately separate from DonateForm (the detailed
// amount/purpose/PAN form on the /donate page, which drives the custom
// order-based Razorpay Checkout) — this component is the fast, no-friction
// "Donate Now" action reused in the header, hero/CTA strip, footer, and at
// the top of the donate page.
//
// `id` just needs to be unique-ish per placement (used for a data
// attribute, not required by Razorpay) — each instance gets its own form
// ref and its own script injection regardless.
export default function DonateButton({ id, className = '' }) {
  const formRef = useRef(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    // Guard against double-injection (React 18 StrictMode runs effects
    // twice in dev) — without this a second script tag would render a
    // second button inside the same form.
    if (form.dataset.rzpLoaded === 'true') return;
    form.dataset.rzpLoaded = 'true';

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
    script.async = true;
    script.setAttribute('data-payment_button_id', 'pl_TOtQ5FRPM8cz0W');
    form.appendChild(script);

    return () => {
      form.innerHTML = '';
      delete form.dataset.rzpLoaded;
    };
  }, []);

  return <form ref={formRef} className={className} data-donate-btn={id}></form>;
}
