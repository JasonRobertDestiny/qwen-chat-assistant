// 全局变量
let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let currentStream;
let recordingStartTime = null;
let recordingTimer = null;

// API 配置
const API_CONFIG = {
    // 动态计算后端地址，避免用 8888 静态服时请求落空
    baseURL: getApiBaseUrl(),
    apiKey: 'sk-5eca33a68f2d499fa09953b9b308ed0f',
    model: 'qwen3-omni-flash'
};

// DOM 元素
const elements = {
    textInput: document.getElementById('textInput'),
    sendBtn: document.getElementById('sendBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    cameraBtn: document.getElementById('cameraBtn'),
    uploadBtn: document.getElementById('uploadBtn'),
    imageUpload: document.getElementById('imageUpload'),
    messages: document.getElementById('messages'),
    voiceIndicator: document.getElementById('voiceIndicator'),
    stopVoiceBtn: document.getElementById('stopVoiceBtn'),
    cameraModal: document.getElementById('cameraModal'),
    cameraVideo: document.getElementById('cameraVideo'),
    cameraCanvas: document.getElementById('cameraCanvas'),
    captureBtn: document.getElementById('captureBtn'),
    closeCameraBtn: document.getElementById('closeCameraBtn'),
    imagePreview: document.getElementById('imagePreview'),
    previewImage: document.getElementById('previewImage'),
    sendImageBtn: document.getElementById('sendImageBtn'),
    retakeBtn: document.getElementById('retakeBtn'),
    cancelImageBtn: document.getElementById('cancelImageBtn'),
    loadingIndicator: document.getElementById('loadingIndicator')
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // 绑定事件监听器
    bindEventListeners();
    
    // 检查浏览器兼容性
    checkBrowserSupport();
    
    console.log('智能聊天助手已初始化');
}

function bindEventListeners() {
    // 发送按钮
    elements.sendBtn.addEventListener('click', handleSendMessage);
    
    // 文本输入框
    elements.textInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    elements.textInput.addEventListener('input', function() {
        elements.sendBtn.disabled = !this.value.trim();
    });
    
    // 语音按钮
    elements.voiceBtn.addEventListener('click', toggleVoiceRecording);
    elements.stopVoiceBtn.addEventListener('click', stopVoiceRecording);
    
    // 相机按钮
    elements.cameraBtn.addEventListener('click', openCamera);
    elements.captureBtn.addEventListener('click', capturePhoto);
    elements.closeCameraBtn.addEventListener('click', closeCamera);

    // 图片上传按钮
    elements.uploadBtn.addEventListener('click', () => elements.imageUpload.click());
    elements.imageUpload.addEventListener('change', handleImageUpload);

    // 图片预览按钮
    elements.sendImageBtn.addEventListener('click', sendImage);
    elements.retakeBtn.addEventListener('click', retakePhoto);
    elements.cancelImageBtn.addEventListener('click', cancelImage);
}

function checkBrowserSupport() {
    // 检查摄像头支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('浏览器不支持摄像头功能');
        elements.cameraBtn.style.display = 'none';
    }

    // 检查录音支持
    if (!navigator.mediaDevices || !window.MediaRecorder) {
        console.warn('浏览器不支持录音');
        elements.voiceBtn.style.display = 'none';
    }
}

// 消息处理
function handleSendMessage() {
    const text = elements.textInput.value.trim();
    if (!text) return;
    
    // 显示用户消息
    showMessage(text, 'user');
    
    // 清空输入框
    elements.textInput.value = '';
    elements.sendBtn.disabled = true;
    
    // 发送到API
    sendToAPI(text);
}

function showMessage(content, sender, imageData = null, useTypingEffect = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🤖';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    const messageText = document.createElement('div');
    messageText.className = 'message-text';

    // 如果有图片数据，添加图片
    if (imageData) {
        const img = document.createElement('img');
        img.src = imageData;
        img.className = 'message-image';
        img.alt = '用户上传的图片';
        messageContent.appendChild(img);
    }

    messageContent.appendChild(messageText);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    elements.messages.appendChild(messageDiv);

    // 使用打字机效果（仅AI回复）
    if (useTypingEffect && sender === 'bot') {
        typeWriter(messageText, content, 0, 30); // 30ms每字
    } else {
        messageText.textContent = content;
    }

    // 滚动到底部
    elements.messages.scrollTop = elements.messages.scrollHeight;

    return messageDiv;
}

// 打字机效果
function typeWriter(element, text, index, speed) {
    if (index < text.length) {
        element.textContent += text.charAt(index);

        // 自动滚动到底部
        elements.messages.scrollTop = elements.messages.scrollHeight;

        setTimeout(() => typeWriter(element, text, index + 1, speed), speed);
    }
}

