// 1. 把我们招聘的员工（总管、采购员、保险柜、保安）都叫进来
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

// 2. “总管”Express上任，整个后厨现在归他管
const app = express();
const port = 3000; // 我们的后厨开在3000号门

// 3. “总管”定下规矩
app.use(cors({ origin: '*' })); // 保安上岗，允许所有前台访问
app.use(express.json()); // 允许点单时使用JSON这种通用语言

// 4. 定义一道核心菜：“AI聊天”
// 当餐厅前台向'/api/chat'这个地址点菜(post)时，按以下步骤处理
app.post('/api/chat', async (req, res) => {
    try {
        console.log("后厨收到了一个点单！");

        // 从前台的点单(req.body)里，拿出顾客想说的具体内容(systemPrompt)
        const { systemPrompt } = req.body;
        const { model, url, key } = req.body; // 把模型、URL、密钥也从前端传来

        // 派“采购员”axios，带上我们的“秘方”（从保险柜里拿的API Key）
        // 去AI公司采购食材
        // 注意：这里的逻辑需要和你前端的callLLM函数完全对应
        const response = await axios.post(
            `${url.replace(/\/$/, '')}/v1/chat/completions`, // 拼接成完整的请求地址
            {
                model: model,
                messages: [{ role: 'system', content: systemPrompt }],
                max_tokens: 500
            },
            {
                headers: {
                    'Authorization': `Bearer ${key}`, // 使用前端传来的密钥
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log("采购成功，准备上菜！");
        // 把采购回来的新鲜食材（AI的回复），完整地端回给前台(res)
        res.json(response.data);

    } catch (error) {
        console.error('后厨出错了:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: '后厨出错了，请检查日志' });
    }
});

module.exports = app; 