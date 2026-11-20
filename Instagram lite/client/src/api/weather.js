import apiClient from "./client";

export function getWeather() {
  return apiClient.get("/weather").then((res) => res.data);
}
