<script lang="ts" setup>
// Vue 核心
import { ref, computed, watch } from "vue"

// 第三方库
import copyTextToClipboard from "copy-text-to-clipboard"
import { useMessage } from "naive-ui"
import { Icon } from "@iconify/vue"
import { useIntervalFn } from "@vueuse/core"

// 组件
import DebugEditor from "../components/DebugEditor.vue"
import FloatingPanel from "../components/FloatingPanel.vue"

// 组合式函数和类型
import { code, input, reset, size, output, status } from "../composables/code"
import { Status } from "../types"
import { debug } from "../api"

// ==================== 响应式状态 ====================
const message = useMessage()

// 调试状态
const showDebug = ref(false)
const debugData = ref<any>(null)
const currentStep = ref(0)

// UI 状态
const showFloatingPanel = ref(false)

// 自动运行状态
const isAutoRunning = ref(false)

const {
  pause: pauseAutoRun,
  resume: resumeAutoRun,
  isActive: isAutoRunActive,
} = useIntervalFn(
  () => {
    if (currentStep.value < debugData.value.trace.length - 1) {
      currentStep.value++

      // 如果遇到输入步骤，暂停自动运行
      if (debugData.value.trace[currentStep.value]?.event === "raw_input") {
        pauseAutoRun()
        isAutoRunning.value = false
        message.info("程序正在等待输入，自动运行已暂停")
      }
    } else {
      // 到达最后一步，停止自动运行
      pauseAutoRun()
      isAutoRunning.value = false
    }
  },
  500,
  { immediate: false },
)

// 调试状态快照（用于检测代码/输入变化）
let debugStartCode = ""
let debugStartInput = ""

// ==================== 监听器 ====================
// 监听代码变化
watch(
  () => code.value,
  (newCode) => {
    if (showDebug.value && newCode !== debugStartCode) {
      message.warning("代码已修改，请重新点击调试按钮")
    }
  },
)

// 监听输入变化
watch(
  () => input.value,
  (newInput) => {
    if (showDebug.value && newInput !== debugStartInput) {
      message.warning("输入已修改，请重新点击调试按钮")
    }
  },
)

// ==================== 计算属性 ====================
// 调试行号相关
const currentLine = computed(() => {
  if (
    debugData.value &&
    debugData.value.trace &&
    debugData.value.trace[currentStep.value]
  ) {
    const line = debugData.value.trace[currentStep.value].line
    console.log(`Step ${currentStep.value}: currentLine = ${line}`)
    return line && line > 0 ? line : undefined
  }
  return undefined
})

const nextLine = computed(() => {
  if (
    debugData.value &&
    debugData.value.trace &&
    debugData.value.trace[currentStep.value + 1]
  ) {
    const line = debugData.value.trace[currentStep.value + 1].line
    console.log(`Step ${currentStep.value}: nextLine = ${line}`)
    return line && line > 0 && line !== currentLine.value ? line : undefined
  }
  console.log(`Step ${currentStep.value}: nextLine = undefined (no next step)`)
  return undefined
})

// 调试信息相关
const currentVariables = computed(() => {
  if (
    debugData.value &&
    debugData.value.trace &&
    debugData.value.trace[currentStep.value]
  ) {
    return debugData.value.trace[currentStep.value].globals || {}
  }
  return {}
})

const currentLineText = computed(() => {
  if (
    debugData.value &&
    debugData.value.trace &&
    debugData.value.trace[currentStep.value]
  ) {
    const step = debugData.value.trace[currentStep.value]
    const isLastStep = currentStep.value === debugData.value.trace.length - 1
    const eventText = isLastStep ? "" : getEventText(step.event)
    const stepText = isLastStep
      ? "最后一步"
      : `当前第${currentStep.value + 1}步`
    return `${stepText}${eventText}`
  }
  return undefined
})

const nextLineText = computed(() => {
  if (
    debugData.value &&
    debugData.value.trace &&
    debugData.value.trace[currentStep.value + 1]
  ) {
    const step = debugData.value.trace[currentStep.value + 1]
    const isNextLastStep =
      currentStep.value + 1 === debugData.value.trace.length - 1
    const eventText = isNextLastStep ? "" : getEventText(step.event)
    const stepText = isNextLastStep ? "最后一步" : `下一步`
    return `${stepText}${eventText}`
  }
  return undefined
})

// ==================== 工具函数 ====================
/**
 * 获取事件类型的中文描述
 */
