---
title: "Rebuilding an Old Website Using Kiro (and What Went Wrong)"
description: "I rebuilt a long-neglected personal website using an AI coding assistant. This post covers my findings, what worked well, what didn’t, and the gems I picked up along the way."
author: "rizasaputra"
publishDate: 2025-12-31T13:02:56Z
featuredImage: "https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fppx4t22igiamaes34b9k.png"
category: "ai"
tags: ["ai", "kiro", "webdev", "learning"]
draft: false
---

---
title: Rebuilding an Old Website Using Kiro (and What Went Wrong)
published: true
description: I rebuilt a long-neglected personal website using an AI coding assistant. This post covers my findings, what worked well, what didn’t, and the gems I picked up along the way.
tags: ai, kiro, webdev, learning
# cover_image: https://dev-to-uploads.s3.amazonaws.com/uploads/articles/72i4crx97xk333bnda3a.jpg
# Use a ratio of 100:42 for best results.
# published_at: 2025-12-31 11:35 +0000
---

I rebuilt an old website I hadn’t touched in 7 years using Kiro and technology I never tried. I went from implementing auth in less than 1 hour, to spending 6 days figuring out a simple CRUD with file upload, to a very productive stretch where I finished the remaining CMS and site features from scratch without a framework in 4 days, and finally spending another 3 days painfully cleaning up AI-generated garbage just to make sure everything actually runs in production.

You’ve probably seen plenty of similar posts about AI coding assistants already, but here’s my experience anyway:


- **Learn the concept first when you know nothing about what you're building**  

If you're trying something new, take time to actually learn the concept. In my case, I spent days stuck on a simple CRUD because I was totally not familiar with how Cloudflare R2, Workers, and Cloudflare Image Resizing actually work, so I couldn’t direct the AI to do what I want properly. It was only after I spent time reading the docs and understanding the concepts that I could finally understand the mess and garbage I had produced, clean it up, and make it work.

- **Spec driven development is powerful, but…**

I found there are many cases where I’m very clear on what I want to do, and vibe coding without writing any spec is much more productive. For dev teams, I think this means requirement spec for AI can’t replace specs written by PM or QA, at least not for the moment.


- **Keep specs small**  

If you’re using spec driven development (Kiro style), I found I can only be productive when there are at most 4 requirements. 2–3 requirements per spec works much better. More than that, I lose the cognitive capability required to read the requirements and design the solution, let alone understand the code being generated. Split your spec. Period.

- **Steering files are very important**  
  
The best hack I found is simply taking time to keep steering files updated. Whenever I finished implementing something, updating the steering files helped the AI understand things that were previously ambiguous, or things where I had already changed my mind.  
  

Before this, I often had to correct the output. With updated steering files, the result was much closer to what I wanted from the start. I didn’t really measure it, but the time saving difference was very noticeable.

- **AI does silently break things**

Even with steering files, and with Kiro searching and reading the codebase before implementing tasks, it still messed things up. It could reinvent implementations instead of reusing existing code which leads to hidden instability, add conflicting CSS rules that go unnoticed until you actually build and deploy, or inject overly strict security configs that make the app unusable. I also found Kiro has a tendency to over-engineer things.

To understand what actually happened, one trick I used was committing to git frequently so I could compare the overall file diff. For me, this was much easier than trying to follow small, scattered diffs shown during task execution.

- **Checkpointing is underrated**  

Kiro has a feature I really like: checkpointing. If I was in the middle of implementing something and changed my mind, I could easily restore both the chat and the code to a previous point. It’s basically having an undo button for coding. 

Being able to undo and retry with a different approach easily is extremely valuable, and honestly, it reminded me why I could take some random club from Serie C to European champions in Football Manager back when I still had a life.

- **ChatGPT is the steroid booster for Kiro**  

Maybe it’s because I’m using Auto model selection so I might be served a weaker model, but I found ChatGPT’s reasoning when engineering the solution is often better.

Kiro has a tendency to just accept and follow whatever you say, and quickly jump into doing stuff. With Kiro, doing and debugging feels more like trial and error. With ChatGPT, since it’s chat-based, you actually get time to think things through properly.

In the end, the best setup for me was me and ChatGPT co-bossing Kiro to actually work and develop lol.

- **Humans beat AI in short-range sprinting**  

Did I say vibe coding can be more productive? The only thing that’s sometimes even more productive is implementing or fixing the code myself, especially when I’m already very clear on what needs to be written. I found humans, or at least me, retain context better than AI for a small project, so I don’t need to keep scanning existing code just to get going. I simply can’t type as fast as the AI.

Before closing this out, here’s the before and after.

**Old site**
![Before](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/bvaysgx92wjh1yaqtgt6.png)
 
**Rebuild**
![After](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dfv86fr9bhjf4t3txugf.png)

More importantly, I now have a solid foundation to assist others and scale AI coding assistant usage into something more complex.
