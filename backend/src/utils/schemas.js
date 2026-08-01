const { z } = require('zod');

const beneficiaryRegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  dateOfBirth: z.string().min(4, 'Date of birth is required'),
  gender: z.string().min(1),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().email().optional().or(z.literal('')),
  addressLine: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  serviceInterest: z.string().optional(),
  problemNotes: z.string().max(1000).optional(),
  preferredContact: z.enum(['PHONE', 'WHATSAPP', 'EMAIL']).default('WHATSAPP'),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'Consent is required to register' }),
  }),
});

const beneficiaryLookupSchema = z.object({
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  dateOfBirth: z.string().min(4),
});

const appointmentBookSchema = z.object({
  beneficiaryId: z.string().uuid(),
  serviceId: z.string().uuid(),
  campId: z.string().uuid().optional().or(z.literal('')),
  preferredDate: z.string().min(4),
  timeSlot: z.string().min(1, 'Please select a time slot'),
  notes: z.string().max(500).optional(),
});

const donationOrderSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().email().optional().or(z.literal('')),
  panNumber: z.string().optional(),
  amountInRupees: z.number().positive(),
  purpose: z.string().optional(),
});

const partnerRequestSchema = z.object({
  category: z.enum([
    'CSR_PARTNER',
    'MEDICAL_PARTNER',
    'VOLUNTEER',
    'DONOR',
    'COMMUNITY_PARTNER',
  ]),
  orgOrName: z.string().min(2),
  contactName: z.string().min(2),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().email().optional().or(z.literal('')),
  message: z.string().max(1000).optional(),
});

const contactMessageSchema = z.object({
  fullName: z.string().min(2),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().email().optional().or(z.literal('')),
  subject: z.string().optional(),
  message: z.string().min(5, 'Please enter a message'),
});

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const couponGenerateSchema = z.object({
  donationId: z.string().uuid().optional().or(z.literal('')),
  serviceId: z.string().uuid(),
  quantity: z.number().int().min(1).max(500),
  subsidyPercent: z.number().int().min(1).max(100).optional(),
  valueInPaise: z.number().int().positive().optional(),
  expiresAt: z.string().optional(),
});

const couponAssignSchema = z.object({
  beneficiaryId: z.string().uuid(),
});

const clinicCreateSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  mobileNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

const clinicUserCreateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const clinicLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const couponCodeSchema = z.object({
  code: z.string().min(4),
});

const orgSettingsUpdateSchema = z.object({
  organizationName: z.string().min(2).optional(),
  registrationNumber: z.string().optional(),
  ngoDarpanId: z.string().optional(),
  panNumber: z.string().optional(),
  tanNumber: z.string().optional(),
  eightyGNumber: z.string().optional(),
  registeredAddress: z.string().optional(),
  officeAddress: z.string().optional(),
  officeHours: z.string().optional(),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfsc: z.string().optional(),
  bankName: z.string().optional(),
  upiId: z.string().optional(),
  facebookUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
});

const apiKeyCreateSchema = z.object({
  label: z.string().min(2),
  scopes: z.string().min(2), // comma-separated, e.g. "donations:read"
});

module.exports = {
  beneficiaryRegisterSchema,
  beneficiaryLookupSchema,
  appointmentBookSchema,
  donationOrderSchema,
  partnerRequestSchema,
  contactMessageSchema,
  adminLoginSchema,
  couponGenerateSchema,
  couponAssignSchema,
  clinicCreateSchema,
  clinicUserCreateSchema,
  clinicLoginSchema,
  couponCodeSchema,
  orgSettingsUpdateSchema,
  apiKeyCreateSchema,
};
