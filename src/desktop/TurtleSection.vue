<script lang="ts" setup>
import { useTemplateRef, watch } from "vue"
// @ts-ignore
import * as Sk from "skulpt"
import { code, input, output, turtleRunId } from "../composables/code"

const turtleCanvas = useTemplateRef("turtle")

function builtinRead(x: any) {
  if (
    Sk.builtinFiles === undefined ||
    Sk.builtinFiles["files"][x] === undefined
  )
    throw "文件没有找到：'" + x + "'"
  return Sk.builtinFiles["files"][x]
}

function runSkulptTurtle() {
  const canvas = turtleCanvas.value
  if (!canvas) return
  canvas.innerHTML = ""
  Sk.configure({
    output: console.log,
    read: builtinRead,
    inputfun: function () {
      return input.value
    },
    __future__: Sk.python3,
  })
  Sk.TurtleGraphics = {
    target: canvas,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  }
  Sk.misceval
    .asyncToPromise(function () {
      return Sk.importMainWithBody("<stdin>", false, code.value, true)
    })
    .catch((err: any) => {
      output.value += String(err)
    })
}

watch(turtleRunId, () => runSkulptTurtle())
</script>

<template>
  <div ref="turtle" class="canvas"></div>
</template>

<style scoped>
.canvas {
  width: 100%;
  height: 100%;
}
</style>
