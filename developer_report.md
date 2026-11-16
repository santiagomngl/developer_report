# Innovation Funding Desk - Developer Report

## Glossary

| Term | Meaning |
| --- | --- |
| FO (funding opportunity) | A call, or a module or topic of a call, that can be assessed on its own. |
| Funding call | A call that gives money that is not repaid and has a dated round. |
| FO record | The JSON file for one FO, written by the agent. |
| FO report | The agent’s account of a call’s conditions and requirements. |
| Call type | Type 1, 2, 3 or Not relevant; with its categories, how a call relates to TenneT. |
| TRAO | Topic, Role, Activity, Outcome: the four taxonomy dimensions. |
| Taxonomy code | A stable code, such as T1 or R2, for one taxonomy value. |
| Source | A funding body’s site the workflow watches, one file each: a gateway or a programme. |
| Project file | A TenneT project used as a guide when judging fit; together, the innovation profile. |
| Identification note | Discovery’s output for one candidate: eight identifying fields. |
| Date helper, gate | Code in `AGENT.md` that sets the ISO dates and checks each saved FO record. |
| Publish step | The website reading the data folders when it builds. |

## 1. AI architecture

### 1.1 The agent

The agent, SARA (Search, Assessment and Report Agent), is one file of instructions, `AGENT.md`. It works through four tasks in order: Known Calls, Discovery, No Duplicate, and Assessment and report. Its central output is a decision: every call receives one `call type`, with one or more categories, as defined in `resources/call_types.json`.

| Call type | Definition | Categories |
| --- | --- | --- |
| Type 1 | TenneT can receive money from the call: as lead, as a funded partner or as a funded buyer. | C1.1 Lead of an infrastructure project; C1.2 Lead of an innovation project; C1.3 Funded consortium partner; C1.4 Funded innovation buyer |
| Type 2 | TenneT can take part without receiving money, for example as an unfunded partner, a co-funder, a test-site or data provider, an end user or a peer of other grid operators. | C2.1 Research-led; C2.2 Manufacturer-led or startup-led; C2.3 Peer-led (TSOs, DSOs, ENTSO-E); C2.4 Supporting role |
| Type 3 | TenneT cannot take part, but the call touches its field and the funded work would plausibly benefit it through others. | C3.1 Supply-chain capacity; C3.2 Products TenneT would buy; C3.3 Flexibility and demand; C3.4 Enabling technologies; C3.5 Knowledge; C3.6 Skills; C3.7 Environment, permitting and public support |
| Not relevant | The call does not touch TenneT’s field. | None |

For each Type 1, 2 or 3 call, the agent then reads the call in depth and writes the report a colleague reads on the website.

### 1.2 Reports by call type

Type 1 and Type 2 calls receive the same full report of conditions and requirements; the line between them does not matter for what the report must cover. Type 3 calls receive a brief, description-style report, so that a colleague can pass the call on to suppliers, startups or universities. Not relevant calls receive no report and are never shown to people.

### 1.3 Order of a run

#### 1.3.1 Scheduler

Each source has its own check interval, set in its source file; in the prototype, runs are scheduled tasks in a chat assistant.

#### 1.3.2 Start of a run

The scheduler gives the chatbot `AGENT.md` plus one source name, for example “Follow the instructions in `AGENT.md` for the source: CETPartnership”. That is the whole start signal. The agent works through its tasks in order and writes each task’s output in full before it starts the next. Inside a task, it may search and reason as much as it needs, but the outputs are short: the known-calls list; one identification note per candidate; one line per candidate saying new or duplicate, with a one-sentence reason; and, in Assessment and report, a finding per step, with the reasoning before the label it leads to.

#### 1.3.3 Tasks of a run

One run covers one funding source and ends with one FO record per new call in `data/fo_records/` and one FO report per new Type 1, 2 or 3 call in `data/fo_reports/`. A call that turns out to be unreadable, or not a funding call after all, gets neither.

**Known Calls.** The source name names one file in `resources/sources/`. Before searching, a short script lists the FO records whose `source` field holds that name, so a weekly run does not redo last week’s work.

**Discovery.** The agent opens the funder’s website at the starting URL in the source file and follows the navigation instructions written there: which listing to open, which filters to set, how to page through results. Priority projects are searched for first (Section 3.9). Only open or forthcoming funding calls become candidates, and a call counts as a funding call only if it gives money that is not repaid (no loans, guarantees, equity or tax credits) and has a dated round. Each candidate gets an identification note of eight fields, including its FO ID. Discovery stops after one call or one group of related calls, at most three per run; the rest are found in later runs.

