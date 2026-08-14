<template>
  <div class="editor">
    <div class="editor-header">
      <div class="editor-title">{{ isNew ? '新建角色' : `编辑角色 #${characterId}` }}</div>
      <van-button v-if="isNew" size="small" plain type="warning" @click="fillTemplate">从模板创建</van-button>
      <van-button size="small" type="primary" plain :loading="saving" :disabled="saving" @click="saveDraft">保存草稿</van-button>
      <van-button size="small" type="success" :disabled="!props.characterId" @click="confirmPublish">发布</van-button>
    </div>

    <div class="editor-body">
      <!-- 基础信息 -->
      <van-form @submit.prevent>
        <van-cell-group title="基础信息">
          <van-field v-model="form.name" label="名称" required maxlength="100" placeholder="角色名"
            :error="!!fieldErrors.name" :error-message="fieldErrors.name" />
          <van-field v-model="form.description" label="简介" maxlength="500" placeholder="公开简介" />
          <van-field v-model="form.avatarUrl" label="头像URL" maxlength="500" placeholder="头像地址" />
        </van-cell-group>

        <!-- 五段人设 -->
        <van-cell-group title="人设内容">
          <PromptField v-model="form.identityPrompt" label="身份设定" required char-count :max="5000"
            hint="角色是谁、背景、定位" :error="fieldErrors.identityPrompt" />
          <PromptField v-model="form.personalityPrompt" label="性格与价值观" required char-count :max="5000"
            hint="稳定性格、价值观" :error="fieldErrors.personalityPrompt" />
          <PromptField v-model="form.speakingStylePrompt" label="语言风格" required char-count :max="5000"
            hint="语气、句式、长度" :error="fieldErrors.speakingStylePrompt" />
          <PromptField v-model="form.interactionRulesPrompt" label="互动规则" required char-count :max="5000"
            hint="如何回应用户、追问、共情" :error="fieldErrors.interactionRulesPrompt" />
          <PromptField v-model="form.boundaryPrompt" label="安全边界" required char-count :max="5000"
            hint="不可违反的边界（服务端还会叠加固化底线）" :error="fieldErrors.boundaryPrompt" />
        </van-cell-group>

        <!-- 示例对话 -->
        <van-cell-group title="示例对话（正例/反例）">
          <div class="dialogues">
            <div v-for="(d, i) in form.exampleDialogues" :key="i" class="dialogue-item">
              <div class="dialogue-head">
                <van-tag :type="d.type === 'positive' ? 'success' : 'danger'">
                  {{ d.type === 'positive' ? '正例' : '反例' }}
                </van-tag>
                <van-button size="mini" plain type="danger" @click="removeDialogue(i)">删除</van-button>
              </div>
              <van-field v-model="d.user" label="用户" maxlength="2000" placeholder="用户输入"
                :error="!!fieldErrors[`exampleDialogues[${i}].user`]" :error-message="fieldErrors[`exampleDialogues[${i}].user`]" />
              <van-field v-model="d.reply" label="回复" maxlength="2000" placeholder="理想回复"
                :error="!!fieldErrors[`exampleDialogues[${i}].reply`]" :error-message="fieldErrors[`exampleDialogues[${i}].reply`]" />
            </div>
          </div>
          <div class="add-dialogue">
            <van-button size="small" plain type="success" @click="addDialogue('positive')">+ 正例</van-button>
            <van-button size="small" plain type="danger" @click="addDialogue('negative')">+ 反例</van-button>
          </div>
        </van-cell-group>
      </van-form>

      <!-- 与线上对比 -->
      <van-cell-group v-if="activeContent" title="与线上版本对比">
        <van-cell title="线上版本">
          <template #value>
            <van-button size="mini" plain type="primary" @click="compareVisible = !compareVisible">
              {{ compareVisible ? '收起' : '查看 diff' }}
            </van-button>
          </template>
        </van-cell>
        <div v-if="compareVisible" class="diff-box">
          <div v-for="field in ['identityPrompt','personalityPrompt','speakingStylePrompt','interactionRulesPrompt','boundaryPrompt']" :key="field">
            <div class="diff-field">{{ fieldLabel(field) }}</div>
            <div class="diff-rows">
              <div class="diff-row" :class="form[field] === activeContent[field] ? '' : 'diff-changed'">
                <span class="diff-tag">线上</span>
                <pre>{{ activeContent[field] || '(空)' }}</pre>
              </div>
              <div class="diff-row" :class="form[field] === activeContent[field] ? '' : 'diff-changed'">
                <span class="diff-tag">草稿</span>
                <pre>{{ form[field] || '(空)' }}</pre>
              </div>
            </div>
          </div>
        </div>
      </van-cell-group>

      <!-- 版本历史与回滚 -->
      <van-cell-group title="版本历史">
        <van-cell
          v-for="v in versions"
          :key="v.versionId"
          :title="`v${v.versionNo} · ${v.status === 'published' ? '已发布' : '草稿'}`"
          :label="`${v.changeNote || ''} · ${v.operatorName || '系统'} · ${formatTime(v.publishedAt || v.createTime)}`"
        >
          <template #right-icon>
            <van-button v-if="v.status === 'published'" size="mini" plain type="warning" @click="confirmRollback(v)">回滚</van-button>
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <!-- 发布确认弹窗 -->
    <van-dialog v-model:show="publishVisible" title="发布确认" :show-cancel-button="false"
      :close-on-click-overlay="false">
      <div class="publish-box">
        <div v-if="publishError" class="publish-error">{{ publishError }}</div>
        <van-field v-model="changeNote" label="变更说明" maxlength="500" placeholder="本次改了什么" />
        <div class="publish-actions">
          <van-button plain @click="publishVisible = false" :disabled="publishing">取消</van-button>
          <van-button type="primary" :loading="publishing" :disabled="publishing" @click="submitPublish">确认发布</van-button>
        </div>
      </div>
    </van-dialog>

    <!-- 预览抽屉 -->
    <van-popup v-model:show="previewVisible" position="right" :style="{ width: 'min(560px,100%)', height: '100%' }" closeable>
      <div class="preview">
        <div class="preview-title">草稿预览（不写入正式数据）</div>
        <div class="preview-messages">
          <div v-for="(m, i) in previewMessages" :key="i" class="preview-msg" :class="m.isUser ? 'pm-user' : 'pm-ai'">
            {{ m.content }}<span v-if="m.isStreaming" class="cursor">|</span>
          </div>
          <div class="preview-actions">
            <van-button
              v-for="t in presetTests" :key="t"
              size="small" plain type="primary"
              style="margin:4px 4px 0 0"
              @click="runPreview(t)"
            >{{ t }}</van-button>
          </div>
        </div>
        <div class="preview-input">
          <van-field v-model="previewInput" placeholder="输入预览消息" @keyup.enter="runPreview(previewInput)"
            :disabled="!canPreview" />
          <van-button v-if="!previewing" type="primary" :disabled="!canPreview || !previewInput.trim()" @click="runPreview(previewInput)">发送</van-button>
          <van-button v-else class="stop-btn" @click="stopPreview">停止</van-button>
        </div>
      </div>
    </van-popup>

    <div class="editor-actions">
      <van-button block round type="primary" plain :disabled="!canPreview" @click="previewVisible = true">预览草稿</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import {
  adminCharacterDetail, adminSaveDraft, adminPublish,
  adminRollback, adminCreateCharacter, adminPreviewSse
} from '../api/aiAdmin.js'
import PromptField from './PromptField.vue'
import { getApiErrorMessage, getApiFieldErrors } from '../utils/error.js'

