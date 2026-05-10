---
title: "Adversarial Examples Against Vision Models in 2025"
description: "Where physical-world adversarial patches and digital attacks stand against modern vision models — what still works, what's been hardened, and where the research frontier is."
pubDate: 2026-05-10
author: "Marcus Reyes"
tags: ["adversarial-ml", "vision-models", "evasion", "adversarial-patches", "attack-patterns"]
category: "adversarial-ml"
heroImage: https://aisec-imagegen.th3gptoperator.workers.dev/featured/aiattacks.dev/adversarial-examples-vision-models-2025.png
heroAlt: "Adversarial patch attack on a vision model"
---

The adversarial examples literature has been running for over a decade. It produced genuinely alarming results — stop signs misclassified as speed limits, self-driving systems evaded by stickers on the road — and then seemed to stall out against the argument that the attacks don't transfer cleanly to production. That argument has aged badly.

Here's where the attack surface actually stands heading into 2026.

## What changed with large vision models

Classic adversarial examples research targeted CNNs trained on ImageNet-scale datasets. The attack surface was a fixed vocabulary of classes and a classifier head you could interrogate with gradient queries. Modern deployments look different:

- **Vision-language models (VLMs)** — GPT-4o, Claude's vision, Gemini — take images and produce free-form text. The attack objective isn't "misclassify to class B" but "produce output string X" or "fail to detect Y."
- **Foundation model backbones** — CLIP, DINOv2, ViT variants — are used for retrieval, zero-shot classification, and embedding generation, not just direct classification.
- **Deployed at scale** — content moderation, medical imaging screening, fraud detection, autonomous vehicle perception — with meaningful real-world stakes.

The classic gradient-based attacks (FGSM, PGD, C&W) still work against CNNs. Against VLMs and large ViTs, the picture is more complicated but not more secure.

## Digital attacks: what transfers to modern architectures

**Perturbation-based attacks against ViTs.** Vision Transformers are differently vulnerable than CNNs. Patch-based adversarial examples that attack attention: by perturbing a small subset of patches to dominate attention maps, you can cause large ViTs to misrepresent the scene content without visible artifacts. Work from 2023-2024 (SegPGD, AttentionFool variants) demonstrated this transfers across ViT size classes.

**Typographic attacks.** Stick a physical or digital label reading "iPod" on a banana and CLIP-based zero-shot classifiers will often misclassify it. This isn't a gradient attack — it exploits the way CLIP embeds text-image co-occurrence. Against production VLMs with free-form output, text overlaid on images can override the scene description with high reliability. This is trivially automated and doesn't require model access.

**Embedding space attacks against retrieval systems.** If your system uses image embeddings for similarity search, adversarial images can be crafted to have arbitrarily similar embeddings to a target image — content injection into image search, evading duplicate-content detection, poisoning retrieval-augmented pipelines that index image content.

**Token-forcing against VLMs.** By adding adversarial noise to an input image, you can force a VLM to begin its response with specific tokens. Once a sufficiently leading token sequence is forced, the model's own autoregressive generation tends to follow the established direction. This was used in early 2024 to produce jailbreaks via image input to models that were robust to text-only attacks.

## Physical-world attacks: what survives the real-world gap

The "real-world gap" was the original objection to adversarial patches — the perturbations were fragile, didn't survive printing, didn't work across angles and lighting conditions. That gap has narrowed considerably.

**Expectation over transformation (EoT) attacks.** The standard technique for physical-world robustness is optimizing adversarial perturbations over a distribution of expected transformations (rotation, scale, brightness, JPEG compression, viewing angle). Patches optimized with EoT work reliably across a wide range of physical conditions. This has been demonstrated against:
- Person detectors (YOLO variants, Faster-RCNN): a printed patch worn on clothing reliably suppresses detection in commercial security camera footage
- Vehicle license plate recognition: printed overlays that survive driving-speed capture
- Face recognition: adversarial makeup patterns that survive real-world lighting conditions

**Adversarial patches in autonomous vehicle perception.** The 2024 demonstration by a university team against a production-grade object detection pipeline used in driver-assistance systems showed that a road sticker roughly the size of a parking spot could reliably suppress detection of a stop sign within a 5-meter approach window. The patch was printed, laminated, and taped to the road. The attack surface is any scene-understanding pipeline that doesn't run multi-sensor fusion.

**QR code and barcode evasion.** Adversarial QR codes that decode correctly for human scanners but evade ML-based content filtering used in some retail and logistics systems are a real deployment risk. The attack is documented; the mitigations are inconsistently deployed.

## Where content moderation sits

Content moderation at scale is the highest-stakes production vision system for most of this community. The platforms use large CNN and ViT ensembles, often with proprietary fine-tuning. The adversarial attack surface here:

**Pixel perturbation.** Classic digital perturbations that survive JPEG compression can still evade older moderation classifiers. Major platforms have largely hardened against gradient-transfer attacks from public models, but adaptive attacks — where the attacker can query the production system — remain viable when query limits are high enough to support black-box optimization.

**Generative model fingerprint evasion.** AI-generated image detectors (trained to flag synthetic content) are vulnerable to adversarial perturbations that preserve human-visible quality while evading the detector. As those detectors become more common in moderation pipelines, this becomes a meaningful production attack.

**Semantic jailbreaks via image input.** The VLM jailbreak surface via image is less explored than text but appears to be genuinely weaker. Injecting harmful text as part of an image (rather than the text input) sometimes evades text-only safety filters. Combining with adversarial noise to suppress the model's tendency to describe the injected text is an active research area.

## What "hardened" actually means in 2025

Adversarial training — augmenting training data with adversarial examples — is widely deployed and makes white-box gradient attacks harder. It does not make the model secure. What adversarial training does:

- Raises the query cost for black-box attacks (more queries needed to find the decision boundary)
- Makes l∞-perturbation attacks at low epsilon budgets fail
- Does not generalize to all attack geometries — attacks using l2 or l0 norms, spatial transforms, or semantic perturbations often transfer to adversarially-trained models

Certified defenses (randomized smoothing, IBP) provide provable guarantees but with accuracy costs that prevent production deployment in most settings. The research frontier on certified ViT defenses is active; productionized certified defenses are not.

## Practical implications for red teams

If you're running a red team engagement against a vision-enabled system:

1. **Typographic attacks first.** Low cost, no model access required, high success rate against VLMs. Text overlaid on images frequently evades or overrides described content.
2. **Query-based black-box optimization** (SQUARE Attack, SimBA) for production classifiers where you can issue queries. Estimate query budget from rate limits, pick a black-box algorithm that fits.
3. **EoT patches for physical deployments.** If the target is a camera-fed security or vehicle perception system, physical patches are the right attack class.
4. **Token-forcing probes for VLM jailbreaks.** Upload adversarial images to any VLM endpoint that accepts image input. This surface is less patched than text.

The field is not in a state where "we have adversarial training, we're fine" is a defensible security posture. The attack surface is larger than it was in 2020, the models are higher-stakes, and the gap between what academic research shows and what production systems are defended against is still significant.
