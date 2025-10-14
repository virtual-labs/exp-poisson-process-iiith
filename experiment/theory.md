### Overview

The Poisson distribution arises naturally as a limit of the binomial distribution when the number of trials becomes large and the success probability becomes small, such that the expected number of successes remains constant. This is a key idea in stochastic processes and models real-world arrivald such as radioactive decay, call arrivals, and queue arrivals.

Let $X_n \sim \text{Bin}(n, p)$ denote a binomial random variable, where:

* $n$ is the number of independent Bernoulli trials.
* $p$ is the probability of success.
* $\lambda = np$ is the expected number of successes.

We are interested in the behavior of $X_n$ as $n \to \infty$, such that $\lambda = np$ is held constant.

Let $X_n \sim \text{Bin}(n, \lambda/n)$. Then:

$$
\lim_{n \to \infty} \mathbb{P}(X_n = k) = \frac{e^{-\lambda} \lambda^k}{k!}, \quad \text{for all } k \in \{0,1,2,....\}.
$$

$$
\begin{aligned}
\mathbb{P}(X_n = k) &= \binom{n}{k} \left(\frac{\lambda}{n}\right)^k \left(1 - \frac{\lambda}{n}\right)^{n - k} \\
&= \frac{n(n-1)\dots(n-k+1)}{k!} \cdot \left(\frac{\lambda^k}{n^k}\right) \cdot \left(1 - \frac{\lambda}{n}\right)^n \cdot \left(1 - \frac{\lambda}{n}\right)^{-k}.
\end{aligned}
$$

Using the limits:

* $\frac{n(n-1)\dots(n-k+1)}{n^k} \to 1$,
* $\left(1 - \frac{\lambda}{n}\right)^n \to e^{-\lambda}$,
* $\left(1 - \frac{\lambda}{n}\right)^{-k} \to 1$,

the expression converges to:

$$
\frac{\lambda^k e^{-\lambda}}{k!}.
$$

This proves convergence in distribution to the Poisson distribution.

### Theorem: Superposition

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

### Inter-arrival Times in a Poisson Process

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
