// --------------------------------------
// 1. References & Global Variables
// --------------------------------------
const timelineCanvas = document.getElementById("timelineCanvas");
const timelineCtx = timelineCanvas.getContext("2d");
const histogramChartCtx = document.getElementById("histogramChart").getContext("2d");
const scatterChartCtx = document.getElementById("scatterChart").getContext("2d");

let histogramChart, scatterChart;
let lambda = 2.0;

// Simulation state
let simulationIsRunning = false;
let lastArrivalTime = 0, totalElapsedTime = 0, arrivalCount = 0, nextArrivalTime = 0;
let interArrivalTimes = [];

// DOM Elements
const lambdaSlider = document.getElementById("lambda"), lambdaVal = document.getElementById("lambdaVal");
const startBtn = document.getElementById("startBtn"), stopBtn = document.getElementById("stopBtn"), resetBtn = document.getElementById("resetBtn");
const observationsDiv = document.getElementById("observations");

const ANIMATION_TICK_MS = 20;

// --------------------------------------
// 2. Utility Functions
// --------------------------------------
function exponentialRandom(rate) {
    if (rate <= 0) return Infinity;
    return -Math.log(1.0 - Math.random()) / rate;
}

function exponentialPDF(x, rate) {
    if (x < 0) return 0;
    return rate * Math.exp(-rate * x);
}

function calculateLinearRegression(points) {
    if (points.length < 2) return { slope: 0, correlation: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    const n = points.length;

    for (const p of points) {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumX2 += p.x * p.x;
        sumY2 += p.y * p.y;
    }

    const numerator = n * sumXY - sumX * sumY;
    const denominator = n * sumX2 - sumX * sumX;
    const slope = denominator === 0 ? 0 : numerator / denominator;
    
    const rDenominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const correlation = rDenominator === 0 ? 0 : numerator / rDenominator;

    return { slope, correlation };
}

// --------------------------------------
// 3. Chart & Canvas Initialization
// --------------------------------------
function initializeCharts() {
    if (histogramChart) histogramChart.destroy();
    histogramChart = new Chart(histogramChartCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                { label: 'Empirical Distribution', data: [], backgroundColor: 'rgba(30, 144, 255, 0.6)' },
                { label: 'Theoretical Exponential PDF', data: [], type: 'line', borderColor: 'rgba(255, 159, 64, 1)', borderWidth: 3, pointRadius: 0, fill: false }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: "Inter-arrival Time (T)" }}, y: { title: { display: true, text: "Frequency (Count)" }, beginAtZero: true }}}
    });

    if (scatterChart) scatterChart.destroy();
    scatterChart = new Chart(scatterChartCtx, {
        type: 'scatter',
        data: {
            datasets: [
                { label: 'T_i vs T_{i+1}', data: [], backgroundColor: 'rgba(220, 20, 60, 0.7)' },
                { label: 'Best-fit Line', data: [], type: 'line', borderColor: 'rgba(0, 0, 0, 0.8)', borderWidth: 2, pointRadius: 0, fill: false }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'linear', position: 'bottom', title: { display: true, text: 'T_i' }}, y: { title: { display: true, text: 'T_{i+1}' }}}}
    });
}

function resizeCanvas() {
    const container = document.getElementById('timelineContainer');
    timelineCanvas.width = container.offsetWidth;
    timelineCanvas.height = 100;
    drawTimeline();
}

// --------------------------------------
// 4. Event Listeners
// --------------------------------------
lambdaSlider.oninput = () => {
    lambda = parseFloat(lambdaSlider.value);
    lambdaVal.textContent = lambda.toFixed(1);
    if (!simulationIsRunning) {
        updateAllVisuals();
    }
};

startBtn.addEventListener('click', () => {
    if (simulationIsRunning) return;
    simulationIsRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    lambdaSlider.disabled = true;
    if (lastArrivalTime === 0) nextArrivalTime = exponentialRandom(lambda);
    requestAnimationFrame(runTimeStep);
});

stopBtn.addEventListener('click', () => {
    simulationIsRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    lambdaSlider.disabled = false;
});

resetBtn.addEventListener('click', () => {
    simulationIsRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    lambdaSlider.disabled = false;
    lastArrivalTime = 0; totalElapsedTime = 0; arrivalCount = 0; nextArrivalTime = 0;
    interArrivalTimes = [];
    updateAllVisuals();
});

// --------------------------------------
// 5. Simulation Core
// --------------------------------------
let animationFrameId;

function runTimeStep() {
    if (!simulationIsRunning) {
        cancelAnimationFrame(animationFrameId);
        return;
    }
    
    const timeIncrement = ANIMATION_TICK_MS / 1000;
    totalElapsedTime += timeIncrement;
    nextArrivalTime -= timeIncrement;

    if (nextArrivalTime <= 0) {
        const interArrivalTime = (totalElapsedTime - lastArrivalTime) + nextArrivalTime;
        interArrivalTimes.push(interArrivalTime);
        lastArrivalTime = totalElapsedTime;
        arrivalCount++;
        nextArrivalTime = exponentialRandom(lambda);
        updateAllVisuals();
    }
    
    drawTimeline();
    animationFrameId = requestAnimationFrame(runTimeStep);
}

// --------------------------------------
// 6. Update & Drawing Functions
// --------------------------------------
function updateAllVisuals() {
    drawTimeline();
    updateHistogramChart();
    updateScatterChart();
    updateObservations();
}

