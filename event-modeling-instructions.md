# Instructions: How to Construct an Event Modeling Diagram (EMD)

This document uses three-letter abbreviations to identify each component and concept. Each term is defined using only the terms listed above it, so the list can be read from top to bottom.

Event Modeling Diagrams (EMDs) describe information systems and processes using a clear, timeline-based approach built from vertical slices (SLCs). It is like a wire frame diagram but with more elements to track information flow and state behind the scenes. It is also specification by example: a slice may carry no given-when-thens (GWTs) or many, drawn below the lower band. The GWTs are represented on one or more vertical timelines. When GWTs share the same timeline, the previous COM's or RMO's (depending on the type of SLC) Given EVTs and Then EVTs are included as the next When's Given. Separate timelines in the same slice do not share that history. The implementation for a system described by an EMD will show the same behaviour as shown in the EMD. Learn the terms below, then follow the steps after them to construct an EMD. When the model is ready, draw it as a browser board named `<name>.emd.html` (see **HTML board** below). The full markup lookup lives in [`html-css.md`](html-css.md).

## Terms:
Basic terms, which need no other terms:
  - ROL: a role - a set of permissions, behaviors, and responsibilities typically assigned to a user within the system. Examples include "Customer", "Administrator", "Pharmacist", each defining the allowed actions and access to different features.
  - EVT: an event - this is a fact, decision and/or new information in the system. it's the only way that state is captured by the system. They are immutable so they cannot be edited, renamed or deleted. An EVT holds no redundant data; it is in third normal form (3NF): every property depends on the EVT's own key alone, so it refers to another entity by its id (e.g., customerId) and never copies that entity's properties (e.g., the customer's name).
  - SWL: swim lane - a horizontal row with a label on its left.

