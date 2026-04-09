/** @jsx React.createElement */
// @ts-nocheck
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; 

const mountApp = () => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
        try {
            const root = ReactDOM.createRoot(rootElement);
            root.render(<App />);
            console.log("DermAI: System initialized and rendered.");
        } catch (err) {
            console.error("Render Error:", err);
        }
    }
};

// 确保在浏览器环境及 DOM 加载后运行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApp);
} else {
    mountApp();
}
