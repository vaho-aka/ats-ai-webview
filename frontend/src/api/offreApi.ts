import axios from 'axios';

const API_ROOT = 'http://localhost:8000';

export async function getAllOffres(search: string, page: number) {
  const response = await axios.get(`${API_ROOT}/api/job_offers/`, {
    params: { search, page },
  });

  return response.data;
}
