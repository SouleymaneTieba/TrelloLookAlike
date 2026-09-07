import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshRequest = null;

function setAccessToken(accessToken) {
  localStorage.setItem("access_token", accessToken);
  api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
}

function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  delete api.defaults.headers.common.Authorization;
  window.dispatchEvent(new Event("auth:session-expired"));
}

async function refreshAccessToken() {
  if (!refreshRequest) {
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      throw new Error("Refresh token absent.");
    }

    refreshRequest = axios
      .post(`${api.defaults.baseURL}/auth/refresh/`, {
        refresh: refreshToken,
      })
      .then(({ data }) => {
        setAccessToken(data.access);
        return data.access;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("access_token");

  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url?.includes("/auth/login/") ||
      originalRequest?.url?.includes("/auth/refresh/") ||
      !localStorage.getItem("refresh_token")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearSession();
      return Promise.reject(refreshError);
    }
  }
);

export default api;