**No Duplicate.** Funders republish calls, translate titles and list the same call on several pages. The agent compares each candidate with every FO record, from this source and from all others, on five fields judged together: organisation or parent framework, programme, call title, call module title and call year. A new year or a different module is a different opportunity. With Known Calls, this makes two checks: one before the search and another after.

**Assessment and report.** For each new call, the agent reads the call documents, decides how the call matters to TenneT (1.3.4) and saves a filled-in copy of `templates/fo_record.template.json` as `data/fo_records/<FO ID>.json`. Not relevant calls get a record too. For a Type 1, 2 or 3 call, it then writes the report (1.3.5) before moving to the next call.

However the run ends, the agent closes by recording the scan time in the source file and correcting its starting URL or navigation if the site has changed. It changes nothing else.

#### 1.3.4 Assessment

Assessment reads enough of the call to judge it, not every condition: the scope, activities and expected results, who may apply and from which countries, how TenneT could take part, and the consortium rules. The full detail is left for the report. The agent then names the project files that are close to the call, with what each shares with it and how it differs. The project files and the taxonomy guide the judgement; they are not hard tests.

It then gives the call one type with one or more categories. The agent always decides; there is no “ask a person” outcome. A call in TenneT’s field whose participation route is unclear becomes Type 3, and one where TenneT can take part but funding is unclear becomes Type 2. The tool covers TenneT Netherlands only.

Last, it assigns Topic, Role, Activity and Outcome codes from the taxonomy (T1, R1, A2, O3 and so on) and stores them in `taxonomy_values`. The website matches a colleague’s project against these codes, so the agent keeps only codes the call itself supports; a Type 3 call has no Role codes. The `status_rationale`, about four sentences naming the documents and sections relied on, explains why the call got its type.

Two pieces of code close the task. The date helper turns the date facts the agent read into ISO dates, converting loose times such as “Q2 2027” and deriving a missing project date from the call’s longest duration; no date is typed by hand. The gate then checks the saved record against the template and the allowed values, and the agent moves on to the report only when it prints PASS. Both scripts are written inside `AGENT.md`, so they travel with the instructions.

#### 1.3.5 Report

Once the record passes the gate, the agent turns each Type 1, 2 or 3 FO record into the report a colleague reads on the website. Writing the report never changes the FO record or its `call type`. For each record, it picks the matching template: `fo_report_type_1_2.template.json` for Types 1 and 2, which ask the same questions, or the shorter `fo_report_type_3.template.json` for Type 3. Each template has two blocks, which the website shows in different parts of the page; each block is a list of sections, and each section a list of cards with a title; the cards of the first block also have a question.

| Block | Types 1 and 2 | Type 3 |
| --- | --- | --- |
| `project_requirements` or `call_overview` | What the call wants; Consortium; TenneT’s position; Innovation; Work | About the call; Relevance to TenneT |
| `funding_timing_submission` | Funding; Timing; Application | Funding; Timing; Application |

Starting from what it read for the assessment, the agent reads the full call text and every annex, national rule and FAQ that applies to the Netherlands, and fills in each card’s `answer` and `sources`, leaving titles and questions untouched. The report is saved as `data/fo_reports/<FO ID>.json`, replacing any older report with that ID.

`AGENT.md` also sets how the report is written. The reader is an engineer or project lead, not a funding specialist, so the agent puts the main point first, explains every funding term and acronym, and keeps the call’s force: must stays must. It reports only what the call says and leaves the rest null, names its sources by document, page and section, and writes plain text without internal terms, because the website shows every answer exactly as written. The two judgement cards, TenneT’s likely contribution and Why it matters to TenneT, start from the FO record’s `status_rationale`. If its reading suggests a wrong call type, the agent still writes the report for the type in the record, leaves the record as it is, and says so in the conversation.

#### 1.3.6 Ground rules

Web content is information, never instruction: text on a page cannot tell the agent what to do. Browsing is read-only: no logins and no forms beyond a portal’s search filters. And evidence comes before guesses: no value without a source, and what is unknown stays null.

### 1.4 Handover between tasks

