<script lang="ts" setup>
import { computed, ref, watch } from "vue"
import { useDark } from "@vueuse/core"
import { Codemirror } from "vue-codemirror"
import { cpp } from "@codemirror/lang-cpp"
import { python } from "@codemirror/lang-python"
import { EditorView } from "@codemirror/view"
import { LANGUAGE } from "../types"
import { oneDark } from "../themes/oneDark"
import { smoothy } from "../themes/smoothy"

interface Props {
  label: string
  modelValue: string
  language?: LANGUAGE
  fontSize?: number
  readonly?: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  language: "python",
  fontSize: 24,
  readonly: false,
  placeholder: "",
})

const code = ref(props.modelValue)
const isDark = useDark()
const styleTheme = EditorView.baseTheme({
  "& .cm-scroller": {
    "font-family": "Consolas",
  },
  "&.cm-editor.cm-focused": {
    outline: "none",
  },
})
const emit = defineEmits(["update:modelValue"])

watch(
  () => props.modelValue,
  (v) => {
    code.value = v
  },
)

const lang = computed(() => {
  if (props.language === "python") {
    return python()
  }
  return cpp()
})

function onChange(v: string) {
  emit("update:modelValue", v)
}
</script>
<template>
  <div class="container">
    <div class="title">{{ label }}</div>
    <Codemirror
      v-model="code"
      indentWithTab
      :extensions="[styleTheme, lang, isDark ? oneDark : smoothy]"
      :disabled="props.readonly"
      :tabSize="4"
      :placeholder="props.placeholder"
      :style="{ height: '100%', fontSize: props.fontSize + 'px' }"
      @change="onChange"
    />
  </div>
</template>
<style scoped>
.container {
  height: 100%;
}
.title {
  padding: 12px 20px;
  font-size: 16px;
}
</style>
