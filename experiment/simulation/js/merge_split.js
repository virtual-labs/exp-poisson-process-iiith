// --------------------------------------
// 1. References & Global Variables
// --------------------------------------
const emitCanvas = document.getElementById("emitCanvas");
const emitCtx = emitCanvas.getContext("2d");
const animationContainer = document.getElementById("animationContainer"); // For positioning nuclei

// Chart contexts
const lineChartCtx = document.getElementById("lineChart").getContext("2d");
const histogramChartCtx = document.getElementById("histogramChart").getContext("2d");

let lineChartInstance;
let histogramChartInstance;

// Sliders and Mode
let lambda1 = 6,
    lambda2 = 4,
    mode = "merging"; // 'merging' or 'splitting'

// Running summary stats
let total1 = 0,
    total2 = 0,
    totalMerged = 0;
let elapsedSeconds = 0;

// Data history for charts
const LINE_CHART_WINDOW_SIZE = 30; // Max points for line chart
const HISTOGRAM_DATA_POINTS = 100; // Max points for histogram calculation
let lineChartData1 = [];
let lineChartData2 = [];
let lineChartDataMerged = [];
let lineChartLabels = [];
let observedCountsForHist1 = []; // Stores the last HISTOGRAM_DATA_POINTS counts for Emitter 1
let observedCountsForHist2 = []; // Stores the last HISTOGRAM_DATA_POINTS counts for Emitter 2
let observedCountsForHistMerged = []; // Stores the last HISTOGRAM_DATA_POINTS counts for Merged

// Nucleus image elements
const nuc1Img = document.getElementById("nuc1");
const nuc2Img = document.getElementById("nuc2");
const nucMergedImg = document.getElementById("nucMerged");

// Sliders & mode buttons
const lambda1Slider = document.getElementById("lambda1");
const lambda2Slider = document.getElementById("lambda2");
const lambda1Val = document.getElementById("lambda1Val");
const lambda2Val = document.getElementById("lambda2Val");
const mergeBtn = document.getElementById("mergeBtn");
const splitBtn = document.getElementById("splitBtn");


function initializeCharts() {
    if (lineChartInstance) lineChartInstance.destroy();
    lineChartInstance = new Chart(lineChartCtx, {
        type: "line",
        data: {
            labels: [],
            datasets: [], // Datasets will be dynamically added in updateLineChart
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: "Time (seconds)" } },
                y: { beginAtZero: true, title: { display: true, text: "Count per Second" } },
            },
            plugins: { legend: { display: true, position: "top" } },
            animation: { duration: 200 } // Faster updates
        },
    });

    if (histogramChartInstance) histogramChartInstance.destroy();
    histogramChartInstance = new Chart(histogramChartCtx, {
        type: "bar",
        data: {
            labels: [], // e.g., [0, 1, 2, 3, ...] count values
            datasets: [], // Datasets will be dynamically added in updateHistogramChart
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: "Number of Emissions" } },
                y: { beginAtZero: true, title: { display: true, text: "Frequency" }, ticks: { stepSize: 1 } },
            },
            plugins: { legend: { display: true, position: "top" } },
        },
    });
}

// --------------------------------------
// 3. Event Listeners
// --------------------------------------
lambda1Slider.oninput = () => {
    lambda1 = parseFloat(lambda1Slider.value);
    lambda1Val.textContent = lambda1;
    resetSimulation();
};
lambda2Slider.oninput = () => {
    lambda2 = parseFloat(lambda2Slider.value);
    lambda2Val.textContent = lambda2;
    resetSimulation();
};

mergeBtn.addEventListener('click', () => {
    if (mode !== 'merging') {
        mode = 'merging';
        mergeBtn.classList.add('is-primary');
        splitBtn.classList.remove('is-primary');
        resetSimulation();
        updateNucleiPositions(false); // Trigger animation ONLY on mode change
    }
});

splitBtn.addEventListener('click', () => {
    if (mode !== 'splitting') {
        mode = 'splitting';
        splitBtn.classList.add('is-primary');
        mergeBtn.classList.remove('is-primary');
        resetSimulation();
        updateNucleiPositions(false); // Trigger animation ONLY on mode change
    }
});

// --------------------------------------
// 4. Poisson Sampling Utility
// --------------------------------------
function samplePoisson(lambda) {
    if (lambda === 0) return 0;
    const L = Math.exp(-lambda);
    let p = 1.0;
    let k = 0;
    do {
        k++;
        p *= Math.random();
    } while (p > L);
    return k - 1;
}

