import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth API
export const authAPI = {
  login: (email, password) => axios.post(`${API}/auth/login`, { email, password }),
  register: (data) => axios.post(`${API}/auth/register`, data),
  getMe: () => axios.get(`${API}/auth/me`),
};

// Admin API
export const adminAPI = {
  getUsers: () => axios.get(`${API}/admin/users`),
  getRegistrationRequests: () => axios.get(`${API}/admin/registration-requests`),
  approveRegistration: (requestId) => axios.post(`${API}/admin/approve/${requestId}`),
  rejectRegistration: (requestId) => axios.post(`${API}/admin/reject/${requestId}`),
  updateUser: (userId, data) => axios.put(`${API}/admin/users/${userId}`, data),
  deleteUser: (userId) => axios.delete(`${API}/admin/users/${userId}`),
  deactivateUser: (userId) => axios.post(`${API}/admin/users/${userId}/deactivate`),
  activateUser: (userId) => axios.post(`${API}/admin/users/${userId}/activate`),
  promoteStudentGrade: (userId) => axios.post(`${API}/admin/users/${userId}/promote-grade`),
  getStatistics: () => axios.get(`${API}/admin/statistics`),
};

// Grades API
export const gradesAPI = {
  getAll: () => axios.get(`${API}/grades`),
  create: (data) => axios.post(`${API}/grades`, data),
  delete: (gradeId) => axios.delete(`${API}/grades/${gradeId}`),
};

// Classes API
export const classesAPI = {
  getAll: () => axios.get(`${API}/classes`),
  create: (data) => axios.post(`${API}/classes`, data),
  delete: (classId) => axios.delete(`${API}/classes/${classId}`),
};

// Subjects API
export const subjectsAPI = {
  getAll: () => axios.get(`${API}/subjects`),
  create: (data) => axios.post(`${API}/subjects`, data),
  delete: (subjectId) => axios.delete(`${API}/subjects/${subjectId}`),
};

// Teacher API
export const teacherAPI = {
  getMySubjects: () => axios.get(`${API}/teacher/my-subjects`),
  assignSubject: (data) => axios.post(`${API}/teacher/my-subjects`, data),
  removeSubject: (assignmentId) => axios.delete(`${API}/teacher/my-subjects/${assignmentId}`),
};

// AI Sources API
export const aiSourcesAPI = {
  getAll: () => axios.get(`${API}/ai-sources`),
  upload: (formData) => axios.post(`${API}/ai-sources/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (sourceId, data) => axios.put(`${API}/ai-sources/${sourceId}`, data),
  delete: (sourceId) => axios.delete(`${API}/ai-sources/${sourceId}`),
};

// Chat API
export const chatAPI = {
  getChats: () => axios.get(`${API}/chats`),
  createChat: (title) => axios.post(`${API}/chats`, { title }),
  deleteChat: (chatId) => axios.delete(`${API}/chats/${chatId}`),
  getMessages: (chatId) => axios.get(`${API}/chats/${chatId}/messages`),
  sendMessage: (chatId, content) => axios.post(`${API}/chats/${chatId}/messages`, { content }),
};

// Attachments API
export const attachmentsAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API}/attachments/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  download: (attachmentId) => `${API}/attachments/${attachmentId}`,
};

// Seed API
export const seedAPI = {
  seed: () => axios.post(`${API}/seed`),
};

export default {
  auth: authAPI,
  admin: adminAPI,
  grades: gradesAPI,
  classes: classesAPI,
  subjects: subjectsAPI,
  teacher: teacherAPI,
  aiSources: aiSourcesAPI,
  chat: chatAPI,
  attachments: attachmentsAPI,
  seed: seedAPI,
};