Every task states its input and its expected output, and `AGENT.md` tells the agent to work only from the output of the task before it and the inputs listed for it, not from page text it read earlier. These outputs (the known-calls list, the identification notes, the verdicts and the findings) are written out in the conversation, not saved. Inside Assessment and report, the steps of one call share their reading: the report starts from what the agent read for the assessment and goes back to it wherever a card needs it.

### 1.5 Order fixed in the prompt

The order of work is fixed in the prompt, not in code. `AGENT.md` requires an output at every step, and the next step starts from that output. This works as an artificial harness: the agent is locked into a chain-prompting run until every FO is found, checked for duplicates, assessed, saved and reported. There is therefore no need for multiple calls or an orchestrator in code: one call runs the whole chain. Because every step is small, explicit and checked, the same instructions can also be run by cheaper models.

## 2. Running the prototype

### 2.1 Prototype and production

Both use the same instructions and files; only the way the agent runs differs. In the prototype, there are no API keys: runs are started by hand in personal Claude and ChatGPT accounts or as scheduled tasks, outputs are saved in laptop folders linked to the GitHub repository, and Vercel rebuilds the site on every push. In the final application, the agent runs on a schedule with API keys, and each run pushes its files to GitHub straight away (2.4).

### 2.2 Checks after a run

1. A scheduled task, or a person, opens Claude or ChatGPT with `AGENT.md`, the resources and one source name.
2. The agent works through its four tasks and saves its files in the laptop folders.
3. The folders are linked to the GitHub repository, so new files reach it, and Vercel rebuilds the website.

After a run, a person reads the findings the agent wrote in the conversation and spot-checks a few call types and Not relevant verdicts against the call text.

### 2.3 Trial runs

The first trial, on 6 November 2026, ran on all 11 modules of the CETPartnership Joint Call 2026: 3 were kept (CM2026-01, -02 and -08) and 8 dropped, under the statuses used at the time. The built-in page fetch read only about 64 of the 101 pages of the call text, so long documents are now read part by part.

A second trial, on 15 November 2026, ran the current instructions on the EU Funding & Tenders Portal and RVO sources. Each produced one FO record and one FO report: a Horizon Europe storage-retrofit topic as Type 1 (Section 3.7) and RVO’s BMKB-Groen as Type 3. BMKB-Groen is a credit guarantee, which the funding-call test should have excluded, so it belongs in the test set as a known miss. The duplicate path against existing records, the priority searches, and Type 2 and Not relevant verdicts are not yet tested in a live run.

### 2.4 Production

Production keeps the same `AGENT.md`. A scheduled job, for example a GitHub Actions workflow on a timer, starts the agent with an API key kept as a secret, never written in the repository. The job works on a copy of the repository, so the agent writes straight into `data/fo_records/`, `data/fo_reports/` and `resources/sources/`. A sketch, not working code:

```
# scheduled job; the API key comes from the repository's secrets
for source in sources_due("resources/sources/"):
    run_agent("AGENT.md", source.source_name)      # writes data/fo_records/ and data/fo_reports/
commit_and_push("data/", "resources/sources/")     # Vercel deploys the push
```

## 3. Data contract

### 3.1 Folders and who writes them

The folders are organised by who writes them, so that every folder has one party to answer for it.

The admin writes the instructions and the fixed reference files: `AGENT.md`, which holds every rule; `templates/`, which holds the blank `fo_record`, source and project forms plus the two report templates; and, in `resources/`, `tennet_taxonomy.json` (the Topic, Role, Activity and Outcome codes, labels and definitions) and `call_types.json` (Types 1 to 3, Not relevant and their categories).

Team members write `resources/sources/`, one file per funding source, and `resources/projects/`, one file per TenneT project. The agent may update a source file’s scan time and broken navigation, and nothing else.

The agent writes the data: `data/fo_records/`, one file per funding opportunity, never changing or deleting an existing record, and `data/fo_reports/`, one report per kept call. A PDF the agent had to download goes in `pdfs/`, a working folder outside the data contract.

```
AGENT.md
templates/   fo_record, source, project, fo_report_type_1_2, fo_report_type_3 (.template.json)
resources/   sources/, projects/, tennet_taxonomy.json, call_types.json
data/        fo_records/, fo_reports/
pdfs/
```

### 3.2 One file per item

