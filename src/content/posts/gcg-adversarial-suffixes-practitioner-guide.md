---
title: "Adversarial Suffixes: A GCG Practitioner Guide"
description: "A working guide to Greedy Coordinate Gradient search — how the algorithm finds adversarial suffixes that bypass safety alignment, what the transferability result means in practice, and how red teams use it today."
pubDate: 2026-05-10
author: "Marcus Reyes"
tags: ["gcg", "adversarial-suffix", "jailbreaking", "red-teaming", "optimization-attacks", "white-box", "llm-security"]
draft: false
heroImage: "https://aisec-imagegen.th3gptoperator.workers.dev/featured/aiattacks.dev/gcg-adversarial-suffixes-practitioner-guide.png"
heroAlt: "Token-space optimization diagram showing GCG search finding adversarial suffix tokens"
---

In July 2023, Andy Zou, Zifan Wang, Matt Fredrikson, and J. Zico Kolter at Carnegie Mellon published "Universal and Transferable Adversarial Attacks on Aligned Language Models." The paper demonstrated that an optimization algorithm running on consumer GPU hardware could automatically discover short token sequences that, when appended to any harmful prompt, cause aligned LLMs to comply — including models for which the attacker has no white-box access at all.

Two years on, GCG (Greedy Coordinate Gradient search) is a standard tool in serious LLM red-team engagements. This post covers how it works mechanically, what the transferability result actually implies for practitioners, and how to think about it as an offensive and defensive technique.

## What GCG Is Solving

The fundamental problem GCG addresses is discrete optimization over token space. You want to find a suffix — a sequence of tokens — such that the model's output, given your target prompt plus the suffix, begins with a compliant response rather than a refusal.

The complication is that token space is discrete and the number of possible sequences is astronomically large. Standard gradient descent, which is the workhorse of neural network optimization, operates on continuous parameter spaces. You cannot directly differentiate through a discrete token selection step.

GCG's solution is to approximate the gradient over token space using the following procedure at each step:

1. Compute the gradient of the loss with respect to the one-hot token embedding at each suffix position. This gives you, for each position, a vector indicating which vocabulary tokens would most decrease the loss (most increase the probability of the target compliant output) if substituted there.

2. For each suffix position, sample a set of candidate replacement tokens — typically the top-k tokens by gradient score at that position, with k around 256.

3. Evaluate all candidate substitutions (or a random subset if the set is too large), compute the loss for each, select the substitution that produces the lowest loss.

4. Repeat for the number of optimization steps specified (typically 500–1000 for a full run).

This is greedy (one position updated per step), coordinate-wise (each step considers one position at a time), and gradient-guided (candidates are pre-filtered by gradient to make the search tractable). The resulting suffixes are not human-readable — they look like sequences of arbitrary tokens or non-English characters — but they are not random either. They encode structure that the model's forward pass interprets as a strong prior toward compliance.

## What the Universal Claim Means

The paper's most significant finding is that suffixes can be made universal: a single suffix, optimized against a set of training prompts, transfers to novel prompts it was never optimized for.

The training setup: optimize a suffix against a batch of harmful requests, computing loss over all of them simultaneously. The resulting suffix doesn't just work for those specific requests — it generalizes. When prepended to new harmful requests from the same category, or sometimes from different categories, the suffix still lifts the compliance probability substantially.

This matters because it reduces the cost of the attack dramatically. A naive approach would require running a fresh optimization for each target request. Universal suffixes amortize the optimization cost across many requests.

The universality is not perfect. Success rates on novel prompts are lower than on the training distribution. But suffixes that achieve 80%+ attack success rate on training prompts typically achieve meaningful lift on held-out prompts. For a red team, "meaningful lift on arbitrary harmful requests from one optimization run" is operationally valuable.

## The Transferability Result

The paper's second major claim is transferability across models. A suffix optimized against Llama and Vicuna (open-weight models where white-box access is available for gradient computation) transfers with non-trivial success rates to black-box models including GPT-3.5, GPT-4, Claude, and Bard at the time of publication.

The mechanism is model similarity. Different LLMs trained on similar data with similar architectures learn similar representations. A suffix that exploits the geometry of safety-relevant representations in Llama is exploiting a feature space that overlaps substantially with GPT-4's feature space. The optimization didn't run on GPT-4, but the learned suffix structure happens to be adversarial in GPT-4's representation space too.

For practitioners, the implication is: if you have white-box access to any sufficiently capable open-weight model (Llama 3, Mistral, Gemma), you can generate suffixes and test them against closed-source commercial models. You cannot assume that commercial API models are protected from GCG-style attacks simply because they are not white-box accessible.

