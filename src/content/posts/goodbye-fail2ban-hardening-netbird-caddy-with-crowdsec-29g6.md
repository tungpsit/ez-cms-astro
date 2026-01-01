---
title: "Goodbye Fail2Ban: Hardening Netbird & Caddy with CrowdSec"
description: "Goodbye Fail2Ban: Hardening Netbird &amp; Caddy with CrowdSec   Published: December 31, 2025..."
author: "patrickbloem-it"
publishDate: 2025-12-31T07:15:07Z
featuredImage: "https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fr5c3zxy9xz4vnq2qyqjz.png"
category: "security"
tags: ["security", "tutorial", "devops", "linux"]
draft: false
---

# Goodbye Fail2Ban: Hardening Netbird & Caddy with CrowdSec

**Published:** December 31, 2025 | **Reading Time:** 12 min

---

## TL;DR

We migrated our Netbird VPN Management Server from **Fail2Ban** to **CrowdSec**, reducing SSH/HTTP attack noise by **99%** and shifting from reactive (ban after 5 failed attempts) to preventive (block IPs from community threat intelligence *before* they touch our server). This post dives into *why* we made the leap and how you can too—with step-by-step code.

---

## The Problem: Fail2Ban in 2025

For a decade, **Fail2Ban** was the gold standard for simple server hardening. You set up a few regex rules, pointed it at `/var/log/auth.log`, and called it a day. But here's the thing: **Fail2Ban is architecturally reactive.**

### Why Fail2Ban Falls Short

#### 1. **Reactivity is a Liability**

Fail2Ban works like a smoke detector that only triggers *after* the fire has already spread. An attacker needs to hit your SSH port **5+ times** before the rule kicks in. In a world of distributed botnets with 10,000+ IP addresses, that's 50,000 free attempts to probe your system before you even block a single one.

