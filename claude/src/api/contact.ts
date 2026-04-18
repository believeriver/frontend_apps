import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/contact';

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  body: string;
}

export interface ContactMessage extends ContactInput {
  id: number;
  is_read: boolean;
  created_at: string;
}

export const apiPostContact = (data: ContactInput): Promise<ContactMessage> =>
  axios.post<ContactMessage>(`${BASE_URL}/`, data).then(r => r.data);

const adminClient = (token: string) =>
  axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

export const apiGetContactList = (token: string): Promise<ContactMessage[]> =>
  adminClient(token).get<ContactMessage[]>('/list/').then(r => r.data);

export const apiPatchContact = (token: string, id: number, data: Partial<ContactMessage>): Promise<ContactMessage> =>
  adminClient(token).patch<ContactMessage>(`/${id}/`, data).then(r => r.data);

export const apiDeleteContact = (token: string, id: number): Promise<void> =>
  adminClient(token).delete(`/${id}/`).then(() => undefined);
