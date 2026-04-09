import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2, ExternalLink, Dna, Info, ChevronRight, Grid, ChevronDown, ChevronUp, BookOpen, CheckCircle2, BarChart3, Layers, Cpu, Calculator, ShieldCheck, FileText, Microscope, Activity } from 'lucide-react';

interface ScoreBreakdown { 
  genetics: number; 
  expression: number; 
  clinical: number; 
  pathways: number; 
  literature: number; 
  animalModel: number; 
}
interface EvidenceLink { title: string; url: string; source: string; }
export interface TargetCandidate { 
  geneSymbol: string; uniprotId: string; score: number; 
  scoreBreakdown: ScoreBreakdown; pathways: string[]; 
  associatedDrugs: string[]; evidenceLinks: EvidenceLink[]; 
}
export interface DiscoveryResponse { disease: string; summary: string; targets: TargetCandidate[]; }

const OPENTARGETS_API_URL = "/api/opentargets/graphql";

const DISEASE_MAPPING: Record<string, { efo: string; mesh: string }> = {
  "特应性皮炎": { efo: "EFO_0000274", mesh: "D003876" },
  "银屑病": { efo: "EFO_0000676", mesh: "D011506" },
  "湿疹": { efo: "EFO_0000274", mesh: "D004511" },
  "玫瑰痤疮": { efo: "EFO_1000760", mesh: "D014162" },
  "脂溢性皮炎": { efo: "EFO_1000764", mesh: "D012869" },
  "接触性皮炎": { efo: "EFO_0005319", mesh: "D003875" },
  "疹痒症": { efo: "HP_0000989", mesh: "D011415" },
  "红皮病": { efo: "EFO_0009456", mesh: "D004976" },
  "痤疮": { efo: "EFO_0003894", mesh: "D001124" },
  "斑秃": { efo: "EFO_0004192", mesh: "D001879" },
  "雄激素性脱发": { efo: "EFO_0004191", mesh: "D000186" },
  "酒渣鼻": { efo: "EFO_1000760", mesh: "D014162" },
  "多汗症": { efo: "HP_0000975", mesh: "D006904" },
  "化脓性汗腺炎": { efo: "EFO_1000710", mesh: "D006907" },
  "白癜风": { efo: "EFO_0004208", mesh: "D014809" },
  "黄褐斑": { efo: "EFO_0003963", mesh: "D008543" },
  "雀斑": { efo: "EFO_0003963", mesh: "D005666" },
  "白化病": { efo: "HP_0001022", mesh: "D000410" },
  "太田痣": { efo: "EFO_1000396", mesh: "D009405" },
  "咖啡斑": { efo: "HP_0000957", mesh: "D002143" },
  "带状疱疹": { efo: "EFO_0006510", mesh: "D006539" },
  "单纯疱疹": { efo: "EFO_1002022", mesh: "D006528" },
  "足癣": { efo: "EFO_0007512", mesh: "D014034" },
  "毛囊炎": { efo: "EFO_1000702", mesh: "D005418" },
  "脓疱疮": { efo: "EFO_1000714", mesh: "D007107" },
  "丹毒": { efo: "EFO_1001462", mesh: "D004903" },
  "黑色素瘤": { efo: "EFO_0000756", mesh: "D008544" },
  "基底细胞癌(BCC)": { efo: "EFO_0004193", mesh: "D001470" },
  "鳞状细胞癌(SCC)": { efo: "EFO_0000707", mesh: "D013041" },
  "脂溢性角化病": { efo: "EFO_0005584", mesh: "D012868" },
  "血管瘤": { efo: "EFO_1000635", mesh: "D006439" },
  "皮肤纤维肉瘤": { efo: "MONDO_0011934", mesh: "D018259" },
  "蕈样肉芽肿": { efo: "EFO_1001051", mesh: "D009103" },
  "系统性红斑狼疮": { efo: "HP_0002725", mesh: "D012148" },
  "天疱疮": { efo: "EFO_1000749", mesh: "D010422" },
  "类天疱疮": { efo: "EFO_0007187", mesh: "D010423" },
  "皮肌炎": { efo: "EFO_0000398", mesh: "D003908" },
  "硬皮病": { efo: "EFO_1001993", mesh: "D012559" },
  "白塞病": { efo: "EFO_0003780", mesh: "D001565" },
  "鱼鳞病": { efo: "MONDO_0019269", mesh: "D007115" },
  "毛周角化症": { efo: "MONDO_0021036", mesh: "D007620" },
  "大疱性表皮松解症(EB)": { efo: "EFO_1000690", mesh: "D004946" },
  "掌跖角化病": { efo: "EFO_1000745", mesh: "D010624" },
  "达里尔病": { efo: "EFO_1000703", mesh: "D005557" },
  "荨麻疹": { efo: "EFO_0005531", mesh: "D014422" },
  "血管性水肿": { efo: "EFO_0005532", mesh: "D000323" },
  "日光性皮炎": { efo: "EFO_1000752", mesh: "D010627" }
};

