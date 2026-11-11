# Instructions: How to Construct an Event Modeling Diagram (EMD)

This document uses three-letter abbreviations to identify each component and concept. Each term is defined using only the terms listed above it, so the list can be read from top to bottom.

Event Modeling Diagrams (EMDs) describe information systems and processes using a clear, timeline-based approach built from vertical slices (SLCs). It is like a wire frame diagram but with more elements to track information flow and state behind the scenes. It is also specification by example. The implementation for a system described by an EMD will show the same behaviour as shown in the EMD. Learn the terms below, then follow the steps after them to construct an EMD:

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
  - SLC: slice - a column that spans all bands (the UBA, the MBA and the LBA) and is one step in a process. A SLC has one position in the MBA, which makes it either a COM slice (a COM there) or an RMO slice (an RMO there). A COM slice also has a PRO or SCR in the UBA and one item in the LBA: the EVT the COM recorded when it passed, or the ERR it failed with. An RMO slice has an optional PRO or SCR in the UBA and nothing in the LBA.
  - WFL: workflow - a grouping of SLCs to outline a process that the system and USRs go through to accomplish a goal. Each SLC is one step in that process. An EMD may have 1 or more WFLs

The whole diagram:
  - EMD: event modeling diagram - a diagram of one or more WFLs, with their SLCs placed left to right in order of use across the UBA, the MBA and the LBA, so it reads as a timeline.

## Construction

The goal is an EMD that tells the story of a system as a timeline: who does what (UBA), which instructions and views the system offers (MBA), and which facts get recorded as a result (LBA). Work from the process outward. First identify the WFLs and break them into steps, then add the USRs and SVCs that give the diagram its SWLs, then add one SLC per step and fill each with the right items depending on whether it changes state (COM slice) or shows information (RMO slice). Then group the SLCs back into their WFLs so each process reads as one labeled run of columns. Finally connect the items with arrows and review that nothing is missing: every COM ends in an EVT or ERR, every RMO traces back to earlier EVTs from a single SWL, every property has a source and reaches a COM, SCR or PRO, and every SCR, PRO and EVT sits in the right SWL. When finished, implementers can build from the EMD and stakeholders can read it from left to right.

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
   - For each key step, add a SLC column that spans the UBA, the MBA, and the LBA.
   - Decide whether the step changes state (a COM slice) or only shows information (an RMO slice).

5. **Fill COM slices**
   - A state change is a COM slice: one item in each band.
   - UBA: place a SCR when a USR makes the change, or a PRO when an automation does. Put a SCR in the UBA SWL of the USR who uses it, and a PRO in the UBA SWL of the USR who waits on its result (see UBA).
   - MBA: place the COM.
   - LBA: place the EVT in the LBA SWL of the SVC whose state changed. Describe the EVT in past tense (e.g., "Prescription Created", "Medication Dispensed") so it clearly represents what happened and which part of the workflow it belongs to.
   - Keep the EVT in 3NF: record the facts the COM established, keyed by the id the COM generated or acted on, and refer to other entities by their id only (e.g., bikeId, customerId). The RMO that needs their properties joins the EVTs by that id (see step 6). A COM carries only the ids and the new facts it establishes; it never carries a property that is already recorded on an EVT in the SWL it records in (e.g., the email address a receipt is sent to), since the system looks that up from the history by id.
   - When the EVT should record a value in a different shape than the COM carries it (e.g., an end date computed from a start date and a number of days), put a MAP on the arrow from the COM to the EVT. The COM carries the inputs; the EVT records the outputs. The MAP names the inputs and outputs only, not how one becomes the other.
   - A COM that fails is its own SLC, with the ERR in the LBA where its EVT would otherwise be (see ERR). Control goes back to the SCR or PRO that issued the COM, which shows the ERR's message. If the USR or PRO then tries again, that attempt is the next SLC. The EMD records only what happened in the example: a SLC never shows both an EVT and an ERR, and never a failure that did not occur.

