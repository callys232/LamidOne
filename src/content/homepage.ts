import { yearsOfOperation } from "./brand";

/**
 * THE HOMEPAGE, as approved in the design mock.
 *
 * Every string here comes from that mock. Four places where it
 * disagreed with something already true in this codebase are marked
 * ⚠️ CONFLICT below, with what I did and why — none of them were
 * resolved silently.
 */

export const HP_HERO = {
  /* The category line, above the headline. Swapped in from the brand
     document's own peel (content/aios.ts AIOS_HERO.eyebrow) — it names
     what this IS, which is the eyebrow's job. */
  peel: "The unified Human-AI Consulting & Growth Ecosystem",
  /* The three-beat tagline that used to sit up there. It is a rhythm,
     not a definition, so it reads better after the promise has been
     made than before it. Placed under the subhead, where it closes the
     block instead of introducing it. */
  signature: "Human Insight. AI Precision. One Ecosystem.",
  headlineLead: "The future of consulting",
  headlineTail: "and growth,",
  headlineEmphasis: "delivered as one.",
  /* The mock's line, kept — restored by the user's decision after a
     replacement was trialled here and rejected.

     "one signal" became "one ecosystem" here and in the two other
     places the page used it as a metaphor (HP_PROMISE "It's Clear",
     HP_WHY "Unified by Design"). That fixes the harder half of the
     problem on its own: "signal" was the load-bearing term of the whole
     page and was defined nowhere on it, whereas "ecosystem" is defined
     structurally two sections down — one ecosystem, four suites, each
     suite a set of tools.

     Left alone deliberately: "early-warning signals" in HP_ECOSYSTEM
     and "40+ signals" in the TALENT card. Those are signals in the
     ordinary sense, not the brand metaphor, and swapping them would be
     a find-and-replace rather than an edit.

     BUILT ON THE PAGE'S OWN SPINE. The homepage answers four questions
     in order — what it is, why it matters, how you use it, and what
     happens next — and the subhero now previews all four in one
     sentence, so a reader who goes no further still has the shape of
     the argument:

       what        one ecosystem for strategy, growth, people, finance
       why         instead of four systems that disagree
       how         run a diagnostic on figures you already have
       what next   and decide who acts on what it finds

     Each clause has a section under it: the ecosystem grid, the gap,
     the diagnostic, and AFTER_THE_ANSWER. Nothing is promised here that
     the page does not then evidence.

     It also fixes what the mock's line could not. "Diagnose, transform,
     and grow with real-time, intelligent precision" never said WHAT
     LAMID ONE IS — a reader arriving cold had "ecosystem" and "38+
     years of consulting leadership", both of which point at a
     consulting FIRM rather than at software you run. "Run a diagnostic
     on figures you already have" is the first thing on the page that
     could only be true of software. */
  subhero:
    "One ecosystem for strategy, growth, people and finance — instead of four systems that disagree. Run a diagnostic on figures you already have, then decide who acts on what it finds.",
  /* ⚠️ CONFLICT, and the most serious one on the page. This read "Book
     Your Enterprise Diagnostic" here and again in the closing band —
     the two highest-value clicks on the site — and both pointed at
     /diagnostics/q44.

     There is no Enterprise Diagnostic. The string appeared nowhere in
     this codebase except this file. Q44 is the Decision Clarity Score:
     five questions about a SINGLE decision, CORE only, three minutes.
     HP_HOW compounded it by describing "four questions, across Core,
     Grow, Talent, and Finance" — a cross-suite instrument that is not
     built, and an "overall readiness score" no engine computes.

     Naming what the link actually opens. Building the cross-suite
     diagnostic the mock sold is a product decision, not a copy fix. */
  primary: {
    label: "Run your first diagnostic — free",
    href: "/diagnostics/q44",
  },
  secondary: { label: "Explore the Ecosystem", href: "#ecosystem" },
  /* ⚠️ CONFLICT — the mock reads "30+ years of consulting leadership".
     LAMID Consulting was founded in 1988, which brand.ts computes to
     38. "30+" is not wrong, but it understates by eight years and it is
     a typed figure that goes stale; the computed one cannot. Using the
     computed value. */
  socialProof: `${yearsOfOperation()}+ years of consulting leadership · 4 unified suites · 1 ecosystem`,
};

