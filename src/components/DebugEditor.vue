<script lang="ts" setup>
import { cpp } from "@codemirror/lang-cpp"
import { python } from "@codemirror/lang-python"
import { EditorState } from "@codemirror/state"
import { EditorView, Decoration, DecorationSet } from "@codemirror/view"
import { StateField, StateEffect } from "@codemirror/state"
import { useDark } from "@vueuse/core"
import { computed, ref, watch } from "vue"
import { Codemirror } from "vue-codemirror"
import { oneDark } from "../themes/oneDark"
import { smoothy } from "../themes/smoothy"
import { LANGUAGE } from "../types"

interface Props {
  modelValue: string
  language?: LANGUAGE
  fontSize?: number
  currentLine?: number
  nextLine?: number
  currentLineText?: string
  nextLineText?: string
}

const props = withDefaults(defineProps<Props>(), {
  language: "python",
  fontSize: 24,
})

const code = ref(props.modelValue)
const isDark = useDark()
const editorView = ref<EditorView>()

// 定义高亮效果
const setHighlight = StateEffect.define<{
  currentLine?: number
  nextLine?: number
  currentLineText?: string
  nextLineText?: string
}>()

// 高亮状态字段
const highlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes)
    for (let effect of tr.effects) {
      if (effect.is(setHighlight)) {
        decorations = Decoration.none
        if (effect.value.currentLine || effect.value.nextLine) {
          const decorations_array: any[] = []

          // 当前行高亮（绿色）
          if (effect.value.currentLine) {
            try {
              const line = tr.state.doc.line(effect.value.currentLine)
              decorations_array.push(
                Decoration.line({
                  class: "cm-current-line",
                }).range(line.from),
              )

              // 在当前行添加文字 - 使用行装饰而不是Widget
              if (effect.value.currentLineText) {
                decorations_array.push(
                  Decoration.line({
                    class: "cm-current-line-with-text",
                    attributes: {
                      "data-text": effect.value.currentLineText,
                    },
                  }).range(line.from),
                )
              }
            } catch (e) {
              console.warn(
                "Invalid line number for current line:",
                effect.value.currentLine,
              )
            }
          }

          // 下一步行高亮（红色）
          if (effect.value.nextLine) {
            try {
              const line = tr.state.doc.line(effect.value.nextLine)
              decorations_array.push(
                Decoration.line({
                  class: "cm-next-line",
                }).range(line.from),
              )

              // 在下一步行添加文字
              if (effect.value.nextLineText) {
                decorations_array.push(
                  Decoration.line({
                    class: "cm-next-line-with-text",
                    attributes: {
                      "data-text": effect.value.nextLineText,
                    },
                  }).range(line.from),
                )
              }
            } catch (e) {
              console.warn(
                "Invalid line number for next line:",
                effect.value.nextLine,
              )
            }
          }

          // 确保装饰按位置排序，避免重复
          decorations_array.sort((a, b) => a.from - b.from)
          decorations = Decoration.set(decorations_array)
        }
      }
    }
    return decorations
  },
  provide: (f) => EditorView.decorations.from(f),
})

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
  // 当前行高亮样式（绿色）
  "& .cm-current-line": {
    "background-color": "rgba(0, 255, 0, 0.2)",
    "border-left": "3px solid #00ff00",
  },
  // 下一步行高亮样式（红色）
  "& .cm-next-line": {
    "background-color": "rgba(255, 0, 0, 0.2)",
    "border-left": "3px solid #ff0000",
  },
  // 当前行带文字样式
  "& .cm-current-line-with-text": {
    position: "relative",
    "&::after": {
      content: "attr(data-text)",
      position: "absolute",
      right: "8px",
      top: "50%",
      transform: "translateY(-50%)",
      "background-color": "rgba(0, 255, 0, 0.8)",
      color: "#000",
      padding: "2px 6px",
      "border-radius": "3px",
      "font-size": "12px",
      "font-weight": "bold",
      "white-space": "nowrap",
      "z-index": "10",
    },
  },
  // 下一步行带文字样式
  "& .cm-next-line-with-text": {
    position: "relative",
    "&::after": {
      content: "attr(data-text)",
      position: "absolute",
      right: "8px",
      top: "50%",
      transform: "translateY(-50%)",
      "background-color": "rgba(255, 0, 0, 0.8)",
      color: "#fff",
      padding: "2px 6px",
      "border-radius": "3px",
      "font-size": "12px",
      "font-weight": "bold",
      "white-space": "nowrap",
      "z-index": "10",
    },
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
  editorView.value = payload.view
  emit("ready", payload.view)

  // Editor 准备好后立即设置高亮
  updateHighlight()
}

// 更新高亮的函数
function updateHighlight() {
  if (editorView.value) {
    console.log(
      "Updating highlight - currentLine:",
      props.currentLine,
      "nextLine:",
      props.nextLine,
    )

    // 如果当前行和下一步相同，只高亮当前行，不显示下一步
    const nextLine =
      props.currentLine === props.nextLine ? undefined : props.nextLine

    editorView.value.dispatch({
      effects: setHighlight.of({
        currentLine: props.currentLine,
        nextLine: nextLine,
        currentLineText: props.currentLineText,
        nextLineText: props.nextLineText,
      }),
    })
  }
}

// 监听 props 变化并更新高亮
watch(
  () => [
    props.currentLine,
    props.nextLine,
    props.currentLineText,
    props.nextLineText,
  ],
  () => {
    updateHighlight()
  },
)
</script>
<template>
  <Codemirror
    v-model="code"
    indentWithTab
    disabled
    :extensions="[styleTheme, lang, highlightField, isDark ? oneDark : smoothy]"
    :tabSize="4"
    :style="{
      fontSize: props.fontSize + 'px',
      maxHeight: '600px',
    }"
    @change="onChange"
    @ready="onReady"
  />
</template>