Every funding opportunity, source and project is its own JSON file, following one template per kind. An FO record’s ID is also its file name: the creation time to the second plus a counter (20261115-125155-01), so two FOs made in the same second still differ. This shows each change per item in git, lets the AI open one small file instead of a large table, and ensures that two runs never edit the same file.

### 3.3 How the files point to each other

An FO record’s `source` field holds the source’s `source_name`. Sources are identified by `source_name` and projects by `project_name`; neither has an ID field, and each file is named after its name in lowercase with underscores. Taxonomy values are stored as codes (T1, R2, A7, O9) that point into `tennet_taxonomy.json`, and screens show the labels. The `call_type` and `category_codes` fields point into `call_types.json`.

### 3.4 Blank templates, rules in the instructions

The `*.template.json` files are clean blank forms: null for single values and \[\] for lists, with no placeholders, types, units or allowed values. Every rule lives only in `AGENT.md`. There is one place to change a rule, the form stays readable for people, and no two copies of a rule drift apart. The trade-off is that outputs need a check afterwards: the gate does this for FO records, `check-data` also checks reports against their templates, and a check for source and project files is still to build.

### 3.5 Formats for code

The agent reads free text, but code must read every field without guessing. Dates are therefore ISO dates (“start of February 2027” becomes 2027-02-01), so code can sort and compare them. Project sizes are plain digits (5000000, not “EUR 5m”), so the website can filter by budget. Taxonomy values are codes (T4, not its label), so labels can be reworded without breaking records. Missing information is always null, never N/A or Unknown, so there is one test for “not known”. And an FO ID never changes, so other files and history keep pointing to it.

### 3.6 FO record lifecycle

An FO record is created in Assessment, seen again in later runs through Known Calls and No Duplicate, and will be closed by a code step, still to build, when its deadlines pass. It is never deleted. Not relevant records stay too, only so the agent does not investigate the same call again; they are never shown to people.

### 3.7 Worked example

The record below was made in a trial run on 15 November 2026 from the EU Funding & Tenders Portal source; the longer text fields are shortened.

```json
{
  "id": "20261115-125155-01",
  "source": "EU Funding & Tenders Portal calls for proposals",
  "display_title": "HORIZON-CL5-2027-07-D3-27 Integrated Approaches for Retrofitting Infrastructures with Innovative Energy Storage Technologies – Horizon Europe",
  "organization_or_parent_framework": "European Commission",
  "programme": "Horizon Europe",
  "call_title": "ENERGY (HORIZON-CL5-2027-07)",
  "call_module_title": "HORIZON-CL5-2027-07-D3-27 Integrated Approaches for […]",
  "call_year": 2027,
  "url": "https://ec.europa.eu/info/funding-tenders/[…]/HORIZON-CL5-2027-07-D3-27",
  "executive_summary": "Horizon Europe innovation action for demonstrating […]",
  "pre_submission_deadline": null,
  "full_proposal_deadline": "2027-12-01",
  "earliest_project_start_date": null,
  "project_end_date": null,
  "minimum_project_size": null,
  "maximum_project_size": null,
  "date_last_checked": "2026-11-15",
  "status_rationale": "[…] Type 1 and C1.3 describe TenneT participating as a funded consortium partner.",
  "call_type": "Type 1",
  "category_codes": ["C1.3"],
  "taxonomy_values": {
    "topic": ["T5", "T8", "T9"],
    "role": ["R2", "R5"],
    "activity": ["A4", "A7", "A8"],
    "outcome": ["O2", "O5", "O6", "O9", "O10"]
  }
}
```

On the website, this record becomes one card: Horizon Europe as programme, the display title, and 1 December 2027 as submission deadline, ranked by its taxonomy codes. It also shows the null convention at work. The topic gives an indicative grant rather than a limit, and no project dates, so the sizes and project dates stay null rather than being guessed.

### 3.8 Source files

Each funding source has one file, built from `source.template.json`, in two parts. The scheduler reads `scheduling_setting`: `enabled_disabled` ("enabled" or "disabled"), `monitoring_interval` (whole days, for example 7), `first_run_on` (an ISO date) and `last_completed_scan_at` (an ISO date and time, null until the first complete run). The agent reads `parameters_passed_to_the_agent`.