/* HP_SAMPLE removed with the hero's diagnostic mock.
 *
 * It held an invented overall score of 82 and four invented suite
 * figures. They were labelled "Sample Diagnostic" and were defensible
 * on that basis, but they were the only fabricated numbers anywhere on
 * this site — every other figure carries `verified` or is computed.
 * Removing the panel removes the exception, which is the better place
 * for this codebase to be. */

/**
 * The three arrow cards.
 *
 * Each links to the section further down that DEMONSTRATES its claim,
 * rather than to a generic page. An arrow that promises somewhere and
 * lands nowhere in particular is worse than no arrow — so "It's Fast"
 * goes to the tools a reader can run in three minutes, not to a page
 * about speed.
 */
export const HP_PROMISE = [
  {
    title: "It's Clear",
    body: "All four suites run inside one ecosystem, so nothing sits stale between review cycles.",
    /* The ecosystem section defines the three levels and shows the four
       suites writing to one record — this card's claim, evidenced. */
    href: "#ecosystem",
  },
  {
    title: "It's Fast",
    body: "Real-time diagnostics mean decisions get made this week, not next quarter.",
    /* The runnable tools, with their times on them. Three minutes for
       the shortest is the proof of "this week, not next quarter". */
    href: "#diagnose",
  },
  {
    title: "It's Unified",
    body: "Strategy, growth, people, and finance in one ecosystem, not four disconnected tools.",
    /* The showcase, which walks the chain end to end: CORE finds it,
       GROW sequences it, TALENT staffs it, FINANCE prices it back to
       CORE. "Unified" evidenced as a loop rather than repeated. */
    href: "#showcase",
  },
];

/**
 * THE GAP.
 *
 * WHAT WAS WRONG WITH THE OLD VERSION. It named a problem — "most
 * enterprises are flying blind" — and then answered it with three
 * cards about us: 38+ years, 4 suites, 40+ signals. Credentials are not
 * evidence of someone else's blind spot, so the section set up a
 * tension and released it with a CV. One of the three also carried a
 * "not yet independently verified" label, which is the honest thing to
 * do with that figure and a bad thing to put in a row meant to build
 * confidence.
 *
 * The seven fragments were buried in a single run-on sentence, where
 * they read as a list to be skimmed. They are the actual content: each
 * is a specific failure a reader either recognises in their own
 * business or does not, and each has a suite that watches it. Promoting
 * them turns an assertion into a checklist, and turns "one system that
 * sees the whole enterprise" from a claim into something the reader can
 * count for themselves.
 *
 * The credentials were not lost — 38+ years is in the hero's social
 * proof line and again in HP_WHY, and "4 unified suites" is the section
 * immediately below this one.
 */
export const HP_GAP = {
  eyebrow: "The Gap",
  title: "Most enterprises are flying blind.",
  lead: "The same fragments show up everywhere — Africa, emerging markets, global enterprises alike.",
  /* `watchedBy` is the suite id, so the tint and the label both come
     from one place and cannot drift from the ecosystem section. */
  fragments: [
    { name: "Outdated processes", watchedBy: "core" },
    { name: "Weak structures", watchedBy: "core" },
    { name: "Slow growth", watchedBy: "grow" },
    { name: "Market access barriers", watchedBy: "grow" },
    { name: "Talent gaps", watchedBy: "talent" },
    { name: "Unpredictable scaling", watchedBy: "finance" },
    { name: "Blind financials", watchedBy: "finance" },
  ],
  /* Was "It's never been a lack of effort. It's been a lack of one
     system that sees the whole enterprise at once." The never-X-but-Y
     construction is a speech rhythm, not an argument, and it took two
     clauses to deliver one fact. */
  thesis:
    "The effort was never the problem. No single system could see the whole enterprise at once.",
};

