---
title: "CloudSweeper: Cutting Cloud Waste with an AI FinOps Agent"
description: "This is a submission for the DEV's Worldwide Show and Tell Challenge Presented by Mux           What..."
author: "QLoop Technologies"
publishDate: 2025-12-31T13:21:18Z
featuredImage: "https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F35eh1mwbdpfauudrthki.png"
category: "devchallenge"
tags: ["devchallenge", "muxchallenge", "showandtell", "video"]
draft: false
---

*This is a submission for the [DEV's Worldwide Show and Tell Challenge Presented by Mux](https://dev.to/challenges/mux-2025-12-03)*

## What I built

I built **CloudSweeper**, an AI-powered **FinOps agent** that helps engineers confidently reduce cloud costs across **AWS and Azure**.

Instead of just flagging “possible waste,” CloudSweeper analyzes real usage metrics, configurations, tags, and historical behavior to recommend one of three clear actions for each resource:

- **KEEP**
- **DOWNSIZE**
- **DELETE**

Each recommendation includes a **confidence score** and an estimated cost impact so that engineers can act without fear of breaking production.

The system is designed to be:
- **Read-only** (no write permissions)
- **Safe by default** (no automated changes)
- **Engineer-in-the-loop**, not fully autonomous

CloudSweeper’s goal isn’t aggressive cleanup — it’s helping teams move from *visibility* to *confident action* when managing cloud spend.

CloudSweeper is built for small to mid-sized teams that don’t have a dedicated FinOps function, but still need enterprise-grade cost discipline.


## My Pitch Video

{% embed https://player.mux.com/rjEuncpGv1yFFjvNHJ2NWGRmb6knVq01TDX9xHqNnSMw?metadata-video-title=CloudSweeper&video-title=CloudSweeper&accent-color=%23d75656&primary-color=%23662ba1&secondary-color=%2337b367 %}


## Demo
Live App: https://cloudsweeper.io


CloudSweeper connects to AWS and Azure using read-only access.
No write permissions, no complex automation.
You can onboard in a few minutes by providing minimal connectivity details and immediately see idle-resource recommendations after the first scan is complete.

## The Story Behind It
Cloud cost waste is not a visibility problem — it’s a **confidence problem**.

In almost every AWS or Azure environment I worked with, teams already *suspected* there was waste:
Idle VMs, unused databases, orphaned disks, forgotten IPs. Dashboards made that obvious.

What stopped the action was fear.

No engineer wants to be the person who deletes something and breaks production.
When ownership is unclear and usage patterns are noisy, the safest choice is to do nothing.
So waste quietly accumulates month after month.

CloudSweeper started as an internal experiment to close that gap.

The idea was simple: instead of just flagging “possible waste,” combine real usage metrics,
configuration data, and historical behavior — then explain *why* a resource looks idle, and how confident the system is about that conclusion.

Today, CloudSweeper acts as an **AI-enabled FinOps agent** that helps engineers move from *visibility* to *confident decision-making* — without automation, without risk, and always with humans in the loop.

## Technical Highlights
CloudSweeper is built as an **async, multi-tenant Python system** designed to scan safely
customer-owned cloud environments without disrupting workloads.

### Core Stack
- **Python 3.13** (fully async)
- **aioboto3** for AWS interactions
- **Azure SDKs (`azure-*`)** for Azure resource and metrics access
- **aiohttp** for async HTTP operations
- **Pydantic v2** for strict data validation and schema enforcement
- **Azure Cosmos DB** for multi-tenant state and scan results
- **python-dotenv** for environment configuration

### Cloud Scanning Architecture
- Secure **read-only IAM / RBAC access** (no delete permissions, ever)
- Async scanners for AWS and Azure resources
- Metrics-driven idle detection using:
  - CloudWatch (AWS)
  - Azure Monitor
- Conservative defaults:
  - If metrics are missing or ambiguous, the resource is **skipped**
  - No assumptions, no forced classification

Each idle candidate includes a **human-readable idle reason**  
(e.g. actual CPU %, thresholds, and time window), not just a binary flag.

### AI-Powered Recommendation Engine
- AI evaluates enriched resource context (metrics, configs, tags, history)
- Produces structured recommendations:
  - **KEEP**
  - **DOWNSIZE**
  - **DELETE**
- Each recommendation includes:
  - A **confidence score**
  - Cost impact estimates
  - Reasoning trace

The system is explicitly **engineer-in-the-loop**:
No automatic actions are taken.

### Notifications & Integrations
- **Webhook-based notifications** for detected idle resources
- Payloads include detailed idle reasons and context
- Supports integration with tools like Slack, Teams, or internal systems
- Retry logic and validation to ensure delivery reliability

### Design Principles
- Async-first for scale and speed
- Modular codebase with strict size limits per module
- Transparent logging and graceful degradation
- Safety over aggressiveness
- Explainability over black-box decisions.

### Why This Scales

CloudSweeper is designed to scale across hundreds or thousands of cloud accounts:
- Fully async scanning architecture
- Stateless scanners with tenant isolation
- Cloud-provider–agnostic recommendation layer
- Designed for continuous scans, not one-off audits

As cloud usage grows, CloudSweeper grows with it—without requiring more human effort.