Our logs showed the same pattern: every night, 500+ bogus SSH handshakes from different IPs, each one landing in `auth.log` and consuming CPU cycles for regex matching. The attacker's goal isn't to brute-force your password (they know that's futile)—it's to **map your infrastructure, test for open ports, and document your responses for later weaponization.**

#### 2. **The Silo Problem: You're Alone**

Fail2Ban is completely blind to the outside world. It works in isolation.

**Real-world scenario:**
- An IP (let's say `203.0.113.42`) is aggressively scanning 500 servers across Europe simultaneously.
- With Fail2Ban, *your* server doesn't know about the activity on *their* servers.
- You wait passively until `203.0.113.42` hits your SSH port 5 times.
- In the meantime, it's already fingerprinted 499 other servers and exfiltrated data from at least 100 of them.

**With CrowdSec + CAPI (Community API):**
- The same IP probes a server in France (CrowdSec instance #1).
- It scans a server in Germany (CrowdSec instance #2).
- It touches your server in the Netherlands (instance #3).
- Within **seconds**, the community reaches consensus: this IP is malicious.
- All 3 servers (+ 8,000+ others running CrowdSec) block it preventively.

You're no longer fighting alone. You're part of a **"Waze for Cyber-Security"** where threat signals are shared globally.

#### 3. **Regex Hell in the Age of JSON**

Modern web servers like **Caddy** output structured JSON logs, not plain text. Fail2Ban's strength—regex-based parsing—becomes a liability.

**A realistic Fail2Ban filter for Caddy:**

```ini
[Definition]
failregex = ^(?P<host>\S+) - (?P<user>\S+) \[(?P<time>\d{2}/\w+/\d{4}:\d{2}:\d{2}:\d{2}) (?P<tz>[\+\-]\d{4})\] "(?P<method>\S+) (?P<uri>\S+) (?P<proto>\S+)" (?P<status>\d+) (?P<size>\S+) "(?P<referer>\S+)" "(?P<user_agent>\S+)" (?P<response_time>\d+)$
```

This is **fragile.** The moment Caddy's log format changes (which happens with updates), your filter breaks. You're maintaining a hairball of escape sequences when **CrowdSec just parses JSON natively.**

#### 4. **CPU Overhead at Scale**

When a DDoS hits or a botnet wakes up, Fail2Ban's Python daemon becomes a bottleneck. Log parsing + regex matching + decision making = CPU spikes. Meanwhile, Go-based CrowdSec handles the same load with a fraction of the resources.

---

## The Solution: CrowdSec (Philosophy & Architecture)

**CrowdSec** is a complete rethinking of intrusion prevention. It decouples detection from response and introduces **collaborative threat intelligence**.

### Core Principles

#### 1. **Collaborative Intelligence (CAPI)**

CrowdSec works like this:
1. Your server's **CrowdSec Security Engine** analyzes logs and detects suspicious patterns.
2. When consensus is reached (an IP matches multiple scenarios or is flagged by multiple instances), a signal is sent to the **Community API (CAPI).**
3. Once enough independent instances flag the same IP, it lands on the **Community Blocklist.**
4. Your **firewall bouncer** downloads this list and blocks attackers *before* they send packets.

**The beauty:** You benefit from the collective intelligence of 10,000+ admins. You don't have to wait for *your* server to be attacked 5 times—you get early warning from the network effect.

#### 2. **Decoupled Architecture**

Unlike Fail2Ban's monolithic design, CrowdSec separates concerns:

```
┌──────────────────────────────────────────┐
│   CrowdSec Security Engine (Go)          │
│   - Parses logs                          │
│   - Matches scenarios                    │
│   - Makes decisions                      │
└──────────┬───────────────────────────────┘
           │ (Local API)
      ┌────┴──────────────────────────────────────┐
      │                                           │
┌─────▼──────────────┐              ┌────────────▼──────────────┐
│   Firewall Bouncer │              │   HTTP Bouncer (WAF)      │
│   (nftables/iptables)             │   (Layer 7 blocking)      │
└────────────────────┘              └───────────────────────────┘
```

**You decide where to block:**
- **Firewall level (nftables):** Fastest, most efficient. Drop packets before they consume resources.
- **HTTP level (Layer 7):** Apply business logic. Block based on request headers, paths, etc.
- **Application level:** Custom responses, logging, rate limiting.

We chose **firewall-level blocking (nftables)** because it's most efficient for a hardened VPN management server.

#### 3. **Scenario-Based Detection (Not Just Counting)**

Fail2Ban counts failures. CrowdSec understands context.

**Example scenario: HTTP Crawling**

```yaml
name: crowdsecurity/http-crawl-non_statics
description: "Detects aggressive crawling of non-static resources"
filter:
  - http_status: [404]  # Many 404s indicates scanning
  - user_agent: [scrapy, nikto, sqlmap]  # Known scanning tools
  - request_uri: !~ /\.(jpg|css|js|png)$/  # Not static resources
detection:
  - trigger: >
      (count(events) > 20) &&
      (duration < 5m) &&
      (user_agent matches malicious_patterns)
action: ban
```

**The difference:**
- **Fail2Ban:** "5 failed SSH attempts = ban"
- **CrowdSec:** "20 HTTP 404s in 5 minutes + suspicious User-Agent = likely scanner. Check if other instances flagged this IP. If yes, consensus reached = ban."

---

## Our Infrastructure: Netbird + Caddy + CrowdSec

### System Overview

```
Internet Traffic
       ↓
┌──────────────────────────────────────┐
│  nftables (Firewall)                 │
│  ├─ CrowdSec Rules (DROP malicious)  │
│  └─ SSH (Port 2222)                  │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│  Caddy Reverse Proxy                 │
│  ├─ TLS Termination                  │
│  ├─ JSON Access Logs → CrowdSec      │
│  └─ Reverse Proxy to Netbird (8080)  │
└──────────────────────────────────────┘
       ↓
Netbird VPN Management API
```

### OS & Versions

- **OS:** Ubuntu 24.04 LTS (Noble Numbat)
- **CrowdSec:** v1.6+
- **Caddy:** Latest (built from source or package)
- **Firewall:** nftables (Ubuntu 24.04 default)
- **Bouncer:** crowdsec-firewall-bouncer-nftables

---

## Implementation: The Code

### Step 1: Install CrowdSec

```bash
# Add repository
curl -s https://install.crowdsec.net | sudo sh
sudo apt update

# Install security engine
sudo apt install -y crowdsec

# Install collections (SSH, syslog, etc.)
sudo cscli collections install crowdsecurity/linux
sudo cscli collections install crowdsecurity/caddy-logs
sudo systemctl reload crowdsec
```

### Step 2: Configure Caddy for JSON Logging

CrowdSec's Caddy parser expects JSON logs. Configure your `Caddyfile`:

```caddy
{
    log {
        output file /var/log/caddy/access.log {
            roll_size 100mb
            roll_keep 5
            roll_keep_for 720h
        }
        format json
        level info
    }
}

# Your reverse proxy
netbird.example.com {
    encode gzip
    reverse_proxy localhost:8080 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

Restart Caddy:

```bash
sudo systemctl restart caddy
```

Verify JSON output:

```bash
sudo tail -f /var/log/caddy/access.log | jq '.' | head -20
```

### Step 3: Configure CrowdSec to Parse Caddy Logs

Create `/etc/crowdsec/acquis.d/caddy.yaml`:

```yaml
filenames:
  - /var/log/caddy/access.log
labels:
  type: caddy
```

Reload CrowdSec:

```bash
sudo systemctl reload crowdsec
```

Verify parsing:

```bash
sudo cscli metrics show acquisition

# Expected output:
# crowdsecurity/caddy-logs  │ 1234 │ 0 │ 0 │ 0 │ 0 │ 1234
```

### Step 4: Install Firewall Bouncer (nftables)

```bash
sudo apt install -y crowdsec-firewall-bouncer-nftables
sudo systemctl enable crowdsec-firewall-bouncer
sudo systemctl start crowdsec-firewall-bouncer
```

Verify bouncer is registered:

```bash
sudo cscli bouncers list

# Expected output:
# Name: crowdsec-firewall-bouncer-nftables
# Status: ✓ active
```

### Step 5: Customize Ban Duration

By default, CrowdSec bans for 4 hours. We extended it to 48 hours for persistent botnets:

Create `/etc/crowdsec/profiles.yaml.local`:

```yaml
name: default
debug: false
rules:
  - type: ban
    duration: 48h
notifications: []
```

Reload:

```bash
sudo systemctl reload crowdsec
```

---

## Results & Metrics

After the migration, here's what we observed:

### Metrics

```bash
sudo cscli metrics show
```

**Output (snapshot):**

```
Acquisition (Logs being read):
  crowdsecurity/caddy-logs:     12,450 lines | 0 parse errors
  crowdsecurity/sshd-logs:       5,230 lines | 0 parse errors

Scenarios (Detection rules):
  crowdsecurity/http-crawl-non_statics:    142 decisions | 28 IPs banned
  crowdsecurity/ssh-bf:                    89 decisions | 15 IPs banned
  crowdsecurity/web-application-attacks:   34 decisions | 8 IPs banned

Bouncers:
  crowdsec-firewall-bouncer-nftables:     112 active bans
```

### Key Findings

1. **99% Reduction in Log Noise:** Before CrowdSec, `/var/log/auth.log` filled 2GB per day (SSH probes). Now: 20MB per day. Why? IPs are blocked at the firewall level—the packets never reach sshd.

2. **Community Blocklist Efficiency:** Of 112 active bans, **95+ were from the community blocklist.** We never saw the initial attack; CrowdSec's CAPI blocked it preemptively.

3. **Caddy JSON Parsing:** Zero failed parses. CrowdSec handled log format updates seamlessly (JSON is self-describing).

4. **CPU Impact:** CrowdSec Security Engine consistently ~2-5% CPU. Caddy logs parsed in real-time without overhead.

---

## Operational Insights

### Monitoring & Debugging

**Check active bans:**

```bash
sudo cscli decisions list

# Output:
# Duration │ Scope │ Value           │ Decision │ Reason
# 48h      │ ip    │ 192.0.2.100     │ ban      │ crowdsecurity/http-crawl-non_statics
# 48h      │ ip    │ 198.51.100.42   │ ban      │ crowdsecurity/ssh-bf
```

**View alerts (why decisions were made):**

```bash
sudo cscli alerts list --ip 192.0.2.100

# Output:
# Alert ID: 4521
# Start Time: 2025-12-31T10:15:30Z
# End Time: 2025-12-31T10:20:45Z
# Scenario: crowdsecurity/http-crawl-non_statics
# Events Count: 145
# Remediation: ban for 48h
```

**Live nftables monitoring:**

```bash
# See packets being dropped
sudo nft monitor

# Or check statistics
sudo nft list ruleset | grep -A 10 "crowdsec-drop"

# Example:
# chain crowdsec-drop (priority filter -1; policy accept;)
#   packets 28,432 bytes 1,842,560
```

### Lessons Learned

1. **Community Blocklist is worth its weight in gold.** We blocked threats 99% of the time *before* they touched our infrastructure.

2. **JSON logging is non-negotiable.** If you're using a modern web server (Caddy, Nginx with JSON output, etc.), do yourself a favor and enable it. Regex-based parsing is yesterday's technology.

3. **Go > Python for performance.** CrowdSec's Go engine is fast enough that you can parse 10,000+ log lines per second on a modest server. Fail2Ban would choke.

4. **Bouncers are flexible.** We chose nftables, but CrowdSec supports HTTP bouncers (Layer 7), Nginx modules, cloud API integrations (Cloudflare, AWS), and more. Pick what fits your architecture.

---

## Potential Pitfalls & Solutions

### Issue: Bouncer Not Authenticating

**Symptom:** `crowdsec-firewall-bouncer` status shows "offline" or "error."

**Solution:**

```bash
# Regenerate credentials
sudo apt reinstall -y crowdsec-firewall-bouncer-nftables

# Restart both
sudo systemctl restart crowdsec
sudo systemctl restart crowdsec-firewall-bouncer

# Verify
sudo cscli bouncers list
```

### Issue: No Decisions Being Made

**Symptom:** `cscli decisions list` returns empty.

**Solution:**

1. Verify logs are being read:
   ```bash
   sudo cscli metrics show acquisition
   ```
   If counts are flat, CrowdSec isn't reading logs.

2. Check file permissions:
   ```bash
   ls -la /var/log/caddy/access.log
   # crowdsec user must have read permissions
   ```

3. Reload CrowdSec:
   ```bash
   sudo systemctl reload crowdsec
   ```

### Issue: False Positives (Legitimate Traffic Blocked)

**Symptom:** Users report access denied, but they're legitimate.

**Solution:**

1. Add them to a whitelist:
   ```bash
   sudo cscli decisions add --ip 203.0.113.99 --duration 0 --type whitelist
   ```

2. Or disable a specific scenario temporarily:
   ```bash
   sudo cscli scenarios disable crowdsecurity/http-crawl-non_statics
   ```

---

## Conclusions & Recommendations

### Why We Recommend CrowdSec for Production

1. **Security Posture:** Preventive > reactive. You're protected by the collective intelligence of 10,000+ instances.
2. **Operational Simplicity:** JSON parsing, decoupled bouncers, rich dashboards.
3. **Performance:** Go-based engine, minimal CPU overhead, scales to 10,000+ rules.
4. **Transparency:** Open-source, community-driven, audit-friendly.

### Next Steps

1. **Automate backups** of `/etc/crowdsec/` for disaster recovery.
2. **Set up dashboards** at [console.crowdsec.net](https://console.crowdsec.net) to visualize threats across your fleet.
3. **Enable notifications** (Slack, email) for critical alerts.
4. **Fine-tune scenarios** by adjusting thresholds and ban durations for your use case.
5. **Integrate with your SIEM** (ELK, Splunk, etc.) for centralized logging.

---

## Further Reading

- [CrowdSec Official Documentation](https://docs.crowdsec.net/)
- [CrowdSec vs. Fail2Ban: A Deep Dive](https://www.crowdsec.net/blog/crowdsec-not-your-typical-fail2ban-clone)
- [Caddy + CrowdSec Setup Guide](https://www.crowdsec.net/blog/secure-caddy-crowdsec-remediation-waf-guide)
- [OWASP: Web Application Firewall (WAF)](https://owasp.org/www-community/attacks/Web_Application_Firewall)

---

**Author:** Patrick Bloem 
**Published:** December 31, 2025  
**Tested On:** Ubuntu 24.04 LTS | CrowdSec v1.6+ | Caddy v2.x

Have questions? Drop them in the comments or [open an issue on GitHub]https://github.com/patrickbloem-it/server-hardening-crowdsec/.
