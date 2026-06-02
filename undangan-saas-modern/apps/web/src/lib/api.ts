const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8090/api';

export type HealthResponse = {
  ok: boolean;
  service: string;
};

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) {
    throw new Error('API unavailable');
  }
  return response.json();
}

