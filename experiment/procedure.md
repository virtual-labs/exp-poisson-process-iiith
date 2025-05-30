### Procedure

This experiment aims to show the emergence of Poisson Process from the Repeated Bernoulli Trials by setting the number of trials very large. The binomial distribution works when we have a fixed number of events n, each with a constant probability of success p. Imagine we don’t know the number of trials that will happen. Instead, we only know the average number of successes per time period. So we know the rate of successes per day, but not the number of trials n or the probability of success p that led to that rate. Define a number λ =np. Let this be the rate of successes per day. It’s equal to np. That’s the number of trials n — however many there are — times the chance of success p for each of those trials. Your Job is to change the value of n from a small value (where the plot should look like Bernoulli), and keep on increasing it (where it transforms to Poisson for the chosen value of λ).

Next we demonstrate the splitting and merging of the poisson process, using radioactive emitters. Average rate of an emmitter be say λ1 and another be say λ2. Now if we merge them we get a new rate of λ1+λ2. Simmilarly, if we split it again we get the rates of λ1 and λ2 seperately.
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
