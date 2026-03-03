document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Week Selector
    const weekSelector = document.getElementById('week-selector');
    const currentYear = 2026;
    
    // Add weeks 1 to 52
    for (let i = 1; i <= 52; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Semana ${i} - ${currentYear}`;
        weekSelector.appendChild(option);
    }
    
    // Set default to current week
    weekSelector.value = "10";
    
    // Chart instances
    let productionChartInstance = null;
    let qualityChartInstance = null;

    // 2. Data Generators
    function generateMockData(week) {
        const baseProduction = 450 + (Math.sin(week) * 100); 
        const baseYield = 70 + (Math.cos(week) * 10) + 5;
        const baseQuality = 3 + (Math.sin(week * 2) * 2);
        const baseOee = 75 + (Math.cos(week * 3) * 8);

        return {
            production: {
                current: Math.round(baseProduction),
                trend: (Math.sin(week * 4) * 8).toFixed(1)
            },
            yield: {
                current: baseYield.toFixed(1),
                trend: (Math.cos(week * 2) * 3).toFixed(1)
            },
            quality: {
                current: baseQuality.toFixed(1),
                trend: -(Math.sin(week) * 1.5).toFixed(1) 
            },
            oee: {
                current: baseOee.toFixed(1),
                trend: (Math.cos(week * 1.5) * 4).toFixed(1)
            },
            dailyProduction: [
                Math.round(baseProduction / 6 * 0.8),
                Math.round(baseProduction / 6 * 1.1),
                Math.round(baseProduction / 6 * 0.9),
                Math.round(baseProduction / 6 * 1.05),
                Math.round(baseProduction / 6 * 1),
                Math.round(baseProduction / 6 * 1.15),
                Math.round(baseProduction / 6 * 0.5)
            ],
            qualityDistribution: [
                Math.round(baseYield), 
                Math.round(baseQuality), 
                100 - Math.round(baseYield) - Math.round(baseQuality) 
            ],
            lines: [
                { id: "Línea 1 - Palta", status: week % 3 === 0 ? "warning" : "active", eff: (baseOee + 2).toFixed(1), batch: "L-2026-A1X" },
                { id: "Línea 2 - Arándano", status: "active", eff: (baseOee + 5).toFixed(1), batch: "L-2026-B3Y" },
                { id: "Línea 3 - Mango", status: week % 5 === 0 ? "stopped" : "active", eff: week % 5 === 0 ? "0.0" : (baseOee - 4).toFixed(1), batch: week % 5 === 0 ? "Ninguno" : "L-2026-C2Z" },
                { id: "Línea 4 - Empaque", status: "active", eff: (baseOee + 1).toFixed(1), batch: "Múltiple" },
            ]
        };
    }

    // 3. UI Functions
    function animateValue(obj, start, end, duration, formatStr = '') {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = progress * (2 - progress);
            const currentVal = start + easeProgress * (end - start);
            
            if (end % 1 !== 0) {
                obj.innerHTML = currentVal.toFixed(1) + formatStr;
            } else {
                obj.innerHTML = Math.round(currentVal) + formatStr;
            }
            
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    function updateKPIs(data) {
        animateValue(document.getElementById('kpi-production'), 0, data.production.current, 1000);
        updateTrend('trend-container-production', 'trend-production', data.production.trend, true);

        animateValue(document.getElementById('kpi-yield'), 0, parseFloat(data.yield.current), 1000);
        updateTrend('trend-container-yield', 'trend-yield', data.yield.trend, true);

        animateValue(document.getElementById('kpi-quality'), 0, parseFloat(data.quality.current), 1000);
        updateTrend('trend-container-quality', 'trend-quality', data.quality.trend, false);

        animateValue(document.getElementById('kpi-oee'), 0, parseFloat(data.oee.current), 1000);
        updateTrend('trend-container-oee', 'trend-oee', data.oee.trend, true);
    }

    function updateTrend(containerId, textId, value, higherIsBetter) {
        const container = document.getElementById(containerId);
        const textElement = document.getElementById(textId);
        const valNum = parseFloat(value);
        
        container.classList.remove('positive', 'negative');
        const icon = container.querySelector('i');
        
        if (valNum > 0) {
            container.classList.add(higherIsBetter ? 'positive' : 'negative');
            icon.className = 'fa-solid fa-arrow-trend-up trend-icon';
            textElement.textContent = `+${valNum}%`;
        } else if (valNum < 0) {
            container.classList.add(higherIsBetter ? 'negative' : 'positive');
            icon.className = 'fa-solid fa-arrow-trend-down trend-icon';
            textElement.textContent = `${valNum}%`;
        } else {
            textElement.textContent = `0%`;
            icon.className = 'fa-solid fa-minus trend-icon';
        }
    }

    // 4. Charts setup
    // Light Mode Text Default
    Chart.defaults.color = '#64748b';
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.font.weight = '600';

    function updateCharts(data) {
        if (productionChartInstance) productionChartInstance.destroy();
        if (qualityChartInstance) qualityChartInstance.destroy();

        const ctxProd = document.getElementById('productionChart').getContext('2d');
        
        // Gradient Azure Blue for Light Mode
        const gradientBlue = ctxProd.createLinearGradient(0, 0, 0, 400);
        gradientBlue.addColorStop(0, 'rgba(2, 132, 199, 0.8)');
        gradientBlue.addColorStop(1, 'rgba(2, 132, 199, 0.2)');

        productionChartInstance = new Chart(ctxProd, {
            type: 'bar',
            data: {
                labels: ['Lunes', 'Martes', 'Mié.', 'Jueves', 'Viernes', 'Sábado', 'Dom.'],
                datasets: [{
                    label: 'Toneladas Procesadas',
                    data: data.dailyProduction,
                    backgroundColor: gradientBlue,
                    borderRadius: 8,
                    borderWidth: 0,
                    barPercentage: 0.65
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#0f172a',
                        bodyColor: '#475569',
                        titleFont: { size: 14, family: "'Outfit', sans-serif", weight: '700' },
                        bodyFont: { size: 14, family: "'Outfit', sans-serif", weight: '600' },
                        padding: 14,
                        cornerRadius: 10,
                        borderColor: 'rgba(0,0,0,0.05)',
                        borderWidth: 1,
                        boxPadding: 4
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false }
                    },
                    x: {
                        grid: { display: false, drawBorder: false }
                    }
                },
                animation: { duration: 1500, easing: 'easeOutQuart' }
            }
        });

        const ctxQual = document.getElementById('qualityChart').getContext('2d');
        qualityChartInstance = new Chart(ctxQual, {
            type: 'doughnut',
            data: {
                labels: ['Exportable', 'Descarte', 'Mercado Interno'],
                datasets: [{
                    data: data.qualityDistribution,
                    backgroundColor: [
                        '#059669', // Green
                        '#e11d48', // Red
                        '#0284c7'  // Blue
                    ],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 25, usePointStyle: true, pointStyle: 'circle', font: {size: 13, weight:'700'} }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#0f172a',
                        bodyColor: '#475569',
                        bodyFont: { size: 14, family: "'Outfit', sans-serif", weight: '600' },
                        padding: 14,
                        cornerRadius: 10,
                        borderColor: 'rgba(0,0,0,0.05)',
                        borderWidth: 1
                    }
                },
                animation: {
                    animateScale: true, animateRotate: true,
                    duration: 1500, easing: 'easeOutQuart'
                }
            }
        });
    }

    // 5. Table update
    function updateTable(lines) {
        const tbody = document.getElementById('lines-status-table');
        tbody.innerHTML = '';

        lines.forEach((line, index) => {
            const tr = document.createElement('tr');
            tr.style.opacity = '0';
            tr.style.transform = 'translateY(10px)';
            tr.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.1}s`;

            let statusBadge = '';
            let statusText = '';
            
            if (line.status === 'active') {
                statusBadge = 'badge-active';
                statusText = '<i class="fa-solid fa-circle-check"></i> Operando';
            } else if (line.status === 'warning') {
                statusBadge = 'badge-warning';
                statusText = '<i class="fa-solid fa-triangle-exclamation"></i> Mant. Preventivo';
            } else {
                statusBadge = 'badge-stopped';
                statusText = '<i class="fa-solid fa-circle-xmark"></i> Detenida';
            }

            tr.innerHTML = `
                <td>${line.id}</td>
                <td><span class="badge ${statusBadge}">${statusText}</span></td>
                <td><strong>${line.eff}%</strong></td>
                <td><span style="font-family: inherit; font-weight: 700; color: #0284c7;">${line.batch}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 6. Main render flow
    function loadData() {
        const selectedWeek = parseInt(weekSelector.value, 10);
        const data = generateMockData(selectedWeek);
        
        updateKPIs(data);
        updateCharts(data);
        updateTable(data.lines);
    }

    loadData();

    // Event Listeners
    weekSelector.addEventListener('change', () => {
        document.querySelector('.dashboard-content').style.opacity = '0.5';
        setTimeout(() => {
            loadData();
            document.querySelector('.dashboard-content').style.opacity = '1';
        }, 300);
    });
});
