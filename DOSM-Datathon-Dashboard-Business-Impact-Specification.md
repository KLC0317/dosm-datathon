# DOSM Datathon 2026 Dashboard: Business Impact and Value Specification

**Project:** LESTARI - Sustainable Tourism Policy Intelligence  
**Purpose:** Define everything the dashboard must contain to demonstrate credible business impact, public value, and decision usefulness.  
**Primary users:** Federal tourism planners, DOSM analysts, state tourism agencies, local authorities, programme evaluators, and competition judges.  
**Status:** Product and evidence specification. Values must not be treated as official until verified against their original sources.

---

## 1. Executive purpose

The dashboard should help a government tourism officer answer five questions:

1. **What is happening?**  
   How are tourism demand, expenditure, stays, local benefits, and destination pressures changing?
2. **Where does attention need to go?**  
   Which destinations require further investigation, safeguards, readiness investment, or selective growth?
3. **Why is the dashboard recommending that action?**  
   Which verified observations, transformations, models, assumptions, and limitations support the conclusion?
4. **What should government do next?**  
   What policy options are available, who owns the action, how much might it cost, and what must be reviewed first?
5. **Did the intervention create value?**  
   Did it improve visitor value, local prosperity, destination resilience, community outcomes, or environmental performance?

The product must behave as a **decision-support system**, not an automated decision maker. It must separate verified observations, derived indicators, predictions, scenarios, assumptions, and approved decisions.

---

## 2. Definition of business impact and public value

For this project, “business impact” should not mean only increasing visitor numbers. It should cover value created for government, destinations, tourism businesses, communities, and the environment.

| Value dimension | Intended value | Evidence that should be displayed |
|---|---|---|
| Economic value | More productive tourism spending and stronger local participation | Expenditure, expenditure per visitor, overnight stays, tourism employment, local business participation |
| Destination value | Better matching of demand with infrastructure and capacity | Peak concentration, accommodation use, transport/service readiness, destination pressure indicators |
| Community value | Benefits reaching residents and local workers | Employment, local income proxies, resident outcomes, inclusion measures where reliable data exists |
| Environmental value | Growth managed within measurable resource and ecosystem constraints | Waste, water, air, emissions, or marine indicators at an appropriate geography and period |
| Government value | Faster, more consistent, and auditable planning | Time saved, source traceability, review completion, decision turnaround, adoption by agencies |
| Risk reduction | Fewer unsupported, inconsistent, or poorly targeted interventions | Data-quality warnings, forecast errors, unresolved evidence gaps, approval status, monitoring alerts |

### 2.1 Core value statement

> Help Malaysian tourism planners direct attention and investment toward destinations where tourism can create greater local value, while identifying places that require safeguards or more evidence before growth is encouraged.

### 2.2 Claims the dashboard must not make without evidence

- A high score proves that a destination has exceeded its carrying capacity.
- A low visitor count means that a destination is ready for more promotion.
- Growth in expenditure automatically means local residents are better off.
- General inflation is caused by tourism.
- A national environmental indicator represents a specific state or destination.
- A demand forecast proves that a policy intervention will work.
- A scenario estimate is a causal impact estimate unless an appropriate evaluation method supports it.
- An AI-generated recommendation is approved government policy.

---

## 3. Required dashboard structure

The dashboard should contain six connected workspaces.

### 3.1 Planning briefing

**User question:** What needs attention before the next planning meeting?

Required components:

- National tourism snapshot with reference period and units.
- Latest quarterly or monthly pulse where comparable data exists.
- Three to five decision questions, not a wall of KPIs.
- Important changes with absolute values and percentage changes.
- Evidence-readiness status for every headline.
- Clear warnings for missing, stale, provisional, or geographically mismatched data.
- Direct route to the destination, forecast, source, and policy-option views.
- “What changed?” summary generated from deterministic rules or evidence-grounded AI.

The briefing should end with a short statement such as:

> Decision requiring review: determine whether selected destinations have sufficient capacity and local-value potential for additional off-peak promotion.

### 3.2 Destination review

**User question:** What is happening in this state or destination, and what should be investigated?

Required components:

