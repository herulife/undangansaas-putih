const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://127.0.0.1:8088" : "");
const TOKEN_KEY = "linkundang.authToken";
const USER_KEY = "linkundang.authUser";

export type ApiInvitation = {
  id: string;
  slug: string;
  title: string;
  couple: string;
  template: string;
  templateSlug: string;
  eventDate: string;
  status: "draft" | "published";
  config: Record<string, unknown>;
  rsvpCount: number;
  watermark: boolean;
  createdAt: string;
};

export type SaveInvitationPayload = {
  slug: string;
  title: string;
  couple: string;
  templateSlug: string;
  eventDate: string;
  status?: "draft" | "published";
  config: Record<string, unknown>;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  tier: "free" | "creator" | "pro" | "business";
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: "user" | "admin" | "reseller" | "client";
  tier: "free" | "creator" | "pro" | "business";
  status: "active" | "suspended";
  tierExpiresAt: string | null;
  isB2b: boolean;
  clientLimit: number;
  invitationCount: number;
  rsvpCount: number;
  paymentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserPayload = {
  email: string;
  displayName: string;
  password?: string;
  role: AdminUser["role"];
  tier: AdminUser["tier"];
  status: AdminUser["status"];
  tierExpiresAt?: string;
  isB2b: boolean;
  clientLimit: number;
};

export type UploadResponse = {
  fileName: string;
  url: string;
  type: "images" | "audio";
};

export type GenerateImageResponse = {
  fileName: string;
  provider: string;
  url: string;
  prompt: string;
};

export type RSVPInput = {
  name: string;
  message: string;
  status: "attending" | "declined" | "pending";
  guests: number;
};

export type RSVPItem = {
  id: string;
  name: string;
  message: string;
  status: RSVPInput["status"];
  guests: number;
  createdAt: string;
};

export function getAuthToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) ?? "";
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthSession(session: AuthResponse) {
  window.localStorage.setItem(TOKEN_KEY, session.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearAuthSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(email: string, password: string, displayName: string) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, displayName }),
  });
}

export function getMe() {
  return request<AuthUser>("/api/auth/me");
}

export async function updateProfile(payload: { email: string; displayName: string }) {
  const user = await request<AuthUser>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  return user;
}

export function changePassword(payload: { currentPassword: string; newPassword: string }) {
  return request<void>("/api/auth/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function listAdminUsers(params?: { q?: string; status?: string; role?: string; tier?: string }) {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.status) query.set("status", params.status);
  if (params?.role) query.set("role", params.role);
  if (params?.tier) query.set("tier", params.tier);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<AdminUser[]>(`/api/admin/users${suffix}`);
}

export function createAdminUser(payload: AdminUserPayload & { password: string }) {
  return request<AdminUser>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminUser(id: string, payload: AdminUserPayload) {
  return request<AdminUser>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function resetAdminUserPassword(id: string, password: string) {
  return request<void>(`/api/admin/users/${id}/password`, {
    method: "PATCH",
    body: JSON.stringify({ password }),
  });
}

export async function uploadMedia(file: File) {
  const token = getAuthToken();
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_BASE}/api/uploads`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Upload failed: ${response.status}`);
  }
  return response.json() as Promise<UploadResponse>;
}

export function generateInvitationImage(payload: { prompt: string; style?: string; size?: string }) {
  return request<GenerateImageResponse>("/api/ai/images", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listInvitations() {
  return request<ApiInvitation[]>("/api/invitations");
}

export function getInvitation(slug: string) {
  return request<ApiInvitation>(`/api/invitations/${slug}`);
}

export async function saveInvitation(payload: SaveInvitationPayload) {
  try {
    return await request<ApiInvitation>("/api/invitations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("slug")) {
      throw error;
    }
    return request<ApiInvitation>(`/api/invitations/${payload.slug}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: payload.title,
        couple: payload.couple,
        eventDate: payload.eventDate,
        status: payload.status ?? "draft",
        config: payload.config,
      }),
    });
  }
}

export function submitRSVP(slug: string, payload: RSVPInput) {
  return request(`/api/invitations/${slug}/rsvp`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listInvitationRSVPs(slug: string) {
  return request<RSVPItem[]>(`/api/invitations/${slug}/rsvps`);
}
