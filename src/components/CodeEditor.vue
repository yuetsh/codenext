<script lang="ts" setup>
import { cpp } from "@codemirror/lang-cpp"
import { python } from "@codemirror/lang-python"
import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { Icon } from "@iconify/vue"
import { useDark } from "@vueuse/core"
import { computed, ref, watch } from "vue"
import { Codemirror } from "vue-codemirror"
import { oneDark } from "../themes/oneDark"
import { smoothy } from "../themes/smoothy"
import { LANGUAGE } from "../types"

interface Props {
  modelValue: string
  label?: string
  icon?: string
  language?: LANGUAGE
  fontSize?: number
  readonly?: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  language: "python",
  fontSize: 24,
  readonly: false,
  placeholder: "",
})

const code = ref(props.modelValue)
const isDark = useDark()
const styleTheme = EditorView.baseTheme({
  "& .cm-scroller": {
    "font-family": "Monaco",
  },
  "&.cm-editor.cm-focused": {
    outline: "none",
  },
  "&.cm-editor .cm-tooltip.cm-tooltip-autocomplete ul": {
    "font-family": "Monaco",
  },
})
const emit = defineEmits(["update:modelValue", "ready"])

watch(
  () => props.modelValue,
  (v) => {
    code.value = v
  },
)

const lang = computed(() => {
  if (props.language === "python" || props.language === "turtle") {
    return python()
  }
  return cpp()
})

function onChange(v: string) {
  emit("update:modelValue", v)
}

function onReady(payload: {
  view: EditorView
  state: EditorState
  container: HTMLDivElement
}) {
  emit("ready", payload.view)
}
</script>
<template>
  <n-flex align="center" class="header" v-if="props.label">
    <Icon v-if="icon" :icon="icon" :width="24" :height="24"></Icon>
    <span class="title">{{ label }}</span>
    <slot name="actions"></slot>
  </n-flex>
  <Codemirror
    v-model="code"
    indentWithTab
    :extensions="[styleTheme, lang, isDark ? oneDark : smoothy]"
    :disabled="props.readonly"
    :tabSize="4"
    :placeholder="props.placeholder"
    :style="{
      height: !!props.label ? 'calc(100% - 60px)' : '100%',
      fontSize: props.fontSize + 'px',
    }"
    @change="onChange"
    @ready="onReady"
  />
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
</style>
