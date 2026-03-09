export interface Stage {
  id: string;
  label: string;
  labelEn: string;
  color: string;
  lightBg: string;
  border: string;
  headerBg: string;
}

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  value: number;
  stage: string;
  assignee: string;
  status: string;
  notes: string;
  updatedAt: string;
}

export const STAGES: Stage[] = [
  { id: "new",        label: "جديد",         labelEn: "New",        color: "#2563EB", lightBg: "#EFF6FF", border: "#BFDBFE", headerBg: "#2563EB" },
  { id: "lead",       label: "عميل محتمل",   labelEn: "Lead",       color: "#D97706", lightBg: "#FFFBEB", border: "#FDE68A", headerBg: "#D97706" },
  { id: "interested", label: "مهتم",         labelEn: "Interested", color: "#7C3AED", lightBg: "#F5F3FF", border: "#DDD6FE", headerBg: "#7C3AED" },
  { id: "deal",       label: "صفقة",         labelEn: "Deal",       color: "#059669", lightBg: "#ECFDF5", border: "#6EE7B7", headerBg: "#059669" },
  { id: "reject",     label: "مرفوض",        labelEn: "Reject",     color: "#DC2626", lightBg: "#FEF2F2", border: "#FECACA", headerBg: "#DC2626" },
];

export const STAGE_MAP: Record<string, string> = {
  "جديد": "new",         "new": "new",         "New": "new",
  "عميل محتمل": "lead",  "lead": "lead",       "Lead": "lead",
  "مهتم": "interested",  "interested": "interested", "Interested": "interested",
  "صفقة": "deal",        "deal": "deal",       "Deal": "deal",
  "مرفوض": "reject",     "reject": "reject",   "Reject": "reject",
};

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  hot:       { label: "ساخن",    color: "#DC2626", bg: "#FEE2E2" },
  warm:      { label: "دافئ",    color: "#EA580C", bg: "#FFEDD5" },
  cold:      { label: "بارد",    color: "#2563EB", bg: "#DBEAFE" },
  follow_up: { label: "متابعة",  color: "#7C3AED", bg: "#EDE9FE" },
};
