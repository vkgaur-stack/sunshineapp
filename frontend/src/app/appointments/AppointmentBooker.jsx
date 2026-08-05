'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

const timeSlots = ['9:00 AM – 10:00 AM', '10:00 AM – 11:00 AM', '11:00 AM – 12:00 PM', '2:00 PM – 3:00 PM', '3:00 PM – 4:00 PM'];

export default function AppointmentBooker() {
  const [step, setStep] = useState('lookup'); // lookup | book | success
  const [lookupForm, setLookupForm] = useState({ mobileNumber: '', dateOfBirth: '' });
  const [beneficiary, setBeneficiary] = useState(null);
  const [services, setServices] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    serviceId: '',
    preferredDate: '',
    timeSlot: '',
    notes: '',
  });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.listServices().then(({ services }) => setServices(services || [])).catch(() => {});
  }, []);

  async function handleLookup(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      const { beneficiary } = await api.lookupBeneficiary(lookupForm);
      setBeneficiary(beneficiary);
      setStep('book');
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  async function handleBook(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      await api.bookAppointment({ ...bookingForm, beneficiaryId: beneficiary.id });
      setStep('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    } finally {
      setStatus('idle');
    }
  }

  if (step === 'success') {
    return (
      <div className="rounded-soft bg-teal-tint border border-teal/20 p-6 max-w-xl">
        <p className="font-display text-lg text-teal">Appointment requested.</p>
        <p className="mt-2 text-sm text-ink/80">
          Our team will confirm your slot via {beneficiary.preferredContact?.toLowerCase() || 'WhatsApp'}.
        </p>
      </div>
    );
  }

  if (step === 'lookup') {
    return (
      <div className="max-w-xl">
        <div className="rounded-soft bg-sun/10 border border-sun-soft p-4 mb-6 text-sm text-navy">
          Only registered beneficiaries can book an appointment.{' '}
          <Link href="/register" className="text-clay underline">Not registered yet? Register here.</Link>
        </div>
        <form onSubmit={handleLookup} className="grid gap-4">
          <div>
            <label className="block text-sm text-navy mb-1" htmlFor="mobileNumber">
              Registered Mobile Number
            </label>
            <input id="mobileNumber" required inputMode="numeric"
              value={lookupForm.mobileNumber}
              onChange={(e) => setLookupForm((p) => ({ ...p, mobileNumber: e.target.value }))}
              className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm text-navy mb-1" htmlFor="dateOfBirth">
              Date of Birth
            </label>
            <input id="dateOfBirth" type="date" required
              value={lookupForm.dateOfBirth}
              onChange={(e) => setLookupForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
              className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
          </div>
          {status === 'error' && <p className="text-clay-dark text-sm" role="alert">{errorMsg}</p>}
          <button type="submit" disabled={status === 'submitting'}
            className="justify-self-start px-6 py-3 rounded-full bg-navy text-white font-body hover:bg-navy-light transition-colors disabled:opacity-60">
            {status === 'submitting' ? 'Checking…' : 'Continue'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <p className="text-sm text-teal mb-4">Welcome, {beneficiary.fullName}.</p>
      <form onSubmit={handleBook} className="grid gap-4">
        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="serviceId">Select Service</label>
          <select id="serviceId" required value={bookingForm.serviceId}
            onChange={(e) => setBookingForm((p) => ({ ...p, serviceId: e.target.value }))}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5">
            <option value="">Choose a service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="preferredDate">Preferred Date</label>
          <input id="preferredDate" type="date" required
            value={bookingForm.preferredDate}
            onChange={(e) => setBookingForm((p) => ({ ...p, preferredDate: e.target.value }))}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
        </div>
        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="timeSlot">Time Slot</label>
          <select id="timeSlot" required value={bookingForm.timeSlot}
            onChange={(e) => setBookingForm((p) => ({ ...p, timeSlot: e.target.value }))}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5">
            <option value="">Choose a slot</option>
            {timeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
          </select>
          <p className="mt-1 text-xs text-ink/50">
            [ Phase 2: slots will reflect real admin-managed availability ]
          </p>
        </div>
        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="notes">Notes (optional)</label>
          <textarea id="notes" rows={3} value={bookingForm.notes}
            onChange={(e) => setBookingForm((p) => ({ ...p, notes: e.target.value }))}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
        </div>
        {status === 'error' && <p className="text-clay-dark text-sm" role="alert">{errorMsg}</p>}
        <button type="submit" disabled={status === 'submitting'}
          className="justify-self-start px-6 py-3 rounded-full bg-clay text-white font-body hover:bg-clay-dark transition-colors disabled:opacity-60">
          {status === 'submitting' ? 'Booking…' : 'Confirm Appointment'}
        </button>
      </form>
    </div>
  );
}
