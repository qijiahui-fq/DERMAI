// src/components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';

// 定义 Props 类型，包含 children 和 fallback
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode; // 可选的 fallback 渲染
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('全局错误捕获:', error);
  }

  render() {
    if (this.state.hasError) {
      // 优先使用传入的 fallback，否则显示默认提示
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-red-600 font-bold text-xl mb-2">页面渲染异常</h2>
          <p className="text-slate-500 mb-4">请刷新页面或检查网络连接</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            刷新重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}