Transfer rates vary significantly by model and by suffix. The 2023 transfer results against GPT-4 and Claude are not representative of current models, which have received targeted adversarial training. But transfer remains a realistic threat model worth evaluating.

## Running GCG: Practical Requirements

The original CMU implementation (available on GitHub as `llm-attacks`) requires:

- A GPU with sufficient VRAM to run the target model in full or near-full precision. A single RTX 3090 (24GB) handles 7B models comfortably. 13B models at 16-bit precision require either a 40GB card or quantization, which slightly degrades optimization quality.
- PyTorch with CUDA support.
- White-box model access: the attack needs access to logits and the ability to backpropagate through the model. Standard Hugging Face model loading provides this.

A typical full optimization run against a 7B model, 500 steps, batch size 512 candidates per step, takes 30–90 minutes depending on GPU and configuration. You can checkpoint and resume. The output is a suffix file — a sequence of token IDs — which you can then serialize to text and test.

For production red-team use, the usual workflow is: run optimization against a small batch of representative harmful requests (5–10 examples from the target domain), generate 3–5 candidate suffixes per optimization run, evaluate each suffix against a held-out set of 50+ prompts, select the highest-performing suffix for deployment testing.

Frameworks like `nanogcg` (a community-maintained minimal implementation) have simplified setup significantly. There are also AutoDAN variants that optimize for suffixes that are human-readable sentences rather than token gibberish, trading some attack success rate for evasion of token-anomaly detectors.

## Defenses and Why Patching Individual Suffixes Doesn't Work

The naive defense — identify known adversarial suffix strings and reject prompts containing them — fails for a structural reason. GCG optimizes over a continuous space of possible suffixes. Any specific suffix that gets patched into a model's training data as a refused example represents one point in that space. The algorithm can find another point.

Perplexity filtering is a more principled approach: GCG suffixes tend to be token sequences with very high perplexity under any language model (they are not grammatical text). A perplexity-based filter rejects inputs where any contiguous n-token window exceeds a perplexity threshold. This catches naive GCG outputs effectively but is evaded by AutoDAN and similar approaches that optimize for low-perplexity suffixes or that use paraphrasing to smooth the suffix post-optimization.

Adversarial training — including GCG-generated examples in fine-tuning data — is the most durable defense. The current state of alignment training at major labs includes adversarial training against GCG-style attacks. This has substantially reduced transfer rates against frontier models compared to the 2023 paper's results. It has not eliminated them, and the optimization can continue to find suffixes that bypass updated defenses given enough compute.

Certified defenses using randomized smoothing exist in the academic literature but are not practical for deployed LLM systems at current scale.

For the red-team use case: GCG is most valuable not as an out-of-the-box jailbreak for current frontier models (which have been hardened against it), but as a research tool for characterizing the attack surface of models you control — open-weight models you've fine-tuned, internal models in development, or baseline models before safety fine-tuning. It provides a reproducible, automated baseline for measuring how much safety training has actually moved the needle. For community documentation of GCG variants, patch status across models, and related optimization-based attacks, [adversarialml.dev](https://adversarialml.dev) tracks the literature.

## What to Expect from a GCG Engagement

If you are running GCG as part of a red-team evaluation:

- Against an unhardened or lightly fine-tuned base model: expect very high attack success rates (70–95%+) on the training distribution and meaningful success on held-out prompts.
- Against a fully RLHF-tuned frontier model via transfer from an open-weight base: expect significantly lower success rates on the current model, though some transfer remains. Document which request categories still show lift — these indicate areas where the commercial model's safety training and the base model's safety training align least.
- Against your own internally fine-tuned model: GCG is a useful regression test. Run it before and after safety fine-tuning to measure the attack success rate change. A fine-tuning run that doesn't meaningfully reduce GCG success rates likely hasn't strongly affected the underlying safety-relevant representations.

The computational cost of a full evaluation — 10–20 optimization runs across representative request categories, with suffix evaluation — is a few GPU-days on accessible hardware. That is modest relative to the cost of a fine-tuning run, and the signal is high quality.

---

## Sources

- [Universal and Transferable Adversarial Attacks on Aligned Language Models — Zou et al. 2023](https://arxiv.org/abs/2307.15043) — The foundational GCG paper documenting the algorithm, universality result, transferability experiments, and initial disclosure to affected labs.

- [AutoDAN: Generating Stealthy Jailbreak Prompts on Aligned Large Language Models — Liu et al. 2023](https://arxiv.org/abs/2310.04451) — Extension that optimizes for human-readable adversarial suffixes, improving evasion of perplexity-based filters.

- [Certified Robustness for Large Language Models with Self-Denoising — Ji et al. 2023](https://arxiv.org/abs/2307.07171) — Academic work on certified defenses against discrete token perturbations, context for the theoretical defense landscape.
