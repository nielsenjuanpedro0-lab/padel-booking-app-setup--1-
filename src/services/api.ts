import axios from 'axios';

const API_URL = 'https://padel-booking-app-setup-1.onrender.com/api';

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role?: 'admin' | 'user';
}

export interface Court {
  id: number;
  name: string;
  address: string;
  city: string;
  price: number;
  amenities?: string[];
  image?: string;
}

export interface Booking {
  id: number;
  courtId: number;
  userId: number;
  date: string;
  time: string;
  status?: 'pending' | 'confirmed';
  courtName?: string;
  address?: string;
  price?: number;
  userName?: string;
  userEmail?: string;
}

// Simple mock data store in memory (and persist to localStorage for reload)
const loadMockData = <T>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultVal;
};

const saveMockData = (key: string, val: any) => {
  localStorage.setItem(key, JSON.stringify(val));
};

// Mock Data
let mockUsers = loadMockData<User[]>('mockUsers', []);
let mockBookings = loadMockData<Booking[]>('mockBookings', []);
const mockCourts: Court[] = [
  { 
    id: 1, 
    name: 'Necochea Padel Club', 
    address: 'Calle 64 3450', 
    city: 'Necochea', 
    price: 9000, 
    amenities: ['Techada', 'Bar', 'WiFi'],
    image: 'https://images.unsplash.com/photo-1626245223656-e3d1796c5685?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  },
  { 
    id: 2, 
    name: 'Punto de Oro', 
    address: 'Av. 59 1200', 
    city: 'Necochea', 
    price: 9000,
    amenities: ['Panorámica', 'Estacionamiento'],
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  },
  { 
    id: 3, 
    name: 'Master Padel', 
    address: 'Calle 83 220', 
    city: 'Necochea', 
    price: 9000,
    amenities: ['Cancha Central', 'Vestuarios Premium'],
    image: 'https://plus.unsplash.com/premium_photo-1676634832558-6654a134e920?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  },
];

let useMock = false; // Default to true for demo purposes

export const setUseMock = (val: boolean) => {
  useMock = val;
};

export const isMock = () => useMock;

export const api = {
  login: async (email: string, password: string): Promise<{ data: { token: string; user: User } }> => {
    if (useMock) {
      const user = mockUsers.find(u => u.email === email && u.password === password);
      if (user) {
        // Force admin role for the demo admin user
        const role = email === 'admin@padel.com' ? 'admin' : (user.role || 'user');
        return { data: { token: 'mock-token', user: { id: user.id, name: user.name, email: user.email, role } } };
      }
      throw { response: { status: 401, data: { error: 'Invalid credentials' } } };
    }
    return axios.post(`${API_URL}/auth/login`, { email, password });
  },

  register: async (name: string, email: string, password: string): Promise<{ data: { token: string; user: User } }> => {
    if (useMock) {
      if (mockUsers.find(u => u.email === email)) {
         throw { response: { status: 400, data: { error: 'Email already exists' } } };
      }
      const newUser: User = { id: Date.now(), name, email, password, role: 'user' };
      mockUsers.push(newUser);
      saveMockData('mockUsers', mockUsers);
      return { data: { token: 'mock-token', user: { id: newUser.id, name, email, role: 'user' } } };
    }
    return axios.post(`${API_URL}/auth/register`, { name, email, password });
  },

  getCourts: async (city?: string): Promise<{ data: Court[] }> => {
    if (useMock) {
      if (city) return { data: mockCourts.filter(c => c.city === city) };
      return { data: mockCourts };
    }
    return axios.get(`${API_URL}/courts`, { params: { city } });
  },

  getCourt: async (id: string | number): Promise<{ data: Court }> => {
    if (useMock) {
      const court = mockCourts.find(c => c.id === Number(id));
      if (court) return { data: court };
      throw { response: { status: 404 } };
    }
    return axios.get(`${API_URL}/courts/${id}`);
  },

  getBookings: async (courtId: number, date: string): Promise<{ data: { time: string }[] }> => {
    if (useMock) {
      const bookings = mockBookings.filter(b => b.courtId === Number(courtId) && b.date === date);
      return { data: bookings.map(b => ({ time: b.time })) };
    }
    return axios.get(`${API_URL}/bookings`, { params: { court_id: courtId, date } });
  },

  getMyBookings: async (token: string): Promise<{ data: Booking[] }> => {
    if (useMock) {
      // Return bookings with court info
      const enriched = mockBookings.map(b => {
        const c = mockCourts.find(mc => mc.id === b.courtId);
        return { ...b, courtName: c?.name, address: c?.address, price: c?.price };
      });
      return { data: enriched };
    }
    return axios.get(`${API_URL}/my-bookings`, { headers: { Authorization: `Bearer ${token}` } });
  },

  createBooking: async (token: string, bookingData: { court_id: number; date: string; time: string }): Promise<{ data: { success: boolean; bookingId?: number } }> => {
    if (useMock) {
      const { court_id, date, time } = bookingData;
      // Check collision
      const exists = mockBookings.find(b => b.courtId === court_id && b.date === date && b.time === time);
      if (exists) throw { response: { status: 400, data: { error: 'Slot occupied' } } };
      
      const newBooking: Booking = { id: Date.now(), courtId: court_id, date, time, userId: 123 }; // Mock user id
      mockBookings.push(newBooking);
      saveMockData('mockBookings', mockBookings);
      return { data: { success: true, bookingId: newBooking.id } };
    }
    return axios.post(`${API_URL}/bookings`, bookingData, { headers: { Authorization: `Bearer ${token}` } });
  },

  confirmBooking: async (token: string, bookingId: number): Promise<{ data: { success: boolean } }> => {
    if (useMock) {
      return { data: { success: true } };
    }
    return axios.put(`${API_URL}/bookings/${bookingId}/confirm`, {}, { headers: { Authorization: `Bearer ${token}` } });
  },

  // Admin API
  getAdminBookings: async (token: string): Promise<{ data: Booking[] }> => {
    if (useMock) {
      const enriched = mockBookings.map(b => {
        const c = mockCourts.find(mc => mc.id === b.courtId);
        const u = mockUsers.find(mu => mu.id === b.userId);
        return { 
          ...b, 
          courtName: c?.name, 
          address: c?.address, 
          price: c?.price,
          userName: u?.name || 'Unknown',
          userEmail: u?.email || 'unknown@email.com'
        };
      });
      return { data: enriched };
    }
    return axios.get(`${API_URL}/admin/bookings`, { headers: { Authorization: `Bearer ${token}` } });
  },

  adminCancelBooking: async (token: string, bookingId: number): Promise<{ data: { success: boolean } }> => {
    if (useMock) {
      mockBookings = mockBookings.filter(b => b.id !== bookingId);
      saveMockData('mockBookings', mockBookings);
      return { data: { success: true } };
    }
    return axios.put(`${API_URL}/admin/bookings/${bookingId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
  },

  adminConfirmBooking: async (token: string, bookingId: number): Promise<{ data: { success: boolean } }> => {
    if (useMock) {
      const booking = mockBookings.find(b => b.id === bookingId);
      if (booking) booking.status = 'confirmed';
      saveMockData('mockBookings', mockBookings);
      return { data: { success: true } };
    }
    return axios.put(`${API_URL}/admin/bookings/${bookingId}/confirm`, {}, { headers: { Authorization: `Bearer ${token}` } });
  },

  createPreference: async (token: string, bookingId: number): Promise<{ data: { init_point: string } }> => {
    if (useMock) {
      return { data: { init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock-preference-id' } };
    }
    return axios.post(`${API_URL}/create-preference`, { bookingId }, { headers: { Authorization: `Bearer ${token}` } });
<<<<<<< Updated upstream
  }


forgotPassword: async (email: string): Promise<{ data: { success: boolean } }> => {
=======
  },

  forgotPassword: async (email: string): Promise<{ data: { success: boolean } }> => {
>>>>>>> Stashed changes
    return axios.post(`${API_URL}/auth/forgot-password`, { email });
  },

  resetPassword: async (email: string, code: string, newPassword: string): Promise<{ data: { success: boolean } }> => {
    return axios.post(`${API_URL}/auth/reset-password`, { email, code, newPassword });
  },
<<<<<<< Updated upstream
};
=======
};
>>>>>>> Stashed changes
