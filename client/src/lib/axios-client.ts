import { useStore } from "@/store/store";
import { CustomError } from "@/types/custom-error.type";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const options = {
  baseURL,
  withCredentials: true,
  timeout: 45000,
};

const API = axios.create(options);

API.interceptors.request.use((config) => {
  const accessToken = useStore.getState().accessToken;
  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const data = error?.response?.data;

    // if (data === "Unauthorized" && status === 401) {
    //   window.location.href = "/";
    // }

    const customError: CustomError = {
      ...error,
      errorCode: data?.errorCode || "UNKNOWN_ERROR",
    };

    return Promise.reject(customError);
  },
);

export default API;
