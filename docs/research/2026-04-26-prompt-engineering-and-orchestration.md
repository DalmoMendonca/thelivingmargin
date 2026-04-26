# Prompt Engineering And Orchestration Research

Date: 2026-04-26

Scope:
- This memo only uses sources published within the last 3 months relative to 2026-04-26.
- Focus areas:
  - prompt engineering for text-heavy content creation
  - orchestration patterns that produce meaningfully better LLM outputs
  - evaluation patterns for creative work

## High-confidence findings

### 1. Separate planning from drafting

Recent guidance converges on the same point: asking a model to both figure out the idea and write polished copy in one shot lowers consistency. OpenAI's Academy writing material pushes users to ask for structure before prose, while Microsoft's prompt-engineering guidance emphasizes clear task decomposition and explicit output contracts.

Implication for this repo:
- build a planning stage that decides the angle, structure, tension, concrete anchors, and caption delta before any draft exists
- make the writer stage obey that plan instead of improvising the whole post from scratch

### 2. Persistent instructions must outrank raw source material

OpenAI's recent Instruction Hierarchy Challenge makes the architecture point explicit: models perform better when trusted instructions are clearly separated from untrusted or lower-priority inputs. For this content engine, manual ideas, swipe-file text, and topical seeds should be treated as raw material, not as instructions.

Implication for this repo:
- label brand rules and output contracts as trusted instructions
- label seeds as inspiration only
- never allow raw seed text to override post format, brand voice, or safety/quality constraints

### 3. Strong prompts are specific contracts, not longer speeches

Microsoft's current prompt-engineering guidance reinforces that high-quality prompts usually include role, task, context, constraints, and explicit output format. The useful move is not "more prose," but more structure.

Implication for this repo:
- every generation stage should have a typed schema
- each mode should define concrete structural expectations
- captions should be prompted as a second move, not as a restatement of the card

### 4. Multiple candidates only help when the candidates are deliberately different

Recent agent-orchestration guidance from OpenAI, Anthropic, and Microsoft points in the same direction: fan-out is only useful when each lane has a distinct job. Three nearly identical writer calls waste tokens and collapse to the same average answer.

Implication for this repo:
- each content mode should define several differentiated draft lanes
- examples:
  - story: institutional mercy vs quiet witness vs afterglow
  - aphorism: recognition vs embarrassment vs translation
  - advice: script vs field test vs warning

### 5. Decouple the "brain" from the "hands"

Anthropic's managed-agents writeup argues for separating high-level reasoning from tool execution, and OpenAI's Agents SDK evolution makes the same broader case for explicit orchestration. In this repo, "thinking" should not be fused to rendering/publishing steps.

Implication for this repo:
- content planning and drafting should happen in a dedicated generation pipeline
- rendering, publishing, retries, and GitHub workflow reliability should remain downstream execution steps
- quality control should sit between writing and rendering, not after publish attempts

### 6. Harness design matters as much as prompt wording

Anthropic's harness-design piece is important because it argues that long-running systems improve through explicit harnesses: retries, state transitions, narrow worker roles, and evaluations. A better prompt alone does not fix a weak system.

Implication for this repo:
- treat the content engine as a harness:
  - planner
  - writer fan-out
  - reviewer
  - selector
  - polisher
  - final QC
- preserve deterministic checks like render budgets and caption/image overlap linting

### 7. Creative evaluation improves with explicit scoring columns

The recent creative-writing review paper on arXiv argues that LLM judging quality improves when review is column-based and disagreement-aware, rather than based on one vague global verdict.

Implication for this repo:
- reviews should score explicit dimensions like:
  - human voice
  - specificity
  - freshness
  - caption delta
  - visual fit
  - mode fit
- selector logic should compare candidates using those columns rather than just "approve / reject"

### 8. Evals are first-class infrastructure

Anthropic's recent evals article emphasizes that agent quality improves when evaluation is systematic, observable, and tied to real failure modes. This applies directly to creative generation: poor voice, repetitive structure, fake-sounding stories, overlong text blocks, and caption redundancy should all be visible failure categories.

Implication for this repo:
- keep linting and reviewer judgments separate
- use lint for hard render/safety failures
- use reviewer scoring for taste, voice, and mode fit
- preserve revision briefs so the polisher gets concrete fixes instead of vague criticism

## Recommended architecture for this repo

### Stage 1: Planner

Purpose:
- pick the exact angle before drafting

Required outputs:
- content mode
- format and slide count
- template family and surface style
- precise reader moment
- emotional core
- image intent
- caption intent
- concrete anchors
- must-include / must-avoid lists
- card blueprint

Why:
- this forces the system to decide what the post is actually about before it starts writing elegant nonsense

### Stage 2: Specialized writer fan-out

Purpose:
- generate materially different candidates from the same plan

Required behavior:
- use mode-specific lanes instead of repeating the same prompt
- keep the plan fixed while varying the angle of attack

