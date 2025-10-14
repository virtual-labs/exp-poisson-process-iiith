// 1. References & Global Variables
// --------------------------------------
const animationContainer = document.getElementById("animationContainer");
// --- FIXED: Changed "lineChart" back to "2d" ---
const lineChartCtx = document.getElementById("lineChart").getContext("2d");
const histogramChartCtx = document.getElementById("histogramChart").getContext("2d");

let lineChartInstance, histogramChartInstance;
let lambda1 = 10, lambda2 = 5;
let mode = 'Splitted';
let mergeTime = -1; // Time at which merge occurs

let total1 = 0, total2 = 0, totalMerged = 0, elapsedSeconds = 0;
let activeParticleCount = 0;

const HISTOGRAM_DATA_POINTS = 100;
// Data for per-second counts
let lineChartData1 = [], lineChartData2 = [], lineChartDataMerged = [];
// Data for running averages
let avgData1 = [], avgData2 = [], avgDataMerged = [];
let lineChartLabels = [];
let histData1 = [], histData2 = [], histDataMerged = [];

const nuc1Img = document.getElementById("nuc1"), nuc2Img = document.getElementById("nuc2"), nucMergedImg = document.getElementById("nucMerged");
const lambda1Slider = document.getElementById("lambda1"), lambda2Slider = document.getElementById("lambda2");
const lambda1Val = document.getElementById("lambda1Val"), lambda2Val = document.getElementById("lambda2Val");
const toggleModeBtn = document.getElementById("toggleModeBtn");

const factorialCache = [1];

// --------------------------------------
// 2. Utility Functions
// --------------------------------------
function factorial(k) {
    if (k < 0) return Infinity;
    if (factorialCache[k] !== undefined) return factorialCache[k];
    let result = factorialCache[factorialCache.length - 1];
    for (let i = factorialCache.length; i <= k; i++) result *= i;
    return result;
}

function poissonPMF(lambda, k) {
    if (lambda < 0 || k < 0) return 0;
    return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}

function samplePoisson(lambda) {
    if (lambda <= 0) return 0;
    const L = Math.exp(-lambda);
    let p = 1.0, k = 0;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
}

// --------------------------------------
// 3. Chart Initialization
// --------------------------------------
function initializeCharts() {
    if (lineChartInstance) lineChartInstance.destroy();
    lineChartInstance = new Chart(lineChartCtx, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                // Per-second counts
                { label: "Emitter 1 (λ₁)", data: [], borderColor: "rgba(220, 20, 60, 0.8)", backgroundColor: "rgba(220, 20, 60, 0.1)", tension: 0.2, fill: true },
                { label: "Emitter 2 (λ₂)", data: [], borderColor: "rgba(30, 144, 255, 0.8)", backgroundColor: "rgba(30, 144, 255, 0.1)", tension: 0.2, fill: true },
                { label: "Merged (λ₁ + λ₂)", data: [], borderColor: "rgba(50, 205, 50, 0.9)", backgroundColor: "rgba(50, 205, 50, 0.2)", tension: 0.2, fill: true },
                // Running averages
                { label: "Avg. Rate (λ₁)", data: [], borderColor: "rgba(220, 20, 60, 1)", borderWidth: 3, pointRadius: 0, borderDash: [5, 5], fill: false },
                { label: "Avg. Rate (λ₂)", data: [], borderColor: "rgba(30, 144, 255, 1)", borderWidth: 3, pointRadius: 0, borderDash: [5, 5], fill: false },
                { label: "Avg. Rate (Merged)", data: [], borderColor: "rgba(50, 205, 50, 1)", borderWidth: 3, pointRadius: 0, borderDash: [5, 5], fill: false }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { title: { display: true, text: "Time (seconds)" }}, y: { beginAtZero: true, title: { display: true, text: "Count per Second" }}},
            plugins: {
                legend: {
                    labels: {
                        filter: (legendItem) => {
                            const label = legendItem.text;
                            if (mode === 'Splitted') return !label.includes('Merged');
                            return label.includes('Merged');
                        }
                    }
                },
                annotation: {
                    annotations: {} // Will be populated dynamically
                }
            }
        }
    });

    if (histogramChartInstance) histogramChartInstance.destroy();
    histogramChartInstance = new Chart(histogramChartCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                { label: 'Empirical (λ₁)', data: [], backgroundColor: "rgba(220, 20, 60, 0.6)" },
                { label: 'Empirical (λ₂)', data: [], backgroundColor: "rgba(30, 144, 255, 0.6)" },
                { label: 'Theoretical PMF (λ₁)', data: [], type: 'line', borderColor: 'rgba(220, 20, 60, 1)', borderWidth: 2, pointRadius: 0, fill: false },
                { label: 'Theoretical PMF (λ₂)', data: [], type: 'line', borderColor: 'rgba(30, 144, 255, 1)', borderWidth: 2, pointRadius: 0, fill: false },
                { label: 'Empirical (Merged)', data: [], backgroundColor: 'rgba(50, 205, 50, 0.6)' },
                { label: 'Theoretical PMF (Merged)', data: [], type: 'line', borderColor: 'rgba(50, 205, 50, 1)', borderWidth: 3, pointRadius: 0, fill: false }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { title: { display: true, text: "Number of Emissions" }}, y: { beginAtZero: true, title: { display: true, text: "Probability" }}},
            plugins: {
                legend: {
                    labels: {
                        filter: (legendItem) => {
                            const label = legendItem.text;
                            if (mode === 'Splitted') return !label.includes('Merged');
                            return label.includes('Merged');
                        }
                    }
                }
            }
        }
    });
}

