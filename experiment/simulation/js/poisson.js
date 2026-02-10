// poisson.js

// Single Chart.js object for combined plot
let combinedChart = null;

// Utility to compute Binomial PMF via recurrence
function computeBinomialPMF(n, p, Kmax) {
    const pmf = [];
    if (p >= 1) {
        for (let k = 0; k <= Kmax; k++) pmf.push(k === n ? 1 : 0);
        return pmf;
    }
    let Pk = Math.pow(1 - p, n);
    pmf.push(Pk);
    for (let k = 0; k < Kmax; k++) {
        const multiplier = ((n - k) / (k + 1)) * (p / (1 - p));
        Pk *= multiplier;
        pmf.push(Pk);
    }
    return pmf;
}

// Compute Poisson PMF
const factorialCache = [1];
function factorial(k) {
    if (factorialCache[k] !== undefined) return factorialCache[k];
    let result = factorialCache[factorialCache.length - 1];
    for (let i = factorialCache.length; i <= k; i++) {
        result *= i;
        factorialCache[i] = result;
    }
    return result;
}
function poissonPMF(lambda, k) {
    return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}

// Compute and update the combined chart + average error + observations
function updateCombinedChart(n, lambda) {
    const p = lambda / n;

    const rawK = Math.ceil(lambda + 4 * Math.sqrt(lambda));
    const Kmax = Math.min(n, rawK);

    const labels = [], binData = [], poisData = [];
    const binPMF = computeBinomialPMF(n, p, Kmax);
    for (let k = 0; k <= Kmax; k++) {
        labels.push(k);
        binData.push(binPMF[k]);
        poisData.push(poissonPMF(lambda, k));
    }

    combinedChart.data.labels = labels;
    combinedChart.data.datasets[0].data = binData;
    combinedChart.data.datasets[1].data = poisData;
    combinedChart.options.scales.y.max = Math.max(...binData, ...poisData) * 1.1;
    combinedChart.options.plugins.title.text = `Binomial(n=${n}, p=${p.toFixed(4)}) vs Poisson(λ=${lambda})`;
    combinedChart.update();

    let sumErr = 0, maxErr = 0;
    for (let k = 0; k <= Kmax; k++) {
        const currentError = Math.abs(binData[k] - poisData[k]);
        sumErr += currentError;
        if (currentError > maxErr) maxErr = currentError;
    }
    const avgErr = (sumErr / (Kmax + 1)).toFixed(6);
    const maxErrStr = maxErr.toFixed(6);

    const avgDiv = document.getElementById('avgError');
    avgDiv.innerHTML = `Average absolute error: <span style="color: #3273dc;">${avgErr}</span><br>Maximum absolute error: <span style="color: #3273dc;">${maxErrStr}</span>`;
    
    const obsDiv = document.getElementById('observations');
    let comment = '';
if (maxErr > 0.01) {
      comment = `<p>With a relatively small <strong>n = ${n}</strong>, there is a <strong>clear gap</strong> between the Binomial (red) and Poisson (blue) distributions. 
                 The conditions for the approximation are not yet met, resulting in a noticeable maximum error of <strong>${maxErrStr}</strong>. 
                 Try increasing <em>n</em> to see them converge.</p>`;
    } else if (maxErr > 0.005) {
      comment = `<p>Now, with <strong>n = ${n}</strong>, the Binomial distribution is a <strong>good approximation</strong> of the Poisson. 
                 Notice how the main peaks and shapes align well. The average error of <strong>${avgErr}</strong> is quite small, with minor differences remaining, usually away from the peak.</p>`;
    } else {
      comment = `<p>This is an <strong>excellent match!</strong> At <strong>n = ${n}</strong>, the Binomial distribution is visually indistinguishable from the Poisson distribution. 
                 This demonstrates the core principle: for a large <em>n</em> and small <em>p</em>, the Binomial\\(\\bigl(n,\\frac{λ}{n}\\bigr)\\) effectively <strong>becomes</strong> the Poisson\\((λ)\\). The extremely low average error of <strong>${avgErr}</strong> confirms this convergence.</p>`;
    }
    obsDiv.innerHTML = comment;

    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([obsDiv]);
    }
}

// Initialize the combined Chart.js chart when the page loads
function initializeCombinedChart() {
    const ctx = document.getElementById('combinedChart').getContext('2d');
    combinedChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                { label: 'Binomial P(X=k)', data: [], backgroundColor: 'rgba(220, 53, 69, 0.5)', borderColor: 'rgba(220, 53, 69, 1)', borderWidth: 1 },
                { label: 'Poisson P(X=k)', data: [], backgroundColor: 'rgba(54, 162, 235, 0.5)', borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 1 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            animation: { duration: 50 },
            plugins: {
                title: { display: true, text: 'Binomial vs Poisson PMF' },
                legend: { position: 'top' }
            },
            scales: {
                x: { title: { display: true, text: 'k' }},
                y: { beginAtZero: true, title: { display: true, text: 'P(X = k)' }, max: 1 }
            }
        }
    });
    updateCombinedChart(50, 10);
}

// Hook up the sliders once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    initializeCombinedChart();

    const sliderN = document.getElementById('sliderN');
    const displayN = document.getElementById('displayN');
    const inputLambda = document.getElementById('inputLambda');
    const lambdaError = document.getElementById('lambdaError');

    // When n slider changes:
    sliderN.addEventListener('input', (e) => {
        const nVal = parseInt(e.target.value, 10);
        displayN.textContent = nVal;
        
        let lambda = parseFloat(inputLambda.value);
        if (lambda > nVal) {
            lambda = nVal;
            inputLambda.value = lambda;
            lambdaError.textContent = ''; // Clear error as we auto-corrected
        }
        updateCombinedChart(nVal, lambda); 
    });

    // When λ number input changes:
    inputLambda.addEventListener('input', (e) => {
        lambdaError.textContent = ''; // Clear previous errors on new input
        let lambda = parseFloat(e.target.value);
        const nVal = parseInt(sliderN.value, 10);
        const minLambda = parseFloat(e.target.min);
        const maxLambda = parseFloat(e.target.max);

        if (isNaN(lambda)) {
             // Don't do anything if the input is not a number yet (e.g., empty)
            return;
        }

        // Constraint 1: λ must not be greater than n
        if (lambda > nVal) {
            lambdaError.textContent = 'λ cannot be greater than n.';
            lambda = nVal;
            e.target.value = lambda;
            updateCombinedChart(nVal, lambda);
            return; // Stop further checks
        }

        // Constraint 2: Check against hard-coded min/max from HTML
        if (lambda < minLambda) {
            lambdaError.textContent = `Value must be at least ${minLambda}.`;
            lambda = minLambda;
            e.target.value = lambda;
        } else if (lambda > maxLambda) {
            lambdaError.textContent = `Value must not exceed ${maxLambda}.`;
            lambda = maxLambda;
            e.target.value = lambda;
        }

        updateCombinedChart(nVal, lambda);
    });
});