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
import { code, size, output, status } from "../composables/code"
import { Status } from "../types"

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

// 当前步骤对象
const currentTraceEntry = computed(() => {
  return debugData.value?.trace?.[currentStep.value] ?? null
})

// 调试信息相关：优先显示栈顶（高亮）帧的局部变量，没有则用全局
const currentVariables = computed(() => {
  const entry = currentTraceEntry.value
  if (!entry) return {}
  const stack = entry.stack_to_render ?? []
  const topFrame = stack.find((f: any) => f.is_highlighted) ?? stack[stack.length - 1]
  if (topFrame && topFrame.encoded_locals) {
    return { ...(entry.globals ?? {}), ...topFrame.encoded_locals }
  }
  return entry.globals ?? {}
})

// 格式化变量显示
const formattedVariables = computed(() => {
  const variables = currentVariables.value
  if (!variables || Object.keys(variables).length === 0) {
    return []
  }

  const heap: Record<string, any> =
    debugData.value?.trace?.[currentStep.value]?.heap ?? {}

  return Object.entries(variables)
    .filter(([, value]) => {
      // 隐藏导入的模块/函数占位符
      if (
        Array.isArray(value) &&
        value[0] === "IMPORTED_FAUX_PRIMITIVE"
      )
        return false
      if (Array.isArray(value) && value[0] === "FUNCTION") return false
      return true
    })
    .map(([key, value]) => {
      const displayValue = decodeValue(value, heap)
      // resolve REF before checking tag
      const resolved =
        Array.isArray(value) && value[0] === "REF"
          ? heap[String(value[1])]
          : value
      const tag = Array.isArray(resolved) ? resolved[0] : null
      const typeMap: Record<string, string> = {
        LIST: "list",
        TUPLE: "tuple",
        SET: "set",
        DICT: "dict",
        FUNCTION: "function",
        INSTANCE: "object",
        INSTANCE_PPRINT: "object",
        CLASS: "class",
      }
      const displayType =
        tag && typeMap[tag] ? typeMap[tag] : typeof value

      return { name: key, value: displayValue, type: displayType }
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
    // 异常/输入等待/超步数：保留事件提示，让用户能看到状态
    const isStatusEvent =
      step.event === "exception" ||
      step.event === "uncaught_exception" ||
      step.event === "raw_input" ||
      step.event === "mouse_input" ||
      step.event === "instruction_limit_reached"
    const eventText =
      isLastStep && !isStatusEvent ? "" : getEventText(step.event)
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
 * 将 pg_encoder 编码值解析为可读字符串，heap 用于解引用 REF
 */
function decodeValue(val: any, heap: Record<string, any>, depth = 0): string {
  if (depth > 8) return "..."
  if (val === null || val === undefined) return "None"
  if (typeof val === "boolean") return val ? "True" : "False"
  if (typeof val === "string") return JSON.stringify(val)
  if (!Array.isArray(val)) return String(val)

  const [tag, ...rest] = val
  switch (tag) {
    case "REF": {
      const obj = heap[String(rest[0])]
      return obj ? decodeValue(obj, heap, depth + 1) : `REF(${rest[0]})`
    }
    case "LIST":
      return "[" + rest.map((e: any) => decodeValue(e, heap, depth + 1)).join(", ") + "]"
    case "TUPLE":
      return rest.length === 1
        ? "(" + decodeValue(rest[0], heap, depth + 1) + ",)"
        : "(" + rest.map((e: any) => decodeValue(e, heap, depth + 1)).join(", ") + ")"
    case "SET":
      return "{" + rest.map((e: any) => decodeValue(e, heap, depth + 1)).join(", ") + "}"
    case "DICT":
      return (
        "{" +
        rest
          .map(([k, v]: [any, any]) => decodeValue(k, heap, depth + 1) + ": " + decodeValue(v, heap, depth + 1))
          .join(", ") +
        "}"
      )
    case "FUNCTION":
      return `<function ${rest[0]}>`
    case "INSTANCE":
      return `<${rest[0]} instance>`
    case "INSTANCE_PPRINT":
      // [class_name, __str__ value, [attr, value], ...]
      return `<${rest[0]}: ${rest[1]}>`
    case "CLASS":
      return `<class ${rest[0]}>`
    case "SPECIAL_FLOAT":
      return String(rest[0])
    case "IMPORTED_FAUX_PRIMITIVE":
      return String(rest[0])
    default:
      return rest.length === 1 ? String(rest[0]) : JSON.stringify(val)
  }
}

/**
 * 获取事件类型的中文描述
 */
function getEventText(event: string): string {
  switch (event) {
    case "step_line":
      return ""
    case "call":
      return "(调用函数)"
    case "return":
      return "(函数返回)"
    case "exception":
    case "uncaught_exception":
      return "(异常)"
    case "raw_input":
    case "mouse_input":
      return "(等待输入)"
    case "instruction_limit_reached":
      return "(超出步数上限)"
    default:
      return event || ""
  }
}

// 输出：stdout 和异常信息合并显示，不互相覆盖
const currentOutput = computed(() => {
  const entry = currentTraceEntry.value
  if (!entry) return output.value || ""

  let outputText = (entry.stdout ?? "").trimEnd()

  if (
    entry.event === "exception" ||
    entry.event === "uncaught_exception" ||
    entry.event === "instruction_limit_reached"
  ) {
    if (entry.exception_msg) {
      outputText = outputText
        ? outputText + "\n" + entry.exception_msg
        : entry.exception_msg
    }
  }

  return outputText
})

// 把外部状态的同步放到 watch 里（computed 不能有副作用）
watch(
  [currentOutput, () => debugData.value?.trace],
  ([text, trace]) => {
    if (!trace) return
    output.value = text
    const hasException = trace.some(
      (s: any) =>
        s.event === "exception" ||
        s.event === "uncaught_exception" ||
        s.event === "instruction_limit_reached",
    )
    status.value = hasException ? Status.RuntimeError : Status.Accepted
  },
)

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
    pauseAutoRun()
    isAutoRunning.value = false
    return
  }

  const trace = debugData.value.trace
  // 已经到末尾或停在等待输入，没法继续自动运行
  if (currentStep.value >= trace.length - 1) return
  if (trace[currentStep.value]?.event === "raw_input") {
    message.info("当前停在等待输入步，请先重新运行并提供输入")
    return
  }

  isAutoRunning.value = true
  resumeAutoRun()
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

      <!-- 调试控制按钮 -->
      <n-flex size="large" justify="center" style="margin-top: 20px">
        <!-- 步骤控制 -->
        <n-button circle @click="firstStep">
          <template #icon>
            <Icon icon="material-symbols:skip-previous" />
          </template>
        </n-button>

        <n-button circle type="primary" @click="prevStep">
          <template #icon>
            <Icon icon="tabler:chevron-left" />
          </template>
        </n-button>

        <n-button
          circle
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

        <n-button circle type="error" @click="nextStep">
          <template #icon>
            <Icon icon="tabler:chevron-right" />
          </template>
        </n-button>

        <n-button circle @click="lastStep">
          <template #icon>
            <Icon icon="material-symbols:skip-next" />
          </template>
        </n-button>
      </n-flex>

      <!-- 调试进度条 -->
      <n-flex v-if="debugData && debugData.trace" vertical>
        <n-slider
          v-model:value="currentStep"
          :min="0"
          :max="debugData.trace.length - 1"
          :step="1"
          :tooltip="false"
        />
        <!-- 步骤信息 -->
        <n-text class="step-info">
          步骤: {{ currentStep + 1 }} / {{ debugData.trace.length }}
        </n-text>
      </n-flex>
    </n-flex>

    <!-- 右侧：调试信息面板 -->
    <n-card :bordered="true" title="调试信息" size="small" style="width: 350px">
      <!-- 变量部分 -->
      <n-flex vertical style="margin-bottom: 16px">
        <n-text strong style="margin-bottom: 8px">变量</n-text>
        <n-scrollbar style="max-height: 260px">
          <n-flex
            v-if="formattedVariables.length === 0"
            vertical
            style="padding: 20px; text-align: center"
          >
            <n-text type="info">暂无变量</n-text>
          </n-flex>
          <n-flex v-else vertical>
            <n-card
              v-for="variable in formattedVariables"
              :key="variable.name"
              size="small"
              :bordered="true"
            >
              <n-flex vertical>
                <n-flex justify="space-between" align="center">
                  <n-text class="debug-text-title" strong type="primary">{{
                    variable.name
                  }}</n-text>
                  <n-tag size="small" type="info">{{ variable.type }}</n-tag>
                </n-flex>
                <n-text code class="debug-text">
                  {{ variable.value }}
                </n-text>
              </n-flex>
            </n-card>
          </n-flex>
        </n-scrollbar>
      </n-flex>

      <!-- 输出部分 -->
      <n-flex v-if="currentOutput" vertical>
        <n-text strong style="margin-bottom: 8px">
          输出({{ outputLines }}行)
          </n-text>
        <n-card size="small" :bordered="true">
          <n-scrollbar style="max-height: 300px">
            <n-text code class="debug-text">
              {{ currentOutput }}
            </n-text>
          </n-scrollbar>
        </n-card>
      </n-flex>
    </n-card>
  </n-flex>
</template>
<style scoped>
.debug-text-title {
  font-size: 20px;
}

.debug-text {
  font-size: 20px;
  white-space: pre-wrap;
  word-break: break-all;
  display: block;
}
.step-info {
  text-align: center;
}
</style>