// --------------------------------------
// 4. Event Listeners & Mode Control
// --------------------------------------
lambda1Slider.oninput = () => { lambda1 = parseFloat(lambda1Slider.value); lambda1Val.textContent = lambda1; if(mode === 'Splitted') resetSimulation(); };
lambda2Slider.oninput = () => { lambda2 = parseFloat(lambda2Slider.value); lambda2Val.textContent = lambda2; if(mode === 'Splitted') resetSimulation(); };

toggleModeBtn.addEventListener('click', () => {
    if (mode === 'Splitted') {
        mode = 'merging';
        mergeTime = elapsedSeconds;
        totalMerged = 0; // Reset merged counter
        toggleModeBtn.classList.add('is-primary');
        toggleModeBtn.textContent = 'Reset';
        [lambda1Slider, lambda2Slider].forEach(s => s.disabled = true);
        histData1 = [];
        histData2 = [];
        updateHistogramChart();
    } else {
        resetSimulation();
        return;
    }
    lineChartInstance.update();
    histogramChartInstance.update();
    updateNucleiPositions();
});

// --------------------------------------
// 5. Simulation Core
// --------------------------------------
let intervalID = null;

function resetSimulation() {
    if (intervalID) clearInterval(intervalID);
    
    animationContainer.querySelectorAll('.particle').forEach(p => p.remove());
    activeParticleCount = 0;

    mode = 'Splitted';
    mergeTime = -1;
    toggleModeBtn.classList.remove('is-primary');
    toggleModeBtn.textContent = 'Merge';
    [lambda1Slider, lambda2Slider].forEach(s => s.disabled = false);

    total1 = 0; total2 = 0; totalMerged = 0; elapsedSeconds = 0;
    lineChartData1 = []; lineChartData2 = []; lineChartDataMerged = [];
    avgData1 = []; avgData2 = []; avgDataMerged = [];
    lineChartLabels = [];
    histData1 = []; histData2 = []; histDataMerged = [];

    initializeCharts();
    updateNucleiPositions(true);
    updateAllVisuals();
    
    intervalID = setInterval(runTimeStep, 1000);
}

function runTimeStep() {
    elapsedSeconds++;
    lineChartLabels.push(`Sec ${elapsedSeconds}`);

    if (mode === 'merging') {
        const currentMergedCount = samplePoisson(lambda1 + lambda2);
        totalMerged += currentMergedCount;
        histDataMerged.push(currentMergedCount);
        if (histDataMerged.length > HISTOGRAM_DATA_POINTS) histDataMerged.shift();
        
        lineChartDataMerged.push(currentMergedCount);
        lineChartData1.push(null);
        lineChartData2.push(null);

        const secondsSinceMerge = elapsedSeconds - mergeTime;
        const runningAvgMerged = secondsSinceMerge > 0 ? totalMerged / secondsSinceMerge : 0;
        avgDataMerged.push(runningAvgMerged);
        avgData1.push(null);
        avgData2.push(null);
        
        const rect = nucMergedImg.getBoundingClientRect();
        for (let i = 0; i < currentMergedCount; i++) scatterParticle(rect.left + rect.width / 2, rect.top + rect.height / 2);

    } else { // 'Splitted' mode
        const count1 = samplePoisson(lambda1);
        const count2 = samplePoisson(lambda2);
        total1 += count1; total2 += count2;
        histData1.push(count1); histData2.push(count2);
        if (histData1.length > HISTOGRAM_DATA_POINTS) { histData1.shift(); histData2.shift(); }

        lineChartData1.push(count1);
        lineChartData2.push(count2);
        lineChartDataMerged.push(null);
        
        const runningAvg1 = elapsedSeconds > 0 ? total1 / elapsedSeconds : 0;
        const runningAvg2 = elapsedSeconds > 0 ? total2 / elapsedSeconds : 0;
        avgData1.push(runningAvg1);
        avgData2.push(runningAvg2);
        avgDataMerged.push(null);

        const rect1 = nuc1Img.getBoundingClientRect(), rect2 = nuc2Img.getBoundingClientRect();
        for (let i = 0; i < count1; i++) scatterParticle(rect1.left + rect1.width / 2, rect1.top + rect1.height / 2);
        for (let i = 0; i < count2; i++) scatterParticle(rect2.left + rect2.width / 2, rect2.top + rect2.height / 2);
    }
    
    if (activeParticleCount > 200) { resetSimulation(); return; }
    updateAllVisuals();
}