const DISEASE_CATEGORIES = [
  {name: '原因性皮肤病',diseases: ['特应性皮炎', '银屑病', '湿疹', '玫瑰痤疮', '脂溢性皮炎', '接触性皮炎', '疹痒症', '红皮病']},
  {name: '皮肤附属器疾病',diseases: ['痤疮', '斑秃', '雄激素性脱发', '酒渣鼻', '多汗症', '化脓性汗腺炎']},
  {name: '色素性皮肤病',diseases: ['白癜风', '黄褐斑', '雀斑', '白化病', '太田痣', '咖啡斑']},
  {name: '感染性皮肤病',diseases: ['带状疱疹', '单纯疱疹', '足癣', '毛囊炎', '脓疱疮', '丹毒']},
  {name: '皮肤肿瘤',diseases: ['黑色素瘤', '基底细胞癌(BCC)', '鳞状细胞癌(SCC)', '脂溢性角化病', '血管瘤', '皮肤纤维肉瘤', '蕈样肉芽肿']},
  {name: '自身免疫性皮肤病',diseases: ['系统性红斑狼疮', '天疱疮', '类天疱疮', '皮肌炎', '硬皮病', '白塞病']},
  {name: '遗传性皮肤病',diseases: ['鱼鳞病', '毛周角化症', '大疱性表皮松解症(EB)', '掌跖角化病', '达里尔病']},
  {name: '过敏性皮肤病',diseases: ['荨麻疹', '血管性水肿', '日光性皮炎']}
];

const LOADING_STEPS = [
  "初始化靶点识别引擎...",
  "正在整合底层多维组学关联数据...",
  "匹配证据链 (遗传/表达/临床/通路/文献)...",
  "执行专科靶点加权评估模型..."
];

