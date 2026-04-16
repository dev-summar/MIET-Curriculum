const TOKEN_KEY = "miet_auth_token";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const h = { Accept: "application/json", ...headers };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) h.Authorization = `Bearer ${token}`;
  const init = { method, headers: h };
  if (body !== undefined && method !== "GET" && method !== "HEAD") {
    if (typeof body === "object" && !(body instanceof FormData)) {
      h["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    } else {
      init.body = body;
    }
  }
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {
      /* ignore */
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type");
  if (ct && ct.includes("application/json")) return res.json();
  return null;
}

export const authApi = {
  TOKEN_KEY,
  setToken: (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password } }),
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload })
};

export const getPrograms = () => request("/api/programs");
export const getProgram = (id) => request(`/api/programs/${id}`);
export const getProgramCourses = (programId) => request(`/api/programs/${programId}/courses`);
export const getProgramPOs = (programId) => request(`/api/programs/${programId}/pos`);

export const getCoursesBundle = () => request("/api/courses");

export const getCourse = (id) => request(`/api/courses/${id}`);
export const getCourseUnits = (id) => request(`/api/courses/${id}/units`);
export const getCourseCopomap = (id) => request(`/api/courses/${id}/copomap`);
export const getCourseCos = (id) => request(`/api/courses/${id}/cos`);
export const getCourseResources = (id) => request(`/api/courses/${id}/resources`);

export const adminCreateCourse = (body) => request("/api/admin/courses", { method: "POST", body });
export const adminUpdateCourse = (id, body) => request(`/api/admin/courses/${id}`, { method: "PUT", body });
export const adminDeleteCourse = (id) => request(`/api/admin/courses/${id}`, { method: "DELETE" });

export const adminCreateUnit = (body) => request("/api/admin/units", { method: "POST", body });
export const adminUpdateUnit = (id, body) => request(`/api/admin/units/${id}`, { method: "PUT", body });
export const adminDeleteUnit = (id) => request(`/api/admin/units/${id}`, { method: "DELETE" });

export const adminCreateCO = (body) => request("/api/admin/cos", { method: "POST", body });
export const adminUpdateCO = (id, body) => request(`/api/admin/cos/${id}`, { method: "PUT", body });
export const adminDeleteCO = (id) => request(`/api/admin/cos/${id}`, { method: "DELETE" });

export const adminCreateCopomap = (body) => request("/api/admin/copomap", { method: "POST", body });
export const adminUpdateCopomap = (id, body) => request(`/api/admin/copomap/${id}`, { method: "PUT", body });
export const adminDeleteCopomap = (id) => request(`/api/admin/copomap/${id}`, { method: "DELETE" });

export const adminCreateResource = (body) => request("/api/admin/resources", { method: "POST", body });
export const adminUpdateResource = (id, body) => request(`/api/admin/resources/${id}`, { method: "PUT", body });
export const adminDeleteResource = (id) => request(`/api/admin/resources/${id}`, { method: "DELETE" });

export const adminCreatePO = (body) => request("/api/admin/pos", { method: "POST", body });
export const adminUpdatePO = (id, body) => request(`/api/admin/pos/${id}`, { method: "PUT", body });
export const adminDeletePO = (id) => request(`/api/admin/pos/${id}`, { method: "DELETE" });

export const adminCreateProgram = (body) => request("/api/admin/programs", { method: "POST", body });
export const adminUpdateProgram = (id, body) => request(`/api/admin/programs/${id}`, { method: "PUT", body });
export const adminDeleteProgram = (id) => request(`/api/admin/programs/${id}`, { method: "DELETE" });
export const adminCloneProgram = (id, body) => request(`/api/admin/programs/${id}/clone`, { method: "POST", body });