function drawTimeline() {
    const w = timelineCanvas.width, h = timelineCanvas.height;
    timelineCtx.clearRect(0, 0, w, h);
    timelineCtx.strokeStyle = '#333';
    timelineCtx.lineWidth = 2;
    timelineCtx.beginPath();
    timelineCtx.moveTo(10, h / 2);
    timelineCtx.lineTo(w - 10, h / 2);
    timelineCtx.stroke();
    
    const timeWindow = 15;
    let cumulativeTime = 0;
    for (const t of interArrivalTimes) {
        cumulativeTime += t;
        if (totalElapsedTime - cumulativeTime < timeWindow) {
            const x = w - 10 - ((totalElapsedTime - cumulativeTime) / timeWindow) * (w - 20);
            timelineCtx.fillStyle = 'rgba(220, 20, 60, 0.8)';
            timelineCtx.beginPath();
            timelineCtx.arc(x, h/2, 5, 0, 2 * Math.PI);
            timelineCtx.fill();
        }
    }
    timelineCtx.strokeStyle = 'rgba(30, 144, 255, 1)';
    timelineCtx.beginPath();
    timelineCtx.moveTo(w - 10, h/2 - 15);
    timelineCtx.lineTo(w - 10, h/2 + 15);
    timelineCtx.stroke();
}

function updateHistogramChart() {
    if (interArrivalTimes.length < 2) {
        histogramChart.data.labels = [];
        histogramChart.data.datasets.forEach(ds => ds.data = []);
        histogramChart.update();
        return;
    }

    const maxTime = Math.max(...interArrivalTimes);
    const numBins = Math.min(Math.ceil(Math.sqrt(interArrivalTimes.length)), 40);
    const binWidth = maxTime / numBins;
    if (binWidth <= 0) return;

    const bins = new Array(numBins).fill(0);
    interArrivalTimes.forEach(t => bins[Math.min(Math.floor(t / binWidth), numBins - 1)]++);
    
    const labels = bins.map((_, i) => (i * binWidth).toFixed(2));
    const totalSamples = interArrivalTimes.length;
    const theoreticalData = labels.map(label => exponentialPDF(parseFloat(label), lambda) * totalSamples * binWidth);

    histogramChart.data.labels = labels;
    histogramChart.data.datasets[0].data = bins;
    histogramChart.data.datasets[1].data = theoreticalData;
    histogramChart.update();
}

function updateScatterChart() {
    if (interArrivalTimes.length < 2) {
        scatterChart.data.datasets.forEach(ds => ds.data = []);
        scatterChart.update();
        return;
    }
    
    const points = [];
    for (let i = 0; i < interArrivalTimes.length - 1; i++) {
        points.push({ x: interArrivalTimes[i], y: interArrivalTimes[i + 1] });
    }
    scatterChart.data.datasets[0].data = points;
    
    const { slope } = calculateLinearRegression(points);
    const xValues = points.map(p => p.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const avgX = xValues.reduce((a,b) => a+b, 0) / xValues.length;
    const avgY = points.map(p => p.y).reduce((a,b) => a+b, 0) / points.length;

    scatterChart.data.datasets[1].data = [
        { x: minX, y: avgY + slope * (minX - avgX) },
        { x: maxX, y: avgY + slope * (maxX - avgX) }
    ];

    scatterChart.update();
}

function updateObservations() {
    const sampleMean = interArrivalTimes.length > 0 ? interArrivalTimes.reduce((a, b) => a + b, 0) / interArrivalTimes.length : 0;
    const theoreticalMean = 1 / lambda;
    
    const points = [];
    for (let i = 0; i < interArrivalTimes.length - 1; i++) {
        points.push({ x: interArrivalTimes[i], y: interArrivalTimes[i + 1] });
    }
    const { slope, correlation } = calculateLinearRegression(points);

    observationsDiv.innerHTML = `
        <div style="text-align: center; max-width: 800px; margin: auto;">
            <div style="margin-bottom: 1.5rem;">
                <h5 class="is-size-5 has-text-weight-semibold" style="margin-bottom: 0.5rem;">Distribution Analysis</h5>
                <p><strong>Arrivals Recorded:</strong> ${arrivalCount} | <strong>Theoretical Mean (1/λ):</strong> ${theoreticalMean.toFixed(3)} s | <strong>Sample Mean:</strong> ${sampleMean.toFixed(3)} s</p>
            </div>
            <div>
                <h5 class="is-size-5 has-text-weight-semibold" style="margin-bottom: 0.5rem;">Independence Analysis</h5>
                <p><strong>Data Pairs (T_i, T_{i+1}):</strong> ${points.length}</p>
                <p><strong>Best-fit Line Slope:</strong> ${slope.toFixed(4)} (approaches 0 for independent data)</p>
                <p><strong>Correlation Coefficient (r):</strong> ${correlation.toFixed(4)} (approaches 0 for independent data)</p>
            </div>
        </div>`;
}

// --------------------------------------
// 7. Initial Load
// --------------------------------------
window.addEventListener("load", () => {
    lambdaVal.textContent = parseFloat(lambdaSlider.value).toFixed(1);
    lambda = parseFloat(lambdaSlider.value);
    initializeCharts();
    resizeCanvas();
    updateAllVisuals();
    stopBtn.disabled = true;
});

window.addEventListener('resize', () => {
    resizeCanvas();
    updateAllVisuals();
});