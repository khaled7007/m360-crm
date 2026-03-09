import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const leadSchema = z.object({
  contact_name: z.string().min(1, "Contact name is required"),
  company_name: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phone: z.string().min(1, "Phone is required"),
  source: z.string().min(1, "Source is required"),
  estimated_amount: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

export const organizationSchema = z.object({
  name_en: z.string().min(1, "English name is required"),
  name_ar: z.string().min(1, "Arabic name is required"),
  cr_number: z.string().min(1, "CR number is required"),
  email: z.string().email("Invalid email").min(1, "Email is required"),
  phone: z.string().min(1, "Phone is required"),
  tax_id: z.string().optional(),
  industry: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;

export const userSchema = z.object({
  email: z.string().email("Invalid email").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name_en: z.string().min(1, "English name is required"),
  name_ar: z.string().optional(),
  role: z.string().min(1, "Role is required"),
});

export type UserFormData = z.infer<typeof userSchema>;

export const productSchema = z.object({
  name_en: z.string().min(1, "English name is required"),
  name_ar: z.string().min(1, "Arabic name is required"),
  product_type: z.string().min(1, "Product type is required"),
  min_amount: z.coerce.number().positive("Must be greater than 0"),
  max_amount: z.coerce.number().positive("Must be greater than 0"),
  profit_rate: z.coerce.number().positive("Must be greater than 0"),
  admin_fee: z.coerce.number().min(0).optional(),
  min_tenor: z.coerce.number().int().positive().optional(),
  max_tenor: z.coerce.number().int().positive().optional(),
  payment_frequency: z.string().optional(),
  is_active: z.boolean().optional(),
}).refine(data => data.max_amount > data.min_amount, {
  message: "Max amount must be greater than min amount",
  path: ["max_amount"],
});

export type ProductFormData = z.infer<typeof productSchema>;

export const applicationSchema = z.object({
  organization_id: z.string().uuid("Organization is required"),
  product_id: z.string().uuid("Product is required"),
  requested_amount: z.coerce.number().positive("Amount must be greater than 0"),
  tenor_months: z.coerce.number().int().positive("Tenor must be greater than 0"),
  purpose: z.string().min(1, "Purpose is required"),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;
