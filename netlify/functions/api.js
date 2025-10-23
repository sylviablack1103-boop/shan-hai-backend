// 文件路径: shan-hai-backend/netlify/functions/api.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const serverless = require('serverless-http'); // 引入serverless-http

const app = express();
const router = express.Router(); // 创建一个Router

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 修改后的 shan-hai-backend/netlify/functions/api.js

router.post('/chat', async (req, res) => {
    try {
        console.log("Netlify Function 收到了一个点单！");

        // 1. 从前端获取的参数中不再包含 key
        const { systemPrompt, model, url } = req.body;

        // 2. 从 Netlify 的环境变量中安全地获取 API Key
        const apiKey = process.env.LLM_API_KEY;

        // 3. 检查环境变量是否成功加载
        if (!apiKey) {
            return res.status(500).json({
                error: '服务器配置错误',
                message: '后厨的保险箱是空的 (LLM_API_KEY not found on server)'
            });
        }
        
        if (!systemPrompt || !model || !url) {
            return res.status(400).json({ 
                error: '缺少必需参数',
                message: '请确保提供了 systemPrompt, model, url' 
            });
        }

        const response = await axios.post(
            `${url.replace(/\/$/, '')}/v1/chat/completions`,
            {
                model: model,
                messages: [{ role: 'system', content: systemPrompt }],
                max_tokens: 500
            },
            {
                headers: {
                    // 4. 使用从环境变量中获取的、安全的 apiKey
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        console.log("采购成功，准备上菜！");
        res.json(response.data);
    } catch (error) {
        console.error('后厨出错了:', error.response ? error.response.data : error.message);
        res.status(500).json({ 
            error: '后厨出错了',
            message: error.response?.data?.error?.message || error.message,
            details: error.response?.data || null
        });
    }
});

// 健康检查接口
router.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: '山海经后端服务运行中',
        timestamp: new Date().toISOString()
    });
});

// 将router挂载到 /api 路径
app.use('/api/', router);

// 导出Netlify要用的handler
module.exports.handler = serverless(app);