// API 调用
async function sendToAPI(message, imageData = null, audioData = null) {
    showLoading(true);

    try {
        // 构建请求体 - 简化格式，发送给我们的后端
        const requestBody = {
            message: message,
            imageData: imageData,
            audioData: audioData
        };

        console.log('发送到后端API:', requestBody);

        // 添加超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

        const response = await fetch(API_CONFIG.baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        console.log('后端API响应状态:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('后端API错误:', errorData);
            throw new Error(errorData.error || `请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('后端API响应:', data);
        
        if (data.success && data.message) {
            showMessage(data.message, 'bot', null, true); // 启用打字机效果
        } else {
            throw new Error('后端返回格式异常');
        }
        
    } catch (error) {
        console.error('API调用错误:', error);

        // 提供更详细的错误信息
        let errorMessage = '抱歉，我现在无法回应。请稍后再试。';

        if (error.name === 'AbortError') {
            errorMessage = '请求超时（30秒），请检查网络或稍后再试。';
        } else if (error.message.includes('401')) {
            errorMessage = 'API密钥无效，请检查配置。';
        } else if (error.message.includes('403')) {
            errorMessage = 'API访问被拒绝，请检查权限。';
        } else if (error.message.includes('429')) {
            errorMessage = 'API调用频率过高，请稍后再试。';
        } else if (error.message.includes('500')) {
            errorMessage = 'API服务器内部错误，请稍后再试。';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = '网络/代理不可达，请确认已运行 `npm run start` 并使用 http://localhost:3000 访问，或在静态 8888 端口时确保 3000 端口已开启。';
        }

        showMessage(errorMessage, 'bot');
    } finally {
        showLoading(false);
    }
}

// Loading提示动画
let loadingInterval = null;
const loadingMessages = [
    'AI正在思考中...',
    '正在理解你的问题...',
    '正在组织回答...',
    '马上就好...'
];
let loadingMessageIndex = 0;

function showLoading(show) {
    if (show) {
        elements.loadingIndicator.classList.remove('hidden');

        // 动态切换提示文字
        loadingMessageIndex = 0;
        updateLoadingMessage();
        loadingInterval = setInterval(updateLoadingMessage, 1500);
    } else {
        elements.loadingIndicator.classList.add('hidden');
        if (loadingInterval) {
            clearInterval(loadingInterval);
            loadingInterval = null;
        }
    }
}

function updateLoadingMessage() {
    const loadingText = elements.loadingIndicator.querySelector('p');
    if (loadingText) {
        loadingText.textContent = loadingMessages[loadingMessageIndex];
        loadingMessageIndex = (loadingMessageIndex + 1) % loadingMessages.length;
    }
}

// 计算后端地址，兼容 3000 代理与 8888 静态预览
function getApiBaseUrl() {
    const { protocol, hostname, port, origin } = window.location;

    // 若使用 python -m http.server 8888 提供静态资源，则回落到 3000 端口的 Node 代理
    if (hostname === 'localhost' && port === '8888') {
        return `${protocol}//${hostname}:3000/api/chat`;
    }

    // 默认同源
    return `${origin}/api/chat`;
}

// 语音功能
function toggleVoiceRecording() {
    if (isRecording) {
        stopVoiceRecording();
        return;
    }
    startVoiceRecording();
}

async function startVoiceRecording() {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
        showMessage('浏览器不支持录音功能', 'bot');
        return;
    }

    try {
        currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const mimeType = getSupportedMimeType();
        audioChunks = [];
        mediaRecorder = new MediaRecorder(currentStream, mimeType ? { mimeType } : undefined);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            await handleRecordedAudio();
        };

        mediaRecorder.start();
        isRecording = true;
        recordingStartTime = Date.now();
        startRecordingTimer();
        updateVoiceIndicator('正在录音...');
        elements.voiceIndicator.classList.remove('hidden');
        elements.voiceBtn.classList.add('recording');
    } catch (error) {
        console.error('启动录音失败:', error);
        showMessage('无法获取麦克风权限，请检查浏览器设置', 'bot');
        cleanupRecording();
    }
}

function stopVoiceRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
    }
    cleanupRecording();
}

async function handleRecordedAudio() {
    if (!audioChunks.length) {
        showMessage('未捕获到音频，请重试', 'bot');
        return;
    }

    try {
        // 将录音 Blob 转成 Base64 WAV，便于后端直传模型
        const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        const audioPayload = await blobToWavBase64(audioBlob);

        const durationLabel = audioPayload.durationSec ? `${audioPayload.durationSec}s` : '';
        const displayText = durationLabel ? `🎤 发送语音（${durationLabel}）` : '🎤 发送语音';

        showMessage(displayText, 'user');
        await sendToAPI('', null, audioPayload);
    } catch (error) {
        console.error('处理音频失败:', error);
        showMessage('音频处理失败，请重试', 'bot');
    }
}

function getSupportedMimeType() {
    // 按优先级选择浏览器支持的录音编码
    const candidates = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/webm',
        'audio/mp4'
    ];
    return candidates.find(type => MediaRecorder.isTypeSupported(type)) || '';
}

