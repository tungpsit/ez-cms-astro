export default {
  injectHead(settings: any) {
    return `\n    <!-- Analytics -->\n    <script async src="https://www.googletagmanager.com/gtag/js?id=UA-XXXXXXXXX-X"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'UA-XXXXXXXXX-X', { 'anonymize_ip': ${settings.anonymizeIP} });
    </script>`;
  }
};
