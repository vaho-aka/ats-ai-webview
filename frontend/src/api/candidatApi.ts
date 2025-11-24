import axios from 'axios';

const API_ROOT = 'http://localhost:8000';

export async function getAllCandidats(search: string, page?: number) {
  const resp = await axios.get(`${API_ROOT}/api/candidats/`, {
    params: {
      search: search.trim(),
      page: search.trim() === '' ? page : undefined,
    },
  });

  return resp.data;
}
