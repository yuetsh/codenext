<script lang="ts" setup>
import copyTextToClipboard from "copy-text-to-clipboard"
import { useMessage } from "naive-ui"
import DebugEditor from "../components/DebugEditor.vue"
import FloatingPanel from "../components/FloatingPanel.vue"
import { code, input, reset, size, output } from "../composables/code"
import { debug } from "../api"
import { ref, computed } from "vue"
import { Icon } from "@iconify/vue"

const message = useMessage()
const showDebug = ref(false)
const debugData = ref<any>(null)
const currentStep = ref(0)
const showFloatingPanel = ref(false)
const isAutoRunning = ref(false)
const autoRunInterval = ref<number | null>(null)

// 计算当前行和下一步行
const currentLine = computed(() => {
  if (
    debugData.value &&
    debugData.value.trace &&
    debugData.value.trace[currentStep.value]
  ) {
    const line = debugData.value.trace[currentStep.value].line
    console.log(`Step ${currentStep.value}: currentLine = ${line}`)
    // 确保行号有效
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
    // 确保行号有效且与当前行不同
    return line && line > 0 && line !== currentLine.value ? line : undefined
  }
  console.log(`Step ${currentStep.value}: nextLine = undefined (no next step)`)
  return undefined
})

// 计算当前步骤的变量
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

// 计算当前行文字
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

// 计算下一步行文字
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

// 检测是否为最后一步且事件为 raw_input
const isLastStepRawInput = computed(() => {
  if (
    debugData.value &&
    debugData.value.trace &&
    debugData.value.trace.length > 0
  ) {
    const lastStep = debugData.value.trace[debugData.value.trace.length - 1]
    return lastStep.event === "raw_input"
  }
  return false
})

// 获取事件类型的中文描述
function getEventText(event: string): string {
  switch (event) {
    case "step_line":
      return "" // 普通执行不显示额外文字
    case "call":
      return "(调用函数)"
    case "return":
      return "(函数返回)" // 更准确地表示函数返回
    case "exception":
      return "(异常)"
    case "uncaught_exception":
      return "(未捕获异常)"
    case "raw_input":
      return "(等待输入)"
    default:
      return event || ""
  }
}

// 计算当前步骤的输出
const currentOutput = computed(() => {
  if (
    debugData.value &&
    debugData.value.trace &&
    debugData.value.trace[currentStep.value]
  ) {
    return debugData.value.trace[currentStep.value].stdout || ""
  }
  return output.value || ""
})

function copy() {
  copyTextToClipboard(code.value)
  message.success("已经复制好了")
}

async function handleDebug() {
  showDebug.value = true
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

function firstStep() {
  if (debugData.value && debugData.value.trace) {
    currentStep.value = 0
  }
}

function prevStep() {
  if (debugData.value && debugData.value.trace && currentStep.value > 0) {
    currentStep.value--
  }
}

function nextStep() {
  if (
    debugData.value &&
    debugData.value.trace &&
    currentStep.value < debugData.value.trace.length - 1
  ) {
    currentStep.value++
  }
}

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

function closeFloatingPanel() {
  showFloatingPanel.value = false
}

function closeDebug() {
  showDebug.value = false
  showFloatingPanel.value = false
  debugData.value = null
  currentStep.value = 0

  // 停止自动运行
  if (autoRunInterval.value) {
    clearInterval(autoRunInterval.value)
    autoRunInterval.value = null
  }
  isAutoRunning.value = false
}

function autoRun() {
  if (!debugData.value || !debugData.value.trace) return

  if (isAutoRunning.value) {
    // 停止自动运行
    if (autoRunInterval.value) {
      clearInterval(autoRunInterval.value)
      autoRunInterval.value = null
    }
    isAutoRunning.value = false
  } else {
    // 开始自动运行
    isAutoRunning.value = true
    autoRunInterval.value = setInterval(() => {
      if (currentStep.value < debugData.value.trace.length - 1) {
        currentStep.value++
      } else {
        // 到达最后一步，停止自动运行
        if (autoRunInterval.value) {
          clearInterval(autoRunInterval.value)
          autoRunInterval.value = null
        }
        isAutoRunning.value = false
      }
    }, 500) // 每500毫秒执行一步
  }
}
</script>

<template>
  <n-flex align="center" class="header">
    <Icon icon="streamline-emojis:lemon" :width="24" :height="24"></Icon>
    <span class="title">代码区</span>
    <n-button
      quaternary
      type="error"
      :disabled="!code.value"
      @click="handleDebug"
    >
      调试
    </n-button>
    <template v-if="showDebug">
      <n-tooltip>
        <template #trigger>
          <n-button text @click="firstStep">
            <template #icon>
              <Icon icon="tabler:player-skip-back" />
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
            :type="isAutoRunning ? 'warning' : 'success'"
            text
            @click="autoRun"
          >
            <template #icon>
              <Icon
                :icon="
                  isAutoRunning ? 'tabler:player-pause' : 'tabler:player-play'
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
              <Icon icon="tabler:player-skip-forward" />
            </template>
          </n-button>
        </template>
        最后一步
      </n-tooltip>
      <n-tooltip>
        <template #trigger>
          <n-button text type="error" @click="closeDebug">
            <template #icon>
              <Icon icon="tabler:x" />
            </template>
          </n-button>
        </template>
        关闭调试
      </n-tooltip>
    </template>
    <n-button quaternary type="primary" @click="copy">复制</n-button>
    <n-button quaternary @click="reset">清空</n-button>
    <n-button
      v-if="showDebug"
      quaternary
      type="info"
      @click="showFloatingPanel = !showFloatingPanel"
    >
      {{ showFloatingPanel ? "隐藏面板" : "显示面板" }}
    </n-button>
    <!-- 调试进度条 -->
    <n-flex
      align="center"
      v-if="showDebug && debugData && debugData.trace"
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
  </n-flex>

  <div class="debug-container">
    <DebugEditor
      v-model="code.value"
      :font-size="size"
      :language="code.language"
      :current-line="currentLine"
      :next-line="nextLine"
      :current-line-text="currentLineText"
      :next-line-text="nextLineText"
    />

    <!-- 浮动面板 -->
    <FloatingPanel
      :visible="showFloatingPanel"
      :variables="currentVariables"
      :output="currentOutput"
      @close="closeFloatingPanel"
    />
  </div>
</template>
<style scoped>
.header {
  padding: 12px 20px;
  height: 60px;
  box-sizing: border-box;
}
.title {
  font-size: 16px;
}
.debug-container {
  position: relative;
}

.progress-section {
  flex: 1;
  margin-left: 12px;
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
