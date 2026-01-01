export default {
  afterContent(settings: any) {
    return `
        <div class="newsletter mt-12 p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
          <h3 class="text-xl font-bold text-slate-100 mb-2">Subscribe to our newsletter</h3>
          <p class="text-slate-400 mb-6">Get the latest posts delivered right to your inbox.</p>
          <form class="flex gap-2">
            <input type="email" placeholder="your@email.com" class="input flex-1" required />
            <button type="submit" class="btn btn-primary">Subscribe</button>
          </form>
        </div>
      `;
  }
};
