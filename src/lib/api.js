import { SUPABASE_URL, SUPABASE_KEY } from './constants';

export const api = async (endpoint, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { "Prefer": options.prefer } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  if (res.status === 204) return null;
  return res.json();
};

// Users
export const getUsers = () => api("users?select=id,first_name,last_name,role,lang_pref,is_first_login,password_reset_required&order=first_name.asc");
export const getUserById = (id) => api(`users?id=eq.${id}&select=*`);
export const updateUser = (id, data) => api(`users?id=eq.${id}`, { method:"PATCH", body:JSON.stringify(data) });

// Clients
export const getClients = () => api("clients?select=*&order=created_at.desc");
export const createClient = (data) => api("clients", { method:"POST", prefer:"return=representation", body:JSON.stringify(data) });
export const updateClient = (id, data) => api(`clients?id=eq.${id}`, { method:"PATCH", body:JSON.stringify(data) });
export const deleteClient = (id) => api(`clients?id=eq.${id}`, { method:"DELETE" });

// Locking
export const lockDossier = (clientId, userId) =>
  api("active_sessions", { method:"POST", prefer:"return=representation",
    body:JSON.stringify({ client_id:clientId, user_id:userId }) });
export const unlockDossier = (clientId) =>
  api(`active_sessions?client_id=eq.${clientId}`, { method:"DELETE" });
export const getActiveSessions = () => api("active_sessions?select=*");

// Payments
export const getPayments = (clientId) => api(`payments?client_id=eq.${clientId}&select=*&order=created_at.desc`);
export const createPayment = (data) => api("payments", { method:"POST", prefer:"return=representation", body:JSON.stringify(data) });
export const updatePayment = (id, data) => api(`payments?id=eq.${id}`, { method:"PATCH", body:JSON.stringify(data) });

// Documents
export const getDocuments = (clientId) => api(`documents?client_id=eq.${clientId}&select=*&order=created_at.desc`);
export const createDocument = (data) => api("documents", { method:"POST", prefer:"return=representation", body:JSON.stringify(data) });

// Comms log
export const getCommsLog = (clientId) => api(`communications_log?client_id=eq.${clientId}&select=*&order=sent_at.desc`);
export const addCommsLog = (data) => api("communications_log", { method:"POST", body:JSON.stringify(data) });

// Audit log
export const addAuditLog = (userId, action, tableN, recordId, details) =>
  api("audit_log", { method:"POST",
    body:JSON.stringify({ user_id:userId, action, table_name:tableN, record_id:recordId, details }) });
