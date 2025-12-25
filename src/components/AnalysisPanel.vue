<script lang="ts" setup>
import { marked } from "marked"

interface Props {
  analysis: string
  loading: boolean
}

defineProps<Props>()
</script>

<template>
  <n-spin :show="loading">
    <div class="analysisPanel" v-html="marked.parse(analysis)"></div>
  </n-spin>
</template>

<style scoped>
.analysisPanel {
  width: 400px;
  min-height: 60px;
  max-height: calc(100vh - 200px);
  overflow: auto;
  padding: 16px;
  border-radius: 8px;
  line-height: 1.6;
  color: #374151;
}

/* 简洁 Markdown 样式 */
.analysisPanel :deep(h1),
.analysisPanel :deep(h2),
.analysisPanel :deep(h3),
.analysisPanel :deep(h4),
.analysisPanel :deep(h5),
.analysisPanel :deep(h6) {
  margin: 16px 0 8px 0;
  font-weight: 600;
  color: #1f2937;
}

.analysisPanel :deep(h1) {
  font-size: 1.5em;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 8px;
}

.analysisPanel :deep(h2) {
  font-size: 1.3em;
  color: #374151;
}

.analysisPanel :deep(h3) {
  font-size: 1.1em;
  color: #4b5563;
}

.analysisPanel :deep(p) {
  margin: 12px 0;
  color: #374151;
  font-size: 14px;
}

.analysisPanel :deep(ul),
.analysisPanel :deep(ol) {
  margin: 12px 0;
  padding-left: 20px;
}

.analysisPanel :deep(li) {
  margin: 4px 0;
  color: #374151;
}

.analysisPanel :deep(strong) {
  font-weight: 600;
  color: #1f2937;
}

.analysisPanel :deep(em) {
  font-style: italic;
  color: #6b7280;
}

/* 简洁代码块样式 */
.analysisPanel :deep(pre) {
  background: #f8f9fa;
  color: #24292f;
  padding: 16px;
  border-radius: 6px;
  margin: 12px 0;
  overflow-x: auto;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 13px;
  line-height: 1.5;
  border: 1px solid #d0d7de;
}

.analysisPanel :deep(code) {
  background: #f1f3f4;
  color: #d63384;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 0.9em;
}

.analysisPanel :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
}

/* 简洁引用块样式 */
.analysisPanel :deep(blockquote) {
  border-left: 4px solid #d0d7de;
  background: #f6f8fa;
  margin: 16px 0;
  padding: 12px 16px;
  border-radius: 0 6px 6px 0;
  color: #656d76;
  font-style: italic;
}

/* 简洁表格样式 */
.analysisPanel :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  background: #ffffff;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #d0d7de;
}

.analysisPanel :deep(th),
.analysisPanel :deep(td) {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #d0d7de;
}

.analysisPanel :deep(th) {
  background: #f6f8fa;
  font-weight: 600;
  color: #24292f;
}

.analysisPanel :deep(td) {
  color: #24292f;
}

/* 简洁链接样式 */
.analysisPanel :deep(a) {
  color: #0969da;
  text-decoration: none;
}

.analysisPanel :deep(a:hover) {
  color: #0969da;
  text-decoration: underline;
}

/* 简洁分割线 */
.analysisPanel :deep(hr) {
  border: none;
  height: 1px;
  background: #d0d7de;
  margin: 16px 0;
}
</style>
