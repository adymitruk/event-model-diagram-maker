# Instructions: How to Construct an Event Modeling Diagram (EMD)

This document uses three-letter abbreviations to identify each component and concept. Each term is defined using only the terms listed above it, so the list can be read from top to bottom.

Event Modeling Diagrams (EMDs) describe information systems and processes using a clear, timeline-based approach built from vertical slices (SLCs). **Causal timeline:** columns run left to right in order of use; at any SLC you only know that column and the ones to its left — never future events, screens, or read models to the right. Arrows and `data-joins` must respect that (source slice earlier than destination). It is like a wire frame diagram but with more elements to track information flow and state behind the scenes. It is also specification by example: a slice may carry no given-when-thens (GWTs) or many, drawn below the lower band. The GWTs are represented on one or more vertical timelines. When GWTs share the same timeline, the previous COM's or RMO's (depending on the type of SLC) Given EVTs and Then EVTs are included as the next When's Given. Separate timelines in the same slice do not share that history. The implementation for a system described by an EMD will show the same behaviour as shown in the EMD. Learn the terms below, then follow the steps after them to construct an EMD. When the model is ready, draw it as a browser board named `<name>.emd.html`. The **HTML board** section below is the markup for that file: every slice type, card, screen control, and arrow corridor an `EMD.md` can ask for. CSS, arrow tiles, and fonts stay in `diagram/`. [`html-css.md`](html-css.md) is the stylesheet lookup (sticky rows, tile files, continuity measurements).

## Terms:
Basic terms, which need no other terms:
  - ROL: a role - a set of permissions, behaviors, and responsibilities typically assigned to a user within the system. Examples include "Customer", "Administrator", "Pharmacist", each defining the allowed actions and access to different features.
  - EVT: an event - this is a fact, decision and/or new information in the system. it's the only way that state is captured by the system. They are immutable so they cannot be edited, renamed or deleted. An EVT holds no redundant data; it is in third normal form (3NF): every property depends on the EVT's own key alone, so it refers to another entity by its id (e.g., customerId) and never copies that entity's properties (e.g., the customer's name).
  - SWL: swim lane - a horizontal row with a label on its left.