const props = defineProps({
  characterId: { type: [Number, String], default: null },
  isNew: { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'saved', 'created'])

const form = reactive({
  name: '', description: '', avatarUrl: '',
  identityPrompt: '', personalityPrompt: '', speakingStylePrompt: '',
  interactionRulesPrompt: '', boundaryPrompt: '',
  exampleDialogues: []
})
const activeContent = ref(null)
const versions = ref([])
const baseVersionNo = ref(0)
const compareVisible = ref(false)
const publishVisible = ref(false)
const changeNote = ref('')
const previewVisible = ref(false)
const previewInput = ref('')
const previewMessages = ref([])
const previewing = ref(false)
const saving = ref(false)
const publishing = ref(false)
const publishError = ref('')
const fieldErrors = ref({})
const presetTests = ['在干嘛', '今天心情不太好', '我升职了！', '我该辞职吗？']

const TEMPLATE = {
  name: '新的AI伙伴',
  description: '一个全新的 AI 聊天角色',
  avatarUrl: '',
  identityPrompt: '你是一个温暖、真诚的 AI 陪伴伙伴，愿意倾听用户的喜怒哀乐。',
  personalityPrompt: '性格温和有耐心，乐观积极，喜欢倾听，善解人意，偶尔带一点小幽默。',
  speakingStylePrompt: '语气自然亲切，口语化，像朋友聊天一样，句子简短，会用语气词。',
  interactionRulesPrompt: '先回应情绪再回应内容；避免说教；每次追问不超过一个问题；不说客服式套话。',
  boundaryPrompt: '不冒充真人；不涉及违法违规内容；遇到自伤或高风险信号时温和建议寻求专业帮助。',
  exampleDialogues: [
    { type: 'positive', user: '今天好累啊', reply: '累坏了吧，跟我说说今天都忙了啥？' },
    { type: 'positive', user: '我升职了！', reply: '哇！太好了！我就知道你能行，今天值得好好庆祝～' },
    { type: 'negative', user: '我不想说话', reply: '嗯，那我不吵你，就在这儿陪你待着。' }
  ]
}

function fillTemplate() {
  Object.assign(form, {
    name: TEMPLATE.name,
    description: TEMPLATE.description,
    avatarUrl: TEMPLATE.avatarUrl,
    identityPrompt: TEMPLATE.identityPrompt,
    personalityPrompt: TEMPLATE.personalityPrompt,
    speakingStylePrompt: TEMPLATE.speakingStylePrompt,
    interactionRulesPrompt: TEMPLATE.interactionRulesPrompt,
    boundaryPrompt: TEMPLATE.boundaryPrompt,
    exampleDialogues: TEMPLATE.exampleDialogues.map(x => ({ ...x }))
  })
  fieldErrors.value = {}
}

function validateForm() {
  const errors = {}
  if (!form.name?.trim()) errors.name = '角色名称不能为空'
  if (!form.identityPrompt?.trim()) errors.identityPrompt = '身份设定不能为空'
  if (!form.personalityPrompt?.trim()) errors.personalityPrompt = '性格设定不能为空'
  if (!form.speakingStylePrompt?.trim()) errors.speakingStylePrompt = '语言风格不能为空'
  if (!form.interactionRulesPrompt?.trim()) errors.interactionRulesPrompt = '互动规则不能为空'
  if (!form.boundaryPrompt?.trim()) errors.boundaryPrompt = '安全边界不能为空'
  ;(form.exampleDialogues || []).forEach((d, i) => {
    if (!d.type) errors[`exampleDialogues[${i}].type`] = '示例类型不能为空'
    if (!d.user?.trim()) errors[`exampleDialogues[${i}].user`] = '示例用户输入不能为空'
    if (!d.reply?.trim()) errors[`exampleDialogues[${i}].reply`] = '示例回复不能为空'
  })
  fieldErrors.value = errors
  if (Object.keys(errors).length > 0) {
    const firstKey = Object.keys(errors)[0]
    showToast(errors[firstKey])
    return false
  }
  return true
}

function emptyForm() {
  Object.assign(form, {
    name: '', description: '', avatarUrl: '',
    identityPrompt: '', personalityPrompt: '', speakingStylePrompt: '',
    interactionRulesPrompt: '', boundaryPrompt: '',
    exampleDialogues: [
      { type: 'positive', user: '在干嘛', reply: '刚好在发呆，被你抓到啦～你呢？' }
    ]
  })
}

async function loadDetail() {
  if (!props.characterId) {
    emptyForm()
    return
  }
  try {
    const res = await adminCharacterDetail(props.characterId)
    if (res.code !== 200) {
      showToast(res.message || '加载失败')
      return
    }
    const d = res.data
    activeContent.value = d.active
    versions.value = d.versions || []
    baseVersionNo.value = d.draftBaseVersionNo ?? d.active?.versionNo ?? 0
    if (d.draft) {
      Object.assign(form, {
        name: d.draft.name || '',
        description: d.draft.description || '',
        avatarUrl: d.draft.avatarUrl || '',
        identityPrompt: d.draft.identityPrompt || '',
        personalityPrompt: d.draft.personalityPrompt || '',
        speakingStylePrompt: d.draft.speakingStylePrompt || '',
        interactionRulesPrompt: d.draft.interactionRulesPrompt || '',
        boundaryPrompt: d.draft.boundaryPrompt || '',
        exampleDialogues: (d.draft.exampleDialogues || []).map(x => ({ ...x }))
      })
    } else if (d.active) {
      Object.assign(form, {
        name: d.active.name || '',
        description: d.active.description || '',
        avatarUrl: d.active.avatarUrl || '',
        identityPrompt: d.active.identityPrompt || '',
        personalityPrompt: d.active.personalityPrompt || '',
        speakingStylePrompt: d.active.speakingStylePrompt || '',
        interactionRulesPrompt: d.active.interactionRulesPrompt || '',
        boundaryPrompt: d.active.boundaryPrompt || '',
        exampleDialogues: (d.active.exampleDialogues || []).map(x => ({ ...x }))
      })
    }
  } catch (e) {
    showToast(getApiErrorMessage(e, '加载失败'))
  }
}

async function saveDraft() {
  if (saving.value) return
  if (!validateForm()) return
  saving.value = true
  try {
    const payload = {
      ...form,
      expectedVersionNo: baseVersionNo.value
    }
    let res
    if (props.isNew) {
      res = await adminCreateCharacter(payload)
    } else {
      res = await adminSaveDraft(props.characterId, payload)
    }
    if (res.code === 200) {
      if (props.isNew && res.data?.id) {
        // 新建成功：父组件更新 characterId 后，watch 会触发 loadDetail 刷新 baseVersionNo
        showToast('角色已创建为草稿/默认停用，可预览或发布')
        emit('created', res.data.id)
        emit('saved')
      } else {
        showToast('草稿已保存')
        emit('saved')
        // 已存在的角色：重新拉取详情同步服务端草稿状态
        await loadDetail()
      }
    } else if (res.code === 409) {
      showConfirmDialog({
        title: '版本冲突',
        message: `${res.message}。刷新后重新编辑？`,
        confirmButtonText: '刷新',
        showCancelButton: true
      }).then(() => loadDetail())
    } else {
      showToast(res.message || '保存失败')
    }
  } catch (e) {
    const msg = getApiErrorMessage(e, '保存失败')
    const fieldErrorsMap = getApiFieldErrors(e)
    if (fieldErrorsMap) {
      Object.assign(fieldErrors.value, fieldErrorsMap)
    }
    showToast(msg)
  } finally {
    saving.value = false
  }
}

function confirmPublish() {
  publishError.value = ''
  publishVisible.value = true
}

async function submitPublish() {
  if (!props.characterId) {
    publishError.value = '请先保存草稿，才能发布'
    return
  }
  if (publishing.value) return
  publishing.value = true
  publishError.value = ''
  try {
    const res = await adminPublish(props.characterId, {
      expectedVersionNo: baseVersionNo.value,
      changeNote: changeNote.value || '发布'
    })
    if (res.code === 200) {
      showToast(`已发布 v${res.data.versionNo}`)
      publishVisible.value = false
      emit('saved')
      await loadDetail()
      return
    }
    // 业务失败（HTTP 200 但 code 非成功）：Dialog 内显示，不关闭
    publishError.value = res.message || '发布失败'
  } catch (e) {
    // 409 冲突：Dialog 内显示具体错误
    publishError.value = getApiErrorMessage(e, '发布失败')
  } finally {
    publishing.value = false
  }
}

async function confirmRollback(v) {
  try {
    await showConfirmDialog({
      title: '回滚确认',
      message: `确定回滚到 v${v.versionNo}？将生成新版本。`,
      showCancelButton: true
    })
  } catch {
    return
  }
  try {
    const res = await adminRollback(props.characterId, v.versionId, `回滚到 v${v.versionNo}`)
    if (res.code === 200) {
      showToast(`已回滚，新版本 v${res.data.versionNo}`)
      emit('saved')
      await loadDetail()
    } else {
      showToast(res.message || '回滚失败')
    }
  } catch (e) {
    showToast(getApiErrorMessage(e, '回滚失败'))
  }
}

function addDialogue(type) {
  form.exampleDialogues.push({ type, user: '', reply: '' })
}

function removeDialogue(i) {
  form.exampleDialogues.splice(i, 1)
}

let previewAbort = null

const canPreview = computed(() => !!props.characterId)

function stopPreview() {
  if (previewAbort) previewAbort.abort()
}

async function runPreview(text) {
  const content = (text || previewInput.value || '').trim()
  if (!content || previewing.value) return
  if (!props.characterId) {
    showToast('请先保存草稿，再预览')
    return
  }
  previewInput.value = ''
  previewing.value = true
  previewMessages.value.push({ content, isUser: true })
  const msgByIndex = new Map()

  const token = localStorage.getItem('accessToken')
  const controller = new AbortController()
  previewAbort = controller
  try {
    await adminPreviewSse({
      id: props.characterId,
      content,
      token,
      signal: controller.signal,
      onMessageStart: (data) => {
        let aiMsg = msgByIndex.get(data.index)
        if (!aiMsg) {
          aiMsg = reactive({ content: '', isUser: false, isStreaming: true })
          previewMessages.value.push(aiMsg)
          msgByIndex.set(data.index, aiMsg)
        }
      },
      onMessageDelta: (data) => {
        let aiMsg = msgByIndex.get(data.index)
        if (!aiMsg) {
          aiMsg = reactive({ content: '', isUser: false, isStreaming: true })
          previewMessages.value.push(aiMsg)
          msgByIndex.set(data.index, aiMsg)
        }
        aiMsg.content += (data.content || '')
      },
      onMessageEnd: (data) => {
        const aiMsg = msgByIndex.get(data.index)
        if (aiMsg) {
          aiMsg.isStreaming = false
          if (!aiMsg.content) aiMsg.content = '（未返回内容）'
        }
      },
      onDone: () => {
        for (const m of previewMessages.value) {
          if (m.isStreaming) m.isStreaming = false
        }
      },
      onError: (err) => {
        for (const m of previewMessages.value) {
          if (m.isStreaming) m.isStreaming = false
        }
        showToast(getApiErrorMessage(err, '预览失败'))
      }
    })
  } catch (e) {
    // 主动停止：保留已输出内容
    const isAbort = e?.name === 'AbortError' || e?.isAborted?.()
    if (!isAbort) {
      showToast(getApiErrorMessage(e, '预览失败'))
    }
    for (const m of previewMessages.value) {
      if (m.isStreaming) m.isStreaming = false
    }
  } finally {
    previewing.value = false
    previewAbort = null
  }
}

function fieldLabel(f) {
  return { identityPrompt: '身份设定', personalityPrompt: '性格', speakingStylePrompt: '风格', interactionRulesPrompt: '规则', boundaryPrompt: '边界' }[f] || f
}

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleString()
}

