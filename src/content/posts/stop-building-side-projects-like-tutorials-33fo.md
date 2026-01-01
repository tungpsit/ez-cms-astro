---
title: "Stop Building Side Projects Like Tutorials"
description: "Every developer hears the same advice: \"Build side projects.\"  So we follow tutorials. Clone popular..."
author: "Aman Chitransh"
publishDate: 2025-12-31T11:39:01Z
featuredImage: "https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Ffdnesbtm0yf9gbjmh8eb.png"
category: "programming"
tags: ["programming", "beginners", "opensource", "discuss"]
draft: false
---

Every developer hears the same advice: "Build side projects."

So we follow tutorials. Clone popular apps. Deploy to Vercel. Add another line to the resume.

It looks productive. It rarely makes you a better engineer.

## The Real Problem

Most side projects:
- Solve already-solved problems
- Avoid hard decisions
- Ignore failures and scale
- End at "v1 is done"

Real engineering doesn't work like that.

## Real Projects Have Constraints

Instead of asking "What app should I build?"

Ask: "What problem should this system survive?"

Add constraints:
- What if traffic spikes?
- What if a service goes down?
- What if data becomes inconsistent?

The moment constraints appear, architecture matters.

## Think in Systems, Not Screens

Start with data flow, not UI.

Ask:
- Where can this break?
- What must be async?
- What needs retries?
- What must be idempotent?

Even a simple backend becomes interesting when failure is allowed.

### Example: URL Shortener

Tutorial version:
- Store URL in database
- Generate short code
- Redirect on GET

Systems version:
- What if two users get the same short code?
- How do you handle 10k redirects/second?
- How do you track analytics without blocking redirects?
- What if your database is in a different region?

See the difference?

## Trade-offs > Features

Good engineers make trade-offs and explain them.

Write things like:
```markdown
## Why Redis for caching

Improves latency by ~200ms.
Risk: stale data if URL is updated.
Mitigation: 5 minute TTL.

## Why async analytics

Slower than sync writes.
But won't block redirects if analytics DB is down.
```

Put this in your README. It matters more than screenshots.

## If You Can't Observe It, You Don't Own It

Add basics:
```javascript
logger.info('URL created', { shortCode, userId });
metrics.increment('url.created');
metrics.timing('url.lookup', duration);
```

If you can't answer "what broke and why," the project isn't finished.

## Let It Break. Then Fix It.

Real systems are never done.

Break your own project:
- Simulate database downtime
- Send 1000 concurrent requests
- Fill database with 1M records
- Deploy on 512MB RAM
- Make your API dependency timeout

Then fix it. Refactor it. Scale it. Repeat.

That loop is where engineers are made.

## The Resume Is a Side Effect

Stop building projects for your resume.

Build systems that survive failure.

The resume will take care of itself.


###What constraint will you add to your next project?

###Comment below. Let's learn from each other's failures.