export const HP_ECOSYSTEM = {
  eyebrow: "Ecosystem Overview",
  /* THE THREE LEVELS, stated in the heading rather than left to be
     inferred. CORE, GROW, TALENT and FINANCE are the four SUITES;
     engines are the TOOLS inside them — Q44, R01, F04, A22 — not a
     layer above. (`ENGINES` in aios.ts is a misleading name for the
     suite grouping; do not read the taxonomy off it.)
     The page previously named the ecosystem and the suites and never
     the tools, which left "ecosystem" and "suite" reading as two words
     for the same thing. */
  /* Split so the middle beat can carry the brand gradient — the four
     suites are what the section is about, and they sit between the
     level above them and the level below. Kept as one flat `title` too,
     for anywhere that needs it as plain text. */
  titleLead: "One ecosystem.",
  titleEmphasis: "Four suites.",
  titleTail: "Hundreds of tools.",
  title: "One ecosystem. Four suites. Hundreds of tools.",
  /* Each level defined by what it IS, in the order a reader meets them.
     This is the sentence the whole section exists to make true.

     Rewritten to be checkable rather than definitional. The first pass
     said "a suite is the part of the business it answers for", which
     defines nothing — it names a category without naming a member. The
     four domains are stated outright now, and the tool is described by
     what it DOES to your data rather than by where it sits in a
     hierarchy.

     THE TOOL IS THE DRIVER'S SEAT. Every other level is somewhere the
     data lives; this is the only one a person occupies. Naming it that
     way answers the question the three levels otherwise leave open —
     "where do I come into this" — and it is the answer that makes the
     hierarchy worth stating at all.

     AI IS NOT A FOURTH LEVEL. It sits under all three, in every input
     field, which is why it is one clause at the end rather than an item
     in the list. Given its own level it would read as a separate
     product to buy; described as a layer it reads as what it is —
     something present wherever you are typing. This also stops the page
     needing a separate "AI" section to explain a capability that has no
     separate place in the structure.

     NO RHETORICAL FLOURISHES. This opened "Three levels, and only
     three" — the "and only three" carried no information the "three"
     had not already carried, and that construction (X, and only X) is a
     writing tic rather than a fact. Same family as "none left over",
     "that is what closes the loop", "not a renewal conversation": all
     removed from this page. If a clause would survive being deleted
     with the meaning intact, it was decoration. */
  lead: "Four levels. The ecosystem is one continuous record of your business. The suite is the domain that reads and writes it — strategy, growth, people, money. A tool is the driver's seat, where you operate from: put your figures in, get a scored answer back with the working attached. AI runs underneath all four, embedded in every input field.",
  /* The section-level CTA. Points at /products — "All products and
     features", the complete directory — because that is the only page
     that substantiates the third level this heading claims. The four
     cards each link to their own suite, so a fifth link to a fifth
     suite page would be redundant; this one goes UP a level instead of
     sideways, which is the move a reader who has read the heading and
     wants the whole inventory is actually trying to make. */
  cta: { label: "See every tool in the ecosystem", href: "/products" },
  /* THE SUB-SUITES ARE FOLDED IN, NOT LISTED.
     DESK, SIGNAL, LEARN and MARKET are sub-suites — they carry the
     services the four main suites left out, and they are where a
     small-scale user is actually served. The homepage does not name
     them: nine product names on a page that has already said "four
     suites" is a menu, and a solo founder scanning for whether this
     fits them should not have to learn a second tier of vocabulary to
     find out.
     So each card takes a THIRD claim, carrying its sub-suite's service
     as a capability of the parent. Mapping is the one confirmed by the
     user: DESK→CORE, SIGNAL→FINANCE, LEARN→GROW, MARKET→TALENT.
     The third line is deliberately the one that names the small end.
     "Built for every scale" is asserted twice further down this page
     and evidenced nowhere; this is where it becomes checkable. */
  /* BULLETS, NOT SENTENCES. Every claim here was a full sentence with a
     qualifying clause after an em dash — twelve of them across four
     cards, which is a page of prose formatted as a list. Each is now a
     phrase a reader takes in without finishing a thought: six to nine
     words, no subordinate clause, no dash.
     What the qualifiers were doing is not lost. "Not last quarter",
     "not generic templates", "not a directory" were all arguing with an
     objection the reader has not raised yet; the suite pages behind
     "Explore" are where that argument belongs.
     The one-line definitions that sat above these are gone for the same
     reason — the card is a list now, and a paragraph at the top of a
     list is the longest thing on it. */
  suites: [
    {
      id: "core",
      name: "Core",
      tint: "#1A7CFF",
      href: "/suites/core",
      checks: [
        "Strategy aligned to what is happening now",
        "Early warning before drift hits the numbers",
        "Client and revenue operations in one place",
      ],
    },
    {
      id: "grow",
      name: "Grow",
      tint: "#1A7CFF",
      href: "/suites/grow",
      checks: [
        "Demand shifts and competitor moves, as they happen",
        "Built for African and emerging markets",
        "Certification pathways that build capability",
      ],
    },
    {
      id: "talent",
      name: "Talent",
      tint: "#1A7CFF",
      href: "/suites/talent",
      checks: [
        "Matched on 40+ signals",
        "Measurably fewer mismatched hires",
        "A vetted expert marketplace, ranked to your brief",
      ],
    },
    {
      id: "finance",
      name: "Finance",
      tint: "#1A7CFF",
      href: "/suites/finance",
      checks: [
        "Real-time visibility across every unit",
        "CFO-grade forecasting and value tracking",
        "Market visibility beside the numbers",
      ],
    },
  ],
  /* Cut from 75 words to 28. It was written for a full-width dark band
     under the grid, where a long line still scans; in the prose column
     beside the cards it ran to nine lines and buried its own point.

     Two things survived the cut, because each is doing work nothing
     else on the page does. The LOOP is the only argument for why four
     suites in one ecosystem beats four good tools — and it is stated as
     a CONSEQUENCE now ("nothing has to be entered twice") rather than
     as mechanism, because the mechanism was already the last clause of
     `lead` above and saying it twice in two adjacent paragraphs was the
     weakest thing about this section. And the SMALL END, because "built
     for every scale" is claimed twice further down and this is the only
     place it is made concrete.

     "One version of the truth per division" is lifted deliberately from
     the enterprise card in HP_WHY — the same objection named in the
     same words in both places, so a reader who meets it twice hears one
     argument rather than two similar ones.

     The scale sentence names what EACH end gets. It read "a solo
     founder gets the same record an enterprise does — with fewer rows
     in it", which described the DATA rather than the value, and left a
     solo founder to work out for themselves why a smaller table was
     good news. The two groups do not want the same thing from the same
     record: the small end wants rigour it could not otherwise buy, and
     the large end wants its units to stop disagreeing. Both are things
     the one record actually provides.

     Dropped: the roll-call of the four values (clarity, transformation,
     capability, foresight). Each card now opens with its own
     definition, so naming all four again here restated the grid in
     prose immediately beside the grid. */
  callout:
    "Nothing has to be entered twice. What one diagnostic establishes is already context for the next — which is how a solo founder gets reasoning a board would check without paying for a retainer, and an enterprise stops keeping one version of the truth per division.",
};

