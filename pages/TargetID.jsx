/** @jsx React.createElement */
// @ts-nocheck

// 🛠️ 变动 1：删掉 import，改用全局变量注入（否则浏览器直接白屏）
const { useState, useEffect, useRef } = React;
const { 
  Search, Loader2, ExternalLink, Dna, Info, ChevronRight, Grid, 
  ChevronDown, ChevronUp, BookOpen, CheckCircle2, BarChart3, 
  Layers, Cpu, Calculator, ShieldCheck, FileText, Microscope, Activity 
} = LucideIcons;

// 🚀 核心常量
const OPENTARGETS_API_URL = "https://api.platform.opentargets.org/api/v4/graphql";

// ===================== 【核心资产】47 种皮肤病映射表 (全量保留) =====================
const DISEASE_MAPPING = {
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

const PATHWAY_DRUG_MAP = {
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

// 🚀 数值格式化
const formatScore = (val, isTotal = false) => {
  if (val === 0) return <span className="text-slate-300 font-normal">—</span>;
  if (val > 0 && val < 0.01) return <span className="text-slate-400 font-medium">&lt;0.01</span>;
  return <span className={isTotal ? "font-black" : "font-bold"}>{val.toFixed(2)}</span>;
};

const formatScoreText = (val) => {
  if (val === 0) return '0.00';
  if (val > 0 && val < 0.01) return '<0.01';
  return val.toFixed(2);
};

const SafeLoader = ({ isLoading }) => {
  if (!isLoading) return null;
  return <Loader2 key="loader-icon" className="w-6 h-6 animate-spin text-white" />;
};

const fetchRealTargets = async (diseaseName) => {
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

    const response = await axios.post(
      OPENTARGETS_API_URL,
      { query },
      { 
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    const rows = response.data?.data?.disease?.associatedTargets?.rows || [];
    const totalCount = response.data?.data?.disease?.associatedTargets?.count || 0;
    return { rows, totalCount };
  } catch (err) {
    throw new Error(`底层接口请求失败：${err.message}`);
  }
};

const fetchGWASLiterature = async (ensemblId, efoId, size = 5) => {
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
    return rows.map((row) => {
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

// 🛠️ 变动 2：删掉参数里的类型标注 (TargetCandidate 等)
const TargetRow = ({ target, disease }) => {
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
            基于底层多维组学数据，该靶点的综合加权得分为 {finalScore > 0 ? finalScore.toFixed(2) : '<0.01'}，点击查看推演明细。
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
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex flex-col gap-4">
                  <div className="flex flex-col gap-2 border-b border-indigo-50 pb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">加权计算公式</span>
                    <span className="text-[11px] font-black text-indigo-700 font-mono tracking-tight leading-relaxed">总分 = 遗传(40%) + 表达(40%) + 通路(20%)</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 overflow-x-auto">
                      <span className="text-[11px] font-black text-slate-600 font-mono tracking-tighter whitespace-nowrap">
                        ({formatScoreText(target.scoreBreakdown.genetics)}×0.4) + ({formatScoreText(target.scoreBreakdown.expression)}×0.4) + ({formatScoreText(target.scoreBreakdown.pathways)}×0.2)
                      </span>
                      <span className="text-base text-indigo-600 font-mono">= {formatScore(finalScore, true)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 w-full min-w-0">
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-3">核心评估维度</h5>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                          <span className="text-xs font-bold text-blue-600">遗传学与变异 (40%)</span>
                          <span className="text-lg text-blue-600 font-mono">{formatScore(target.scoreBreakdown.genetics)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                          <span className="text-xs font-bold text-purple-600">靶点转录表达 (40%)</span>
                          <span className="text-lg text-purple-600 font-mono">{formatScore(target.scoreBreakdown.expression)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                          <span className="text-xs font-bold text-rose-600">受累信号通路 (20%)</span>
                          <span className="text-lg text-rose-600 font-mono">{formatScore(target.scoreBreakdown.pathways)}</span>
                      </div>
                  </div>
              </div>
            </div>
            <div className="space-y-4 w-full min-w-0">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col w-full min-w-0">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">核心相关通路</h5>
                <div className="flex flex-wrap gap-2 mb-8 min-w-0">
                  {target.pathways?.map((p, idx) => (
                    <span key={idx} className="text-[10px] px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 font-bold uppercase">{p}</span>
                  ))}
                </div>
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">最新关联文献</h5>
                <div className="space-y-3 min-w-0 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {target.evidenceLinks?.map((link, idx) => (
                    <a key={idx} href={link.url} target="_blank" className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-100 text-slate-700 rounded-xl hover:bg-white hover:shadow-md transition-all">
                      <span className="text-[11px] font-bold leading-snug text-slate-800 line-clamp-2">{link.title}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-md self-start">{link.source}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 🛠️ 变动 3：删掉 TS 的接口定义和组件类型标注
const TargetID = () => {
  const [disease, setDisease] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [results, setResults] = useState(null);
  const [showCategories, setShowCategories] = useState(true);
  const [error, setError] = useState(null);

  const handleSearch = async (diseaseToSearch) => {
    if (isLoading) return;
    const term = (diseaseToSearch || disease).trim();
    if (!term) return;

    setDisease(term);
    setIsLoading(true);
    setLoadingStep(0); 
    setResults(null);
    setError(null);

    try {
      setLoadingStep(1); 
      const { rows, totalCount } = await fetchRealTargets(term);
      if (rows.length === 0) throw new Error(`底层数据库暂未收录「${term}」的有效靶点信息`);

      const conf = DISEASE_MAPPING[term] || { efo: "EFO_0000274", mesh: "D003876" };
      const topTargets = rows.slice(0, 25);

      setLoadingStep(2); 
      const litPromises = topTargets.map((r) =>
        axios.post(OPENTARGETS_API_URL, {
          query: `query { disease(efoId: "${conf.efo}") { evidences(datasourceIds: ["europepmc"], ensemblIds: ["${r.target.id}"], size: 5) { rows { literature textMiningSentences { text } } } } }`
        }).catch(() => ({ data: null }))
      );
      const litRes = await Promise.all(litPromises);

      const targets = [];
      for (let idx = 0; idx < topTargets.length; idx++) {
        const r = topTargets[idx];
        const sym = r.target?.approvedSymbol;
        if (!sym) continue;

        const rawScores = r.datatypeScores || [];
        const getOtScore = (idName) => (rawScores.find((x) => x.id === idName)?.score || 0);

        let genScore = Math.max(getOtScore('genetic_association'), getOtScore('somatic_mutation')) * 100;
        let expScore = getOtScore('rna_expression') * 100;
        let pathwayScore = getOtScore('affected_pathway') * 100;
        
        const weightedScore = (genScore * 0.40) + (expScore * 0.40) + (pathwayScore * 0.20);
        const litsData = litRes[idx]?.data?.data?.disease?.evidences?.rows || [];
        const realLitLinks = litsData.map(l => ({
            title: l.textMiningSentences?.[0]?.text || `与 ${sym} 相关的最新研究证据`,
            url: `https://pubmed.ncbi.nlm.nih.gov/${l.literature?.[0]}/`,
            source: "文献提取"
        })).filter(l => l.url.includes('undefined') === false);

        targets.push({
          geneSymbol: sym,
          uniprotId: r.target.id || "N/A",
          score: weightedScore, 
          scoreBreakdown: { genetics: genScore, expression: expScore, pathways: pathwayScore, clinical: 0, literature: 0, animalModel: 0 },
          pathways: (r.target.pathways || []).map(p => p.pathway).slice(0, 3),
          associatedDrugs: [],
          evidenceLinks: realLitLinks.length > 0 ? realLitLinks : [{title: `检索「${sym}」在「${term}」中的文献关联`, url: `https://pubmed.ncbi.nlm.nih.gov/?term=${sym}+${term}`, source: "外部检索"}]
        });
      }

      setLoadingStep(3); 
      targets.sort((a, b) => b.score - a.score);
      setResults({ disease: term, summary: `✅ 识别成功。严格依据 3D 核心生物学模型对「${term}」进行评估。`, targets });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 w-full px-4">
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3"><Cpu className="w-8 h-8 text-indigo-600" />靶点识别分析模块</h1>
        <p className="text-slate-500 font-medium">通过多维组学数据，构建透明、可计算的靶点优先级评估矩阵</p>
      </div>

      <div className="bg-white p-3 rounded-[2.5rem] shadow-2xl border border-slate-100">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
            <input type="text" placeholder="输入疾病名称..." value={disease} onChange={(e) => setDisease(e.target.value)} className="w-full pl-16 pr-6 py-5 bg-slate-50 rounded-[1.8rem] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
          </div>
          <button type="submit" disabled={isLoading} className="bg-indigo-600 text-white px-12 py-5 rounded-[1.8rem] font-bold hover:bg-indigo-700 disabled:bg-slate-300">
            {isLoading ? "识别中..." : "开始分析"}
          </button>
        </form>
      </div>

      {showCategories && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DISEASE_CATEGORIES.map((cat) => (
            <div key={cat.name} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5 group transition-all hover:border-indigo-300">
              <h3 className="text-[11px] font-black text-slate-400 group-hover:text-indigo-500 border-b pb-3 uppercase">{cat.name}</h3>
              <div className="flex flex-wrap gap-2">
                {cat.diseases.map((d) => (
                  <button key={d} onClick={() => handleSearch(d)} className="px-3 py-1.5 text-[11px] rounded-xl border font-bold bg-slate-50 hover:bg-indigo-600 hover:text-white transition-all">{d}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="bg-white p-16 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center gap-8">
          <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />
          <div className="space-y-2 text-center">
            {LOADING_STEPS.map((s, i) => <p key={i} className={`text-lg ${i === loadingStep ? "text-indigo-600 font-bold" : "text-slate-400"}`}>{s}</p>)}
          </div>
        </div>
      )}

      {results && !isLoading && (
        <div className="space-y-8 animate-in fade-in">
          <div className="bg-indigo-950 text-white p-12 rounded-[3.5rem] border border-white/10">
            <h2 className="text-3xl font-bold mb-4">分析报告：{results.disease}</h2>
            <p className="text-indigo-200 text-lg">{results.summary}</p>
          </div>
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 font-bold text-xl">靶点优先级评估矩阵</div>
            {results.targets.map((t, i) => <TargetRow key={i} target={t} disease={results.disease} />)}
          </div>
        </div>
      )}
    </div>
  );
};

// 🛠️ 变动 4：保留 export
export default TargetID;