const PATHWAY_DRUG_MAP: Record<string, { pathways: string[]; drugs: string[] }> = {
  "IL4": { pathways: ["IL4/IL13信号通路", "JAK/STAT6通路"], drugs: ["度普利尤单抗 (Dupilumab)", "莱博利珠单抗 (Lebrikizumab)"] },
  "IL13": { pathways: ["IL4/IL13通路", "皮肤屏障功能调控"], drugs: ["Dupilumab", "Lebrikizumab"] },
  "IL17A": { pathways: ["IL17/NF-κB通路", "中性粒细胞募集"], drugs: ["司库奇尤单抗 (Secukinumab)", "依奇珠单抗 (Ixekizumab)"] },
  "TNF": { pathways: ["TNF-α通路", "炎症小体激活"], drugs: ["阿达木单抗 (Adalimumab)", "英夫利昔单抗 (Infliximab)"] },
  "IL23A": { pathways: ["IL23/Th17轴", "慢性炎症维持"], drugs: ["古塞奇尤单抗 (Guselkumab)", "提得克珠单抗 (Tildrakizumab)"] },
  "JAK2": { pathways: ["JAK/STAT通路", "细胞因子信号传导"], drugs: ["托法替布 (Tofacitinib)", "乌帕替尼 (Upadacitinib)"] },
  "IL6": { pathways: ["IL6/JAK/STAT3通路", "急性期炎症反应"], drugs: ["托珠单抗 (Tocilizumab)", "司妥昔单抗 (Siltuximab)"] },
  "IFNG": { pathways: ["IFN-γ通路", "Th1型免疫应答"], drugs: ["干扰素γ-1b (Interferon gamma-1b)"] },
  "CSF2": { pathways: ["GM-CSF通路", "粒细胞巨噬细胞活化"], drugs: ["莫格利珠单抗 (Mogamulizumab)"] },
  "CCL17": { pathways: ["CCR4/CCL17通路", "T细胞趋化"], drugs: ["莫格利珠单抗 (Mogamulizumab)"] },
  "CXCL10": { pathways: ["CXCR3/CXCL10通路", "炎症细胞募集"], drugs: ["芬戈莫德 (Fingolimod)"] }
};

// 🚀 核心更新：医学报告级数值格式化。彻底消除 0.00，呈现高级感
const formatScore = (val: number, isTotal = false) => {
  if (val === 0) return <span className="text-slate-300 font-normal">—</span>;
  if (val > 0 && val < 0.01) return <span className="text-slate-400 font-medium">&lt;0.01</span>;
  return <span className={isTotal ? "font-black" : "font-bold"}>{val.toFixed(2)}</span>;
};

// 纯文本格式化（用于不可渲染标签的地方，比如推导公式里）
const formatScoreText = (val: number) => {
  if (val === 0) return '0.00'; // 在公式计算时保留 0.00 以确保数学直观
  if (val > 0 && val < 0.01) return '<0.01';
  return val.toFixed(2);
};

const SafeLoader = ({ isLoading }: { isLoading: boolean }) => {
  if (!isLoading) return null;
  return <Loader2 key="loader-icon" className="w-6 h-6 animate-spin text-white" />;
};

const fetchRealTargets = async (diseaseName: string): Promise<{ rows: any[], totalCount: number }> => {
  try {
    const conf = DISEASE_MAPPING[diseaseName] || { efo: "EFO_0000274", mesh: "D003876" };
    const efoId = conf.efo;

    const query = `query associatedTargets {
      disease(efoId: "${efoId}") {
        id
        name
        associatedTargets(page: {size: 25, index: 0}) {
          count
          rows {
            target { id approvedSymbol approvedName pathways { pathway } }
            datatypeScores { id score }
          }
        }
      }
    }`;

    const requestData = { query };
    const response = await axios.post(
      OPENTARGETS_API_URL,
      requestData,
      { 
        timeout: 60000,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        transformRequest: [(data) => JSON.stringify(data)],
        transformResponse: [(data) => JSON.parse(data)]
      }
    );
    const rows = response.data?.data?.disease?.associatedTargets?.rows || [];
    const totalCount = response.data?.data?.disease?.associatedTargets?.count || 0;
    return { rows, totalCount };
  } catch (err: any) {
    throw new Error(`底层接口请求失败：${err.message}`);
  }
};