export const HP_SHOWCASE = {
  eyebrow: "See Each Suite in Motion",
  /* Split so the second sentence can carry the accent. Kept as one
     `title` too, for anywhere that needs it as flat text. */
  titleLead: "One ecosystem.",
  titleEmphasis: "Four ways in.",
  title: "One ecosystem. Four ways in.",
  /* WHAT WAS WRONG. All four titles were "X connects to everything." —
     the page's central claim, asserted four times in the same
     construction and demonstrated zero times. Four interchangeable
     hubs is not an ecosystem; it is a diagram with no arrows, and a
     reader who has read one slide has read all four.

     WHAT THEY SAY NOW. The chain, in the order the work actually
     happens: CORE finds it, GROW sequences it against capacity, TALENT
     staffs the sequence, FINANCE prices all three and feeds the number
     back to CORE. That is a LOOP, which is the thing the section has
     been trying to say — and each slide now names what it receives and
     what it hands on, so the connection is legible from any one of
     them rather than only from all four.

     Every hand-off is one the platform genuinely makes: GROW sequencing
     a diagnosis against real capacity is AFTER_THE_ANSWER route 4 and
     the G03 engine; TALENT scoring people against a brief is
     lib/matching.ts and A22; FINANCE costing it is F02. Nothing here
     describes a flow that is not built. */
  /* Each slide carries its own CTA. The section is a reader's closest
     look at an individual suite, and until now the only way out of it
     was to scroll back up to the ecosystem grid — a reader convinced by
     the TALENT slide had to leave the argument to act on it.

     `cta.label` names the suite rather than saying "learn more", so
     four slides do not present four identical links, and so the link
     still says where it goes when it is read on its own by a screen
     reader running through the page's links. */
  slides: [
    {
      id: "core",
      tint: "#1A7CFF",
      wash: "#E8EEFB",
      title: "CORE finds it.",
      body: "Diagnostics and coherence checks establish the baseline — what is actually true about the business right now. The other three suites measure against it, and re-runs come back as comparisons rather than fresh starts.",
      cta: { label: "Explore CORE", href: "/suites/core" },
    },
    {
      id: "grow",
      tint: "#1A7CFF",
      wash: "#E8EEFB",
      title: "GROW sequences it.",
      body: "Takes what CORE found and orders it against the capacity you actually have — which options you can resource, in what order, and what gets deferred and why. The certification pathways that build the capability sit in the same suite.",
      cta: { label: "Explore GROW", href: "/suites/grow" },
    },
    /* "MARKET scores outside specialists" named a sub-suite the
       homepage deliberately does not name — the capability is TALENT's
       here, as it is on the ecosystem card. */
    {
      id: "talent",
      tint: "#1A7CFF",
      wash: "#E8EEFB",
      title: "TALENT staffs it.",
      body: "The pathway GROW sequenced needs people. Capability scores say who you already have, and the expert marketplace scores outside specialists against the brief on discipline, rating, reliability and verification.",
      cta: { label: "Explore TALENT", href: "/suites/talent" },
    },
    {
      id: "finance",
      tint: "#1A7CFF",
      wash: "#E8EEFB",
      title: "FINANCE prices it.",
      body: "Costs the sequence, models the scenarios, and tracks what it does to enterprise value — then writes the result back to the same record CORE reads from.",
      cta: { label: "Explore FINANCE", href: "/suites/finance" },
    },
  ],
};

