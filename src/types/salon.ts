export type GalleryCategory =
  | "All Looks"
  | "Haircuts"
  | "Blonde"
  | "Brunette"
  | "Copper"
  | "Styling"
  | "Transformations";

export interface GalleryItem {
  id: string;
  lookNumber: string;
  title: string;
  category: GalleryCategory;
  image: string;
  caption: string;
  tonalProfile: string;
  technique: string;
  aspect?: "tall" | "portrait" | "wide" | "square";
  isFeatured?: boolean;
}

/** One bookable service, exactly as listed on Reilly's Square booking page. */
export interface ServiceItem {
  id: string;
  name: string;
  /** CAD. Omitted when the supplied menu does not list a price. */
  price?: number;
  /** Omitted when the supplied menu does not list a duration. */
  duration?: string;
  description?: string[];
  includes?: string;
}

export interface ServiceCategory {
  id: string;
  title: string;
  intro?: string;
  /** Shows the "colour does not include a haircut" note under this category. */
  colourNote?: boolean;
  /** Existing site photograph used on the category card. */
  image: string;
  highlight: string;
  services: ServiceItem[];
}

export interface AppointmentFormData {
  fullName: string;
  email: string;
  phone?: string;
  service: string;
  preferredDate: string;
  preferredTime?: string;
  hairLength?: string;
  notes?: string;
}

export interface AppointmentResponse {
  success: boolean;
  message: string;
  referenceNumber?: string;
  emailSent?: boolean;
  data?: AppointmentFormData;
}

export type AppointmentStatus = "pending" | "approved" | "rejected";

export interface EmailNotificationRecord {
  status: "pending" | "sent" | "failed" | "skipped";
  attemptedAt?: Date;
  providerId?: string;
  /** Short, non-sensitive reason when the email was not delivered. */
  reason?: string;
}

/** Shape of a document in TerrySalonDB.appointments (server only). */
export interface AppointmentDocument {
  referenceCode: string;
  fullName: string;
  email: string;
  phone?: string;
  service: string;
  /** YYYY-MM-DD as chosen by the client (salon local date, Atlantic time). */
  requestedDate: string;
  /** Time window id: morning | midday | afternoon | flexible. */
  requestedTime: string;
  hairLength?: string;
  notes?: string;
  status: AppointmentStatus;
  /** Email to the stylist when the request was submitted. */
  notification: EmailNotificationRecord;
  /** Set when the stylist approves or rejects the request. */
  decidedAt?: Date;
  /** Email to the customer about the stylist's decision. */
  customerNotification?: EmailNotificationRecord;
  createdAt: Date;
  updatedAt: Date;
}

/** Appointment as sent to the admin dashboard (dates serialised, no database internals). */
export interface AdminAppointment {
  referenceCode: string;
  fullName: string;
  email: string;
  phone?: string;
  service: string;
  requestedDate: string;
  requestedTime: string;
  hairLength?: string;
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
  decidedAt?: string;
  terryNotification: EmailNotificationRecord["status"];
  customerNotification?: { status: EmailNotificationRecord["status"]; reason?: string };
}

export interface AdminAppointmentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface AdminAppointmentsResponse {
  items: AdminAppointment[];
  total: number;
  page: number;
  pageSize: number;
  stats: AdminAppointmentStats;
}
