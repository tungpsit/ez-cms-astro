export default {
  injectHead(settings: any) {
    return `\n    <!-- Code Highlighter -->\n    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" />`;
  },
  injectBodyEnd(settings: any) {
    let html = `\n    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>`;
    if (settings.lineNumbers) {
      html += `\n    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.js"></script>`;
    }
    return html;
  }
};