6. **Fill RMO slices**
   - Add an RMO to the MBA when a SCR or PRO needs data from the system without changing it. Its data is projected from EVTs in earlier SLCs.
   - An RMO joins the EVTs it projects by their shared ids (e.g., EVT Bike Rented and EVT Customer Registered by customerId) to show the properties of several entities together, such as an invoice with the customer's name. The EVTs stay in 3NF; the RMO does the lookup.
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
   - Within a COM slice, draw an arrow from the SCR or PRO to the COM, and from the COM to its EVT. In a failed COM slice, draw it from the COM to its ERR.
   - Within an RMO slice, draw an arrow from the RMO up to the SCR or PRO, if there is one.
   - Between SLCs, draw an arrow from each EVT to every RMO that projects it, to show the source of data. The EVT must be in an earlier SLC than the RMO, and in the same SWL as every other EVT that RMO projects (see step 6 for crossing SWLs).
   - Write each MAP on the arrow it belongs to: COM → EVT or EVT → RMO. The reader then sees exactly where the inputs become the outputs, and in which item the outputs first appear.
   - Connect the ERR to the SCR in the next slice.

9. **Review for Completeness**
   - Check that no data is unaccounted for, in both directions. A SCR can't show something that never made it to the system via an EVT, and an EVT should not record something that no SCR or PRO ever uses. The two property checks below trace each direction.
   - Check that every COM leads to an EVT or an ERR, and every RMO traces back to an EVT in an earlier SLC.
   - Check that every PRO is expressed as two SLCs beside one another: an RMO slice reading its TODO RMO, immediately followed by a COM slice issuing the COM for that task, with no SLC between them.
   - Check that every SCR and PRO sits in a USR's UBA SWL, and every EVT sits in a SVC's LBA SWL. Every ERR sits in the LBA of its own SLC, in the SWL of the SVC its COM would have changed.
   - Check that no SLC shows an alternative outcome. Each SLC records one thing that happened; there is no "or" or branching in an EMD.
   - Check that every property on a SCR, COM, RMO and EVT has a known source, and trace it back along the arrows (SCR/PRO → COM → EVT, and EVT → RMO → SCR/PRO) to the SCR input, COM-generated value or MAP output that created it.
   - Check that every property ends up somewhere. Start from each place a property enters the system (a SCR input, a COM-generated value or a MAP output) and trace it forward along the arrows (SCR/PRO → COM → EVT → RMO → SCR/PRO) until it reaches a valid end point. There are three: a COM, since every property a COM carries is used in its processing (recorded on the EVT, checked against the history, or both, so a password a COM checks and never records has arrived); a SCR that shows it; or a PRO that acts on it where an automation stands in for a USR. A property counts as arrived when it appears on that COM, SCR or PRO as itself, when it is an input of a MAP whose output arrives there, or when it is the id an RMO joins by. So the check bites on the EVT side: a property that is recorded on an EVT but reaches no RMO, and through it no SCR or PRO, is unaccounted for. Either a SCR is missing, a MAP that consumes it is missing (dailyRate on EVT Bike Listed appears on no later SCR as itself; MAP Rental Total is what shows it becomes total), or the property should not have been recorded.
   - Check that every RMO only has incoming arrows from EVTs in a single LBA SWL. Where data crosses SWLs, check that it does so via step 6's PRO and COM.
   - Check that every EVT is in 3NF: each property depends on the EVT's own key, and no EVT copies a property of another entity that is already recorded on an EVT in the same SWL. Where two entities meet (e.g., a rental and its customer), the EVT holds the id and the RMO joins.
   - Check that every MAP sits on one arrow (COM → EVT or EVT → RMO), that all of its inputs are present on the item at the tail of that arrow (the COM, or the EVTs), and that all of its outputs appear on the item at the head (the EVT, or the RMO). Check that it names inputs and outputs only: no values, since those sit on the items at either end, and no calculation, formula or transformation, since the EMD holds no implementation. A SCR or PRO passes data to its COM unchanged.
   - Check that every SLC belongs to exactly one WFL, that the SLCs of each WFL are contiguous, and that no RMO projects an EVT from a later WFL.

