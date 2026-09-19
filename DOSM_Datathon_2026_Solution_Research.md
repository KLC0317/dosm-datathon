# DOSM Datathon 2026 — Research and Solution Concept

## Proposed product

**Name:** Destinasi Seimbang (Balanced Destinations)

**Working subtitle:** A Tourism Pressure-to-Prosperity Intelligence Dashboard for Malaysia

**One-sentence pitch:** Destinasi Seimbang helps MOTAC, state tourism agencies and local councils decide **where to grow tourism, where to slow or manage it, and what intervention will produce the most inclusive value**, using DOSM statistics to balance visitor demand, local economic benefit, resident cost and destination capacity.

This is a public-sector decision product, rather than a tourist itinerary application. It does not ask “Where should this visitor go?” It asks “Given the next ringgit or campaign, which destination can absorb it, who benefits, and what will the trade-off be?”

## Why this problem matters now

The DOSM Datathon brief calls for machine learning and AI solutions for sustainable tourism, with economic, social, environmental, technology and governance dimensions. The product should therefore help a real decision-maker act on a measurable problem.

The latest available DOSM releases show a tourism sector that is large and accelerating:

- DOSM reports tourism generated **RM291.9 billion** and contributed **15.1% of Malaysia’s GDP in 2024**. Tourism employment reached **3.54 million people**, or **21.6% of total employment**. [DOSM Tourism Satellite Account 2024](https://www.dosm.gov.my/portal-main/release-content/tourism-satellite-account-2024)
- Domestic tourism reached **290.1 million visitors and RM121.3 billion in expenditure in 2025**, up 11.5% and 13.6% respectively from 2024. The average length of stay rose to 2.56 nights. [DOSM Domestic Tourism Survey 2025](https://www.dosm.gov.my/portal-main/release-content/domestic-tourism-survey-2025)
- Demand is geographically uneven. In the 2025 domestic tourism release, the largest tourist destinations included Pahang, Selangor, Perak, Kuala Lumpur and Johor, while smaller territories such as Labuan and Putrajaya received much lower tourist counts. This creates a planning question about carrying capacity and the distribution of benefits, rather than a simple question of how to maximise arrivals. [DOSM Domestic Tourism Survey 2025 infographic/data](https://www.dosm.gov.my/uploads/release-content/file_20260616124538.pdf)
- DOSM’s 2025 data shows domestic spending is concentrated in **shopping (36.9%)**, food and beverages (16.1%), automotive fuel (13.5%) and accommodation (10.7%). This is an opportunity to measure whether tourism value is reaching local services and communities, instead of treating visitor volume as the only success metric. [DOSM Domestic Tourism Survey 2025](https://www.dosm.gov.my/site/downloadrelease?id=domestic-tourism-survey-2025&lang=English)
- MOTAC’s National Tourism Policy 2020–2030 explicitly includes smart tourism, sustainable and responsible tourism, stronger governance and inclusive benefits. MOTAC also describes overtourism as an emerging policy risk that requires evidence and multi-stakeholder management. [MOTAC National Tourism Policy FAQ](https://www.motac.gov.my/en/frequently-asked-questions-faqs/)
- MOTAC’s sustainable tourism programme frames digitalisation, public-private cooperation and SDG alignment as part of transforming the industry. [MOTAC Sustainable Tourism](https://lestari.motac.gov.my/mengenai)

The gap is operational: published statistics describe what happened, but a state officer still has to combine demand, capacity, local economic structure, prices and population conditions manually before deciding whether to launch a campaign, fund an attraction, add transport, regulate visitor flow or support local businesses.

## The specific government problem

Tourism policy often rewards destinations for attracting more visitors. That can create four blind spots:

1. **Growth can be badly timed.** A destination may receive a seasonal surge when accommodation, roads, water, waste services or nature sites are already under stress.
2. **Visitor growth is not the same as local prosperity.** A high visitor count can coexist with low local capture of spending, weak tourism employment quality or rising living costs.
3. **Promotion budgets are not allocated with a common evidence base.** A state may be promoted because it is under-visited, but without knowing whether the problem is demand, access, product readiness or missing local capacity.
4. **Sustainability signals are fragmented.** Economic indicators sit in DOSM datasets while environmental or operational signals sit with local authorities and agencies. There is no simple, auditable screen that combines them for an intervention decision.

The proposed product turns these into one decision loop:

> **Measure destination pressure and benefit → forecast the next period → simulate an intervention → recommend an accountable action → monitor the result.**

## Target users and decisions

### Primary users

**MOTAC national planning and policy officers**

- Decide where national campaigns, sustainable tourism grants and pilot programmes should be directed.
- Compare states using a common score and inspect the evidence behind it.
- Prepare briefings that connect tourism results to the National Tourism Policy and SDGs.

**State tourism authorities and local councils**

- Identify destinations with high demand but insufficient capacity.
- Select measures such as timed promotion, dispersal campaigns, local business support, shuttle/transport coordination, waste capacity or visitor caps.
- Track whether a policy improves local benefit without shifting pressure to another place.

**DOSM analysts and inter-agency planners**

- Explore relationships between tourism, GDP, employment, population, prices and accommodation.
- Produce a repeatable evidence pack with source data, definitions, confidence and limitations.

### Secondary users

- Tourism operators and destination management organisations, through a carefully limited public view.
- Community and small-business programme managers, who need to see where local participation and business support are most justified.
- Researchers and auditors, through downloadable methodology and data provenance.

### Decisions the dashboard must answer

1. **Where should the next promotion ringgit go?**
2. **Where should demand be dispersed or time-shifted?**
3. **Which destinations need capacity or community support before more promotion?**
4. **What is the likely economic benefit and cost-pressure trade-off of a proposed intervention?**
5. **Did the intervention improve inclusive value after one quarter or one year?**

## Novelty: the destination pressure-to-prosperity balance

Existing tourism dashboards commonly report arrivals, hotel occupancy or attractions. Destinasi Seimbang adds a government allocation layer. Its central idea is a transparent two-axis view:

- **Prosperity potential:** the likely additional local economic and social value from well-managed tourism.
- **Pressure/capacity risk:** the likelihood that additional demand will exceed accommodation, service, environmental or resident-cost capacity.

Every state or pilot destination is placed into an action quadrant:

| Quadrant | Interpretation | Recommended government action |
|---|---|---|
| High prosperity / low pressure | Can absorb measured growth | Targeted promotion, SME onboarding, route and product development |
| High prosperity / high pressure | Valuable but fragile or constrained | Capacity-first funding, timed demand, dispersal, monitoring and safeguards |
| Low prosperity / low pressure | Under-realised opportunity | Diagnose access/product gaps, then test small campaigns |
| Low prosperity / high pressure | Poor value and high risk | Reduce indiscriminate promotion, fix bottlenecks and protect residents |

This is deliberately different from ranking destinations by visitor count. A destination can be a high-priority investment location even with modest current arrivals, while a popular destination can be a high-priority management location rather than a promotion target.

## What the dashboard produces

### 1. National Destination Balance Map

The landing view is a Malaysia map at state level, with an optional pilot-area drill-down where finer data is available. Each location shows:

- Pressure score (0–100)
- Prosperity potential score (0–100)
- Confidence/data completeness badge
- Current action recommendation
- Trend arrow and forecast horizon

The map supports filters for tourism type, quarter/year, domestic versus inbound data, SDG priority, state, and policy intervention.

### 2. Destination profile and evidence chain

Clicking a state opens an evidence page with:

- Visitor, tourist, trip, receipt and average-length-of-stay trends
- Accommodation occupancy by location and star category where available
- Tourism employment and relevant sector structure
- Tourism contribution to the state economy where available
- Population and per-capita normalisation
- State GDP and tourism-related economic sectors
- CPI and restaurant/accommodation price pressure
- A score decomposition showing exactly how each component contributed
- Source, release date, definition, missingness and refresh status for each metric

No score is shown without a “Why this score?” panel. The panel uses plain language, for example: “Pressure is elevated because visitor growth and accommodation occupancy rose together while restaurant/accommodation prices are above the national trend. This is an association, not proof that tourism caused the price change.”

### 3. Intervention simulator

The user chooses a scenario instead of receiving a black-box prediction:

- Shift a chosen share of peak demand to another destination or quarter.
- Increase accommodation or visitor-management capacity by an assumed amount.
- Fund local SME participation or community tourism.
- Run a dispersal campaign for a specified duration.
- Apply a sustainable tourism constraint, such as a maximum pressure score.

The simulator estimates changes to visitor demand, receipts, employment-linked value, pressure and cost signals. It shows a range and the assumptions used. It does not present an uncertain forecast as a fact.

### 4. Action portfolio and budget view

For a selected budget envelope, the dashboard proposes a portfolio of interventions. It ranks interventions by:

- Expected additional tourism value
- Pressure avoided or reduced
- Local inclusion signal
- Policy fit (NTP/SDG)
- Implementation readiness
- Confidence and data completeness

The user can lock policy constraints such as “do not increase pressure above 70” or “at least 30% of the portfolio must support lower-income or under-served areas,” then see the recommended allocation update.

### 5. Policy brief generator

An optional retrieval-augmented assistant creates a one-page memo from the currently filtered data. It must cite the exact dataset and time period, include a chart, state uncertainty and list recommended next steps. It cannot invent a statistic or silently combine incompatible definitions.

## DOSM-first data plan

The competition brief requires authentic public data and gives additional value to official Malaysian data. The minimum viable product should use DOSM data as the analytical backbone.

### Core datasets and releases

| Data need | DOSM source to use | How it is used |
|---|---|---|
| Domestic visitors, trips, receipts, purpose, expenditure, ALOS | [Domestic Tourism Survey 2025](https://www.dosm.gov.my/portal-main/release-content/domestic-tourism-survey-2025) and its state/quarter tables | Demand, economic value, seasonality and dispersal |
| Quarterly domestic demand | [Domestic Tourism Survey Q1 2026](https://www.dosm.gov.my/portal-main/release-content/malaysias-domestic-tourism-survey-q12026) and quarterly archive | Latest trend and short-horizon forecast |
| National tourism value and employment | [Tourism Satellite Account 2024](https://www.dosm.gov.my/portal-main/release-content/tourism-satellite-account-2024) | GDP contribution, expenditure composition and employment context |
| Accommodation occupancy | DOSM Quarterly Survey of Services releases, including [Q4 2025 location bulletin](https://storage.dosm.gov.my/tourism/tourism_domestic_2025-q4_en.pdf) and [Q4 2025 star-rating bulletin](https://www.dosm.gov.my/uploads/release-content/file_20260317105913.pdf) | Capacity/pressure signal and accommodation readiness |
| State tourism detail | [Regional Tourism Satellite Account Sabah 2024](https://v2.dosm.gov.my/portal-main/release-content/regional-tourism-satellite-account-sabah-2024) | A richer pilot case for Sabah, including tourism value, expenditure and employment |
| State economic structure | OpenDOSM [Data Catalogue](https://open.dosm.gov.my/data-catalogue?source=DOSM), including Annual Real GDP by State & Economic Sector | Economic benefit normalisation and sector exposure |
| Population denominators | OpenDOSM population tables, available through the [Data Catalogue](https://open.dosm.gov.my/data-catalogue) | Visitors/receipts per resident and resident exposure |
| Resident cost pressure | OpenDOSM [Monthly CPI Inflation by State & Division](https://open.dosm.gov.my/data-catalogue/cpi_state_inflation) and annual CPI | Monitor accommodation, restaurant, food and transport price signals |
| Additional government open data | data.gov.my and other clearly attributed public sources | Roads, public facilities, waste, protected areas or weather, subject to data-quality checks |

### Data engineering rules

1. Create a data dictionary before modelling. Every metric has a definition, unit, geography, time basis and source URL.
2. Keep domestic visitors, domestic tourists, excursionists, trips and receipts separate. They must not be added together as if they were the same unit.
3. Use per-capita or per-resident values when comparing states with very different population sizes.
4. Store release version and retrieval date, because DOSM releases can be revised or refreshed.
5. Use the latest released data available for the competition submission, but retain a reproducible snapshot for judging.
6. Mark estimates and imputed values. If a state lacks a metric, show lower confidence rather than silently filling it.
7. Use external data only for a clearly identified gap. DOSM remains the source for the core tourism and socioeconomic indicators.

### Optional enrichment data

These data are useful for a fuller pilot but should not be required to demonstrate the core value:

- Local authority solid-waste collection or landfill capacity
- Flood/heat/rainfall and protected-area information from authoritative government sources
- Road incidents, public transport or ferry/airport capacity
- Licensed accommodation and tourism-product registries
- Anonymised, aggregated public feedback or complaint categories

No personal location data, individual travel histories or unconsented private data should be used.

## Scoring and modelling approach

### Pressure score

The initial score is an interpretable index, recalculated by period and location. Example components:

- Visitor growth relative to the location’s historical trend
- Peak-to-average demand concentration
- Accommodation occupancy and change
- Visitors or tourist nights per resident
- Accommodation/restaurant/transport price pressure
- Optional service or environmental capacity indicators

All components are scaled with a documented robust normalisation. Weights are visible and editable in an “Analyst settings” view. The public-facing score should show both the default score and a sensitivity range when weights change.

### Prosperity potential score

Example components:

- Tourism receipts and receipts growth
- Tourism receipts per resident
- Tourism employment share and growth
- State GDP sector opportunity
- Domestic spending mix that can be captured by local food, culture, accommodation and services
- Local participation/readiness indicator where a verified dataset exists

The score measures opportunity for managed value, not the worth of a community or culture.

### Forecasting

Use a small, defensible model first:

- Seasonal naive and ETS baselines
- Gradient-boosted regression or LightGBM for state/quarter demand with lagged DOSM features
- Quantile forecasts to display a prediction interval

The dashboard must compare the model with a baseline and report backtesting error. A more complex SOTA model is only justified if it improves out-of-time accuracy and remains explainable.

### Intervention simulation

Use a constrained scenario model rather than claiming causal effects from observational data. The simulator applies transparent elasticities estimated from historical changes or provided as policy assumptions. Where enough repeated observations exist, use panel regression with state and time effects as a sensitivity analysis. Label these outputs as scenario estimates.

### Portfolio optimisation

For the budget page, formulate a constrained optimisation problem:

```text
maximise: expected local value + inclusion benefit - pressure cost - implementation cost
subject to: budget, maximum destination pressure, minimum inclusion allocation,
            data confidence threshold and policy constraints
```

The result is a ranked recommendation, not an automatic government decision. Every selected action links back to data, assumptions and a responsible agency.

## AI and API integration

AI is useful in three bounded places:

1. **Natural-language policy exploration:** a user asks, “Which states can absorb a 10% low-season promotion?” The system translates the question into a filtered query and shows the assumptions before returning the result.
2. **Evidence-grounded policy memo:** an LLM retrieves only approved DOSM tables, metadata and policy documents, then produces a cited explanation. Retrieval chunks should contain dataset name, geography, period and units.
3. **Anomaly and narrative detection:** a time-series model flags unusual demand, occupancy or price movement; an LLM drafts a possible explanation only as a hypothesis and links the underlying series.

Recommended architecture:

- Local Python pipeline for cleaning, feature creation, scoring and forecasting.
- DuckDB or PostgreSQL for a reproducible analytical store.
- Streamlit, Plotly/Dash or a Power BI/Tableau front end for the competition dashboard.
- Optional open-weight model such as Qwen or Llama served locally, or an approved hosted API, for the assistant.
- Retrieval layer containing DOSM metadata, releases and the National Tourism Policy.
- No direct model access to arbitrary web pages during a judge demo.

The model must refuse or qualify questions that ask for personal data, unsupported district-level conclusions or causal claims not established by the data.

## UX design

### Design principles

- **Decision first:** the first screen shows “what action is suggested and why,” not a wall of charts.
- **Progressive disclosure:** summary → destination profile → evidence → assumptions.
- **Bilingual-ready:** Malay and English labels, with Malay as the default if the intended government audience prefers it.
- **Accessible:** colour is never the only encoding; use icons, labels, keyboard-friendly controls and readable contrast.
- **Trust visible:** show source, update date, data completeness, forecast interval and caveat beside the number.
- **No false precision:** use bands such as low/medium/high where exact values would imply unwarranted certainty.

### Key screens

1. **Command centre:** map, quadrant, top action candidates and current national indicators.
2. **State profile:** trend charts, score decomposition, destination constraints and evidence.
3. **What-if lab:** intervention controls, scenario comparison and trade-off chart.
4. **Budget portfolio:** intervention cards, budget slider, constraints and exportable recommendation.
5. **Methodology and data:** data dictionary, refresh log, model validation and limitations.

### Example user journey

An MOTAC officer selects “School holiday / Q4” and “protect pressure below 70.” The dashboard identifies destinations with high prosperity potential and low forecast pressure, suggests a demand-shift portfolio, shows projected receipts and employment-linked value, and highlights the capacity investments required in higher-pressure destinations. The officer exports a one-page brief with the data sources and assumptions.

## Demonstration story for judges

The pitch should demonstrate a government decision in five minutes:

1. Start with the official DOSM finding: tourism and domestic demand are growing strongly.
2. Show why “more visitors everywhere” is an inadequate policy objective.
3. Select a peak-period scenario and show the pressure/prosperity map.
4. Compare two interventions: indiscriminate promotion versus targeted dispersal plus capacity support.
5. Open the evidence chain and show that every headline number is from DOSM or an attributed public source.
6. Change one constraint and show the portfolio update.
7. End with an implementation action, owner, monitoring metric and expected review date.

The key visual is the transition from a visitor-count map to an intervention portfolio. That makes business value obvious without relying on an impressive but opaque model.

## Business and government value

### Immediate value

- Helps MOTAC and states prioritise scarce promotion, grant and infrastructure budgets.
- Prevents high-demand locations from being promoted without a capacity check.
- Provides a common language for national, state and local tourism planning.
- Identifies places where a small intervention can produce more inclusive local value than another broad campaign.
- Makes DOSM data more actionable while preserving statistical definitions and provenance.

### Measures of success

The pilot should define measurable outcomes:

- Forecast error for visitors and receipts against a baseline
- Reduction in peak pressure or improved seasonal distribution
- Change in tourism receipts per resident
- Change in tourism employment-linked value
- Share of recommended portfolio benefiting under-served destinations or local SMEs
- Percentage of dashboard metrics with complete provenance
- Time taken by an officer to produce a decision brief

### Implementation path

**Phase 1 — Competition MVP:** state-level Malaysia view using DOSM 2024–2026 releases, pressure/prosperity scores, baseline forecast, what-if simulator and source-aware memo.

**Phase 2 — Pilot:** work with one state and a small set of destinations where local capacity data is available. Sabah is a strong candidate because DOSM has a Regional Tourism Satellite Account with tourism value, expenditure, employment and socioeconomic indicators. [RTSA Sabah 2024](https://v2.dosm.gov.my/portal-main/release-content/regional-tourism-satellite-account-sabah-2024)

**Phase 3 — Operational integration:** add local authority capacity feeds, establish a governance owner, refresh quarterly, and evaluate whether recommendations improve outcomes.

## Risks, limitations and safeguards

- **State-level data is not a site-level carrying-capacity measure.** The MVP must say this clearly and use “state screening” rather than pretending to know a beach’s exact safe visitor limit.
- **Correlation is not causation.** Price or occupancy movement may have multiple causes; the dashboard must call scenario outputs estimates.
- **Survey and release revisions matter.** Preserve snapshots and show publication dates.
- **A composite score can hide value judgments.** Publish weights, sensitivity tests and allow an analyst to inspect components.
- **Promotion can shift pressure instead of reducing it.** The simulator must show destination-to-destination spillover and require a capacity check.
- **Communities should not be reduced to a score.** Add community consultation and local qualitative evidence before a real intervention.
- **AI can hallucinate or overstate confidence.** Use retrieval-only answers, citations, refusal rules and a visible “human review required” state.
- **No personal or sensitive data.** Use aggregated public statistics and follow the competition’s ethical-data requirements.

## Why this should score well

### Relevance to the brief

- Directly addresses sustainable tourism through economic, social, environmental and governance dimensions.
- Uses DOSM’s official tourism, socioeconomic, population, GDP, CPI and accommodation data.
- Produces a working interactive dashboard and a practical policy output.

### Technical substance

- Forecasting with out-of-time validation and a baseline
- Transparent composite indices with sensitivity analysis
- Constrained scenario and portfolio optimisation
- Retrieval-augmented AI with source citations and refusal rules
- Reproducible data dictionary and provenance layer

### Novelty

The product’s novelty is the decision layer that balances additional tourism value against destination pressure and explicitly allocates interventions. It is not another arrival leaderboard, tourist chatbot or generic sentiment dashboard.

### Practicality

The state-level MVP can be built from already published DOSM data. A pilot can add finer operational data later, so the competition prototype remains credible even where site-level capacity data is not yet public.

## Recommended final positioning

> **Malaysia does not need a dashboard that tells it where tourists already are. It needs a dashboard that tells government where the next ringgit of tourism can create the most local value without creating the next capacity problem. Destinasi Seimbang turns DOSM statistics into that decision.**

## Research sources checked

- [DOSM Datathon 2026 Briefing Slides](DOSM%20Datathon%202026%20Briefing%20Slides.pdf) — local competition requirements, theme, dashboard/report/video formats and judging structure.
- [OpenDOSM](https://open.dosm.gov.my/) — official open-data catalogue and public statistics platform.
- [DOSM Tourism Satellite Account 2024](https://www.dosm.gov.my/portal-main/release-content/tourism-satellite-account-2024).
- [DOSM Domestic Tourism Survey 2025](https://www.dosm.gov.my/portal-main/release-content/domestic-tourism-survey-2025).
- [DOSM Domestic Tourism Survey Q1 2026](https://www.dosm.gov.my/portal-main/release-content/malaysias-domestic-tourism-survey-q12026).
- [DOSM Domestic Tourism Survey States 2024](https://www.dosm.gov.my/portal-main/release-content/domestic-tourism-survey-states-2024).
- [DOSM Q4 2025 accommodation occupancy by location](https://storage.dosm.gov.my/tourism/tourism_domestic_2025-q4_en.pdf).
- [DOSM Q4 2025 accommodation occupancy by star rating](https://www.dosm.gov.my/uploads/release-content/file_20260317105913.pdf).
- [DOSM Regional Tourism Satellite Account Sabah 2024](https://v2.dosm.gov.my/portal-main/release-content/regional-tourism-satellite-account-sabah-2024).
- [OpenDOSM state CPI dataset](https://open.dosm.gov.my/data-catalogue/cpi_state_inflation).
- [MOTAC National Tourism Policy FAQ](https://www.motac.gov.my/en/frequently-asked-questions-faqs/).
- [MOTAC Sustainable Tourism](https://lestari.motac.gov.my/mengenai).

*Research cutoff: 11 September 2026. The data plan should be refreshed immediately before submission, especially because DOSM’s archive indicates new quarterly tourism releases are scheduled during 2026.*
