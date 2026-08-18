// Central axios instance + all API calls.
// Keeping every endpoint call in one file makes it easy to swap the
// base URL (e.g. localhost -> production) in exactly one place.
import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// ---------- Services ----------
export const getServices = () => API.get('/services/');
export const createService = (data) => API.post('/services/', data);
export const search = (query) => API.get(`/search/?q=${encodeURIComponent(query)}`);

// ---------- Auth / Users ----------
export const registerUser = (data) => API.post("/users/register", data);
export const loginUser = (data) => API.post("/users/login", data);
export const getUserProfile = (userId) => API.get(`/users/profile/${userId}`);
export const updateUserProfile = (userId, data) => API.patch(`/users/${userId}`, data);
export const uploadUserAvatar = (userId, formData) => API.post(`/users/${userId}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ---------- Workers ----------
export const registerWorker = (data) => API.post("/workers/register", data);
export const loginWorker = (data) => API.post("/workers/login", data);
export const updateWorkerProfile = (workerId, data) => API.patch(`/workers/${workerId}`, data);
export const uploadWorkerAvatar = (workerId, formData) => API.post(`/workers/${workerId}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getWorkers = (service, lat, lng, radiusKm = 10, minRating, maxPrice) => {
  const params = {};
  if (service) params.service = service;
  if (typeof lat === 'number' && typeof lng === 'number') {
    params.lat = lat;
    params.lng = lng;
    params.radius_km = radiusKm;
  }
  if (minRating || minRating === 0) params.min_rating = minRating;
  if (maxPrice) params.max_price = maxPrice;
  return API.get('/workers/', { params });
};
export const getWorkerById = (workerId) => API.get(`/workers/${workerId}`);
export const updateWorkerSkills = (workerId, skills) => API.patch(`/workers/${workerId}/skills`, { skills });

// ---------- Bookings ----------
export const createBooking = (data) => API.post("/bookings/", data);
export const getUserBookings = (userId) => API.get(`/bookings/user/${userId}`);
export const getWorkerBookings = (workerId) => API.get(`/bookings/worker/${workerId}`);
export const updateBookingStatus = (bookingId, status) =>
  API.patch(`/bookings/${bookingId}`, { status });
export const cancelBooking = (bookingId) =>
  API.patch(`/bookings/${bookingId}`, { status: "cancelled" });

// ---------- Reviews ----------
export const createReview = (data) => API.post("/reviews/", data);
export const getWorkerReviews = (workerId) => API.get(`/reviews/${workerId}`);

// ---------- Messages ----------
export const sendMessage = (data) => API.post("/messages/", data);
export const getChatThread = (userId, workerId) =>
  API.get(`/messages/${userId}/${workerId}`);
export const markThreadRead = (userId, workerId, viewer) =>
  API.patch(`/messages/${userId}/${workerId}/read`, { viewer });
export const getUserUnreadCounts = (userId) =>
  API.get(`/messages/unread/user/${userId}`);
export const getWorkerUnreadCounts = (workerId) =>
  API.get(`/messages/unread/worker/${workerId}`);

// ---------- Uploads ----------
export const uploadImage = (formData) => API.post("/upload/image", formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export default API;
