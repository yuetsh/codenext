<script lang="ts" setup>
// Vue 核心
import { ref, computed, watch } from "vue"

// 第三方库
import copyTextToClipboard from "copy-text-to-clipboard"
import { useMessage } from "naive-ui"
import { Icon } from "@iconify/vue"
import { useIntervalFn } from "@vueuse/core"

// 组件
import DebugEditor from "./DebugEditor.vue"

// 组合式函数和类型
import { code, input, reset, size, output, status } from "../composables/code"
import { Status } from "../types"
import { debug } from "../api"

// ==================== Props 和 Emits ====================
const props = defineProps<{
  initialDebugData?: any
}>()

const emit = defineEmits<{
  close: []
}>()

// ==================== 响应式状态 ====================
const message = useMessage()

// 调试状态
const debugData = ref<any>(props.initialDebugData || null)
const currentStep = ref(0)

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

// ==================== 监听器 ====================
// 监听 props 变化
watch(
  () => props.initialDebugData,
  (newData) => {
    if (newData) {
      debugData.value = newData
      currentStep.value = 0
    }
  },
  { immediate: true },
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

// 格式化变量显示
const formattedVariables = computed(() => {
  const variables = currentVariables.value
  if (!variables || Object.keys(variables).length === 0) {
    return []
  }

  return Object.entries(variables).map(([key, value]) => {
    // 处理特殊类型
    let displayValue = ""
    let displayType = typeof value

    if (
      Array.isArray(value) &&
      value.length === 2 &&
      value[0] === "IMPORTED_FAUX_PRIMITIVE" &&
      value[1] === "imported object"
    ) {
      displayValue = ""
      displayType = "function"
    } else if (typeof value === "object" && value !== null) {
      displayValue = JSON.stringify(value, null, 2)
    } else {
      displayValue = String(value)
    }

    return {
      name: key,
      value: displayValue,
      type: displayType,
    }
  })
})

// 计算输出行数
const outputLines = computed(() => {
  const output = currentOutput.value
  if (!output) return 0
  return output.split("\n").filter((line) => line !== "").length
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

// 当 debugData 更新时，初始化相关状态
watch(
  () => debugData.value,
  (newData) => {
    if (newData) {
      currentStep.value = 0

      // 检查步骤数量并显示提醒
      if (newData.trace && newData.trace.length > 5000) {
        message.warning(`超过 5000 步，请优化代码或减少循环次数`)
      }

      // 显示前几个 trace 条目的行号
      if (newData.trace) {
        console.log("First few trace entries:")
        newData.trace.slice(0, 5).forEach((entry: any, index: number) => {
          console.log(
            `  Step ${index}: line ${entry.line}, event: ${entry.event}`,
          )
        })
      }
    }
  },
  { immediate: true },
)

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
  }
}

// ==================== UI控制函数 ====================
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
  <n-flex>
    <!-- 左侧：分为上中下三层 -->
    <n-flex vertical style="flex: 1">
      <DebugEditor
        v-model="code.value"
        :font-size="size"
        :language="code.language"
        :current-line="currentLine"
        :next-line="nextLine"
        :current-line-text="currentLineText"
        :next-line-text="nextLineText"
      />

      <!-- 中：调试控制按钮 -->
      <n-flex align="center" justify="center" style="margin-top: 20px">
        <!-- 步骤控制 -->
        <n-tooltip>
          <template #trigger>
            <n-button @click="firstStep">
              <template #icon>
                <Icon icon="material-symbols:skip-previous" />
              </template>
            </n-button>
          </template>
          第一步
        </n-tooltip>

        <n-tooltip>
          <template #trigger>
            <n-button type="primary" @click="prevStep">
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
            <n-button type="error" @click="nextStep">
              <template #icon>
                <Icon icon="tabler:chevron-right" />
              </template>
            </n-button>
          </template>
          下一步
        </n-tooltip>

        <n-tooltip>
          <template #trigger>
            <n-button @click="lastStep">
              <template #icon>
                <Icon icon="material-symbols:skip-next" />
              </template>
            </n-button>
          </template>
          最后一步
        </n-tooltip>
      </n-flex>

      <!-- 下：调试进度条 -->
      <n-flex v-if="debugData && debugData.trace" vertical>
        <n-slider
          v-model:value="currentStep"
          :min="0"
          :max="debugData.trace.length - 1"
          :step="1"
          :tooltip="false"
        />
        <!-- 步骤信息 -->
        <n-text
          depth="3"
          style="text-align: center; font-size: 12px; white-space: nowrap"
        >
          步骤: {{ currentStep + 1 }} / {{ debugData.trace.length }}
        </n-text>
      </n-flex>
    </n-flex>

    <!-- 右侧：调试信息面板 -->
    <n-card :bordered="true" size="small" style="width: 350px">
      <template #header>
        <n-flex justify="space-between" align="center">
          <n-flex align="center">
            <n-icon>
              <Icon icon="mdi:bug" :width="16" :height="16" />
            </n-icon>
            <n-text strong>调试信息</n-text>
          </n-flex>
        </n-flex>
      </template>

      <!-- 变量部分 -->
      <n-collapse :default-expanded-names="['variables']">
        <n-collapse-item name="variables">
          <template #header>
            <n-flex align="center">
              <n-icon>
                <Icon icon="mdi:variable" :width="14" :height="14" />
              </n-icon>
              <n-text>变量</n-text>
            </n-flex>
          </template>
          <n-scrollbar style="max-height: 260px">
            <n-space
              v-if="formattedVariables.length === 0"
              vertical
              style="padding: 20px; text-align: center"
            >
              <n-text type="info">暂无变量</n-text>
            </n-space>
            <n-space v-else vertical>
              <n-card
                v-for="variable in formattedVariables"
                :key="variable.name"
                size="small"
                :bordered="true"
              >
                <n-space vertical :size="8">
                  <n-flex justify="space-between" align="center">
                    <n-text strong type="primary">{{ variable.name }}</n-text>
                    <n-tag size="small" type="info">{{ variable.type }}</n-tag>
                  </n-flex>
                  <n-text
                    code
                    style="
                      font-size: 12px;
                      white-space: pre-wrap;
                      word-break: break-all;
                    "
                  >
                    {{ variable.value }}
                  </n-text>
                </n-space>
              </n-card>
            </n-space>
          </n-scrollbar>
        </n-collapse-item>
      </n-collapse>

      <!-- 输出部分 -->
      <n-collapse v-if="currentOutput" :default-expanded-names="['output']">
        <n-collapse-item name="output">
          <template #header>
            <n-flex align="center">
              <n-icon>
                <Icon icon="mdi:console" :width="14" :height="14" />
              </n-icon>
              <n-text>输出({{ outputLines }}行)</n-text>
            </n-flex>
          </template>
          <n-card size="small" :bordered="true">
            <n-scrollbar style="max-height: 300px">
              <n-text
                code
                style="
                  font-size: 12px;
                  white-space: pre-wrap;
                  word-break: break-all;
                  display: block;
                "
              >
                {{ currentOutput }}
              </n-text>
            </n-scrollbar>
          </n-card>
        </n-collapse-item>
      </n-collapse>
    </n-card>
  </n-flex>
</template>
<style scoped></style>
