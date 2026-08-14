<template>
  <div class="prompt-field">
    <div class="prompt-label">
      <span>{{ label }}</span>
      <span v-if="required" class="required">*</span>
      <span class="prompt-hint">{{ hint }}</span>
      <span v-if="charCount" class="char-count">{{ (value || '').length }}/{{ max }}</span>
    </div>
    <van-field
      v-model="value"
      type="textarea"
      :rows="3"
      autosize
      :maxlength="max"
      show-word-limit
      :error="!!error"
      :error-message="error"
      placeholder="请输入内容..."
    />
  </div>
</template>

<script setup>
const props = defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  max: { type: Number, default: 5000 },
  required: { type: Boolean, default: false },
  charCount: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const value = defineModel()
</script>

<style scoped>
.prompt-field { background: #fff; padding: 8px 16px; }
.prompt-label { font-size: 14px; color: #333; margin-bottom: 4px; }
.required { color: #ee0a24; margin-left: 2px; }
.prompt-hint { font-size: 12px; color: #999; margin-left: 8px; }
.char-count { font-size: 12px; color: #999; margin-left: 8px; }
</style>