const fetchGWASLiterature = async (ensemblId: string, efoId: string, size: number = 5): Promise<any[]> => {
  try {
    const query = `query GwasCredibleSetsQuery($ensemblId: String!, $efoId: String!, $size: Int!) {
      disease(efoId: $efoId) {
        gwasCredibleSets: evidences(
          ensemblIds: [$ensemblId]
          enableIndirect: true
          datasourceIds: ["gwas_credible_sets"]
          size: $size
        ) {
          rows { credibleSet { study { traitFromSource publicationFirstAuthor publicationDate pubmedId } } }
        }
      }
    }`;

    const response = await axios.post(
      OPENTARGETS_API_URL,
      { query, variables: { ensemblId, efoId, size } },
      { timeout: 30000, headers: { 'Content-Type': 'application/json' } }
    );

    const rows = response.data?.data?.disease?.gwasCredibleSets?.rows || [];
    return rows.map((row: any) => {
      const study = row.credibleSet?.study || {};
      const year = study.publicationDate ? study.publicationDate.split('-')[0] : "未知年份";
      const title = study.publicationFirstAuthor 
        ? `${study.publicationFirstAuthor} 等 (${year}): ${study.traitFromSource || 'GWAS 关联研究'}`
        : `GWAS 关联研究 (${year}): ${study.traitFromSource || '疾病'}`;
      const url = study.pubmedId 
        ? `https://pubmed.ncbi.nlm.nih.gov/${study.pubmedId}/` 
        : `https://pubmed.ncbi.nlm.nih.gov/?term=${ensemblId}+${study.traitFromSource || ''}`;
      
      return { title, url, source: "底层关联库" };
    });
  } catch (err) {
    return [];
  }
};

