// --------------------------------------
// 1. References & Global Variables
// --------------------------------------
const histogramChartCtx = document.getElementById("histogramChart").getContext("2d");
const scatterChartCtx = document.getElementById("scatterChart").getContext("2d");

let histogramChart, scatterChart;

// DOM Elements
const lambdaSlider = document.getElementById("lambda");
const lambdaVal = document.getElementById("lambdaVal");
const indexSelect = document.getElementById("interArrivalTimeIndex");
const trialsSlider = document.getElementById("numTrials");
const trialsVal = document.getElementById("numTrialsVal");
const runBtn = document.getElementById("runBtn");
const resetBtn = document.getElementById("resetBtn");
const observationsDiv = document.getElementById("observations");

// --------------------------------------
// 2. Chart Initialization
// --------------------------------------
function initializeCharts() {
    if (histogramChart) histogramChart.destroy();
    histogramChart = new Chart(histogramChartCtx, {
        type: 'bar',
        data: { labels: [], datasets: [ { label: 'Empirical Distribution', data: [], backgroundColor: 'rgba(30, 144, 255, 0.6)' }, { label: 'Theoretical Exponential PDF', data: [], type: 'line', borderColor: 'rgba(255, 159, 64, 1)', borderWidth: 3, pointRadius: 0 } ] },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: "Inter-arrival Time (T)" }}, y: { title: { display: true, text: "Frequency" }} } }
    });

    if (scatterChart) scatterChart.destroy();
    scatterChart = new Chart(scatterChartCtx, {
        type: 'scatter',
        data: { datasets: [ { label: 'T_i vs T_{i+1}', data: [], backgroundColor: 'rgba(220, 20, 60, 0.7)' }, { label: 'Best-fit Line', data: [], type: 'line', borderColor: 'rgba(0, 0, 0, 0.8)', borderWidth: 2, pointRadius: 0 } ] },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'linear', position: 'bottom', title: { display: true, text: 'T_i' } }, y: { title: { display: true, text: 'T_{i+1}' } } } }
    });
}

// --------------------------------------
// 3. Event Listeners
// --------------------------------------
lambdaSlider.oninput = () => { lambdaVal.textContent = parseFloat(lambdaSlider.value).toFixed(1); };
trialsSlider.oninput = () => { trialsVal.textContent = trialsSlider.value; };
runBtn.addEventListener('click', runSimulation);
resetBtn.addEventListener('click', resetSimulation);

// --------------------------------------
// 4. Simulation Core
// --------------------------------------
function runSimulation() {
    // Disable controls during simulation
    runBtn.disabled = true;
    resetBtn.disabled = true;

    // Get parameters from UI
    const lambda = parseFloat(lambdaSlider.value);
    const numTrials = parseInt(trialsSlider.value);
    const selectedIndex = parseInt(indexSelect.value); // The 'i' in T_i

    // Data arrays
    const targetInterArrivalTimes = [];
    const nextInterArrivalTimes = [];

    // Main simulation loop
    for (let i = 0; i < numTrials; i++) {
        // We need to generate `selectedIndex + 1` inter-arrival times to get T_i and T_{i+1}
        let targetTime, nextTime;
        for (let j = 1; j <= selectedIndex + 1; j++) {
            if (j === selectedIndex) {
                targetTime = exponentialRandom(lambda);
            } else if (j === selectedIndex + 1) {
                nextTime = exponentialRandom(lambda);
            } else {
                exponentialRandom(lambda); // Generate and discard previous times
            }
        }
        targetInterArrivalTimes.push(targetTime);
        nextInterArrivalTimes.push(nextTime);
    }
    
    // Update visuals with the collected data
    updateHistogramChart(targetInterArrivalTimes, lambda);
    updateScatterChart(targetInterArrivalTimes, nextInterArrivalTimes);
    updateObservations(targetInterArrivalTimes, nextInterArrivalTimes, lambda);
    
    // Re-enable controls
    runBtn.disabled = false;
    resetBtn.disabled = false;
}

