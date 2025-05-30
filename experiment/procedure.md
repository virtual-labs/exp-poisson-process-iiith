### Procedure

#### **Emergence of Poisson Process**

This experiment demonstrates how a **Poisson Process** emerges from **Repeated Bernoulli Trials** by gradually increasing the number of trials \( n \). The **Binomial distribution** applies when we have a fixed number of events \( n \), each with a constant probability of success \( p \). But what if we don’t know the number of trials? Instead, we know the **average rate of success per unit time**, denoted as:

\[
\lambda = n \cdot p
\]

Here, \( \lambda \) is the **rate of successes per time unit**. As \( n \to \infty \) and \( p \to 0 \), while keeping \( \lambda \) constant, the **Binomial distribution converges to a Poisson distribution**.

Your task is to:
1. **Start with a small value of \( n \)** — the distribution should resemble a Bernoulli/Binomial behavior.
2. **Gradually increase \( n \)** while keeping \( \lambda \) fixed — observe how the distribution transforms into a **Poisson distribution**.

---

#### **Merging and Splitting of Poisson Processes**

Next, we demonstrate the **superposition (merging)** and **splitting** of Poisson processes using an analogy of radioactive emitters. We have 2 emitters with average rates which can be adjusted.

- Let two independent emitters have average rates \( \lambda_1 \) and \( \lambda_2 \).
- **Merging** the two emitters results in a single Poisson process with rate:
  \[
  \lambda = \lambda_1 + \lambda_2
  \]
- **Splitting** the process probabilistically assigns each event to either of the original sources, effectively recreating the processes with rates \( \lambda_1 \) and \( \lambda_2 \).

Your task is to:
1. **Verify the phenomenon** - by noting the new average rates of emssion before and after splitting/merging.
2. **Check for by changing value of \lambda_1 and \lambda_2** - change the value of \lambda_1 and \lambda_2 and verify the phenomenon again.

---

#### **Interarrival Times of the Poisson Process**

Finally, we show that the **interarrival times** (i.e., the time between successive events) in a Poisson process follow an **Exponential distribution**. Specifically:

- If the Poisson process has rate \( \lambda \),
- Then the interarrival time \( T \) is an **Exponential random variable** with probability density:
  \[
  f_T(t) = \lambda e^{-\lambda t}, \quad t \geq 0
  \]

We simulate this behavior and verify that the histogram of interarrival times matches the exponential distribution.