export const HP_HOW = {
  eyebrow: "How It Works",
  title: "From first question to quarterly track record.",
  /* ⚠️ CONFLICT — see the note on HP_HERO.primary. Steps 1 and 2
     described the Enterprise Diagnostic ("four questions, across Core,
     Grow, Talent, and Finance") and an "overall readiness score". No
     engine computes either. Both now describe the diagnostic the CTA
     beside them actually opens: Q44, five questions, three minutes.

     Steps 4 and 5 were vague where the platform is specific — "get
     matched to the right suite recommendations" is a sentence about
     nothing in particular. Four is now the four routes in
     AFTER_THE_ANSWER, and five is the re-run comparison, which is the
     one thing here a consulting engagement structurally cannot do. */
  /* TWO PHASES, because five equally weighted steps understate both
     halves of what this section is claiming.

     Steps 1–3 all happen in ONE SITTING — a reader who sees five
     numbered steps assumes an onboarding project, when the first result
     is minutes away. Steps 4–5 are what RECURS, and lumping them in
     with the setup hides the only structural difference between this
     and a consulting engagement: it does not end.

     The `meta` on each phase is a fact rather than a duration. "About
     ten minutes" for phase one would be a guess — the three-minute
     figure belongs to the diagnostic and already sits in step 1's body,
     and account creation is not something to put a stopwatch on. */
  phases: [
    {
      id: "first",
      label: "In one sitting",
      meta: "No account needed to start",
    },
    { id: "ongoing", label: "From then on", meta: "Every quarter" },
  ],
  /* `phase` is the id above, so the grouping lives on the step and the
     order of the list stays the only thing that sets the sequence —
     add a step, give it a phase, and the rail regroups itself. */
  steps: [
    {
      n: "1",
      phase: "first",
      label: "Diagnose",
      body: "Run a diagnostic on figures you already have. The shortest is five questions about a single decision, and takes three minutes.",
    },
    {
      n: "2",
      phase: "first",
      label: "Reveal",
      body: "The engine scores it and names the weakest link. No language model writes the number, and the working comes back with the result.",
    },
    {
      n: "3",
      phase: "first",
      label: "Unlock",
      body: "Create a free account to open the full breakdown. A new account is granted exactly enough points for your first run.",
    },
    {
      n: "4",
      phase: "ongoing",
      label: "Act",
      body: "Take it from there yourself, hand it to a vetted specialist, or put a delivery manager on it.",
    },
    {
      n: "5",
      phase: "ongoing",
      label: "Grow",
      body: "Re-run it once you have changed something. The next result comes back as a comparison, because the reasoning stayed on your record.",
    },
  ],
};

