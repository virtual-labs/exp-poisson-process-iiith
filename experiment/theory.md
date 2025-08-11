## Experiment 1: Emergence of the Poisson Process from Bernoulli Trials

### 1.1 Overview

The Poisson distribution arises naturally as a limit of the Binomial distribution when the number of trials becomes large and the success probability becomes small, such that the expected number of successes remains constant. This is a key idea in stochastic processes and models real-world events such as radioactive decay, call arrivals, and queue arrivals.

### 1.2 Formal Setting

Let $X_n \sim \text{Bin}(n, p)$ denote a Binomial random variable, where:

*   $n$ is the number of independent Bernoulli trials.
*   $p$ is the probability of success.
*   $\lambda = np$ is the expected number of successes.

We are interested in the behavior of $X_n$ as $n \to \infty$, $p \to 0$, such that $\lambda = np$ is held constant.

### 1.3 Poisson Limit Theorem (Rigorous Proof)

Let $X_n \sim \text{Bin}(n, \lambda/n)$. Then:

$$
\lim_{n \to \infty} \mathbb{P}(X_n = k) = \frac{e^{-\lambda} \lambda^k}{k!}, \quad \text{for all } k \in \mathbb{N}_0.
$$

**Proof:**

$$
\begin{aligned}
\mathbb{P}(X_n = k) &= \binom{n}{k} \left(\frac{\lambda}{n}\right)^k \left(1 - \frac{\lambda}{n}\right)^{n - k} \\
&= \frac{n(n-1)\dots(n-k+1)}{k!} \cdot \left(\frac{\lambda^k}{n^k}\right) \cdot \left(1 - \frac{\lambda}{n}\right)^n \cdot \left(1 - \frac{\lambda}{n}\right)^{-k}.
\end{aligned}
$$

Using the limits:

*   $\frac{n(n-1)\dots(n-k+1)}{n^k} \to 1$,
*   $\left(1 - \frac{\lambda}{n}\right)^n \to e^{-\lambda}$,
*   $\left(1 - \frac{\lambda}{n}\right)^{-k} \to 1$,

the expression converges to:

$$
\frac{\lambda^k e^{-\lambda}}{k!}.
$$

This proves convergence in distribution to the Poisson distribution.

---

## Experiment 2: Merging and Splitting of Poisson Processes

### 2.1 Merging of Independent Poisson Processes

Let $N_1(t) \sim \text{Poisson}(\lambda_1 t)$, $N_2(t) \sim \text{Poisson}(\lambda_2 t)$, and assume independence.
Define $N(t) = N_1(t) + N_2(t)$.

### Theorem: Superposition

$N(t) \sim \text{Poisson}((\lambda_1 + \lambda_2)t)$.

**Proof:**
Let $X \sim \text{Poisson}(\lambda_1 t), Y \sim \text{Poisson}(\lambda_2 t)$, then:

$$
\mathbb{P}(X + Y = k) = \sum_{i=0}^{k} \mathbb{P}(X = i) \mathbb{P}(Y = k - i)
$$

$$
= e^{-(\lambda_1 + \lambda_2)t} \sum_{i=0}^k \frac{(\lambda_1 t)^i}{i!} \cdot \frac{(\lambda_2 t)^{k - i}}{(k - i)!}
$$

$$
= \frac{e^{-(\lambda_1 + \lambda_2)t}}{k!} \sum_{i=0}^{k} \binom{k}{i} (\lambda_1 t)^i (\lambda_2 t)^{k - i}
= \frac{e^{-(\lambda_1 + \lambda_2)t}}{k!} (\lambda_1 t + \lambda_2 t)^k
$$

$$
= \frac{(\lambda_1 + \lambda_2)^k t^k}{k!} e^{-(\lambda_1 + \lambda_2)t}.
$$

This is the PMF of a $\text{Poisson}((\lambda_1 + \lambda_2)t)$ process.

### 2.2 Splitting (Thinning) of Poisson Process

Let $N(t) \sim \text{Poisson}(\lambda t)$, and each event is assigned independently with probability $p$ to stream 1, and with $1 - p$ to stream 2.

Define $N_1(t), N_2(t)$ to be the number of events in each stream.

### Theorem: Thinning

$N_1(t) \sim \text{Poisson}(p \lambda t), \quad N_2(t) \sim \text{Poisson}((1 - p)\lambda t)$, and $N_1, N_2$ are independent.

**Proof:**
Given $N(t) = n$, the number of events in stream 1 is $\text{Bin}(n, p)$.

By total probability:

$$
\mathbb{P}(N_1(t) = k) = \sum_{n = k}^{\infty} \mathbb{P}(N(t) = n) \binom{n}{k} p^k (1 - p)^{n - k}
$$

$$
= \sum_{n = k}^{\infty} \frac{(\lambda t)^n e^{-\lambda t}}{n!} \cdot \binom{n}{k} p^k (1 - p)^{n - k}.
$$

Rewriting:

$$
= \frac{(p \lambda t)^k e^{-\lambda t}}{k!} \sum_{n = k}^{\infty} \frac{((1 - p) \lambda t)^{n - k}}{(n - k)!}
= \frac{(p \lambda t)^k e^{-\lambda t}}{k!} e^{(1 - p) \lambda t} = \frac{(p \lambda t)^k e^{-p \lambda t}}{k!}
$$

This proves $N_1(t) \sim \text{Poisson}(p \lambda t)$. Independence follows by construction.

---

## Experiment 3: Inter-arrival Times in a Poisson Process

Let $T_1, T_2, \dots$ be arrival times in a homogeneous Poisson process with rate $\lambda$.
Define inter-arrival times $S_n = T_n - T_{n - 1}$ (with $T_0 = 0$).

### Theorem: Exponential Inter-arrival Times

Each $S_n \sim \text{Exp}(\lambda)$, and the $S_n$ are i.i.d. (independent and identically distributed).

**Proof:**
The probability that no event occurs in the interval $[0, t]$ is:

$$
\mathbb{P}(S_1 > t) = \mathbb{P}(N(t) = 0) = e^{-\lambda t}
$$

So the Cumulative Distribution Function (CDF) of $S_1$ is:

$$
F_{S_1}(t) = \mathbb{P}(S_1 \le t) = 1 - \mathbb{P}(S_1 > t) = 1 - e^{-\lambda t}
$$

The Probability Density Function (PDF) is the derivative of the CDF:
$$
f_{S_1}(t) = \frac{d}{dt}(1 - e^{-\lambda t}) = \lambda e^{-\lambda t}, \quad t \ge 0
$$

By the memoryless property of the Poisson process, the process effectively "restarts" after each arrival. This means the time until the next arrival ($S_2$) is independent of the previous waiting time and follows the same distribution. Hence, $S_2, S_3, \dots \sim \text{Exp}(\lambda)$ i.i.d.