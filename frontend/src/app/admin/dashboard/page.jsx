'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import CouponsPanel from './CouponsPanel';
import ClinicsPanel from './ClinicsPanel';
import CampsPanel from './CampsPanel';
import NotificationsPanel from './NotificationsPanel';
import SettingsPanel from './SettingsPanel';
import ReportsPanel from './ReportsPanel';
import ServicesPanel from './ServicesPanel';
import ImpactPanel from './ImpactPanel';

const tabs = [
  'Beneficiaries', 'Appointments', 'Donations', 'Coupons', 'Clinics',
  'Camps', 'Notifications', 'Reports', 'Settings', 'Services', 'Impact', 'Partner Requests', 'Contact Messages',
];
const selfManagedTabs = ['Coupons', 'Clinics', 'Camps', 'Notifications', 'Reports', 'Settings', 'Services', 'Impact'];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [adminName, setAdminName] = useState('');
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = sessionStorage.getItem('sunshine_admin_token');
    if (!t) {
      router.push('/admin');
      return;
    }
    setToken(t);
    setAdminName(sessionStorage.getItem('sunshine_admin_name') || '');
  }, [router]);

  useEffect(() => {
    if (!token) return;
    if (selfManagedTabs.includes(activeTab)) return; // self-managed panels
    setLoading(true);

    const loaders = {
      Beneficiaries: () => api.adminListBeneficiaries(token).then((r) => r.beneficiaries),
      Appointments: () => api.adminListAppointments(token).then((r) => r.appointments),
      Donations: () => api.adminListDonations(token).then((r) => r.donations),
      'Partner Requests': () => api.adminListPartnerRequests(token).then((r) => r.requests),
      'Contact Messages': () => api.adminListContactMessages(token).then((r) => r.messages),
    };

    loaders[activeTab]()
      .then((rows) => setData((prev) => ({ ...prev, [activeTab]: rows })))
      .catch(() => setData((prev) => ({ ...prev, [activeTab]: [] })))
      .finally(() => setLoading(false));
  }, [activeTab, token]);

  function logout() {
    sessionStorage.removeItem('sunshine_admin_token');
    router.push('/admin');
  }

  async function markStatus(id, status) {
    await api.adminUpdateAppointmentStatus(token, id, status);
    const { appointments } = await api.adminListAppointments(token);
    setData((prev) => ({ ...prev, Appointments: appointments }));
  }

  const rows = data[activeTab] || [];

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-navy">Admin Dashboard</h1>
          <p className="text-sm text-ink/60">Signed in as {adminName}</p>
        </div>
        <button onClick={logout} className="text-sm text-clay underline">Log out</button>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-navy/10 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              activeTab === tab ? 'bg-navy text-white' : 'text-navy border border-navy/20'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        {activeTab === 'Coupons' ? (
          <CouponsPanel token={token} />
        ) : activeTab === 'Clinics' ? (
          <ClinicsPanel token={token} />
        ) : activeTab === 'Camps' ? (
          <CampsPanel token={token} />
        ) : activeTab === 'Notifications' ? (
          <NotificationsPanel token={token} />
        ) : activeTab === 'Reports' ? (
          <ReportsPanel token={token} />
        ) : activeTab === 'Settings' ? (
          <SettingsPanel token={token} />
        ) : activeTab === 'Services' ? (
          <ServicesPanel token={token} />
        ) : activeTab === 'Impact' ? (
          <ImpactPanel token={token} />
        ) : loading ? (
          <p className="text-sm text-ink/60">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink/60">No records yet.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-navy/10 text-navy/70">
                {Object.keys(rows[0])
                  .filter((k) => typeof rows[0][k] !== 'object')
                  .slice(0, 6)
                  .map((key) => (
                    <th key={key} className="py-2 pr-4 font-body">{key}</th>
                  ))}
                {activeTab === 'Appointments' && <th className="py-2 pr-4">Update</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-navy/5">
                  {Object.keys(rows[0])
                    .filter((k) => typeof rows[0][k] !== 'object')
                    .slice(0, 6)
                    .map((key) => (
                      <td key={key} className="py-2 pr-4 text-ink/80">{String(row[key])}</td>
                    ))}
                  {activeTab === 'Appointments' && (
                    <td className="py-2 pr-4">
                      <select
                        defaultValue={row.status}
                        onChange={(e) => markStatus(row.id, e.target.value)}
                        className="rounded border border-navy/20 text-xs px-2 py-1"
                      >
                        {['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!selfManagedTabs.includes(activeTab) && (
        <p className="mt-8 text-xs text-ink/40">
          [ A future phase can replace this generic table view for the
          remaining sections, matching the panels above. ]
        </p>
      )}
    </div>
  );
}