- State or destination selector.
- Reference period and comparison group.
- Raw measures alongside any index score.
- Trend view, seasonal view, and latest-period comparison.
- Demand, capacity, local prosperity, community, and environmental sections.
- Explanation of why a destination received its score or category.
- Missing-data and comparability warnings.
- Suggested policy direction with evidence strength and limitations.
- Named responsible organisation or review role.
- Proposed outcome to monitor and review date.
- Comparison with at least one relevant peer or national benchmark.

No destination should be labelled “safe,” “high potential,” or “overloaded” solely from a composite score.

### 3.3 Forecast and early-warning view

**User question:** What might happen next, and how certain is the forecast?

Required components:

- Historical observations separated visually from predictions.
- Forecast horizon and reference dates.
- Prediction intervals, not only a point forecast.
- Seasonal or naive baseline.
- Selected model and competing candidates.
- MAE and RMSE with units.
- Time-ordered backtesting periods.
- Interval-coverage result if prediction intervals are shown.
- Important model drivers only when the explanation method is valid.
- Forecast limitations and known regime changes.
- Alert rules for unusual deviations from expected demand.
- Statement describing which government decision the forecast supports.

The forecast section must clearly state:

> A demand forecast estimates future demand. It does not estimate the causal effect of a policy intervention.

### 3.4 Policy-options workspace

**User question:** What choices are available, and what evidence would justify one option over another?

Every review must include:

1. Maintain current policy or do nothing new.
2. Demand-management option.
3. Capacity or destination-readiness option.
4. Local-business or community-benefit option.
5. A combined option where appropriate.

For each option, display:

- Decision objective.
- Target destination and population affected.
- Intervention description.
- Responsible organisation.
- Estimated budget or resource requirement.
- Implementation period.
- Evidence supporting the option.
- Evidence gaps.
- Expected output.
- Intended outcome.
- Risk and mitigation.
- Monitoring KPI and review date.
- Approval status.

Scenario controls may perform transparent arithmetic, but must not display predicted impacts unless a validated response model supports them.

### 3.5 Evidence and methodology

**User question:** Can I verify this result?

Required components:

- Complete source register.
- Direct source links where permitted.
- Dataset owner and official status.
- Publication and extraction dates.
- Geographic and time coverage.
- Unit and definition.
- Update frequency.
- Transformation steps.
- Missing-value treatment.
- Revision or provisional status.
- Formula definitions.
- Weight justification.
- Threshold justification.
- Sensitivity results.
- Known limitations.
- Data and model versions.
- Last successful refresh and failed-refresh warning.

### 3.6 Assurance and decision register

**User question:** What was reviewed, decided, and monitored?

Required components:

- Draft, reviewed, approved, rejected, and superseded statuses.
- Decision owner and reviewer.
- Date and time.
- Evidence version used.
- Model version used.
- Assumptions accepted.
- Risks and unresolved gaps.
- Approved action and budget.
- Monitoring period.
- Outcome review result.
- Reason for changing or withdrawing a decision.

For a datathon prototype, the register may be local and demonstrative. For operational deployment it must be persistent, permission-controlled, versioned, and auditable.

---

## 4. KPI framework

### 4.1 KPI presentation contract

Every KPI must show:

- Metric name.
- Value and unit.
- Current period.
- Comparison period.
- Absolute and percentage change where meaningful.
- Geography.
- Source reference.
- Last refresh date.
- Data-quality or provisional status.
- Definition tooltip or information panel.
- Whether the value is observed, derived, forecast, or assumed.

Missing values must display **Not available**, **Not collected**, or **Not comparable**. They must never be silently converted to zero.

### 4.2 Demand KPIs

| KPI | Purpose | Example calculation | Important caveat |
|---|---|---|---|
| Domestic visitors | Measure overall demand volume | Official visitor total | Clarify whether visits or unique people are counted |
| Tourists / overnight visitors | Distinguish overnight demand | Official tourist total | Define tourist consistently |
| Same-day visitors | Identify day-trip pressure and opportunity | Visitors minus tourists, if definitions allow | Do not derive across incompatible datasets |
| Visitor growth | Monitor change | `(current - previous) / previous × 100` | Show base value and period |
| Overnight share | Assess stay depth | `overnight visitors / total visitors × 100` | Not equal to expenditure capture |
| Average length of stay | Assess duration | Official nights or trips definition | Confirm denominator and unit |
| Seasonality concentration | Identify peak dependence | Peak-period share or a documented concentration index | Annual totals can conceal local peaks |
| Forecast deviation | Detect emerging changes | `(actual - forecast) / forecast × 100` | Use a validated forecast and interval |

