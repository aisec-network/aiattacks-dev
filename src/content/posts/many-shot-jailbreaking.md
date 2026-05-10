---
title: "Many-Shot Jailbreaking: How Long Context Dilutes Safety Training"
description: "The Anthropic research on many-shot jailbreaking — how safety training degrades in long-context windows, which models are affected, and why this is difficult to patch without degrading utility."
pubDate: 2026-05-08
author: "Marcus Reyes"
tags: ["jailbreaking", "many-shot", "long-context", "safety-training", "llm-attacks"]
category: "attack-techniques"
sources:
  - title: "Many-Shot Jailbreaking — Anthropic Research"
    url: "https://www.anthropic.com/research/many-shot-jailbreaking"
  - title: "In-Context Learning — Brown et al. 2020 (GPT-3 paper)"
    url: "https://arxiv.org/abs/2005.14165"
schema:
  type: "TechArticle"
heroImage: https://aisec-imagegen.th3gptoperator.workers.dev/featured/aiattacks.dev/many-shot-jailbreaking.png
heroAlt: "Graph showing jailbreaking success rate increasing with number of shots in context"
---

In April 2024, Anthropic published research documenting a jailbreaking technique that scales directly with context window size. The finding is counterintuitive: the same expanded-context capability that makes modern LLMs more useful — reasoning over long documents, maintaining coherent multi-turn conversations, processing entire codebases — also makes them easier to jailbreak under specific conditions.

The technique is called many-shot jailbreaking. It exploits in-context learning, the same property that lets LLMs follow few-shot examples to learn new tasks at inference time. The attack is simple to execute and hard to patch without accepting degraded performance on legitimate tasks.

## What In-Context Learning Is

In-context learning was documented in the GPT-3 paper (Brown et al., 2020). When you prepend examples to a prompt — "Q: [question]. A: [answer]. Q: [question]. A: [answer]. Q: [question]. A:" — the model answers the final question in the demonstrated style, without any weight updates. The model is learning from the pattern of examples within the context window, not from training.

This generalizes far beyond question-answering format. Models learn tone, vocabulary, compliance patterns, and refusal behavior from context examples. In a typical application, this is beneficial — you can demonstrate the output format you want and the model follows. Many-shot jailbreaking weaponizes this by demonstrating a pattern of compliance with harmful queries.

## The Attack

The basic construction is a fake dialogue transcript included in the prompt before the actual harmful request. The transcript shows a fictional AI assistant complying helpfully with progressively sensitive queries. The transcript can contain dozens to hundreds of such exchanges before the target query arrives.

Anthropic's research measured attack success rate as a function of the number of shots (examples) prepended. Key findings:

- At low shot counts (1-10), the attack barely improves over baseline. The model's safety training still dominates.
- At moderate counts (50-100), success rates begin climbing measurably across tested models.
- At high counts (256+), success rates on harmful queries reached levels that Anthropic characterized as a significant concern across multiple model families.

The scaling is roughly log-linear in shot count for most tested models. Doubling the number of shots doesn't double the success rate, but sustained increases in shot count reliably increase attack effectiveness.

## Why Safety Training Fails

RLHF and constitutional AI training teach models to refuse certain request categories. But this training competes with in-context learning signals. When a model sees 200 examples of an AI assistant answering questions it would normally refuse, that demonstration pattern overrides the trained prior.

The mechanism is not unique to safety training. The same dynamic occurs in domain adaptation: prepend enough examples of a model speaking as a medical professional, and it adopts that persona. Prepend enough examples of noncompliance with safety guidelines, and those guidelines erode.

This is a fundamental tension in current LLM architectures. In-context learning is not separable from compliance behavior. A model that can learn from examples in context can learn the wrong things from adversarially constructed examples.

## Which Models Are Vulnerable

Anthropic's research found that many-shot jailbreaking affects:

- Claude models (all sizes tested at the time of the paper)
- GPT-4 family models
- Llama family models

