# 用户管理分页功能快速开始

## 快速示例

### 1. API 调用示例

```javascript
import { selectAlluser } from '@/api/user'

// 获取第 1 页，每页 10 条数据
const response = await selectAlluser({
  pageNum: 1,
  pageSize: 10
})

// 响应格式
console.log(response)
// {
//   code: 200,
//   message: "操作成功",
//   data: {
//     total: "1194",      // 总记录数
//     list: [...],        // 当前页用户列表
//     pageNum: 1,         // 当前页码
//     pageSize: 10,       // 每页大小
//     pages: 120          // 总页数
//   }
// }
```

### 2. 用户列表渲染

```vue
<template>
  <!-- 用户列表 -->
  <div v-for="user in users" :key="user.id" class="user-card">
    <img :src="user.avatarUrl" />
    <h3>{{ user.username }}</h3>
    <p>{{ user.email }}</p>
    <van-tag>{{ user.userRole === 1 ? 'admin' : 'user' }}</van-tag>
    <van-button @click="editUser(user)">编辑</van-button>
  </div>

  <!-- 分页控件 -->
  <van-pagination
    v-model="currentPage"
    :total-items="totalUsers"
    :items-per-page="10"
    @change="onPageChange"
  />
</template>

<script setup>
import { ref } from 'vue'
import { selectAlluser } from '@/api/user'

const users = ref([])
const totalUsers = ref(0)
const currentPage = ref(1)

// 加载用户
const loadUsers = async () => {
  const res = await selectAlluser({
    pageNum: currentPage.value,
    pageSize: 10
  })
  
  if (res.code === 200) {
    users.value = res.data.list
    totalUsers.value = parseInt(res.data.total)
  }
}

// 页码变化
const onPageChange = (page) => {
  currentPage.value = page
  loadUsers()
}

// 编辑用户
const editUser = (user) => {
  console.log('编辑用户:', user)
  // 打开编辑对话框，回显数据
}

// 初始加载
loadUsers()
</script>
```

### 3. 搜索和筛选

```javascript
// 带搜索参数
const loadUsersWithSearch = async (keyword) => {
  const res = await selectAlluser({
    pageNum: 1,
    pageSize: 10,
    keyword: keyword,           // 搜索关键词
    sortType: 'desc',           // 排序方式
    startTime: '2024-01-01',    // 开始时间
    endTime: '2024-12-31'       // 结束时间
  })
  // 处理结果...
}

// 监听搜索框
watch(searchKeyword, (newVal) => {
  currentPage.value = 1  // 重置到第一页
  loadUsersWithSearch(newVal)
})
```

### 4. 编辑用户数据回显

```javascript
const editUser = (user) => {
  // 数据映射和回显
  userForm.value = {
    id: user.id,
    userName: user.username,           // 注意字段名映射
    email: user.email || '',
    role: user.userRole === 1 ? 'admin' : 'user',
    statusActive: user.userStatus === 0  // 0=正常, 1=禁用
  }
  
  showEditDialog.value = true
}
```

## 核心要点

### ✅ 每页显示 10 条
```javascript
const pageSize = ref(10)  // 固定每页 10 条
```

### ✅ 页码切换请求后端
```javascript
const onPageChange = (page) => {
  currentPage.value = page
  loadUsers()  // 重新请求后端
}
```

### ✅ 数据字段映射
| 后端 | 前端 | 转换 |
|------|------|------|
| `username` | `userName` | 直接映射 |
| `userRole` | `role` | 0→'user', 1→'admin' |
| `userStatus` | `statusActive` | 0→true, 1→false |

### ✅ 搜索/筛选重置页码
```javascript
watch(searchKeyword, () => {
  currentPage.value = 1  // ⚠️ 重要！
  loadUsers()
})
```

## 测试检查清单

- [ ] 初始加载显示第 1 页，10 条数据
- [ ] 点击下一页，页码变化，列表更新
- [ ] 搜索后回到第 1 页
- [ ] 点击编辑，正确回显用户信息
- [ ] 分页总数正确显示
- [ ] 网络请求参数正确（pageNum, pageSize）
- [ ] 响应数据正确解析（total, list, pages）

## 常用命令

```bash
# 启动开发服务器
npm run dev

# 访问管理页面
http://localhost:5180/#/admin
```

## 效果预览

```
┌─────────────────────────────────────┐
│  管理中心                            │
├─────────────────────────────────────┤
│  用户管理 | AI提示词                 │
├─────────────────────────────────────┤
│  🔍 搜索用户名或邮箱...              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 张三                      │   │
│  │ 📧 zhang@example.com        │   │
│  │ 🏷️  user  ✅ 正常            │   │
│  │ [编辑] [删除]                │   │
│  └─────────────────────────────┘   │
│                                     │
│  ... (共 10 个用户卡片)             │
│                                     │
│  ◀ 1 2 3 ... 120 ▶  (1194条)       │
└─────────────────────────────────────┘
```

---

**提示**: 完整的实现细节和 API 文档请参考 `ADMIN_USER_PAGINATION_GUIDE.md`