// --------------------------------------
// 5. Simulation Loop & Control
// --------------------------------------
let intervalID = null;

function resetSimulation() {
    if (intervalID !== null) clearInterval(intervalID);

    total1 = 0;
    total2 = 0;
    totalMerged = 0;
    elapsedSeconds = 0;

    lineChartData1 = [];
    lineChartData2 = [];
    lineChartDataMerged = [];
    lineChartLabels = [];
    observedCountsForHist1 = [];
    observedCountsForHist2 = [];
    observedCountsForHistMerged = [];

    // Charts are initialized once on load. We only update their data and datasets here.
    // updateNucleiPositions(true); // Initial setup of nuclei without animation. This is handled by the click handlers and initial load now.
    updateLineChart(); // Update line chart with appropriate datasets
    updateHistogramChart(); // Update histogram with appropriate datasets
    clearEmitCanvas();
    updateObservations();

    // Start new loop
    intervalID = setInterval(runTimeStep, 1000);
}

function runTimeStep() {
    elapsedSeconds++;
    clearEmitCanvas();

    let count1 = 0, count2 = 0, currentMergedCount = 0;

    // updateNucleiPositions(); // REMOVED: This was causing the animation to re-trigger every second

    if (mode === "merging") {
        const lamM = lambda1 + lambda2;
        currentMergedCount = samplePoisson(lamM);
        totalMerged += currentMergedCount;

        // Emission from merged nucleus
        const mergedNucRect = nucMergedImg.getBoundingClientRect();
        const emitX = mergedNucRect.left + mergedNucRect.width / 2;
        const emitY = mergedNucRect.top + mergedNucRect.height / 2;
        for (let i = 0; i < currentMergedCount; i++) {
            setTimeout(() => scatterParticle(emitX, emitY), i * 30 + Math.random()*20); // Stagger particles
        }

        // Update line chart data
        lineChartDataMerged.push(currentMergedCount);
        // Only push actual values for the visible chart. Undefined will ensure the arrays are same length.
        lineChartData1.push(undefined);
        lineChartData2.push(undefined);

        // Update histogram data
        observedCountsForHistMerged.push(currentMergedCount);

    } else { // Splitting mode
        count1 = samplePoisson(lambda1);
        count2 = samplePoisson(lambda2);
        total1 += count1;
        total2 += count2;

        // Emission from nucleus 1
        const nuc1Rect = nuc1Img.getBoundingClientRect();
        let emitX1 = nuc1Rect.left + nuc1Rect.width / 2;
        let emitY1 = nuc1Rect.top + nuc1Rect.height / 2;
        for (let i = 0; i < count1; i++) {
            setTimeout(() => scatterParticle(emitX1, emitY1), i * 30 + Math.random()*20);
        }

        // Emission from nucleus 2
        const nuc2Rect = nuc2Img.getBoundingClientRect();
        let emitX2 = nuc2Rect.left + nuc2Rect.width / 2;
        let emitY2 = nuc2Rect.top + nuc2Rect.height / 2;
        for (let i = 0; i < count2; i++) {
            setTimeout(() => scatterParticle(emitX2, emitY2), i * 30 + Math.random()*20);
        }

        // Update line chart data
        lineChartData1.push(count1);
        lineChartData2.push(count2);
        lineChartDataMerged.push(undefined); // Only push actual values for the visible chart.

        // Update histogram data
        observedCountsForHist1.push(count1);
        observedCountsForHist2.push(count2);
    }

    // Manage sliding window for line chart
    lineChartLabels.push(`Sec ${elapsedSeconds}`);
    if (lineChartLabels.length > LINE_CHART_WINDOW_SIZE) {
        lineChartLabels.shift();
        lineChartData1.shift();
        lineChartData2.shift();
        lineChartDataMerged.shift();
    }

    updateLineChart();
    // Update histogram data history (ensure they don't grow indefinitely)
    if (observedCountsForHist1.length > HISTOGRAM_DATA_POINTS) observedCountsForHist1.shift();
    if (observedCountsForHist2.length > HISTOGRAM_DATA_POINTS) observedCountsForHist2.shift();
    if (observedCountsForHistMerged.length > HISTOGRAM_DATA_POINTS) observedCountsForHistMerged.shift();

    updateHistogramChart();
    updateObservations();
}