function getEventText(event: string): string {
  switch (event) {
    case "step_line":
      return "" // 普通执行不显示额外文字
    case "call":
      return "(调用函数)"
    case "return":
      return "(函数返回)"
    case "exception":
      return "(异常)"
    case "uncaught_exception":
      return "(异常)"
    case "raw_input":
      return "(等待输入)"
    default:
      return event || ""
  }
}

// 输出相关
const currentOutput = computed(() => {
  if (
    debugData.value &&
    debugData.value.trace &&
    debugData.value.trace.length > 0
  ) {
    let outputText = ""

    for (let i = 0; i <= currentStep.value; i++) {
      const step = debugData.value.trace[i]
      if (step) {
        if (step.event === "exception" || step.event === "uncaught_exception") {
          if (step.exception_msg) {
            outputText = step.exception_msg
          }
        } else if (step.stdout) {
          outputText = step.stdout
        }
      }
    }

    outputText = outputText.trimEnd()

    const hasException = debugData.value.trace.some(
      (step: any) =>
        step.event === "exception" || step.event === "uncaught_exception",
    )
    status.value = hasException ? Status.RuntimeError : Status.Accepted

    output.value = outputText
    return outputText
  }
  return output.value || ""
})

// ==================== 主要功能函数 ====================
/**
 * 复制代码到剪贴板
 */
function copy() {
  copyTextToClipboard(code.value)
  message.success("已经复制好了")
}

/**
 * 开始调试
 */
async function handleDebug() {
  showDebug.value = true
  showFloatingPanel.value = true
  // 保存调试开始时的代码和输入状态
  debugStartCode = code.value
  debugStartInput = input.value

  const inputs = input.value ? input.value.split("\n") : []
  const res = await debug(code.value, inputs)
  debugData.value = res.data
  currentStep.value = 0

  // 检查步骤数量并显示提醒
  if (res.data.trace && res.data.trace.length > 5000) {
    message.warning(`超过 5000 步，请优化代码或减少循环次数`)
  }

  // 检查最后一步是否为 raw_input 事件
  if (res.data.trace && res.data.trace.length > 0) {
    const lastStep = res.data.trace[res.data.trace.length - 1]
    if (lastStep.event === "raw_input") {
      message.info("程序正在等待输入，请在输入框输入内容后重新点击调试按钮")
    }
  }

  // 显示前几个 trace 条目的行号
  if (res.data.trace) {
    console.log("First few trace entries:")
    res.data.trace.slice(0, 5).forEach((entry: any, index: number) => {
      console.log(`  Step ${index}: line ${entry.line}, event: ${entry.event}`)
    })
  }
}

// ==================== 调试控制函数 ====================
/**
 * 跳转到第一步
 */
function firstStep() {
  if (debugData.value && debugData.value.trace) {
    currentStep.value = 0
  }
}

/**
 * 上一步
 */
function prevStep() {
  if (debugData.value && debugData.value.trace && currentStep.value > 0) {
    currentStep.value--
  }
}

/**
 * 下一步
 */
function nextStep() {
  if (
    debugData.value &&
    debugData.value.trace &&
    currentStep.value < debugData.value.trace.length - 1
  ) {
    currentStep.value++
  }
}

/**
 * 跳转到最后一步
 */
function lastStep() {
  if (debugData.value && debugData.value.trace) {
    currentStep.value = debugData.value.trace.length - 1

    // 如果最后一步是 raw_input，显示提醒
    const lastStep = debugData.value.trace[debugData.value.trace.length - 1]
    if (lastStep.event === "raw_input") {
      message.info("程序正在等待输入，请在输入区域输入内容后重新调试")
    }
  }
}

// ==================== UI控制函数 ====================
/**
 * 关闭浮动面板
 */
function closeFloatingPanel() {
  showFloatingPanel.value = false
}

/**
 * 关闭调试模式
 */
function closeDebug() {
  showDebug.value = false
  showFloatingPanel.value = false
  debugData.value = null
  currentStep.value = 0

  // 清除保存的调试状态
  debugStartCode = ""
  debugStartInput = ""

  // 停止自动运行
  pauseAutoRun()
  isAutoRunning.value = false
}

/**
 * 自动运行/暂停
 */
function autoRun() {
  if (!debugData.value || !debugData.value.trace) return

  if (isAutoRunActive.value) {
    // 停止自动运行
    pauseAutoRun()
    isAutoRunning.value = false
  } else {
    // 开始自动运行
    isAutoRunning.value = true
    resumeAutoRun()
  }
}
</script>