The `portal_type` is gateway or programme, following the September 2026 funding-sources memo. A gateway, such as RVO or the EU Funding & Tenders Portal, collects opportunities from many programmes; a programme source, such as CETPartnership or the I3 Instrument, covers one. Because a programme’s calls can also appear on a gateway, the duplicate check treats the same call reached through two sources as one FO, and a gateway’s scope can leave out a programme that has its own file, as the Funding & Tenders file does for I3. The memo suggests testing both routes to see which finds relevant calls more efficiently without missing any.

The other agent fields always hold the same kind of information. The `starting_url` is where the search begins. The `search_scope` says which opportunities count: what one FO is, which identifier is its call reference, which programmes to cover and what to skip. The `navigation_instructions` are numbered steps in a fixed order: the reading tool (sources that load results with JavaScript, such as the Funding & Tenders Portal and RVO, need a browser), the filters and paging, what each detail page holds, which document is authoritative, and how to spot changes. The `link_scope` says which domains the agent may and may not follow, and the `completion_rules` say when a run is finished and what to report if the search limit is reached first.

### 3.9 Project files

Each project file describes a real TenneT project: its name, a short description and its taxonomy codes. Teams maintain these files so that the AI learns how the taxonomy values feed different projects; the agent only reads them. Together, the 34 project files form the TenneT innovation profile, against which Assessment compares every call.

A source file tells the agent where to search, but not what to look for, so without guidance it finds calls in roughly the order the portal lists them. To let teams steer the search, each project file has a `priority` field ("high" or "none") and an optional expiry date, `priority_until`. High-priority projects get a second role in Discovery: the agent first runs searches built from their description and codes, within the source’s scope, and falls back to the general search only when these find nothing new. Priority affects only which calls are found first, never how they are assessed. The flag is set by people, the innovation team or a project team through them, and its expiry date ends it automatically, so a forgotten flag cannot keep steering the search.

## 4. Maintenance

### 4.1 Why JSON

JSON gives every item one short form, with the same fields every time, readable as plain text. People and the AI read the same file, so there is nothing to translate. Compared with Excel, there are no merged cells, hidden columns or formatting for the AI to trip over; compared with a database, there is no hosting or access rights to arrange for the pilot.

Later, code will read these folders and show each one in the user interface as a spreadsheet-like table, where each file is a row and each field is a column that people can view and edit. Because every file follows its schema, the folders work like a simple document database. If the tool grows, they can be moved into a hosted document database, such as MongoDB running on Azure, with little rework, since each JSON file maps directly to one stored document.

For the FO workflow, we keep the JSON templates blank: field names and structure only, with every rule and allowed value in the agent’s .md instructions. This follows what developers using the OpenAI and Anthropic APIs do: instructions and definitions go in the prompt, and the output format only fixes the structure. A 2026 study (“Your Prompt Is Not the Only Prompt”, Lin) supports it. Putting label definitions in the output format didn’t consistently beat putting them in the prompt, and when the two conflicted, accuracy dropped by 5 to 45 points, so writing the rules in one place is safer. Because we run the agent manually in chat rather than through the API, we can’t force the output to match a schema. So each record is checked after it’s written.

### 4.2 Who maintains what

The AI creates FO records and reports; people create and edit source and project files; an admin owns the taxonomy, call types, templates and instructions. The maintainers are not developers but product owners, procurement specialists and asset managers. Which role owns which folder, and how often they check it, is still open.

### 4.3 Editing

Today, a maintainer copies a blank template, fills it in and saves it in its folder. The plan is for code to show each folder as a spreadsheet-like table, where editing a cell writes the file.

### 4.4 Editing rules

Fields come from the template: never add or rename a field by hand. Sources and projects are identified by their name, so renaming one breaks the FO records that point to it; rename only together with a fix-up of those records. A check that catches empty or wrong fields in source and project files is still to build.

### 4.5 Adding a funding source

1. Copy `source.template.json`.
2. Fill in the source name, the scheduling settings and the agent fields (Section 3.8).
3. Open the starting URL with a plain page fetch. If the call list shows, a fetch is enough; if not, note in the first navigation step that a browser is needed.
4. Save it in `resources/sources/`.
5. The scheduler picks it up at the next due date.

The current `eu_funding_tenders_portal.json` is a good model for navigation instructions.

### 4.6 Changing the instructions and the data

`AGENT.md` should carry a version line and a version history, raised with every change; it has none yet. A field rule changed in `AGENT.md` must also be changed in its gate. A taxonomy code never changes and is never reused, although its label may be reworded; the current taxonomy already leaves retired codes such as R4 and A1 unused. Adding a field means three places: the template, the .md that says how to fill it, and the website if it shows it.

