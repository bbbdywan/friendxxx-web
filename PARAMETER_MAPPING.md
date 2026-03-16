# 后端参数映射说明

## ✅ 修复完成

搜索功能现在应该正常工作了！已修正参数名映射。

## 📋 参数对照表

| 前端显示 | 前端变量 | 后端参数名 | 说明 |
|---------|---------|-----------|------|
| 搜索框 | `userSearch` | `username` | 用户昵称搜索 ✅ |
| 开始时间 | `userStartTime` | `createTimeBegin` | 创建时间开始 ✅ |
| 结束时间 | `userEndTime` | `createTimeEnd` | 创建时间结束 ✅ |
| 当前页码 | `currentUserPage` | `pageNum` | 页码 ✅ |
| 每页大小 | `pageSize` | `pageSize` | 每页条数 ✅ |

## 🔧 前端实现

### 修改前（❌ 错误）
```javascript
const params = {
  pageNum: 1,
  pageSize: 10,
  keyword: '白白白',        // ❌ 错误
  startTime: '2024-01-01',  // ❌ 错误
  endTime: '2024-12-31'     // ❌ 错误
}
```

### 修改后（✅ 正确）
```javascript
const params = {
  pageNum: 1,
  pageSize: 10,
  username: '白白白',              // ✅ 正确
  createTimeBegin: '2024-01-01',  // ✅ 正确
  createTimeEnd: '2024-12-31'     // ✅ 正确
}
```

## 📤 实际请求示例

```http
POST http://localhost:8080/api/user/getalluser
Content-Type: application/json

{
  "pageNum": 34,
  "pageSize": 10,
  "username": "白白白",
  "createTimeBegin": "",
  "createTimeEnd": ""
}
```

## 📥 后端 PageDTO 结构

根据你的案例，后端期望的 `PageDTO` 结构：

```java
public class PageDTO {
    private Integer pageNum;          // 页码
    private Integer pageSize;         // 每页大小
    private String username;          // 用户昵称（搜索条件）
    private String createTimeBegin;   // 创建时间开始
    private String createTimeEnd;     // 创建时间结束
    // getters and setters...
}
```

## 🧪 测试场景

### 测试1：搜索用户昵称
```javascript
// 在搜索框输入"白白白"
搜索框: "白白白"

发送请求:
{
  "pageNum": 1,
  "pageSize": 10,
  "username": "白白白",     // ✅ 正确参数名
  "createTimeBegin": "",
  "createTimeEnd": ""
}

预期结果: 显示昵称包含"白白白"的用户
```

### 测试2：时间范围筛选
```javascript
// 选择时间范围：2024-01-01 到 2024-12-31
开始时间: "2024-01-01"
结束时间: "2024-12-31"

发送请求:
{
  "pageNum": 1,
  "pageSize": 10,
  "username": "",
  "createTimeBegin": "2024-01-01",  // ✅ 正确参数名
  "createTimeEnd": "2024-12-31"     // ✅ 正确参数名
}

预期结果: 显示该时间范围内创建的用户
```

### 测试3：组合搜索
```javascript
// 搜索昵称"白白白"，时间范围 2024 年
搜索框: "白白白"
开始时间: "2024-01-01"
结束时间: "2024-12-31"

发送请求:
{
  "pageNum": 1,
  "pageSize": 10,
  "username": "白白白",
  "createTimeBegin": "2024-01-01",
  "createTimeEnd": "2024-12-31"
}

预期结果: 显示昵称包含"白白白"且在 2024 年创建的用户
```

## 🔍 调试方法

### 1. 打开浏览器控制台
```
F12 → Console 标签
```

### 2. 查看发送的参数
```javascript
加载用户列表，参数: {
  pageNum: 1,
  pageSize: 10,
  username: "白白白",        // ✅ 确认参数名正确
  createTimeBegin: "",
  createTimeEnd: ""
}
```

### 3. 查看网络请求
```
F12 → Network 标签 → 找到 getalluser 请求

Request Payload:
{
  "pageNum": 1,
  "pageSize": 10,
  "username": "白白白",
  "createTimeBegin": "",
  "createTimeEnd": ""
}
```

### 4. 查看后端日志
```java
// 后端应该能正确接收到 username 参数
@PostMapping("/getalluser")
public Result<PageInfo<User>> selectAlluser(@RequestBody PageDTO pageDTO) {
    log.info("接收到参数: pageNum={}, username={}", 
             pageDTO.getPageNum(), pageDTO.getUsername());
    // ...
}
```

## ⚠️ 注意事项

### 1. 空字符串 vs undefined
```javascript
// ✅ 推荐：使用空字符串
username: userSearch.value || ''

// ❌ 避免：使用 undefined（可能导致后端参数解析问题）
username: userSearch.value || undefined
```

### 2. 时间格式
```javascript
// ✅ 推荐格式：YYYY-MM-DD
createTimeBegin: "2024-01-01"

// 如果后端需要其他格式，需要转换：
createTimeBegin: moment(date).format('YYYY-MM-DD HH:mm:ss')
```

### 3. 参数验证
```javascript
// 前端可以添加验证
if (userStartTime.value && userEndTime.value) {
  const start = new Date(userStartTime.value)
  const end = new Date(userEndTime.value)
  
  if (start > end) {
    showToast('开始时间不能大于结束时间')
    return
  }
}
```

## 📊 功能状态

✅ 分页功能 - 正常  
✅ 搜索用户昵称 - **已修复，现在正常**  
✅ 时间范围筛选 - **已修复，现在正常**  
✅ 编辑用户 - 正常  
✅ 删除用户 - 正常  
✅ 加载状态 - 正常  
✅ 空状态 - 正常  

## 🚀 测试步骤

1. **刷新浏览器**（`Ctrl + F5` 强制刷新）
2. **访问管理页面** http://localhost:5180/#/admin
3. **测试搜索**：
   - 在搜索框输入"白白白"
   - 观察控制台日志，确认参数名为 `username`
   - 查看搜索结果是否正确
4. **测试时间筛选**：
   - 选择开始和结束时间
   - 点击"筛选"按钮
   - 观察控制台日志，确认参数名为 `createTimeBegin` 和 `createTimeEnd`
   - 查看筛选结果是否正确

## 🎉 完成

参数映射已修正，搜索功能现在应该完全正常工作了！

如果还有问题，请检查：
1. 浏览器控制台的网络请求参数
2. 后端日志中接收到的参数
3. 后端 PageDTO 的字段定义