### 4.3 Economic and local-value KPIs

| KPI | Purpose | Example calculation | Important caveat |
|---|---|---|---|
| Tourism expenditure | Measure direct visitor spending | Official expenditure total | Nominal values may need inflation context |
| Expenditure growth | Track economic change | Year-on-year percentage | Growth does not show distribution |
| Expenditure per visitor | Approximate value intensity | `expenditure / visitors` | Use compatible periods and definitions |
| Expenditure per visitor-night | Assess value relative to stay | `expenditure / visitor-nights` | Requires reliable nights data |
| Tourism employment | Measure jobs supported | Official sector employment measure | Avoid claiming causality from correlation |
| Local business participation | Monitor inclusion | Local participating firms / participating firms | Define “local” and programme population |
| Local procurement share | Measure local economic capture | Local procurement / tourism programme procurement | Requires administrative records |
| Programme cost per outcome | Assess efficiency | Programme cost / verified outcome units | Do not use projected outcomes as realised outcomes |

### 4.4 Capacity and destination-readiness KPIs

Potential measures include:

- Available accommodation and occupancy.
- Peak occupancy and booking concentration.
- Visitor-to-resident ratio.
- Visitors per square kilometre, where geographically meaningful.
- Transport accessibility and peak load.
- Public-facility readiness.
- Tourism enterprise density.
- Emergency and safety-service readiness.
- Digital connectivity.
- Accessibility for people with disabilities.

Visitor-to-resident ratios are screening measures. They do not establish a destination’s physical, social, or environmental capacity.

### 4.5 Social and community KPIs

Use only when reliable, appropriately aggregated data is available:

- Tourism-related employment.
- Wage or income proxy.
- Youth and community enterprise participation.
- Resident sentiment or satisfaction.
- Cultural-site condition or participation.
- Access to tourism benefits across groups and locations.
- Displacement or affordability indicators where a defensible dataset exists.

The dashboard should state when community outcomes are not measured rather than implying them from visitor or expenditure growth.

### 4.6 Environmental KPIs

Choose indicators that match the geographic unit and tourism claim:

- Waste generated or collected per visitor-night.
- Water use per visitor-night.
- Energy use or emissions proxy.
- Air-quality measures with location coverage.
- Beach, river, forest, or marine condition.
- Protected-area pressure.
- Environmental incidents or threshold breaches.

Display monitoring coverage. A national environmental series must not be used as evidence of a state-level tourism effect.

### 4.7 Government-delivery KPIs

These show whether the dashboard itself creates organisational value:

- Time from data release to dashboard refresh.
- Time from issue detection to review.
- Percentage of recommendations with a named owner.
- Percentage of decisions with complete evidence records.
- Percentage of approved actions with monitoring plans.
- Number of agencies or state teams using the system.
- User task-completion time.
- Data-quality issues detected before decision review.
- Forecast alerts reviewed and resolved.
- Percentage of recommendations later confirmed, revised, or withdrawn.

---

## 5. Composite indices and prioritisation

If pressure, prosperity, readiness, or priority indices are used, the dashboard must provide a complete scoring contract.

### 5.1 Required scoring documentation

- Decision purpose of the index.
- Included variables and exclusions.
- Raw units.
- Direction of each variable.
- Normalisation method.
- Treatment of outliers.
- Missing-data rules.
- Weights and their justification.
- Thresholds and their justification.
- Reference population and period.
- Sensitivity to alternative weights.
- Stability across time.
- Validation against an external outcome, if possible.
- Limitations and prohibited interpretations.

### 5.2 “Why this score?” panel

For every selected destination, show:

| Input | Raw value | Normalised value | Weight | Contribution | Source / period |
|---|---:|---:|---:|---:|---|
| Demand intensity | — | — | — | — | — |
| Growth momentum | — | — | — | — | — |
| Capacity signal | — | — | — | — | — |
| Local-value signal | — | — | — | — | — |
| Environmental signal | — | — | — | — | — |

Also display how the category changes under reasonable alternative weights. If the ranking is unstable, show **Sensitive to assumptions**.

---

## 6. AI and machine-learning features

AI should make the evidence easier to use, not hide weak evidence behind fluent text.

