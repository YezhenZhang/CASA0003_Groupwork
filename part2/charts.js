let csvData = [];
let charts = [];

Papa.parse('data/2_6_centrality/all_normalized_with_xy.csv', {
    download: true,
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(results) {
        csvData = results.data;
        initializeCharts();
    }
});

function initializeCharts() {
    let chartData = prepareChartData();

    // 创建6个图表
    charts.push(createChart("barChart1", chartData.out_degree));
    charts.push(createChart("barChart2", chartData.in_degree));
    charts.push(createChart("barChart3", chartData.closeness_flow));
    charts.push(createChart("barChart4", chartData.betweenness_flow));
    charts.push(createChart("barChart5", chartData.closeness_distance));
    charts.push(createChart("barChart6", chartData.betweenness_distance));

    // 初始化时只显示第一个图表
    showChart(0);  // 显示第一个图表
}


function prepareChartData() {
    return {
        out_degree: createMetricData('out_degree'),
        in_degree: createMetricData('in_degree'),
        closeness_flow: createMetricData('closeness_flow'),
        betweenness_flow: createMetricData('betweenness_flow'),
        closeness_distance: createMetricData('closeness_distance'),
        betweenness_distance: createMetricData('betweenness_distance')
    };
}

function createMetricData(metric) {
    let sortedData = csvData.sort((a, b) => b[metric] - a[metric]);
    let topCities = sortedData.slice(0, 3);

const colorMap = {
    out_degree: {
        bg: 'rgba(16, 146, 33, 0.7)',      // #109221 → rgba
        border: '#109221'
    },
    in_degree: {
        bg: 'rgba(102, 194, 165, 0.7)',    // #66c2a5
        border: '#66c2a5'
    },
    closeness_flow: {
        bg: 'rgba(252, 141, 98, 0.7)',     // #fc8d62
        border: '#fc8d62'
    },
    closeness_distance: {
        bg: 'rgba(189, 162, 25, 0.7)',     // #bda219
        border: '#bda219'
    },
    betweenness_flow: {
        bg: 'rgba(141, 160, 203, 0.7)',    // #8da0cb
        border: '#8da0cb'
    },
    betweenness_distance: {
        bg: 'rgba(21, 107, 160, 0.7)',     // #156ba0
        border: '#156ba0'
    }
};


    const color = colorMap[metric];

    return {
        labels: topCities.map(item => item.city),
        datasets: [{
            label: metric.replace('_', ' ').toUpperCase(),
            data: topCities.map(item => item[metric]),
            backgroundColor: Array(3).fill(color.bg),
            borderColor: Array(3).fill(color.border),
            borderWidth: 1
        }]
    };
}



function createChart(chartId, chartData) {
    const ctx = document.getElementById(chartId).getContext('2d');
    return new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// 用于更新图表的函数
function updateChart() {
    const selectedChart = document.getElementById("chartSelector").value;
    let chartIndex = parseInt(selectedChart.replace('chart', ''), 10) - 1;
    showChart(chartIndex);  // 更新显示的图表
    charts[chartIndex].update();  // 更新图表
}

// 显示指定的图表
function showChart(index) {
    const allCharts = document.querySelectorAll('.chart');
    allCharts.forEach(chart => chart.classList.remove('active'));  // 隐藏所有图表

    const activeChart = document.getElementById(`barChart${index + 1}`);
    if (activeChart) {
        activeChart.classList.add('active');  // 显示选中的图表
    }
}

