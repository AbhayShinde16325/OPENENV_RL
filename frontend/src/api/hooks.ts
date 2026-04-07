import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import client from './client';
import { useSimulationStore } from '../store/simulationStore';
import type {
  HealthResponse,
  ResetRequest,
  ResetResponse,
  StepRequest,
  StepResponse,
  StateRequest,
  StateResponse,
  GradeRequest,
  GradeResponse,
  SessionListResponse,
  DeleteSessionResponse,
} from '../types';

// ── Health ───────────────────────────────────────────────────────────────────

export function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => (await client.get<HealthResponse>('/health')).data,
    refetchOnMount: true,
    retry: 1,
  });
}

// ── Reset ────────────────────────────────────────────────────────────────────

export function useReset() {
  return useMutation<ResetResponse, Error, ResetRequest>({
    mutationFn: async (body) => (await client.post<ResetResponse>('/reset', body)).data,
  });
}

// ── Step ─────────────────────────────────────────────────────────────────────

export function useStep() {
  const store = useSimulationStore();
  return useMutation<StepResponse, Error, StepRequest>({
    mutationFn: async (body) => (await client.post<StepResponse>('/step', body)).data,
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        store.setError('Session expired. Please reset.');
      } else if (status === 409) {
        store.setError('Episode already ended. Please reset.');
      } else {
        store.setError('Connection lost or server error.');
      }
    },
  });
}

// ── State Snapshot ───────────────────────────────────────────────────────────

export function useStateSnapshot(sessionId: string | null, includeHistory = false) {
  return useQuery<StateResponse>({
    queryKey: ['state', sessionId, includeHistory],
    queryFn: async () => {
      const body: StateRequest = { session_id: sessionId!, include_action_history: includeHistory };
      return (await client.post<StateResponse>('/state', body)).data;
    },
    enabled: !!sessionId,
    refetchOnWindowFocus: false,
  });
}

// ── Grade ────────────────────────────────────────────────────────────────────

export function useGrade() {
  return useMutation<GradeResponse, Error, GradeRequest>({
    mutationFn: async (body) => (await client.post<GradeResponse>('/grade', body)).data,
  });
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export function useSessions() {
  return useQuery<SessionListResponse>({
    queryKey: ['sessions'],
    queryFn: async () => (await client.get<SessionListResponse>('/sessions')).data,
    refetchOnMount: true,
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation<DeleteSessionResponse, Error, string>({
    mutationFn: async (id) => (await client.delete<DeleteSessionResponse>(`/sessions/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