// --------------------------------------
// 6. Chart Update Functions
// --------------------------------------
function updateLineChart() {
    // Clear existing datasets from the chart to prevent duplicates/incorrect legends
    lineChartInstance.data.datasets = [];
    if (mode === "merging") {
        lineChartInstance.data.datasets.push({
            label: "Merged (λ₁ + λ₂)",
            data: lineChartDataMerged,
            borderColor: "rgba(0, 255, 162, 0.9)",
            backgroundColor: "rgba(0, 255, 162, 0.3)",
            fill: false,
            tension: 0.2,
        });
    } else { // Splitting mode
        lineChartInstance.data.datasets.push({
            label: "Emitter 1 (λ₁)",
            data: lineChartData1,
            borderColor: "rgba(220, 20, 60, 0.9)",
            backgroundColor: "rgba(220, 20, 60, 0.3)",
            fill: false,
            tension: 0.2,
        });
        lineChartInstance.data.datasets.push({
            label: "Emitter 2 (λ₂)",
            data: lineChartData2,
            borderColor: "rgba(30, 144, 255, 0.9)",
            backgroundColor: "rgba(30, 144, 255, 0.3)",
            fill: false,
            tension: 0.2,
        });
    }
    lineChartInstance.data.labels = lineChartLabels;
    lineChartInstance.update();
}

function updateHistogramChart() {
    // Clear existing datasets from the chart
    histogramChartInstance.data.datasets = [];

    const getHistogramData = (counts) => {
        const freqMap = new Map();
        let maxCount = 0;
        for (const count of counts) {
            freqMap.set(count, (freqMap.get(count) || 0) + 1);
            if (count > maxCount) maxCount = count;
        }
        return { freqMap, maxCount };
    };

    let maxCombinedCount = 0;
    let labels = [];

    if (mode === "merging") {
        if (observedCountsForHistMerged.length > 0) {
            const { freqMap, maxCount } = getHistogramData(observedCountsForHistMerged);
            maxCombinedCount = maxCount;
            labels = Array.from({ length: maxCombinedCount + 1 }, (_, i) => i);
            const data = labels.map(label => freqMap.get(label) || 0);
            histogramChartInstance.data.datasets.push({
                label: "Empirical Distribution (Merged)",
                data: data,
                backgroundColor: "rgba(0, 255, 162, 0.6)",
                borderColor: "rgba(0, 255, 162, 1)",
                borderWidth: 1,
            });
        }
    } else { // Splitting mode
        let maxCount1 = 0;
        let freqMap1 = new Map();
        let maxCount2 = 0;
        let freqMap2 = new Map();

        if (observedCountsForHist1.length > 0) {
            ({ freqMap: freqMap1, maxCount: maxCount1 } = getHistogramData(observedCountsForHist1));
        }
        if (observedCountsForHist2.length > 0) {
            ({ freqMap: freqMap2, maxCount: maxCount2 } = getHistogramData(observedCountsForHist2));
        }

        maxCombinedCount = Math.max(maxCount1, maxCount2);
        labels = Array.from({ length: maxCombinedCount + 1 }, (_, i) => i);
        const data1 = labels.map(label => freqMap1.get(label) || 0);
        const data2 = labels.map(label => freqMap2.get(label) || 0);

        histogramChartInstance.data.datasets.push({
            label: "Empirical Distribution (Emitter 1)",
            data: data1,
            backgroundColor: "rgba(220, 20, 60, 0.6)",
            borderColor: "rgba(220, 20, 60, 1)",
            borderWidth: 1,
        });
        histogramChartInstance.data.datasets.push({
            label: "Empirical Distribution (Emitter 2)",
            data: data2,
            backgroundColor: "rgba(30, 144, 255, 0.6)",
            borderColor: "rgba(30, 144, 255, 1)",
            borderWidth: 1,
        });
    }

    histogramChartInstance.data.labels = labels;
    histogramChartInstance.update();
}

