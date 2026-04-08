/**
 * 知识图谱实体类型枚举
 * 匹配前端图谱展示的节点类型
 */
export enum NodeType {
  Disease = 'Disease',       // 疾病节点（如银屑病、特应性皮炎）
  Gene = 'Gene',             // 基因/靶点节点（如IL17A、TNF）
  Drug = 'Drug',             // 药物节点（如生物制剂、小分子药）
  Pathway = 'Pathway',       // 通路节点（如炎症通路、免疫通路）
  Protein = 'Protein'        // 蛋白节点（如表皮蛋白、细胞因子）
}

/**
 * 知识图谱关系类型枚举
 * 描述节点之间的关联关系
 */
export enum RelationType {
  ASSOCIATED_WITH = 'ASSOCIATED_WITH', // 疾病-靶点关联
  TARGETS = 'TARGETS',                 // 药物-靶点靶向关系
  TREATS = 'TREATS',                   // 药物-疾病治疗关系
  PART_OF = 'PART_OF',                 // 基因/蛋白-通路归属关系
  INTERACTS_WITH = 'INTERACTS_WITH',   // 蛋白/基因互作关系
  REGULATES = 'REGULATES'              // 基因/蛋白调控关系
}

/**
 * 知识图谱节点接口
 * 所有图谱节点的基础结构
 */
export interface Node {
  id: string;               // 唯一标识（如EFO ID、基因ID、药物ID）
  name: string;             // 显示名称（如"银屑病"、"IL17A"）
  type: NodeType;           // 节点类型（对应NodeType枚举）
  val?: number;             // 相关性分数（可选，0-1或0-100）
}

/**
 * 知识图谱链接接口
 * 描述两个节点之间的关系
 */
export interface Link {
  source: string;           // 源节点ID（对应Node.id）
  target: string;           // 目标节点ID（对应Node.id）
  type: RelationType;       // 关系类型（对应RelationType枚举）
}

/**
 * ✅ 新增：OpenTargets原始数据接口（匹配后端返回格式）
 * 用于解析后端/api/opentargets/v4/graphql返回的数据
 */
export interface OpenTargetsTarget {
  target: {
    id: string;
    approvedSymbol: string;
    approvedName: string;
    uniprotId: string;
  };
  score: number;
  datatypeScores: {
    genetics: {
      score: number;
      description: string;
    };
    expression: {
      score: number;
      description: string;
    };
    clinical: {
      score: number;
      description: string;
    };
  };
}

/**
 * ✅ 新增：OpenTargets接口完整响应（匹配后端/api/all-targets返回格式）
 */
export interface OpenTargetsResponse {
  code: number;
  message: string;
  data: {
    targets: OpenTargetsTarget[];
  };
}

/**
 * 靶点候选对象接口
 * 包含靶点的详细评分和证据信息
 */
export interface TargetCandidate {
  geneSymbol: string;       // 基因符号（如IL17A、TNF）
  uniprotId: string;        // 蛋白数据库ID
  score: number;            // 综合评分（0-1）
  scoreBreakdown: {
    genetics: number;       // 遗传学证据评分（0.0 - 1.0）
    expression: number;     // 表达证据评分（0.0 - 1.0）
    clinical: number;       // 临床证据评分（0.0 - 1.0）
  };
  scoreBasis: {
    genetics: string;       // 遗传学证据说明
    expression: string;     // 表达证据说明
    clinical: string;       // 临床证据说明
  };
  rationale: string;        // 靶点合理性说明
  evidenceLinks: {          // 证据链接列表
    title: string;          // 证据标题
    source: string;         // 证据来源（如PubMed、Open Targets）
    url: string;            // 证据链接地址
  }[];
  associatedDrugs: string[];// 关联药物列表（药物名称）
  pathways: string[];       // 所属通路列表（通路名称）
}

/**
 * 发现结果响应接口
 * 疾病-靶点分析的完整响应结构
 */
export interface DiscoveryResponse {
  disease: string;          // 疾病名称（如"银屑病"）
  summary: string;          // 分析总结
  targets: TargetCandidate[]; // 靶点候选列表
}

/**
 * 知识图谱数据接口
 * 图谱展示所需的核心数据结构
 */
export interface KnowledgeGraphData {
  nodes: Node[];            // 节点列表
  links: Link[];            // 链接列表
}

/**
 * ✅ 新增：PubMed文献接口（匹配后端返回格式）
 */
export interface PubMedArticle {
  pmid: string;
  title: string;
  abstract: string;
  url: string;
}

/**
 * ✅ 新增：Minimax打分响应接口
 */
export interface ScoreResponse {
  code: number;
  message: string; // 补充：后端返回的提示信息（如"success"）
  data: {
    target_name: string;
    score: number;
  };
}

/**
 * 全局Window扩展
 * 适配AI Studio环境的API Key选择功能
 */
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>; // 检查是否已选择API Key
      openSelectKey: () => Promise<void>;        // 打开API Key选择弹窗
    };
    API_BASE_URL: string; // 补充：全局API基础路径（App.tsx中定义）
    apiRequest?: <T>(endpoint: string, options?: RequestInit) => Promise<T>; // 补充：全局请求函数
  }
}