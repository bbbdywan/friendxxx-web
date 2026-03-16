# 🚀 网站部署指南

## 📊 当前状态

✅ **已完成**：
- 项目已成功构建（dist 目录）
- 服务器连接已测试成功
- index.html 已上传到服务器
- Nginx 已重新加载

❌ **待完成**：
- assets 目录文件需要上传（约 776KB）

## 🔧 服务器信息

- **服务器 IP**: 175.178.252.31 (或 43.138.55.31)
- **用户**: root
- **密钥文件**: `C:\Users\bb\Downloads\remoteautodk.pem`
- **Web 根目录**: `/var/dist`
- **访问地址**: http://175.178.252.31

## 📦 快速部署方法

### 方法 1：使用 WinSCP（最简单）⭐

1. **下载 WinSCP**: https://winscp.net/eng/download.php

2. **连接配置**：
   - 文件协议：SFTP
   - 主机名：175.178.252.31
   - 端口号：22
   - 用户名：root
   - 密码：留空
   - 点击"高级" → "SSH" → "验证"
   - 私钥文件：浏览选择 `C:\Users\bb\Downloads\remoteautodk.pem`

3. **上传文件**：
   - 左侧：本地 `F:\baib\new-project-name\dist\`
   - 右侧：服务器 `/var/dist/`
   - 拖拽 `assets` 文件夹到右侧
   - 选择"覆盖"

4. **完成**！刷新 http://175.178.252.31 查看效果

---

### 方法 2：使用 PowerShell + 压缩包

#### 步骤 1：在本地压缩 dist 目录
```powershell
cd F:\baib\new-project-name
Compress-Archive -Path "dist\*" -DestinationPath "dist.zip" -Force
```

#### 步骤 2：上传 dist.zip 到服务器
使用 WinSCP 或其他 FTP 工具将 `dist.zip` 上传到服务器的 `/tmp/` 目录

#### 步骤 3：在服务器上解压
在服务器上运行以下命令（使用之前测试过的 MCP 工具）：
```bash
cd /var/dist
unzip -o /tmp/dist.zip
systemctl reload nginx
rm /tmp/dist.zip
echo "✅ 部署完成！"
```

---

### 方法 3：使用 Git 部署（推荐用于持续部署）

#### 初次设置

1. **在 GitHub/Gitee 创建仓库**

2. **提交代码**：
```powershell
git add .
git commit -m "Update website"
git push origin main
```

3. **在服务器上设置**：
```bash
cd /var
git clone https://github.com/你的用户名/你的仓库.git dist-new
cd dist-new
npm install
npm run build
cp -r dist/* /var/dist/
systemctl reload nginx
```

#### 后续更新
```powershell
# 本地
git add .
git commit -m "Update"
git push

# 服务器
cd /var/dist-new
git pull
npm run build
cp -r dist/* /var/dist/
systemctl reload nginx
```

---

## 🔍 验证部署

### 1. 检查服务器文件
```bash
ls -lh /var/dist/assets/
```
应该看到：
- index-B63uiUN0.js (约 438KB)
- index-BcuELilg.css (约 337KB)
- 其他文件...

### 2. 访问网站
打开浏览器访问：http://175.178.252.31

### 3. 检查控制台
按 F12 打开开发者工具，确保没有 404 或加载错误。

---

## 🐛 常见问题

### Q: SCP 连接超时
**A**: 可能端口不是 22，或者有防火墙。使用 WinSCP 图形界面更可靠。

### Q: 文件上传后网站还是空白
**A**: 检查：
1. 文件权限：`chmod -R 755 /var/dist`
2. Nginx 配置：`nginx -t`
3. 浏览器缓存：Ctrl+Shift+R 强制刷新

### Q: JavaScript 加载失败（MIME type 错误）
**A**: 确保 assets 目录下的文件都已上传，不是空目录。

---

## 📝 下次部署

创建一个简化的部署脚本（deploy.sh）放在服务器上：
```bash
#!/bin/bash
cd /var/dist
unzip -o /tmp/dist.zip
systemctl reload nginx
echo "✅ 部署完成！访问 http://175.178.252.31"
```

使用方法：
1. 上传 dist.zip 到 /tmp/
2. 运行：`bash /var/dist/deploy.sh`

---

## 🎉 完成后

访问这些页面测试：
- 首页：http://175.178.252.31/
- 管理员界面：http://175.178.252.31/#/admin
- 登录页面：http://175.178.252.31/#/login

---

**建议**：为了以后更方便，可以：
1. ✅ 使用 GitHub Actions 自动部署
2. ✅ 配置域名（而不是 IP 访问）
3. ✅ 启用 HTTPS（Let's Encrypt 免费证书）
4. ✅ 配置 CDN 加速静态资源