export const HP_WHY = {
  eyebrow: "Why LAMID ONE",
  title: "Built for every scale — including the one-person business.",
  /* SEGMENTED, because the heading claims a range and one set of cards
     cannot speak across it. "Built for every scale — including the
     one-person business" was answered by three cards pitched at nobody
     in particular: a solo founder read "every business unit" and left,
     an enterprise buyer read "one-person business" and did the same.

     The THREE ARGUMENTS stay constant across all three segments —
     unified, human + AI, scale — because they are what is true of the
     product regardless of who is reading. Only the evidence changes.
     That is also why each segment reuses the same three artworks: the
     drawings illustrate the argument, not the audience, and redrawing
     them per segment would say the product is three products.

     Order is ascending by size, matching HP_CASE_SEGMENTS above. Solo
     leads deliberately — it is the claim the heading makes and the one
     a visitor is least likely to believe, so it is the one that has to
     be defended first.

     Every arrow is a CTA that substantiates its own card. The scale
     card in each segment goes to that segment's page in /solutions,
     which is cut by organisation size, so the claim is checkable in
     one click. */
  segments: [
    {
      id: "solo",
      label: "Solo & starter",
      cards: [
        {
          art: "unified",
          title: "Unified by Design",
          body: "One person, four disciplines. Strategy, growth, people and finance in one ecosystem, on one subscription.",
          href: "/products",
        },
        {
          art: "partnership",
          title: "Human Insight + AI Precision",
          body: `${yearsOfOperation()}+ years of consulting method, computed — reasoning a board would check, without a retainer you cannot justify at your size.`,
          href: "/agents",
        },
        {
          art: "scale",
          title: "Built for Every Scale",
          body: "Start with one diagnostic and one client record. Nothing to configure first, and nothing you outgrow later.",
          href: "/solutions/small-business",
        },
      ],
    },
    {
      id: "sme",
      label: "SME",
      cards: [
        {
          art: "unified",
          title: "Unified by Design",
          body: "Your teams stop reconciling four systems. One record every function reads from and writes back to.",
          href: "/products",
        },
        {
          art: "partnership",
          title: "Human Insight + AI Precision",
          body: `${yearsOfOperation()}+ years of consulting expertise, running continuously instead of arriving quarterly in a deck.`,
          href: "/agents",
        },
        {
          art: "scale",
          title: "Built for Every Scale",
          body: "Add sites, units and headcount without re-platforming. The view widens; the system underneath does not change.",
          href: "/solutions/mid-market",
        },
      ],
    },
    {
      id: "enterprise",
      label: "Enterprise",
      cards: [
        {
          art: "unified",
          title: "Unified by Design",
          body: "Every business unit on one record — an end to one version of the truth per division.",
          href: "/products",
        },
        {
          art: "partnership",
          title: "Human Insight + AI Precision",
          body: "Governance, audit trail and quantitative rigour a board will check — computed and evidenced, not asserted in a slide.",
          href: "/agents",
        },
        {
          art: "scale",
          title: "Built for Every Scale",
          body: "Multi-site, multi-entity, governments and NGOs. The scope changes; the operating model does not.",
          href: "/solutions/enterprise",
        },
      ],
    },
  ],
  footline: "Built in Africa. Built to operate anywhere.",
};