## Notation

**Naming.** Every item is labeled with its three-letter abbreviation followed by its name, so its kind is visible at a glance. WFLs and SLCs are numbered; everything else is named.
- WFL: `WFL<n> <goal>`, numbered from 1 left to right across the EMD (e.g., `WFL1 Stock a bike`). After its first mention, the number alone refers to it (`WFL1`), and its columns are given as a range of SLCs (`SLC1–SLC5`).
- SLC: `SLC<n>`, numbered from 1 left to right across the whole EMD, continuing across WFLs rather than restarting in each (e.g., `SLC12`). Where a SLC is described, its type follows in parentheses: `SLC12 (COM slice)`, `SLC13 (RMO slice)`, `SLC11 (COM slice, ERR)`.
- USR: `<name> (<ROL>)` (e.g., `Jim (Customer)`). SVC: its name alone (e.g., `Fleet`).
- SWL: the band abbreviation, a colon and the USR or SVC the row belongs to: `UBA: Jim (Customer)`, `LBA: Fleet`. The MBA has one SWL, labeled `MBA`.
- SCR, PRO, COM, RMO, EVT, ERR and MAP: the abbreviation followed by a title-case name (e.g., `SCR Rent Bike Form`, `PRO Bike Lister`, `COM Rent Bike`, `RMO Bike Catalog`, `EVT Bike Rented`, `ERR Unknown Customer`, `MAP Rental End`). A COM is an imperative (verb then object), an EVT is in past tense, and an RMO a PRO works from ends in `TODO`.
- Where an item is placed, its SWL follows in parentheses: a SCR or PRO carries its USR (`SCR Rent Bike Form (Jim)`), and an RMO, EVT or ERR carries its SVC (`EVT Bike Rented (Rental)`). Where an item is referred to from another SLC, that SLC follows in parentheses instead (`EVT Bike Rented (SLC12)`).

Every item in an EMD carries concrete data: its properties and their values in the example. Where a value comes from is not written on the property; the arrows say it. A property on a COM comes from the SCR or PRO at the tail of its arrow, a property on an EVT from its COM, a property on an RMO from the EVTs whose arrows point to it, and a property on a SCR or PRO from the RMO below it. A value that first appears on a COM (e.g., an id) was generated there. Where processing changes a property's name or shape, a MAP on that arrow names its inputs and outputs; nothing else is annotated.

A SCR is written as its nested elements, the way a rough wireframe is sketched: groups, rows and columns hold headings, labels, text boxes, dropdowns, date pickers, check boxes, tables and buttons, top to bottom and left to right. A button that issues a COM or opens another SCR names it with →. Each element carries only its kind, its property and value.

A MAP is written as `MAP <name>: <inputs> → <outputs>, on <tail> → <head>`. It carries property names only. No values are written on it, since the reader sees the example data on the items at either end of the arrow, and no calculation, formula or transformation is written, since the EMD describes behaviour, not implementation.

Arrows within a SLC are not written due to convention; step 8 fixes them from the slice type (SCR/PRO → COM → EVT or ERR in a COM slice, RMO → SCR/PRO in an RMO slice). Only arrows between SLCs are listed, one per line as `EVT <name> (SLC<n>) → RMO <name> (SLC<m>)`, with any MAP written on the arrow.

## Example

Bike rental shop.

**USRs:** Jim (Customer), Sam (Shop Clerk)
**SVCs:** Fleet, Customer, Rental

**WFLs:**
- WFL1 Stock a bike: SLC1–SLC5, ends EVT Bike Listed
- WFL2 Apply as a customer: SLC6–SLC9, ends EVT Customer Registered
- WFL3 Rent a bike: SLC10–SLC13, ends SCR Rental Confirmation
- WFL4 Return a bike and send the receipt: SLC14–SLC16, ends EVT Receipt Sent

