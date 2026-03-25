# Stanford d.school Design Thinking Framework

Design Thinking is a human-centered approach to innovation developed at Stanford's d.school. It provides a structured process for understanding users, challenging assumptions, redefining problems, and creating solutions that might not be immediately obvious. The process is non-linear -- teams frequently loop back to earlier stages as they learn.

## The Five Stages

### 1. Empathize

**Purpose**: Understand the people you are designing for through observation, engagement, and immersion.

Activities:
- Conduct user interviews with open-ended questions.
- Observe users in their natural context (contextual inquiry).
- Build empathy maps capturing what users Think, Feel, Say, and Do.
- Create user personas based on research patterns.
- Identify pain points, workarounds, and unmet needs.

Key principle: Set aside your own assumptions. You are not the user. What seems obvious to you may not match reality.

Output: Empathy maps, persona profiles, raw research notes, key quotes.

### 2. Define

**Purpose**: Synthesize research into a clear, actionable problem statement that frames the design challenge.

Activities:
- Cluster research findings into themes using affinity mapping.
- Write Point-of-View (POV) statements: "[User] needs [need] because [insight]."
- Generate How-Might-We (HMW) questions to reframe problems as opportunities.
- Write Hills: "Who can What with Wow" outcome statements.
- Identify design constraints and success criteria.

Key principle: A well-defined problem is half-solved. Spend time getting the problem statement right before jumping to solutions.

Output: POV statements, HMW questions, Hills, design principles, constraints list.

### 3. Ideate

**Purpose**: Generate a wide range of possible solutions. Quantity matters more than quality at this stage.

Activities:
- Brainstorm without judgment -- defer criticism, build on others' ideas.
- Use structured techniques: Crazy 8s, SCAMPER, mind mapping, worst possible idea.
- Generate design variants exploring different approaches to the same problem.
- Create rough sketches and wireframes to make ideas tangible.
- Vote and cluster ideas to identify the most promising directions.

Key principle: Go for volume. The first ideas are rarely the best. Push past the obvious to find unexpected solutions.

Output: 3-5 design variants with rough sketches, rationale for each approach.

### 4. Prototype

**Purpose**: Build quick, low-cost representations of solutions to learn from. A prototype is not a final product -- it is a thinking tool.

Activities:
- Create the minimum viable artifact that tests your hypothesis.
- Build interactive prototypes that users can engage with.
- Focus on the core interaction, not polish or edge cases.
- Make prototypes disposable -- you should be willing to throw them away.
- Ensure prototypes are accessible from the start (semantic HTML, keyboard navigation, proper contrast).

Key principle: Build to learn, not to ship. The goal is to answer specific questions about your solution, not to build a finished product.

Output: Functional prototype (in this system: a self-contained React+Tailwind component).

### 5. Test

**Purpose**: Put prototypes in front of users, gather feedback, and refine your understanding.

Activities:
- Conduct usability testing with representative users.
- Run accessibility audits (WCAG 2.1 AA compliance).
- Evaluate against the Hills defined in the Define stage.
- Measure task completion rate, time on task, and error rate.
- Identify what works, what fails, and what surprises you.
- Determine whether to iterate on the current solution or loop back to an earlier stage.

Key principle: Testing is not validation -- it is learning. Be prepared to discover that your solution does not work and that you need to go back to Empathize or Define.

Output: Test results, accessibility audit, UX evaluation, loop-back recommendations.

## Core Principles

### Human-Centered Design
Every decision starts with understanding real people. Technology and business requirements matter, but they serve human needs, not the other way around.

### Bias Toward Action
Do not overthink. Build something rough, put it in front of people, and learn. A mediocre prototype tested with users teaches more than a perfect plan discussed in a meeting.

### Radical Collaboration
Diverse perspectives produce better solutions. Include people from different disciplines, backgrounds, and roles. The best ideas come from unexpected intersections.

### Embrace Experimentation
Failure is not the opposite of success -- it is part of the process. Every failed prototype eliminates a wrong direction and teaches something new. Design Thinking encourages multiple iterations.

### Show, Don't Tell
Communicate ideas through tangible artifacts -- sketches, prototypes, scenarios -- not abstract descriptions. A rough wireframe communicates more than a page of requirements.

## Iteration and Looping

Design Thinking is explicitly iterative. Common loops:

- **Test to Empathize**: User testing reveals that you misunderstood the core need.
- **Test to Define**: Testing shows the problem statement was too broad or misdirected.
- **Test to Ideate**: The current solution does not work, but the problem is well understood -- generate new approaches.
- **Test to Prototype**: Minor issues found -- refine the current prototype.

Each loop deepens understanding. Limit loops to prevent infinite iteration (this system caps at 3 iterations per pipeline run).
