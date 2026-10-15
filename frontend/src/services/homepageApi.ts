import { HomepageContent, DEFAULT_HOMEPAGE_CONTENT } from '../types/realestate';
import { apiFetch, readApiJson } from './api';

export async function fetchHomepageContent(): Promise<HomepageContent> {
  try {
    const res = await apiFetch('/api/homepage');
    if (!res.ok) {
      console.warn('Failed to load homepage content, using defaults', res.status);
      return DEFAULT_HOMEPAGE_CONTENT;
    }
    const data = await readApiJson<HomepageContent>(res);
    return {
      ...DEFAULT_HOMEPAGE_CONTENT,
      ...data,
    };
  } catch (err) {
    console.warn('Error fetching homepage content:', err);
    return DEFAULT_HOMEPAGE_CONTENT;
  }
}

export async function updateHomepageContent(
  updates: Partial<HomepageContent>
): Promise<HomepageContent> {
  const res = await apiFetch('/api/admin/homepage', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    let errMessage = `Failed to update homepage content (${res.status})`;
    try {
      const errData = await readApiJson<{ error?: string }>(res);
      if (errData && typeof errData === 'object' && 'error' in errData && errData.error) {
        errMessage = errData.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }

  return readApiJson<HomepageContent>(res);
}