### 6.1 Evidence-grounded policy briefing

The assistant should answer planning questions using approved dashboard data and documents. Every response should have four sections:

1. **Evidence:** verified facts with source references.
2. **Interpretation:** what the facts may mean.
3. **Limitations:** what cannot be concluded.
4. **Next action:** the evidence or review required next.

Required controls:

- Claim-level citations.
- Source name, period, geography, and version.
- Refusal or abstention when evidence is missing.
- No invented data.
- Clear label when text is AI generated.
- Human review before a response enters a decision record.
- Retention of the question, answer, sources, and model version for approved uses.

### 6.2 Forecasting

The forecast feature should include:

- Clearly defined target variable.
- Appropriate geographic level.
- Training cutoff.
- Forecast horizon.
- Seasonal baseline.
- Candidate models.
- Time-series cross-validation or rolling holdouts.
- MAE and RMSE with units.
- Prediction-interval calibration.
- Error analysis by time and geography.
- Monitoring for data or performance drift.
- Documented retraining and withdrawal rules.

### 6.3 Anomaly and emerging-risk monitoring

Potential alerts:

- Demand outside the forecast interval.
- Sudden peak concentration.
- Unusual expenditure-per-visitor change.
- Data missing beyond its expected release date.
- Large revisions to an official series.
- Conflicting source values.
- Environmental indicator threshold breach.

Alerts must trigger investigation, not automatic policy action.

### 6.4 Recommendation support

Recommendations should be produced from an explicit rule or model and display:

- Objective being optimised.
- Eligible options.
- Constraints.
- Evidence used.
- Alternatives considered.
- Uncertainty.
- Expected outcome and its basis.
- Groups or destinations affected.
- Human reviewer.

### 6.5 Policy simulation

A credible scenario tool must define:

- Intervention lever and its real-world meaning.
- Baseline or maintain-current-policy option.
- Response assumption or estimated treatment effect.
- Time horizon.
- Cost.
- Capacity constraint.
- Uncertainty range.
- Sensitivity to important assumptions.
- Source of each parameter.
- Outcomes not modelled.

If these are unavailable, label the tool **allocation calculator** or **directional scenario**, not an impact simulator.

### 6.6 AI assurance

Before operational use, evaluate:

- Citation accuracy.
- Groundedness of factual claims.
- Unsupported-answer rate.
- Correct abstention rate.
- Numerical consistency.
- Performance in Bahasa Malaysia and English.
- Consistency across states and territories.
- Misleading recommendation risk.
- Prompt-injection and unapproved-source risk.
- Personal or confidential data exposure.
- Reviewer agreement and correction rate.

---

## 7. Source and data-governance requirements

### 7.1 Source register fields

Every dataset entry should include:

```text
Dataset ID
Dataset title
Owner / publisher
Official-data status
Source URL or catalogue identifier
Licence
Publication date
Extraction date and time
Reference period
Update frequency
Geographic coverage
Unit of measure
Definitions
Revision / provisional status
Transformation pipeline version
Data-quality checks
Known gaps and limitations
Contact or responsible role
```

### 7.2 Data-quality checks

- Required fields are present.
- Values have expected types and units.
- Dates and geographic codes are valid.
- Duplicates are detected.
- Totals reconcile where official totals exist.
- Changes outside expected bounds are flagged.
- Missingness is measured and displayed.
- Geographic and period joins are validated.
- Revisions do not silently overwrite previously approved evidence.
- Failed refreshes preserve the last verified release and show a warning.

### 7.3 Ethical and privacy controls

- Use open, publicly accessible, or properly authorised data.
- Do not expose personal or confidential information.
- Aggregate small groups where disclosure could occur.
- Document third-party libraries, models, and datasets.
- Keep licence and attribution details.
- Do not present fabricated, fictional, or simulated observations as real data.
- Clearly label synthetic test data used during development.

---

## 8. Decision and evaluation framework

### 8.1 Decision record

Every proposed intervention should record:

```text
Decision ID
Decision question
Destination and population
Baseline period
Options considered
Selected option
Reason for selection
Evidence references and versions
Model or rule version
Assumptions
Known limitations
Budget and resources
Responsible owner
Reviewer and approval status
Implementation dates
Monitoring KPIs
Outcome review date
Decision result
Reason for revision or withdrawal
```

### 8.2 Theory of change

