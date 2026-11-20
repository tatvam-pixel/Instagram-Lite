import apiClient from "./client";

export function submitBugReport(formData) {
  return apiClient.post("/bug-reports", formData).then((res) => res.data);
}
