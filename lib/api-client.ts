/**
 * API客户端工具
 * 自动添加设备ID到请求头
 */

import { getDeviceId } from './device';

/**
 * 带设备ID的fetch封装
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const deviceId = getDeviceId();

  const headers = new Headers(options?.headers);
  if (deviceId) {
    headers.set('x-device-id', deviceId);
  }

  return fetch(url, {
    ...options,
    headers,
    cache: 'no-store', // 禁用缓存，确保每次都是新请求
  });
}

/**
 * POST请求快捷方法
 */
export async function apiPost<T = any>(url: string, data: any): Promise<T> {
  const response = await apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

/**
 * GET请求快捷方法
 */
export async function apiGet<T = any>(url: string): Promise<T> {
  const response = await apiFetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

/**
 * DELETE请求快捷方法
 */
export async function apiDelete<T = any>(url: string): Promise<T> {
  const response = await apiFetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}