Each intervention needs a short chain:

```text
Problem
  -> Government action
  -> Immediate output
  -> Visitor or industry response
  -> Local economic / social / environmental outcome
  -> Long-term public value
```

Example structure:

```text
High seasonal concentration
  -> Shift part of promotion to shoulder periods
  -> Off-peak campaigns and packages launched
  -> More visits occur outside the peak period
  -> Capacity is used more evenly and local businesses receive steadier demand
  -> Destination value grows with lower peak pressure
```

Every arrow is an assumption that should be supported or evaluated.

### 8.3 Measurement design

Before implementation, specify:

- Baseline period.
- Target population.
- Comparison destination or period where appropriate.
- Output and outcome KPIs.
- Data-collection frequency.
- Minimum review period.
- Expected direction of change.
- Uncertainty and external factors.
- Person responsible for evaluation.
- Decision rule for continuing, adapting, or stopping the action.

Avoid claiming causal impact from a simple before-and-after comparison when seasonality or other events could explain the change.

### 8.4 Value-for-money view

Where evidence permits, show:

- Total programme cost.
- Direct delivery cost.
- Cost per participating business.
- Cost per verified additional visitor-night.
- Cost per verified local outcome.
- Benefits and costs by destination or group.
- Non-monetary benefits and risks.
- Sensitivity to key assumptions.

Projected and realised value must be displayed separately.

---

## 9. User experience and communication requirements

### 9.1 Information hierarchy

Each page should follow this order:

1. Decision question.
2. Essential result.
3. Evidence strength and reference period.
4. Visual explanation.
5. Recommended next action.
6. Source and methodological detail.

### 9.2 Visual language

- Use a restrained government-appropriate design.
- Use accessible contrast and readable type sizes.
- Do not rely on colour alone.
- Use consistent colours for observed, forecast, scenario, warning, and missing data.
- Put units on axes and values.
- Include readable labels and legends.
- Avoid decorative charts that do not support a decision.
- Use maps only when geography matters and the underlying geometry is accurate.
- Show uncertainty as ranges or intervals.
- Mark provisional, modelled, and assumed values visibly.

### 9.3 Accessibility

- Keyboard-accessible navigation and controls.
- Visible focus states.
- Semantic headings and tables.
- Alternative descriptions for charts and maps.
- Touch targets suitable for mobile use.
- Responsive layout without clipped content.
- Plain language in English and, where feasible, Bahasa Malaysia.
- Definitions for statistical and modelling terms.

### 9.4 Empty, loading, and error states

The dashboard must handle:

- Data unavailable.
- Data not comparable.
- Data outside its expected refresh window.
- Partial source failure.
- Model unavailable.
- Forecast not validated.
- Scenario not calculated.
- No destination selected.
- Export failure.

Do not replace these states with fallback numbers that look official.

---

## 10. Technical and operational requirements

- The dashboard remains accessible throughout judging.
- Core views work without inaccessible external dependencies.
- Filters, links, exports, and interactions are tested.
- Official source links open correctly.
- Data and model versions are retained.
- A reproducible build or source file is supplied.
- A README explains setup and navigation.
- A static PDF captures the final dashboard layout.
- Clean or raw data files are supplied where permitted.
- The submission does not contain secrets or personal data.
- Failures are logged without exposing sensitive information.
- The last verified data release remains available if a refresh fails.
- Operational deployment would add authentication, role permissions, persistent audit storage, backups, and recovery procedures.

---

## 11. Recommended data model

### 11.1 Observation table

```text
metric_id
metric_name
value
unit
period_start
period_end
frequency
geography_code
geography_name
source_id
release_date
extraction_timestamp
revision_status
quality_status
```

### 11.2 Destination score table

```text
destination_id
reference_period
index_name
raw_input_values
normalised_input_values
weights
contributions
score
category
confidence_status
method_version
source_ids
limitations
```

### 11.3 Forecast table

```text
target_metric
geography_code
forecast_period
point_forecast
lower_interval
upper_interval
interval_level
model_version
training_cutoff
evaluation_version
generated_at
```

### 11.4 Decision table

Use the fields defined in Section 8.1 and link decisions to evidence and model versions rather than copying untraceable values.

---

## 12. Minimum viable product and advanced features

### 12.1 Required for a credible competition dashboard

