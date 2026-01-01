---
title: "Today I Understood useEffect Cleanup & Race Conditions (Real Lessons from usePopcorn)"
description: "Today’s learning felt different.  Not because I learned something completely new, but because..."
author: "Usama"
publishDate: 2025-12-31T16:39:12Z
featuredImage: "https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fx7ah2xqzxzbn9ablfe7i.png"
category: "react"
tags: ["react", "webdev", "javascript", "learning"]
draft: false
---

Today’s learning felt different.

Not because I learned something completely new, but because something I had used before finally made sense at a deeper level.

While building my usePopcorn app, I had already fixed certain bugs. But today, while following the course, I realized why those fixes worked — and how React actually expects us to think about side effects.

Today, two concepts stood out clearly:

- The importance of cleanup functions in useEffect  
- Race conditions in async requests, and how to fix them properly  

---

## **Fast Typing Broke My App (But Slowly Revealed the Truth)**

Early in the app, I noticed a strange behavior.

- Slow searches → correct results  
- Fast typing → errors or incorrect data  

At first, it looked like an API issue.  
In reality, it was a race condition.

Multiple requests were being fired, and older responses were sometimes updating state after newer ones.

---

## **Race Conditions: The Right Mental Model**

A race condition happens when React receives responses out of order.

The fix is not to “wait” or “delay” requests — the fix is to cancel outdated work.

This is where AbortController comes in.

```js
const controller = new AbortController();
fetch(url, { signal: controller.signal });

return () => controller.abort();
```

This cleanup ensures that only the latest request is allowed to finish.

That single line completely stabilizes the app.


---

## **Cleanup Functions Are Not Optional**

Before today, I treated cleanup functions like a bonus.

Now I understand:

> Cleanup is part of the effect’s lifecycle.


A simple example is updating the document title.

```js
document.title = `Movie | ${title}`;

return () => {
  document.title = "usePopcorn";
};
```

Without cleanup, side effects leak into future renders.
With cleanup, React stays in control.


---

## **Cleanup Prevents Silent Bugs (Event Listeners)**

Another area where cleanup matters is event listeners.

```js
document.addEventListener("keydown", onKeyDown);

return () => {
  document.removeEventListener("keydown", onKeyDown);
};
```

**Without cleanup:**

* Listeners stack up
* One key press triggers multiple handlers


**With cleanup:**

* Old listeners are removed
* Behavior stays predictable



---

## **A Bug I Fixed Earlier — But Truly Understood Today**

The race condition issue was something I had already fixed before with external help.

Today was different.

Today, I didn’t just apply a fix — I understood the system behind it.

That shift—from fixing to understanding—is what real learning feels like.


---

## **How I Think About useEffect Now**

* Effects run

* Cleanup runs before the next effect

* Cleanup also runs on unmount

* Async effects must always be cancelable


Once this clicked, useEffect stopped feeling unpredictable.


---

### Final Thoughts

Today reminded me of something important:

> Clean code isn’t about writing more.
It’s about writing only what’s necessary.



Cleanup functions and race condition handling are not advanced tricks — they are foundational React skills.

I’m still learning, still improving, and still refining my understanding.
But today’s clarity made the journey feel worth it.