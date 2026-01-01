export default {
  afterContent(settings: any) {
    return `
        <div class="social-sharing mt-8 pt-8 border-t border-slate-800">
          <p class="text-sm font-medium text-slate-400 mb-4">Share this post:</p>
          <div class="flex gap-4">
            ${(settings.platforms as string[]).map((p: string) => `
              <button class="text-slate-400 hover:text-emerald-400 transition-colors capitalize">${p}</button>
            `).join('')}
          </div>
        </div>
      `;
  }
};