// --------------------------------------
// 7. Observations Panel
// --------------------------------------
function updateObservations() {
    const obsDiv = document.getElementById("observations");
    let html = "";

    if (mode === "merging") {
        const empiricalMean = elapsedSeconds > 0 ? totalMerged / elapsedSeconds : 0;
        const theoretical = lambda1 + lambda2;
        const absErr = Math.abs(empiricalMean - theoretical);
        html += `<p><strong>Mode:</strong> Merging</p>`;
        html += `<p>λ₁ = ${lambda1}, λ₂ = ${lambda2} ⇒ Theoretical λ (merged) = ${theoretical.toFixed(3)}</p>`;
        html += `<p>Empirical Avg (last ${elapsedSeconds}s): ${empiricalMean.toFixed(3)}, |Error| = ${absErr.toFixed(3)}</p>`;
    } else { // Splitting
        const empiricalMean1 = elapsedSeconds > 0 ? total1 / elapsedSeconds : 0;
        const empiricalMean2 = elapsedSeconds > 0 ? total2 / elapsedSeconds : 0;
        const absErr1 = Math.abs(empiricalMean1 - lambda1);
        const absErr2 = Math.abs(empiricalMean2 - lambda2);
        html += `<p><strong>Mode:</strong> Splitting</p>`;
        html += `<p>λ₁ = ${lambda1}, λ₂ = ${lambda2}</p>`;
        html += `<p>Emitter 1 Avg (last ${elapsedSeconds}s): ${empiricalMean1.toFixed(3)}, |Error| = ${absErr1.toFixed(3)}</p>`;
        html += `<p>Emitter 2 Avg (last ${elapsedSeconds}s): ${empiricalMean2.toFixed(3)}, |Error| = ${absErr2.toFixed(3)}</p>`;
    }
    obsDiv.innerHTML = html;
}

// --------------------------------------
// 8. Nuclei Positioning & Animation
// --------------------------------------
function updateNucleiPositions(isInitialSetup = false) {
    const panelWidth = animationContainer.offsetWidth;
    const panelHeight = animationContainer.offsetHeight;

    const mergedX = panelWidth / 2;
    const mergedY = panelHeight / 2;

    const split1X = panelWidth / 2;
    const split1Y = panelHeight * 0.30; // 30% from top

    const split2X = panelWidth / 2;
    const split2Y = panelHeight * 0.70; // 70% from top

    const duration = isInitialSetup ? 0 : 300; // ms, 0 for no animation

    // Apply transitions to all elements.
    nuc1Img.style.transition = `all ${duration}ms ease-out`;
    nuc2Img.style.transition = `all ${duration}ms ease-out`;
    nucMergedImg.style.transition = `all ${duration}ms ease-out`;

    if (isInitialSetup) {
        // Direct setup without animation
        if (mode === 'merging') {
            nuc1Img.style.display = "none";
            nuc1Img.style.opacity = '0';
            nuc2Img.style.display = "none";
            nuc2Img.style.opacity = '0';
            nucMergedImg.style.display = "block";
            nucMergedImg.style.opacity = '1';
            nucMergedImg.style.left = mergedX + "px";
            nucMergedImg.style.top = mergedY + "px";
        } else { // Splitting
            nucMergedImg.style.display = "none";
            nucMergedImg.style.opacity = '0';
            nuc1Img.style.display = "block";
            nuc1Img.style.opacity = '1';
            nuc2Img.style.display = "block";
            nuc2Img.style.opacity = '1';
            nuc1Img.style.left = split1X + "px";
            nuc1Img.style.top = split1Y + "px";
            nuc2Img.style.left = split2X + "px";
            nuc2Img.style.top = split2Y + "px";
        }
    } else {
        // Animated transition
        if (mode === "merging") {
            // Animate nuc1 and nuc2 to merged position, then swap to merged img
            // Ensure merged is initially hidden for the transition
            nucMergedImg.style.display = "none";
            nucMergedImg.style.opacity = '0';

            // Ensure nuc1 and nuc2 are visible for their movement and fade-out
            nuc1Img.style.display = "block";
            nuc2Img.style.display = "block";
            nuc1Img.style.opacity = '1';
            nuc2Img.style.opacity = '1';

            // Start movement animation for nuc1 and nuc2
            nuc1Img.style.left = mergedX + "px";
            nuc1Img.style.top = mergedY + "px";
            nuc2Img.style.left = mergedX + "px";
            nuc2Img.style.top = mergedY + "px";

            // After movement completes, fade out nuc1 and nuc2 and show merged
            setTimeout(() => {
                nuc1Img.style.opacity = '0';
                nuc2Img.style.opacity = '0';

                // After fade out, hide and display merged nucleus
                setTimeout(() => {
                    nuc1Img.style.display = "none";
                    nuc2Img.style.display = "none";
                    nucMergedImg.style.display = "block";
                    nucMergedImg.style.opacity = '1';
                    nucMergedImg.style.left = mergedX + "px"; // Ensure it's at the target position
                    nucMergedImg.style.top = mergedY + "px"; // Ensure it's at the target position
                }, duration); // This duration is for fade out.
            }, duration); // This duration is for movement.

        } else { // Splitting
            // Animate merged img fade out, then swap to nuc1 and nuc2
            // Ensure nuc1 and nuc2 are initially hidden for the transition
            nuc1Img.style.display = "none";
            nuc1Img.style.opacity = '0';
            nuc2Img.style.display = "none";
            nuc2Img.style.opacity = '0';

            // Ensure merged is visible for its fade-out
            nucMergedImg.style.display = "block";
            nucMergedImg.style.opacity = '1';

            // Fade out merged nucleus
            nucMergedImg.style.opacity = '0';

            // After fade out, hide merged and display nuc1 and nuc2
            setTimeout(() => {
                nucMergedImg.style.display = "none";
                nuc1Img.style.display = "block";
                nuc2Img.style.display = "block";
                nuc1Img.style.opacity = '1';
                nuc2Img.style.opacity = '1';
                nuc1Img.style.left = split1X + "px"; // Ensure they are at the target positions
                nuc1Img.style.top = split1Y + "px";
                nuc2Img.style.left = split2X + "px";
                nuc2Img.style.top = split2Y + "px";
            }, duration); // This duration is for fade out.
        }
    }
}