Terms built from the basic terms:
  - USR: a user - this is the instance of a ROL in the system. You can have more than one instance of a ROL. example 2 customers Jim and Bob.
  - COM: a command - an instruction to the system that results in a state change, recorded as an EVT.
  - RMO: read model - a projection of state from existing EVTs to the left on the diagram. All the EVTs an RMO projects must live in the same SWL, so it is known where the implementation of that RMO lives. An RMO joins the EVTs it projects by their shared ids, so it is where the properties of several entities are shown together (e.g., an invoice showing the customer's name next to the rental, joined by customerId).
  - SVC: a service - a physical or logical grouping of state, tracked by EVTs in a SWL.

Terms built from those:
  - SCR: a screen - a UI that a USR will interact with in order to view the data of an RMO or to issue a COM.
  - PRO: a processor - it's an automation instead of a USR doing something manually. It works from an RMO that lists its tasks, which has TODO in its name, and it issues COMs. A PRO is always expressed as two SLCs beside one another: an RMO slice in which it reads its TODO RMO, immediately followed by a COM slice in which it issues the COM for that task.
  - MAP: a mapping - a named dependency that shows which input properties one or more output properties come from, written as `MAP <name>: <inputs> → <outputs>` (e.g., `MAP Full Name: firstName, lastName → name`). A MAP sits on an arrow where data changes shape between two items. It can sit in two places: on COM → EVT (the COM carries the inputs and the EVT records the outputs), or on EVT → RMO (the EVTs carry the inputs and the RMO shows the outputs). A SCR or PRO never maps; it only passes data on to the COM as it is. A MAP shows one of three things: a new property appears from a combination of source properties (`MAP Rental Total: days, dailyRate → total`), new properties appear from a single source property that is split (`MAP Name Parts: name → firstName, lastName`), or a property is used to adjust another property, which keeps its name (`MAP Discounted Total: discount, total → total`). In every case the MAP is what accounts for the data on both sides: it is the source of each output property, which exists nowhere before the head of the arrow, and it is the destination of each input, which would otherwise look unused. A MAP shows only the data path, never the particular data and never the calculation or transformation: it names properties, not values. The example values are read from the items at either end of the arrow (the COM or EVTs at the tail, the EVT or RMO at the head), and how one becomes the other is left to the implementer, since an EMD holds no implementation. A MAP records nothing and holds no state; the same inputs always give the same outputs, and each output is traced back to its inputs.
  - ERR: an error - marks the failure of a COM. It is not an EVT, so it records nothing. It sits in the LBA of the SLC whose COM failed, in the SWL of the SVC that would have changed, and it sends control back to the SCR or PRO that issued the COM. It names the recorded facts the COM was checked against. A SLC holds an EVT or an ERR, never both.

Bands, which are made of SWLs:
  - UBA: upper band - one SWL per USR, labeled with that USR. The row holds the SCRs and PROs that USR sees, uses, or waits on.
  - MBA: middle band - a single SWL. Each position in that row houses either a COM or an RMO.
  - LBA: lower band - one SWL per SVC (at minimum one SWL), labeled with that SVC. The row holds the EVTs of that SVC.

Structures built from the bands:
  - SLC: slice - a column that spans all bands (the UBA, the MBA and the LBA) and is one step in a process. A SLC has one position in the MBA. That position may hold a COM (COM slice), an RMO (RMO slice), or nothing. A COM slice also has a PRO or SCR in the UBA and one item in the LBA: the EVT the COM recorded when it passed, or the ERR it failed with (an ERR is shown instead of an EVT; a SLC never holds both). An RMO slice has an optional PRO or SCR in the UBA and nothing in the LBA. A NAV slice has a SCR (or PRO) in the UBA and nothing in the MBA or LBA — navigation or showing an ERR message after a failed COM, with no command and no read model.
  - GWT: given-when-then - a specification example that describes the COM or the RMO of one SLC. A SLC may carry no GWTs or many. When a SLC carries GWTs, they are drawn below the LBA in that column on one or more vertical timelines, top to bottom. Each GWT is read from its timeline, not written as separate Given/When/Then labels. For a COM: zero or more EVTs sit above the COM (those are the Given); the COM is the When; the EVT immediately below the COM is the Then. For an RMO: the timeline starts with the RMO, then places each EVT the RMO projects with the RMO again after it — RMO, EVT, RMO, EVT, …, RMO — so the RMO is shown at the beginning, between every EVT, and as the last step; that shows how the projection changes as each EVT is received. When the RMO joins, intermediate cards show lookup state (id → properties) built from earlier EVTs, and a later EVT carries only the join id so the looked-up property has a visible source. The EVTs are the Given; each RMO card after an EVT is that EVT's Then; there is no COM and no When. GWTs on the same timeline build on one another: the previous COM's or RMO's Given EVTs and Then EVTs are included as the next When's Given (every EVT above that next COM). Separate timelines in the same slice do not share that history. Another COM of the same type may follow on the same timeline to start that next GWT. A failed COM may use an ERR as its Then instead of an EVT. The GWT does not restate the SCR, the PRO or a MAP.
  - WFL: workflow - a grouping of SLCs to outline a process that the system and USRs go through to accomplish a goal. Each SLC is one step in that process. An EMD may have 1 or more WFLs

The whole diagram:
  - EMD: event modeling diagram - a diagram of one or more WFLs, with their SLCs placed left to right in order of use across the UBA, the MBA and the LBA, and optional GWTs below the LBA on one or more vertical timelines per slice, so it reads as a timeline.

## Construction

The goal is an EMD that tells the story of a system as a timeline: who does what (UBA), which instructions and views the system offers (MBA), which facts get recorded as a result (LBA), and optional GWTs below the LBA — on one or more vertical timelines per slice — that specify the COM or RMO of a SLC. Work from the process outward. First identify the WFLs and break them into steps, then add the USRs and SVCs that give the diagram its SWLs, then add one SLC per step and fill each with the right items depending on whether it changes state (COM slice) or shows information (RMO slice). Then group the SLCs back into their WFLs so each process reads as one labeled run of columns. Finally connect the items with arrows, add GWTs where they help specify the COM or RMO, and review that nothing is missing: every COM ends in an EVT or ERR, every RMO traces back to earlier EVTs from a single SWL, every property has a source and reaches a COM, SCR or PRO, and every SCR, PRO and EVT sits in the right SWL. When finished, implementers can build from the EMD and stakeholders can read it from left to right.

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
   - Keep the EVT in 3NF: record the facts the COM established, keyed by the id the COM generated or acted on, and refer to other entities by their id only (e.g., bikeId, customerId). The RMO that needs their properties joins the EVTs by that id (see step 6). A COM carries only the ids and the new facts it establishes; it never carries a property that is already recorded on an EVT in the SWL it records in (e.g., the email address a receipt is sent to), since the system looks that up from the history by id.
   - When the EVT should record a value in a different shape than the COM carries it (e.g., an end date computed from a start date and a number of days), put a MAP on the arrow from the COM to the EVT. The COM carries the inputs; the EVT records the outputs. The MAP names the inputs and outputs only, not how one becomes the other.
   - A COM that fails is its own SLC, with the ERR in the LBA where its EVT would otherwise be (see ERR). The ERR is shown instead of an EVT. Control goes back to the SCR or PRO that issued the COM. The next SLC is often a NAV slice: the same SCR again, showing the ERR's message (for example under the field that failed), with no COM and no RMO. If the USR or PRO then tries again, that attempt is a later COM slice. The EMD records only what happened in the example: a SLC never shows both an EVT and an ERR, and never a failure that did not occur.

5b. **Fill NAV slices**
   - A NAV slice has a SCR (or PRO) in the UBA and nothing in the MBA or LBA. Use it when the step is only navigation or showing feedback — for example the screen after a failed COM, with the ERR message on the form and no new command or read model.
   - Do not put a COM, RMO, EVT or ERR in a NAV slice. The ERR of the failed COM stays in that earlier COM slice's LBA; the NAV slice only shows its message on the SCR.

6. **Fill RMO slices**
   - Add an RMO to the MBA when a SCR or PRO needs data from the system without changing it. Its data is projected from EVTs in earlier SLCs.
   - An RMO joins the EVTs it projects by their shared ids (e.g., EVT Bike Rented and EVT Customer Registered by customerId) to show the properties of several entities together, such as an invoice with the customer's name. The EVTs stay in 3NF; the RMO does the lookup. An EVT that will be joined must carry the other entity's id (e.g., attendeeId on EVT Topic Suggested), never that entity's other properties (e.g., the attendee's name). The RMO holds the lookup from the entity's own EVT (attendeeId → name) and uses the id on the later EVT to fill the joined property.
   - When the RMO shows a value in a different shape than the EVTs recorded it (e.g., a total from a rate and a count, or a label from an id and a model), put a MAP on the arrows from the EVTs to the RMO. The EVTs carry the inputs; the RMO shows the outputs. The RMO derives the outputs on every read, so nothing is recorded. Also put a MAP there when an EVT property is only used to produce or adjust something the RMO shows and never appears on the RMO as itself (e.g., dailyRate on EVT Bike Listed feeds total on RMO Rental Confirmation); the MAP is what shows that property is used.
   - The UBA is optional. Place a SCR in the UBA SWL of the USR who views it, when they view it to decide what to do next or to confirm a previous COM they initiated. Place a PRO in the UBA SWL of the USR who waits on it, when it reads its tasks.
   - A PRO needs a TODO RMO to keep track of its tasks, so a PRO is always expressed as two SLCs beside one another: the RMO slice in which it reads its TODO RMO, immediately followed by the COM slice in which it issues the COM for that task. Nothing sits between them. A PRO never appears in a lone RMO slice or a lone COM slice; if it handles more than one kind of task, each is its own adjacent pair.
   - An RMO may only project EVTs that live in the same LBA SWL, so it must not depend on EVTs from other SWLs.
   - If an RMO needs information from an EVT in another SWL, channel it: add a RMO TODO, a PRO that works from it, and a COM issued by that PRO that records a new EVT in the SWL of the RMO that needs the information. The EVT carries the needed data across, and the RMO then projects it from its own SWL. This also allows the TODO RMO and COM issued by the PRO to filter and/or change the data for the purpose of being used in the final RMO. The channel EVT is the one copy of that entity in the receiving SWL, keyed by its id; later EVTs in that SWL refer to it by that id and the RMO joins them, so the data is not copied again. A SCR may pass an id it shows from one SWL into a COM that records in another SWL, but not that entity's other properties; those cross only via the channel.
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
   - A NAV slice has no MBA or LBA item and no within-slice arrows.
   - Between SLCs, draw an arrow from each EVT to every RMO that projects it, to show the source of data. The EVT must be in an earlier SLC than the RMO, and in the same SWL as every other EVT that RMO projects (see step 6 for crossing SWLs).
   - Write each MAP on the arrow it belongs to: COM → EVT or EVT → RMO. The reader then sees exactly where the inputs become the outputs, and in which item the outputs first appear.
   - Connect the ERR to the SCR in the next slice (often a NAV slice that shows the message).