function resetSimulation() {
    // Clear data in charts
    histogramChart.data.labels = [];
    histogramChart.data.datasets.forEach(ds => ds.data = []);
    histogramChart.update();

    scatterChart.data.datasets.forEach(ds => ds.data = []);
    scatterChart.update();
    
    observationsDiv.innerHTML = `<p>Adjust the settings and click "Run Simulation" to see the results.</p>`;
}

// --------------------------------------
// 5. Update & Drawing Functions
// --------------------------------------
function updateHistogramChart(data, lambda) {
    if (data.length === 0) return;

    const maxTime = Math.max(...data);
    const numBins = Math.min(Math.ceil(Math.sqrt(data.length)), 50);
    const binWidth = maxTime / numBins;
    if (binWidth <= 0) return;

    const bins = new Array(numBins).fill(0);
    data.forEach(t => {
        const binIndex = Math.min(Math.floor(t / binWidth), numBins - 1);
        bins[binIndex]++;
    });
    
    const labels = bins.map((_, i) => ((i + 0.5) * binWidth).toFixed(2));
    const theoreticalData = labels.map(label => {
        return exponentialPDF(parseFloat(label), lambda) * data.length * binWidth;
    });

    histogramChart.data.labels = labels;
    histogramChart.data.datasets[0].data = bins;
    histogramChart.data.datasets[1].data = theoreticalData;
    histogramChart.update();
}

function updateScatterChart(dataT_i, dataT_i_plus_1) {
    if (dataT_i.length === 0) return;

    const points = dataT_i.map((val, index) => ({ x: val, y: dataT_i_plus_1[index] }));
    scatterChart.data.datasets[0].data = points;

    const { slope, intercept } = calculateLinearRegression(points);
    const minX = Math.min(...dataT_i);
    const maxX = Math.max(...dataT_i);

    scatterChart.data.datasets[1].data = [
        { x: minX, y: slope * minX + intercept },
        { x: maxX, y: slope * maxX + intercept }
    ];

    const axisMax = Math.max(maxX, Math.max(...dataT_i_plus_1));
    scatterChart.options.scales.x.max = axisMax * 1.1;
    scatterChart.options.scales.y.max = axisMax * 1.1;
    
    scatterChart.update();
}

function updateObservations(data, nextData, lambda) {
    const sampleMean = data.reduce((a, b) => a + b, 0) / data.length;
    const theoreticalMean = 1 / lambda;
    
    const points = data.map((val, index) => ({ x: val, y: nextData[index] }));
    const { slope } = calculateLinearRegression(points);

    observationsDiv.innerHTML = `
        <div style="display: flex; justify-content: space-evenly; flex-wrap: wrap;">
            <div style="margin: 0.5rem 1rem;">
                <h5 class="is-size-5 has-text-weight-semibold">Distribution Analysis</h5>
                <p><strong>Trials Run:</strong> ${data.length}</p>
                <p><strong>Theoretical Mean (1/λ):</strong> ${theoreticalMean.toFixed(4)} s</p>
                <p><strong>Sample Mean:</strong> ${sampleMean.toFixed(4)} s</p>
            </div>
            <div style="margin: 0.5rem 1rem;">
                <h5 class="is-size-5 has-text-weight-semibold">Independence Analysis</h5>
                <p><strong>Data Pairs Plotted:</strong> ${points.length}</p>
                <p><strong>Best-fit Line Slope:</strong> ${slope.toFixed(5)}</p>
                <p>(A slope near 0 indicates independence)</p>
            </div>
        </div>`;
}

// --------------------------------------
// 6. Utility Functions
// --------------------------------------
function exponentialRandom(rate) {
    return -Math.log(1.0 - Math.random()) / rate;
}

function exponentialPDF(x, rate) {
    return rate * Math.exp(-rate * x);
}

function calculateLinearRegression(points) {
    if (points.length < 2) return { slope: 0, intercept: 0 };
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = points.length;

    for (const p of points) {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumX2 += p.x * p.x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
}

// --------------------------------------
// 7. Initial Load
// --------------------------------------
window.addEventListener("load", () => {
    lambdaVal.textContent = parseFloat(lambdaSlider.value).toFixed(1);
    trialsVal.textContent = trialsSlider.value;
    initializeCharts();
});