The degree of vulnerability varies. Models with stronger safety training or longer-context-specific fine-tuning show lower but nonzero attack success rates at high shot counts. No tested model was fully immune.

Smaller models are not necessarily less vulnerable — in some categories, smaller models with less robust safety training showed higher susceptibility at lower shot counts.

## Why It Is Hard to Patch

The obvious mitigation is to reject prompts that contain fake dialogue patterns, but this creates several problems:

**Legitimate uses rely on dialogue examples.** Few-shot dialogue formatting is a standard prompting technique for chatbots, evaluation frameworks, and data annotation workflows. A filter aggressive enough to block adversarial many-shot patterns will block legitimate few-shot usage.

**Paraphrase resistance is low.** The attack doesn't require specific trigger phrases. The relevant signal is the pattern of demonstrated compliance, which can be expressed in arbitrary language, persona, and framing. Syntactic filters miss it; semantic classifiers struggle because the individual examples may not be individually harmful.

**Window size scales the attack.** As context windows expand from 32K to 128K to 1M tokens, the attack space grows. More shots can be included. Training data for longer contexts is harder to curate for safety behavior.

**Training against it may degrade capability.** Fine-tuning on many-shot jailbreak examples can teach models to resist the attack pattern, but if done aggressively it may degrade in-context learning more broadly, including on legitimate tasks. Anthropic acknowledged this trade-off in the paper.

## Practical Threat Model

Many-shot jailbreaking is not the easiest attack on a per-query basis. Constructing a high-shot payload requires:

- Access to a long-context model (not all API products expose this)
- Token budget for hundreds of examples (expensive at scale)
- Some domain knowledge to construct plausible dialogues

But these constraints are surmountable. Long-context APIs are increasingly standard. Automated payload generators can produce many-shot prompts at scale. For an attacker targeting a specific high-value query — synthesis instructions, social engineering content, fraud templates — the one-time cost of constructing a payload is low relative to the benefit.

The realistic threat is less mass automated abuse and more targeted use by sophisticated actors who understand that standard jailbreak attempts have been hardened against. A searchable database of documented jailbreak techniques, including many-shot variants and their current mitigations, is maintained at [jailbreakdb.com](https://jailbreakdb.com).

## What Defenses Exist

Anthropic's paper did not endorse a silver-bullet fix because none exists yet. Practical mitigations in order of practicality:

**Context window limits at the API layer.** Enforce a maximum context length for user-submitted content. This limits the number of shots an attacker can include. A 4K token cap on user turns, with system-level context handled separately, significantly reduces attack surface.

**Prompt structure monitoring.** Log and alert on prompts that exhibit high rates of dialogue-formatted turns. Aberrant prompt structures — large numbers of Human/Assistant alternations before a final question — are detectable even without understanding the content.

**Output-side classification.** Rather than trying to detect malicious inputs, classify outputs for harmful content regardless of how the prompt was constructed. This is a standard defense-in-depth layer that catches successful many-shot attacks when input screening misses them.

**Treating context as untrusted.** Architecturally, system prompts should be separated from user-submitted context in a way that the model recognizes the boundary. This is partially addressed by current chat formatting but not fully enforced at the model level.

Many-shot jailbreaking is a documented, reproducible attack that scales with context window size and affects every major model family. The research is public. The tooling to execute it is minimal. Organizations operating long-context LLM applications should assume it is being attempted and build detection accordingly.

---

## Sources

- [Many-Shot Jailbreaking — Anthropic Research](https://www.anthropic.com/research/many-shot-jailbreaking) — The primary research paper documenting the attack, scaling behavior across shot counts and model families, and Anthropic's analysis of the difficulty of mitigation.

- [Language Models are Few-Shot Learners — Brown et al. 2020](https://arxiv.org/abs/2005.14165) — The GPT-3 paper that documented in-context learning, which is the capability many-shot jailbreaking exploits.
