import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Node, Link, NodeType } from '../types';
import { Loader2, Info } from 'lucide-react';

interface GraphViewProps {
  data: { nodes: Node[]; links: Link[] };
  loading?: boolean; // 新增加载状态属性
}

const COLORS: Record<string, string> = {
  'disease': '#ef4444', // Red
  'gene': '#3b82f6',    // Blue
  'drug': '#10b981',    // Green
  'pathway': '#f59e0b', // Amber
  'protein': '#8b5cf6', // Purple
  'default': '#94a3b8'
};

const LABEL_MAP: Record<string, string> = {
  'disease': '皮肤疾病',
  'gene': '关键基因',
  'drug': '皮科药物',
  'pathway': '皮肤通路',
  'protein': '表皮蛋白',
};

const GraphView: React.FC<GraphViewProps> = ({ data, loading = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 清空错误状态
    setError(null);
    
    // 加载中/无数据时直接返回
    if (loading || !data.nodes.length) return;

    if (!svgRef.current) {
      setError("图谱容器初始化失败，请刷新页面");
      return;
    }

    try {
      const width = 800;
      const height = 600;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove(); // 清空旧图谱

      const g = svg.append("g");

      // 缩放功能
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => g.attr("transform", event.transform));

      svg.call(zoom);

      // 力导向图模拟（优化参数，避免节点重叠）
      const simulation = d3.forceSimulation<any>([...data.nodes]) // 深拷贝避免修改原数据
        .force("link", d3.forceLink<any, any>([...data.links]).id(d => d.id).distance(150).strength(0.8))
        .force("charge", d3.forceManyBody().strength(-600))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(80));

      // 绘制连接线
      const link = g.append("g")
        .attr("stroke", "#cbd5e1")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(data.links)
        .join("line")
        .attr("stroke-width", 2);

      // 绘制节点组
      const node = g.append("g")
        .selectAll("g")
        .data(data.nodes)
        .join("g")
        .call(d3.drag<any, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
        );

      // 节点圆形
      node.append("circle")
        .attr("r", 16)
        .attr("fill", d => {
          const type = String(d.type || '').toLowerCase();
          return COLORS[type] || COLORS['default'];
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 3)
        .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.1))");

      // 节点文字
      node.append("text")
        .text(d => d.name)
        .attr("x", 18)
        .attr("y", 4)
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("fill", "#334155")
        .style("pointer-events", "none"); // 避免文字遮挡拖拽

      // 实时更新节点位置
      simulation.on("tick", () => {
        link
          .attr("x1", d => (d.source as any).x)
          .attr("y1", d => (d.source as any).y)
          .attr("x2", d => (d.target as any).x)
          .attr("y2", d => (d.target as any).y);

        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

      // 清理函数
      return () => { 
        simulation.stop(); 
        svg.selectAll("*").remove();
      };
    } catch (err) {
      console.error("图谱渲染失败:", err);
      setError(`图谱渲染出错: ${(err as Error).message || "未知错误"}`);
    }
  }, [data, loading]);

  // 加载状态
  if (loading) {
    return (
      <div className="w-full h-[600px] border border-slate-200 rounded-[2rem] overflow-hidden bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-medium">正在重构皮肤生物网络...</p>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="w-full h-[600px] border border-slate-200 rounded-[2rem] overflow-hidden bg-white flex flex-col items-center justify-center text-center p-8">
        <Info className="w-8 h-8 text-red-600 mb-4" />
        <p className="text-red-600 font-medium mb-2">{error}</p>
        <p className="text-slate-500 text-sm">请检查数据格式或刷新页面重试</p>
      </div>
    );
  }

  // 空数据状态
  if (!data.nodes.length) {
    return (
      <div className="w-full h-[600px] border border-slate-200 rounded-[2rem] overflow-hidden bg-white flex flex-col items-center justify-center text-center p-8">
        <Info className="w-8 h-8 text-slate-400 mb-4" />
        <p className="text-slate-500 font-medium mb-2">暂无图谱数据</p>
        <p className="text-slate-400 text-sm">请先搜索靶点/疾病生成关联图谱</p>
      </div>
    );
  }

  // 正常渲染图谱
  return (
    <div className="w-full h-[600px] border border-slate-200 rounded-[2rem] overflow-hidden bg-white relative">
      <svg ref={svgRef} className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" />
      <div className="absolute top-6 right-6 flex flex-col gap-3 p-5 bg-white/90 backdrop-blur shadow-xl border border-slate-100 rounded-3xl">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">实体图例</h4>
        {Object.entries(LABEL_MAP).map(([key, label]) => (
          <div key={key} className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ backgroundColor: COLORS[key] }} />
            <span className="text-xs font-bold text-slate-600">{label}</span>
          </div>
        ))}
      </div>
      {/* 图谱统计信息 */}
      <div className="absolute bottom-6 left-6 p-3 bg-white/90 backdrop-blur shadow-md border border-slate-100 rounded-xl">
        <span className="text-xs font-bold text-slate-600">
          节点数: {data.nodes.length} | 关系数: {data.links.length}
        </span>
      </div>
    </div>
  );
};

export default GraphView;