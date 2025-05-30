### Procedure

This experiment demonstrates the real-life application of the **Poisson process** and helps visualize key properties such as **splitting** and **merging**.

We model the process as the **random ejection of radioactive particles** from a radiation source. The number of particles emitted over a fixed time interval (e.g., **`<set a number>` seconds**) follows a **Poisson distribution**. We will visualize the particle counts using a **bar graph** displayed on the right-hand side.

The **average number of particles emitted** in this time interval is **`<sett a number>`**, representing the Poisson parameter \( \lambda \) (rate of occurrence).

---

#### Part 1: Basic Poisson Process Simulation

- Simulate a single radioactive source emitting particles over multiple time intervals.
- Use a Poisson distribution with a fixed rate \( \lambda \) to generate counts.
- Plot the number of particles per interval on a histogram.

**Expected Observation**: The histogram should show a typical Poisson-distributed spread centered around \( \lambda \).

---

#### Part 2: Splitting and Merging the Poisson Process

- Take the events from the single Poisson source and randomly assign each to one of two categories (Source A and Source B).
- This simulates **splitting** the process, where each sub-source independently emits with reduced rate \( \lambda_1 \) and \( \lambda_2 \), such that \( \lambda_1 + \lambda_2 = \lambda \).
- Visualize both sub-processes separately.

**Expected Observation**: Each new source behaves like a Poisson process with its own rate.

---

#### Part 3: Exponential THingy of Poisson Processes

- Simulate two independent Poisson sources (A and B) with known rates \( \lambda_1 \) and \( \lambda_2 \).
- Merge the results by summing particle counts from both sources at each interval.
- Visualize the merged process.

**Expected Observation**: The combined process behaves like a Poisson process with rate \( \lambda = \lambda_1 + \lambda_2 \).

---
