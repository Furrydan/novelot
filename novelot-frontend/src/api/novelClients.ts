import axios from "axios"

export const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL ?? "http://localhost:1714"}/api/novels`
})

export const authApi = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL ?? "http://localhost:1714"}/api/users`,
    withCredentials: true,
})

