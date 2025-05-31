<template>
    <span v-for="(span, index) in formatSpans" :key="index"
          :style="{ color: `var(--irc-color-${span.format.color})`, 
                    backgroundColor: `var(--irc-color-${span.format.backgroundColor})`,
                    fontWeight: span.format.bold ? 'bold' : 'normal',
                    textDecoration: span.format.underline ? 'underline' : 'none',
                    fontStyle: span.format.italic ? 'italic' : 'normal',
                    textDecorationLine: span.format.strikethrough ? 'line-through' : 'none' }">
        {{ span.text }}
    </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: {
    type: String,
    required: true
  }
})

const formatSpans = computed(() => {
    //split the content into parts by irc control characters
    const parts = props.content.split(/(\x03\d{1,2}(?:,\d{1,2})?|\x02|\x1d|\x1f|\x1e|\x0f)/g);
    let format = {
        color: 1,
        backgroundColor: 0,
        bold: false,
        underline: false,
        italic: false,
        strikethrough: false
    }
    let spans = []
    for (let part of parts) {
        if (!part) continue; // skip empty parts
        if (part.startsWith('\x03')) {
            // color code
            const colorCode = part.slice(1).split(',')[0];
            format.color = parseInt(colorCode, 10);
            if (isNaN(format.color) || format.color < 0 || format.color > 15) {
                format.color = 1; // default color
            }
            if (part.includes(',')) {
                const bgColorCode = part.split(',')[1];
                format.backgroundColor = parseInt(bgColorCode, 10);
                if (isNaN(format.backgroundColor) || format.backgroundColor < 0 || format.backgroundColor > 15) {
                    format.backgroundColor = 0; // default background color
                }
            } else {
                format.backgroundColor = 0; // default background color
            }
        } else if (part === '\x02') {
            format.bold = !format.bold;
        } else if (part === '\x1f') {
            format.underline = !format.underline;
        } else if (part === '\x1d') {
            format.italic = !format.italic;
        } else if (part === '\x1e') {
            format.strikethrough = !format.strikethrough;
        } else if (part === '\x0f') {
            format = { color: 1, backgroundColor: 0, bold: false, underline: false, italic: false, strikethrough: false };
        } else {
            spans.push({ text: part, format: { ...format } });
        }
    }
    return spans.map(span => {
        // Ensure color and backgroundColor are within valid range
        span.format.color = Math.max(0, Math.min(15, span.format.color));
        span.format.backgroundColor = Math.max(0, Math.min(15, span.format.backgroundColor));
        return span;
    });
})

</script>

<style global>
:root {
  --irc-color-0: #FFFFFF; /* Default White */
  --irc-color-1: #000000; /* Default Black */
  --irc-color-2: #000080; /* Blue */
  --irc-color-3: #009000; /* Green */
  --irc-color-4: #FF0000; /* Red */
  --irc-color-5: #800000; /* Brown */
  --irc-color-6: #800080; /* Purple */
  --irc-color-7: #fa8000; /* Orange */
  --irc-color-8: #ffff00; /* Yellow */
  --irc-color-9: #00fa00; /* Light Green */
  --irc-color-10: #009090; /* Cyan */
  --irc-color-11: #00ffff; /* Light Cyan */
  --irc-color-12: #0000fa; /* Light Blue */
  --irc-color-13: #ff00ff; /* Pink */
  --irc-color-14: #808080; /* Gray */
  --irc-color-15: #c0c0c0; /* Light Gray */
}
</style>