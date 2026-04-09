/** @jsx React.createElement */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Loader2, ExternalLink, Dna, Info, ChevronRight, Grid, 
  ChevronDown, ChevronUp, BookOpen, CheckCircle2, BarChart3, 
  Layers, Cpu, Calculator, ShieldCheck, Activity 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Cell 
} from 'recharts';

// 接口定义保持不变
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
  geneSymbol: string;
  uniprotId: string;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  pathways: string[];
  associatedDrugs: string[];
  evidenceLinks: EvidenceLink[];
}

export interface DiscoveryResponse { disease: string; summary: string; targets: TargetCandidate[]; }

// 🚀 这里的 URL 必须改，否则线上环境会因为跨域/路径问题报错
const OPENTARGETS_API_URL = "https://api.platform.opentargets.org/api/v4/graphql";

const DISEASE_MAPPING: Record<string, { efo: string; mesh: string; string }> = {
  "特应性皮炎": { efo: "EFO_0000274", mesh: "D003876" },
  "银屑病": { efo: "EFO_0000676", mesh: "D011565" },
  "荨麻疹": { efo: "EFO_0004263", mesh: "D014581" }
};

// ... 下面接你原本的 TargetID 逻辑代码，千万不要删 ...
// 记得确保你的导出依然是 export default TargetID; (如果 App.tsx 是这么引用的)