// --------------------------------------
// 9. Particle Scattering
// --------------------------------------
function scatterParticle(sourcePageX, sourcePageY) {
    const img = new Image();
    img.src = "./images/particle.png"; // Make sure this path is correct
    img.style.position = 'absolute'; // Particles will be added to animationContainer
    img.style.width = '16px';
    img.style.height = '16px';
    img.style.transform = 'translate(-50%, -50%)'; // Center particle image

    // Convert absolute page coordinates of source to coordinates relative to animationContainer
    const containerRect = animationContainer.getBoundingClientRect();
    let x = sourcePageX - containerRect.left;
    let y = sourcePageY - containerRect.top;

    img.style.left = x + 'px';
    img.style.top = y + 'px';
    animationContainer.appendChild(img);


    const angle = Math.random() * 2 * Math.PI; // Full circle random angle
    const speed = 2 + Math.random() * 3; // pixels per frame
    const lifetime = 60 + Math.random() * 40; // frames before disappearing
    let frames = 0;

    function step() {
        if (frames >= lifetime) {
            img.remove();
            return;
        }
        x += speed * Math.cos(angle);
        y += speed * Math.sin(angle);
        img.style.left = x + 'px';
        img.style.top = y + 'px';

        // Optional: remove if out of animationContainer bounds
        if (x < -20 || x > animationContainer.offsetWidth + 20 || y < -20 || y > animationContainer.offsetHeight + 20) {
            img.remove();
            return;
        }
        frames++;
        requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function clearEmitCanvas() {
    // No direct canvas clearing needed for particles as they are individual DOM elements
    // We can remove all existing particles if needed, or let them fade out naturally
    // For now, no action is needed here as particles manage their own removal.
}

// --------------------------------------
// 10. Initialization
// --------------------------------------
window.addEventListener("load", () => {
    // Set initial slider values display
    lambda1Val.textContent = lambda1Slider.value;
    lambda2Val.textContent = lambda2Slider.value;
    lambda1 = parseFloat(lambda1Slider.value); // Ensure globals are set from HTML defaults
    lambda2 = parseFloat(lambda2Slider.value);

    // Check initial mode from button classes (though JS `mode` variable should be source of truth)
    if (mergeBtn.classList.contains('is-primary')) {
        mode = 'merging';
    } else if (splitBtn.classList.contains('is-primary')) {
        mode = 'splitting';
    }

    initializeCharts(); // Initialize charts ONLY ONCE here
    resetSimulation(); // This will clear data and restart the interval.
    updateNucleiPositions(true); // Set initial nuclei positions without animation.
});

function resizeCanvases() {
    // This function can be used to handle canvas resizing if necessary.
    // For Chart.js, responsive: true often handles much of this automatically.
    // For particle emission, it's more about their initial positions relative to the container.
}
window.addEventListener('resize', resizeCanvases); // In case of complex layouts