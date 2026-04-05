/**
 * 设备ID工具库
 * 用于在浏览器中生成和获取唯一的设备标识符
 */

/**
 * 获取或生成设备ID
 * 设备ID存储在LocalStorage中，用于识别用户设备
 * 如果用户清除浏览器数据，设备ID会丢失，需要通过兑换码重新同步数据
 *
 * @returns 设备ID字符串，格式：device-{timestamp}-{random}
 */
export function getDeviceId(): string {
  // 服务端渲染时返回空字符串
  if (typeof window === 'undefined') return '';

  const STORAGE_KEY = 'gokaku_device_id';

  try {
    // 尝试从LocalStorage获取现有设备ID
    let deviceId = localStorage.getItem(STORAGE_KEY);

    if (!deviceId) {
      // 生成新的设备ID
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      deviceId = `device-${timestamp}-${random}`;

      // 保存到LocalStorage
      localStorage.setItem(STORAGE_KEY, deviceId);

      console.log('[Device] 生成新设备ID:', deviceId);
    }

    return deviceId;
  } catch (error) {
    // LocalStorage被禁用或出错时，返回临时ID
    console.warn('[Device] LocalStorage不可用，使用临时ID');
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 清除设备ID（用于测试或用户主动清除）
 */
export function clearDeviceId(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('gokaku_device_id');
    console.log('[Device] 设备ID已清除');
  } catch (error) {
    console.warn('[Device] 清除设备ID失败:', error);
  }
}

/**
 * 检查是否有有效的设备ID
 */
export function hasDeviceId(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const deviceId = localStorage.getItem('gokaku_device_id');
    return !!deviceId && deviceId.startsWith('device-');
  } catch {
    return false;
  }
}