**MAPs:**
- MAP Full Name: firstName, lastName → name, on COM Register Customer → EVT Customer Registered (SLC9)
- MAP Rental End: startDate, days → endDate, on COM Rent Bike → EVT Bike Rented (SLC12)
- MAP Bike Label: bikeId, model → bike, on EVT Bike Rented, EVT Bike Listed → RMO Rental Confirmation (SLC13)
- MAP Rental Total: days, dailyRate → total, on EVT Bike Rented, EVT Bike Listed → RMO Rental Confirmation (SLC13) and EVT Bike Rented, EVT Bike Listed → RMO Receipts TODO (SLC15)

**ERRs:**
- ERR Unknown Customer, on COM Rent Bike (SLC11) → SCR Rent Bike Form

**Joins (RMO, matched by id, all EVTs in one SWL):**
- RMO Unregistered Bikes (Fleet): EVT Bike Received without a later EVT Bike Registered, by bikeId
- RMO Bike Listings TODO (Fleet): EVT Bike Registered ⋈ EVT Bike Received, by bikeId
- RMO Bike Catalog (Fleet): EVT Bike Received ⋈ EVT Bike Registered, by bikeId
- RMO Rental Confirmation (Rental): EVT Bike Rented ⋈ EVT Bike Listed by bikeId ⋈ EVT Customer Registered by customerId
- RMO Receipts TODO (Rental): EVT Bike Returned ⋈ EVT Bike Rented by rentalId ⋈ EVT Bike Listed by bikeId ⋈ EVT Customer Registered by customerId

**Diagram:**

| | SLC1 | SLC2 | SLC3 | SLC4 | SLC5 | SLC6 | SLC7 | SLC8 | SLC9 | SLC10 | SLC11 | SLC12 | SLC13 | SLC14 | SLC15 | SLC16 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **WFL** | WFL1 Stock a bike | WFL1 | WFL1 | WFL1 | WFL1 | WFL2 Apply as a customer | WFL2 | WFL2 | WFL2 | WFL3 Rent a bike | WFL3 | WFL3 | WFL3 | WFL4 Return a bike and send the receipt | WFL4 | WFL4 |
| **UBA: Jim (Customer)** | | | | | | SCR Customer Application Form | SCR Application Confirmation | PRO Customer Registrar | PRO Customer Registrar | SCR Bike Catalog | SCR Rent Bike Form | SCR Rent Bike Form | SCR Rental Confirmation | | PRO Receipt Sender | PRO Receipt Sender |
| **UBA: Sam (Shop Clerk)** | SCR Receive Bike Form | SCR Unregistered Bikes | SCR Register Bike Form | PRO Bike Lister | PRO Bike Lister | | | | | | | | | SCR Return Desk | | |
| **MBA** | COM Receive Bike | RMO Unregistered Bikes | COM Register Bike | RMO Bike Listings TODO | COM List Bike | COM Submit Application | RMO Application Confirmation | RMO Customer Names TODO | COM Register Customer | RMO Bike Catalog | COM Rent Bike | COM Rent Bike | RMO Rental Confirmation ← MAP Bike Label, MAP Rental Total | COM Return Bike | RMO Receipts TODO ← MAP Rental Total | COM Send Receipt |
| **LBA: Fleet** | EVT Bike Received | | EVT Bike Registered | | | | | | | | | | | | | |
| **LBA: Customer** | | | | | | EVT Application Submitted | | | | | | | | | | |
| **LBA: Rental** | | | | | EVT Bike Listed | | | | MAP Full Name → EVT Customer Registered | | ERR Unknown Customer | MAP Rental End → EVT Bike Rented | | EVT Bike Returned | | EVT Receipt Sent |

