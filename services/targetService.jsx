/** @jsx React.createElement */
// 🚀 核心：数据服务层 - 负责 OpenTargets 数据的抓取与标准化

const OPENTARGETS_API_URL = "https://api.platform.opentargets.org/api/v4/graphql";

// 缓存器：防止用户切页面时重复请求，节省 API 消耗
const targetCache = new Map();

/**
 * 核心方法：获取关联靶点
 * @param {string} efoId - 疾病的 EFO 编号 (从页面组件传入)
 */
export const getDynamicTargets = async (efoId) => {
  if (!efoId) return [];
  if (targetCache.has(efoId)) return targetCache.get(efoId);

  try {
    const response = await fetch(OPENTARGETS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query GetDiseaseTargets { 
          disease(efoId: "${efoId}") { 
            name 
            associatedTargets(page:{size:25}){ 
              rows { 
                target { id approvedSymbol approvedName pathways { pathway } } 
                score 
                datatypeScores { id score } 
              } 
            } 
          } 
        }`
      })
    });

    const json = await response.json();
    const result = json.data?.disease?.associatedTargets?.rows || [];
    
    // 写入缓存
    targetCache.set(efoId, result);
    return result;
  } catch (e) {
    console.error("OpenTargets 数据获取失败:", e);
    return [];
  }
};

/**
 * 评分转换逻辑 (同步 Python 原始算法)
 * 将 0-1 的原始分转为 1-10 分制
 */
export const scoreTarget = (openTargetsScore = 0.5) => {
  return Math.min(10, Math.max(1, openTargetsScore * 10));
};

// 默认导出
const targetService = { getDynamicTargets, scoreTarget };
export default targetService;