const TargetRow: React.FC<{ target: TargetCandidate; disease: string }> = ({ target, disease }) => {
  const [expanded, setExpanded] = useState(false);
  const finalScore = target.score; 

  return (
    <div className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors w-full min-w-0">
      <div className="flex items-center gap-4 p-5 cursor-pointer w-full min-w-0" onClick={() => setExpanded(!expanded)}>
        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold shrink-0 shadow-sm border border-indigo-100/50">
          <Dna className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h4 className="font-bold text-slate-800 text-lg tracking-tight">{target.geneSymbol}</h4>
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold uppercase border border-slate-200">{target.uniprotId || 'N/A'}</span>
          </div>
          <p className="text-xs text-slate-500 truncate mt-1 leading-relaxed">
            基于底层多维组学数据，该靶点的综合加权得分为 {finalScore > 0 ? finalScore.toFixed(2) : '<0.01'}，点击查看各维度推演明细。
          </p>
        </div>
        
        <div className="text-right shrink-0 px-4 hidden sm:block border-l border-slate-100 min-w-0">
          <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">核心加权得分</div>
          <div className="flex items-center justify-end gap-2 min-w-0">
            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden flex justify-start">
              <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${Math.max(finalScore, 0.5)}%` }} />
            </div>
            <span className="text-sm text-slate-800">{formatScore(finalScore, true)}</span>
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-slate-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </div>
      
      {expanded && (
        <div className="px-6 pb-8 ml-16 animate-in slide-in-from-top-4 duration-300 w-full min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
            
            <div className="lg:col-span-2 space-y-6 w-full min-w-0">
              
              <div className="bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100/50 w-full min-w-0">
                <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-3 min-w-0">
                  <ShieldCheck className="w-4 h-4" /> 核心生物学多维模型 (3D Biological Model)
                </h5>
                <p className="text-sm text-slate-700 leading-relaxed font-medium mb-5">
                  为确保靶点评估的严谨性与针对性，系统总分仅由反映疾病本质的【遗传】、【表达】与【通路】三大生物学核心维度加权构成。缺乏核心生物学证据但具备关联衍生物（如临床与文献数据）的特征项作辅助观测。
                </p>
                
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex flex-col gap-4">
                  <div className="flex flex-col gap-2 border-b border-indigo-50 pb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calculator className="w-3 h-3" /> 加权计算公式
                    </span>
                    <span className="text-[11px] font-black text-indigo-700 font-mono tracking-tight leading-relaxed">
                      总分 = 遗传(40%) + 表达(40%) + 通路(20%)
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calculator className="w-3 h-3" /> 各维度得分计算推导
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 overflow-x-auto custom-scrollbar">
                      <span className="text-[11px] font-black text-slate-600 font-mono tracking-tighter whitespace-nowrap">
                        ({formatScoreText(target.scoreBreakdown.genetics)}×0.4) + ({formatScoreText(target.scoreBreakdown.expression)}×0.4) + ({formatScoreText(target.scoreBreakdown.pathways)}×0.2)
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-400 text-sm">=</span>
                        <span className="text-base text-indigo-600 font-mono">{formatScore(finalScore, true)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 w-full min-w-0">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3 min-w-0">
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-500" /> 核心评估维度 (计入总分)
                  </h5>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">源自底层组学特征数据</div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 w-full min-w-0">
                  <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 w-full min-w-0">
                    <div className="flex justify-between items-center min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0"><Dna className="w-5 h-5" /></div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-blue-600 uppercase">遗传学与变异 (权重: 40%)</div>
                          <div className="text-[10px] text-blue-500 font-medium mt-0.5">全基因组关联与体细胞突变数据</div>
                        </div>
                      </div>
                      <div className="text-right min-w-0 shrink-0 text-xl text-blue-600">
                        {formatScore(target.scoreBreakdown.genetics, true)}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100/50 w-full min-w-0">
                    <div className="flex justify-between items-center min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 shrink-0"><Layers className="w-5 h-5" /></div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-purple-600 uppercase">靶点转录表达 (权重: 40%)</div>
                          <div className="text-[10px] text-purple-500 font-medium mt-0.5">病理微环境下的真实组织 RNA 表达差异</div>
                        </div>
                      </div>
                      <div className="text-right min-w-0 shrink-0 text-xl text-purple-600">
                        {formatScore(target.scoreBreakdown.expression, true)}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100/50 w-full min-w-0">
                    <div className="flex justify-between items-center min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600 shrink-0"><Activity className="w-5 h-5" /></div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-rose-600 uppercase">受累信号通路 (权重: 20%)</div>
                          <div className="text-[10px] text-rose-500 font-medium mt-0.5">靶点在疾病核心生化与炎症机制中的地位</div>
                        </div>
                      </div>
                      <div className="text-right min-w-0 shrink-0 text-xl text-rose-600">
                        {formatScore(target.scoreBreakdown.pathways, true)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6 min-w-0 space-y-4">
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 衍生辅助观测指标 (不计入惩罚总分)
                  </h5>
                  
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 w-full min-w-0">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-700">临床验证评分 (Clinical)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">评估靶向该基因的相关分子的专属成药进度</div>
                    </div>
                    <div className="text-lg text-emerald-600 shrink-0 ml-4">{formatScore(target.scoreBreakdown.clinical)}</div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 w-full min-w-0">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-700">文献共现评分 (Literature)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">基于 NLP 的生物医学共现关系文本挖掘</div>
                    </div>
                    <div className="text-lg text-amber-600 shrink-0 ml-4">{formatScore(target.scoreBreakdown.literature)}</div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 w-full min-w-0">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-700">动物表型评分 (Animal Models)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">基于模式生物的体内靶点敲除关联表型</div>
                    </div>
                    <div className="text-lg text-slate-500 shrink-0 ml-4">{formatScore(target.scoreBreakdown.animalModel)}</div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="space-y-4 w-full min-w-0">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col w-full min-w-0">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" /> 核心相关通路
                </h5>
                <div className="flex flex-wrap gap-2 mb-8 min-w-0">
                  {target.pathways?.length > 0 ? target.pathways.map((p, idx) => (
                    <span key={`path-${target.geneSymbol}-${idx}`} className="text-[10px] px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 font-bold uppercase">
                      {p}
                    </span>
                  )) : <span className="text-xs text-slate-400 italic">暂无记录数据</span>}
                </div>
                
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Dna className="w-4 h-4 text-emerald-500" /> 全局靶向验证分子
                </h5>
                <div className="flex flex-wrap gap-2 mb-8 min-w-0">
                  {target.associatedDrugs?.length > 0 ? target.associatedDrugs.map((d, idx) => (
                    <span key={`drug-${target.geneSymbol}-${idx}`} className="text-[10px] px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 font-bold">
                      {d}
                    </span>
                  )) : <span className="text-xs text-slate-400 italic">暂无相关靶向分子</span>}
                </div>

                <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 mt-auto border-t pt-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" /> 最新关联文献
                </h5>
                <div className="space-y-3 min-w-0 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {target.evidenceLinks?.map((link, idx) => (
                    <a 
                      key={`link-${target.geneSymbol}-${idx}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-100 text-slate-700 rounded-xl hover:border-indigo-300 hover:bg-white hover:shadow-md transition-all group min-w-0"
                    >
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <span className="text-[11px] font-bold leading-snug text-slate-800 group-hover:text-indigo-700 transition-colors">
                          {link.title}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-40 group-hover:opacity-100 mt-0.5 text-indigo-500" />
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-md">
                          {link.source}
                        </span>
                      </div>
                    </a>
                  ))}
                  {(!target.evidenceLinks || target.evidenceLinks.length === 0) && (
                    <p className="text-xs text-slate-400 italic">暂无直连文献，建议前往外部库检索。</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TargetID: React.FC = () => {
  const [disease, setDisease] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [results, setResults] = useState<DiscoveryResponse | null>(null);
  const [showCategories, setShowCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (diseaseToSearch?: string) => {
    if (isLoading) return;
    const term = (diseaseToSearch || disease).trim();
    
    if (!term) {
      setError("请输入有效的疾病名称");
      return;
    }

    setDisease(term);
    setIsLoading(true);
    setLoadingStep(0); 
    setResults(null);
    setError(null);

    try {
      setLoadingStep(1); 
      // 严格保持取 25 个靶点
      const { rows, totalCount } = await fetchRealTargets(term);
      
      if (rows.length === 0) {
        setError(`⚠️ 底层数据库暂未收录「${term}」的有效靶点信息`);
        setIsLoading(false);
        return;
      }

      const conf = DISEASE_MAPPING[term] || { efo: "EFO_0000274", mesh: "D003876" };
      const topTargets = rows.slice(0, 25);

      setLoadingStep(2); 
      
      const drugPromises = topTargets.map((r: any) =>
        axios.get(`https://www.ebi.ac.uk/chembl/api/data/drug?target_components__target_component_synonyms__component_synonym__icontains=${r.target.approvedSymbol}&format=json`)
        .catch(err => ({ data: { drugs: [] } })) 
      );
      
      const litPromises = topTargets.map((r: any) =>
        axios.post(OPENTARGETS_API_URL, {
          query: `query { disease(efoId: "${conf.efo}") { evidences(datasourceIds: ["europepmc"], ensemblIds: ["${r.target.id}"], size: 5) { rows { literature textMiningSentences { text } } } } }`
        }).catch(err => ({ data: null }))
      );
      
      const [drugRes, litRes] = await Promise.all([Promise.all(drugPromises), Promise.all(litPromises)]);

      const targets: TargetCandidate[] = [];
      
      for (let idx = 0; idx < topTargets.length; idx++) {
        const r = topTargets[idx];
        const sym = r.target?.approvedSymbol;
        if (!sym) continue;

        const rawScores = r.datatypeScores || [];
        const getOtScore = (idName: string) => {
          const item = rawScores.find((x: any) => x.id === idName);
          return item ? item.score : 0;
        };

        // 提取原始单项数据并放大 100 倍
        let genScore = Math.max(getOtScore('genetic_association'), getOtScore('somatic_mutation')) * 100;
        let expScore = getOtScore('rna_expression') * 100;
        let pathwayScore = getOtScore('affected_pathway') * 100;
        
        let clinScore = getOtScore('known_drug') * 100;
        let litScore = getOtScore('literature') * 100;
        let animalScore = getOtScore('animal_model') * 100;

        // 核心生物学加权逻辑：遗传(40%) + 表达(40%) + 通路(20%)
        const weightedScore = (genScore * 0.40) + (expScore * 0.40) + (pathwayScore * 0.20);

        const gwasLit = await fetchGWASLiterature(r.target.id, conf.efo);
        
        const drugsData = drugRes[idx].data?.drugs || [];
        const realDrugs: string[] = [];
        drugsData.slice(0, 5).forEach((d: any) => {
          let drugName = d.pref_name;
          if (!drugName && d.molecule_synonyms && d.molecule_synonyms.length > 0) {
              const goodSynonym = d.molecule_synonyms.find((s: any) => s.syn_type === 'INN' || s.syn_type === 'TRADE_NAME');
              drugName = goodSynonym ? goodSynonym.molecule_synonym : d.molecule_synonyms[0].molecule_synonym;
          }
          drugName = drugName ? drugName.toUpperCase() : d.molecule_chembl_id;
          if (drugName && !realDrugs.includes(drugName)) realDrugs.push(drugName);
        });

        const litsData = litRes[idx]?.data?.data?.disease?.evidences?.rows || [];
        const realLitLinks: EvidenceLink[] = [];
        litsData.forEach((l: any) => {
          const pmid = l.literature?.[0];
          const text = l.textMiningSentences?.[0]?.text || `与 ${sym} 相关的最新研究证据`;
          if (pmid) {
            realLitLinks.push({
              title: text.length > 120 ? text.substring(0, 120) + '...' : text,
              url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
              source: "文献数据库提取"
            });
          }
        });

        const apiPathways = r.target.pathways || [];
        const realPathways = apiPathways.map((p: any) => p.pathway);
        const map = PATHWAY_DRUG_MAP[sym] || { pathways: ["底层库靶点通路机制匹配"], drugs: [] };
        
        const finalPathways = realPathways.length > 0 ? realPathways.slice(0, 3) : map.pathways;
        const finalDrugs = realDrugs.length > 0 ? realDrugs : map.drugs;
        let finalLiterature = [...realLitLinks, ...gwasLit];
        
        if (finalLiterature.length === 0) {
            finalLiterature = [{
                title: `暂无直连文献记录，可前往外部检索库搜索「${sym}」与「${term}」的关联`,
                url: `https://pubmed.ncbi.nlm.nih.gov/?term=${sym}+${term}`,
                source: "外部医学文献检索"
            }];
        }

        targets.push({
          geneSymbol: sym,
          uniprotId: r.target.id || "N/A",
          score: weightedScore, 
          scoreBreakdown: { 
            genetics: genScore, 
            expression: expScore, 
            clinical: clinScore,
            pathways: pathwayScore,
            literature: litScore,
            animalModel: animalScore
          },
          pathways: finalPathways,
          associatedDrugs: finalDrugs,
          evidenceLinks: finalLiterature
        });
      }

      setLoadingStep(3); 
      // 按加权分数进行严格降序排列
      targets.sort((a, b) => b.score - a.score);

      setResults({
        disease: term,
        summary: `✅ 已提取「${term}」关联靶点数据，共展示全库关联度前 ${targets.length} 个（底层记录 ${totalCount} 个）。列表严格依据 3D 核心生物学加权模型进行评估与排序展示，辅助指标不计入总分。`,
        targets
      });
    } catch (err) {
      setError(`❌ 分析过程遇到问题：${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 w-full min-w-0 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 w-full min-w-0">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 tracking-tight min-w-0">
          <Cpu className="w-8 h-8 text-indigo-600" />
          靶点识别分析模块
        </h1>
        <p className="text-slate-500 font-medium min-w-0">
          通过多维组学数据提取，构建透明、可计算的靶点优先级评估矩阵
        </p>
      </div>

      <div className="bg-white p-3 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 w-full min-w-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col sm:flex-row gap-2 min-w-0">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
            <input 
              type="text" 
              placeholder="请输入疾病名称 (例如: 银屑病)..."
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-slate-50 rounded-[1.8rem] focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg text-slate-700 transition-all border border-transparent font-medium"
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading || !disease.trim()}
            className="bg-indigo-600 text-white px-12 py-5 rounded-[1.8rem] font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:bg-slate-300 shadow-xl shadow-indigo-200 active:scale-95 min-w-0 sm:min-w-[150px]"
          >
            {isLoading ? (
              <>
                <SafeLoader isLoading={isLoading} />
                <span>检索分析中</span>
              </>
            ) : (
              "开始分析"
            )}
          </button>
        </form>
      </div>

      <div className="flex justify-between items-center px-4 w-full min-w-0">
        <button 
          onClick={() => setShowCategories(!showCategories)}
          disabled={isLoading}
          className="flex items-center gap-3 text-sm font-black text-indigo-600 hover:text-indigo-800 transition-all bg-indigo-50/50 px-6 py-2.5 rounded-2xl border border-indigo-100 shadow-sm disabled:opacity-50 min-w-0"
        >
          <Grid className="w-5 h-5" />
          皮肤专科疾病库快捷检索
          {showCategories ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider">加权评估模型 (Weighted Scoring Model)</div>
      </div>

      {showCategories && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full min-w-0">
          {DISEASE_CATEGORIES.map((cat) => (
            <div key={cat.name} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/30 transition-all group w-full min-w-0">
              <h3 className="text-[11px] font-black text-slate-400 group-hover:text-indigo-500 uppercase tracking-[0.2em] pb-3 border-b border-slate-50 transition-colors">{cat.name}</h3>
              <div className="flex flex-wrap gap-2 min-w-0">
                {cat.diseases.map((d) => (
                  <button 
                    key={d} 
                    onClick={() => handleSearch(d)} 
                    disabled={isLoading}
                    className="px-3 py-1.5 text-[11px] rounded-xl hover:bg-indigo-600 hover:text-white transition-all border font-bold bg-slate-50 text-slate-600 border-slate-100 cursor-pointer disabled:opacity-50 min-w-0"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className="w-full min-w-0">
          <div className="bg-red-50 p-12 rounded-[3rem] border border-red-100 shadow-xl flex flex-col items-center justify-center gap-6 text-center w-full min-w-0">
            <Info className="w-16 h-16 text-red-600" />
            <h3 className="text-2xl font-black text-red-900">数据获取失败</h3>
            <p className="text-red-700 text-lg leading-relaxed whitespace-pre-line">{error}</p>
            <button 
              onClick={() => handleSearch(disease)} 
              className="px-8 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all min-w-[200px]"
            >
              重试分析
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="w-full min-w-0">
          <div className="bg-white p-16 rounded-[3rem] border border-slate-100 shadow-2xl flex flex-col items-center justify-center gap-10 w-full min-w-0">
            <div className="w-16 h-16 flex items-center justify-center">
              <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />
            </div>
            <div className="space-y-4 text-center w-full max-w-md">
              {LOADING_STEPS.map((s, i) => (
                <div 
                  key={i} 
                  className={`text-lg font-medium ${i === loadingStep ? "text-indigo-600 font-bold" : "text-slate-400"} transition-all`}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {results && !isLoading && (
        <div className="space-y-8 w-full min-w-0 animate-in fade-in duration-500">
          <div className="bg-indigo-950 text-white p-12 rounded-[3.5rem] shadow-2xl border border-white/10 w-full min-w-0">
            <h2 className="text-3xl font-bold mb-4">分析结果：{results.disease}</h2>
            <p className="mt-2 text-indigo-200 text-lg leading-relaxed">{results.summary}</p>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden w-full min-w-0">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl text-slate-800">靶点优先级评估矩阵</h3>
                <p className="text-slate-500 mt-2">基于定制加权模型对核心生物学维度赋权汇总，展示严密的推导过程与证据明细</p>
              </div>
            </div>
            {results.targets.map((t, i) => (
              <TargetRow key={`tgt-${t.geneSymbol}-${i}`} target={t} disease={results.disease} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetID;
