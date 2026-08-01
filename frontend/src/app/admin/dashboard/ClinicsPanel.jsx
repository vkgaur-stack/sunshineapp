'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function ClinicsPanel({ token }) {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clinicForm, setClinicForm] = useState({ name: '', city: '', address: '', contactPerson: '', mobileNumber: '', email: '' });
  const [clinicStatus, setClinicStatus] = useState('idle');
  const [userForClinic, setUserForClinic] = useState(null);
  const [userForm, setUserForm] = useState({ fullName: '', email: '', password: '' });
  const [userStatus, setUserStatus] = useState('idle');
  const [userStatusMsg, setUserStatusMsg] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const { clinics } = await api.adminListClinics(token);
      setClinics(clinics);
    } catch {
      setClinics([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateClinic(e) {
    e.preventDefault();
    setClinicStatus('submitting');
    try {
      await api.adminCreateClinic(token, clinicForm);
      setClinicStatus('idle');
      setClinicForm({ name: '', city: '', address: '', contactPerson: '', mobileNumber: '', email: '' });
      refresh();
    } catch (err) {
      setClinicStatus('error');
      alert(err.message);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setUserStatus('submitting');
    setUserStatusMsg('');
    try {
      await api.adminCreateClinicUser(token, userForClinic, userForm);
      setUserStatus('success');
      setUserStatusMsg('Login created. Share these credentials with the clinic securely.');
      setUserForm({ fullName: '', email: '', password: '' });
    } catch (err) {
      setUserStatus('error');
      setUserStatusMsg(err.message);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <h2 className="font-display text-lg text-navy mb-3">Add Partner Clinic</h2>
        <form onSubmit={handleCreateClinic} className="grid gap-3 bg-white border border-navy/10 rounded-soft p-4">
          <input required placeholder="Clinic name" value={clinicForm.name}
            onChange={(e) => setClinicForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          <input required placeholder="City" value={clinicForm.city}
            onChange={(e) => setClinicForm((p) => ({ ...p, city: e.target.value }))}
            className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          <input placeholder="Address" value={clinicForm.address}
            onChange={(e) => setClinicForm((p) => ({ ...p, address: e.target.value }))}
            className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          <input placeholder="Contact person" value={clinicForm.contactPerson}
            onChange={(e) => setClinicForm((p) => ({ ...p, contactPerson: e.target.value }))}
            className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          <input placeholder="Mobile number" value={clinicForm.mobileNumber}
            onChange={(e) => setClinicForm((p) => ({ ...p, mobileNumber: e.target.value }))}
            className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          <input type="email" placeholder="Email" value={clinicForm.email}
            onChange={(e) => setClinicForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          <button type="submit" disabled={clinicStatus === 'submitting'}
            className="px-4 py-2 rounded-full bg-navy text-white text-sm hover:bg-navy-light transition-colors disabled:opacity-60">
            {clinicStatus === 'submitting' ? 'Adding…' : 'Add Clinic'}
          </button>
        </form>

        {userForClinic && (
          <div className="mt-6 bg-teal-tint border border-teal/20 rounded-soft p-4">
            <h3 className="font-display text-sm text-navy mb-2">Create Clinic Portal Login</h3>
            <form onSubmit={handleCreateUser} className="grid gap-2">
              <input required placeholder="Staff full name" value={userForm.fullName}
                onChange={(e) => setUserForm((p) => ({ ...p, fullName: e.target.value }))}
                className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
              <input required type="email" placeholder="Login email" value={userForm.email}
                onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
              <input required type="text" placeholder="Temporary password" value={userForm.password}
                onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
              {userStatusMsg && (
                <p className={`text-xs ${userStatus === 'error' ? 'text-clay-dark' : 'text-teal'}`}>{userStatusMsg}</p>
              )}
              <div className="flex gap-2">
                <button type="submit" disabled={userStatus === 'submitting'}
                  className="px-4 py-2 rounded-full bg-clay text-white text-xs hover:bg-clay-dark transition-colors disabled:opacity-60">
                  Create Login
                </button>
                <button type="button" onClick={() => setUserForClinic(null)} className="text-xs text-ink/60 underline">
                  Close
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <h2 className="font-display text-lg text-navy mb-3">Partner Clinic Network</h2>
        {loading ? (
          <p className="text-sm text-ink/60">Loading…</p>
        ) : clinics.length === 0 ? (
          <p className="text-sm text-ink/60">No clinics added yet.</p>
        ) : (
          <div className="grid gap-3">
            {clinics.map((clinic) => (
              <div key={clinic.id} className="bg-white border border-navy/10 rounded-soft p-4 flex items-center justify-between">
                <div>
                  <p className="font-display text-navy">{clinic.name}</p>
                  <p className="text-xs text-ink/60">{clinic.city}{clinic.contactPerson ? ` · ${clinic.contactPerson}` : ''}</p>
                </div>
                <button
                  onClick={() => setUserForClinic(clinic.id)}
                  className="text-xs text-clay underline"
                >
                  + Portal Login
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