function updateAnnotations() {
    const annotations = {};
    if (mergeTime !== -1) {
        annotations.mergeLine = {
            type: 'line',
            scaleID: 'x',
            value: `Sec ${mergeTime}`,
            borderColor: 'rgba(220, 20, 60, 0.8)',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
                content: 'Merge Point',
                enabled: true,
                position: 'start',
                backgroundColor: 'rgba(220, 20, 60, 0.7)',
                color: 'white',
                font: { style: 'bold' }
            }
        };
    }
    lineChartInstance.options.plugins.annotation.annotations = annotations;
}

function updateAllVisuals() {
    // Assign per-second data (datasets 0, 1, 2)
    [lineChartData1, lineChartData2, lineChartDataMerged].forEach((data, i) => lineChartInstance.data.datasets[i].data = data);
    // Assign average data (datasets 3, 4, 5)
    [avgData1, avgData2, avgDataMerged].forEach((data, i) => lineChartInstance.data.datasets[i + 3].data = data);
    
    lineChartInstance.data.labels = lineChartLabels;
    
    updateAnnotations();
    lineChartInstance.update();

    updateHistogramChart();
    updateObservations();
}

// --------------------------------------
// 6. Specific Update Functions
// --------------------------------------
function updateHistogramChart() {
    let maxCount = 0;
    if (mode === 'Splitted') {
        if (histData1.length < 1) {
            histogramChartInstance.data.labels = [];
            histogramChartInstance.data.datasets.forEach(ds => ds.data = []);
            histogramChartInstance.update(); return;
        }
        const freq1 = new Map(), freq2 = new Map();
        histData1.forEach(c => { freq1.set(c, (freq1.get(c) || 0) + 1); maxCount = Math.max(maxCount, c); });
        histData2.forEach(c => { freq2.set(c, (freq2.get(c) || 0) + 1); maxCount = Math.max(maxCount, c); });
        
        const labels = Array.from({ length: maxCount + 1 }, (_, i) => i);
        const totalPoints = histData1.length;
        
        histogramChartInstance.data.labels = labels;
        histogramChartInstance.data.datasets[0].data = labels.map(i => (freq1.get(i) || 0) / totalPoints);
        histogramChartInstance.data.datasets[1].data = labels.map(i => (freq2.get(i) || 0) / totalPoints);
        histogramChartInstance.data.datasets[2].data = labels.map(k => poissonPMF(lambda1, k));
        histogramChartInstance.data.datasets[3].data = labels.map(k => poissonPMF(lambda2, k));
        histogramChartInstance.data.datasets[4].data = [];
        histogramChartInstance.data.datasets[5].data = [];
    } else {
        if (histDataMerged.length < 1) {
            histogramChartInstance.data.labels = [];
            histogramChartInstance.data.datasets.forEach(ds => ds.data = []);
            histogramChartInstance.update(); return;
        }
        const freqM = new Map();
        histDataMerged.forEach(c => { freqM.set(c, (freqM.get(c) || 0) + 1); maxCount = Math.max(maxCount, c); });

        const labels = Array.from({ length: maxCount + 1 }, (_, i) => i);
        const totalPoints = histDataMerged.length;

        histogramChartInstance.data.labels = labels;
        histogramChartInstance.data.datasets[4].data = labels.map(i => (freqM.get(i) || 0) / totalPoints);
        histogramChartInstance.data.datasets[5].data = labels.map(k => poissonPMF(lambda1 + lambda2, k));
        histogramChartInstance.data.datasets[0].data = [];
        histogramChartInstance.data.datasets[1].data = [];
        histogramChartInstance.data.datasets[2].data = [];
        histogramChartInstance.data.datasets[3].data = [];
    }
    histogramChartInstance.update();
}

