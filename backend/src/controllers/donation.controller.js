const crypto = require('crypto');
const Razorpay = require('razorpay');
const prisma = require('../config/prisma');
const { generateReceiptNumber } = require('../utils/receiptNumber');
const { sendReceiptEmail } = require('../utils/mailer');
const { notify } = require('../notifications');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/donations/create-order
// Step 1: create a Donor record (or reuse) + a Razorpay order.
// The frontend uses the returned order to open Razorpay Checkout.
async function createDonationOrder(req, res, next) {
  try {
    const { fullName, mobileNumber, email, panNumber, amountInRupees, purpose } = req.body;

    if (!amountInRupees || amountInRupees < 1) {
      return res.status(400).json({ error: 'Enter a valid donation amount.' });
    }

    const donor = await prisma.donor.create({
      data: { fullName, mobileNumber, email, panNumber },
    });

    const amountInPaise = Math.round(amountInRupees * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `donation_${donor.id}`,
      notes: { donorId: donor.id, purpose: purpose || 'General Fund' },
    });

    const donation = await prisma.donation.create({
      data: {
        donorId: donor.id,
        amountInPaise,
        purpose: purpose || 'General Fund',
        razorpayOrderId: order.id,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      donationId: donation.id,
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/donations/verify
// Step 2: frontend calls this after Razorpay Checkout succeeds. We verify
// the signature server-side — never trust the client-side "success" alone.
async function verifyDonation(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await prisma.donation.updateMany({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: 'FAILED' },
      });
      return res.status(400).json({ error: 'Payment verification failed.' });
    }

    const donation = await prisma.donation.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      include: { donor: true },
    });

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found for this order.' });
    }

    const receiptNumber = await generateReceiptNumber();

    const updated = await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: 'SUCCESS',
        razorpayPaymentId: razorpay_payment_id,
        receiptNumber,
      },
    });

    // Best-effort: a failed email should never block payment confirmation
    // to the user. Log and continue rather than throwing.
    if (donation.donor.email) {
      try {
        await sendReceiptEmail({
          toEmail: donation.donor.email,
          toName: donation.donor.fullName,
          receiptNumber,
          amountInRupees: donation.amountInPaise / 100,
          purpose: donation.purpose,
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        });
        await prisma.donation.update({
          where: { id: donation.id },
          data: { receiptSentAt: new Date() },
        });
      } catch (mailErr) {
        console.error('Receipt email failed to send:', mailErr.message);
      }
    }

    // WhatsApp/SMS thank-you — separate from the email receipt, reaches
    // the donor even if they mistyped their email or prefer WhatsApp.
    if (donation.donor.mobileNumber) {
      notify({
        channel: 'WHATSAPP',
        to: donation.donor.mobileNumber,
        templateType: 'DONATION_THANK_YOU',
        variables: {
          fullName: donation.donor.fullName,
          amountInRupees: donation.amountInPaise / 100,
          receiptNumber,
        },
        relatedType: 'Donation',
        relatedId: donation.id,
      }).catch((err) => console.error('Donation thank-you notification failed:', err.message));
    }

    res.json({ success: true, receiptNumber, donation: updated });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/donations  (protected)
async function listDonations(req, res, next) {
  try {
    const donations = await prisma.donation.findMany({
      include: { donor: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ donations, count: donations.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { createDonationOrder, verifyDonation, listDonations };
