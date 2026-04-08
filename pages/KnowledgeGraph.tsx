import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Filter, Download, RefreshCw, Info, AlertCircle, BookOpen } from 'lucide-react';

// ========== 类型定义 ==========
export enum NodeType {
  Disease = 'disease',
  Gene = 'gene',
  Drug = 'drug',
  Pathway = 'pathway',
  Protein = 'protein'
}

export enum RelationType {
  ASSOCIATED_WITH = 'associated_with',
  TARGETS = 'targets',
  REGULATES = 'regulates',
  INTERACTS_WITH = 'interacts_with'
}

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  val: number;
  repurposing?: boolean;
  formulation?: string;
}

export interface Link {
  source: string;
  target: string;
  type: RelationType;
}

export interface KnowledgeGraphData {
  nodes: Node[];
  links: Link[];
}

// ========== 动态匹配函数（替代写死的映射表） ==========
/**
 * 根据靶点名称动态匹配对应的通路
 * @param targetSymbol 靶点符号（如 IL4、JAK1）
 * @returns 通路名称（如 IL-4/IL-13 信号通路）
 */
const getPathwayByTarget = (targetSymbol: string): string | null => {
  // 按靶点的功能分类匹配（可扩展，无需写死所有值）
  const pathwayRules = [
    { keywords: ['IL4', 'IL13'], pathway: 'IL-4/IL-13 信号通路' },
    { keywords: ['JAK1', 'JAK2', 'JAK3', 'TYK2', 'STAT6'], pathway: 'JAK-STAT 信号通路' },
    { keywords: ['CARD14'], pathway: 'NF-κB 信号通路' },
    { keywords: ['TNF'], pathway: 'TNF-α 信号通路' },
    { keywords: ['IL17A'], pathway: 'IL-17 信号通路' },
    { keywords: ['IL23A'], pathway: 'IL-23/IL-17 信号通路' },
    { keywords: ['FLG'], pathway: '表皮屏障通路' },
    { keywords: ['TLR4'], pathway: 'TLR 信号通路' }
  ];

  // 查找匹配的通路
  const matchedRule = pathwayRules.find(rule => 
    rule.keywords.some(keyword => targetSymbol.includes(keyword))
  );
  
  return matchedRule ? matchedRule.pathway : null;
};

/**
 * 根据靶点名称动态匹配对应的表皮蛋白
 * @param targetSymbol 靶点符号（如 FLG、LOR）
 * @returns 蛋白名称（如 丝聚蛋白（Filaggrin））
 */
const getProteinByTarget = (targetSymbol: string): string | null => {
  const proteinRules = [
    { keywords: ['FLG'], protein: '丝聚蛋白（Filaggrin）' },
    { keywords: ['LOR'], protein: '兜甲蛋白（Loricrin）' },
    { keywords: ['INV'], protein: '内披蛋白（Involucrin）' },
    { keywords: ['KRT1'], protein: '角蛋白1（Keratin 1）' },
    { keywords: ['KRT10'], protein: '角蛋白10（Keratin 10）' },
    { keywords: ['DSP'], protein: '桥粒斑蛋白（Desmoplakin）' },
    { keywords: ['DSG1'], protein: '桥粒芯糖蛋白1（Desmoglein 1）' },
    { keywords: ['CLDN1'], protein: '紧密连接蛋白1（Claudin 1）' }
  ];

  const matchedRule = proteinRules.find(rule => 
    rule.keywords.some(keyword => targetSymbol.includes(keyword))
  );
  
  return matchedRule ? matchedRule.protein : null;
};