**Slice types:**
- COM slices: SLC1, SLC3, SLC5, SLC6, SLC9, SLC11, SLC12, SLC14, SLC16
- RMO slices: SLC2, SLC4, SLC7, SLC8, SLC10, SLC13, SLC15

**Arrows between SLCs (EVT → RMO):**
- EVT Bike Received (SLC1) → RMO Unregistered Bikes (SLC2)
- EVT Bike Received (SLC1) → RMO Bike Listings TODO (SLC4)
- EVT Bike Registered (SLC3) → RMO Bike Listings TODO (SLC4)
- EVT Application Submitted (SLC6) → RMO Application Confirmation (SLC7)
- EVT Application Submitted (SLC6) → RMO Customer Names TODO (SLC8)
- EVT Bike Received (SLC1) → RMO Bike Catalog (SLC10)
- EVT Bike Registered (SLC3) → RMO Bike Catalog (SLC10)
- EVT Bike Rented (SLC12) → MAP Bike Label, MAP Rental Total → RMO Rental Confirmation (SLC13)
- EVT Bike Listed (SLC5) → MAP Bike Label, MAP Rental Total → RMO Rental Confirmation (SLC13)
- EVT Customer Registered (SLC9) → RMO Rental Confirmation (SLC13)
- EVT Bike Returned (SLC14) → RMO Receipts TODO (SLC15)
- EVT Bike Rented (SLC12) → MAP Rental Total → RMO Receipts TODO (SLC15)
- EVT Bike Listed (SLC5) → MAP Rental Total → RMO Receipts TODO (SLC15)
- EVT Customer Registered (SLC9) → RMO Receipts TODO (SLC15)
- EVT Receipt Sent (SLC16) → none

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

**SLC2 (RMO slice)**
- RMO Unregistered Bikes (Fleet), one row per unregistered bike: bikeId = B-101, serialNumber = SN-48213, model = Trailblazer 29, type = Mountain
- SCR Unregistered Bikes (Sam):
  - heading Unregistered Bikes
  - table, one row per row of RMO Unregistered Bikes
    - columns: bikeId | serialNumber | model | type | button Register → SCR Register Bike Form
    - row: B-101 | SN-48213 | Trailblazer 29 | Mountain | Register

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

**WFL3 Rent a bike (SLC10–SLC13)**

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
- ERR Unknown Customer (Rental), no EVT Customer Registered with customerId = C-8: customerId = C-8, message = "Customer C-8 is not registered" → SCR Rent Bike Form

**SLC12 (COM slice)**
- SCR Rent Bike Form (Jim):
  - heading Rent Bike
  - label message = "Customer C-8 is not registered"
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

**SLC13 (RMO slice)**
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

**WFL4 Return a bike and send the receipt (SLC14–SLC16)**

**SLC14 (COM slice)**
- SCR Return Desk (Sam):
  - heading Return Bike
  - row
    - text box rentalId = R-1
    - date picker returnDate = 2026-10-25
  - row, right-aligned
    - button Return → COM Return Bike
- COM Return Bike: rentalId = R-1, returnDate = 2026-10-25
- EVT Bike Returned (Rental): rentalId = R-1, returnDate = 2026-10-25

**SLC15 (RMO slice)**
- MAP Rental Total: days, dailyRate → total, on EVT Bike Rented, EVT Bike Listed → RMO Receipts TODO
- RMO Receipts TODO (Rental), one task per returned rental not yet receipted: rentalId = R-1, customerId = C-7, name = Jim Harper, email = jim@example.com, returnDate = 2026-10-25, total = 75.00
- PRO Receipt Sender (Jim): next task of RMO Receipts TODO

**SLC16 (COM slice)**
- PRO Receipt Sender (Jim): rentalId = R-1
- COM Send Receipt: rentalId = R-1
- EVT Receipt Sent (Rental): rentalId = R-1

For more, see: [eventmodeling.org](https://eventmodeling.org) or review example EMDs in this folder.
