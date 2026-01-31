const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// 1. 让外部能访问你的静态网页
app.use(express.static('website'));

// 2. 一个专门给前端提供"文件列表"的接口
app.get('/api/files', (req, res) => {
    const dataDir = path.join(__dirname, '外星球世界观汇总');
    
    // 递归获取所有txt文件
    function getAllTxtFiles(dir, baseDir = '') {
        let results = [];
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const relativePath = path.join(baseDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // 递归读取子目录
                results = results.concat(getAllTxtFiles(fullPath, relativePath));
            } else if (item.endsWith('.txt')) {
                results.push(relativePath);
            }
        }
        
        return results;
    }
    
    try {
        const txtFiles = getAllTxtFiles(dataDir);
        res.json(txtFiles);
    } catch (err) {
        console.error('读取目录失败:', err);
        res.status(500).send('读取失败');
    }
});

// 3. 读取文件内容的接口
app.get('/api/content', (req, res) => {
    const fileName = req.query.name;
    if (!fileName) {
        return res.status(400).send('缺少文件名参数');
    }
    
    // 安全检查：防止目录遍历攻击
    const sanitizedPath = fileName.replace(/\.\./g, '').replace(/\\/g, '/');
    const filePath = path.join(__dirname, '外星球世界观汇总', sanitizedPath);
    
    // 确保文件在允许的目录内
    const resolvedPath = path.resolve(filePath);
    const allowedDir = path.resolve(path.join(__dirname, '外星球世界观汇总'));
    
    if (!resolvedPath.startsWith(allowedDir)) {
        return res.status(403).send('访问被拒绝');
    }
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('读取文件失败:', err);
            return res.status(404).send('文件找不到');
        }
        res.send(data);
    });
});

app.listen(port, () => {
    console.log(`网站已在 http://localhost:${port} 启动`);
});
