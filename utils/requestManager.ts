class RequestManager {
  // 缓存已请求的数据
  private cache: Map<string, any> = new Map();
  // 存储正在进行的请求（防止并发重复请求）
  private pendingRequests: Map<string, Promise<any>> = new Map();

  // 生成唯一缓存键
  private generateKey(url: string, params: any = {}): string {
    return `${url}_${JSON.stringify(params)}`;
  }

  // 发送请求（带缓存）
  async request<T>(
    url: string,
    options: RequestInit = {},
    useCache = true,
    cacheTTL = 3600000 // 缓存1小时
  ): Promise<T> {
    // 生成缓存键
    const key = this.generateKey(url, { 
      method: options.method, 
      body: options.body 
    });

    // 1. 缓存命中：直接返回
    if (useCache && this.cache.has(key)) {
      const cached = this.cache.get(key);
      // 检查缓存是否过期
      if (Date.now() - cached.timestamp < cacheTTL) {
        return cached.data;
      } else {
        this.cache.delete(key); // 过期则删除
      }
    }

    // 2. 有正在进行的请求：等待结果
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // 3. 发起新请求
    const requestPromise = fetch(url, options)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // 存入缓存
        if (useCache) {
          this.cache.set(key, {
            data,
            timestamp: Date.now()
          });
        }
        return data;
      })
      .catch((err) => {
        this.pendingRequests.delete(key); // 失败时清除pending
        throw err;
      });

    // 记录pending请求
    this.pendingRequests.set(key, requestPromise);
    
    // 请求完成后清除pending
    requestPromise.finally(() => {
      this.pendingRequests.delete(key);
    });

    return requestPromise as Promise<T>;
  }

  // 清除指定缓存
  clearCache(url: string, params: any = {}) {
    const key = this.generateKey(url, params);
    this.cache.delete(key);
  }

  // 清空所有缓存
  clearAllCache() {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// 单例导出
export const requestManager = new RequestManager();