<template>
  <!-- 头部工具栏 -->
  <n-flex align="center" class="header">
    <!-- 标题和基础操作 -->
    <Icon icon="streamline-emojis:lemon" :width="24" :height="24" />
    <span class="title">代码区</span>

    <n-button quaternary type="primary" @click="copy">复制</n-button>
    <n-button quaternary @click="reset">清空</n-button>
    <n-button
      quaternary
      type="error"
      :disabled="!code.value"
      @click="handleDebug"
    >
      调试
    </n-button>

    <!-- 调试控制按钮 -->
    <template v-if="showDebug">
      <!-- 步骤控制 -->
      <n-tooltip>
        <template #trigger>
          <n-button text @click="firstStep">
            <template #icon>
              <Icon icon="material-symbols:skip-previous" />
            </template>
          </n-button>
        </template>
        第一步
      </n-tooltip>

      <n-tooltip>
        <template #trigger>
          <n-button text type="primary" @click="prevStep">
            <template #icon>
              <Icon icon="tabler:chevron-left" />
            </template>
          </n-button>
        </template>
        上一步
      </n-tooltip>

      <n-tooltip>
        <template #trigger>
          <n-button
            :type="isAutoRunning ? 'warning' : 'info'"
            text
            @click="autoRun"
          >
            <template #icon>
              <Icon
                :icon="
                  isAutoRunning
                    ? 'material-symbols:pause'
                    : 'material-symbols:play-arrow'
                "
              />
            </template>
          </n-button>
        </template>
        {{ isAutoRunning ? "暂停自动运行" : "开始自动运行" }}
      </n-tooltip>

      <n-tooltip>
        <template #trigger>
          <n-button type="error" text @click="nextStep">
            <template #icon>
              <Icon icon="tabler:chevron-right" />
            </template>
          </n-button>
        </template>
        下一步
      </n-tooltip>

      <n-tooltip>
        <template #trigger>
          <n-button text @click="lastStep">
            <template #icon>
              <Icon icon="material-symbols:skip-next" />
            </template>
          </n-button>
        </template>
        最后一步
      </n-tooltip>

      <!-- 面板控制 -->
      <n-button
        quaternary
        type="info"
        @click="showFloatingPanel = !showFloatingPanel"
      >
        {{ showFloatingPanel ? "隐藏面板" : "显示面板" }}
      </n-button>
    </template>

    <!-- 调试进度条 -->
    <n-flex
      v-if="showDebug && debugData && debugData.trace"
      align="center"
      class="progress-section"
    >
      <n-slider
        v-model:value="currentStep"
        :min="0"
        :max="debugData.trace.length - 1"
        :step="1"
        :tooltip="false"
        class="debug-progress"
      />
      <span class="progress-text">
        步骤: {{ currentStep + 1 }} / {{ debugData.trace.length }}
      </span>
    </n-flex>

    <!-- 关闭调试 -->
    <n-tooltip v-if="showDebug">
      <template #trigger>
        <n-button text type="error" @click="closeDebug">
          <template #icon>
            <Icon icon="tabler:x" />
          </template>
        </n-button>
      </template>
      关闭调试
    </n-tooltip>
  </n-flex>

  <!-- 主要内容区域 -->
  <div class="debug-container">
    <!-- 代码编辑器 -->
    <DebugEditor
      v-model="code.value"
      :font-size="size"
      :language="code.language"
      :current-line="currentLine"
      :next-line="nextLine"
      :current-line-text="currentLineText"
      :next-line-text="nextLineText"
    />

    <!-- 浮动调试面板 -->
    <FloatingPanel
      :visible="showFloatingPanel"
      :variables="currentVariables"
      :output="currentOutput"
      @close="closeFloatingPanel"
    />
  </div>
</template>
<style scoped>
/* ==================== 头部样式 ==================== */
.header {
  padding: 12px 20px;
  height: 60px;
  box-sizing: border-box;
}

.title {
  font-size: 16px;
}

/* ==================== 主容器样式 ==================== */
.debug-container {
  position: relative;
}

/* ==================== 进度条样式 ==================== */
.progress-section {
  flex: 1;
}

.debug-progress {
  flex: 1;
  max-width: 200px;
}

.progress-text {
  font-size: 12px;
  color: var(--n-text-color-disabled);
  white-space: nowrap;
}
</style>
