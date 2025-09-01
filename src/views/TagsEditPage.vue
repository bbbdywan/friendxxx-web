<template>
  <div class="tags-edit-page">
    <!-- 头部导航 -->
    <van-nav-bar
      title="添加标签"
      left-text="返回"
      right-text="完成"
      left-arrow
      @click-left="goBack"
      @click-right="saveTags"
    />
    
    <!-- 内容区域 -->
    <div class="content">
      <div class="subtitle">
        <span v-if="selectedTags.length === 0">添加符合你的10个标签。</span>
        <span v-else>已添加{{ selectedTags.length }}个标签，还可添加{{ 10 - selectedTags.length }}个。</span>
      </div>
      
      <!-- 已选择标签展示区域 -->
      <div v-if="selectedTags.length > 0" class="selected-tags-section">
        <div class="selected-tags-grid">
          <div 
            v-for="tag in selectedTags"
            :key="tag"
            class="selected-tag-item"
          >
            {{ tag }}
            <span class="remove-tag" @click="removeTag(tag)">×</span>
          </div>
        </div>
      </div>
      
      <!-- 分类标签 -->
      <van-tabs v-model:active="activeCategory" @change="onCategoryChange">
        <van-tab 
          v-for="category in tagCategories" 
          :key="category.name"
          :title="category.name"
          :name="category.name"
        >
          <div class="tags-container">
            <div 
              v-for="tag in category.tags" 
              :key="tag"
              class="tag-item"
              :class="{ active: selectedTags.includes(tag), disabled: selectedTags.includes(tag) }"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </div>
          </div>
        </van-tab>
        
        <!-- 自定义标签分类 -->
        <van-tab title="自定义" name="custom">
          <div class="tags-container">
            <!-- 自定义标签 -->
            <div 
              v-for="customTag in customTags" 
              :key="'custom-' + customTag"
              class="tag-item custom-tag"
              :class="{ active: selectedTags.includes(customTag), disabled: selectedTags.includes(customTag) }"
              @click="toggleTag(customTag)"
            >
              {{ customTag }}
            </div>
            
            <!-- 添加自定义标签按钮 -->
            <div class="add-custom-tag" @click="showCustomInput = true">
              + 自定义标签
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>
    
    <!-- 自定义标签输入弹窗 -->
    <van-popup v-model:show="showCustomInput" position="bottom" :style="{ height: '40%' }">
      <div class="custom-input-modal">
        <van-nav-bar
          title="输入你的标签"
          left-text="返回"
          right-text="添加"
          left-arrow
          @click-left="showCustomInput = false"
          @click-right="addCustomTag"
        />
        <div class="input-content">
          <van-field
            v-model="customTagInput"
            placeholder="自定义标签最多8个字"
            maxlength="8"
            show-word-limit
            clearable
            @keyup.enter="addCustomTag"
          />
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showLoadingToast, showSuccessToast, closeToast } from 'vant'
import { updateUser } from '../api/user.js'

const router = useRouter()
const route = useRoute()

// 响应式数据
const selectedTags = ref([])
const customTags = ref([])
const showCustomInput = ref(false)
const customTagInput = ref('')
const activeCategory = ref('运动健身')

// 分类标签数据
const tagCategories = ref([
  {
    name: '运动健身',
    tags: ['露营/徒步', '飞盘', '滑雪', '瑜伽', '攀岩', '健身房撸铁', '骑行', '篮球', '游泳', '羽毛球']
  },
  {
    name: '艺术创作',
    tags: ['摄影', '绘画/手绘', '弹唱', '写小说', '手工DIY', '咖啡拉花', 'Vlog剪辑']
  },
  {
    name: '音乐舞蹈',
    tags: ['K歌达人', '摇滚乐迷', '古典音乐', '说唱文化', '街舞', '国风舞蹈']
  },
  {
    name: '游戏娱乐',
    tags: ['剧本杀', '桌游', '电竞（LOL/原神）', '密室逃脱', '棋类（围棋/象棋）', '麻将']
  },
  {
    name: '收藏爱好',
    tags: ['潮玩收藏', '盲盒控', '书籍收集', '黑胶唱片', '动漫周边']
  },
  {
    name: '美食生活',
    tags: ['咖啡成瘾', '精酿啤酒', '素食主义', '烘焙达人', '火锅党', '探店打卡']
  },
  {
    name: '旅行探索',
    tags: ['背包客', '自驾游', '海岛控', '博物馆爱好者', '历史遗迹', '特种兵旅行']
  },
  {
    name: '健康养生',
    tags: ['早起打卡', '冥想禅修', '轻断食', '泡枸杞', '中医调理']
  },
  {
    name: '科技数码',
    tags: ['元宇宙探索', 'AI工具控', '数码测评', '智能家居']
  },
  {
    name: '居家生活',
    tags: ['宠物陪伴（猫/狗）', '绿植养护', '香薰爱好者', '手账记录']
  },
  {
    name: '性格特质',
    tags: ['社牛/社恐', 'INFJ', '搞笑担当', '高敏感人群', '理性派']
  },
  {
    name: '生活态度',
    tags: ['极简主义', '环保先锋', 'FIRE运动（财务自由）', '反内卷', '佛系青年']
  }
])

