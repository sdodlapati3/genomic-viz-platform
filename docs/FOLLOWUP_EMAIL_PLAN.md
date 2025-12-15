# 📧 Follow-up Email Plan for Xin Zhou

> **Context:** Interview completed Dec 15, 2025. Xin Zhou expressed concern about ML-heavy background not aligning with ProteinPaint's visualization focus. He invited a follow-up email explaining alignment.
>
> **Strategy:** Build out genomic-viz-platform repo with concrete ProteinPaint-style features, then send email with repo as evidence.
>
> **Target Send Date:** Weekend of Dec 21-22, 2025

---

## 📋 Interview Feedback Summary

### What Xin Zhou Said:

- Asked for GitHub repo demonstrating full-stack skills
- You provided: OmicsOracle, BioPipelines
- His concern: "You have more ML background"
- Neither repo demonstrates **interactive visualization** skills
- Alignment answer was too vague ("moving towards visualization")

### The Core Problem:

| What He Saw          | What He Needed to See            |
| -------------------- | -------------------------------- |
| LLM chatbot project  | D3.js interactive visualizations |
| Data pipelines       | Full-stack web application       |
| ML/AI focus          | Production visualization code    |
| Research orientation | Software engineering orientation |

---

## 🎯 Repo Development Goals (Before Email)

### High-Priority Features to Implement:

#### 1. **Lollipop Plot (Full Implementation)**

- [ ] Load mutation data from JSON/API
- [ ] Render protein backbone with domains
- [ ] Plot mutations as lollipops (position, frequency, type)
- [ ] Color by consequence (missense, nonsense, frameshift)
- [ ] Interactive tooltips on hover
- [ ] Click to filter/select mutations
- **Why:** This is ProteinPaint's signature visualization

#### 2. **Linked Views Architecture**

- [ ] Create 2-3 visualizations that share state
- [ ] Brush selection in one view → highlights in others
- [ ] Filter in table → updates scatter plot
- [ ] Event bus or shared state pattern
- **Why:** This is the core pattern across all ProteinPaint portals

#### 3. **Genome Browser (Basic)**

- [ ] Coordinate-based navigation (chr:start-end)
- [ ] Zoom and pan with D3
- [ ] Gene track rendering
- [ ] Dynamic data fetching based on visible region
- **Why:** Shows understanding of genomic coordinate systems

#### 4. **File Streaming Demo**

- [ ] Parse VCF file (streaming, not loading entire file)
- [ ] BigWig data fetching (even mock/local)
- [ ] Show understanding of indexed file access
- **Why:** Addresses the "streaming + indexing" anchor

#### 5. **Sample Portal Workflow**

- [ ] COHORT selector (dropdown/checkboxes)
- [ ] FILTER panel (gene, mutation type)
- [ ] RESULTS view (linked lollipop + table)
- [ ] EXPORT button (download filtered data)
- **Why:** Shows understanding of the product pattern

### Nice-to-Have (If Time):

- [ ] Survival curve (Kaplan-Meier) with D3
- [ ] Heatmap with clustering dendrogram
- [ ] Volcano plot for differential expression
- [ ] Hi-C contact matrix (inspired by ppHiC)

---

## 📝 Email Draft (To Update After Repo Work)

**Subject:** Following up — addressing the visualization experience gap

Dear Dr. Zhou,

Thank you for the honest feedback during our conversation. You raised a fair concern: when you asked for GitHub evidence of full-stack visualization work, I pointed to OmicsOracle and BioPipelines — neither of which demonstrates the interactive visualization skills central to ProteinPaint.

I want to address this directly, and show you what I've built since our conversation.

**The genomic-viz-platform project:**

I've been developing a repository focused specifically on genomic data visualization patterns inspired by ProteinPaint:

🔗 **GitHub:** github.com/[your-username]/genomic-viz-platform

**What I've implemented:**

[UPDATE THIS SECTION BASED ON WHAT YOU ACTUALLY BUILD]

