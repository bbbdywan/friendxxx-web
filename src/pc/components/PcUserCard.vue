<template>
  <div class="pc-user-card" @click="$emit('viewProfile', user.id)">
    <div class="card-cover">
      <el-image :src="user.avatar" fit="cover" class="card-avatar">
        <template #error><div class="avatar-fallback">{{ (user.name || '用')[0] }}</div></template>
      </el-image>
      <div class="online-dot" v-if="user.isOnline"></div>
    </div>
    <div class="card-body">
      <div class="card-name-row">
        <h4 class="card-name">{{ user.name }}</h4>
        <span v-if="user.matchScore > 0" class="match-badge">{{ user.matchScore }}%匹配</span>
      </div>
      <div class="card-meta">
        <span v-if="user.age">{{ user.age }}岁</span>
        <span v-if="user.distance">{{ user.distance }}km</span>
      </div>
      <div class="card-tags" v-if="user.tags && user.tags.length">
        <el-tag v-for="tag in user.tags.slice(0, 3)" :key="tag" size="small" type="info" round>{{ tag }}</el-tag>
      </div>
    </div>
    <div class="card-actions">
      <el-button size="small" type="primary" round @click.stop="$emit('like', user)">喜欢</el-button>
      <el-button size="small" round @click.stop="$emit('follow', user)">关注</el-button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  user: { type: Object, required: true }
})
defineEmits(['like', 'follow', 'viewProfile'])
</script>

<style scoped>
.pc-user-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
  cursor: pointer;
}

.pc-user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 107, 157, 0.15);
}

.card-cover {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.card-avatar {
  width: 100%;
  height: 100%;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  color: white;
  font-size: 48px;
  font-weight: 600;
}

.online-dot {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 12px;
  height: 12px;
  background: #4CAF50;
  border-radius: 50%;
  border: 2px solid white;
}

.card-body {
  padding: 14px 16px 8px;
}

.card-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.card-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.match-badge {
  font-size: 11px;
  color: #fff;
  background: linear-gradient(135deg, #ff6b9d, #f093fb);
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.card-tags .el-tag {
  font-size: 12px;
}

.card-actions {
  padding: 8px 16px 14px;
  display: flex;
  gap: 8px;
}

.card-actions .el-button--primary {
  background: linear-gradient(135deg, #ff6b9d, #f093fb);
  border: none;
}
</style>