### 4.7 Quality checks

A person spot-checks some Not relevant verdicts each month, since a wrong Not relevant is the error nobody else will see. The test set is re-run after every change to `AGENT.md`.

## 5. Website

### 5.1 Questionnaire and results

The website is a static site on Vercel, built with ChatGPT Sites (React and TypeScript), with no server, login or API keys. Answers stay in the browser and reset on reload.

A landing page leads to six questions, one per screen, with Back, Continue and Start over. Questions 1 to 4 are Topic, Role, Activity and Outcome: multi-select, at least one value each, with Select all and Clear. Each option shows its definition on hover, and a help panel shows how a real TenneT project, InterOPERA, answered. Question 5 is the project’s total budget, a range slider from EUR 10,000 to EUR 1 billion with quick ranges. Question 6 is timing: a start range by quarter, and an optional end range.

The results page shows the answers in a collapsible summary, then one card per call: match percentage (green from 50%), programme, title, project size, possible funding, project window and submission window. Clicking a card opens its detail view: the report’s two blocks (1.3.5), Apply, which opens the funder’s page, and Share, which copies the link. The options in Questions 1 to 4, with their definitions, are read from `tennet_taxonomy.json`.

### 5.2 Match score

Topic, Role, Activity and Outcome decide the score. For each dimension, the site takes the share of the colleague’s selected values that also appear in the call’s codes, then averages those shares:

```
score = (1 / |D|) × Σ over d in D of  |S_d ∩ F_d| / |S_d|
```

`S_d` is what the colleague selected in dimension d, `F_d` the call’s codes for it in `taxonomy_values`, and D the dimensions with at least one selection (in practice all four). A call whose codes cover every value in a dimension matches everything selected there. Calls with no matching value are hidden; ties go to the call with more matched values, then alphabetically. For the record in Section 3.7, a colleague who selects T5 and T7, R2, A7 and A8, and O9 and O10 matches 50%, 100%, 100% and 100%: a score of 87.5%.

### 5.3 Budget and timing filters

Budget and timing do not change the match score; they filter. Each gives a call one status: Fits (shown, with a note if the fit depends on part of the user’s range), Partly (the call can fund only part of the project; shown with a warning) or Hidden (the call cannot fund the project). If either status is Hidden, the call is hidden; if either is Partly, the card shows the warning. Users give ranges, so each call is judged by its best case, and a bound the FO record leaves null is not tested.

**Timing.** The user enters a start range, S1 to S2 (required), and an end range, E1 to E2 (optional). The FO record holds a project window from CS (earliest project start) to CE (latest project end).

Calls pay only for work done inside the project window. Work before the start isn’t funded, and a project that has already started may not be eligible at all. So a project that can only start before the call does is hidden. A project that starts in time but runs past the call’s end can still be funded up to the end date. So it’s shown with a warning, not hidden.

- Hidden if S2 < CS (every possible start is before the call starts) or S1 > CE (the project starts after the call’s window closes).
- Fits if S2 ≥ CS and E1 ≤ CE, with the note “Fits if you start in \[CS\] or later” if S1 < CS, and “Fits if you finish by \[CE\]” if E2 > CE.
- Partly in every other case: the start works, but every possible end is after CE. Warning: “Only work until \[CE\] is funded.”
- No end range given: only the start is checked. The FO is hidden if S2 < CS or S1 > CE. Otherwise it fits.

**Budget.** The user gives a total budget B1 to B2; the FO record holds a range CMin to CMax, or a single maximum P (“up to 60M” is 60M, not 0 to 60M). Where a call states only its maximum grant, the agent has already recorded the size as grant divided by funding rate.

- Hidden if B2 < CMin (or B2 < P): the project is too small to scale up to the call.
- Fits if B1 ≤ CMax and B2 ≥ CMin (or B1 ≤ P ≤ B2), with a note on the bound the project must stay within.
- Partly if B1 > CMax (or B1 > P): the call can fund part of the project, up to CMax or P.

### 5.4 Publish step

The site reads `data/fo_records/`, `data/fo_reports/`, `tennet_taxonomy.json` and `call_types.json` when it builds. This is the publish step. Every push to the public repository rebuilds the site; a file that is broken or incomplete is left out, and the build log and `npm run check-data` name it.