onMounted(() => {
  if (!props.isNew && props.characterId) {
    loadDetail()
  }
})

// 新建成功 / 父组件更新 characterId 后重新加载详情，刷新 baseVersionNo 与草稿状态
watch(() => props.characterId, (id) => {
  if (id) {
    loadDetail()
  }
})
</script>

<style scoped>
.editor { height: 100%; display: flex; flex-direction: column; background: #f5f5f5; }
.editor-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: white; border-bottom: 1px solid #eee; }
.editor-title { flex: 1; font-weight: 600; }
.editor-body { flex: 1; overflow-y: auto; padding-bottom: 80px; }
.dialogues { padding: 0 16px; }
.dialogue-item { border: 1px solid #eee; border-radius: 12px; padding: 8px; margin-bottom: 12px; background: #fff; }
.dialogue-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.add-dialogue { display: flex; gap: 12px; padding: 8px 16px; }
.diff-box { padding: 12px 16px; background: #fff; }
.diff-field { font-weight: 600; margin: 12px 0 6px; }
.diff-row { display: flex; gap: 8px; margin-bottom: 6px; font-size: 12px; }
.diff-tag { flex-shrink: 0; color: #888; width: 30px; }
.diff-row pre { margin: 0; white-space: pre-wrap; word-break: break-all; background: #f8f8f8; padding: 6px; border-radius: 6px; }
.diff-changed { background: #fffbe6; }
.editor-actions { position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px; background: white; border-top: 1px solid #eee; }
.publish-box { padding: 16px; }
.publish-error { background: #fdecec; color: #ee0a24; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; font-size: 13px; word-break: break-all; }
.publish-actions { display: flex; gap: 12px; margin-top: 16px; }
.publish-actions .van-button { flex: 1; }
.preview { height: 100%; display: flex; flex-direction: column; }
.preview-title { padding: 16px; font-weight: 600; background: white; border-bottom: 1px solid #eee; }
.preview-messages { flex: 1; overflow-y: auto; padding: 16px; }
.preview-msg { margin-bottom: 10px; padding: 10px 14px; border-radius: 12px; max-width: 80%; }
.pm-user { background: #007AFF; color: white; margin-left: auto; }
.pm-ai { background: white; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.preview-input { display: flex; gap: 8px; padding: 12px; background: white; border-top: 1px solid #eee; }
.cursor { animation: blink 1s infinite; }
@keyframes blink { 0%,50% { opacity: 1; } 51%,100% { opacity: 0; } }
</style>
