# 管理员功能说明文档

## 功能概述

本次更新为项目添加了完整的管理员功能模块，包括：
1. 在"我的"界面新增管理员专属入口（仅管理员可见）
2. 全新的用户管理页面，支持用户的增删改查
3. 简洁美观的UI设计，与项目整体风格保持一致

## 实现的功能

### 1. 管理员身份判断
在 `src/views/NewProfilePage.vue` 中添加了 `isAdmin` 计算属性，支持三种判断方式：

- **方式1**: 根据用户账号判断 (`userAccount === 'admin'`)
- **方式2**: 根据用户ID判断 (ID为1的是管理员)
- **方式3**: 根据用户的 role 字段判断 (`role === 'admin'`)

```javascript
const isAdmin = computed(() => {
  if (userInfo.value?.userAccount === 'admin') return true
  if (userInfo.value?.id === '1' || userInfo.value?.id === 1) return true
  if (userInfo.value?.role === 'admin') return true
  return false
})
```

### 2. 管理员入口
在"我的"界面的"退出登录"按钮上方增加了"管理员专属界面"入口：
- 仅当用户为管理员时显示
- 蓝色主题，与整体UI风格一致
- 点击后跳转到 `/admin` 页面

### 3. 管理员页面 (AdminPage)

#### 页面功能
- ✅ **用户列表展示**: 以卡片形式展示用户信息，包括头像、昵称、ID、账号、性别、年龄、创建时间等
- ✅ **搜索功能**: 支持按昵称或账号搜索用户
- ✅ **排序功能**: 支持按创建时间升序/降序排列
- ✅ **时间筛选**: 支持选择时间区间筛选用户
- ✅ **下拉刷新**: 支持下拉刷新用户列表
- ✅ **分页显示**: 每页显示5条数据，支持翻页
- ✅ **新增用户**: 点击右上角"+"按钮可添加新用户
- ✅ **编辑用户**: 点击"编辑"按钮可修改用户信息
- ✅ **删除用户**: 点击"删除"按钮并二次确认后可删除用户

#### 用户字段
- 账号 (userAccount)
- 密码 (userPassword) - 仅新增时填写
- 昵称 (userName)
- 年龄 (age)
- 性别 (gender) - 0:女, 1:男
- 个性签名 (signature)
- 角色 (role) - user:普通用户, admin:管理员

#### UI 特点
- 简洁清新的卡片式设计
- 充足的留白和舒适的行距
- 柔和的色系（浅灰背景、淡蓝主色调）
- 圆角设计 + 阴影效果
- 流畅的过渡动画
- 支持移动端和桌面端响应式布局

## 文件修改说明

### 新增文件
1. `src/views/AdminPage.vue` - 管理员用户管理页面

### 修改文件
1. `src/views/NewProfilePage.vue`
   - 添加了管理员判断逻辑
   - 添加了管理员入口UI
   - 添加了跳转方法

2. `src/router/index.js`
   - 导入 AdminPage 组件
   - 注册 `/admin` 路由

## 如何使用

### 1. 登录管理员账号
使用以下任一条件的账号登录即可看到管理员入口：
- 账号为 `admin`
- 用户ID为 `1`
- 用户 role 字段为 `admin`

### 2. 访问管理员页面
- 在"我的"界面点击"管理员专属界面"按钮
- 或直接访问 `/admin` 路径

### 3. 管理用户
- **搜索**: 在顶部搜索框输入关键词
- **排序**: 使用下拉菜单选择"按创建时间升序"或"按创建时间降序"
- **时间筛选**: 
  1. 点击"开始时间"选择起始日期
  2. 点击"结束时间"选择结束日期
  3. 点击"筛选"按钮应用筛选
  4. 点击"清空"按钮清除筛选条件
- **新增**: 点击右上角"+"图标
- **编辑**: 点击用户卡片的"编辑"按钮
- **删除**: 点击用户卡片的"删除"按钮（需二次确认）
- **翻页**: 使用底部分页组件切换页面

## 数据说明

目前使用的是 **Mock 数据**，已预置7个测试用户。实际部署时需要：

1. 创建后端 API 接口：
   - `GET /api/admin/users` - 获取用户列表
   - `POST /api/admin/users` - 创建用户
   - `PUT /api/admin/users/:id` - 更新用户
   - `DELETE /api/admin/users/:id` - 删除用户
   - `GET /api/admin/users/search` - 搜索用户

2. 在 `src/api/` 目录下创建 `admin.js` 文件：
```javascript
import request from './request'

export const getUserList = (params) => {
  return request.get('/api/admin/users', { params })
}

export const createUser = (data) => {
  return request.post('/api/admin/users', data)
}

export const updateUser = (id, data) => {
  return request.put(`/api/admin/users/${id}`, data)
}

export const deleteUser = (id) => {
  return request.delete(`/api/admin/users/${id}`)
}
```

3. 在 `AdminPage.vue` 中替换 mock 数据为真实 API 调用

## 安全建议

1. **后端验证**: 务必在后端验证用户的管理员权限，不能仅依赖前端判断
2. **权限控制**: 建议添加路由守卫，在进入 `/admin` 前验证管理员权限
3. **敏感操作**: 删除等敏感操作应记录日志
4. **密码安全**: 实际使用时密码应加密传输和存储

## 扩展建议

1. 添加批量操作功能（批量删除、批量导出）
2. 添加用户状态管理（启用/禁用账号）
3. 添加操作日志查看
4. 添加用户统计图表
5. 支持导入/导出用户数据（Excel）
6. 添加更多筛选条件（性别、年龄范围、注册时间等）

## 注意事项

- 管理员入口仅在满足管理员条件时显示
- 删除用户操作不可恢复，请谨慎操作
- 编辑用户时账号不可修改
- 新增用户时密码为必填项
- 所有表单都有基本的验证规则

## 技术栈

- Vue 3 (Composition API)
- Vant 4 (移动端UI组件库)
- Vue Router 4
- Pinia (状态管理)

## 版本信息

- 创建时间: 2025-10-04
- 版本: 1.0.0
- 作者: AI Assistant

---

如有问题或建议，欢迎反馈！