function updateObservations() {
    const obsDiv = document.getElementById("observations");
    let html = "";
    if (mode === "merging") {
        const secondsSinceMerge = elapsedSeconds - mergeTime;
        const empMean = secondsSinceMerge > 0 ? totalMerged / secondsSinceMerge : 0;
        const theory = lambda1 + lambda2;
        const absErr = Math.abs(empMean - theory);
        html = `<p><strong>Mode:</strong> Merged | <strong>Theoretical λ:</strong> ${theory.toFixed(2)} | <strong>Empirical Avg:</strong> ${empMean.toFixed(2)} | <strong>|Error|:</strong> ${absErr.toFixed(2)}</p>`;
    } else {
        const emp1 = elapsedSeconds > 0 ? total1 / elapsedSeconds : 0;
        const emp2 = elapsedSeconds > 0 ? total2 / elapsedSeconds : 0;
        const absErr1 = Math.abs(emp1 - lambda1);
        const absErr2 = Math.abs(emp2 - lambda2);
        html = `<p><strong>Mode:</strong> Splitted</p>
                <p><strong>Emitter 1:</strong> Theo. λ₁=${lambda1}, Emp. Avg≈${emp1.toFixed(2)}, |Error|≈${absErr1.toFixed(2)}</p>
                <p><strong>Emitter 2:</strong> Theo. λ₂=${lambda2}, Emp. Avg≈${emp2.toFixed(2)}, |Error|≈${absErr2.toFixed(2)}</p>`;
    }
    obsDiv.innerHTML = html;
}

// --------------------------------------
// 7. Animation & Positioning
// --------------------------------------
function updateNucleiPositions(isInitial = false) {
    const panelWidth = animationContainer.offsetWidth, panelHeight = animationContainer.offsetHeight;
    const nucleiSize = '100px'; 
    [nuc1Img, nuc2Img, nucMergedImg].forEach(img => { img.style.width = nucleiSize; img.style.height = nucleiSize; });

    const centerX = panelWidth / 2;
    const mergedY = panelHeight / 2;
    const split1Y = panelHeight * 0.3;
    const split2Y = panelHeight * 0.7;
    const duration = isInitial ? 0 : 400;

    [nuc1Img, nuc2Img, nucMergedImg].forEach(img => img.style.transition = `all ${duration}ms ease-in-out`);

    if (mode === 'merging') {
        [nuc1Img, nuc2Img].forEach(nuc => { nuc.style.left = centerX + "px"; nuc.style.top = mergedY + "px"; nuc.style.opacity = '0'; });
        nucMergedImg.style.left = centerX + "px"; nucMergedImg.style.top = mergedY + "px";
        setTimeout(() => { nucMergedImg.style.opacity = '1'; }, duration);
    } else {
        nucMergedImg.style.opacity = '0';
        nuc1Img.style.left = centerX + "px"; nuc1Img.style.top = split1Y + "px"; nuc1Img.style.opacity = '1';
        nuc2Img.style.left = centerX + "px"; nuc2Img.style.top = split2Y + "px"; nuc2Img.style.opacity = '1';
    }
}

function scatterParticle(x, y) {
    activeParticleCount++;
    const containerRect = animationContainer.getBoundingClientRect();
    const particle = document.createElement('img');
    particle.src = "./images/particle.png";
    particle.className = 'particle'; 
    particle.style.cssText = `position:absolute; width:16px; height:16px; transform:translate(-50%,-50%); z-index:10; left:${x - containerRect.left}px; top:${y - containerRect.top}px; pointer-events:none;`;
    animationContainer.appendChild(particle);

    const angle = Math.random() * 2 * Math.PI, speed = 100 + Math.random() * 50, lifetime = 800 + Math.random() * 400;
    const startTime = performance.now();
    
    function animate() {
        const elapsed = performance.now() - startTime;
        if (elapsed > lifetime) { particle.remove(); activeParticleCount--; return; }
        const newX = parseFloat(particle.style.left) + speed * Math.cos(angle) / 60;
        const newY = parseFloat(particle.style.top) + speed * Math.sin(angle) / 60;
        particle.style.left = `${newX}px`;
        particle.style.top = `${newY}px`;
        particle.style.opacity = 1 - (elapsed / lifetime);
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

// --------------------------------------
// 8. Initial Load
// --------------------------------------
window.addEventListener("load", () => {
    lambda1Slider.value = lambda1;
    lambda2Slider.value = lambda2;
    lambda1Val.textContent = lambda1;
    lambda2Val.textContent = lambda2;
    resetSimulation();
});

window.addEventListener('resize', () => updateNucleiPositions(true));