/**
 * THE FAQ, and the two ways out of it.
 *
 * The questions themselves are HOME_FAQ in content/home.ts — eight
 * already written in the searcher's voice and sequenced generic →
 * branded → competitive. They were orphaned by the homepage rebuild
 * (the old page rendered them; the new one did not), so this section is
 * a rehoming rather than new copy.
 *
 * TWO DESTINATIONS, because a reader who has read this far has one of
 * two unanswered questions and they are not the same question:
 *   · "how would this actually work in my situation" → the playbooks,
 *     which are the method behind each suite
 *   · "you did not answer mine"                      → the full FAQ
 *
 * Sending both to one page would make one of the two groups hunt.
 */
export const HP_FAQ = {
  eyebrow: "Questions",
  title: "The ones we get asked most.",
  primary: { label: "Read the playbooks", href: "/playbooks" },
  secondary: { label: "See all questions", href: "/faqs" },
};

export const HP_CTA = {
  title: "Ready to see where you stand?",
  /* "Takes two minutes" against a three-minute diagnostic. A minute is
     nothing; being caught rounding it down on the last line of the page
     is not. The figure is stated once here and lives in
     freeTools.ts — if Q44's `minutes` changes, this is the string to
     change with it. */
  body: "Five questions, three minutes. No commitment, and your first run is free.",
  cta: { label: "Run your first diagnostic — free", href: "/diagnostics/q44" },
};

/**
 * CASE STUDIES — deliberately empty.
 *
 * ⚠️ CONFLICT, and the one I would not ship as written. The mock's
 * case-study section is entirely placeholder: "[Name]", "[Title]",
 * "[Company — placeholder]", "[X]% Faster time to decision", "[X]
 * Business units on one signal", and three "[Client photo
 * placeholder]" panels. The mock says so itself, in its own footnote:
 * "All names, companies, photos, and figures above are placeholders —
 * replace with real, consent-verified case studies before launch."
 *
 * Publishing invented customer outcomes would contradict the rule the
 * rest of this codebase is built on — every countable figure carries
 * `verified`, and CASE_STUDIES has shipped empty since the beginning
 * for exactly this reason. So the tabbed structure is built and ready,
 * and it renders nothing until a real, consented study exists.
 *
 * Add one and the section appears. The segments are kept because they
 * are the useful part of the design: proof filed by business size,
 * which is what makes "built for every scale" checkable.
 */
export type CaseSegment = "solo" | "sme" | "enterprise";

export const HP_CASE_SEGMENTS: { id: CaseSegment; label: string }[] = [
  { id: "solo", label: "One-Person Business" },
  { id: "sme", label: "SME" },
  { id: "enterprise", label: "Enterprise" },
];

export const HP_CASE_STUDIES: {
  segment: CaseSegment;
  quote: string;
  name: string;
  role: string;
  stats: { value: string; label: string }[];
}[] = [];
