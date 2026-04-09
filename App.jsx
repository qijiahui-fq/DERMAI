/** @jsx React.createElement */
// @ts-nocheck
import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { Beaker } from 'lucide-react';

// 导入页面，确保带上 .tsx 后缀
import Dashboard from './pages/Dashboard.tsx';
import TargetID from './pages/TargetID.tsx';
import KnowledgeGraph from './pages/KnowledgeGraph.tsx';

const Navbar = () => (
  <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 flex justify-between h-16 items-center">
      <Link to="/" className="flex items-center gap-2">
        <div className="p-2 bg-indigo-600 rounded text-white"><Beaker size={20} /></div>
        <span className="text-xl font-bold">DermAI</span>
      </Link>
      <div className="flex gap-4">
        <Link to="/" className="text-sm font-bold text-slate-600">药研中心</Link>
        <Link to="/target-id" className="text-sm font-bold text-slate-600">靶点识别</Link>
        <Link to="/knowledge-graph" className="text-sm font-bold text-slate-600">知识图谱</Link>
      </div>
    </div>
  </nav>
);

const App = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/target-id" element={<TargetID />} />
            <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