Terms built from the basic terms:
  - USR: a user - this is the instance of a ROL in the system. You can have more than one instance of a ROL. example 2 customers Jim and Bob.
  - COM: a command - an instruction to the system that results in a state change, recorded as an EVT. Like an EVT, a COM is in 3NF: it carries only the ids and the new facts it establishes, never a property that already depends on another entity's id (e.g., a topic's title when the COM already has topicId).
  - RMO: read model - a projection of state from existing EVTs to the left on the diagram (only EVTs in earlier SLCs — never from a slice to the right). All the EVTs an RMO projects must live in the same SWL, so it is known where the implementation of that RMO lives. An RMO joins the EVTs it projects by their shared ids, so it is where the properties of several entities are shown together (e.g., an invoice showing the customer's name next to the rental, joined by customerId). Unlike COM and EVT, an RMO is deliberately denormalized — the opposite of DRY — so one view can show everything the USR needs without looking up again.
  - SVC: a service - a physical or logical grouping of state, tracked by EVTs in a SWL.

Terms built from those:
  - SCR: a screen - a UI that a USR will interact with in order to view the data of an RMO or to issue a COM. A SCR shows what that person **sees and uses**: labels, titles, names, amounts, choices, messages. Do **not** put technical join keys on a SCR (`attendeeId`, `topicId`, `eventId`, opaque tokens, …) — those belong on COMs, EVTs, and RMOs for wiring. Exception: an identifier people actually use as themselves (an invoice number, order number, confirmation code they read or quote). When an RMO row supplies such an id to a SCR (e.g. `topicId` on Topic Ballot), treat it as **client-side hidden data** held with that screen: it is not drawn on the wire, and a later COM on that same SCR may take it (Cast Vote carries `topicId` from the row whose Vote was pressed). Session / query / hidden field is the same idea.
  - PRO: a processor - it's an automation instead of a USR doing something manually. It works from an RMO that lists its tasks, which has TODO in its name, and it issues COMs. A PRO is always expressed as two SLCs beside one another: an RMO slice in which it reads its TODO RMO, immediately followed by a COM slice in which it issues the COM for that task.
  - MAP: a mapping - a named dependency that shows which input properties one or more output properties come from, written as `MAP <name>: <inputs> → <outputs>` (e.g., `MAP Full Name: firstName, lastName → name`). A MAP sits on an arrow where data changes shape between two items. It can sit in two places: on COM → EVT (the COM carries the inputs and the EVT records the outputs), or on EVT → RMO (the EVTs carry the inputs and the RMO shows the outputs). A SCR or PRO never maps; it only passes data on to the COM as it is. A MAP shows one of three things: a new property appears from a combination of source properties (`MAP Rental Total: days, dailyRate → total`), new properties appear from a single source property that is split (`MAP Name Parts: name → firstName, lastName`), or a property is used to adjust another property, which keeps its name (`MAP Discounted Total: discount, total → total`). In every case the MAP is what accounts for the data on both sides: it is the source of each output property, which exists nowhere before the head of the arrow, and it is the destination of each input, which would otherwise look unused. A MAP shows only the data path, never the particular data and never the calculation or transformation: it names properties, not values. The example values are read from the items at either end of the arrow (the COM or EVTs at the tail, the EVT or RMO at the head), and how one becomes the other is left to the implementer, since an EMD holds no implementation. A MAP records nothing and holds no state; the same inputs always give the same outputs, and each output is traced back to its inputs.
  - ERR: an error - marks the failure of a COM. It is not an EVT, so it records nothing. It sits in the LBA of the SLC whose COM failed, in the SWL of the SVC that would have changed, and it sends control back to the SCR or PRO that issued the COM. It names the recorded facts the COM was checked against. A SLC holds an EVT or an ERR, never both.

Bands, which are made of SWLs:
  - UBA: upper band - one SWL per USR, labeled with that USR. The row holds the SCRs and PROs that USR sees, uses, or waits on.
  - MBA: middle band - a single SWL. Each position in that row houses either a COM or an RMO.
  - LBA: lower band - one SWL per SVC (at minimum one SWL), labeled with that SVC. The row holds the EVTs of that SVC.

Structures built from the bands:
  - SLC: slice - a column that spans all bands (the UBA, the MBA and the LBA) and is one step in a process. A SLC has one position in the MBA. That position may hold a COM (COM slice), an RMO (RMO slice), or nothing. A COM slice also has a PRO or SCR in the UBA and one item in the LBA: the EVT the COM recorded when it passed, or the ERR it failed with (an ERR is shown instead of an EVT; a SLC never holds both). An RMO slice has an optional PRO or SCR in the UBA and nothing in the LBA. A NAV slice has a SCR (or PRO) in the UBA and nothing in the MBA or LBA — navigation or showing an ERR message after a failed COM, with no command and no read model.
  - GWT: given-when-then - a specification example that describes the COM or the RMO of one SLC. A SLC may carry no GWTs or many. When a SLC carries GWTs, they are drawn below the LBA in that column on one or more vertical timelines, top to bottom. Each GWT is read from its timeline, not written as separate Given/When/Then labels. For a COM: zero or more EVTs sit above the COM (those are the Given); the COM is the When; the EVT immediately below the COM is the Then. For an RMO: the timeline starts with the RMO, then places each EVT the RMO projects with the RMO again after it — RMO, EVT, RMO, EVT, …, RMO — so the RMO is shown at the beginning, between every EVT, and as the last step; that shows how the projection changes as each EVT is received. Every RMO snapshot already shows the RMO's full structure (collection table headers, or single-object property names); an empty first card means empty bodies / blank values, not a bare title. When the RMO joins, intermediate cards show lookup state (id → properties) built from earlier EVTs, and a later EVT carries only the join id so the looked-up property has a visible source. The EVTs are the Given; each RMO card after an EVT is that EVT's Then; there is no COM and no When. GWTs on the same timeline build on one another: the previous COM's or RMO's Given EVTs and Then EVTs are included as the next When's Given (every EVT above that next COM). Separate timelines in the same slice do not share that history. Another COM of the same type may follow on the same timeline to start that next GWT. A failed COM may use an ERR as its Then instead of an EVT. The GWT does not restate the SCR, the PRO or a MAP.
  - WFL: workflow - a grouping of SLCs to outline a process that the system and USRs go through to accomplish a goal. Each SLC is one step in that process. An EMD may have 1 or more WFLs

The whole diagram:
  - EMD: event modeling diagram - a diagram of one or more WFLs, with their SLCs placed left to right in order of use across the UBA, the MBA and the LBA, and optional GWTs below the LBA on one or more vertical timelines per slice, so it reads as a timeline. Nothing in a later column is visible to an earlier one.

## Construction

The goal is an EMD that tells the story of a system as a timeline: who does what (UBA), which instructions and views the system offers (MBA), which facts get recorded as a result (LBA), and optional GWTs below the LBA — on one or more vertical timelines per slice — that specify the COM or RMO of a SLC. Read left to right only: each SLC may use facts and views from the current column and previous columns; it must not depend on anything that appears later. Work from the process outward. First identify the WFLs and break them into steps, then add the USRs and SVCs that give the diagram its SWLs, then add one SLC per step and fill each with the right items depending on whether it changes state (COM slice) or shows information (RMO slice). Then group the SLCs back into their WFLs so each process reads as one labeled run of columns. Finally connect the items with arrows, add GWTs where they help specify the COM or RMO, and review that nothing is missing: every COM ends in an EVT or ERR, every RMO traces back to earlier EVTs from a single SWL (never a later EVT), every property has a source and reaches a COM, SCR or PRO, and every SCR, PRO and EVT sits in the right SWL. When finished, implementers can build from the EMD and stakeholders can read it from left to right.

1. **Identify WFLs**
   - List out the main business workflows or user journeys to be represented in the system.
   - For each workflow, define key steps, actors (users, or systems which are PROs), and desired outcomes.
   - Each key step becomes a SLC. Organize workflows based on order of use and place their SLCs left to right in that order, so the diagram reads as a timeline.

2. **Add USRs**
   - these are the users that will be using the system. Add the ROL beside their name
   - Add one UBA SWL for each USR.

3. **Add SVCs**
   - Add one LBA SWL for each SVC. An EVT only ever sits in the LBA SWL of the SVC whose state it tracks.

4. **Add SLCs**
   - For each key step, add a SLC column that spans the UBA, the MBA, and the LBA, with a cell below the LBA for that SLC's GWTs (leave it empty when the SLC has none).
   - Decide whether the step changes state (a COM slice), only shows information (an RMO slice), or is navigation / an error screen with no COM or RMO (a NAV slice).

5. **Fill COM slices**
   - A state change is a COM slice: one item in each band.
   - UBA: place a SCR when a USR makes the change, or a PRO when an automation does. Put a SCR in the UBA SWL of the USR who uses it, and a PRO in the UBA SWL of the USR who waits on its result (see UBA).
   - MBA: place the COM.
   - LBA: place the EVT in the LBA SWL of the SVC whose state changed. Describe the EVT in past tense (e.g., "Prescription Created", "Medication Dispensed") so it clearly represents what happened and which part of the workflow it belongs to.
   - Keep the COM and its EVT in 3NF: record the facts the COM established, keyed by the id the COM generated or acted on, and refer to other entities by their id only (e.g., bikeId, customerId, topicId). Do not copy that entity's other properties onto the COM or EVT (e.g., a topic title when topicId is already there) — those already live on the entity's own earlier EVT. The RMO that needs their properties joins the EVTs by that id (see step 6). A COM also never carries a property that is already recorded on an EVT in the SWL it records in (e.g., the email address a receipt is sent to), since the system looks that up from the history by id. On the SCR, show the **human** values (title, name, kind, slot, …), not the technical ids the COM uses to join — unless that id is something people treat as a label (invoice number). Ids the RMO already projected for that screen stay as client-side hidden data and may feed the COM; mark only the visible fields the person fills or reads with `com-data` / `rmo-data`, and mark the **pressed** action button that issues the COM with `com-data`. When the person acts on an RMO view (Vote on Topic Ballot, Rent on Bike Catalog), the COM-slice SCR keeps the **same layout** as the RMO-slice SCR — same columns and rows — and shows which control was pressed rather than shrinking to a one-row stub.
   - When the EVT should record a value in a different shape than the COM carries it (e.g., an end date computed from a start date and a number of days), put a MAP on the arrow from the COM to the EVT. The COM carries the inputs; the EVT records the outputs. The MAP names the inputs and outputs only, not how one becomes the other.
   - A COM that fails is its own SLC, with the ERR in the LBA where its EVT would otherwise be (see ERR). The ERR is shown instead of an EVT. Control goes back to the SCR or PRO that issued the COM. The next SLC is often a NAV slice: the same SCR again, showing the ERR's message (for example under the field that failed), with no COM and no RMO. If the USR or PRO then tries again, that attempt is a later COM slice. The EMD records only what happened in the example: a SLC never shows both an EVT and an ERR, and never a failure that did not occur.

5b. **Fill NAV slices**
   - A NAV slice has a SCR (or PRO) in the UBA and nothing in the MBA or LBA. Use it when the step is only navigation or showing feedback — for example the screen after a failed COM, with the ERR message on the form and no new command or read model.
   - Also use a NAV slice when a later SCR first **reads** an earlier RMO (e.g. open Signup Form with the conference title from RMO Signup QR before the person fills the signup COM). Keep the **same screen layout** as the later COM SCR; put `rmo-data` only on the RMO-fed fields, and leave the other controls empty without `com-data`. Draw an **RMO → SCR** arrow between SLCs (upper connector band on the board). Later SCRs that show the same values again do so by session or query convention — do **not** draw another arrow back to the RMO.
   - Do not put a COM, RMO, EVT or ERR in a NAV slice. The ERR of the failed COM stays in that earlier COM slice's LBA; the NAV slice only shows its message on the SCR.
   - On the board, shafts match the NAV kind (see **NAV slice** HTML): wizard Next/Finish = SCR only; error feedback = shaft under SCR (+ pass-throughs below); title-view = `arrow-up` + shaft (+ pass-throughs below). Never leave pass-through shafts in a wizard NAV column.

6. **Fill RMO slices**
   - Add an RMO to the MBA when a SCR or PRO needs data from the system without changing it. Its data is projected only from EVTs in **earlier** SLCs (to the left). If a later COM records new EVTs that should appear on that view, either place another RMO slice **after** those EVTs, or let later SCRs carry the new values by session/query until a later RMO projects them — do not draw an arrow from a future EVT back into this RMO.
   - An RMO joins the EVTs it projects by their shared ids (e.g., EVT Bike Rented and EVT Customer Registered by customerId) to show the properties of several entities together, such as an invoice with the customer's name. The EVTs stay in 3NF; the RMO does the lookup and is free to repeat those properties — denormalization is the point of a read model (anti-DRY for the view). An EVT that will be joined must carry the other entity's id (e.g., attendeeId on EVT Topic Suggested, topicId on EVT Session Scheduled), never that entity's other properties (e.g., the attendee's name or the topic's title). **Lookup rule:** when an RMO projects any EVT that refers to another entity by id, that RMO must keep a **lookup** collection from the entity's own EVT(s) — keyed by that id, holding the descriptions the view needs (name, title, kind, …). Build the lookup as those EVTs arrive, including entities that never appear on a later joined row (a topic with no votes, or never scheduled, still sits in the Agenda lookups). The main collection then carries the foreign id and may also show the looked-up fields on each row for the denormalized view. **When a separate lookup is not needed:** if the RMO's main collection is already projected from that entity's own EVT (the one that first recorded the descriptions), those rows *are* the subscription — do not add a second lookups table for the same facts. Example: RMO Agenda Builder builds topic rows from EVT Topic Suggested (`topicId`, `title`, `kind`) and only joins EVT Topic Voted by `topicId` to bump `voteCount`; no lookups table. RMO Agenda, by contrast, builds session rows from EVT Session Scheduled (3NF: `topicId` but no title/kind), so it must keep lookups from EVT Topic Suggested — including topics that never get scheduled.
   - When the RMO shows a value in a different shape than the EVTs recorded it (e.g., a total from a rate and a count, or a display name from a model), put a MAP on the arrows from the EVTs to the RMO. The EVTs carry the inputs; the RMO shows the outputs. The RMO derives the outputs on every read, so nothing is recorded. Also put a MAP there when an EVT property is only used to produce or adjust something the RMO shows and never appears on the RMO as itself (e.g., dailyRate on EVT Bike Listed feeds total on RMO Rental Confirmation); the MAP is what shows that property is used.
   - The UBA is optional. Place a SCR in the UBA SWL of the USR who views it, when they view it to decide what to do next or to confirm a previous COM they initiated. Place a PRO in the UBA SWL of the USR who waits on it, when it reads its tasks. When several USRs share the same RMO view (Topic Ballot, Agenda), put that SCR in **each** of those USRs' UBA SWLs in that slice — same wire layout in every lane (see Agenda on SLC23, Topic Ballot on SLC15).
   - A PRO needs a TODO RMO to keep track of its tasks, so a PRO is always expressed as two SLCs beside one another: the RMO slice in which it reads its TODO RMO, immediately followed by the COM slice in which it issues the COM for that task. Nothing sits between them. A PRO never appears in a lone RMO slice or a lone COM slice; if it handles more than one kind of task, each is its own adjacent pair.
   - An RMO may only project EVTs that live in the same LBA SWL, so it must not depend on EVTs from other SWLs.
   - If an RMO needs information from an EVT in another SWL, channel it: add a RMO TODO, a PRO that works from it, and a COM issued by that PRO that records a new EVT in the SWL of the RMO that needs the information. The EVT carries the needed data across, and the RMO then projects it from its own SWL. This also allows the TODO RMO and COM issued by the PRO to filter and/or change the data for the purpose of being used in the final RMO. The channel EVT is the one copy of that entity in the receiving SWL, keyed by its id; later EVTs in that SWL refer to it by that id and the RMO joins them, so the data is not copied again. A SCR may pass a foreign id into a COM that records in another SWL (session / query / hidden field), but the person sees the denormalized label on the SCR, not that technical id; other properties of that entity still cross only via the channel.
   - When the receiving RMO needs the data in a different shape (combined, split, renamed or reformatted), put a MAP on the arrow from the PRO's COM to the new EVT. The PRO passes the raw inputs from its TODO RMO to the COM unchanged, and the EVT records the MAP's outputs, so the receiving SWL only ever holds the shape it needs. Name the MAP and write its inputs and outputs so the dependency can be traced; the implementer decides how the outputs are produced.
   - Choose the MAP position by where the output is needed. On EVT → RMO when only that RMO needs the output and it may change later, since nothing is recorded. On COM → EVT when the output must become a fact that other SWLs or later RMOs rely on, since the EVT then records it and it can never change.

7. **Organize SLCs into WFLs**
   - Group the SLCs into the WFLs identified in step 1. Every SLC belongs to exactly one WFL, and the SLCs of one WFL sit next to each other, in the order the steps happen.
   - Give each WFL a name that states its goal (e.g., "Rent a bike") and label it above its SLC columns, so a reader can see where one process ends and the next begins.
   - A WFL starts with the SLC that begins the process (usually a SCR or PRO acting) and ends with the SLC whose EVT or RMO accomplishes the goal.
   - Place the WFLs left to right in order of use, so that any EVT an RMO projects lies in the same WFL or in an earlier one. A WFL may project EVTs recorded by an earlier WFL, but never from a later one.
   - If a WFL is repeated in practice (e.g., one rental per customer), draw it once with one concrete example, not once per repetition.
   - If a SLC does not fit any WFL, or a WFL is missing a step it needs to reach its goal, go back to step 4 and add or move SLCs.

8. **Connect All SLCs**
   - Within a COM slice, draw an arrow from the SCR or PRO to the COM, and from the COM to its EVT. In a failed COM slice, draw it from the COM to its ERR (the ERR stands in place of an EVT).
   - Within an RMO slice, draw an arrow from the RMO up to the SCR or PRO, if there is one.
   - A NAV slice has no MBA or LBA item and no within-slice arrows (cross-slice RMO → SCR into a NAV title-view still uses a between-SLC arrow).
   - **Timeline rule (EMD and board):** a slice only knows the current SLC and earlier ones. Never connect to the future. Between SLCs, draw an arrow from each EVT to every RMO that projects it only when the EVT's SLC is **strictly left of** the RMO's SLC (and every such EVT shares one SWL — see step 6 for crossing SWLs). Forbidden: EVT → RMO when the EVT sits in a later column than the RMO (no reverse-time hops). On the HTML board, every allowed arrow is its own `data-joins` pair; several EVTs into one RMO are listed earliest-first and paint as a bundled run of connector rows (see **Ids and joins**). When a later COM changes what that screen shows (e.g. Schedule Session fills a cell), later SCRs carry those values by session or query convention until a **later** RMO projects the new EVTs.
   - Between SLCs, when an RMO feeds a SCR in a **later** SLC (first read of that view data), draw an arrow from the RMO to that SCR (RMO left of SCR). Do not repeat the arrow for later SCRs that only carry the same values by session or query convention. Do not draw RMO → SCR into an earlier column.
   - Write each MAP on the arrow it belongs to: COM → EVT or EVT → RMO. The reader then sees exactly where the inputs become the outputs, and in which item the outputs first appear.
   - Connect the ERR to the SCR in the next slice (often a NAV slice that shows the message).

9. **Write the GWTs**
   - A SLC may carry no GWTs or many. When it carries any, draw them in that column below every LBA SWL. One row spans the diagram; the lane label is GWT. The cell is part of the SLC. It is not a SWL, and it is not a SVC.
   - Represent the GWTs on one or more vertical timelines in that cell. Do not split a GWT into separate Given/When/Then blocks; the timeline order is the GWT. Use the example values of the COM or RMO being described (COM slice or RMO slice).
   - COM: place zero or more EVTs, then the COM, then the EVT (or ERR) that COM produced. That is one GWT: all EVTs above the COM are the Given, the COM is the When, the EVT (or ERR) right under the COM is the Then. To add another GWT for the same COM type on the same timeline, place another COM of that type and its Then EVT below it. That next When's Given is the previous COM's Given EVTs plus its Then EVTs — every EVT above that next COM.
   - RMO: place the RMO first (empty, or its state before any of this GWT's EVTs), then each EVT that RMO projects with the RMO again immediately after it. The pattern is RMO, EVT, RMO, EVT, …, RMO: the RMO appears at the beginning, between every EVT, and as the last step, so each RMO card shows how the projection changed when that EVT was received. Those EVTs are the Given; there is no When. **Structure from the first card:** every RMO snapshot on the timeline — including the opening empty one — already shows the RMO's full shape (every collection table with its column headers, or every single-object property name). Empty means no body rows / blank values, not a bare title. When the RMO has a main collection and lookups, both tables appear on every snapshot (main may stay header-only until its first row arrives). When the RMO joins, every intermediate RMO card must show what that EVT contributed — including lookup entries keyed by id (e.g., attendeeId → name after EVT Attendee Registered) — so a later EVT that only carries that id has a visible source for the looked-up property on the prior RMO cards. When a later GWT on the same timeline needs that history, the previous RMO's Given EVTs (and any Then EVTs already on that timeline) are included in the next When's Given if a COM follows, or continue as further EVTs interleaved with RMO snapshots if another RMO GWT follows.
   - **EMD GWT:** every MBA RMO that appears needs a scrubber timeline. When the RMO appears **once**, put a labeled **EMD GWT** on that SLC — the full implied projection across every feeding EVT (empty structure first). When the **same RMO title appears again** later (e.g. Agenda Builder after Schedule Session, or Registrations again for the organizer Attendees screen), each appearance gets **its own** EMD GWT with a **distinct** timeline id: the first covers the EVTs that instance joins; each later one starts from the prior footprint and lists **only the new** feeding EVTs — do **not** re-join or re-list earlier EVTs on the later instance (the scrubber chains same-title GWTs and would show duplicates). Name each block `EMD GWT timeline (RMO …):` in the markdown; the board marks `.timeline.emd-gwt` with a stable id; that MBA card's `data-emd-gwt` points at **its** timeline.
   - GWTs on separate timelines in the same slice do not share history. Only GWTs on the same timeline build on one another.
   - A MAP stays on its arrow. The Then EVT or RMO on the timeline carries the example values of the MAP's outputs; the timeline does not restate the MAP.

10. **Review for Completeness**
   - Check that no data is unaccounted for, in both directions. A SCR can't show something that never made it to the system via an EVT, and an EVT should not record something that no SCR or PRO ever uses. The two property checks below trace each direction.
   - Check that every COM leads to an EVT or an ERR (never both in one SLC), and every RMO traces back only to EVTs in **earlier** SLCs. Reject any EVT→RMO or RMO→SCR whose source column is to the right of its destination. A NAV slice has neither COM nor RMO.
   - Check that every PRO is expressed as two SLCs beside one another: an RMO slice reading its TODO RMO, immediately followed by a COM slice issuing the COM for that task, with no SLC between them.
   - Check that every SCR and PRO sits in a USR's UBA SWL, and every EVT sits in a SVC's LBA SWL. Every ERR sits in the LBA of its own SLC, in the SWL of the SVC its COM would have changed.
   - Check that no SLC shows an alternative outcome. Each SLC records one thing that happened; there is no "or" or branching in an EMD.
   - Check that every property on a SCR, COM, RMO and EVT has a known source, and trace it back along the arrows (SCR/PRO → COM → EVT, and EVT → RMO → SCR/PRO) to the SCR input, COM-generated value or MAP output that created it.
   - Check that every SCR field is something a person would see or enter. Technical join keys stay off the wire (`attendeeId`, `topicId`, …) unless they are user-facing identifiers (invoice number, order number, confirmation code). Visible captions are UX wording or omitted when self-evident — never raw catalog names like `title` or `message`. A COM may still list those keys among its properties when session or query state supplies them.
   - Check that every property ends up somewhere. Start from each place a property enters the system (a SCR input, a COM-generated value or a MAP output) and trace it forward along the arrows (SCR/PRO → COM → EVT → RMO → SCR/PRO) until it reaches a valid end point. There are three: a COM, since every property a COM carries is used in its processing (recorded on the EVT, checked against the history, or both, so a password a COM checks and never records has arrived); a SCR that shows it; or a PRO that acts on it where an automation stands in for a USR. A property counts as arrived when it appears on that COM, SCR or PRO as itself, when it is an input of a MAP whose output arrives there, or when it is the id an RMO joins by. So the check bites on the EVT side: a property that is recorded on an EVT but reaches no RMO, and through it no SCR or PRO, is unaccounted for. Either a SCR is missing, a MAP that consumes it is missing (dailyRate on EVT Bike Listed appears on no later SCR as itself; MAP Rental Total is what shows it becomes total), or the property should not have been recorded.
   - Check that every RMO only has incoming arrows from EVTs in a single LBA SWL. Where data crosses SWLs, check that it does so via step 6's PRO and COM.
   - Check that every EVT is in 3NF: each property depends on the EVT's own key, and no EVT copies a property of another entity that is already recorded on an EVT in the same SWL. Where two entities meet (e.g., a rental and its customer), the EVT holds the id and the RMO joins.
   - Check that every MAP sits on one arrow (COM → EVT or EVT → RMO), that all of its inputs are present on the item at the tail of that arrow (the COM, or the EVTs), and that all of its outputs appear on the item at the head (the EVT, or the RMO). Check that it names inputs and outputs only: no values, since those sit on the items at either end, and no calculation, formula or transformation, since the EMD holds no implementation. A SCR or PRO passes data to its COM unchanged.
   - Check that every SLC belongs to exactly one WFL, that the SLCs of each WFL are contiguous, and that no RMO projects an EVT from a later WFL.
   - Check each GWT timeline below the LBA. A SLC may have none, or one or more timelines. Where a timeline describes a COM, each COM of that type on the timeline has a Then EVT (or ERR) immediately below it, and every EVT above that COM is its Given. Where a later GWT follows on the same timeline, the next When's Given is the previous COM's or RMO's Given EVTs plus its Then EVTs. Separate timelines do not share that history. Where a timeline describes an RMO, it starts with that RMO, places the RMO again after every EVT, and ends with that RMO; the EVTs interleaved with those RMO cards are its Given. Every RMO snapshot — including the first empty one — already carries the RMO's full structure (all collection tables with headers, or all single-object property names). Where the RMO joins, intermediate RMO cards show lookup state from earlier EVTs, and each joined EVT on the timeline carries the join id. Values match the COM or RMO being specified.

## Notation

**Naming.** Every item is labeled with its three-letter abbreviation followed by its name, so its kind is visible at a glance. WFLs and SLCs are numbered; everything else is named.
- WFL: `WFL<n> <goal>`, numbered from 1 left to right across the EMD (e.g., `WFL1 Stock a bike`). After its first mention, the number alone refers to it (`WFL1`), and its columns are given as a range of SLCs (`SLC1–SLC5`).
- SLC: `SLC<n>`, numbered from 1 left to right across the whole EMD, continuing across WFLs rather than restarting in each (e.g., `SLC12`). Where a SLC is described, its type follows in parentheses: `SLC12 (COM slice)`, `SLC13 (RMO slice)`, `SLC11 (COM slice, ERR)`, `SLC7 (NAV slice)`.
- GWT: written in that SLC below the LBA on one or more vertical timelines of EVTs, COMs, ERRs and/or an RMO. A SLC may have none. Given, When and Then are read from the timeline, not written as labels on the board: for a COM, EVTs above it are the Given, the COM is the When, the EVT or ERR under it is the Then; for an RMO, the cards alternate RMO, EVT, RMO, … so the RMO is at the start, between each EVT, and at the end (with lookup state when it joins). When GWTs share a timeline, the previous COM's or RMO's Given EVTs and Then EVTs are included as the next When's Given. Separate timelines do not share that history.
- USR: `<name> (<ROL>)` (e.g., `Jim (Customer)`). SVC: its name alone (e.g., `Fleet`).
- SWL: the band abbreviation, a colon and the USR or SVC the row belongs to: `UBA: Jim (Customer)`, `LBA: Fleet`. The MBA has one SWL, labeled `MBA`.
- SCR, PRO, COM, RMO, EVT, ERR and MAP: the abbreviation followed by a title-case name (e.g., `SCR Rent Bike Form`, `PRO Bike Lister`, `COM Rent Bike`, `RMO Bike Catalog`, `EVT Bike Rented`, `ERR Unknown Customer`, `MAP Rental End`). A COM is an imperative (verb then object), an EVT is in past tense, and an RMO a PRO works from ends in `TODO`.
- Where an item is placed, its SWL follows in parentheses: a SCR or PRO carries its USR (`SCR Rent Bike Form (Jim)`), and an RMO, EVT or ERR carries its SVC (`EVT Bike Rented (Rental)`). Where an item is referred to from another SLC, that SLC follows in parentheses instead (`EVT Bike Rented (SLC12)`).

**Catalog (after USRs and SVCs).** List every distinct COM, EVT and RMO once — property names only (no example values), plus what each connects to. Put these sections immediately under **SVCs**, before **WFLs**. The slice **Properties** later still carry the concrete example values; the catalog is the schema and wiring index used for reading and for emitting the board.

```
**COMs:**
- COM <name>
  - properties: <names>
  - from: SCR <name> | PRO <name>
  - to: EVT <name>
  - fails: ERR <name> → SCR <name>   ← only when the COM has an ERR path

**EVTs:**
- EVT <name> (<SVC>)
  - properties: <names>
  - from: COM <name>
  - to: RMO <name>, …                ← every RMO that projects it; `none` if unused yet

**RMOs:**
- RMO <name> (<SVC>)
  - properties: <names>              ← single-object RMO
  - collections: [<fields>]          ← one table: no collection name (the RMO name is enough)
  - collections: <RMO name> [<fields>]; lookups [<id>, …]; …  ← more than one table: one collection uses the RMO name; lookups hold descriptions for foreign ids on EVTs this RMO projects
  - from: EVT <name>, …              ← include join key when it joins (e.g. join by attendeeId); list the EVT that fills each lookup
  - to: SCR <name> | PRO <name>
```

List each type once even when the example uses it in several slices. Fold join facts into the RMO **from** line (no separate Joins list is required). Note in the RMO catalog when a title appears twice and that later slices project only new EVTs. MAPs and ERRs stay in their own lists after WFLs. Do **not** put GWT timelines in the catalog. Write an **EMD GWT** on each SLC that features that RMO in the MBA (see **EMD GWT**): one appearance → full story; repeated title → one timeline per appearance, later ones delta-only.

Every item in an EMD carries concrete data: its properties and their values in the example. Where a value comes from is not written on the property; the arrows say it. A property on a COM comes from the SCR or PRO at the tail of its arrow, a property on an EVT from its COM, a property on an RMO from the EVTs whose arrows point to it, and a property on a SCR or PRO from the RMO below it. A value that first appears on a COM (e.g., an id) was generated there. Where processing changes a property's name or shape, a MAP on that arrow names its inputs and outputs; nothing else is annotated.

A SCR is written as its nested elements, the way a rough wireframe is sketched: groups, rows and columns hold headings, labels, text boxes, dropdowns, date pickers, check boxes, radio buttons, tables and buttons, top to bottom and left to right. A button that issues a COM or opens another SCR names it with →. Sketch only what the person sees — not technical join keys (those stay on the COM / EVT / RMO lines). **Visible chrome is UX copy, not schema names:** never put the catalog property name on the wire as the caption (`title`, `message`, `dailyRate`, `attendeeId`, …). Either omit the caption when the value is self-evident (a conference name, an error sentence), or write a normal UI label (`Name`, `Email`, `Daily rate`). Put the schema property in parentheses after the kind so the board can still trace with `data-prop` — e.g. `label (title) = Adaptech Unconference 2026`, `text box Name (name) = Pat Lee`, `label (message) = Name is required`, `text box Daily rate (dailyRate) = 25.00`, table `columns: Topic (title) | Kind (kind) | …`.

A MAP is written as `MAP <name>: <inputs> → <outputs>, on <tail> → <head>`. It carries property names only. No values are written on it, since the reader sees the example data on the items at either end of the arrow, and no calculation, formula or transformation is written, since the EMD describes behaviour, not implementation.

Arrows within a SLC are not written due to convention; step 8 fixes them from the slice type (SCR/PRO → COM → EVT or ERR in a COM slice, RMO → SCR/PRO in an RMO slice). Only arrows between SLCs are listed, one per line as `EVT <name> (SLC<n>) → RMO <name> (SLC<m>)`, `RMO <name> (SLC<n>) → SCR <name> (SLC<m>)` when an RMO first feeds a later SCR, or `ERR <name> (SLC<n>) → SCR <name> (SLC<m>)`, with any MAP written on the arrow.

GWTs are written in their SLC, below the LBA, on one or more vertical timelines. A SLC may have no timelines, or many GWTs across one or more timelines. Read each GWT from its timeline: for a COM, EVTs above it are the Given, the COM is the When, the EVT (or ERR) right under the COM is the Then; for an RMO, start with the RMO, then EVT, RMO, …, RMO, and show lookup entries when the RMO joins. When GWTs share the same timeline, the previous COM's or RMO's Given EVTs and Then EVTs are included as the next When's Given (every EVT above that next COM). Separate timelines do not share that history.

```
One timeline, one GWT for a COM (zero prior EVTs)
- COM <name>: <properties>
- EVT <name> (<SVC>): <properties>          ← Then of that COM

One timeline, two GWTs for the same COM (second builds on the first)
- EVT <name>: <properties>                 ← Given EVTs of GWT 1
- COM <name>: <properties>                 ← When of GWT 1
- EVT <name>: <properties>                 ← Then EVTs of GWT 1
- COM <name>: <properties>                 ← When of GWT 2; Given = GWT 1's Given EVTs + Then EVTs
- EVT <name>: <properties>                 ← Then of GWT 2

Two timelines in the same SLC (no shared history)
timeline A:
- COM <name>: <properties>
- EVT <name>: <properties>
timeline B:
- EVT <name>: <properties>                 ← its own Given; does not include timeline A's EVTs
- COM <name>: <properties>
- EVT <name>: <properties>

One timeline for an RMO (RMO at start, between each EVT, and at end).
Every RMO line keeps the full shape (tables/headers or property names); `(empty)` means no rows / blank values yet.
- RMO <name> (<SVC>): (empty) Topic Ballot [topicId, title, kind, name]; lookups [attendeeId, name]
                                       ← before any EVT; both tables present, bodies empty
- EVT <name> (SLC<m>): <properties>        ← Given (e.g. entity registered; builds lookup)
- RMO <name> (<SVC>): Topic Ballot []; lookups [A-1 → Pat Lee]
                                       ← after that EVT; main still header-only; lookup has a row
- EVT <name> (SLC<n>): <id>, <properties>  ← Given (carries the join id, not the looked-up props)
- RMO <name> (<SVC>): Topic Ballot [T-1 | … | Pat Lee]; lookups [A-1 → Pat Lee, …]
                                       ← after that EVT; main row uses lookup by id (last = Then)
```

On the board the three-letter prefix is left off, matching the cards. The timeline order is the only structure; do not add Given/When/Then labels. Samples for a COM, two COMs on one timeline, a failed COM, and an RMO are in the example.

## Example

Bike rental shop.

**USRs:** Jim (Customer), Sam (Shop Clerk)
**SVCs:** Fleet, Customer, Rental

**COMs:**
- COM Receive Bike
  - properties: serialNumber, model, type, bikeId
  - from: SCR Receive Bike Form
  - to: EVT Bike Received
- COM Register Bike
  - properties: bikeId, dailyRate
  - from: SCR Register Bike Form
  - to: EVT Bike Registered
- COM List Bike
  - properties: bikeId, model, dailyRate
  - from: PRO Bike Lister
  - to: EVT Bike Listed
- COM Submit Application
  - properties: firstName, lastName, email, customerId
  - from: SCR Customer Application Form
  - to: EVT Application Submitted
- COM Register Customer
  - properties: customerId, firstName, lastName, email
  - from: PRO Customer Registrar
  - to: EVT Customer Registered
- COM Rent Bike
  - properties: bikeId, customerId, email, startDate, days, rentalId
  - from: SCR Rent Bike Form
  - to: EVT Bike Rented
  - fails: ERR Unknown Customer → SCR Rent Bike Form
- COM Return Bike
  - properties: rentalId, returnDate
  - from: SCR Return Desk
  - to: EVT Bike Returned
- COM Send Receipt
  - properties: rentalId
  - from: PRO Receipt Sender
  - to: EVT Receipt Sent
**EVTs:**
- EVT Bike Received (Fleet)
  - properties: bikeId, serialNumber, model, type
  - from: COM Receive Bike
  - to: RMO Unregistered Bikes, RMO Bike Listings TODO, RMO Bike Catalog
- EVT Bike Registered (Fleet)
  - properties: bikeId, dailyRate
  - from: COM Register Bike
  - to: RMO Bike Listings TODO, RMO Bike Catalog
- EVT Bike Listed (Rental)
  - properties: bikeId, model, dailyRate
  - from: COM List Bike
  - to: RMO Rental Confirmation, RMO Receipts TODO
- EVT Application Submitted (Customer)
  - properties: customerId, firstName, lastName, email
  - from: COM Submit Application
  - to: RMO Application Confirmation, RMO Customer Names TODO
- EVT Customer Registered (Rental)
  - properties: customerId, email, name
  - from: COM Register Customer
  - to: RMO Rental Confirmation, RMO Receipts TODO
- EVT Bike Rented (Rental)
  - properties: rentalId, bikeId, customerId, startDate, days, endDate
  - from: COM Rent Bike
  - to: RMO Rental Confirmation, RMO Receipts TODO
- EVT Bike Returned (Rental)
  - properties: rentalId, returnDate
  - from: COM Return Bike
  - to: RMO Receipts TODO
- EVT Receipt Sent (Rental)
  - properties: rentalId
  - from: COM Send Receipt
  - to: none

**RMOs:**
- RMO Unregistered Bikes (Fleet)
  - collections: [bikeId, serialNumber, model, type]  ← bikes with EVT Bike Received and no later EVT Bike Registered
  - from: EVT Bike Received (by bikeId)
  - to: SCR Unregistered Bikes
- RMO Bike Listings TODO (Fleet)
  - collections: [bikeId, model, dailyRate]  ← join EVT Bike Registered ⋈ EVT Bike Received by bikeId
  - from: EVT Bike Registered, EVT Bike Received (join by bikeId)
  - to: PRO Bike Lister
- RMO Bike Catalog (Fleet)
  - collections: [bikeId, model, type, dailyRate]  ← join by bikeId
  - from: EVT Bike Received, EVT Bike Registered (join by bikeId)
  - to: SCR Bike Catalog
- RMO Application Confirmation (Customer)
  - properties: customerId, firstName, lastName, email
  - from: EVT Application Submitted
  - to: SCR Application Confirmation
- RMO Customer Names TODO (Customer)
  - collections: [customerId, firstName, lastName, email]
  - from: EVT Application Submitted
  - to: PRO Customer Registrar
- RMO Rental Confirmation (Rental)
  - properties: rentalId, bike, name, startDate, endDate, days, total (joins + MAPs Bike Label, Rental Total)
  - from: EVT Bike Rented, EVT Bike Listed (join by bikeId), EVT Customer Registered (join by customerId)
  - to: SCR Rental Confirmation
- RMO Receipts TODO (Rental)
  - properties: rentalId, customerId, name, email, returnDate, total (joins + MAP Rental Total)
  - from: EVT Bike Returned, EVT Bike Rented (join by rentalId), EVT Bike Listed (join by bikeId), EVT Customer Registered (join by customerId)
  - to: PRO Receipt Sender

**WFLs:**
- WFL1 Stock a bike: SLC1–SLC5, ends EVT Bike Listed
- WFL2 Apply as a customer: SLC6–SLC9, ends EVT Customer Registered
- WFL3 Rent a bike: SLC10–SLC14, ends SCR Rental Confirmation
- WFL4 Return a bike and send the receipt: SLC15–SLC17, ends EVT Receipt Sent

**MAPs:**
- MAP Full Name: firstName, lastName → name, on COM Register Customer → EVT Customer Registered (SLC9)
- MAP Rental End: startDate, days → endDate, on COM Rent Bike → EVT Bike Rented (SLC13)
- MAP Bike Label: model → bike, on EVT Bike Listed → RMO Rental Confirmation (SLC14)
- MAP Rental Total: days, dailyRate → total, on EVT Bike Rented, EVT Bike Listed → RMO Rental Confirmation (SLC14) and EVT Bike Rented, EVT Bike Listed → RMO Receipts TODO (SLC16)

**ERRs:**
- ERR Unknown Customer, on COM Rent Bike (SLC11) → SCR Rent Bike Form (SLC12)

**Diagram:**

| | SLC1 | SLC2 | SLC3 | SLC4 | SLC5 | SLC6 | SLC7 | SLC8 | SLC9 | SLC10 | SLC11 | SLC12 | SLC13 | SLC14 | SLC15 | SLC16 | SLC17 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **WFL** | WFL1 Stock a bike | WFL1 | WFL1 | WFL1 | WFL1 | WFL2 Apply as a customer | WFL2 | WFL2 | WFL2 | WFL3 Rent a bike | WFL3 | WFL3 | WFL3 | WFL3 | WFL4 Return a bike and send the receipt | WFL4 | WFL4 |
| **UBA: Jim (Customer)** | | | | | | SCR Customer Application Form | SCR Application Confirmation | PRO Customer Registrar | PRO Customer Registrar | SCR Bike Catalog | SCR Rent Bike Form | SCR Rent Bike Form | SCR Rent Bike Form | SCR Rental Confirmation | | PRO Receipt Sender | PRO Receipt Sender |
| **UBA: Sam (Shop Clerk)** | SCR Receive Bike Form | SCR Unregistered Bikes | SCR Register Bike Form | PRO Bike Lister | PRO Bike Lister | | | | | | | | | | SCR Return Desk | | |
| **MBA** | COM Receive Bike | RMO Unregistered Bikes | COM Register Bike | RMO Bike Listings TODO | COM List Bike | COM Submit Application | RMO Application Confirmation | RMO Customer Names TODO | COM Register Customer | RMO Bike Catalog | COM Rent Bike | | COM Rent Bike | RMO Rental Confirmation ← MAP Bike Label, MAP Rental Total | COM Return Bike | RMO Receipts TODO ← MAP Rental Total | COM Send Receipt |
| **LBA: Fleet** | EVT Bike Received | | EVT Bike Registered | | | | | | | | | | | | | | |
| **LBA: Customer** | | | | | | EVT Application Submitted | | | | | | | | | | | |
| **LBA: Rental** | | | | | EVT Bike Listed | | | | MAP Full Name → EVT Customer Registered | | ERR Unknown Customer | | MAP Rental End → EVT Bike Rented | | EVT Bike Returned | | EVT Receipt Sent |
| **GWT** | Receive Bike → Bike Received | Unregistered Bikes → Bike Received → Unregistered Bikes | | | | | | | | | (no Customer Registered for C-8) → Rent Bike → Unknown Customer | | Customer Registered → Rent Bike → Bike Rented → Rent Bike → Bike Rented | Rental Confirmation → Bike Rented → Rental Confirmation → Bike Listed → Rental Confirmation → Customer Registered → Rental Confirmation | | | |

**Slice types:**
- COM slices: SLC1, SLC3, SLC5, SLC6, SLC9, SLC11, SLC13, SLC15, SLC17
- RMO slices: SLC2, SLC4, SLC7, SLC8, SLC10, SLC14, SLC16
- NAV slices: SLC12


**Arrows between SLCs (EVT → RMO):**
- EVT Bike Received (SLC1) → RMO Unregistered Bikes (SLC2)
- EVT Bike Received (SLC1) → RMO Bike Listings TODO (SLC4)
- EVT Bike Registered (SLC3) → RMO Bike Listings TODO (SLC4)
- EVT Application Submitted (SLC6) → RMO Application Confirmation (SLC7)
- EVT Application Submitted (SLC6) → RMO Customer Names TODO (SLC8)
- EVT Bike Received (SLC1) → RMO Bike Catalog (SLC10)
- EVT Bike Registered (SLC3) → RMO Bike Catalog (SLC10)
- EVT Bike Rented (SLC13) → MAP Rental Total → RMO Rental Confirmation (SLC14)
- EVT Bike Listed (SLC5) → MAP Bike Label, MAP Rental Total → RMO Rental Confirmation (SLC14)
- EVT Customer Registered (SLC9) → RMO Rental Confirmation (SLC14)
- EVT Bike Returned (SLC15) → RMO Receipts TODO (SLC16)
- EVT Bike Rented (SLC13) → MAP Rental Total → RMO Receipts TODO (SLC16)
- EVT Bike Listed (SLC5) → MAP Rental Total → RMO Receipts TODO (SLC16)
- EVT Customer Registered (SLC9) → RMO Receipts TODO (SLC16)
- EVT Receipt Sent (SLC17) → none

**Properties:**

**WFL1 Stock a bike (SLC1–SLC5)**

**SLC1 (COM slice)**
- SCR Receive Bike Form (Sam):
  - heading Receive Bike
  - column
    - text box Serial number (serialNumber) = SN-48213
    - text box Model (model) = Trailblazer 29
    - dropdown Type (type) = Mountain
  - row, right-aligned
    - button Receive → COM Receive Bike
- COM Receive Bike: serialNumber = SN-48213, model = Trailblazer 29, type = Mountain, bikeId = B-101
- EVT Bike Received (Fleet): bikeId = B-101, serialNumber = SN-48213, model = Trailblazer 29, type = Mountain
- GWT timeline (one GWT for COM Receive Bike; no prior EVTs):
  - COM Receive Bike: serialNumber = SN-48213, model = Trailblazer 29, type = Mountain, bikeId = B-101
  - EVT Bike Received (Fleet): bikeId = B-101, serialNumber = SN-48213, model = Trailblazer 29, type = Mountain

**SLC2 (RMO slice)**
- RMO Unregistered Bikes (Fleet), one row per unregistered bike: bikeId = B-101, serialNumber = SN-48213, model = Trailblazer 29, type = Mountain
- SCR Unregistered Bikes (Sam):
  - heading Unregistered Bikes
  - table, one row per row of RMO Unregistered Bikes
    - columns: Serial number (serialNumber) | Model (model) | Type (type) | button Register → SCR Register Bike Form
    - row: SN-48213 | Trailblazer 29 | Mountain | Register
    - (bikeId stays on the RMO / session for the COM — not on the wire)
- GWT timeline (describes RMO Unregistered Bikes):
  - RMO Unregistered Bikes (Fleet): (empty) [bikeId, serialNumber, model, type]
  - EVT Bike Received (SLC1): bikeId = B-101, serialNumber = SN-48213, model = Trailblazer 29, type = Mountain
  - RMO Unregistered Bikes (Fleet): bikeId = B-101, serialNumber = SN-48213, model = Trailblazer 29, type = Mountain

**SLC3 (COM slice)**
- SCR Register Bike Form (Sam):
  - heading Register Bike
  - group Bike (read only)
    - row: label (serialNumber) = SN-48213 | label (model) = Trailblazer 29 | label (type) = Mountain
  - group Rate
    - text box Daily rate (dailyRate) = 25.00
  - row, right-aligned
    - button Register → COM Register Bike
- COM Register Bike: bikeId = B-101, dailyRate = 25.00
  - (bikeId from the selected Unregistered Bikes row — session, not drawn on the SCR)
- EVT Bike Registered (Fleet): bikeId = B-101, dailyRate = 25.00

**SLC4 (RMO slice)**
- RMO Bike Listings TODO (Fleet), one task per registered bike not yet listed: bikeId = B-101, model = Trailblazer 29, dailyRate = 25.00
- PRO Bike Lister (Sam): next task of RMO Bike Listings TODO

**SLC5 (COM slice)**
- PRO Bike Lister (Sam): bikeId = B-101, model = Trailblazer 29, dailyRate = 25.00
- COM List Bike: bikeId = B-101, model = Trailblazer 29, dailyRate = 25.00
- EVT Bike Listed (Rental): bikeId = B-101, model = Trailblazer 29, dailyRate = 25.00

**WFL2 Apply as a customer (SLC6–SLC9)**

**SLC6 (COM slice)**
- SCR Customer Application Form (Jim):
  - heading Apply
  - group Name
    - row: text box First name (firstName) = Jim | text box Last name (lastName) = Harper
  - text box Email (email) = jim@example.com
  - row, right-aligned
    - button Submit → COM Submit Application
- COM Submit Application: firstName = Jim, lastName = Harper, email = jim@example.com, customerId = C-7
- EVT Application Submitted (Customer): customerId = C-7, firstName = Jim, lastName = Harper, email = jim@example.com

**SLC7 (RMO slice)**
- RMO Application Confirmation (Customer): customerId = C-7, firstName = Jim, lastName = Harper, email = jim@example.com
- SCR Application Confirmation (Jim):
  - heading Application Received
  - column
    - row: label (firstName) = Jim | label (lastName) = Harper
    - label (email) = jim@example.com
    - (customerId stays on the RMO / COM path — not a field Jim reads on this screen)

**SLC8 (RMO slice)**
- RMO Customer Names TODO (Customer), one task per application not yet registered: customerId = C-7, firstName = Jim, lastName = Harper, email = jim@example.com
- PRO Customer Registrar (Jim): next task of RMO Customer Names TODO

**SLC9 (COM slice)**
- PRO Customer Registrar (Jim): customerId = C-7, firstName = Jim, lastName = Harper, email = jim@example.com
- COM Register Customer: customerId = C-7, firstName = Jim, lastName = Harper, email = jim@example.com
- MAP Full Name: firstName, lastName → name, on COM Register Customer → EVT Customer Registered
- EVT Customer Registered (Rental): customerId = C-7, email = jim@example.com, name = Jim Harper

**WFL3 Rent a bike (SLC10–SLC14)**

**SLC10 (RMO slice)**
- RMO Bike Catalog (Fleet), one row per registered bike: bikeId = B-101, model = Trailblazer 29, type = Mountain, dailyRate = 25.00
- SCR Bike Catalog (Jim):
  - heading Bikes
  - table, one row per row of RMO Bike Catalog
    - columns: Model (model) | Type (type) | Daily rate (dailyRate) | button Rent → SCR Rent Bike Form
    - row: Trailblazer 29 | Mountain | 25.00 | Rent
    - (bikeId from the selected catalog row — session for the COM)

**SLC11 (COM slice, ERR)**
- SCR Rent Bike Form (Jim):
  - heading Rent Bike
  - group Bike (read only)
    - row: label (model) = Trailblazer 29 | label Daily rate (dailyRate) = 25.00
  - group Customer
    - text box Email (email) = wrong@example.com (mistyped)
  - group Dates
    - row: date picker Start (startDate) = 2026-10-22 | text box Days (days) = 3
  - row, right-aligned
    - button Rent → COM Rent Bike
- COM Rent Bike: bikeId = B-101, email = wrong@example.com, startDate = 2026-10-22, days = 3
  - (bikeId from catalog selection; email is what Jim typed — no matching EVT Customer Registered)
- ERR Unknown Customer (Rental), no EVT Customer Registered with email = wrong@example.com: email = wrong@example.com, message = "No customer registered with that email" → SCR Rent Bike Form (SLC12)
- GWT timeline (one GWT for COM Rent Bike; Then is the ERR):
  - (no EVT Customer Registered with email = wrong@example.com)
  - COM Rent Bike: bikeId = B-101, email = wrong@example.com, startDate = 2026-10-22, days = 3
  - ERR Unknown Customer (Rental): email = wrong@example.com, message = "No customer registered with that email"


**SLC12 (NAV slice)**
- SCR Rent Bike Form (Jim):
  - heading Rent Bike
  - group Bike (read only)
    - row: label (model) = Trailblazer 29 | label Daily rate (dailyRate) = 25.00
  - group Customer
    - text box Email (email) = wrong@example.com (mistyped)
    - label (message) = No customer registered with that email
  - group Dates
    - row: date picker Start (startDate) = 2026-10-22 | text box Days (days) = 3
  - row, right-aligned
    - button Rent → COM Rent Bike
- (no COM, no RMO)

**SLC13 (COM slice)**
- SCR Rent Bike Form (Jim):
  - heading Rent Bike
  - group Bike (read only)
    - row: label (model) = Trailblazer 29 | label Daily rate (dailyRate) = 25.00
  - group Customer
    - text box Email (email) = jim@example.com (corrected)
  - group Dates
    - row: date picker Start (startDate) = 2026-10-22 | text box Days (days) = 3
  - row, right-aligned
    - button Rent → COM Rent Bike
- COM Rent Bike: bikeId = B-101, customerId = C-7, email = jim@example.com, startDate = 2026-10-22, days = 3, rentalId = R-1
  - (customerId looked up from email against EVT Customer Registered; not drawn on the SCR)
- MAP Rental End: startDate, days → endDate, on COM Rent Bike → EVT Bike Rented
- EVT Bike Rented (Rental): rentalId = R-1, bikeId = B-101, customerId = C-7, startDate = 2026-10-22, days = 3, endDate = 2026-10-25
- GWT timeline (two GWTs for COM Rent Bike on one timeline; next When's Given = previous COM's Given EVTs + Then EVTs):
  - EVT Customer Registered (SLC9): customerId = C-7, email = jim@example.com, name = Jim Harper
  - COM Rent Bike: bikeId = B-101, customerId = C-7, email = jim@example.com, startDate = 2026-10-22, days = 3, rentalId = R-1
  - EVT Bike Rented (Rental): rentalId = R-1, bikeId = B-101, customerId = C-7, startDate = 2026-10-22, days = 3, endDate = 2026-10-25
  - COM Rent Bike: bikeId = B-101, customerId = C-7, email = jim@example.com, startDate = 2026-11-01, days = 2, rentalId = R-2
  - EVT Bike Rented (Rental): rentalId = R-2, bikeId = B-101, customerId = C-7, startDate = 2026-11-01, days = 2, endDate = 2026-11-03

**SLC14 (RMO slice)**
- MAP Bike Label: model → bike, on EVT Bike Listed → RMO Rental Confirmation
- MAP Rental Total: days, dailyRate → total, on EVT Bike Rented, EVT Bike Listed → RMO Rental Confirmation
- RMO Rental Confirmation (Rental): rentalId = R-1, bike = Trailblazer 29, name = Jim Harper, startDate = 2026-10-22, endDate = 2026-10-25, days = 3, total = 75.00
- SCR Rental Confirmation (Jim):
  - heading Rental Confirmed
  - column
    - label Confirmation (rentalId) = R-1
      - (confirmation number Jim quotes — user-facing, not a hidden join key)
    - label (bike) = Trailblazer 29
    - label (name) = Jim Harper
    - row: label Start (startDate) = 2026-10-22 | label End (endDate) = 2026-10-25 | label Days (days) = 3
    - label Total (total) = 75.00, right-aligned
- GWT timeline (describes RMO Rental Confirmation):
  - RMO Rental Confirmation (Rental): (empty) rentalId, bike, name, startDate, endDate, days, total
  - EVT Bike Rented (SLC13): rentalId = R-1, bikeId = B-101, customerId = C-7, startDate = 2026-10-22, days = 3, endDate = 2026-10-25
  - RMO Rental Confirmation (Rental): rentalId = R-1, bikeId = B-101, customerId = C-7, startDate = 2026-10-22, endDate = 2026-10-25, days = 3
  - EVT Bike Listed (SLC5): bikeId = B-101, model = Trailblazer 29, dailyRate = 25.00
  - RMO Rental Confirmation (Rental): rentalId = R-1, bike = Trailblazer 29, customerId = C-7, startDate = 2026-10-22, endDate = 2026-10-25, days = 3, total = 75.00
  - EVT Customer Registered (SLC9): customerId = C-7, email = jim@example.com, name = Jim Harper
  - RMO Rental Confirmation (Rental): rentalId = R-1, bike = Trailblazer 29, name = Jim Harper, startDate = 2026-10-22, endDate = 2026-10-25, days = 3, total = 75.00

**WFL4 Return a bike and send the receipt (SLC15–SLC17)**

**SLC15 (COM slice)**
- SCR Return Desk (Sam):
  - heading Return Bike
  - row
    - text box Confirmation (rentalId) = R-1
    - date picker Return date (returnDate) = 2026-10-25
  - row, right-aligned
    - button Return → COM Return Bike
- COM Return Bike: rentalId = R-1, returnDate = 2026-10-25
- EVT Bike Returned (Rental): rentalId = R-1, returnDate = 2026-10-25

**SLC16 (RMO slice)**
- MAP Rental Total: days, dailyRate → total, on EVT Bike Rented, EVT Bike Listed → RMO Receipts TODO
- RMO Receipts TODO (Rental), one task per returned rental not yet receipted: rentalId = R-1, customerId = C-7, name = Jim Harper, email = jim@example.com, returnDate = 2026-10-25, total = 75.00
- PRO Receipt Sender (Jim): next task of RMO Receipts TODO

**SLC17 (COM slice)**
- PRO Receipt Sender (Jim): rentalId = R-1
- COM Send Receipt: rentalId = R-1
- EVT Receipt Sent (Rental): rentalId = R-1

## HTML board

This section is the **complete** recipe for turning any finished EMD into a browser board. Follow it for every new or updated board — do not invent markup outside these templates. After the EMD is constructed (terms, slices, properties, arrows, and any GWTs), draw it as one file: `<name>.emd.html`. Open that file in a browser (or serve the repo). CSS, arrow tiles, fonts, connectors, and board settings stay in `diagram/`; the file is the page plus the board markup. A board under `projects/<name>/` links `../../diagram/` (see **Page**) — always the shared files, never a forked copy inside the project, so every board gets scroll smoothness, hover, and connector tiling from `diagram/`. An Electron `.emd` file is the same `<main class="emd">…</main>` only, without the HTML shell or scripts.

Each new SLC adds one column. Earlier columns stay as they are. Bump `--slices` when a column is added. Leave every connector cell empty — two rows: `.cell.connector.connector-upper` (between UBA and MBA; RMO→later SCR) and `.cell.connector` (between MBA and LBA; EVT→RMO, ERR→SCR, COM→EVT segment). Put those joins on `<main>` as `data-joins="evt-a:rmo-x,rmo-y:scr-z,err-b:scr-y,…"`.

Read the `EMD.md` straight into the templates below:

| In the EMD | On the board |
|---|---|
| USRs | one UBA row each, lane text `<name> (<ROL>)` |
| SVCs | one LBA row each; first lane is `lba-head`, last row's cells take `foot` |
| COMs / EVTs / RMOs (catalog) | schema for `dl.props` names and for `data-joins` / within-slice wiring; example values still come from slice **Properties** |
| WFLs | one `.wfl` per workflow, `data-span` = its slice count, goal in the `span` |
| COM slice | SCR or PRO, COM, EVT (or ERR), shafts in **COM slice** |
| RMO slice | RMO, optional SCR with `arrow-up`, empty lower gap, in **RMO slice** |
| NAV slice | SCR only, empty MBA and LBA, in **NAV slice** (error feedback **or** RMO title-view with `rmo-data` + upper `rmo:scr` join) |
| PRO | gear dock across the RMO slice and the next COM slice, in **Processor pair** |
| MAP | `p.map` under the COM or the RMO, never on the EVT |
| Properties | `dl.props` on COM, EVT, ERR, and single-object RMOs (`dt` = name, `dd` = example value); multi-row RMOs use `table.collection` inside `div.props` (caption only when the card has more than one table) |
| SCR wireframe | **Screen** templates; every named value gets `data-prop` |
| COM-bound SCR values | class `com-data` + `data-prop` on the **value field only**; also `com-data` on the button that issues the COM |
| RMO-fed SCR values | class `rmo-data` + `data-prop` on the **value field only** (never on labels, headings, legends, or `th`; empty RMO → no `rmo-data` on the SCR) |
| SPA / multi-region SCR | same screen + `fieldset.area` regions in every slice; only values and `com-data` / `rmo-data` change |
| Arrows between SLCs | `data-joins` only |
| GWT timelines | `.timeline` stacks in that slice's `.cell.gwt` |

### Emit from an EMD

For **any** EMD, produce `<name>.emd.html` in this order. Skip nothing that the EMD contains.

1. **Page shell** — copy **Page**. Set `<title>`, `--slices` to the SLC count, and `data-joins` to every **forward-in-time** EVT→RMO, RMO→later SCR, and ERR→SCR edge (ids from step 4). For each pair, the source card's `data-slc` must be **less than** the destination's (timeline rule — same as the EMD). Omit any reverse-time edge even if an RMO catalog line wrongly listed a later EVT. When several EVTs feed one RMO, list **each** pair and put the earliest EVT first for that RMO (bundled connector rows — see **Ids and joins**). Link `../../diagram/diagram.css`, then at the bottom `connectors.js` and `settings.js` (in that order). Those shared scripts already include the scroll guard (`.is-scrolling`, freeze hover while flinging, soft `emd:retile-check`); do not paste local scroll/hover CSS into the board. After changing `diagram/` CSS or JS, sync `app/renderer/diagram/` and bump `?v=` on the board links.
2. **Board skeleton** — emit **Board rows** in order: workflow, each UBA, **connector-upper**, MBA, **connector** (lower), each LBA, GWT. Every row is lane cell + one cell per SLC. Truly idle cells (no corridor through them) are empty `div`s with the right class and `data-slc` / `data-lane`. When a **vertical corridor** runs through the slice (COM SCR→COM, RMO SCR↔RMO, title-view NAV with `arrow-up`, error NAV with a shaft for ERR→SCR), empty UBA cells **below** that SCR/PRO need a shaft-only gap per **Vertical shafts** — bare `div`s break the line. Pure wizard NAV (Next/Finish only, no MBA card and no within-slice arrow) must **not** get those pass-through shafts; they would hang unconnected.
3. **WFLs** — one `.wfl` per workflow with `data-slc` = first slice and `data-span` = slice count; goal text in the inner `span`.
4. **Ids** — every SCR, PRO, COM, RMO, EVT, ERR gets an `id` per **Ids and joins**. Reuse those ids in `data-joins`. Name cards from the **COMs** / **EVTs** / **RMOs** catalogs.
5. **Fill each SLC** — COM → **COM slice** (+ **Processor pair** when a PRO); RMO → **RMO slice**; NAV → **NAV slice**. Vertical shafts per **Vertical shafts**. Put MAP notes under the COM or RMO per **Cards**. Use catalog property names on every `dt` / `data-prop`; take example values from slice **Properties**.
6. **Screens** — every SCR uses **Screen**. Always:
   - `data-prop="<name>"` on every named value field (same names as the COM/RMO/EVT catalog and `dt`s).
   - On a COM slice: `com-data` on each value the COM takes from this SCR (not on ids the COM generates), and on the button that issues that COM.
   - On an RMO slice: `rmo-data` on each value this SCR shows from the RMO. If the RMO is empty, leave the SCR area without `rmo-data` — there are no values to highlight (do not paint the table or its headers).
   - SPA: same `area`s every slice; `com-data` / `rmo-data` only on the live fields for that slice; still put `data-prop` on fields that can carry the name.
7. **Cards** — COM, RMO, EVT, ERR as in **Cards** (`dl.props` with one `div` per property for single objects; multi-row RMOs use `table.collection` blocks — caption the RMO name + other collection names only when there is more than one table). PRO as in **Processor card**. Every MBA **RMO** gets `data-emd-gwt="<id>"` pointing at **that card's** EMD GWT timeline (see **EMD GWT**). Same-title cards use distinct timeline ids.
8. **GWTs** — for each SLC that has timelines, fill `.cell.gwt` per **GWT**; otherwise leave the cell empty. On every SLC that features an MBA RMO, also emit that card's **EMD GWT** (full story once; delta-only when the same title appears again — see **EMD GWT**).
9. **Connectors** — leave every `.cell.connector` and `.cell.connector.connector-upper` empty. Do not hand-draw rails.
10. **Check** — `--slices` matches column count; every `data-joins` id exists; every `fromId:toId` has source `data-slc` strictly less than destination `data-slc` (no future→past wires); every COM-bound and RMO-fed SCR value has `data-prop` and the right highlight class; shafts unbroken through empty UBA/LBA cells on corridor slices; wizard NAV columns have **no** orphan pass-through shafts; every MBA RMO has `data-emd-gwt` matching its `.timeline.emd-gwt`; same-title later RMOs do **not** re-join earlier feeding EVTs and their EMD GWTs list only new EVTs; scripts present.

An `.emd` for the Electron app is steps 2–9 only (the `<main class="emd">` tree).

### Board help (`?`)

`diagram/settings.js` (and the app copy under `app/renderer/diagram/`) places a gear and a `?` in the sticky workflow-lane corner. The `?` opens **About this board**. Keep that popover complete and in sync with these instructions. It must explain:

- **Workflow** (top blue arrow) — story left to right; each column is one **SLC**: a command step, a read-model step, or navigation only (**NAV** — screen with no command or read model).
- **UBA** — actors and their screens (**SCR**) or automations (**PRO**).
- **MBA** — commands (**COM**, blue) and read models (**RMO**, green); empty in a NAV slice.
- **LBA** — events (**EVT**, orange) the system recorded, or an error (**ERR**, red) when a command failed instead; empty in RMO and NAV slices.
- **GWT** (bottom row) — optional given-when-then examples for that slice, as vertical timelines (no Given/When/Then labels). For a **COM**: events above the command are the Given, the command is the When, the event or error under it is the Then; another command of the same type on the same timeline builds on that history. For an **RMO**: read model, then event, then read model, … ending with the read model — so the reader sees how the projection changes as each event arrives (including lookup entries when the read model joins by id). Every read-model snapshot already shows the full shape (table headers or property names); empty means no rows yet. Each MBA **RMO** column also carries its **EMD GWT** for the clock scrubber (full story, or only new feeds when the same title appears again later).
- **Arrows** — data flow **only left → right in story time**: screen → command → event (or error), event → a **later** read model → screen, and a read model → a **later** screen when that view first loads (upper connector band). Never event → earlier read model or read model → earlier screen. Several events into the same read model stay on consecutive connector rows (bundled, not merged). Later screens that show the same values again do so by session or query convention — no second arrow. A **MAP** on an arrow names inputs → outputs when data changes shape.
- **SCR highlights** — on a COM slice, value fields the command takes from the screen are light blue (`.com-data` on the `input` / cell / value, not the property name), and the button that issues the COM is light blue too (the pressed row button when the screen is a multi-row RMO view); on an RMO slice, value fields the read model puts on the screen are light green (`.rmo-data`). A later copy of that same screen in the USR's timeline (e.g. Topic Ballot when casting a vote) keeps `data-prop` but omits `rmo-data` — the values are implied by navigation from the earlier view. Never paint labels, headers, or an empty RMO area. Screens show what people see (titles, names, invoice numbers, …), not technical join keys — those stay client-side for later COMs. Shared RMO views appear in every USR SWL that uses them.
- **Interaction** — hover a **card**, **connector piece** (JS tile/shaft or CSS shaft/arrow tile — not empty slice/gap space), or **property value** to keep that path lit and fade the rest; a property value (`dl.props` row, collection cell, or SCR field with `data-prop`) isolates **that example value** through its sources and destinations — same property name **and** same value (so one row in a multi-row RMO does not light sibling rows); MAP renames still follow the mapped outputs; a value a later SCR shows from session or query state (same name and value on an earlier SCR) is linked the same way even when it is not a COM field. Matching connectors stay lit and everything else fades. Empty column gaps are not hover targets (avoids path-focus while scrolling). Hover an **MBA RMO** to show a **clock** right-aligned in its title; **click** the clock to open a floating strip to the **left** of the card (above the board — the RMO does not move). The strip is **Start** plus only the EVTs this RMO **subscribes to** (its EMD GWT feeds, chained across same-title instances — including later feeds past this column; each later instance has its **own** timeline of **new** feeds only — never re-join earlier EVTs). Unrelated LBA EVTs never appear. Same-title GWTs keep updating toward the **final** projection; the card footprint is always that end state. This instance's feeding EVTs stay lit; pre-previous-instance and later-instance rows stay dimmed. The list **slides** past a fixed arrow; hover, scroll, or **Arrow Up / Arrow Down** to scrub; connectors into same-title RMOs light **cumulatively** through the walked hits (not the SCR); board hover is suspended while the simulator is open; click the clock again, click outside, or **Escape** to close and restore the final card. **Click** the hovered value, card, or MAP to **lock** that highlight so you can scroll and inspect it; release with the **padlock** (top right), by **clicking elsewhere** on the board, or **Escape**. Click a connector to scroll any end that is partly out of view into the viewport (connectors never lock a highlight). Use the gear to tune scale, fade, connector tile size, **hover delay** (0–5s; 0 is immediate — with delay > 0, leave keeps the highlight for that delay and the next hover target lights immediately), and **Highlight on hover** for connectors, values, and cards (each on by default).

When you change how an EMD is read (new slice type, GWT shape, card kinds), update both the terms/construction above and this help list (and the matching HTML in `settings.js`).

### Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>EMD</title>
  <link rel="stylesheet" href="../../diagram/diagram.css">
</head>
<body>
  <main
    class="emd"
    style="--slices: 4"
    data-joins="evt-registration-opened:rmo-signup-qr,rmo-signup-qr:scr-signup-form-pat-title"
  >
    <div class="sheet">
      <div class="board">
        <!-- lane + slice columns: UBA → connector-upper → MBA → connector → LBA → GWT -->
      </div>
    </div>
  </main>
  <script src="../../diagram/connectors.js"></script>
  <script src="../../diagram/settings.js"></script>
</body>
</html>
```

`main.emd` is the only scrollport. Do not scroll `body`/`window`. Dual connector bands and scroll performance live in the shared `diagram/` files — see **RMO → later SCR (upper band)** and **Scroll performance** in [`html-css.md`](html-css.md) for the CSS/JS contract and sample code. When regenerating a board after a `diagram/` change, bump `?v=` on the three links.

### Board rows

The board is one CSS grid. Column 1 is the lane labels. Each later column is one SLC, left to right. `--slices` is that column count. Emit every row left to right: the lane cell, then one cell per slice. Do not skip a slice. An empty cell is an empty `div`.

Row order, top to bottom:

1. Workflow. The lane is `emd-corner` and stays empty — `settings.js` puts the gear and `?` there. It must be the first lane in `.board`. Then one `.wfl` per workflow, not one per slice. `data-slc` is the first SLC of that workflow. `data-span` is how many slices it covers (the stylesheet spans 2 through 24; span 1 is a single column). The goal text goes in a `span`. Omit `continues`.
2. One UBA row per USR, top to bottom in the order the EMD lists them. Lane text is `<name> (<ROL>)`. `data-lane` is the name in kebab case (`jim`).
3. One **upper connector** row (between UBA and MBA). The lane is empty. Every `.cell.connector.connector-upper` stays empty; `connectors.js` draws RMO→later SCR joins there and the same-slice SCR↔COM / SCR↔RMO local vertical (bridges CSS shafts through the band, like COM→EVT on the lower connector).
4. One MBA row. The lane is empty.
5. One **lower connector** row (between MBA and LBA). The lane is empty. Every `.cell.connector` (without `connector-upper`) stays empty; `connectors.js` draws EVT→RMO, ERR→SCR, and the COM→EVT segment there.
6. One LBA row per SVC. The first service lane is `lba-head` (the gap aligns the name with the event cards). Later service lanes are plain `lane open` with the service name as text. Cells on the last service row also take `foot`. A single service is both: the lane is `lba-head`, and every cell is `lba foot`.
7. GWT, last. Lane text is `GWT`. One `.cell.gwt` per slice.

```html
<div class="cell lane emd-corner"></div>
<div class="cell wfl" data-slc="1" data-span="2"><span>Stock a bike</span></div>
<div class="cell wfl" data-slc="3" data-span="1"><span>Rent a bike</span></div>

<div class="cell lane open">Jim (Customer)</div>
<div class="cell uba" data-slc="1" data-lane="jim"></div>
<div class="cell uba" data-slc="2" data-lane="jim"></div>
<div class="cell uba" data-slc="3" data-lane="jim"></div>

<div class="cell lane open">Sam (Shop Clerk)</div>
<div class="cell uba" data-slc="1" data-lane="sam"></div>
<div class="cell uba" data-slc="2" data-lane="sam"></div>
<div class="cell uba" data-slc="3" data-lane="sam"></div>

<div class="cell lane open"></div>
<div class="cell connector connector-upper" data-slc="1"></div>
<div class="cell connector connector-upper" data-slc="2"></div>
<div class="cell connector connector-upper" data-slc="3"></div>

<div class="cell lane open"></div>
<div class="cell mba" data-slc="1"></div>
<div class="cell mba" data-slc="2"></div>
<div class="cell mba" data-slc="3"></div>

<div class="cell lane open"></div>
<div class="cell connector" data-slc="1"></div>
<div class="cell connector" data-slc="2"></div>
<div class="cell connector" data-slc="3"></div>

<div class="cell lane open lba-head">
  <div class="lba-head-gap" aria-hidden="true"></div>
  <div class="lba-head-label">Fleet</div>
</div>
<div class="cell lba" data-slc="1" data-lane="fleet"></div>
<div class="cell lba" data-slc="2" data-lane="fleet"></div>
<div class="cell lba" data-slc="3" data-lane="fleet"></div>

<div class="cell lane open foot">Rental</div>
<div class="cell lba foot" data-slc="1" data-lane="rental"></div>
<div class="cell lba foot" data-slc="2" data-lane="rental"></div>
<div class="cell lba foot" data-slc="3" data-lane="rental"></div>

<div class="cell lane open">GWT</div>
<div class="cell gwt" data-slc="1"></div>
<div class="cell gwt" data-slc="2"></div>
<div class="cell gwt" data-slc="3"></div>
```

Do not add a slice-number row. The first lane has to stay `emd-corner`.

Title every card with the name only (no `COM` / `EVT` prefix). Classes: `scr`, `pro`, `com`, `rmo`, `evt`, `err`. A mapping is `p.map` under the COM or RMO. GWT timeline cards reuse those classes, with no ids and no Given/When/Then labels.

### Ids and joins

Give every SCR, PRO, COM, RMO, EVT, and ERR an `id`: the class, a hyphen, then the name in kebab case (`evt-bike-received`). When the same name appears more than once, add one distinguisher, and do not put the slice number in the id:

- the actor, when different users record the same item (`evt-attendee-registered-pat`, `scr-signup-form-jordan`)
- `-empty`, when that copy's example value is empty (`scr-signup-form-jordan-empty`)
- `-error`, when that copy is the screen showing the ERR message (`scr-signup-form-jordan-error`)
- `-title`, when that copy is a NAV title-view that first reads an earlier RMO (`scr-signup-form-pat-title`)
- `-1`, `-2`, in order, when the same user repeats the same item (`evt-session-scheduled-1`, `com-schedule-session-2`)

On `<main class="emd">`, list every cross-slice arrow in `data-joins` as `fromId:toId`, comma-separated. **`data-joins` is the HTML rendering of the EMD timeline rule:** for every pair, the source card must sit in an **earlier** slice than the destination (`data-slc` of `fromId` strictly less than `data-slc` of `toId`). `connectors.js` will paint whatever you list — including illegal reverse-time hops — so do not emit a pair that points at the past.

- each `EVT → RMO` line: `evt-bike-received:rmo-bike-catalog` (lower connector band; EVT column left of RMO column)
- each `RMO → SCR` line when an RMO feeds a **later** SCR: `rmo-signup-qr:scr-signup-form-pat-title` (upper connector band; RMO left of SCR; same-slice SCR↔RMO stays out of `data-joins` — CSS shafts plus the upper-band local vertical)
- each `ERR → SCR` line (the screen in the next slice): `err-unknown-customer:scr-rent-bike-form` (lower band; ERR left of or equal story-order to the feedback SCR — usually the next column)

**Several EVTs → one RMO.** List **every** `EVT → RMO` edge for that read model (one pair per source EVT), and **only** EVTs whose slices are left of the RMO. Order those pairs by story order: **earliest EVT first**, then later EVTs that also feed the same RMO. `connectors.js` paints them as one **bundle** on the lower connector band — consecutive horizontal rows (not a single merged line), with leftness from the **first** EVT + that RMO — so other joins (e.g. an ERR→SCR) cannot sit between them.

```html
<main
  class="emd"
  style="--slices: 4"
  data-joins="evt-registration-opened:rmo-signup-qr,rmo-signup-qr:scr-signup-form-pat-title,err-name-required:scr-signup-form-jordan-error"
>
  <!-- board… -->
</main>
```

```html
<!-- Several EVTs project into RMO Topic Ballot: every edge, earliest EVT first -->
<main
  class="emd"
  style="--slices: 15"
  data-joins="
    evt-attendee-registered-pat:rmo-topic-ballot,
    evt-attendee-registered-riley:rmo-topic-ballot,
    evt-attendee-registered-jordan:rmo-topic-ballot,
    evt-topic-suggested-pat:rmo-topic-ballot,
    evt-topic-suggested-riley:rmo-topic-ballot,
    evt-topic-suggested-jordan:rmo-topic-ballot
  "
>
```

Leave every connector cell empty. Do not hand-build rails. `connectors.js` draws upper RMO→SCR, lower EVT→RMO and ERR→SCR, and the lower-band COM→EVT (or COM→ERR) vertical.

### Vertical shafts

A same-slice vertical is HTML. A cross-slice join is not.

- Under a SCR or PRO that issues a COM: shaft only (no arrowhead).
- Into a COM: shaft, then `arrow-down`.
- Under a COM, toward the connector: shaft only.
- Into an EVT or ERR: shaft, then `arrow-down`.
- Under an RMO: an empty `.gap`. JS draws `arrow-up` there.
- Under a SCR that reads an RMO in the same slice: `arrow-up`, then shaft.
- Through an empty UBA cell below that SCR (or PRO), and through an empty LBA cell above that EVT or ERR: shaft only, so the line does not break. Cells above the actor, and service rows below the event, stay empty.
- **NAV corridors** (full markup under **NAV slice**):
  - **Title-view** (RMO→later SCR): `arrow-up` + shaft under the SCR; shaft-only pass-throughs in empty UBA cells **below** that SCR.
  - **Error feedback** (ERR→SCR): shaft under the SCR; shaft-only pass-throughs below if other actor lanes sit under that SCR.
  - **Wizard** (Next/Finish only, no MBA card): SCR alone — **no** shaft under it and **no** pass-throughs in other lanes (orphans hang unconnected).
  - Cross-slice RMO→SCR is JS only inside the upper connector row — do not also draw that join through the UBA gap (the CSS shaft already covers it).

Every MBA cell that holds a card has a `.gap` above the card and a `.gap` below it, so COM and RMO tops line up. The upper gap stays compact; the lower gap takes the spare height.

### COM slice

SCR (or the PRO dock below) → COM → EVT. Put a MAP on `COM → EVT` between the COM and the lower gap.

```html
<!-- the USR who issues the COM -->
<div class="cell uba" data-slc="1" data-lane="alex">
  <article class="scr" id="scr-receive-bike-form">…</article>
  <div class="gap">
    <div class="arr v"><div class="shaft"></div></div>
  </div>
</div>
<!-- each user row below that USR, same slice -->
<div class="cell uba" data-slc="1" data-lane="pat">
  <div class="gap">
    <div class="arr v"><div class="shaft"></div></div>
  </div>
</div>

<div class="cell mba" data-slc="1">
  <div class="gap">
    <div class="arr v">
      <div class="shaft"></div>
      <div class="tile arrow-down"></div>
    </div>
  </div>
  <article class="com" id="com-rent-bike">…</article>
  <p class="map">Rental End: startDate, days → endDate</p>
  <div class="gap">
    <div class="arr v"><div class="shaft"></div></div>
  </div>
</div>

<!-- service rows above Rental, same slice: shaft only -->
<div class="cell lba" data-slc="1" data-lane="fleet">
  <div class="gap">
    <div class="arr v"><div class="shaft"></div></div>
  </div>
</div>
<div class="cell lba foot" data-slc="1" data-lane="rental">
  <div class="gap">
    <div class="arr v">
      <div class="shaft"></div>
      <div class="tile arrow-down"></div>
    </div>
  </div>
  <article class="evt" id="evt-bike-rented">…</article>
</div>
```

Omit `p.map` when that arrow has no MAP. A failed COM uses the same corridors and puts the ERR where the EVT would be:

```html
<article class="err" id="err-unknown-customer">…</article>
```

Add `err-unknown-customer:scr-rent-bike-form` to `data-joins`. The next slice is usually a NAV slice.

### RMO slice

Shaft down from the UBA into the RMO. Empty gap under the RMO. `arrow-up` then shaft under each SCR in this slice that shows the RMO. A MAP on `EVT → RMO` sits under the RMO, before the empty gap.

```html
<div class="cell uba" data-slc="2" data-lane="jim">
  <article class="scr" id="scr-bike-catalog">…</article>
  <div class="gap">
    <div class="arr v">
      <div class="tile arrow-up"></div>
      <div class="shaft"></div>
    </div>
  </div>
</div>

<div class="cell mba" data-slc="2">
  <div class="gap">
    <div class="arr v"><div class="shaft"></div></div>
  </div>
  <article class="rmo" id="rmo-signup-qr">…</article>
  <p class="map">Signup Url: signupToken → signupUrl</p>
  <div class="gap"></div>
</div>
```

Omit `p.map` when no MAP lands on this RMO. When several USRs show the same RMO, repeat the SCR (new id each time) and give each one the `arrow-up` gap. User cells between those screens and the MBA that have no screen of their own keep a shaft only.

List every EVT that feeds this RMO in `data-joins` (one `evt-…:rmo-…` per source) — only EVTs in **earlier** slices than this RMO. Earliest EVT first; `connectors.js` keeps those horizontals on consecutive bands (see **Ids and joins** / **Several EVTs → one RMO** in [`html-css.md`](html-css.md)).

### NAV slice

A screen and empty MBA and LBA. No COM, RMO, EVT, or ERR in this column. Emit empty upper and lower connector cells for the slice like every other column. Shafts follow the corridor (or lack of one) — three shapes:

| Kind | Shaft under SCR | Empty UBA cells below SCR | Typical join |
|---|---|---|---|
| **Wizard** (Next / Finish / area change) | none | bare empty `div`s (no pass-through) | none within-slice |
| **Error feedback** | shaft only | shaft-only pass-through if lanes sit under that SCR | `err-…:scr-…` (lower band) |
| **RMO title-view** | `arrow-up` then shaft | shaft-only pass-through below | `rmo-…:scr-…-title` (upper band) |

**Wizard** (SPA / setup step — Next or Finish only). No MBA card, no within-slice arrow. Do **not** put a shaft under the SCR or pass-through shafts in other actor lanes; they hang with nothing to join and look broken.

```html
<!-- SLC4 NAV — Setup Wizard after rooms; Next only (no COM) -->
<div class="cell uba" data-slc="4" data-lane="alex">
  <article class="scr" id="scr-setup-wizard-rooms-next">
    <!-- wire: Dates/Rooms done, Add+Next idle (no com-data) -->
  </article>
  <!-- no .gap / .shaft under this SCR -->
</div>
<!-- other actors: bare empty cells — no pass-through -->
<div class="cell uba" data-slc="4" data-lane="pat"></div>
<div class="cell uba" data-slc="4" data-lane="riley"></div>
<div class="cell uba" data-slc="4" data-lane="jordan"></div>
<div class="cell connector connector-upper" data-slc="4"></div>
<div class="cell mba" data-slc="4"></div>
<div class="cell connector" data-slc="4"></div>
<div class="cell lba foot" data-slc="4" data-lane="unconference"></div>
```

**Error feedback** (after a failed COM) — message only, no `rmo-data` / `com-data`. Shaft under the SCR; if the SCR is not on the bottom actor row, empty lanes below get shaft-only pass-throughs.

```html
<div class="cell uba" data-slc="12" data-lane="jim">
  <article class="scr" id="scr-rent-bike-form">…</article>
  <div class="gap">
    <div class="arr v"><div class="shaft"></div></div>
  </div>
</div>
<!-- if another USR row sits below jim in this slice: -->
<div class="cell uba" data-slc="12" data-lane="sam">
  <div class="gap">
    <div class="arr v"><div class="shaft"></div></div>
  </div>
</div>
<div class="cell connector connector-upper" data-slc="12"></div>
<div class="cell mba" data-slc="12"></div>
<div class="cell connector" data-slc="12"></div>
<div class="cell lba foot" data-slc="12" data-lane="rental"></div>
```

The ERR message is a `p.label` on this screen whose visible text is only the message (no `message` caption); keep `data-prop="message"` on the value so property hover links to the ERR card. The ERR card stays in the previous slice. Add `err-…:scr-…` to `data-joins` (lower band).

**RMO title-view** (first read of an earlier RMO before a later COM) — same screen layout as the later COM SCR (same fields and buttons). Values the RMO feeds get `rmo-data` + `data-prop`; other controls are present but empty and **not** `com-data` / `rmo-data` (no blue/green). List `rmo-…:scr-…-title` in `data-joins` (upper band). Later COM screens that show the same RMO values again keep `data-prop` (and may keep `rmo-data` for the green paint) but **omit** another join to the RMO. Under the SCR: `arrow-up` then shaft; empty actor lanes **below** that SCR get shaft-only pass-throughs (same rule as COM SCR→COM).

```html
<!-- SLC11 NAV — same Signup Form chrome as the COM slice; only title is RMO-fed -->
<div class="cell uba" data-slc="11" data-lane="alex"></div>
<div class="cell uba" data-slc="11" data-lane="pat">
  <article class="scr" id="scr-signup-form-pat-title">
    <h2>Signup Form</h2>
    <div class="wire">
      <div class="col">
        <p class="heading">Sign Up</p>
        <p class="label"><span class="rmo-data" data-prop="title">Adaptech Unconference 2026</span></p>
        <label class="text">Name <input data-prop="name" value="" readonly></label>
        <div class="row end"><button type="button">Sign up</button></div>
      </div>
    </div>
  </article>
  <div class="gap">
    <div class="arr v">
      <div class="tile arrow-up"></div>
      <div class="shaft"></div>
    </div>
  </div>
</div>
<!-- empty lanes below Pat: shaft only so the RMO→SCR corridor does not break -->
<div class="cell uba" data-slc="11" data-lane="riley">
  <div class="gap">
    <div class="arr v"><div class="shaft"></div></div>
  </div>
</div>
<div class="cell uba" data-slc="11" data-lane="jordan">
  <div class="gap">
    <div class="arr v"><div class="shaft"></div></div>
  </div>
</div>
<div class="cell connector connector-upper" data-slc="11"></div>
<div class="cell mba" data-slc="11"></div>
<div class="cell connector" data-slc="11"></div>
<div class="cell lba foot" data-slc="11" data-lane="unconference"></div>
```

```html
<!-- data-joins includes (among other edges): -->
<!-- rmo-signup-qr:scr-signup-form-pat-title -->
```

### Processor pair

A PRO is two adjacent slices. The RMO slice holds the gear dock that runs into the next column. The COM slice holds the gear and the PRO. Draw the gear only in the COM slice.

```html
<!-- RMO slice, that user's cell -->
<div class="cell uba" data-slc="4" data-lane="sam">
  <div class="gear-dock split">
    <div class="tile turn-br"></div>
    <div class="arr h"><div class="shaft"></div></div>
  </div>
  <div class="arr v fill"><div class="shaft"></div></div>
</div>

<!-- COM slice, same user -->
<div class="cell uba" data-slc="5" data-lane="sam">
  <div class="gear-dock">
    <div class="arr h">
      <div class="shaft"></div>
      <div class="tile arrow-right"></div>
    </div>
    <article class="pro" id="pro-bike-lister">…</article>
    <div class="balance" aria-hidden="true"></div>
  </div>
  <div class="gap">
    <div class="arr v"><div class="shaft"></div></div>
  </div>
</div>
```

The COM slice then continues like any COM slice (arrow into the COM, arrow into the EVT). User rows below the dock still carry a shaft. There is no `arrow-up` into a screen on the RMO slice of a processor pair.

### Cards

MBA **RMO** cards carry `data-emd-gwt` matching **that card's** EMD GWT timeline id (see **EMD GWT**). When the same title appears twice, each card points at its **own** timeline id — never both at one shared full timeline. COM cards do not need it.

```html
<article class="com" id="com-receive-bike">
  <h2>Receive Bike</h2>
  <dl class="props">
    <div><dt>bikeId</dt><dd>B-101</dd></div>
    <div><dt>serialNumber</dt><dd>SN-48213</dd></div>
  </dl>
</article>

<!-- first appearance: points at this phase's EMD GWT -->
<article class="rmo" id="rmo-agenda-builder" data-emd-gwt="emd-gwt-rmo-agenda-builder">
  <h2>Agenda Builder</h2>
  <div class="props">
    <table class="collection">
      <caption>unassigned</caption>
      <thead><tr><th>topicId</th><th>title</th><th>kind</th><th>voteCount</th></tr></thead>
      <tbody>
        <tr>
          <td data-prop="topicId">T-1</td>
          <td data-prop="title">Event Sourcing in Practice</td>
          <td data-prop="kind">presentation</td>
          <td data-prop="voteCount">2</td>
        </tr>
      </tbody>
    </table>
    <table class="collection">
      <caption>schedule</caption>
      <thead><tr><th>date</th><th>spanId</th><th>room</th><th>topicId</th><th>title</th></tr></thead>
      <tbody></tbody>
    </table>
  </div>
</article>

<!-- second appearance (same h2 title): distinct id + distinct data-emd-gwt;
     data-joins only the new EVTs (e.g. Session Scheduled), not the first phase -->
<article class="rmo" id="rmo-agenda-builder-2" data-emd-gwt="emd-gwt-rmo-agenda-builder-scheduled">
  <h2>Agenda Builder</h2>
  <div class="props">
    <table class="collection">
      <caption>unassigned</caption>
      <thead><tr><th>topicId</th><th>title</th><th>kind</th><th>voteCount</th></tr></thead>
      <tbody><!-- T-3, T-9 only --></tbody>
    </table>
    <table class="collection">
      <caption>schedule</caption>
      <thead><tr><th>date</th><th>spanId</th><th>room</th><th>topicId</th><th>title</th></tr></thead>
      <tbody><!-- S-1…S-8 rows --></tbody>
    </table>
  </div>
</article>

<article class="rmo" id="rmo-topic-ballot" data-emd-gwt="emd-gwt-rmo-topic-ballot">
  <h2>Topic Ballot</h2>
  <div class="props">
    <table class="collection">
      <caption>Topic Ballot</caption>
      <thead><tr><th>topicId</th><th>title</th><th>kind</th><th>name</th></tr></thead>
      <tbody>
        <tr>
          <td data-prop="topicId">T-1</td>
          <td data-prop="title">Event Sourcing in Practice</td>
          <td data-prop="kind">presentation</td>
          <td data-prop="name">Pat Lee</td>
        </tr>
      </tbody>
    </table>
    <table class="collection">
      <caption>lookups</caption>
      <thead><tr><th>attendeeId</th><th>name</th></tr></thead>
      <tbody>
        <tr><td data-prop="attendeeId">A-1</td><td data-prop="name">Pat Lee</td></tr>
      </tbody>
    </table>
  </div>
</article>

<article class="evt" id="evt-bike-received">
  <h2>Bike Received</h2>
  <dl class="props">
    <div><dt>bikeId</dt><dd>B-101</dd></div>
    <div><dt>serialNumber</dt><dd>SN-48213</dd></div>
  </dl>
</article>

<article class="err" id="err-unknown-customer">
  <h2>Unknown Customer</h2>
  <dl class="props">
    <div><dt>email</dt><dd>wrong@example.com</dd></div>
    <div><dt>message</dt><dd>No customer registered with that email</dd></div>
  </dl>
</article>

<p class="map">Rental End: startDate, days → endDate</p>
```

One `div` per property, name in `dt`, example value in `dd`. When an RMO holds many example rows (collections of objects), put each collection in a `table.collection` inside `div.props`: `<th>` headers list the property names once, and each body `<td data-prop="…">` holds an example value — the same names the SCR table columns and EVT fields use. If the card has **one** table, omit `<caption>` — the RMO's `h2` is the name. If it has **more than one**, give every table a `<caption>`: one caption is the RMO name (the main collection), and each other collection gets its own name (e.g. `lookups`). When the RMO projects EVTs that refer to another entity by id, keep a **lookups** table for that entity's descriptions (`topicId` + `title` + `kind`, or `attendeeId` + `name` — never a synthetic `lookup A-1` key), filled from the entity's own EVTs as they arrive, even for ids that never appear on a later main-collection row. The main collection carries the foreign id and may repeat the looked-up fields on each row for the denormalized view; do not pack row fields into one middot string under the id. A single-object RMO stays a flat `dl.props` list (no table). A TODO read model keeps `TODO` in the name. An ERR card is that property list. A clause before the colon in the EMD (the check) is not a paragraph on the card or on the GWT card; each fact it uses is a named property, and a property the check found empty is listed with an empty value. A MAP names properties only: no `MAP` prefix, no values, no formula.

### Screen

A SCR is `article.scr` plus one `.wire`. Build the wire from the EMD's nested sketch, top to bottom. `readonly` and `disabled` keep it from being a working form. A button's text is only the word the person sees; leave off `→` and the COM or SCR it names.

**What belongs on the wire.** Only values the person reads or types, with captions written the way a product UI would phrase them. Do **not** draw technical join keys (`attendeeId`, `topicId`, `eventId`, opaque tokens) as labels or table columns on the SCR — those stay on the COM / EVT / RMO cards (and as client-side hidden data with the screen). Do **not** print schema property names as captions either (`title`, `message`, `dailyRate`, `signupUrl`, …): show the value alone when it is self-evident, or a UX label (`Name`, `Email`, `Daily rate`, `Signup link`). Schema names stay only on `data-prop` for visible fields (and on COM / EVT / RMO cards). If the COM needs a technical id from the RMO row the person acted on, that id is client-side hidden data — not a wire column; the wire still shows the human wording (topic title text, not `topicId`). Exception: an identifier people use as themselves (invoice / order / confirmation number).

**Same SCR across slices.** When a COM is issued from an RMO view (Vote on Topic Ballot, Register on Unregistered Bikes), every slice that shows that screen uses the **same wire layout** — same heading, columns, and rows. Do not collapse the COM slice to a one-row stub that exposes the join id. On the COM slice, mark the control that was pressed (`Vote (pressed)` in the EMD → `com-data` on that button only); other row buttons stay plain. If that USR already saw this screen with `rmo-data` earlier in their timeline (the RMO slice just before their COM), the COM-slice copy keeps `data-prop` on the values but **omits `rmo-data`** — the green paint is for the first RMO feed; later copies imply the same data by navigation / session.

An SPA is still one SCR per slice: same screen name and the same areas in every column, with only the example values (and highlights below) changing. Put each region of that page in an `area` so Add / Open / Done (or similar) stay visible as one layout left to right. A **wizard** is an SPA whose areas are steps (Dates → Rooms → Session times). Dates are one COM: Start and End (`startDate` / `endDate`); the inclusive range is every day sessions may use. Rooms and session times still append with Add. **Add** in the active area is a COM (same rule as Todo App Add): `com-data` on the live input(s) and on the Add button; list grows with prior values as plain labels. The **first** item in an area shows Add only. After that item is in, **Add** and **Next** (or **Finish** on the last area) both stay in the area — the person may add another item or leave the step. **Next** / **Finish** only changes area (NAV — no `com-data`). Earlier steps stay visible as done (labels, no `com-data` / no `rmo-data` once carried); later areas stay idle (legend only) so the layout does not collapse. A schedule builder may use two radio groups on one screen — one radio per empty grid cell, one radio per unassigned session — plus Schedule to issue the COM from the two selections.

**COM / RMO highlights on the SCR.** Paint the data values that move on that slice's arrow — not the property name, chrome, or headings. On a COM slice, also paint the action button that issues the COM (the pressed one when several row buttons exist).

- **COM slice:** every **visible** value the COM takes from this SCR gets class `com-data` (light blue). Put it on the value field only: the `input` or `select`, a `td`, or a `span` around the value inside a `p.label`. Never put it on the outer `label` — that paints the property name too. Never put `com-data` on a technical id column that should not be on the wire. The button that issues the COM also gets `com-data` (same light blue): `<button type="button" class="com-data">Vote</button>` — only the pressed row's button when the table has one per row. A button that only navigates to another SCR does not. When this COM SCR continues an earlier RMO-fed SCR in the same USR timeline, keep `data-prop` on the carried values but do **not** repeat `rmo-data` on them.
- **RMO slice:** every value this SCR shows from the RMO gets class `rmo-data` (light green), on those same value fields (`input` / `select` / `td` / value `span`). Never put `rmo-data` on property-name text, `th` headers, legends, headings, or buttons. When the RMO is empty, omit `rmo-data` entirely on that SCR — highlighting is for values only, and an empty projection has none.

Never mix `com-data` and `rmo-data` on the same field. A NAV **error** screen has neither (message only). A NAV **title-view** that first reads an earlier RMO puts `rmo-data` on those fed value fields (see **NAV slice**).

**`data-prop` (required for property hover).** Every SCR value that is a named property also gets `data-prop="<name>"` on that same value field — the same names as the COM / RMO / EVT `dt`s and collection headers. `connectors.js` traces by property name **and** example value (plus MAP notes for renames), so hovering one cell in a multi-row RMO collection or SCR table lights only that value wherever it flows — not every sibling row's same field — and fades the rest. Flat card `dl.props` rows need no extra attribute; the `dt` is the name and the `dd` is the value. Collection body cells carry `data-prop` on each `td`. On an SPA, put `data-prop` on every area that can show that property, and keep `com-data` / `rmo-data` only on the live fields for that slice — the tracer prefers those live fields when linking the screen to the COM or RMO.

Named value fields **always** carry `data-prop`. Add `com-data` or `rmo-data` when that slice's COM or RMO owns the value (see above). Idle SPA fields keep `data-prop` only.

| EMD line | Markup |
|---|---|
| heading Rent Bike | `<p class="heading">Rent Bike</p>` |
| column | `<div class="col">…</div>` |
| row | `<div class="row">…</div>` |
| row, right-aligned | `<div class="row end">…</div>` |
| area Add | `<fieldset class="area"><legend>Add</legend>…</fieldset>` |
| group Bike | `<fieldset class="group"><legend>Bike</legend>…</fieldset>` |
| group Bike (read only) | the same fieldset; children are `p.label` / value `span`s, not inputs |
| label (model) = Trailblazer 29 (self-evident) | `<p class="label"><span data-prop="model">Trailblazer 29</span></p>` |
| label Model (model) = Trailblazer 29 | `<p class="label">Model <span data-prop="model">Trailblazer 29</span></p>` |
| text box Name (name) = Pat Lee | `<label class="text">Name <input data-prop="name" value="Pat Lee" readonly></label>` |
| text box Name (name) = (empty) | `<label class="text">Name <input data-prop="name" value="" readonly></label>` |
| dropdown Kind (kind) = presentation | `<label class="dropdown">Kind <select data-prop="kind" disabled><option>presentation</option></select></label>` |
| date picker Start (startDate) = 2026-10-22 | `<label class="date">Start <input data-prop="startDate" value="2026-10-22" readonly></label>` |
| check box I agree (agree) = yes | `<label class="check">I agree <input type="checkbox" data-prop="agree" checked disabled></label>` |
| radio Morning (spanId) = morning (selected) | `<label class="radio">Morning <input type="radio" name="spanId" data-prop="spanId" value="morning" checked disabled></label>` |
| radio cell in a schedule grid | same `label.radio` inside the `td`; one `name` for all schedule cells (e.g. `name="cell"`), another `name` for unassigned session radios (e.g. `name="topic"`); only the selected radios are `checked`; on a COM slice put `com-data` on the checked inputs that the COM takes (and on Schedule) |
| table | one `table`; header cells are UX column titles (not schema names or join keys); one `tr` per example row; each body `td` that is a named property gets `data-prop` |
| button Rent → COM Rent Bike | `<button type="button" class="com-data">Rent</button>` on a COM slice |
| button Add (pressed) → COM Add Conference Date | `<button type="button" class="com-data">Add</button>` plus `com-data` on the live date/room/span inputs; after the first item, also show plain `Next` / `Finish` in the same row |
| button Vote (pressed) → COM Cast Vote | same full table as the RMO slice; only that row's `<button type="button" class="com-data">Vote</button>`; other Vote buttons have no `com-data` |
| button Next (pressed) → SCR Setup Wizard (Rooms) | same area with Add + Next; `<button type="button">Next</button>` only (NAV — no `com-data`) |
| button Register → SCR Register Bike Form | `<button type="button">Register</button>` (navigation — no `com-data`) |
| COM takes title from the SCR | also `com-data` on the value: `<input class="com-data" data-prop="title" value="Buy milk" readonly>` |
| RMO fills a table cell | also `rmo-data` on the cell: `<td class="rmo-data" data-prop="title">Buy milk</td>` |
| COM takes a label value | wrap the value: `<p class="label">Model <span class="com-data" data-prop="model">Trailblazer 29</span></p>` |

COM-slice form (values the COM takes are light blue):

```html
<article class="scr" id="scr-rent-bike-form">
  <h2>Rent Bike Form</h2>
  <div class="wire">
    <div class="col">
      <p class="heading">Rent Bike</p>
      <fieldset class="group"><legend>Bike</legend>
        <div class="row">
          <p class="label"><span class="com-data" data-prop="model">Trailblazer 29</span></p>
          <p class="label">Daily rate <span data-prop="dailyRate">25.00</span></p>
        </div>
      </fieldset>
      <fieldset class="group"><legend>Customer</legend>
        <label class="text">Email <input class="com-data" data-prop="email" value="jim@example.com" readonly></label>
      </fieldset>
      <fieldset class="group"><legend>Dates</legend>
        <div class="row">
          <label class="date">Start <input class="com-data" data-prop="startDate" value="2026-10-22" readonly></label>
          <label class="text">Days <input class="com-data" data-prop="days" value="3" readonly></label>
        </div>
      </fieldset>
      <div class="row end">
        <button type="button" class="com-data">Rent</button>
      </div>
    </div>
  </div>
</article>
```

RMO-slice table (values from the RMO are light green). The button column has an empty header and no `com-data` on those buttons (they navigate or wait for a later COM slice). Put one body row per example row in the EMD.

```html
<article class="scr" id="scr-bike-catalog">
  <h2>Bike Catalog</h2>
  <div class="wire">
    <div class="col">
      <p class="heading">Bikes</p>
      <table>
        <thead><tr><th>Model</th><th>Type</th><th>Daily rate</th><th></th></tr></thead>
        <tbody>
          <tr>
            <td class="rmo-data" data-prop="model">Trailblazer 29</td>
            <td class="rmo-data" data-prop="type">Mountain</td>
            <td class="rmo-data" data-prop="dailyRate">25.00</td>
            <td><button type="button">Rent</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</article>
```

A NAV screen shows the ERR message under the field that failed — value only (self-evident), with `data-prop="message"` so hover links to the ERR card (no `com-data` / `rmo-data`):

```html
<label class="text">Email <input data-prop="email" value="wrong@example.com" readonly></label>
<p class="label"><span data-prop="message">No customer registered with that email</span></p>
```

An SPA: one screen, several `area`s. Repeat the same layout in every slice; only values and highlights change. COM slice — light blue on what the command takes. RMO slice — light green on what the read model shows.

```html
<!-- COM slice: Add Todo takes title from the Add area -->
<article class="scr" id="scr-todo-app-add">
  <h2>Todo App</h2>
  <div class="wire">
    <div class="col">
      <fieldset class="area"><legend>Add</legend>
        <label class="text">Title <input class="com-data" data-prop="title" value="Buy milk" readonly></label>
        <div class="row end"><button type="button" class="com-data">Add</button></div>
      </fieldset>
      <fieldset class="area"><legend>Open</legend>
        <table>
          <thead><tr><th>todoId</th><th>title</th><th></th></tr></thead>
          <tbody></tbody>
        </table>
      </fieldset>
      <fieldset class="area"><legend>Done</legend>
        <table>
          <thead><tr><th>todoId</th><th>title</th></tr></thead>
          <tbody></tbody>
        </table>
      </fieldset>
    </div>
  </div>
</article>

<!-- RMO slice: Open Todos fills the Open area -->
<article class="scr" id="scr-todo-app-open">
  <h2>Todo App</h2>
  <div class="wire">
    <div class="col">
      <fieldset class="area"><legend>Add</legend>
        <label class="text">title <input data-prop="title" value="" readonly></label>
        <div class="row end"><button type="button">Add</button></div>
      </fieldset>
      <fieldset class="area"><legend>Open</legend>
        <table>
          <thead><tr><th>todoId</th><th>title</th><th></th></tr></thead>
          <tbody>
            <tr>
              <td class="rmo-data" data-prop="todoId">T-1</td>
              <td class="rmo-data" data-prop="title">Buy milk</td>
              <td><button type="button">Complete</button></td>
            </tr>
          </tbody>
        </table>
      </fieldset>
      <fieldset class="area"><legend>Done</legend>
        <table>
          <thead><tr><th>todoId</th><th>title</th></tr></thead>
          <tbody></tbody>
        </table>
      </fieldset>
    </div>
  </div>
</article>
```

The same screen on several users is a separate `article.scr` in each of those lanes, each with its own id.

### Processor card

```html
<article class="pro" id="pro-bike-lister">
  <h2>Bike Lister</h2>
  <svg class="gear" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.39 1.04.7 1.63.94l.36 2.54c.05.24.26.42.49.42h3.8c.23 0 .44-.18.49-.42l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/>
  </svg>
</article>
```

The name sits above the gear. The card shows no properties. It lives in the COM slice's gear dock, in the UBA of the USR who waits on it.

### EMD GWT

The MBA only shows an RMO at the slices where it appears — not after every feeding EVT. Each MBA RMO card needs an **EMD GWT** in that column's `.cell.gwt` so the clock scrubber has a timeline: `RMO → EVT → RMO → … → RMO`. Mark it with an `EMD GWT` label and `class="timeline emd-gwt"` plus a stable `id`. That card's `data-emd-gwt` points at **that** id (not a hidden bank).

In the EMD markdown, name each block `EMD GWT timeline (RMO …):` on that SLC (same card list as any RMO GWT). Other optional slice GWTs may still exist; only the marked EMD GWT drives the scrubber for that card.

**One appearance:** empty structure first, then one snapshot after every feeding EVT in story order (the full implied projection).

**Same title again later** (Agenda Builder after Schedule Session; Registrations again for an organizer Attendees screen):

1. Give the later MBA card a **new** `id` and a **distinct** `data-emd-gwt` / timeline id (same `h2` title so the scrubber can chain the family).
2. `data-joins` on the later card list **only the new** feeding EVTs — do **not** re-join EVTs the earlier same-title card already owns.
3. The later EMD GWT **starts from the prior footprint** (final RMO snapshot of the earlier phase), then interleaves **only those new** EVTs. Do **not** replay earlier EVTs on that timeline, and do **not** point both MBA cards at one shared full timeline — either mistake makes the history walker show the same EVT twice.
4. Catalog / arrows: note that the later slice projects only the new EVTs on top of the prior state.

**Scrubber strip (runtime):** Start + **only the EVTs that RMO family subscribes to** (each instance's EMD GWT / `data-joins`). Unrelated LBA EVTs never appear. Same-title EMD GWTs are chained so you can walk past this column; this instance's feeds stay lit, other subscribed rows are dimmed, and the card footprint is the family's **final** projection. GWT EVT cards used for matching must carry the same identifying prop values as the board EVTs (e.g. the real `attendeeId` on each Topic Suggested). `diagram/connectors.js` also skips a board EVT id already taken from an earlier family GWT (safety net — still author delta GWTs correctly).

```html
<!-- single appearance: full story -->
<div class="cell gwt" data-slc="2">
  <div class="emd-gwt-label">EMD GWT</div>
  <div class="timeline emd-gwt" id="emd-gwt-rmo-unregistered-bikes">
    <article class="rmo"><h2>Unregistered Bikes</h2>…<!-- empty structure --></article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="evt"><h2>Bike Received</h2>…</article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="rmo"><h2>Unregistered Bikes</h2>…<!-- one row --></article>
  </div>
</div>

<!-- same title twice: first phase (Pat only) — MBA: id="rmo-registrations"
     data-emd-gwt="emd-gwt-rmo-registrations"
     data-joins: evt-attendee-registered-pat:rmo-registrations -->
<div class="cell gwt" data-slc="13">
  <div class="emd-gwt-label">EMD GWT</div>
  <div class="timeline emd-gwt" id="emd-gwt-rmo-registrations">
    <article class="rmo"><h2>Registrations</h2>
      <div class="props">
        <table class="collection">
          <thead><tr><th>attendeeId</th><th>name</th><th>eventId</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="evt"><h2>Attendee Registered</h2>
      <dl class="props">
        <div><dt>attendeeId</dt><dd>A-1</dd></div>
        <div><dt>eventId</dt><dd>E-1</dd></div>
        <div><dt>name</dt><dd>Pat Lee</dd></div>
      </dl>
    </article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="rmo"><h2>Registrations</h2>…<!-- A-1 | Pat Lee | E-1 --></article>
  </div>
</div>

<!-- later phase (Riley + Jordan only) — MBA: id="rmo-registrations-2"
     data-emd-gwt="emd-gwt-rmo-registrations-attendees"
     data-joins: evt-attendee-registered-riley:rmo-registrations-2,
                 evt-attendee-registered-jordan:rmo-registrations-2
     (no Pat re-join; opening snapshot = SLC13 final) -->
<div class="cell gwt" data-slc="20">
  <div class="emd-gwt-label">EMD GWT</div>
  <div class="timeline emd-gwt" id="emd-gwt-rmo-registrations-attendees">
    <article class="rmo"><h2>Registrations</h2>…<!-- A-1 | Pat Lee | E-1 --></article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="evt"><h2>Attendee Registered</h2>
      <dl class="props">
        <div><dt>attendeeId</dt><dd>A-2</dd></div>
        <div><dt>eventId</dt><dd>E-1</dd></div>
        <div><dt>name</dt><dd>Riley Ng</dd></div>
      </dl>
    </article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="rmo"><h2>Registrations</h2>…<!-- Pat + Riley --></article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="evt"><h2>Attendee Registered</h2>
      <dl class="props">
        <div><dt>attendeeId</dt><dd>A-3</dd></div>
        <div><dt>eventId</dt><dd>E-1</dd></div>
        <div><dt>name</dt><dd>Jordan Ortiz</dd></div>
      </dl>
    </article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="rmo"><h2>Registrations</h2>…<!-- Pat + Riley + Jordan --></article>
  </div>
</div>
```

Scrubber UX (implemented by `diagram/connectors.js`): hover MBA RMO → clock in the `h2` → click opens Start + **subscribed feeds only** in a floating overlay **to the left** of the card (appended to `document.body` — EVT tape and the fixed pin arrow share that overlay layer and never enter the board grid). The MBA card **grows to at least the last same-title instance’s box**, then further if any scrub snapshot needs more height/width (e.g. a full unassigned list before rows move into schedule), so tables keep formatting without clipped rows or a wrapped last column. Growth is absorbed by the MBA cell’s bottom flex gap (the connector row does not shift); inbound shafts are **re-aimed synchronously** at the new RMO bottom after layout, and again on close. Same-title EMD GWTs chain so later feeds stay walkable; footprint = final projection; this instance's feeds lit, other subscribed rows dimmed; hover, scroll, or Arrow Up/Down to step; clock again, click outside, or Escape closes and restores the final markup. Sample RMO markup with `data-emd-gwt` is under **Cards** above; there is no separate HTML for the floating strip — JS builds it from the EMD GWT + board EVTs.

### GWT (below the LBA)

One cell per slice. A SLC may have no timelines, or many GWTs on one or more vertical timelines. Stack EVT / COM / EVT (or RMO) cards top to bottom inside each `.timeline`, with a down-arrow corridor (`.arr.v` → shaft + `arrow-down`) between every consecutive card. For a COM: EVTs above it are the Given, the COM is the When, the EVT (or ERR) right under it is the Then. When GWTs share the same timeline, the previous COM's or RMO's Given EVTs and Then EVTs are included as the next When's Given. Separate `.timeline` stacks do not share that history. For an RMO: start with the RMO, then EVT, RMO, EVT, …, RMO — the RMO at the beginning, between every EVT, and at the end — so each RMO card shows the projection after that EVT (including lookup entries when the RMO joins); the EVTs are the Given, and a joined EVT carries the join id. **Do not emit a bare `<article class="rmo"><h2>…</h2></article>` for an empty snapshot.** Match the MBA card's shape from the first GWT RMO onward: multi-collection RMOs get every `table.collection` with `<thead>` (and captions when there is more than one table) and an empty `<tbody>`; single-object RMOs get `dl.props` with every `dt` and blank `dd`. Later snapshots only add or fill body rows / values — they never introduce a new table or property name mid-timeline.

```html
<!-- one GWT for a COM (no prior EVTs); down arrows between cards -->
<div class="cell lane open">GWT</div>
<div class="cell gwt" data-slc="1">
  <div class="timeline">
    <article class="com"><h2>Receive Bike</h2>…</article>
    <div class="arr v">
      <div class="shaft"></div>
      <div class="tile arrow-down"></div>
    </div>
    <article class="evt"><h2>Bike Received</h2>…</article>
  </div>
</div>

<!-- two GWTs on one shared timeline (second When's Given = first's Given EVTs + Then EVTs) -->
<div class="cell gwt" data-slc="13">
  <div class="timeline">
    <article class="evt"><h2>Customer Registered</h2>…</article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="com"><h2>Rent Bike</h2>…</article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="evt"><h2>Bike Rented</h2>…</article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="com"><h2>Rent Bike</h2>…</article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="evt"><h2>Bike Rented</h2>…</article>
  </div>
</div>

<!-- RMO: first card already has the table headers (empty tbody); later cards fill rows -->
<div class="cell gwt" data-slc="2">
  <div class="timeline">
    <article class="rmo"><h2>Unregistered Bikes</h2>
      <div class="props">
        <table class="collection">
          <thead><tr><th>bikeId</th><th>serialNumber</th><th>model</th><th>type</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="evt"><h2>Bike Received</h2>…</article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="rmo"><h2>Unregistered Bikes</h2>…<!-- same headers + one body row --></article>
  </div>
</div>

<!-- Multi-collection RMO: every snapshot includes every table (empty tbody until rows arrive) -->
<div class="cell gwt" data-slc="15">
  <div class="timeline">
    <article class="rmo"><h2>Topic Ballot</h2>
      <div class="props">
        <table class="collection">
          <caption>Topic Ballot</caption>
          <thead><tr><th>topicId</th><th>title</th><th>kind</th><th>name</th></tr></thead>
          <tbody></tbody>
        </table>
        <table class="collection">
          <caption>lookups</caption>
          <thead><tr><th>attendeeId</th><th>name</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="evt"><h2>Attendee Registered</h2>…</article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="rmo"><h2>Topic Ballot</h2>…<!-- same two tables; main still empty; lookups has a row --></article>
  </div>
</div>

<!-- Single-object RMO: empty card still lists every property with blank dd -->
<div class="cell gwt" data-slc="14">
  <div class="timeline">
    <article class="rmo"><h2>Rental Confirmation</h2>
      <dl class="props">
        <div><dt>rentalId</dt><dd></dd></div>
        <div><dt>bike</dt><dd></dd></div>
        <div><dt>name</dt><dd></dd></div>
        <div><dt>startDate</dt><dd></dd></div>
        <div><dt>endDate</dt><dd></dd></div>
        <div><dt>days</dt><dd></dd></div>
        <div><dt>total</dt><dd></dd></div>
      </dl>
    </article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="evt"><h2>Bike Rented</h2>…<!-- includes customerId --></article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="rmo"><h2>Rental Confirmation</h2>…<!-- same dts; values filled as EVTs arrive --></article>
  </div>
</div>

<!-- COM GWT whose Then is an ERR -->
<div class="cell gwt" data-slc="11">
  <div class="timeline">
    <article class="com"><h2>Rent Bike</h2>…</article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="err"><h2>Unknown Customer</h2>…</article>
  </div>
</div>

<!-- two timelines in one slice; they do not share history -->
<div class="cell gwt" data-slc="8">
  <div class="timeline">
    <article class="com"><h2>Register Attendee</h2>…</article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="evt"><h2>Attendee Registered</h2>…</article>
  </div>
  <div class="timeline">
    <article class="com"><h2>Register Attendee</h2>…</article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="err"><h2>Already Registered</h2>…</article>
  </div>
</div>

<!-- slice with no GWTs -->
<div class="cell gwt" data-slc="5"></div>
```

Each GWT card uses the same `h2` and `dl.props` as the cards above, with the example values from that step of the timeline, and no `id`. An empty RMO at the start of a timeline is the `h2` only. A slice with no GWTs is an empty `.cell.gwt`.

### What the board scripts provide

Do not reimplement these in the `.emd.html` file — only include the two scripts from **Page** (and link the shared `diagram/diagram.css`). Future boards get scroll smoothness and hover behaviour by linking those files, not by copying logic into each project:

| Script | Behaviour |
|---|---|
| `diagram/connectors.js` | Fills empty `.cell.connector.connector-upper` (RMO→later SCR) and `.cell.connector` (EVT→RMO, ERR→SCR, COM→EVT / COM→ERR) cells; hover on cards / connectors / property values (`dt` or `data-prop`) fades the rest; click a hovered value, card, or MAP to lock that highlight (padlock, click elsewhere, or Escape to release); click a connector to scroll clipped ends into view (no lock); respects gear **Highlight on hover** prefs; **scroll guard** toggles `.is-scrolling`, freezes hover clear/paint while flinging, defers ResizeObserver retiles until idle, and fires soft `emd:retile-check` (redraw only when board size actually changed) |
| `diagram/settings.js` | Gear + `?` in the `emd-corner` lane; scale, fade, tile size, hover delay, and Highlight on hover (connectors / values / cards); About-this-board help (keep in sync with **Board help**); scale/tile fire forced `emd:retile` |

Tile files, sticky-row measurements, corridor continuity, and the **Scroll performance** CSS/JS samples are in [`html-css.md`](html-css.md). That file is a stylesheet lookup — **this HTML board section is the source of truth for markup**.

For more on event modeling itself, see: [eventmodeling.org](https://eventmodeling.org).
