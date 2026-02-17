### **Sub-Experiment 1: Emergence of Poisson Process**

This experiment demonstrates how a **Poisson Process** emerges from **Repeated Bernoulli Trials** by gradually increasing the number of trials \( n \). The **Binomial distribution** applies when we have a fixed number of events \( n \), each with a constant probability of success \( p \). But what if we don’t know the number of trials? Instead, we know the **average rate of success per unit time**, denoted as:

$λ$ = np

Here, \( $λ$ \) is the **rate of successes per time unit**. As \( n → ∞ \) and \( p → 0 \), while keeping \( $λ$ \) constant, the **Binomial distribution converges to a Poisson distribution**.

Your task is to:

1. **Start with a small value of \( n \)** — the distribution should resemble a Bernoulli/Binomial behavior.
2. **Gradually increase \( n \)** while keeping \( $λ$ \) fixed — observe how the two distributions on the chart begin to overlap.
3. **Observe the decrease in the error** metrics displayed below the chart as the value of \( n \) is increased, confirming the convergence.

---

### **Sub-Experiment 2: Merging of Poisson Processes**

Next, we demonstrate the merging of Poisson processes using an analogy of radioactive emitters. We have 2 emitters with adjustable average rates.

- Let two independent emitters have average rates \( $λ_1$ \) and \( $λ_2$ \).
- **Merging** the two emitters results in a single Poisson process with a new rate: $\lambda = \lambda_1 + \lambda_2$.
- **Reset** the process reverts to the two independent streams with their original rates.

Your task is to:

1. **Verify the merging phenomenon**: Start the simulation and click "Merge". Observe in the "Observations" panel how the combined emission rate approaches the theoretical sum ($\lambda_1 + \lambda_2$).
2. **Change the rates**: Adjust the sliders for λ₁ and λ₂ and repeat the process to see that the principle holds for different values.

---

### **Sub-Experiment 3: Inter-arrival Times of the Poisson Process**

Finally, we show that the **inter-arrival times** (i.e., the time between successive events) in a Poisson process follow an **Exponential distribution**. We also verify that these times are **independent**.

- If a Poisson process has rate \( $λ$ \), the inter-arrival time \( T \) is an **Exponential random variable** with probability density: $f(t) = \lambda e^{-λt}$.
- The independence of inter-arrival times means that the time until the next event does not depend on when the last event occurred.

Your task is to:

1. **Set a rate \(λ\)** using the slider, the inter arrival time you want to map and press **Start**.
2. **Observe the Distribution Analysis chart**: As events are recorded, watch the blue histogram of sampled inter-arrival times take the shape of the theoretical orange curve (the Exponential PDF).
3. **Observe the Independence Analysis chart**: Note that the scatter plot of consecutive inter-arrival times, (Tᵢ, Tᵢ₊₁), forms a random cloud. This indicates no correlation, and the best-fit line's slope should be near zero, confirming independence.
