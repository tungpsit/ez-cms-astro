---
title: "When Architecture Inverts Complexity - How CQRS and Event-Driven Architectures Undermine Scalable Domain Models"
description: "Most large software systems do not fail because of bad tools. They fail because of a bad ordering of..."
author: "Leon Pennings"
publishDate: 2025-12-31T15:20:17Z
featuredImage: "https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F9o2pq62or96jhzyr6o7a.png"
category: "softwareengineering"
tags: ["softwareengineering", "cqrs", "eventdriven", "softwarearchitecture"]
draft: false
---

---
title: "When Architecture Inverts Complexity - How CQRS and Event-Driven Architectures Undermine Scalable Domain Models"
canonical_url: "https://blog.leonpennings.com/when-architecture-inverts-complexity-how-cqrs-and-event-driven-architectures-undermine-scalable-domain-models"
---

Most large software systems do not fail because of bad tools. They fail because of a **bad ordering of decisions**.

At the core of software engineering lies a fundamental distinction: **essential complexity** versus **accidental complexity**. Essential complexity is inherent to the domain: the invariants that must hold, the lifecycles that give state meaning, and the failure semantics that define correctness. Accidental complexity arises from implementation choices: distribution, messaging, storage, orchestration, and tooling.

This distinction is not theoretical. **Modeling is the act of defining essential complexity.** Architecture exists to serve it.

When essential complexity is made explicit first, systems remain adaptable and long-lived. When accidental complexity is chosen first, the domain is forced to conform to infrastructure. Correctness becomes emergent rather than enforced. This inversion is particularly pronounced when **CQRS and Event-Driven Architectures (EDA)** are adopted as foundational decomposition strategies rather than tactical tools.

---

## Essential-First vs. Accidental-First

There are only two coherent approaches to designing complex systems:

### 1\. Essential-First Architecture

1. Identify the domain’s essential complexity.
    
2. Model invariants and failure semantics explicitly.
    
3. Introduce accidental complexity strictly in service of that model.
    

Accidental complexity remains **replaceable**. Technologies can be swapped without redefining meaning. Deployment topology does not alter correctness.

### 2\. Accidental-First Architecture

1. Commit early to distribution, messaging, and orchestration.
    
2. Normalize eventual consistency.
    
3. Retrofit the domain to survive those choices.
    

This second path is where CQRS and EDA most often land. Once they become foundational, essential complexity can no longer be expressed directly; it must be reconstructed from infrastructure. **That is the inversion.**

---

## The Structural Risk of Scaling "Steps"

CQRS and EDA decompose systems along technical seams: commands, events, handlers, and projections. In doing so, they implicitly assume that business actions can be split into independently scalable steps: *Validation here. Authorization there. Persistence somewhere else.*

This has predictable consequences:

* **Invariants are enforced late:** You find out the balance was insufficient three steps too late.
    
* **Behavior is fragmented:** No single place in the code describes the "story" of a business action.
    
* **Correctness becomes probabilistic:** Success depends on the perfect choreography of five different services and a message bus.
    

This is not an implementation mistake. It is a structural outcome of **scaling steps instead of actions.**

---

## The Scaling Law: Processes, Not Pipelines

Systems that scale and endure—like MapReduce or Cell-Based Architectures—share a property often missed: **They scale complete business actions, not partial steps.**

Take **MapReduce** as a mental model. It is not a workflow orchestrator; it is a **work spreader**. It does not scale parsing, filtering, and aggregation as independent distributed stages. It scales the *same autonomous computation* across many independent inputs. Each map task is a black box of meaning that owns its failure and retries locally.

The same applies to high-scale platforms like X (Twitter). Even with aggressive fan-out, the unit of correctness remains the complete action: *Create Tweet* or *Delete Tweet*.

**The Scaling Law:**

* Scale **processes**, not pipelines.
    
* Scale **meaning**, not mechanics.
    

---

## The Scalable Domain Model: An Alternative

An essential-first alternative is not "fewer services." It is a different execution model based on **Autonomous Domain Actions**.

### 1\. The Unit of Execution is an A-to-Z Action

The primary unit is a complete domain action whose lifecycle is whole. All state transitions and invariant enforcement for that action occur within a **single execution context**. This does not forbid distribution; it defines where distribution is allowed.

### 2\. Execution is Exclusive and Local

A domain action is processed by exactly one executor at a time. Once execution begins, it completes its lifecycle locally. External calls may occur, but ownership of the "decision" never leaves the executor. This yields determinism and eliminates the need for complex sagas.

### 3\. Dispatching as a Marketplace

Scalability is achieved by routing actions to executors based on **domain identity**.

* **The Dispatcher** is a stateless matchmaker.
    
* **Executors** publish their capabilities (e.g., *"I handle USD payments &gt; $1M"*).
    
* The Dispatcher performs a deterministic route to the "best match" and then steps away. It doesn't observe progress or coordinate steps.
    

---

## Illustrating the Model in Payments

Consider instant payments. The accidental-first approach breaks a payment into a chain: *Balance Check → Fraud Check → Sanctions → Ledger*. If the "Sanctions" step fails, you need a "Saga" to undo the "Balance Check."

Now apply the **Essential-First** constraint: Treat a payment as a single, exclusive business action handled by a specialized executor.

An executor for "Domestic Low-Value Payments" knows everything about that specific case from A-to-Z. It knows nothing about "Cross-Border FX." This isolation makes the system incredibly maintainable. If regulatory rules change for FX, you deploy a new FX Executor. The Domestic Executor remains untouched.

Scaling happens by replicating complete scenarios. Failures are handled locally within the executor's context, rather than triggering global reconciliation.

The true power of this model emerges when requirements evolve. In step-based architectures, a new compliance rule, bank-specific flow, or risk category typically requires modifying shared validation steps, updating orchestration logic, adding new events, and coordinating deployments across multiple components—change is invasive, high-risk, and touches code that other scenarios depend on.

In the essential-first model, evolution is purely additive: a new or more specific scenario simply introduces a new executor tailored to those characteristics. No existing executor or core model is adjusted.

The dispatcher registry gains one additional capability, the new executor is deployed independently, and the system immediately supports the case from A-to-Z. Scaling follows naturally—replicate only the executors that experience load.

Change becomes localized, low-risk, and genuinely incremental.

---

## Real Scalability is Bidirectional

An essential-first architecture doesn't just scale up; it scales **down**.

Because accidental complexity is not foundational:

* The system can collapse back into a single process for testing or low-cost environments.
    
* **Operational cost floors remain low.**
    
* **Version Hell is avoided:** A single executor owns the entire action, so you never have a "Version 1" step talking to a "Version 2" step.
    

Accidental-first architectures cannot do this. Once distribution and orchestration are baked into the domain, they cannot be removed without a rewrite. This is not scalability; it is **structural inflation.**

---

## Conclusion: Order Over Patterns

CQRS and Event-Driven Architectures are powerful tools, but dangerous foundations. Their greatest risk is **premature commitment** to accidental complexity.

Modeling is the act of deciding what must remain true when everything else changes. Architectures that respect that order can grow and shrink, evolve and endure. Architectures that invert it may scale forward—but only forward, and only until the cost of coordination becomes unsustainable.

Architectures that invert essential and accidental complexity trade short-term scalability for long-term rigidity—whether they intend to or not.

The real question is not whether CQRS or EDA can work. It is whether you want your domain to depend on them—or the other way around.