9. **Write the GWTs**
   - A SLC may carry no GWTs or many. When it carries any, draw them in that column below every LBA SWL. One row spans the diagram; the lane label is GWT. The cell is part of the SLC. It is not a SWL, and it is not a SVC.
   - Represent the GWTs on one or more vertical timelines in that cell. Do not split a GWT into separate Given/When/Then blocks; the timeline order is the GWT. Use the example values of the COM or RMO being described (COM slice or RMO slice).
   - COM: place zero or more EVTs, then the COM, then the EVT (or ERR) that COM produced. That is one GWT: all EVTs above the COM are the Given, the COM is the When, the EVT (or ERR) right under the COM is the Then. To add another GWT for the same COM type on the same timeline, place another COM of that type and its Then EVT below it. That next When's Given is the previous COM's Given EVTs plus its Then EVTs — every EVT above that next COM.
   - RMO: place the RMO first (empty, or its state before any of this GWT's EVTs), then each EVT that RMO projects with the RMO again immediately after it. The pattern is RMO, EVT, RMO, EVT, …, RMO: the RMO appears at the beginning, between every EVT, and as the last step, so each RMO card shows how the projection changed when that EVT was received. Those EVTs are the Given; there is no When. When the RMO joins, every intermediate RMO card must show what that EVT contributed — including lookup entries keyed by id (e.g., attendeeId → name after EVT Attendee Registered) — so a later EVT that only carries that id has a visible source for the looked-up property on the prior RMO cards. When a later GWT on the same timeline needs that history, the previous RMO's Given EVTs (and any Then EVTs already on that timeline) are included in the next When's Given if a COM follows, or continue as further EVTs interleaved with RMO snapshots if another RMO GWT follows.
   - GWTs on separate timelines in the same slice do not share history. Only GWTs on the same timeline build on one another.
   - A MAP stays on its arrow. The Then EVT or RMO on the timeline carries the example values of the MAP's outputs; the timeline does not restate the MAP.

10. **Review for Completeness**
   - Check that no data is unaccounted for, in both directions. A SCR can't show something that never made it to the system via an EVT, and an EVT should not record something that no SCR or PRO ever uses. The two property checks below trace each direction.
   - Check that every COM leads to an EVT or an ERR (never both in one SLC), and every RMO traces back to an EVT in an earlier SLC. A NAV slice has neither COM nor RMO.
   - Check that every PRO is expressed as two SLCs beside one another: an RMO slice reading its TODO RMO, immediately followed by a COM slice issuing the COM for that task, with no SLC between them.
   - Check that every SCR and PRO sits in a USR's UBA SWL, and every EVT sits in a SVC's LBA SWL. Every ERR sits in the LBA of its own SLC, in the SWL of the SVC its COM would have changed.
   - Check that no SLC shows an alternative outcome. Each SLC records one thing that happened; there is no "or" or branching in an EMD.
   - Check that every property on a SCR, COM, RMO and EVT has a known source, and trace it back along the arrows (SCR/PRO → COM → EVT, and EVT → RMO → SCR/PRO) to the SCR input, COM-generated value or MAP output that created it.
   - Check that every property ends up somewhere. Start from each place a property enters the system (a SCR input, a COM-generated value or a MAP output) and trace it forward along the arrows (SCR/PRO → COM → EVT → RMO → SCR/PRO) until it reaches a valid end point. There are three: a COM, since every property a COM carries is used in its processing (recorded on the EVT, checked against the history, or both, so a password a COM checks and never records has arrived); a SCR that shows it; or a PRO that acts on it where an automation stands in for a USR. A property counts as arrived when it appears on that COM, SCR or PRO as itself, when it is an input of a MAP whose output arrives there, or when it is the id an RMO joins by. So the check bites on the EVT side: a property that is recorded on an EVT but reaches no RMO, and through it no SCR or PRO, is unaccounted for. Either a SCR is missing, a MAP that consumes it is missing (dailyRate on EVT Bike Listed appears on no later SCR as itself; MAP Rental Total is what shows it becomes total), or the property should not have been recorded.
   - Check that every RMO only has incoming arrows from EVTs in a single LBA SWL. Where data crosses SWLs, check that it does so via step 6's PRO and COM.
   - Check that every EVT is in 3NF: each property depends on the EVT's own key, and no EVT copies a property of another entity that is already recorded on an EVT in the same SWL. Where two entities meet (e.g., a rental and its customer), the EVT holds the id and the RMO joins.
   - Check that every MAP sits on one arrow (COM → EVT or EVT → RMO), that all of its inputs are present on the item at the tail of that arrow (the COM, or the EVTs), and that all of its outputs appear on the item at the head (the EVT, or the RMO). Check that it names inputs and outputs only: no values, since those sit on the items at either end, and no calculation, formula or transformation, since the EMD holds no implementation. A SCR or PRO passes data to its COM unchanged.
   - Check that every SLC belongs to exactly one WFL, that the SLCs of each WFL are contiguous, and that no RMO projects an EVT from a later WFL.
   - Check each GWT timeline below the LBA. A SLC may have none, or one or more timelines. Where a timeline describes a COM, each COM of that type on the timeline has a Then EVT (or ERR) immediately below it, and every EVT above that COM is its Given. Where a later GWT follows on the same timeline, the next When's Given is the previous COM's or RMO's Given EVTs plus its Then EVTs. Separate timelines do not share that history. Where a timeline describes an RMO, it starts with that RMO, places the RMO again after every EVT, and ends with that RMO; the EVTs interleaved with those RMO cards are its Given. Where the RMO joins, intermediate RMO cards show lookup state from earlier EVTs, and each joined EVT on the timeline carries the join id. Values match the COM or RMO being specified.

## Notation

**Naming.** Every item is labeled with its three-letter abbreviation followed by its name, so its kind is visible at a glance. WFLs and SLCs are numbered; everything else is named.
- WFL: `WFL<n> <goal>`, numbered from 1 left to right across the EMD (e.g., `WFL1 Stock a bike`). After its first mention, the number alone refers to it (`WFL1`), and its columns are given as a range of SLCs (`SLC1–SLC5`).
- SLC: `SLC<n>`, numbered from 1 left to right across the whole EMD, continuing across WFLs rather than restarting in each (e.g., `SLC12`). Where a SLC is described, its type follows in parentheses: `SLC12 (COM slice)`, `SLC13 (RMO slice)`, `SLC11 (COM slice, ERR)`, `SLC7 (NAV slice)`.
- GWT: written in that SLC below the LBA on one or more vertical timelines of EVTs, COMs, ERRs and/or an RMO. A SLC may have none. Given, When and Then are read from the timeline, not written as labels on the board: for a COM, EVTs above it are the Given, the COM is the When, the EVT or ERR under it is the Then; for an RMO, the cards alternate RMO, EVT, RMO, … so the RMO is at the start, between each EVT, and at the end (with lookup state when it joins). When GWTs share a timeline, the previous COM's or RMO's Given EVTs and Then EVTs are included as the next When's Given. Separate timelines do not share that history.
- USR: `<name> (<ROL>)` (e.g., `Jim (Customer)`). SVC: its name alone (e.g., `Fleet`).
- SWL: the band abbreviation, a colon and the USR or SVC the row belongs to: `UBA: Jim (Customer)`, `LBA: Fleet`. The MBA has one SWL, labeled `MBA`.
- SCR, PRO, COM, RMO, EVT, ERR and MAP: the abbreviation followed by a title-case name (e.g., `SCR Rent Bike Form`, `PRO Bike Lister`, `COM Rent Bike`, `RMO Bike Catalog`, `EVT Bike Rented`, `ERR Unknown Customer`, `MAP Rental End`). A COM is an imperative (verb then object), an EVT is in past tense, and an RMO a PRO works from ends in `TODO`.
- Where an item is placed, its SWL follows in parentheses: a SCR or PRO carries its USR (`SCR Rent Bike Form (Jim)`), and an RMO, EVT or ERR carries its SVC (`EVT Bike Rented (Rental)`). Where an item is referred to from another SLC, that SLC follows in parentheses instead (`EVT Bike Rented (SLC12)`).

Every item in an EMD carries concrete data: its properties and their values in the example. Where a value comes from is not written on the property; the arrows say it. A property on a COM comes from the SCR or PRO at the tail of its arrow, a property on an EVT from its COM, a property on an RMO from the EVTs whose arrows point to it, and a property on a SCR or PRO from the RMO below it. A value that first appears on a COM (e.g., an id) was generated there. Where processing changes a property's name or shape, a MAP on that arrow names its inputs and outputs; nothing else is annotated.

A SCR is written as its nested elements, the way a rough wireframe is sketched: groups, rows and columns hold headings, labels, text boxes, dropdowns, date pickers, check boxes, tables and buttons, top to bottom and left to right. A button that issues a COM or opens another SCR names it with →. Each element carries only its kind, its property and value.

A MAP is written as `MAP <name>: <inputs> → <outputs>, on <tail> → <head>`. It carries property names only. No values are written on it, since the reader sees the example data on the items at either end of the arrow, and no calculation, formula or transformation is written, since the EMD describes behaviour, not implementation.

Arrows within a SLC are not written due to convention; step 8 fixes them from the slice type (SCR/PRO → COM → EVT or ERR in a COM slice, RMO → SCR/PRO in an RMO slice). Only arrows between SLCs are listed, one per line as `EVT <name> (SLC<n>) → RMO <name> (SLC<m>)`, with any MAP written on the arrow.

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

One timeline for an RMO (RMO at start, between each EVT, and at end)
- RMO <name> (<SVC>): (empty)              ← before any EVT
- EVT <name> (SLC<m>): <properties>        ← Given (e.g. entity registered; builds lookup)
- RMO <name> (<SVC>): lookup <id> → <props> ← after that EVT; lookup source for later joins
- EVT <name> (SLC<n>): <id>, <properties>  ← Given (carries the join id, not the looked-up props)
- RMO <name> (<SVC>): lookup …; <row>      ← after that EVT; row uses lookup by id (last = Then)
```

On the board the three-letter prefix is left off, matching the cards. The timeline order is the only structure; do not add Given/When/Then labels. Samples for a COM, two COMs on one timeline, a failed COM, and an RMO are in the example.

## Example

Bike rental shop.

**USRs:** Jim (Customer), Sam (Shop Clerk)
**SVCs:** Fleet, Customer, Rental

**WFLs:**
- WFL1 Stock a bike: SLC1–SLC5, ends EVT Bike Listed
- WFL2 Apply as a customer: SLC6–SLC9, ends EVT Customer Registered
- WFL3 Rent a bike: SLC10–SLC14, ends SCR Rental Confirmation
- WFL4 Return a bike and send the receipt: SLC15–SLC17, ends EVT Receipt Sent

**MAPs:**
- MAP Full Name: firstName, lastName → name, on COM Register Customer → EVT Customer Registered (SLC9)
- MAP Rental End: startDate, days → endDate, on COM Rent Bike → EVT Bike Rented (SLC13)
- MAP Bike Label: bikeId, model → bike, on EVT Bike Rented, EVT Bike Listed → RMO Rental Confirmation (SLC14)
- MAP Rental Total: days, dailyRate → total, on EVT Bike Rented, EVT Bike Listed → RMO Rental Confirmation (SLC14) and EVT Bike Rented, EVT Bike Listed → RMO Receipts TODO (SLC16)

**ERRs:**
- ERR Unknown Customer, on COM Rent Bike (SLC11) → SCR Rent Bike Form (SLC12)

**Joins (RMO, matched by id, all EVTs in one SWL):**
- RMO Unregistered Bikes (Fleet): EVT Bike Received without a later EVT Bike Registered, by bikeId
- RMO Bike Listings TODO (Fleet): EVT Bike Registered ⋈ EVT Bike Received, by bikeId
- RMO Bike Catalog (Fleet): EVT Bike Received ⋈ EVT Bike Registered, by bikeId
- RMO Rental Confirmation (Rental): EVT Bike Rented ⋈ EVT Bike Listed by bikeId ⋈ EVT Customer Registered by customerId
- RMO Receipts TODO (Rental): EVT Bike Returned ⋈ EVT Bike Rented by rentalId ⋈ EVT Bike Listed by bikeId ⋈ EVT Customer Registered by customerId

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
- EVT Bike Rented (SLC13) → MAP Bike Label, MAP Rental Total → RMO Rental Confirmation (SLC14)
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
    - text box serialNumber = SN-48213
    - text box model = Trailblazer 29
    - dropdown type = Mountain
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
    - columns: bikeId | serialNumber | model | type | button Register → SCR Register Bike Form
    - row: B-101 | SN-48213 | Trailblazer 29 | Mountain | Register
- GWT timeline (describes RMO Unregistered Bikes):
  - RMO Unregistered Bikes (Fleet): (empty)
  - EVT Bike Received (SLC1): bikeId = B-101, serialNumber = SN-48213, model = Trailblazer 29, type = Mountain
  - RMO Unregistered Bikes (Fleet): bikeId = B-101, serialNumber = SN-48213, model = Trailblazer 29, type = Mountain

**SLC3 (COM slice)**
- SCR Register Bike Form (Sam):
  - heading Register Bike
  - group Bike (read only)
    - row: label bikeId = B-101 | label model = Trailblazer 29 | label type = Mountain
  - group Rate
    - text box dailyRate = 25.00
  - row, right-aligned
    - button Register → COM Register Bike
- COM Register Bike: bikeId = B-101, dailyRate = 25.00
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
    - row: text box firstName = Jim | text box lastName = Harper
  - text box email = jim@example.com
  - row, right-aligned
    - button Submit → COM Submit Application
- COM Submit Application: firstName = Jim, lastName = Harper, email = jim@example.com, customerId = C-7
- EVT Application Submitted (Customer): customerId = C-7, firstName = Jim, lastName = Harper, email = jim@example.com

**SLC7 (RMO slice)**
- RMO Application Confirmation (Customer): customerId = C-7, firstName = Jim, lastName = Harper, email = jim@example.com
- SCR Application Confirmation (Jim):
  - heading Application Received
  - column
    - label customerId = C-7
    - row: label firstName = Jim | label lastName = Harper
    - label email = jim@example.com

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
    - columns: bikeId | model | type | dailyRate | button Rent → SCR Rent Bike Form
    - row: B-101 | Trailblazer 29 | Mountain | 25.00 | Rent

**SLC11 (COM slice, ERR)**
- SCR Rent Bike Form (Jim):
  - heading Rent Bike
  - group Bike (read only)
    - row: label bikeId = B-101 | label model = Trailblazer 29 | label dailyRate = 25.00
  - group Customer
    - text box customerId = C-8 (mistyped)
  - group Dates
    - row: date picker startDate = 2026-10-22 | text box days = 3
  - row, right-aligned
    - button Rent → COM Rent Bike
- COM Rent Bike: bikeId = B-101, customerId = C-8, startDate = 2026-10-22, days = 3
- ERR Unknown Customer (Rental), no EVT Customer Registered with customerId = C-8: customerId = C-8, message = "Customer C-8 is not registered" → SCR Rent Bike Form (SLC12)
- GWT timeline (one GWT for COM Rent Bike; Then is the ERR):
  - (no EVT Customer Registered with customerId = C-8)
  - COM Rent Bike: bikeId = B-101, customerId = C-8, startDate = 2026-10-22, days = 3
  - ERR Unknown Customer (Rental): customerId = C-8, message = "Customer C-8 is not registered"


**SLC12 (NAV slice)**
- SCR Rent Bike Form (Jim):
  - heading Rent Bike
  - group Bike (read only)
    - row: label bikeId = B-101 | label model = Trailblazer 29 | label dailyRate = 25.00
  - group Customer
    - text box customerId = C-8 (mistyped)
    - label message = "Customer C-8 is not registered"
  - group Dates
    - row: date picker startDate = 2026-10-22 | text box days = 3
  - row, right-aligned
    - button Rent → COM Rent Bike
- (no COM, no RMO)

**SLC13 (COM slice)**
- SCR Rent Bike Form (Jim):
  - heading Rent Bike
  - group Bike (read only)
    - row: label bikeId = B-101 | label model = Trailblazer 29 | label dailyRate = 25.00
  - group Customer
    - text box customerId = C-7 (corrected)
  - group Dates
    - row: date picker startDate = 2026-10-22 | text box days = 3
  - row, right-aligned
    - button Rent → COM Rent Bike
- COM Rent Bike: bikeId = B-101, customerId = C-7, startDate = 2026-10-22, days = 3, rentalId = R-1
- MAP Rental End: startDate, days → endDate, on COM Rent Bike → EVT Bike Rented
- EVT Bike Rented (Rental): rentalId = R-1, bikeId = B-101, customerId = C-7, startDate = 2026-10-22, days = 3, endDate = 2026-10-25
- GWT timeline (two GWTs for COM Rent Bike on one timeline; next When's Given = previous COM's Given EVTs + Then EVTs):
  - EVT Customer Registered (SLC9): customerId = C-7, email = jim@example.com, name = Jim Harper
  - COM Rent Bike: bikeId = B-101, customerId = C-7, startDate = 2026-10-22, days = 3, rentalId = R-1
  - EVT Bike Rented (Rental): rentalId = R-1, bikeId = B-101, customerId = C-7, startDate = 2026-10-22, days = 3, endDate = 2026-10-25
  - COM Rent Bike: bikeId = B-101, customerId = C-7, startDate = 2026-11-01, days = 2, rentalId = R-2
  - EVT Bike Rented (Rental): rentalId = R-2, bikeId = B-101, customerId = C-7, startDate = 2026-11-01, days = 2, endDate = 2026-11-03

**SLC14 (RMO slice)**
- MAP Bike Label: bikeId, model → bike, on EVT Bike Rented, EVT Bike Listed → RMO Rental Confirmation
- MAP Rental Total: days, dailyRate → total, on EVT Bike Rented, EVT Bike Listed → RMO Rental Confirmation
- RMO Rental Confirmation (Rental): rentalId = R-1, bike = B-101 Trailblazer 29, name = Jim Harper, startDate = 2026-10-22, endDate = 2026-10-25, days = 3, total = 75.00
- SCR Rental Confirmation (Jim):
  - heading Rental Confirmed
  - column
    - label rentalId = R-1
    - label bike = B-101 Trailblazer 29
    - label name = Jim Harper
    - row: label startDate = 2026-10-22 | label endDate = 2026-10-25 | label days = 3
    - label total = 75.00, right-aligned
- GWT timeline (describes RMO Rental Confirmation):
  - RMO Rental Confirmation (Rental): (empty)
  - EVT Bike Rented (SLC13): rentalId = R-1, bikeId = B-101, customerId = C-7, startDate = 2026-10-22, days = 3, endDate = 2026-10-25
  - RMO Rental Confirmation (Rental): rentalId = R-1, bikeId = B-101, customerId = C-7, startDate = 2026-10-22, endDate = 2026-10-25, days = 3
  - EVT Bike Listed (SLC5): bikeId = B-101, model = Trailblazer 29, dailyRate = 25.00
  - RMO Rental Confirmation (Rental): rentalId = R-1, bike = B-101 Trailblazer 29, customerId = C-7, startDate = 2026-10-22, endDate = 2026-10-25, days = 3, total = 75.00
  - EVT Customer Registered (SLC9): customerId = C-7, email = jim@example.com, name = Jim Harper
  - RMO Rental Confirmation (Rental): rentalId = R-1, bike = B-101 Trailblazer 29, name = Jim Harper, startDate = 2026-10-22, endDate = 2026-10-25, days = 3, total = 75.00

**WFL4 Return a bike and send the receipt (SLC15–SLC17)**

**SLC15 (COM slice)**
- SCR Return Desk (Sam):
  - heading Return Bike
  - row
    - text box rentalId = R-1
    - date picker returnDate = 2026-10-25
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

After the EMD is constructed (terms, slices, properties, arrows, and any GWTs), draw it as one file: `<name>.emd.html`. Open that file in a browser (or serve the repo). CSS, arrow tiles, fonts, connectors, and board settings stay in `diagram/`; the file is the page plus the board markup. A board under `projects/<name>/` links `../../diagram/`.

Each new SLC adds one column. Earlier columns stay as they are. Bump `--slices` when a column is added. Leave every `.cell.connector` empty — `connectors.js` draws write shafts and EVT→RMO joins there. Give every EVT and RMO an `id`, and list every EVT→RMO edge on `<main>` as `data-joins="evt-a:rmo-x,…"`.

### Board help (`?`)

`diagram/settings.js` (and the app copy under `app/renderer/diagram/`) places a gear and a `?` in the sticky workflow-lane corner. The `?` opens **About this board**. Keep that popover complete and in sync with these instructions. It must explain:

- **Workflow** (top blue arrow) — story left to right; each column is one **SLC**: a command step, a read-model step, or navigation only (**NAV** — screen with no command or read model).
- **UBA** — actors and their screens (**SCR**) or automations (**PRO**).
- **MBA** — commands (**COM**, blue) and read models (**RMO**, green); empty in a NAV slice.
- **LBA** — events (**EVT**, orange) the system recorded, or an error (**ERR**, red) when a command failed instead; empty in RMO and NAV slices.
- **GWT** (bottom row) — optional given-when-then examples for that slice, as vertical timelines (no Given/When/Then labels). For a **COM**: events above the command are the Given, the command is the When, the event or error under it is the Then; another command of the same type on the same timeline builds on that history. For an **RMO**: read model, then event, then read model, … ending with the read model — so the reader sees how the projection changes as each event arrives (including lookup entries when the read model joins by id).
- **Arrows** — data flow: screen → command → event (or error), and event → read model → screen. A **MAP** on an arrow names inputs → outputs when data changes shape.
- **Interaction** — hover a card or connector to keep that path lit and fade the rest; click a connector to scroll any end that is partly out of view fully into the viewport; use the gear to tune scale, fade, and connector tile size.

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
  <main class="emd" style="--slices: 1" data-joins="">
    <div class="sheet">
      <div class="board">
        <!-- lane + slice columns -->
      </div>
    </div>
  </main>
  <script src="../../diagram/connectors.js"></script>
  <script src="../../diagram/settings.js"></script>
</body>
</html>
```

`main.emd` is the only scrollport. Do not scroll `body`/`window`.

### Board chrome (one workflow, one USR, one SVC)

```html
<div class="cell lane emd-corner"></div>
<div class="cell wfl" data-slc="1" data-span="1"><span>Stock a bike</span></div>

<div class="cell lane open">Jim (Customer)</div>
<div class="cell uba" data-slc="1" data-lane="jim"><!-- SCR or empty shaft --></div>

<div class="cell lane open"></div>
<div class="cell mba" data-slc="1"><!-- COM or RMO + gaps --></div>

<div class="cell lane open"></div>
<div class="cell connector" data-slc="1"></div><!-- leave empty -->

<div class="cell lane open lba-head">
  <div class="lba-head-gap" aria-hidden="true"></div>
  <div class="lba-head-label">Fleet</div>
</div>
<div class="cell lba" data-slc="1" data-lane="fleet"><!-- EVT/ERR or empty shaft --></div>

<div class="cell lane open">GWT</div>
<div class="cell gwt" data-slc="1"><!-- one or more vertical timelines, or empty when no GWTs --></div>
```

The GWT row is the last row. It sits under every LBA service row. `foot` stays on the last service row. Add one `.cell.gwt` per slice; leave it empty when that SLC has no GWTs. Put each timeline in a `.timeline` inside that cell.

Add `div.cell.slc-no` cells when you want slice numbers. Title cards with the name only (no `COM`/`EVT` prefix). Classes: `scr`, `pro`, `com`, `rmo`, `evt`, `err`; mappings are `p.map` under the COM or RMO. GWT timeline items reuse those card classes, with no three-letter prefix and no Given/When/Then labels.

### GWT (below the LBA)

One cell per slice. A SLC may have no timelines, or many GWTs on one or more vertical timelines. Stack EVT / COM / EVT (or RMO) cards top to bottom inside each `.timeline`, with a down-arrow corridor (`.arr.v` → shaft + `arrow-down`) between every consecutive card. For a COM: EVTs above it are the Given, the COM is the When, the EVT (or ERR) right under it is the Then. When GWTs share the same timeline, the previous COM's or RMO's Given EVTs and Then EVTs are included as the next When's Given. Separate `.timeline` stacks do not share that history. For an RMO: start with the RMO, then EVT, RMO, EVT, …, RMO — the RMO at the beginning, between every EVT, and at the end — so each RMO card shows the projection after that EVT (including lookup entries when the RMO joins); the EVTs are the Given, and a joined EVT carries the join id.

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

<!-- RMO: RMO at start, between each EVT, and at end; joins show lookup then joined row -->
<div class="cell gwt" data-slc="2">
  <div class="timeline">
    <article class="rmo"><h2>Unregistered Bikes</h2>…</article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="evt"><h2>Bike Received</h2>…</article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="rmo"><h2>Unregistered Bikes</h2>…</article>
  </div>
</div>

<!-- RMO join: lookup after entity EVT, then later EVT carries join id -->
<div class="cell gwt" data-slc="14">
  <div class="timeline">
    <article class="rmo"><h2>Rental Confirmation</h2>…</article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="evt"><h2>Bike Rented</h2>…<!-- includes customerId --></article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="rmo"><h2>Rental Confirmation</h2>…<!-- holds customerId until lookup --></article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="evt"><h2>Customer Registered</h2>…</article>
    <div class="arr v"><div class="shaft"></div><div class="tile arrow-down"></div></div>
    <article class="rmo"><h2>Rental Confirmation</h2>…<!-- name from Customer Registered by customerId --></article>
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
```

### Cards

```html
<article class="com" id="com-receive-bike">
  <h2>Receive Bike</h2>
  <dl class="props">
    <div><dt>bikeId</dt><dd>B-101</dd></div>
    <div><dt>serialNumber</dt><dd>SN-48213</dd></div>
  </dl>
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
    <div><dt>customerId</dt><dd>C-8</dd></div>
    <div><dt>message</dt><dd>Customer C-8 is not registered</dd></div>
  </dl>
</article>

<p class="map">Rental End: startDate, days → endDate</p>
```

An ERR sits in the LBA instead of an EVT when the COM failed (see SLC11 in the example). The next slice is often a NAV slice: SCR in the UBA with the message on the form, empty MBA and LBA (see SLC12).

Screens use a `.wire` sketch inside `article.scr`. Processors are `article.pro` with a gear SVG. Every MBA cell needs a `.gap` above and below the card so COM/RMO tops line up across slices.

### Same-slice verticals (COM slice)

```html
<!-- UBA: screen, then shaft down -->
<article class="scr" id="scr-receive-bike-form">…</article>
<div class="gap">
  <div class="arr v"><div class="shaft"></div></div>
</div>

<!-- MBA: arrow into COM, shaft toward connector -->
<div class="gap">
  <div class="arr v">
    <div class="shaft"></div>
    <div class="tile arrow-down"></div>
  </div>
</div>
<article class="com" id="com-receive-bike">…</article>
<div class="gap">
  <div class="arr v"><div class="shaft"></div></div>
</div>

<!-- LBA: shaft + arrow into EVT (connector segment is JS) -->
<div class="gap">
  <div class="arr v">
    <div class="shaft"></div>
    <div class="tile arrow-down"></div>
  </div>
</div>
<article class="evt" id="evt-bike-received">…</article>
```

Empty `uba`/`lba` cells a vertical crosses keep only `.gap > .arr.v > .shaft`. In an RMO slice, leave the MBA lower `.gap` empty so JS can draw the join `arrow-up`; put `arrow-up` then shaft under the SCR when the screen sits in the same slice.

### Cross-slice joins

1. `id` on every EVT and RMO.
2. `data-joins="evt-bike-received:rmo-bike-catalog,…"` on `main.emd` — every EVT→RMO edge.
3. Empty `.cell.connector` columns; do not hand-build join rails.
4. Load `connectors.js` and `settings.js`.

Hover lights a path; click a connector scrolls any clipped end (including SCR on a tall vertical) into view, clear of the sticky lane and scrollbars.

For wireframe controls, gear docks, continuity rules, and tile tables, use [`html-css.md`](html-css.md).

For more, see: [eventmodeling.org](https://eventmodeling.org) or review example EMDs in this folder.