// 方法
const toggleTag = (tag) => {
  // 如果已经选中，则不执行任何操作（通过点击小叉叉删除）
  if (selectedTags.value.includes(tag)) {
    return
  }
  
  // 添加标签
  if (selectedTags.value.length < 10) {
    selectedTags.value.push(tag)
  } else {
    showToast('最多只能选择10个标签')
  }
}

const removeTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  }
}

const addCustomTag = () => {
  const tag = customTagInput.value.trim()
  if (!tag) {
    showToast('请输入标签内容')
    return
  }
  
  if (selectedTags.value.includes(tag) || customTags.value.includes(tag)) {
    showToast('标签已存在')
    return
  }
  
  if (selectedTags.value.length >= 10) {
    showToast('最多只能选择10个标签')
    return
  }
  
  customTags.value.push(tag)
  selectedTags.value.push(tag)
  customTagInput.value = ''
  showCustomInput.value = false
}

const onCategoryChange = (name) => {
  activeCategory.value = name
}

// 保存标签到数据库
const saveTags = async () => {
  try {
    showLoadingToast('保存中...')
    
    // 获取用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const userId = userInfo.id
    
    if (!userId) {
      throw new Error('用户ID不存在，请重新登录')
    }
    
    // 构造更新参数，只更新tags字段
    const updateParams = {
      id: parseInt(userId),
      tags: JSON.stringify(selectedTags.value) // 转换为JSON字符串格式
    }
    
    console.log('保存标签参数:', updateParams)
    
    const result = await updateUser(updateParams)
    
    if (result.code === 200 || result.code === 0) {
      showSuccessToast('标签保存成功')
      
      // 更新本地存储的用户信息
      const updatedUserInfo = { ...userInfo, tags: JSON.stringify(selectedTags.value) }
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
      
      // 返回上一页
      setTimeout(() => {
        router.go(-1)
      }, 1000)
    } else {
      throw new Error(result.message || '保存失败')
    }
  } catch (error) {
    console.error('保存标签失败:', error)
    showToast({
      type: 'fail',
      message: error.message || '保存失败，请重试'
    })
  } finally {
    closeToast()
  }
}

const goBack = () => {
  router.go(-1)
}

// 初始化
onMounted(() => {
  // 从路由参数获取已选择的标签
  if (route.query.tags) {
    try {
      const tags = JSON.parse(route.query.tags)
      selectedTags.value = Array.isArray(tags) ? tags : []
    } catch (e) {
      console.error('解析标签失败:', e)
      selectedTags.value = []
    }
  }
})
</script>

<style scoped>
.tags-edit-page {
  min-height: 100vh;
  background: #f8f8f8;
}

.content {
  padding: 16px;
}

.subtitle {
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
  text-align: center;
}

/* 已选择标签展示区域 */
.selected-tags-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.selected-tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-tag-item {
  position: relative;
  padding: 8px 24px 8px 12px;
  background: #1989fa;
  color: white;
  border-radius: 16px;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
}

.remove-tag {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  font-weight: bold;
}

.remove-tag:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 标签选择区域 */
.tags-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px 0;
}

.tag-item {
  padding: 12px 8px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 20px;
  font-size: 13px;
  color: #333;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-item.active {
  background: #e8f4ff;
  color: #1989fa;
  border-color: #1989fa;
}

.tag-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.add-custom-tag {
  padding: 12px 8px;
  background: white;
  border: 1px dashed #ccc;
  border-radius: 20px;
  font-size: 13px;
  color: #999;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.custom-input-modal {
  height: 100%;
  background: white;
}

.input-content {
  padding: 20px;
}

:deep(.van-tabs__content) {
  padding: 0;
}

:deep(.van-tab__panel) {
  padding: 0;
}
</style>


