# Study 2: Chatbot anxiety (neuroticism)

Study 2 of the DGK Law and Cognition Lab's Character AI research program (UCLA Department of Psychology; UCLA IRB-25-1121, where it is part of "Study 1a"). Participants chatted with "Sylva", an AI chatbot that plays a fictional character. Her neuroticism was varied between subjects (anxious, HighN, vs. calm, LowN), and participants then rated Sylva and their experience and judged responsibility in a fictional scenario.

**Preregistration:** posted on OSF on May 7, 2026, as part of the plan for Studies 1-4 (<https://osf.io/cnxdu>).

## Contents

| Folder | What it holds |
|---|---|
| `experiment/` | The experiment as deployed on Pavlovia (`STUDY_MODE = '1c'`; Pavlovia project `characters/study-3`). The OpenRouter API key and the SONA credit token are replaced by `REDACTED`. |
| `analysis/` | The R Markdown analyses (core quantitative analyses and the integration of the language measures) and their change log. |
| `nlp/` | The language-analysis notebooks: data preparation, embeddings, open coding, LLM coding of the open-ended answers, reliability and consensus, topic modeling, sentiment and emotion, and chat-turn coding. Saved outputs are cleared; the notebooks need the data to run. |

The consent form, debrief and structured conversation outline approved for Studies 1-2 are in `../studies1-2_materials/`.

## Data

Participant data, chat transcripts and files derived from them are **not** in this repository. As the consent form states, de-identified data may be shared with qualified researchers for replication, secondary analysis or meta-analysis under a data use agreement that prohibits attempts to re-identify participants. Contact David G. Kamper, davidgkamper@ucla.edu.

This release contains the analysis code as of November 2026. The analyses are being re-run; the revised code will be a later release.
