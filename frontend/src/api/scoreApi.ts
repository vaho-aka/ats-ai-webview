import axios from 'axios';
import type { ScoreData } from '../interfaces/interfaces';
const API_ROOT = process.env.REACT_APP_API_URL || 'http://localhost:8000/';

export async function fetchScore(id: string): Promise<ScoreData> {
  const { data } = await axios.get(`${API_ROOT}/api/score/${id}/`);
  return data;
}
