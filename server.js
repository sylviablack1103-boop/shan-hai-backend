// 1. 导入所需的模块
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

// 2. 创建 Express 应用
const app = express();
const port = process.env.PORT || 9000;  // 云函数默认使用 9000 端口

// 3. 配置 CORS（允许跨域请求）
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. 允许解析 JSON 格式的请求体
app.use(express.json());

// 5. 主要的 API 接口 - 处理 AI 聊天请求
app.post('/api/chat', async (req, res) => {
    try {
        console.log("后厨收到了一个点单！");
        
        // 从请求体中提取参数
        const { systemPrompt, model, url, key } = req.body;

        // 验证必需参数
        if (!systemPrompt || !model || !url || !key) {
            return res.status(400).json({ 
                error: '缺少必需参数',
                message: '请确保提供了 systemPrompt, model, url, key' 
            });
        }

        // 向 AI 服务发送请求
        const response = await axios.post(
            `${url.replace(/\/$/, '')}/v1/chat/completions`,
            {
                model: model,
                messages: [{ role: 'system', content: systemPrompt }],
                max_tokens: 500
            },
            {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000  // 30秒超时
            }
        );

        console.log("采购成功，准备上菜！");
        res.json(response.data);

    } catch (error) {
        console.error('后厨出错了:', error.response ? error.response.data : error.message);
        
        // 返回详细的错误信息
        res.status(500).json({ 
            error: '后厨出错了',
            message: error.response?.data?.error?.message || error.message,
            details: error.response?.data || null
        });
    }
});

// 6. 健康检查接口 - 用于测试服务是否正常运行
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: '山海经后端服务运行中',
        timestamp: new Date().toISOString()
    });
});

// 7. 兼容云函数和本地环境
if (process.env.TENCENTCLOUD_RUNENV === 'SCF') {
    // 在腾讯云函数环境中，导出 app 对象
    module.exports = app;
} else {
    // 在本地环境中，启动服务器
    app.listen(port, () => {
        console.log(`服务运行在端口 ${port}`);
    });
}