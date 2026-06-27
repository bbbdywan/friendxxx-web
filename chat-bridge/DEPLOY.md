# Chat Bridge 部署操作指南

## 1. 云服务器 — 安装依赖并启动

```bash
cd /var/dist/chat
npm install ws
```

设置环境变量并启动：

```bash
export AUTH_TOKEN=你的随机token
export PORT=3001
node server.js
```

或用 pm2 守护：

```bash
npm install -g pm2
pm2 start server.js --name chat-bridge
pm2 save
```

## 2. 云服务器 — 配置 Nginx WebSocket 代理

在 Nginx 的 server 块中添加：

```nginx
location /ws {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400s;
}
```

重载 Nginx：

```bash
nginx -t && nginx -s reload
```

验证聊天页面可访问：`https://你的域名/chat/chat.html`

## 3. Windows PC — 启动客户端

在 `f:\baib\new-project-name\chat-bridge\` 目录下创建 `.env` 文件：

```
WS_URL=wss://你的域名/ws
AUTH_TOKEN=和服务器相同的token
```

启动：

```bash
node client.js
```

看到 `Connected, authenticating...` 和 `Authenticated successfully` 即成功。

## 4. 手机 — 测试

打开 `https://你的域名/chat/chat.html`，页面顶部状态应显示绿色圆点 +「已连接」，输入消息发送即可。

---

## 排错

| 现象 | 检查 |
|------|------|
| 页面打不开 | Nginx 是否正确 serve `/var/dist/chat/` 目录 |
| WS 连接失败 | Nginx 是否 reload，`proxy_pass` 端口是否正确 |
| PC 连不上 | WS_URL 域名和路径是否正确，AUTH_TOKEN 是否一致 |
| 消息发过去没回复 | Windows 上 `claude` 命令是否可用（`claude --version` 验证） |
