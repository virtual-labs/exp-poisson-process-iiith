// poisson.js

// We'll create two Chart.js instances: one for Poisson PMF, one for Gaussian PDF.
// Then update both whenever the slider 'n' changes.

// Global references to Chart.js objects
let poissonChart = null;
let gaussianChart = null;

// Utility: Factorial (we'll use a memoized approach up to, say, 200)
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

// Compute Poisson PMF P(X = k) = e^{-λ} λ^k / k!
function poissonPMF(lambda, k) {
    // For moderate k and lambda (≤50), direct formula is fine.
    return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}

// Compute Gaussian PDF with mean μ = λ and variance σ² = λ
function gaussianPDF(lambda, x) {
    const mu = lambda;
    const sigma = Math.sqrt(lambda);
    const coeff = 1 / (Math.sqrt(2 * Math.PI) * sigma);
    const exponent = -Math.pow(x - mu, 2) / (2 * lambda);
    return coeff * Math.exp(exponent);
}

// Build data arrays and update both charts
function updateCharts(nValue) {
    const lambda = nValue;

    // 1) Build Poisson PMF array for k = 0..K_max, where K_max ≈ λ + 4√λ
    const Kmax = Math.ceil(lambda + 4 * Math.sqrt(lambda));
    const pmfLabels = [];
    const pmfData = [];
    for (let k = 0; k <= Kmax; k++) {
        pmfLabels.push(k);
        pmfData.push(poissonPMF(lambda, k));
    }

    // 2) Build Gaussian PDF over a fine grid [0, Kmax], step = 0.1
    const pdfLabels = [];
    const pdfData = [];
    for (let x = 0; x <= Kmax; x += 0.1) {
        pdfLabels.push(parseFloat(x.toFixed(1)));
        pdfData.push(gaussianPDF(lambda, x));
    }

    // 3) Update Poisson Chart (bar chart)
    poissonChart.data.labels = pmfLabels;
    poissonChart.data.datasets[0].data = pmfData;
    poissonChart.options.scales.y.max = Math.max(...pmfData) * 1.1;
    poissonChart.options.plugins.title.text = `Poisson PMF (λ = ${lambda})`;
    poissonChart.update();

    // 4) Update Gaussian Chart (line chart)
    gaussianChart.data.labels = pdfLabels;
    gaussianChart.data.datasets[0].data = pdfData;
    // Find a reasonable y-max so that Gaussian peak is visible
    const peakPDF = Math.max(...pdfData);
    gaussianChart.options.scales.y.max = peakPDF * 1.1;
    gaussianChart.options.plugins.title.text = `Gaussian PDF \n(μ = ${lambda}, σ² = ${lambda})`;
    gaussianChart.update();

    // 5) Fill in Observations
    const obsDiv = document.getElementById('observations');
    let comment = '';
    if (lambda < 5) {
        comment = `<p>When λ = ${lambda}, the Poisson PMF is noticeably skewed (right‐tail). The Gaussian PDF is a poor fit, especially near k = 0.</p>`;
    } else if (lambda < 20) {
        comment = `<p>When λ = ${lambda}, the Poisson PMF is less skewed, and the Gaussian starts to approximate it around the mode. However, there remain visible deviations at low k and high k.</p>`;
    } else {
        comment = `<p>When λ = ${lambda}, Poisson\((λ)\) looks almost symmetric. The Gaussian PDF (blue curve) closely matches the Poisson bars. As λ grows, the two match extremely well.</p>`;
    }
    obsDiv.innerHTML = comment;
}

// Initialize both Chart.js charts when the page loads
function initializeCharts() {
    const ctxPois = document.getElementById('poissonChart').getContext('2d');
    const ctxGauss = document.getElementById('gaussianChart').getContext('2d');

    // Create a bar chart for Poisson
    poissonChart = new Chart(ctxPois, {
        type: 'bar',
        data: {
            labels: [], // will be filled on first update
            datasets: [{
                label: 'Poisson P(X=k)',
                data: [],
                backgroundColor: 'rgba(220, 53, 69, 0.5)', // redish bars
                borderColor: 'rgba(220, 53, 69, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Poisson PMF'
                },
                legend: { display: false }
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
                    }
                }
            }
        }
    });

    // Create a line chart for Gaussian
    gaussianChart = new Chart(ctxGauss, {
        type: 'line',
        data: {
            labels: [], // will be filled on first update
            datasets: [{
                label: 'Gaussian f(x)',
                data: [],
                borderColor: 'teal',
                borderWidth: 2,
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Gaussian PDF'
                },
                legend: { display: false }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'x'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'f(x)'
                    }
                }
            }
        }
    });

    // Initially populate with n = 10
    updateCharts(10);
}

// Hook up the slider
window.addEventListener('DOMContentLoaded', () => {
    initializeCharts();

    const slider = document.getElementById('sliderN');
    const display = document.getElementById('displayN');

    // Whenever the slider moves, update the two charts and observations
    slider.addEventListener('input', (e) => {
        const nVal = parseInt(e.target.value, 10);
        display.textContent = nVal;
        updateCharts(nVal);
    });
});
