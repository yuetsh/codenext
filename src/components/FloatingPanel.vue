<script lang="ts" setup>
import { computed } from "vue"
import { Icon } from "@iconify/vue"

interface Props {
  visible: boolean
  variables?: Record<string, any>
  output?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  variables: () => ({}),
  output: "",
})

const emit = defineEmits(["close"])

// 格式化变量显示
const formattedVariables = computed(() => {
  if (!props.variables || Object.keys(props.variables).length === 0) {
    return []
  }

  return Object.entries(props.variables).map(([key, value]) => {
    // 处理特殊类型
    let displayValue = ""
    let displayType = typeof value
    
    if (Array.isArray(value) && value.length === 2 && 
        value[0] === "IMPORTED_FAUX_PRIMITIVE" && 
        value[1] === "imported object") {
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

// 格式化输出显示
const formattedOutput = computed(() => {
  if (!props.output) return ""
  return props.output
})

// 计算输出行数
const outputLines = computed(() => {
  if (!props.output) return 0
  return props.output.split("\n").filter((line) => line !== "").length
})

function closePanel() {
  emit("close")
}
</script>

<template>
  <n-card v-if="visible" class="floating-panel" :bordered="true" size="small">
    <template #header>
      <n-flex justify="space-between" align="center">
        <n-flex align="center" :gap="8">
          <n-icon>
            <Icon icon="mdi:bug" :width="16" :height="16" />
          </n-icon>
          <n-text strong>调试信息</n-text>
        </n-flex>
        <n-button quaternary circle size="small" @click="closePanel">
          <template #icon>
            <n-icon>
              <Icon icon="mdi:close" :width="16" :height="16" />
            </n-icon>
          </template>
        </n-button>
      </n-flex>
    </template>

    <n-space vertical :size="16" class="panel-content">
        <!-- 变量部分 -->
        <n-collapse :default-expanded-names="['variables']">
          <n-collapse-item title="变量" name="variables">
            <template #header>
              <n-flex align="center" :gap="8">
                <n-icon>
                  <Icon icon="mdi:variable" :width="14" :height="14" />
                </n-icon>
                <n-text>变量</n-text>
              </n-flex>
            </template>

            <div v-if="formattedVariables.length === 0">
              <n-text
                type="info"
                class="no-variables-text"
              >
                暂无变量
              </n-text>
            </div>
            <n-space v-else vertical :size="12">
              <n-card
                v-for="variable in formattedVariables"
                :key="variable.name"
                size="small"
                :bordered="true"
              >
                <n-flex
                  justify="space-between"
                  align="center"
                  class="variable-header"
                >
                  <n-text strong :type="'primary'">{{ variable.name }}</n-text>
                  <n-tag size="small" type="info">{{ variable.type }}</n-tag>
                </n-flex>
                <n-text
                  code
                  class="variable-value"
                >
                  {{ variable.value }}
                </n-text>
              </n-card>
            </n-space>
          </n-collapse-item>
        </n-collapse>

        <!-- 输出部分 -->
        <n-collapse v-if="formattedOutput" :default-expanded-names="['output']">
          <n-collapse-item :title="`输出 (${outputLines} 行)`" name="output">
            <template #header>
              <n-flex align="center" :gap="8">
                <n-icon>
                  <Icon icon="mdi:console" :width="14" :height="14" />
                </n-icon>
                <n-text>输出 ({{ outputLines }} 行)</n-text>
              </n-flex>
            </template>

            <n-card size="small" :bordered="true">
              <n-text
                code
                class="output-text"
              >
                {{ formattedOutput }}
              </n-text>
            </n-card>
          </n-collapse-item>
        </n-collapse>
    </n-space>
  </n-card>
</template>

<style scoped>
.floating-panel {
  font-family: "Monaco", "Consolas", monospace;
  width: 300px;
  position: absolute;
  top: 20px;
  right: 120px;
  z-index: 100;
}

.output-text {
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  display: block;
}

.panel-content {
  padding: 16px;
}

.no-variables-text {
  font-style: italic;
  text-align: center;
  display: block;
  padding: 20px;
}

.variable-header {
  margin-bottom: 8px;
}

.variable-value {
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
