import axios from 'axios';
import type { Profile } from '../types/profile';
import { API_BASE } from './config';

export const apiGetProfile = (): Promise<Profile> =>
  axios.get<Profile>(`${API_BASE}/api/profile/`).then(r => r.data);
