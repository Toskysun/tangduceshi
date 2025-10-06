document.addEventListener('DOMContentLoaded', () => {
    // 阶段容器
    const stages = {
        name: document.getElementById('stage-name'),
        quiz: document.getElementById('stage-quiz'),
        result: document.getElementById('stage-result')
    };

    // 交互元素
    const nameInput = document.getElementById('name-input');
    const startButton = document.getElementById('start-button');
    const analyzeButton = document.getElementById('analyze-button');
    const resetButton = document.getElementById('reset-button');
    
    // 报告元素
    const reportName = document.getElementById('report-name');
    const reportScoreEl = document.getElementById('report-score');
    const reportAnalysis = document.getElementById('report-analysis');
    const reportSuggestion = document.getElementById('report-suggestion');
    
    let currentName = '';
    let nameScore = 0;

    // 切换舞台的函数
    function switchStage(targetStage) {
        Object.values(stages).forEach(stage => stage.classList.remove('active'));
        stages[targetStage].classList.add('active');
    }

    // 1. 开始评估
    startButton.addEventListener('click', () => {
        currentName = nameInput.value.trim();
        if (currentName === '') {
            alert('警告：一个没有名字的人无法被定义，也无法被分析。');
            return;
        }
        nameScore = calculatePNTI(currentName);
        switchStage('quiz');
    });

    // 2. 生成最终报告
    analyzeButton.addEventListener('click', () => {
        const quizScore = getQuizScore();
        if (quizScore === -1) {
            alert('提示：完成所有行为学问题，才能解锁你的完整人格画像。');
            return;
        }
        
        // 最终分数 = 姓名基础分 + 问卷行为分
        // 权重分配：姓名占60%，问卷占40% (看起来更科学)
        const finalScore = Math.round(nameScore * 0.6 + quizScore * 0.4);

        analyzeButton.textContent = '深度计算中...';
        analyzeButton.disabled = true;

        setTimeout(() => {
            const { analysis, suggestion } = getAnalysisReport(finalScore);
            reportName.textContent = currentName;
            reportScoreEl.textContent = `${finalScore} / 100`;
            reportAnalysis.textContent = analysis;
            reportSuggestion.textContent = suggestion;

            switchStage('result');
            analyzeButton.textContent = '生成最终报告';
            analyzeButton.disabled = false;
        }, 1500);
    });
    
    // 3. 重新评估
    resetButton.addEventListener('click', () => {
        nameInput.value = '';
        // 清除问卷选择
        document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
        switchStage('name');
    });
    
    function getQuizScore() {
        const q1 = document.querySelector('input[name="q1"]:checked');
        const q2 = document.querySelector('input[name="q2"]:checked');
        const q3 = document.querySelector('input[name="q3"]:checked');

        if (!q1 || !q2 || !q3) {
            return -1; // 表示未完成
        }

        const totalValue = parseInt(q1.value) + parseInt(q2.value) + parseInt(q3.value);
        // 将问卷得分映射到0-100的范围
        // 最高分 20+20+20 = 60
        return Math.round((totalValue / 60) * 100);
    }
    
    // PNTI 核心算法 (与之前相同)
    function calculatePNTI(name) {
        let hash = 0;
        const environmentalFactor = new Date().getDate();
        for (let i = 0; i < name.length; i++) {
            hash = (hash + name.charCodeAt(i) * (i + 1)) % 101;
        }
        const finalScore = (hash + environmentalFactor) % 101;
        return Math.floor(Math.abs(Math.sin(finalScore) * 101));
    }

    // 分析报告生成器 (与之前相同)
    function getAnalysisReport(score) {
        if (score > 90) return { analysis: '该个体的姓名印记与行为模式呈现出极强的非主流叙事结构。其心智模型与当前流行文化模因产生高度共振，表现出强烈的“唐氏范式”先锋特征。', suggestion: '无需改变。你不是在追随潮流，你就是潮流本身。' };
        if (score > 70) return { analysis: '姓名与行为在社会学上具有显著的“反思性错位”，极易在社交互动中触发认知失调，表现出远超常人的“唐度”潜质。', suggestion: '在特定社交场合可放大此特质，能有效打破社交僵局，成为焦点。' };
        if (score > 40) return { analysis: '一个相对稳健的社会学范本，其“唐度”表现在统计学意义上的安全区内。在大多数情况下表现得体，但缺乏令人印象深刻的个性化标签。', suggestion: '可考虑增加一个具有“网感”的昵称，以提升在特定圈层中的辨识度。' };
        if (score > 10) return { analysis: '该个体在文化语境中表现出高度的传统性和规范性，其心智模型稳定，难以与“唐”文化产生关联，社会认同感强。', suggestion: '在寻求严肃、专业的形象时，此配置具有天然优势。无需做出任何调整。' };
        return { analysis: '姓名与行为模式极度稳定，堪称社会学意义上的“零熵”状态。其文化印记与“唐”文化完全绝缘，表现出强烈的精英或古典气质。', suggestion: '恭喜，你是“唐文化绝缘体”。请继续保持这份独特的高雅。' };
    }
});
