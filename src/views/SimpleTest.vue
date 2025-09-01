<template>
  <div>
    <h1>简单测试页面</h1>
    <p>当前时间: {{ new Date().toLocaleString() }}</p>
  </div>
</template>

<script setup>
console.log('SimpleTest组件加载成功')
</script>

<style scoped>
div {
  padding: 20px;
  text-align: center;
}

h1 {
  color: #ff6b9d;
}
</style>
