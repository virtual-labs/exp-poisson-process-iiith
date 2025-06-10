### Procedure

#### **Emergence of Poisson Process**

This experiment demonstrates how a **Poisson Process** emerges from **Repeated Bernoulli Trials** by gradually increasing the number of trials \( n \). The **Binomial distribution** applies when we have a fixed number of events \( n \), each with a constant probability of success \( p \). But what if we don’t know the number of trials? Instead, we know the **average rate of success per unit time**, denoted as:

λ = n.p

Here, \( λ \) is the **rate of successes per time unit**. As \( n → ∞ \) and \( p → 0 \), while keeping \( λ \) constant, the **Binomial distribution converges to a Poisson distribution**.

Your task is to:

1. **Start with a small value of \( n \)** — the distribution should resemble a Bernoulli/Binomial behavior.
2. **Gradually increase \( n \)** while keeping \( λ \) fixed — observe how the distribution transforms into a **Poisson distribution**.
3. **Observe the decrease in the error** of the two distributions as the value of n is increased.

---

#### **Merging and Splitting of Poisson Processes**

Next, we demonstrate the **superposition (merging)** and **splitting** of Poisson processes using an analogy of radioactive emitters. We have 2 emitters with average rates which can be adjusted.

- Let two independent emitters have average rates \( λ_1 \) and \( λ_2 \).
- **Merging** the two emitters results in a single Poisson process with rate: λ = λ_1 + λ_2
- **Splitting** the process probabilistically assigns each event to either of the original sources, effectively recreating the processes with rates \( λ_1 \) and \( λ_2 \).

Your task is to:

1. **Verify the phenomenon** - by noting the new average rates of emssion before and after splitting/merging.
2. **Check for by changing value of λ_1 and λ_2** - change the value of λ_1 and λ_2 and verify the phenomenon again.
3. **Check the splitted distribution** - check the new distributions show poisson process with the correct average rates.

---

#### **Interarrival Times of the Poisson Process**

Finally, we show that the **interarrival times** (i.e., the time between successive events) in a Poisson process follow an **Exponential distribution**. Specifically:

- If the Poisson process has rate \( λ \),
- Then the interarrival time \( T \) is an **Exponential random variable** with probability density: f_T(t) = λ × exp(–λt),   t ≥ 0

We simulate this behavior and verify that the histogram of interarrival times matches the exponential distribution.
