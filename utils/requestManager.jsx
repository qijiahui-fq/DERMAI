/**
 * DermAI RequestManager (Production Ready)
 * 核心逻辑：自动缓存、并发合并、过期清理
 * 适配方案：直接浏览器运行，无需构建工具
 */
class RequestManager {
  constructor() {
    // 缓存池：存放已获取的数据及其时间戳
    this.cache = new Map();
    // 等待队列：存放正在进行的 Promise，防止同一时间重复请求服务器
    this.pendingRequests = new Map();
  }

  /**
   * 生成唯一的缓存识别键
   * @param {string} url 
   * @param {object} params 
   * @returns {string}
   */
  generateKey(url, params = {}) {
    try {
      // 这里的 JSON.stringify 确保了参数不同，缓存键就不同
      return `${url}_${JSON.stringify(params)}`;
    } catch (e) {
      console.warn("[RequestManager] 键生成失败，降级为 URL 键");
      return url;
    }
  }

  /**
   * 发送异步请求
   * @param {string} url 请求地址
   * @param {object} options fetch 配置项
   * @param {boolean} useCache 是否启用缓存
   * @param {number} cacheTTL 缓存有效期(毫秒)，默认1小时
   */
  async request(url, options = {}, useCache = true, cacheTTL = 3600000) {
    // 1. 生成本次请求的唯一标识
    const key = this.generateKey(url, { 
      method: options.method, 
      body: options.body 
    });

    // 2. 检查缓存是否命中且未过期
    if (useCache && this.cache.has(key)) {
      const cached = this.cache.get(key);
      const isExpired = Date.now() - cached.timestamp > cacheTTL;

      if (!isExpired) {
        console.log(`%c[DermAI Cache] 命中: ${url}`, "color: #10b981; font-weight: bold;");
        return cached.data;
      } else {
        console.log(`%c[DermAI Cache] 过期清理: ${url}`, "color: #f59e0b;");
        this.cache.delete(key);
      }
    }

    // 3. 检查是否有相同的请求正在进行中 (并发合并)
    if (this.pendingRequests.has(key)) {
      console.log(`%c[DermAI Pending] 并发合并，复用 Promise: ${url}`, "color: #3b82f6;");
      return this.pendingRequests.get(key);
    }

    // 4. 发起真正的网络请求
    const requestPromise = fetch(url, options)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP 异常! 状态码: ${res.status}`);
        }
        
        const data = await res.json();

        // 请求成功后存入缓存
        if (useCache) {
          this.cache.set(key, {
            data: data,
            timestamp: Date.now()
          });
        }
        return data;
      })
      .catch((err) => {
        // 请求失败，必须从 pending 队列移除，允许下次重试
        this.pendingRequests.delete(key);
        console.error(`[RequestManager] 请求失败: ${url}`, err);
        throw err;
      });

    // 将 Promise 存入等待队列
    this.pendingRequests.set(key, requestPromise);

    // 5. 无论请求成功还是失败，完成后从等待队列移除
    requestPromise.finally(() => {
      this.pendingRequests.delete(key);
    });

    return requestPromise;
  }

  /**
   * 手动清除特定缓存
   */
  clearCache(url, params = {}) {
    const key = this.generateKey(url, params);
    this.cache.delete(key);
    console.log(`[RequestManager] 已清除缓存: ${key}`);
  }

  /**
   * 彻底清空缓存池
   */
  clearAllCache() {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log("[RequestManager] 已清空全局缓存池");
  }
}

// 导出全局唯一的管理器实例 (单例模式)
export const requestManager = new RequestManager();
