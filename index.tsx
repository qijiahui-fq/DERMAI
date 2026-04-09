// @ts-nocheck
import React from 'react';
import ReactDOM from 'react-dom/client';
// 注意：即使在本地是 ./App.tsx，这里也可以简写为 ./App
import App from './App';

/**
 * 在免编译模式下，确保 DOM 完全加载后再执行渲染逻辑
 * 这样可以避免 Babel 翻译脚本还没跑完就尝试挂载导致的白屏
 */
const mountApp = () => {
    const rootElement = document.getElementById('root');
    
    if (rootElement) {
        // 使用 React 18+ 的 root API
        const root = ReactDOM.createRoot(rootElement);
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
        console.log("DermAI Platform: Root mounted successfully.");
    } else {
        console.error("DermAI Platform Error: Could not find root element.");
    }
};

// 监听文档状态，防止执行过早
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApp);
} else {
    mountApp();
}
