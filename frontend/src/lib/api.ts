import type { AgentState, HealthStatus } from "../types";

const API_BASE = '/api';

export async function startPipeline(prompt: string): Promise<{ session_id: string }> {
  const res = await fetch(`${API_BASE}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error('Failed to start pipeline');
  return res.json();
}

export async function approveStage(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/approve/${sessionId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to approve stage');
}

export async function editStage(sessionId: string, edits: object, feedback: string = ""): Promise<void> {
  const res = await fetch(`${API_BASE}/edit/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ edits, feedback }),
  });
  if (!res.ok) throw new Error('Failed to save edits');
}

export async function loopBack(sessionId: string, targetStage: string): Promise<void> {
  const res = await fetch(`${API_BASE}/loop_back/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_stage: targetStage }),
  });
  if (!res.ok) throw new Error('Failed to loop back');
}

export async function getState(sessionId: string): Promise<{ state: AgentState | null }> {
  const res = await fetch(`${API_BASE}/state/${sessionId}`);
  if (!res.ok) throw new Error('Failed to fetch state');
  return res.json();
}

export async function getHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch health status');
  return res.json();
}

export async function retryStage(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/retry/${sessionId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to retry stage');
}
