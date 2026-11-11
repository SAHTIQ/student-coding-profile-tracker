export const API_BASE_URL = 'http://localhost:5000/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('codepulse_jwt_token');
  }

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem('codepulse_jwt_token', token);
    } else {
      localStorage.removeItem('codepulse_jwt_token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async studentSignup(data: {
    email: string;
    password: string;
    name: string;
    rollNumber: string;
    department: string;
    yearOfStudy: string;
    section?: string;
    batch?: string;
    leetcodeUsername: string;
  }) {
    const res = await this.request('/auth/signup/student', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async googleAuth(data: {
    credential?: string;
    email?: string;
    name?: string;
    rollNumber?: string;
    department?: string;
    yearOfStudy?: string;
    leetcodeUsername?: string;
  }) {
    const res = await this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Admin endpoints
  async addStudent(data: {
    rollNumber: string;
    name: string;
    department: string;
    yearOfStudy: string;
    section?: string;
    batch?: string;
    leetcodeUsername: string;
    email?: string;
  }) {
    return this.request('/admin/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listStudents(params?: { department?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.department) query.set('department', params.department);
    if (params?.search) query.set('search', params.search);
    return this.request(`/admin/students?${query.toString()}`);
  }

  async deleteStudent(id: string) {
    return this.request(`/admin/students/${id}`, { method: 'DELETE' });
  }

  async syncStudent(id: string) {
    return this.request(`/admin/students/${id}/sync`, { method: 'POST' });
  }

  async syncAllStudents() {
    return this.request('/admin/sync-all', { method: 'POST' });
  }

  async bulkAddStudents(students: any[]) {
    return this.request('/admin/students/bulk', {
      method: 'POST',
      body: JSON.stringify({ students }),
    });
  }

  async addFaculty(data: {
    facultyId: string;
    name: string;
    email: string;
    password?: string;
    department: string;
    canViewOwnDepartment?: boolean;
    canExportReports?: boolean;
  }) {
    return this.request('/admin/faculty', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listFaculties() {
    return this.request('/admin/faculty');
  }

  async updateFacultyPermissions(id: string, permissions: { canViewOwnDepartment?: boolean; canExportReports?: boolean }) {
    return this.request(`/admin/faculty/${id}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify(permissions),
    });
  }

  async deleteFaculty(id: string) {
    return this.request(`/admin/faculty/${id}`, { method: 'DELETE' });
  }

  // Analytics & Multi-Category Retrieval
  async getCategories() {
    return this.request('/analytics/categories');
  }

  async getCodingActivity(filters: {
    department?: string;
    yearOfStudy?: string;
    batch?: string;
    section?: string;
    topic?: string;
    difficulty?: string;
    startDate?: string;
    endDate?: string;
    tier?: string;
  }) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== 'ALL') query.set(k, v);
    });
    return this.request(`/analytics/coding-activity?${query.toString()}`);
  }

  // Export Download
  async downloadProblemHistory(filters: {
    department?: string;
    yearOfStudy?: string;
    topic?: string;
    difficulty?: string;
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'xlsx';
  }) {
    const token = this.getToken();
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== 'ALL') query.set(k, v);
    });

    const response = await fetch(`${API_BASE_URL}/export/problems?${query.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Export download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const format = filters.format || 'csv';
    link.setAttribute('download', `CodePulse_Solved_Problems_${new Date().toISOString().split('T')[0]}.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const apiClient = new ApiClient();
