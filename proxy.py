#!/usr/bin/env python3
"""
简单的HTTP代理服务器，用于解决CORS问题
"""
import http.server
import socketserver
import json
import urllib.request
import urllib.parse
from urllib.error import HTTPError
import os

# 尝试导入dashscope，如果没有则使用HTTP请求
try:
    import dashscope
    USE_DASHSCOPE = True
    print("使用DashScope SDK")
except ImportError:
    USE_DASHSCOPE = False
    print("DashScope SDK未安装，使用HTTP请求")

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        if self.path == '/api/chat':
            self.handle_chat_api()
        else:
            self.send_error(404, "Not Found")
    
    def handle_chat_api(self):
        try:
            # 读取请求体
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            message = request_data.get('message', '')
            image_data = request_data.get('imageData')
            
            print(f"收到聊天请求: {message}")
            
            if USE_DASHSCOPE:
                # 使用DashScope SDK
                dashscope.api_key = "sk-5eca33a68f2d499fa09953b9b308ed0f"
                
                messages = [
                    {'role': 'user', 'content': message}
                ]
                
                # 如果有图片，修改消息格式
                if image_data:
                    messages[0]['content'] = [
                        {'type': 'text', 'text': message},
                        {'type': 'image_url', 'image_url': {'url': image_data}}
                    ]
                
                print("使用DashScope SDK调用API...")
                response = dashscope.Generation.call(
                    model='qwen-vl-plus',  # 视觉模型，支持图片分析
                    messages=messages
                )
                
                print(f"DashScope响应: {response}")
                
                if response.status_code == 200:
                    bot_message = response.output.choices[0].message.content
                    
                    response_data = {
                        "success": True,
                        "message": bot_message
                    }
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))
                else:
                    raise Exception(f"DashScope API错误: {response.code} - {response.message}")
                    
            else:
                # 使用HTTP请求 - 正确的格式
                api_request = {
                    "model": "qwen-vl-plus",  # 视觉模型，支持图片分析
                    "input": {
                        "prompt": message
                    }
                }
                
                # 调用通义千问API
                api_url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
                api_key = "sk-5eca33a68f2d499fa09953b9b308ed0f"
                
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {api_key}',
                    'X-DashScope-SSE': 'disable'
                }
                
                req = urllib.request.Request(
                    api_url,
                    data=json.dumps(api_request).encode('utf-8'),
                    headers=headers,
                    method='POST'
                )
                
                print("调用通义千问API...")
                
                with urllib.request.urlopen(req) as response:
                    api_response = json.loads(response.read().decode('utf-8'))
                    print(f"API响应: {api_response}")
                    
                    # 解析响应
                    if 'output' in api_response and 'text' in api_response['output']:
                        bot_message = api_response['output']['text']
                    elif 'output' in api_response and 'choices' in api_response['output']:
                        bot_message = api_response['output']['choices'][0]['message']['content']
                    else:
                        raise Exception("API响应格式异常")
                    
                    # 返回成功响应
                    response_data = {
                        "success": True,
                        "message": bot_message
                    }
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))
                    
        except HTTPError as e:
            error_msg = f"API调用失败: {e.code} {e.reason}"
            print(f"HTTP错误: {error_msg}")
            
            try:
                error_detail = e.read().decode('utf-8')
                print(f"错误详情: {error_detail}")
            except:
                pass
            
            self.send_error(500, error_msg)
            
        except Exception as e:
            error_msg = f"服务器错误: {str(e)}"
            print(f"服务器错误: {error_msg}")
            
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = {"error": error_msg, "success": False}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

def run_server(port=3000):
    handler = CORSHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"🚀 代理服务器启动成功！")
            print(f"📱 访问地址: http://localhost:{port}")
            print(f"🔧 API代理: http://localhost:{port}/api/chat")
            print("按 Ctrl+C 停止服务器")
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"端口 {port} 被占用，尝试端口 {port + 1}")
            run_server(port + 1)
        else:
            raise

if __name__ == "__main__":
    # 切换到脚本所在目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    run_server()
