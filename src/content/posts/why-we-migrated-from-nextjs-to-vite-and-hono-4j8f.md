---
title: "Why We Migrated from Next.js to Vite and Hono"
description: "In late 2025, we migrated Pluslide entirely away from Next.js. Our new stack? Vite + React for the..."
author: "jj811208"
publishDate: 2025-12-31T13:07:11Z
featuredImage: "https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fjw0l5l971fzflq5062v2.png"
category: "webdev"
tags: ["webdev", "nextjs", "javascript", "cloudflare"]
draft: false
---

In late 2025, we migrated Pluslide entirely away from Next.js. Our new stack? Vite + React for the frontend and Hono for the API layer.

This was not a decision we made lightly. Next.js has shaped modern web development and remains the default choice for many React projects. But after months of frustration with Cloudflare compatibility, growing security concerns, and architectural complexity, we realized that Next.js was no longer the right tool for our needs.

Here is what we discovered.

## The Cloudflare Compatibility Problem

Pluslide runs entirely on Cloudflare. This infrastructure choice has been excellent for performance and cost. But Next.js and Cloudflare have never been a perfect match.

### The Migration Pain

When we first deployed Next.js on Cloudflare, we used [next-on-pages](https://github.com/cloudflare/next-on-pages), an adapter originally maintained by Cloudflare. The experience was never smooth. Even with official support, we constantly hit edge cases and limitations that required workarounds.

In September 2025, Cloudflare announced they were archiving the next-on-pages project. The official recommendation became [OpenNext](https://opennext.js.org/cloudflare), a community-maintained adapter.

Based on our experience with next-on-pages, we had developed a healthy skepticism toward adapter-based solutions. Moreover, choosing this path means you cannot use the latest Next.js versions immediately. You must wait for the community to adapt and test compatibility.

There is another issue: migrating from next-on-pages to OpenNext requires moving your services from Cloudflare Pages to Cloudflare Workers. This is not a small change. If we were going to undertake a migration of that scale anyway, we had to ask ourselves: is this the right path forward? Or should we step back and consider whether there is a better option entirely?

### The Vercel Question

Our experience deploying Next.js on Cloudflare raised an uncomfortable question: what exactly is Vercel optimizing for?

Next.js is technically open source, but the best deployment experience (especially for Edge Runtime) clearly lives on Vercel. Features like Incremental Static Regeneration work seamlessly on Vercel but require significant effort elsewhere. The gap between "runs on Vercel" and "runs anywhere else" keeps widening.

If you are not on Vercel, you are a second-class citizen. We decided we did not want to be one.

## Security Concerns That Accelerated Our Decision

In 2025, Next.js faced a series of critical security vulnerabilities. While these were not the primary reason for our migration, they still shook our confidence.

### CVE-2025-29927: Middleware Authorization Bypass

In March 2025, [researchers disclosed a severe vulnerability](https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/) with a CVSS score of 9.1. Attackers could forge a specific HTTP header to completely bypass middleware-based access controls. Authentication checks, authorization logic, and CSP headers could all be circumvented with a single forged request.

This vulnerability affected versions spanning over four years of Next.js releases. The fix required immediate patching across all deployments.

### CVE-2025-55182: Remote Code Execution

Later in 2025, an even more severe vulnerability emerged. [This RCE flaw](https://www.wiz.io/blog/critical-vulnerability-in-react-cve-2025-55182) scored a perfect 10.0 on the CVSS scale and was actively exploited in the wild. Attackers used it to steal cloud credentials and deploy cryptocurrency miners on compromised servers.

These incidents reminded us that framework complexity comes with security costs. More abstraction layers mean more potential attack surfaces.

## The Architecture Problem

Our Next.js codebase had become a tangled mess. tRPC routers lived alongside React components. Server and client code mixed in ways that made reasoning about data flow difficult. Every file required mental overhead to determine whether it ran on the server, the client, or both.

We do not deny that part of this mess came from vibe coding: rapid prototyping sessions where structure took a backseat to speed. This is not a flaw in Next.js. But the framework's blurry boundaries between server and client made it too easy to let things get out of hand.

This complexity had practical consequences. The architecture became difficult to read and reason about. AI coding assistants frequently hallucinated about where code should run, generating server code in client files and vice versa. Our Turborepo cache was essentially useless. Any change to either UI or API code would invalidate both caches. The build graph was a web of unnecessary dependencies.

## Unifying on Cloudflare Workers

Before choosing our new stack, we made another infrastructure decision: consolidating everything on Cloudflare Workers.

The distinction between Pages and Workers has always been confusing. Their responsibilities overlap significantly, and the developer experience differs in subtle but frustrating ways. This year, Cloudflare made their direction clear: they now recommend Pages users [migrate to Workers](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/), with the migration guide prominently placed in the Pages documentation.

In other words, we were migrating to Workers no matter what.

## Why Vite and Hono Became Our Answer

We needed tools with first-class Workers support. We also wanted a clean separation between frontend and backend.

### Vite: Native Cloudflare Workers Integration

What made [Vite](https://vite.dev/guide/) especially compelling is its first-class Cloudflare Workers support. The [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/) provides deep integration between Vite and the Workers runtime. You can run Vite's dev server locally while executing your code directly in the Workers runtime. No more "works in dev, breaks in production" surprises, which were painfully common when deploying Next.js on Cloudflare.

The Environment API introduced in Vite 6 was developed with direct input from the Cloudflare Workers team. It narrows the gap between development and production environments. We can now develop directly against edge environments while enjoying the full Vite experience.

The performance gains were a bonus. Our development server now starts in a few seconds. Hot Module Replacement is instantaneous. Production builds that took five minutes now complete in under two minutes.

Much of this speed comes from [Rolldown](https://vite.dev/blog/announcing-vite8-beta), the new Rust-based bundler powering Vite 8. It is still in beta, but is already delivering impressive results in our production workflow.

### Hono: The Edge-Native Framework

[Hono](https://hono.dev/) handles our API layer.

The framework is tiny (under 12KB with the minimal preset), has zero dependencies, and uses only Web Standard APIs with perfect Edge Runtime support. This means identical code runs on Cloudflare Workers, Deno, Bun, AWS Lambda, or Node.js without modification.

Cloudflare uses Hono internally. According to their [official blog post](https://blog.cloudflare.com/the-story-of-web-framework-hono-from-the-creator-of-hono/), all Workers Logs internal and customer-facing APIs run on Workers using Hono. Cloudflare also uses Hono in the internals of KV and Queues. When the platform provider builds their own products with a framework, you know it works.

The developer experience is excellent. TypeScript support is first-class. The API feels familiar to Express developers but without the legacy baggage. Middleware composition is clean and predictable.

## Clear Boundaries

With Vite and Hono, the separation is explicit:

**Frontend (Vite + React)**: Purely client-side. Handles UI, routing, and state management. Knows nothing about database schemas or authentication logic.

**API (Hono)**: Purely server-side. Handles business logic, data access, and authentication. Knows nothing about React components or UI state.

**Shared**: Only TypeScript type definitions. The API exports types that the frontend imports. No runtime code crosses the boundary.

The benefits went beyond just easier reasoning about the code. Turborepo cache hits increased dramatically. Frontend developers can work without understanding backend implementation details. Backend developers can refactor without worrying about breaking UI code.

This clean separation also made our AI-assisted development significantly more effective. The models could reason about each layer independently without getting confused by mixed contexts.

Perhaps more importantly, debugging became straightforward. With Next.js and its Cloudflare adapter, pinpointing issues was a constant struggle. Was the bug in our code, in Next.js internals, or in the adapter layer? OpenNext maintains extensive documentation on [workarounds, performance tips, and known issues](https://opennext.js.org/cloudflare/howtos/keep_names). We believe these documented issues represent just the tip of the compatibility iceberg.

After abandoning Next.js and the adapter layer, with complete frontend-backend separation, our bug rate dropped by over 70%. When issues do arise, we identify and fix them significantly faster because the source is always clear.

## What We Gained After Migration

A few months after completing the migration, here is what changed:

**Build times dropped from five minutes to under two minutes.** Our CI pipeline builds 8 different services and compiles over 10 shared packages, so this measurement includes the entire monorepo.

**Turborepo cache hit rates increased dramatically.** With clear boundaries between frontend and API, changing one no longer invalidates the other. Most builds now skip unchanged packages entirely.

**Local development became instant.** Dev server starts in seconds. Hot Module Replacement applies changes immediately. The feedback loop went from "wait and refresh" to "save and see."

**Cloudflare deployment became straightforward.** No more compatibility layers. No more edge runtime workarounds. Workers do what Workers are supposed to do.

**The codebase became easier to understand.** New team members onboard faster. Code reviews focus on logic rather than "where does this run?" questions. Debugging is simpler because the execution context is always clear.

**Security posture improved.** Fewer abstraction layers mean fewer potential vulnerabilities. When security patches are needed, they apply to smaller, more focused codebases.

## When Is Next.js the Right Choice?

We want to be clear: Next.js remains an excellent framework for many use cases. Our migration does not mean you should abandon it.

Next.js makes sense when your team consists primarily of frontend developers who prefer not to manage a separate API server. The integrated backend capabilities let you build full-stack applications without context-switching. It also makes sense when you want to leverage Vercel's managed ecosystem. Analytics, Edge Functions, Image Optimization, and deployment previews work seamlessly together.

Next.js also excels when you need complex Incremental Static Regeneration patterns with fine-grained cache control. The built-in ISR implementation handles edge cases that would require significant custom code elsewhere.

If your application architecture relies heavily on React Server Components for streaming and progressive rendering, Next.js provides the most mature implementation.

The question we asked ourselves was simple: do any of these conditions apply to Pluslide?

The answer was no. We were committed to Cloudflare, not Vercel. Our pages were either fully static (marketing site, documentation) or fully dynamic (the presentation editor). We did not need ISR. We were not using React Server Components.

For us, Next.js was adding complexity without providing corresponding value.

## Conclusion

Next.js is a powerful framework with many valid use cases. If Vercel is your platform and full-stack React is your architecture, it remains an excellent choice.

But frameworks should serve your needs, not the other way around. When the friction becomes constant, when compatibility requires endless workarounds, when security incidents keep you up at night, it might be time to reassess.

For Pluslide, Vite and Hono provided exactly what we needed: speed, simplicity, and seamless Cloudflare integration. The migration took effort, but the result is a codebase we actually enjoy working with.

Your situation may be different. But if you find yourself fighting your framework more than building with it, know that alternatives exist. Sometimes the best technical decision is choosing tools that match your infrastructure rather than tools that fight against it.

---

*This post was originally published on the [Pluslide Blog](https://www.pluslide.com/blog/nextjs-to-vite-migration/).*

Pluslide is a presentation generation API built on the stack described above. If you're building apps that need to generate slides programmatically, [check it out](https://www.pluslide.com).

Have questions about our migration? Drop a comment below.