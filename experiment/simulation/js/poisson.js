// poisson.js

// Single Chart.js object for combined plot
let combinedChart = null;

// Utility to compute Binomial PMF via recurrence
// P_binom(0) = (1 - p)^n
// P_binom(k+1) = P_binom(k) * [(n - k)/(k + 1)] * [p/(1 - p)]
function computeBinomialPMF(n, p, Kmax) {
    const pmf = [];
    // If p >= 1, degenerate at k = n
    if (p >= 1) {
        for (let k = 0; k <= Kmax; k++) {
            pmf.push(k === n ? 1 : 0);
        }
        return pmf;
    }
    // Compute P(X = 0)
    let Pk = Math.pow(1 - p, n);
    pmf.push(Pk);
    for (let k = 0; k < Kmax; k++) {
        // Recurrence: P(k+1) = P(k) * [(n - k)/(k + 1)] * [p/(1 - p)]
        const multiplier = ((n - k) / (k + 1)) * (p / (1 - p));
        Pk = Pk * multiplier;
        pmf.push(Pk);
    }
    return pmf;
}

// Compute Poisson PMF P(X = k) = e^{-λ} λ^k / k!
const factorialCache = [1];
function factorial(k) {
    if (factorialCache[k] !== undefined) {
        return factorialCache[k];
    }
    let last = factorialCache.length - 1;
    let result = factorialCache[last];
    for (let i = last + 1; i <= k; i++) {
        result *= i;
        factorialCache[i] = result;
    }
    return factorialCache[k];
}
function poissonPMF(lambda, k) {
    return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}

// Compute and update the combined chart + average error + observations
function updateCombinedChart(n, lambda) {
    // Ensure lambda ≤ n so that p = λ/n ≤ 1
    if (lambda > n) {
        lambda = n;
    }
    const p = lambda / n;

    // Determine Kmax = min(n, ceil(lambda + 4*sqrt(lambda)))
    const rawK = Math.ceil(lambda + 4 * Math.sqrt(lambda));
    const Kmax = Math.min(n, rawK);

    // Build Binomial PMF array for k = 0..Kmax
    const labels = [];
    const binData = [];
    const poisData = [];

    const binPMF = computeBinomialPMF(n, p, Kmax);
    for (let k = 0; k <= Kmax; k++) {
        labels.push(k);
        binData.push(binPMF[k]);
    }

    // Build Poisson PMF array for k = 0..Kmax
    for (let k = 0; k <= Kmax; k++) {
        poisData.push(poissonPMF(lambda, k));
    }

    // Update Chart.js data
    combinedChart.data.labels = labels;
    combinedChart.data.datasets[0].data = binData;   // Dataset 0: Binomial
    combinedChart.data.datasets[1].data = poisData;  // Dataset 1: Poisson
    // Adjust Y-axis max to 1.1 × the larger of the two maxima
    const maxY = Math.max(...binData, ...poisData) * 1.1;
    combinedChart.options.scales.y.max = maxY;

    // Update chart title to reflect current (n, λ)
    combinedChart.options.plugins.title.text =
        `Binomial(n=${n}, p=${p.toFixed(4)}) vs Poisson(λ=${lambda})`;
    combinedChart.update();

    // Compute average absolute error
    let sumErr = 0;
    for (let k = 0; k <= Kmax; k++) {
        sumErr += Math.abs(binData[k] - poisData[k]);
    }
    const avgErr = (sumErr / (Kmax + 1)).toFixed(6);

    // Update the avgError div
    const avgDiv = document.getElementById('avgError');
    avgDiv.innerHTML = `Average absolute error: <span style="color: #3273dc;">${avgErr}</span>`;

    // Fill in Observations
    const obsDiv = document.getElementById('observations');
    let comment = '';
    if (n < 50) {
        comment = `<p>For <strong>n = ${n}</strong> and <strong>λ = ${lambda}</strong>, 
                   the Binomial PMF (red) still differs noticeably from Poisson (blue). The mean error 
                   is <strong>${avgErr}</strong>, and you can see deviations at multiple k‐values.</p>`;
    } else if (n < 200) {
        comment = `<p>With <strong>n = ${n}</strong>, Binomial\((n,\tfrac{λ}{n})\) (red) is beginning to 
                   resemble Poisson\((λ)\) (blue). The average error is <strong>${avgErr}</strong>, 
                   and deviations are mostly in the tails.</p>`;
    } else {
        comment = `<p>At <strong>n = ${n}</strong> with <strong>λ = ${lambda}</strong>, Binomial (red) and 
                   Poisson (blue) are nearly indistinguishable. The average error is 
                   <strong>${avgErr}</strong>, demonstrating the convergence of 
                   Binomial\(\bigl(n,\tfrac{λ}{n}\bigr)\) → Poisson\((λ)\).</p>`;
    }
    if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise();
    }

    obsDiv.innerHTML = comment;
}

// Initialize the combined Chart.js chart when the page loads
function initializeCombinedChart() {
    const ctx = document.getElementById('combinedChart').getContext('2d');

    combinedChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [], // will be filled on first update
            datasets: [
                {
                    label: 'Binomial P(X=k)',
                    data: [],
                    backgroundColor: 'rgba(220, 53, 69, 0.5)',   // red bars
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Poisson P(X=k)',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',  // blue bars
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Binomial vs Poisson PMF'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'k'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'P(X = k)'
                    },
                    max: 1 // will be updated on first draw
                }
            }
        }
    });

    // Initial draw with default parameters (n=100, λ=10)
    updateCombinedChart(100, 10);
}

// Hook up the sliders once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    initializeCombinedChart();

    const sliderN = document.getElementById('sliderN');
    const displayN = document.getElementById('displayN');
    const sliderLambda = document.getElementById('sliderLambda');
    const displayLambda = document.getElementById('displayLambda');

    // When n‐slider changes:
    sliderN.addEventListener('input', (e) => {
        const nVal = parseInt(e.target.value, 10);
        displayN.textContent = nVal;

        // Ensure λ's max ≤ nVal
        sliderLambda.max = nVal;
        if (parseInt(sliderLambda.value, 10) > nVal) {
            sliderLambda.value = nVal;
            displayLambda.textContent = nVal;
        }

        // Update the combined chart
        updateCombinedChart(nVal, parseInt(sliderLambda.value, 10));
    });

    // When λ‐slider changes:
    sliderLambda.addEventListener('input', (e) => {
        const lambdaVal = parseInt(e.target.value, 10);
        displayLambda.textContent = lambdaVal;
        updateCombinedChart(parseInt(sliderN.value, 10), lambdaVal);
    });
});
