---
title: "The Worst Thing to Happen to React and Next.js: React2Shell"
description: "\"I ain't reading all that. I'm happy for you tho, or sorry that happened.\"  That was my internal..."
author: "Rizèl Scarlett"
publishDate: 2025-12-31T08:34:22Z
featuredImage: "https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Frbbl40hs3pop6rnwd8b2.png"
category: "react"
tags: ["react", "nextjs", "security", "webdev"]
draft: false
---

"I ain't reading all that. I'm happy for you tho, or sorry that happened."

That was my internal reaction when I saw the headlines about CVE-2025-55182, more commonly called React2Shell. I had deadlines to meet. I bookmarked the articles, added "read React vulnerability stuff" to my todo list, and kept working. I didn't think it would affect me anyway. Most of my projects are demos for my work in Developer Relations. Who would bother attacking those?

A few days later, someone messaged me: "Hey, your demo site redirected me to some sketchy crypto site."

Wait, what? My heart sank to my stomach.

I frantically combed through my repository. Everything looked fine. The commit history was clean, the codebase unchanged, and I couldn't find any redirect logic that would explain what users were experiencing. I felt that uncomfortable combination of confusion and exposure. Someone was exploiting my project, but I couldn't figure out how they'd gotten in.

I resorted to asking goose, my AI coding agent, to help me investigate since this was outside my usual debugging territory. It suggested the injection might be happening at the DNS level or somewhere in my Railway deployment infrastructure. I changed my DNS settings, and it looked like that fixed it.

A few days later, I went to check my demo site to see if things were still the same, and it was redirecting to the crypto site. My hands felt clammy.

Then a memory surfaced. It felt like I was Raven from That's So Raven. The memory was of a fellow open source contributor who had pinged me saying: "Hey Rizel, make sure you update your Next.js projects. That React vulnerability is really serious." At the time, I thought, "I only have a demo project that needs upgrading. I can do it later."

That's when it clicked. I realized attackers were exploiting CVE-2025-55182, a vulnerability in React Server Components that allowed them to execute arbitrary JavaScript on my server. They didn't need to touch my codebase at all. They just needed to send specially crafted HTTP requests to my application, and the vulnerable React deserialization would execute their code.

I upgraded my Next.js and React dependencies immediately, and the redirects finally stopped for good.

I felt foolish. A trusted colleague had literally warned me, and I'd put it on my "important but not urgent" list because I thought it didn't apply to me, except it did apply to me.

## Understanding React2Shell

React Server Components introduced a new way for React applications to run code on the server. When you write a function marked with `'use server'`, React automatically creates endpoints that handle communication between your client and server using something called the Flight protocol. This protocol serializes and deserializes data as it travels back and forth.

The vulnerability was in how this deserialization worked. When your server received data through these automatically-generated Flight endpoints, it would unpack that data and process it. But the deserialization logic had a flaw. Attackers could craft malicious payloads that, when unpacked, would execute arbitrary code on your server instead of just calling your legitimate server functions.

Think about it like this: imagine you have a package delivery system where you automatically open and process every package that arrives. CVE-2025-55182 was like someone figuring out they could put a bomb inside a package, and your system would dutifully unpack and activate it without checking what was inside first.

In my case, the attackers were injecting code that intercepted HTTP responses and redirected users to crypto scam sites. But they could have done much worse. With arbitrary code execution on the server, they could have stolen my database credentials, exfiltrated my environment variables and API keys, installed persistent backdoors, or used my server for crypto mining. I got lucky.

### Who Was Affected

This vulnerability affected applications using React Server Components across several common setups.

#### Affected versions included:

* Next.js App Router on 15.x, 16.x, and 14.x canary releases after 14.3.0-canary.77  
* React versions 19.0, 19.1.0, 19.1.1, and 19.2.0


The impact extended beyond Next.js. Any framework experimenting with or building on React Server Components was potentially affected, including Vite RSC plugins and React Router’s unstable RSC APIs.

### Why This Was So Severe

Because it required no authentication, no user interaction, and had near-perfect reliability, this vulnerability was rated CVSS 10.0, the maximum severity score. Security researchers observed active exploitation in the wild starting December 5th, just two days after the patches were released, with some of the activity linked to threat groups with suspected ties to state actors.

## What You Should Do Right Now

If you're running any React or Next.js application with Server Components or Server Actions, upgrade immediately. Not later, not after you finish your current sprint, not once you've checked whether you're actually affected.

After upgrading, rotate your secrets. Even if you didn't notice any exploitation like I did, if you were vulnerable, you should assume attackers might have accessed your environment variables. Change your database passwords, API keys, deployment tokens, and anything else sensitive.

## Lessons Learned

This experience reminded me that I’m not exempt from security vulnerabilities . Even toy projects and demos matter because they're running on real servers with real access to real infrastructure.

Online security often feels like someone else's problem until it becomes your problem. Don't wait until you're scrambling to understand how your project got compromised.  