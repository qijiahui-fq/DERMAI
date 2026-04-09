from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os
import time

app = Flask(__name__)

# 允许跨域
CORS(app, resources={r"/*": {"origins": "*"}})

# OpenTargets 官方 API 地址
OPENTARGETS_GRAPHQL_URL = "https://api.platform.opentargets.org/api/v4/graphql"

# 映射前端需要的三个路由
@app.route('/api/opentargets/graphql', methods=['POST', 'OPTIONS'], strict_slashes=False)
def opentargets_proxy():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    try:
        data = request.get_json()
        response = requests.post(
            OPENTARGETS_GRAPHQL_URL,
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=60 
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/score-target', methods=['POST'])
def score_target():
    try:
        data = request.get_json()
        target_name = data.get('target_name', '')
        disease = data.get('disease', '')
        open_targets_score = data.get('open_targets_score', 0.5)
        score = min(10, max(1, open_targets_score * 10))
        return jsonify({
            'code': 200,
            'data': {'score': score, 'rationale': f'{target_name} 与 {disease} 关联评分成功'}
        })
    except Exception as e:
        return jsonify({'code': 500, 'message': str(e)}), 500

@app.route('/api/target-literature', methods=['GET'])
def target_literature():
    target = request.args.get('target', '')
    return jsonify({
        'code': 200, 
        'data': [{'title': f'{target} 相关研究进展', 'url': 'https://pubmed.ncbi.nlm.nih.gov/', 'source': 'PubMed'}]
    })

# 根路径健康检查
@app.route('/api', methods=['GET'])
def health():
    return jsonify({"status": "DermAI Backend Running"}), 200
