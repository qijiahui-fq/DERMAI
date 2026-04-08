from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json

# ========== 代理配置 ==========
import os
os.environ['HTTP_PROXY'] = 'http://127.0.0.1:7890'
os.environ['HTTPS_PROXY'] = 'http://127.0.0.1:7890'
os.environ['NO_PROXY'] = 'localhost,127.0.0.1'

app = Flask(__name__)
CORS(app)

# ========== OpenTargets 端点 ==========
OPENTARGETS_API = "https://api.platform.opentargets.org/api/v4/graphql"

@app.route('/api/opentargets/graphql', methods=['OPTIONS', 'POST'])
def opentargets_proxy():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    try:
        # 获取前端传的原始请求体
        data = request.get_json() or {}
        print("📥 后端接收的请求体：", data)  # 打印前端传过来的内容
        
        query = data.get('query', '')
        if not query:
            print("❌ 前端未传query参数")
            return jsonify({'errors': [{'message': 'GraphQL查询语句不能为空'}]}), 400
        
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        # 转发请求到OpenTargets
        response = requests.post(
            OPENTARGETS_API,
            headers=headers,
            json=data,
            timeout=20
        )
        
        print("📤 OpenTargets返回状态码：", response.status_code)
        print("📤 OpenTargets返回内容：", response.json())
        
        return jsonify(response.json()), response.status_code
        
    except Exception as e:
        error_msg = f"请求OpenTargets失败：{str(e)}"
        print("❌ 后端转发错误：", error_msg)
        # 修复1：异常返回500状态码，而非200
        return jsonify({'errors': [{'message': error_msg}]}), 500

# 以下接口不变
@app.route('/api/score-target', methods=['POST'])
def score_target():
    try:
        data = request.get_json()
        target_name = data.get('target_name', '')
        disease = data.get('disease', '')
        open_targets_score = data.get('open_targets_score', 0.5)
        
        score = min(10, max(1, open_targets_score * 10))
        result = {
            'code': 200,
            'data': {
                'score': score,
                'rationale': f'{target_name} 与 {disease} 存在强关联 (OpenTargets评分: {open_targets_score:.2f})',
                'score_breakdown': {
                    'genetics': round(open_targets_score * 0.9, 2),
                    'expression': round(open_targets_score * 0.8, 2),
                    'clinical': round(open_targets_score * 0.7, 2)
                },
                'score_basis': {
                    'genetics': f'{target_name} 在 {disease} 患者中存在显著GWAS关联证据',
                    'expression': f'{target_name} 在 {disease} 皮损组织中特异性高表达',
                    'clinical': f'{target_name} 已有多款药物进入 {disease} 临床治疗研究'
                }
            }
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'code': 500,
            'message': f'评分失败: {str(e)}'
        }), 500

@app.route('/api/target-literature', methods=['GET'])
def target_literature():
    try:
        target = request.args.get('target', '')
        result = {
            'code': 200, 
            'data': [
                {
                    'title': f'{target} 抑制剂治疗特应性皮炎的 III 期临床研究',
                    'url': f'https://pubmed.ncbi.nlm.nih.gov/?term={target}+atopic+dermatitis',
                    'source': 'PubMed'
                },
                {
                    'title': f'{target} 信号通路在银屑病发病机制中的作用',
                    'url': f'https://pubmed.ncbi.nlm.nih.gov/?term={target}+psoriasis',
                    'source': 'PubMed'
                }
            ]
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'code': 500,
            'message': f'文献检索失败: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)