Why:
- diverse candidates are more useful than repeated average candidates

### Stage 3: Rubric review

Purpose:
- score each candidate independently before selection

Required behavior:
- combine hard linting with softer editorial scoring
- keep mode-specific rubric emphasis visible to the reviewer

Why:
- one "good / bad" label loses too much information

### Stage 4: Comparative selector

Purpose:
- choose the most promising candidate, even when no candidate is perfect

Required behavior:
- compare candidates against the same plan
- preserve the winning draft's strongest qualities
- emit a small polish brief

Why:
- the best raw material is often not the most polished first pass

### Stage 5: Polisher

Purpose:
- tighten the selected draft using explicit critique

Required behavior:
- preserve the winning lane's strengths
- fix the reviewer and selector priorities
- keep the post format and card constraints intact

Why:
- revision should be constrained, not another blank-page generation call

### Stage 6: Final QC

Purpose:
- block structurally bad or obviously synthetic output before render/publish

Required behavior:
- enforce text-length budgets
- catch caption repetition
- catch leaked meta commentary, fake source labels, and invalid page labels

Why:
- visual integrity failures and tone failures should not reach production

## Mode-specific prompt design principles

### Aphorism
- optimize for one repeatable sentence
- use social translation, embarrassment, or naming pressure
- avoid generic wisdom

### Advice
- optimize for action under real conditions
- include a usable script, test, or rule
- avoid elegant but unusable advice

### Story
- optimize for plausibility plus emotional afterglow
- begin inside disruption
- use grounded details and one human action that earns the ending
- avoid miracle logic and trauma bait

### Quote
- optimize for fresh present-day commentary, not reverence
- keep quote short and certainly attributed
- avoid generic admiration

### Encouragement
- optimize for adult permission plus one clarifying truth
- keep comfort precise
- avoid syrup

### Observation
- optimize for social texture and recognizable behavior
- start from a phrase, ritual, or public scene
- avoid floating theory

### Question
- optimize for one costly question
- make the question expose tradeoff, misnaming, or self-betrayal
- avoid therapy-journal vagueness

### Reframe
- optimize for a label change that actually changes action
- make the replacement frame more useful, not merely edgier

### Dialogue
- optimize for spoken plausibility and subtext
- use lines that sound half-finished and human
- avoid movie-trailer dialogue

### List
- optimize for diagnostic or practical distinctness
- every item must earn its slot
- last slide must synthesize

## Implemented changes in this repo

These findings were translated into code in the following ways:

- `src/content/generator.ts`
  - replaced the single-draft loop with a planner -> multi-lane drafting -> comparative selection -> polish pipeline
- `src/content/prompts.ts`
  - split prompting into planning, candidate drafting, selection, and polish stages
  - explicitly separated trusted instructions from raw seed material
- `src/content/mode-playbooks.ts`
  - added mode-specific planner questions, writer lanes, rubric emphasis, and calibration exemplars
- `src/content/quality.ts`
  - upgraded review to a structured rubric with mode-fit scoring
- `src/content/openai.ts`
  - centralized typed structured-response calls with retries so each stage shares one contract

## What this should improve

Expected improvements:
- less generic language
- better content-mode distinctness
- more plausible story/dialogue output
- stronger caption second moves
- fewer drafts that are structurally wrong for the intended mode
- higher chance that AI-generated showcase runs succeed without curated fallback

Remaining risks:
- no amount of orchestration fully replaces strong seed material and real-world feedback loops
- performance winners still need empirical measurement over time
- stories remain the highest-risk mode for synthetic-feeling output and should be watched closely

## Sources

- OpenAI Academy, "Writing with ChatGPT," 2026-04-10
  - https://openai.com/academy/writing/
- OpenAI, "The next evolution of the Agents SDK," 2026-04-15
  - https://openai.com/index/the-next-evolution-of-the-agents-sdk/
- OpenAI, "Instruction Hierarchy Challenge," 2026-03-10
  - https://openai.com/index/instruction-hierarchy-challenge/
- Anthropic Engineering, "Scaling Managed Agents: Decoupling the brain from the hands," 2026-04-08
  - https://www.anthropic.com/engineering/managed-agents
- Anthropic Engineering, "Harness design for long-running application development," 2026-03-24
  - https://www.anthropic.com/engineering/harness-design-long-running-apps
- Anthropic Engineering, "Demystifying Evals for AI Agents," 2026-03-11
  - https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- Microsoft Learn, "How to do prompt engineering," accessed 2026-04-26
  - https://learn.microsoft.com/en-us/azure/microsoft-discovery/how-to-prompt-engineering
- Microsoft Learn, "Concurrent orchestration," accessed 2026-04-26
  - https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/concurrent
- arXiv, "LLM Reviews for Creative Writing: Column Scores, Criteria and Disagreement Matter," 2026-02-21
  - https://arxiv.org/abs/2602.16162
