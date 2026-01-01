export default {
  injectHead(settings: any) {
    let html = '';
    if (settings.autoGenerateMetaTags) {
      html += `\n    <!-- SEO Optimizer -->\n    <meta name="robots" content="index, follow" />`;
    }
    if (settings.enableOpenGraph) {
      html += `\n    <meta property="og:site_name" content="EZ CMS" />`;
    }
    return html;
  }
};
