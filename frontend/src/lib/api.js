// API base should point at wherever the `api/` folder is deployed, e.g.
// https://yourdomain.com/api  (see DEPLOYMENT.md).
//
// IMPORTANT: this file's paths are shaped to match the PHP backend
// (api/), which uses file-based endpoints (.php extensions, query
// params instead of path segments for IDs) rather than the pretty-URL
// shape the original Node backend (backend/) used. If you're running the
// Node backend instead, see backend/docs/API.md for the Node-shaped
// equivalents of every function below.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

// Thin fetch wrapper shared by every page. Keeping this in one place means
// swapping the backend host (or adding auth headers globally later) is a
// one-line change, not a find-and-replace across the app.
async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error || 'Something went wrong. Please try again.';
    throw new Error(message);
  }

  return data;
}

export const api = {
  // Beneficiaries
  registerBeneficiary: (payload) =>
    apiRequest('/beneficiaries/register.php', { method: 'POST', body: payload }),
  lookupBeneficiary: (payload) =>
    apiRequest('/beneficiaries/lookup.php', { method: 'POST', body: payload }),

  // Services & camps
  listServices: () => apiRequest('/services/list.php'),
  listUpcomingCamps: () => apiRequest('/camps/list.php'),

  // Appointments
  bookAppointment: (payload) =>
    apiRequest('/appointments/book.php', { method: 'POST', body: payload }),
  myAppointments: (beneficiaryId) =>
    apiRequest(`/appointments/mine.php?beneficiaryId=${beneficiaryId}`),

  // Donations
  createDonationOrder: (payload) =>
    apiRequest('/donations/create-order.php', { method: 'POST', body: payload }),
  verifyDonation: (payload) =>
    apiRequest('/donations/verify.php', { method: 'POST', body: payload }),

  // Get Involved / Contact
  submitPartnerRequest: (payload) =>
    apiRequest('/partner-requests/create.php', { method: 'POST', body: payload }),
  submitContactMessage: (payload) =>
    apiRequest('/contact-messages/create.php', { method: 'POST', body: payload }),

  // Admin
  adminLogin: (payload) => apiRequest('/admin/login.php', { method: 'POST', body: payload }),
  adminListBeneficiaries: (token) => apiRequest('/beneficiaries/list.php', { token }),
  adminListAppointments: (token, status) =>
    apiRequest(`/appointments/list.php${status ? `?status=${status}` : ''}`, { token }),
  adminListDonations: (token) => apiRequest('/donations/list.php', { token }),
  adminListPartnerRequests: (token) => apiRequest('/admin/partner-requests/list.php', { token }),
  adminListContactMessages: (token) => apiRequest('/admin/contact-messages/list.php', { token }),
  adminUpdateAppointmentStatus: (token, id, status) =>
    apiRequest(`/appointments/update-status.php?id=${id}`, { method: 'PATCH', body: { status }, token }),
  adminCreateCamp: (token, payload) =>
    apiRequest('/admin/camps/create.php', { method: 'POST', body: payload, token }),

  // Impact — live, auto-calculated
  getImpactStats: () => apiRequest('/impact/stats.php'),

  // Coupons
  adminListCoupons: (token, status) =>
    apiRequest(`/coupons/list.php${status ? `?status=${status}` : ''}`, { token }),
  adminGenerateCoupons: (token, payload) =>
    apiRequest('/coupons/generate.php', { method: 'POST', body: payload, token }),
  adminAssignCoupon: (token, id, beneficiaryId) =>
    apiRequest(`/coupons/assign.php?id=${id}`, { method: 'POST', body: { beneficiaryId }, token }),
  couponQrCodeUrl: (code) => `${API_BASE_URL}/coupons/qr.php?code=${encodeURIComponent(code)}`,

  // Clinics
  adminListClinics: (token) => apiRequest('/admin/clinics/list.php', { token }),
  adminCreateClinic: (token, payload) =>
    apiRequest('/admin/clinics/create.php', { method: 'POST', body: payload, token }),
  adminCreateClinicUser: (token, clinicId, payload) =>
    apiRequest(`/admin/clinics/create-user.php?clinicId=${clinicId}`, { method: 'POST', body: payload, token }),

  // Clinic portal — separate auth from admin
  clinicLogin: (payload) => apiRequest('/clinic/login.php', { method: 'POST', body: payload }),
  clinicValidateCoupon: (token, code) =>
    apiRequest('/clinic/coupons/validate.php', { method: 'POST', body: { code }, token }),
  clinicRedeemCoupon: (token, id) =>
    apiRequest(`/clinic/coupons/redeem.php?id=${id}`, { method: 'POST', token }),
  clinicRedemptionHistory: (token) => apiRequest('/clinic/coupons/history.php', { token }),

  // Camps admin + announcements
  adminListAllCamps: (token) => apiRequest('/admin/camps/list.php', { token }),
  adminAnnounceCamp: (token, campId) =>
    apiRequest(`/admin/camps/announce.php?id=${campId}`, { method: 'POST', token }),

  // Services admin
  adminListServices: (token) => apiRequest('/admin/services/list.php', { token }),
  adminCreateService: (token, payload) =>
    apiRequest('/admin/services/create.php', { method: 'POST', body: payload, token }),
  adminUpdateService: (token, id, payload) =>
    apiRequest(`/admin/services/update.php?id=${id}`, { method: 'PATCH', body: payload, token }),

  // Notifications log
  adminListNotifications: (token, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/admin/notifications/list.php${params ? `?${params}` : ''}`, { token });
  },

  // Org settings — powers Footer/About/Contact/Donate dynamically
  getOrgSettings: () => apiRequest('/org-settings.php'),
  adminUpdateOrgSettings: (token, payload) =>
    apiRequest('/admin/org-settings-update.php', { method: 'PUT', body: payload, token }),

  // API keys for external integrations
  adminListApiKeys: (token) => apiRequest('/admin/api-keys/list.php', { token }),
  adminCreateApiKey: (token, payload) =>
    apiRequest('/admin/api-keys/create.php', { method: 'POST', body: payload, token }),
  adminRevokeApiKey: (token, id) =>
    apiRequest(`/admin/api-keys/revoke.php?id=${id}`, { method: 'DELETE', token }),

  // Reports/exports — return blobs, not JSON, so callers handle the
  // response directly rather than going through apiRequest's JSON parsing.
  downloadReport: async (token, path) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Report download failed.');
    }
    return res.blob();
  },
};
