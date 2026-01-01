export default {
  afterContent(settings: any) {
    return `
        <div class="comments mt-12 pt-12 border-t border-slate-800">
          <h3 class="text-2xl font-bold text-slate-100 mb-8">Comments</h3>
          <div class="bg-slate-900/50 rounded-xl p-6 border border-slate-800 text-center">
            <p class="text-slate-400">Comments are currently disabled for this post.</p>
          </div>
        </div>
      `;
  }
};