- **Lollipop plot** — Interactive mutation visualization with protein domains, consequence coloring, and tooltips. Click a mutation to filter the cohort.
- **Linked views architecture** — Selection in the lollipop propagates to a sample table and vice versa. This is the pattern I see across MB-meta, Survivorship Portal, and GenomePaint.
- **Genome browser basics** — Coordinate navigation, zoom/pan, gene track rendering with dynamic data fetching.
- **Mini-portal workflow** — A sample implementation of the COHORT → FILTER → ANALYZE → EXPORT pattern.
- **File streaming** — VCF parsing without loading entire file; BigWig data access patterns.

[OPTIONAL: Include screenshot or GIF]

**Why I built this:**

I recognized the gap in my visible portfolio before applying. My PhD work generated the data types ProteinPaint visualizes (methylation, ATAC-seq, RNA-seq), but I hadn't built the visualization tools themselves. This repo is my effort to close that gap — not as a one-time interview exercise, but as a genuine learning investment.

**Why I want to move away from ML research:**

Building models taught me that the hard part isn't the architecture — it's helping researchers understand and explore their data. The most impactful thing I created during my PhD was often a simple visualization that let collaborators see patterns themselves. I get more satisfaction from building tools that empower discovery than from publishing another paper.

**What I'm NOT looking for:**

I'm not seeking a role where I can do ML research under a different title. I understand ProteinPaint needs people who build UIs, parse files, optimize rendering, and design APIs — and that's exactly what I want to learn to do well.

**What I'd commit to:**

I'd expect to spend my first 6-12 months learning the codebase, building features under guidance, and proving I can deliver production visualization code. I'm asking for the opportunity to grow into the role, not to redirect the team's priorities.

I'll continue building out this project regardless — but I'd much rather learn from a team that's been doing this for a decade than figure it out alone.

Thank you again for your consideration.

Best regards,
[Your name]

P.S. — [OPTIONAL: Link to live demo if deployed, or offer screen recording]

---

## ✅ Pre-Send Checklist

Before sending the email:

- [ ] All high-priority features implemented and working
- [ ] README.md is clear and professional
- [ ] Code is clean (no console.logs, commented-out code)
- [ ] Live demo deployed (GitHub Pages, Vercel, or Netlify) — OPTIONAL but strong
- [ ] Screenshots or GIF in README showing the visualizations
- [ ] Recent commits visible (shows active development)
- [ ] Update the email draft with actual implemented features
- [ ] Proofread email one more time
- [ ] Test all GitHub links work

---

## 📊 Progress Tracker

| Feature         | Status         | Notes        |
| --------------- | -------------- | ------------ |
| Lollipop plot   | 🔴 Not started | Priority 1   |
| Linked views    | 🔴 Not started | Priority 1   |
| Genome browser  | 🔴 Not started | Priority 2   |
| File streaming  | 🔴 Not started | Priority 2   |
| Portal workflow | 🔴 Not started | Priority 3   |
| Survival curve  | 🔴 Not started | Nice-to-have |
| README polish   | 🔴 Not started | Before send  |
| Deploy demo     | 🔴 Not started | Optional     |

**Legend:** 🔴 Not started | 🟡 In progress | 🟢 Complete

---

## 💡 Key Points to Emphasize in Final Email

1. **Show, don't tell** — The repo IS the argument
2. **Acknowledge the gap honestly** — Shows self-awareness
3. **Explain the WHY** — Not just pivoting for a job, but genuine interest
4. **Commit to learning** — 6-12 months of growth, not immediate ML initiatives
5. **Reference ProteinPaint patterns** — Shows you studied their work

---

## 🗓️ Timeline

| Day        | Focus                             |
| ---------- | --------------------------------- |
| Mon Dec 16 | Lollipop plot implementation      |
| Tue Dec 17 | Linked views + event bus          |
| Wed Dec 18 | Genome browser basics             |
| Thu Dec 19 | File streaming demo               |
| Fri Dec 20 | Portal workflow, polish           |
| Sat Dec 21 | README, screenshots, final review |
| Sun Dec 22 | Send email                        |

---

_Last updated: Dec 15, 2025_