- Planning briefing with verified headline indicators.
- Destination comparison using raw measures.
- Transparent screening method.
- “Why this score?” explanation.
- Forecast with baseline, holdout error, and uncertainty.
- Source register and methodology.
- At least one clear decision workflow.
- Policy options with maintain-current-policy baseline.
- Named outcome and monitoring plan.
- Explicit missing-data and limitation states.
- Working filters and navigation.
- PDF, source/dashboard file, supporting data where permitted, and README.

### 12.2 High-value advanced features

- Evidence-grounded bilingual AI briefing.
- Anomaly and revision monitoring.
- Weight-sensitivity explorer.
- State peer-group comparison.
- Persistent decision register.
- Cost and value-for-money analysis.
- Intervention evaluation view.
- User-role permissions and approval workflow.
- Data- and model-drift monitoring.

Advanced features should only be added after the core evidence and decision path are reliable.

---

## 13. Acceptance checklist

### Business usefulness

- [ ] A user can identify the decision the dashboard supports within 30 seconds.
- [ ] Every recommendation names an owner, evidence basis, and next action.
- [ ] The dashboard distinguishes outputs, outcomes, and long-term impact.
- [ ] Maintain-current-policy is included as an option.
- [ ] Projected value and realised value are separated.
- [ ] At least one intervention has a complete measurement plan.

### Evidence and trust

- [ ] Every headline has a source, period, geography, unit, and status.
- [ ] Observed, derived, forecast, scenario, and assumed values are visually distinct.
- [ ] Missing data is not shown as zero.
- [ ] Composite scores expose inputs, transformations, weights, and contributions.
- [ ] Thresholds and weights have documented rationales.
- [ ] Sensitivity and limitations are visible.
- [ ] Source and method versions are recorded.

### ML and AI

- [ ] The forecast beats or is honestly compared with a simple baseline.
- [ ] Evaluation uses time-ordered holdouts.
- [ ] Error metrics include units.
- [ ] Prediction intervals are explained and evaluated.
- [ ] AI answers cite approved evidence.
- [ ] The AI abstains when evidence is unavailable.
- [ ] AI-generated text requires human review before entering a decision record.
- [ ] Forecasting is not confused with causal policy impact.

### Sustainability and inclusion

- [ ] Economic outcomes go beyond visitor volume.
- [ ] Local community benefits are measured or explicitly marked unavailable.
- [ ] Environmental indicators match the claim’s geography and period.
- [ ] The dashboard does not infer sustainability from growth alone.
- [ ] Distributional impacts and affected groups are considered where data permits.

### Product quality

- [ ] Filters and navigation work.
- [ ] Empty, loading, and error states are clear.
- [ ] Charts have labels, units, legends, and accessible descriptions.
- [ ] The layout works on desktop and mobile.
- [ ] The dashboard has no inaccessible dependencies.
- [ ] Exports reflect the current selection and disclose versions.
- [ ] README and submission package are complete.

---

## 14. Suggested 10-minute demonstration flow

1. **Problem and value - 60 seconds**  
   Explain why visitor growth alone is an incomplete measure of sustainable tourism success.
2. **National briefing - 90 seconds**  
   Show verified demand and value indicators, evidence status, and the decision requiring review.
3. **Destination review - 2 minutes**  
   Select one destination and explain raw evidence, uncertainty, and why the score is only a screening signal.
4. **Forecast and AI - 2 minutes**  
   Show baseline comparison, uncertainty, and a cited AI response that states both evidence and limitations.
5. **Policy options - 2 minutes**  
   Compare maintain-current-policy with an intervention, costs, evidence gaps, and outcome measures.
6. **Assurance and impact - 90 seconds**  
   Show the source register, decision record, and how realised value would be evaluated.

End with:

> LESTARI does not automate policy. It helps officers make faster, more transparent, and more measurable tourism decisions using traceable evidence.

---

## 15. Project references

This specification was prepared using:

- `Datathon 2026 - Booklet Final.pdf`
- `DOSM Datathon 2026 Briefing Slides.pdf`
- The supplied `page.tsx` dashboard implementation
- The dashboard review and government-workspace design developed in this conversation

The competition materials require a comprehensive and functional interactive dashboard, accurate and interpretable visualisations, open and credible data, clear documentation, and an accessible submission package. Refer to the original competition documents for the authoritative wording and final submission rules.