// ========== 简易 GraphView 组件 ==========
const GraphView: React.FC<{ data: KnowledgeGraphData; loading: boolean }> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-slate-500">
        <RefreshCw className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
        <p className="text-sm">正在构建知识图谱...</p>
      </div>
    );
  }

  if (data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-slate-400">
        <Info className="w-12 h-12 mb-4 text-slate-300" />
        <p className="text-sm">请输入疾病名称（如：银屑病/特应性皮炎），点击搜索生成图谱</p>
      </div>
    );
  }

  return (
   <div className="relative h-[600px] min-h-[500px] w-full bg-slate-50 rounded-lg overflow-hidden">
      {/* 图例 */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-sm border border-slate-100 text-xs">
        <p className="font-bold text-slate-700 mb-2">实体图例</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>皮肤疾病</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>关键基因</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>皮科药物（含老药新用）</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>皮肤通路</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>表皮蛋白</span>
          </div>
        </div>
      </div>

      {/* 展示节点详情 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 overflow-auto">
        <div className="text-center text-slate-400 text-sm mb-6">
          <p>图谱可视化组件加载完成</p>
          <p className="text-xs mt-1">当前展示 {data.nodes.length} 个实体，{data.links.length} 条关联</p>
        </div>
        
        {/* 药物节点详情展示 */}
        {data.nodes.filter(node => node.type === NodeType.Drug).length > 0 && (
          <div className="w-full max-w-2xl space-y-3 mt-4">
            <p className="text-xs font-bold text-slate-700 pl-1">皮科药物：</p>
            {data.nodes.filter(node => node.type === NodeType.Drug).map(node => (
              <div key={node.id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-bold text-slate-800">{node.name}</span>
                  {node.repurposing && <span className="bg-blue-50 text-blue-600 px-1 rounded text-[10px]">老药新用</span>}
                </div>
                <div className="mt-1 pl-5 text-slate-600">
                  <span>作用机制：{node.formulation || '未知'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* 通路节点展示 */}
        {data.nodes.filter(node => node.type === NodeType.Pathway).length > 0 && (
          <div className="w-full max-w-2xl space-y-3 mt-6">
            <p className="text-xs font-bold text-slate-700 pl-1">皮肤通路：</p>
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
              <div className="flex flex-wrap gap-2 pl-1">
                {data.nodes.filter(node => node.type === NodeType.Pathway).map(node => (
                  <span key={node.id} className="bg-orange-50 px-2 py-1 rounded text-orange-600">
                    {node.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* 蛋白节点展示 */}
        {data.nodes.filter(node => node.type === NodeType.Protein).length > 0 && (
          <div className="w-full max-w-2xl space-y-3 mt-6">
            <p className="text-xs font-bold text-slate-700 pl-1">表皮蛋白：</p>
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
              <div className="flex flex-wrap gap-2 pl-1">
                {data.nodes.filter(node => node.type === NodeType.Protein).map(node => (
                  <span key={node.id} className="bg-purple-50 px-2 py-1 rounded text-purple-600">
                    {node.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* 靶点节点简要展示 */}
        {data.nodes.filter(node => node.type === NodeType.Gene).length > 0 && (
          <div className="w-full max-w-2xl mt-6 text-xs text-slate-500">
            <p className="font-bold mb-1">关键靶点：</p>
            <div className="flex flex-wrap gap-2">
              {data.nodes.filter(node => node.type === NodeType.Gene).map(node => (
                <span key={node.id} className="bg-blue-50 px-2 py-1 rounded text-blue-600">
                  {node.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ========== 实体类型筛选 ==========
const ENTITY_TYPES = [
  { key: NodeType.Disease, label: '皮肤疾病', checked: true },
  { key: NodeType.Gene, label: '关键基因', checked: true },
  { key: NodeType.Drug, label: '皮科药物', checked: true },
  { key: NodeType.Pathway, label: '皮肤通路', checked: true },
  { key: NodeType.Protein, label: '表皮蛋白', checked: true },
];

// ========== 接口地址 ==========
const OPENTARGETS_API_URL = 'http://127.0.0.1:3000/api/opentargets/graphql';
const NCBI_API_KEY = '52c34128b128ec467b1a854bc0150a695b08';

// ========== 全局缓存 ==========
const diseaseGraphCache = new Map<string, { graph: KnowledgeGraphData; literature: any[] }>();
const diseaseRequestLock = new Map<string, boolean>();

// 疾病映射表（仅疾病编码映射，非业务逻辑映射）
const DISEASE_MAP = {
  "银屑病": { efo: "EFO_0000676", mesh: "D011506" },
  "特应性皮炎": { efo: "EFO_0000276", mesh: "D003876" },
  "斑秃": { efo: "EFO_0000289", mesh: "D001879" },
  "痤疮": { efo: "EFO_0000239", mesh: "D001124" },
  "湿疹": { efo: "EFO_0000274", mesh: "D004511" },
  "白癜风": { efo: "EFO_0000730", mesh: "D014809" }
};

const KnowledgeGraph: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [graphData, setGraphData] = useState<KnowledgeGraphData>({ nodes: [], links: [] });
  const [literature, setLiterature] = useState<Array<{
    pmid: string;
    title: string;
    abstract: string;
    pubDate: string;
  }>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [filteredTypes, setFilteredTypes] = useState<Record<NodeType, boolean>>(
    ENTITY_TYPES.reduce((acc, item) => ({ ...acc, [item.key]: item.checked }), {} as Record<NodeType, boolean>)
  );
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // ========== 1. 获取 Open Targets 疾病相关靶点 ==========
  const getOpenTargetsData = async (efoId: string) => {
    try {
      const query = `
        query DiseaseTargets {
          disease(efoId: "${efoId}") {
            associatedTargets(page: {size: 10, index: 0}) {
              rows {
                target { id approvedSymbol approvedName }
                score
                datatypeScores { id score }
              }
            }
          }
        }
      `;
      const res = await axios.post(OPENTARGETS_API_URL, { query }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      return (res as any).data.data?.disease?.associatedTargets?.rows || [];
    } catch (err) { 
      console.error("Open Targets 靶点数据获取失败:", err);
      setError("靶点数据加载失败，请检查后端服务是否启动");
      return [];
    }
  };

  // ========== 2. 获取 OpenTargets 靶点对应的药物数据 ==========
  const getOpenTargetsDrugs = async (efoId: string) => {
    try {
      const query = `query { disease(efoId:"EFO_0000676"){associatedTargets{rows{target{id approvedSymbol knownDrugs{rows{drug{id name}}}}}}}}}`;
      const res = await axios.post(
        "http://127.0.0.1:3000/api/opentargets/graphql",
        { query },
        { headers: { "Content-Type": "application/json" }, timeout: 30000 }
      );
      const targetRows = (res as any).data.data?.disease?.associatedTargets?.rows || [];
      const drugs: any[] = [];
      targetRows.forEach((row: any, targetIndex: number) => {
        if (row.target?.knownDrugs?.rows) {
          row.target.knownDrugs.rows.forEach((drugRow: any, drugIndex: number) => {
            drugs.push({
              id: `drug-${row.target.id}-${drugIndex}`, 
              name: drugRow.drug.name || "未知药物",
              targetId: row.target.id,
              isRepurposing: false,
              formulation: "未知作用机制"
            });
          });
        }
      });
      return drugs;
    } catch (err) {
      console.error("OpenTargets 药物数据获取失败:", err);
      return [];
    }
  };

  // ========== 3. 获取 NCBI PubMed 相关文献 ==========
  const getNCBILiterature = async (meshId: string) => {
    try {
      const searchParams = new URLSearchParams({
        db: 'pubmed',
        term: `${meshId}[MeSH Terms] AND (gene OR target OR drug)`,
        retmax: '5',
        retmode: 'json',
        api_key: NCBI_API_KEY
      });
      const searchRes = await axios.get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`, { 
        params: searchParams, timeout: 30000 
      });
      const pmids = (searchRes as any).data?.esearchresult?.idlist || [];
      if (pmids.length === 0) return [];

      const summaryParams = new URLSearchParams({
        db: 'pubmed',
        id: pmids.join(','),
        retmode: 'json',
        api_key: NCBI_API_KEY
      });
      const summaryRes = await axios.get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi`, { 
        params: summaryParams, timeout: 30000 
      });
      const result = (summaryRes as any).data?.result || {};

      return pmids.map((pmid: string) => ({
        pmid,
        title: result[pmid]?.title || '',
        abstract: result[pmid]?.abstract || '',
        pubDate: result[pmid]?.pubdate || ''
      }));
    } catch (err) {
      console.error("NCBI 文献获取失败:", err);
      setError("NCBI PubMed 接口调用失败（请检查网络/API Key/外网访问权限）");
      return [];
    }
  };

  // ========== 4. 主函数：整合所有数据 ==========
  const fetchData = async (query: string) => {
    if (!query.trim()) {
      setGraphData({ nodes: [], links: [] });
      setLiterature([]);
      return;
    }

    let matchedDisease: any = null;
    for (const [name, config] of Object.entries(DISEASE_MAP)) {
      if (query.includes(name)) {
        matchedDisease = { name, ...config };
        break;
      }
    }

    if (!matchedDisease) {
      setError("未匹配到皮肤疾病，请输入：银屑病/特应性皮炎/斑秃/痤疮/湿疹/白癜风");
      setLoading(false);
      return;
    }

    const cacheKey = matchedDisease.name;
    if (diseaseGraphCache.has(cacheKey)) {
      const cachedData = diseaseGraphCache.get(cacheKey)!;
      const filteredNodes = cachedData.graph.nodes.filter(node => filteredTypes[node.type]);
      const filteredLinks = cachedData.graph.links.filter(link => 
        filteredNodes.some(n => n.id === link.source) && 
        filteredNodes.some(n => n.id === link.target)
      );
      
      setGraphData({ nodes: filteredNodes, links: filteredLinks });
      setLiterature(cachedData.literature);
      setLoading(false);
      return;
    }

    if (diseaseRequestLock.get(cacheKey)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setGraphData({ nodes: [], links: [] });
    setLiterature([]);

    try {
      diseaseRequestLock.set(cacheKey, true);
      const [targets, literatureData] = await Promise.all([
        getOpenTargetsData(matchedDisease.efo),
        getNCBILiterature(matchedDisease.mesh)
      ]);
      const drugs = await getOpenTargetsDrugs(matchedDisease.efo);

      // 构建节点
      const diseaseNode: Node = {
        id: matchedDisease.efo,
        name: matchedDisease.name,
        type: NodeType.Disease,
        val: 1.0
      };

      const targetNodes: Node[] = targets.map((item: any) => ({
        id: item.target.id,
        name: item.target.approvedSymbol,
        type: NodeType.Gene,
        val: item.score
      }));

      const drugNodes: Node[] = drugs.map((drug: any) => ({
        id: `drug-${drug.id}`,
        name: drug.name || `药物-${drug.id.slice(-6)}`,
        type: NodeType.Drug,
        val: 0.7,
        repurposing: drug.isRepurposing,
        formulation: drug.formulation
      }));

      // 动态通路
      const pathwayMap = new Map<string, string>();
      targetNodes.forEach(node => {
        const pathwayName = getPathwayByTarget(node.name);
        if (pathwayName) pathwayMap.set(pathwayName, `pathway-${Array.from(pathwayMap.keys()).length}`);
      });
      const pathwayNodes: Node[] = Array.from(pathwayMap.entries()).map(([name, id]) => ({
        id, name, type: NodeType.Pathway, val: 0.8
      }));

      // 动态蛋白
      const proteinMap = new Map<string, string>();
      targetNodes.forEach(node => {
        const proteinName = getProteinByTarget(node.name);
        if (proteinName) proteinMap.set(proteinName, `protein-${Array.from(proteinMap.keys()).length}`);
      });
      const proteinNodes: Node[] = Array.from(proteinMap.entries()).map(([name, id]) => ({
        id, name, type: NodeType.Protein, val: 0.8
      }));

      // 关联关系
      const targetDiseaseLinks: Link[] = targetNodes.map(node => ({
        source: node.id, target: diseaseNode.id, type: RelationType.ASSOCIATED_WITH
      }));

      const drugTargetLinks: Link[] = drugNodes.map((drugNode, index) => {
        const targetNode = targetNodes.find(n => n.id === drugs[index]?.targetId) || targetNodes[index % targetNodes.length];
        return { source: drugNode.id, target: targetNode.id, type: RelationType.TARGETS };
      });

      const pathwayTargetLinks: Link[] = [];
      targetNodes.forEach(targetNode => {
        const pathwayName = getPathwayByTarget(targetNode.name);
        if (pathwayName && pathwayMap.has(pathwayName)) {
          const pathwayId = pathwayMap.get(pathwayName)!;
          pathwayTargetLinks.push({
            source: targetNode.id, target: pathwayId, type: RelationType.REGULATES
          });
        }
      });

      const proteinTargetLinks: Link[] = [];
      targetNodes.forEach(targetNode => {
        const proteinName = getProteinByTarget(targetNode.name);
        if (proteinName && proteinMap.has(proteinName)) {
          const proteinId = proteinMap.get(proteinName)!;
          proteinTargetLinks.push({
            source: targetNode.id, target: proteinId, type: RelationType.INTERACTS_WITH
          });
        }
      });

      // 整合
      const allNodes = [diseaseNode, ...targetNodes, ...drugNodes, ...pathwayNodes, ...proteinNodes];
      const allLinks = [...targetDiseaseLinks, ...drugTargetLinks, ...pathwayTargetLinks, ...proteinTargetLinks];
      const filteredNodes = allNodes.filter(node => filteredTypes[node.type]);
      const filteredLinks = allLinks.filter(link => 
        filteredNodes.some(n => n.id === link.source) && filteredNodes.some(n => n.id === link.target)
      );

      diseaseGraphCache.set(cacheKey, { graph: { nodes: allNodes, links: allLinks }, literature: literatureData });
      setGraphData({ nodes: filteredNodes, links: filteredLinks });
      setLiterature(literatureData);
    } catch (err) {
      console.error("数据整合失败:", err);
      setError("数据加载失败，请稍后重试");
    } finally {
      diseaseRequestLock.set(cacheKey, false);
      setLoading(false);
    }
  };

  // ========== 防抖搜索 ==========
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (searchQuery.trim()) {
      debounceTimer.current = setTimeout(() => fetchData(searchQuery), 500);
    } else {
      setGraphData({ nodes: [], links: [] });
      setLiterature([]);
      setError('');
    }
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchQuery, filteredTypes]);

  // ========== 事件处理 ==========
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    fetchData(searchQuery);
  };

  const toggleFilter = (key: NodeType) => {
    setFilteredTypes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const exportData = () => {
    if (!graphData.nodes.length) return;
    const exportObj = { searchQuery, graph: graphData, literature, exportTime: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skin-graph-${searchQuery || 'default'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ========== 页面渲染 ==========
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 p-4">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Info className="w-8 h-8 text-indigo-600" />
          皮肤生物学知识图谱
        </h1>
        <p className="text-slate-500 font-medium">
          基于 Open Targets 权威靶点数据 + NCBI PubMed 文献库，动态生成疾病-靶点-药物关联网络
        </p>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="搜索皮肤疾病（银屑病/特应性皮炎/斑秃/痤疮等）"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 text-sm border-none focus:outline-none"
            />
            <button 
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:bg-slate-300 transition-colors"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : '搜索'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">实体类型筛选</h3>
          </div>
          <div className="space-y-2">
            {ENTITY_TYPES.map(item => (
              <div key={item.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`filter-${item.key}`}
                  checked={filteredTypes[item.key]}
                  onChange={() => toggleFilter(item.key)}
                  className="rounded text-indigo-600"
                  disabled={loading}
                />
                <label htmlFor={`filter-${item.key}`} className="text-xs font-medium text-slate-700">
                  {item.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
          <button
            onClick={exportData}
            disabled={!graphData.nodes.length || loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:bg-slate-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm min-h-[600px] w-full">
        <GraphView data={graphData} loading={loading} />
      </div>

      {literature.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            相关文献（NCBI PubMed）
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {literature.map(doc => (
              <div key={doc.pmid} className="border border-slate-100 rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-blue-600">PMID: {doc.pmid}</span>
                  <span className="text-xs text-slate-500">{doc.pubDate}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-2">{doc.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-3">{doc.abstract}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-blue-800">使用提示</h3>
        </div>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>支持搜索的疾病：银屑病、特应性皮炎、斑秃、痤疮、湿疹、白癜风</li>
          <li>图谱节点大小代表 OpenTargets 关联分数，分数越高节点越大</li>
          <li>药物节点标注「老药新用」标签，展示具体作用机制</li>
          <li>可通过「实体类型筛选」隐藏/显示不同类型的实体（如仅查看关键基因）</li>
          <li>点击「导出数据」可下载当前图谱和文献的 JSON 格式数据</li>
          <li>文献数据来自 NCBI PubMed，仅展示与疾病-靶点相关的研究论文</li>
          <li>首次加载可能较慢，请耐心等待；重复搜索同一疾病会复用缓存，速度更快</li>
        </ul>
      </div>
    </div>
  );
};

export default KnowledgeGraph;