function startRecordingTimer() {
    updateVoiceIndicator('正在录音...');
    recordingTimer = setInterval(() => {
        if (!recordingStartTime) return;
        const seconds = Math.floor((Date.now() - recordingStartTime) / 1000);
        updateVoiceIndicator(`录音中：${seconds}s`);
    }, 500);
}

function stopRecordingTimer() {
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
}

function updateVoiceIndicator(text) {
    const indicatorText = elements.voiceIndicator.querySelector('p');
    if (indicatorText) {
        indicatorText.textContent = text;
    }
}

function cleanupRecording() {
    stopRecordingTimer();
    isRecording = false;
    elements.voiceIndicator.classList.add('hidden');
    elements.voiceBtn.classList.remove('recording');

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }

    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
}

// 相机功能
async function openCamera() {
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        elements.cameraVideo.srcObject = currentStream;
        elements.cameraModal.classList.remove('hidden');
        
    } catch (error) {
        console.error('打开摄像头失败:', error);
        showMessage('无法访问摄像头，请检查权限设置', 'bot');
    }
}

function closeCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    elements.cameraModal.classList.add('hidden');
}

function capturePhoto() {
    const canvas = elements.cameraCanvas;
    const video = elements.cameraVideo;
    const context = canvas.getContext('2d');
    
    // 设置画布尺寸
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 绘制视频帧到画布
    context.drawImage(video, 0, 0);
    
    // 获取图片数据
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // 显示预览
    elements.previewImage.src = imageData;
    elements.cameraModal.classList.add('hidden');
    elements.imagePreview.classList.remove('hidden');
    
    // 关闭摄像头
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
}

function sendImage() {
    const imageData = elements.previewImage.src;
    const message = elements.textInput.value.trim() || '请分析这张图片';
    
    // 显示用户消息（包含图片）
    showMessage(message, 'user', imageData);
    
    // 清空输入框
    elements.textInput.value = '';
    elements.sendBtn.disabled = true;
    
    // 发送到API
    sendToAPI(message, imageData);
    
    // 关闭预览
    elements.imagePreview.classList.add('hidden');
}

function retakePhoto() {
    elements.imagePreview.classList.add('hidden');
    openCamera();
}

function cancelImage() {
    elements.imagePreview.classList.add('hidden');
}

// 图片文件上传处理
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
        showMessage('请选择图片文件', 'bot');
        return;
    }

    // 检查文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
        showMessage('图片文件过大，请选择小于10MB的图片', 'bot');
        return;
    }

    // 读取文件并转换为base64
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;

        // 显示预览
        elements.previewImage.src = imageData;
        elements.imagePreview.classList.remove('hidden');
    };
    reader.onerror = function() {
        showMessage('图片读取失败，请重试', 'bot');
    };
    reader.readAsDataURL(file);

    // 清空input以便再次选择同一文件
    event.target.value = '';
}

// 工具函数
function formatTime(date) {
    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 将录音转换为 Base64 WAV
async function blobToWavBase64(blob) {
    // 将浏览器录音解码后重新封装为 PCM WAV，并转成 Base64
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const wavBuffer = encodeWav(audioBuffer);
    const base64Data = arrayBufferToBase64(wavBuffer);
    const durationSec = Math.max(1, Math.round(audioBuffer.duration));

    return {
        data: base64Data,
        format: 'wav',
        durationSec: durationSec
    };
}

// 生成 WAV 二进制数据
function encodeWav(audioBuffer) {
    // 按 WAV 头规范写入 PCM 数据
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const samples = floatTo16BitPCM(channelData);

    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true);  // PCM
    view.setUint16(22, 1, true);  // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // ByteRate = SampleRate * NumChannels * BytesPerSample
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        view.setInt16(offset, samples[i], true);
        offset += 2;
    }

    return buffer;
}

// 浮点转16位PCM
function floatTo16BitPCM(floatData) {
    // 浮点采样转 16 位有符号整型
    const pcmData = new Int16Array(floatData.length);
    for (let i = 0; i < floatData.length; i++) {
        const sample = Math.max(-1, Math.min(1, floatData[i]));
        pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    return pcmData;
}

// 写入字符串到 DataView
function writeString(view, offset, string) {
    // 写入 ASCII 字符到 DataView
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// ArrayBuffer 转 Base64
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = '';

    for (let i = 0; i < bytes.length; i += chunkSize) {
        const subarray = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, subarray);
    }

    return btoa(binary);
}

// 错误处理
window.addEventListener('error', function(event) {
    console.error('全局错误:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('未处理的Promise拒绝:', event.reason);
});

// PWA 支持
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker注册成功:', registration.scope);
            })
            .catch(function(error) {
                console.log('ServiceWorker注册失败:', error);
            });
    });
}

// 导出函数供调试使用
window.chatApp = {
    sendMessage: handleSendMessage,
    showMessage: showMessage,
    sendToAPI: sendToAPI,
    testAPI: async function() {
        console.log('测试API连接...');
        await sendToAPI('你好');
    }
};
