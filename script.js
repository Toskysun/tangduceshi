document.addEventListener('DOMContentLoaded', () => {

    // 所有阶段的容器
    const stages = {
        name: document.getElementById('stage-name'),
        quiz: document.getElementById('stage-quiz'),
        result: document.getElementById('stage-result')
    };

    // 交互元素
    const nameInput = document.getElementById('name-input');
    const submitNameButton = document.getElementById('submit-name');
    const analyzeButton = document.getElementById('analyze-button');
    const resetButton = document.getElementById('reset-button');
    const shareButton = document.getElementById('share-button');

    // 进度和结果展示元素
    const progressText = document.getElementById('progress-text');
    const quizItems = document.querySelectorAll('.quiz-item');
    const resultName = document.getElementById('result-name');
    const finalScoreDisplay = document.getElementById('final-score');
    const scoreCircle = document.querySelector('.score-circle');
    const reportSummary = document.getElementById('report-summary');
    const reportSuggestion = document.getElementById('report-suggestion');
    const fallbackShare = document.getElementById('fallback-share');

    // 存储分数的变量
    let nameScore = 0;
    let finalScore = 0; // 提升作用域，以便分享功能可以访问

    // 切换阶段的函数
    function showStage(stageName) {
        for (const key in stages) {
            stages[key].classList.remove('active');
        }
        stages[stageName].classList.add('active');
    }

    // 1. 姓名提交逻辑
    submitNameButton.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name === "") {
            alert('别害羞，告诉我你的名字。');
            return;
        }
        nameScore = calculateNameScore(name);
        resultName.textContent = name;
        showStage('quiz');
    });

    // 2. 问卷进度更新逻辑
    stages.quiz.addEventListener('change', () => {
        const answeredCount = document.querySelectorAll('input[type="radio"]:checked').length;
        progressText.textContent = `${answeredCount} / ${quizItems.length}`;
    });

    // 新增：为 label 添加选中样式的同步逻辑（修复点击选项后不显示选中状态的 bug）
    (function attachRadioLabelSync() {
        const allRadios = document.querySelectorAll('.options input[type="radio"]');
        allRadios.forEach(radio => {
            // 初始同步（比如页面恢复时）
            const parentLabel = radio.closest('label');
            if (parentLabel) {
                if (radio.checked) parentLabel.classList.add('selected');
                else parentLabel.classList.remove('selected');
            }

            radio.addEventListener('change', () => {
                // 对同名组清理所有 label 的 selected 状态
                document.querySelectorAll(`input[name="${radio.name}"]`).forEach(r => {
                    const lbl = r.closest('label');
                    if (lbl) lbl.classList.remove('selected');
                });
                // 给被选中的那个 label 加上 selected
                const lbl = radio.closest('label');
                if (lbl) lbl.classList.add('selected');

                // 更新进度文本（为了保险，兼容性更好）
                const answeredCount = document.querySelectorAll('input[type="radio"]:checked').length;
                progressText.textContent = `${answeredCount} / ${quizItems.length}`;
            });
        });
    })();

    // 3. 最终分析逻辑
    analyzeButton.addEventListener('click', () => {
        const quizScore = getQuizScore();
        if (quizScore === -1) {
            alert(`你还有 ${quizItems.length - document.querySelectorAll('input[type="radio"]:checked').length} 道题没做完，别想偷懒！`);
            return;
        }

        // 计算加权总分
        finalScore = Math.round(nameScore * 0.4 + quizScore * 0.6); // 调整权重，问卷更重要
        if (finalScore > 100) finalScore = 100; // 分数封顶

        // 根据分数生成报告
        generateReport(finalScore);

        // 更新UI
        finalScoreDisplay.textContent = finalScore;
        scoreCircle.style.setProperty('--score', `${finalScore * 3.6}deg`);
        
        showStage('result');
    });

    // 4. 分享逻辑
    shareButton.addEventListener('click', async () => {
        const shareTitle = `我的PNTI唐度指数分析报告`;
        const shareText = `我刚刚完成了PNTI深度行为学分析，我的综合唐度指数是 ${finalScore}/100！你也来测测你的“唐”点在哪里？`;
        // ！！！极其重要：请将下面的 URL 换成你部署后的 Cloudflare 网址！
        const shareUrl = 'https://tangduceshi-bs7nf0sb.maozi.io/'; 

        if (navigator.share) {
            // 使用 Web Share API
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                console.error('分享失败或用户取消:', error);
            }
        } else {
            // 降级方案：显示备用链接
            fallbackShare.innerHTML = `
                <p>你的浏览器不支持原生分享，请手动复制：</p>
                <input type="text" value="${shareText} ${shareUrl}" readonly onclick="this.select()">
            `;
            fallbackShare.classList.add('active');
        }
    });

    // 5. 重置逻辑
    resetButton.addEventListener('click', () => {
        // 重置所有状态
        nameInput.value = '';
        document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
        // 移除所有 label 的 selected 类
        document.querySelectorAll('.options label.selected').forEach(lbl => lbl.classList.remove('selected'));
        progressText.textContent = `0 / ${quizItems.length}`;
        fallbackShare.classList.remove('active');
        fallbackShare.innerHTML = '';
        nameScore = 0;
        finalScore = 0;
        showStage('name');
    });

    // ----- 辅助函数 -----

    // 姓名计分 (保留原逻辑)
    function calculateNameScore(name) {
        let score = 0;
        const keywords = ['孙', '川', '狗', '李', '赣', '抽象'];
        for (const char of name) {
            if (keywords.includes(char)) {
                score += 30;
            }
        }
        score += name.length * 5;
        return Math.min(score, 100);
    }

    // 问卷计分 (可扩展的计分逻辑)
    function getQuizScore() {
        const answeredQuestions = document.querySelectorAll('input[type="radio"]:checked');
        if (answeredQuestions.length < quizItems.length) {
            return -1; // -1 表示未完成
        }

        let totalValue = 0;
        answeredQuestions.forEach(input => {
            totalValue += parseInt(input.value);
        });

        // 将总分映射到 0-100 的范围 (假设每个问题最高分20)
        const maxPossibleScore = quizItems.length * 20;
        return Math.round((totalValue / maxPossibleScore) * 100);
    }

    // 生成报告文本
    function generateReport(score) {
        if (score > 90) {
            reportSummary.textContent = "超凡入圣，天选之人。你的行为模式已经超越了凡人的理解范畴，每一个决策都充满了令人费解的艺术感。你是人群中最闪耀的星，也是最容易被绊倒的那颗。";
            reportSuggestion.textContent = "无需建议，请继续保持你的纯真。但出门时，建议由监护人陪同。";
        } else if (score > 70) {
            reportSummary.textContent = "资深玩家，潜力无限。你深谙“抽象”与“天真”的平衡之道，时常能在不经意间展现出惊人的操作。你的大脑可能是个薛定谔的盒子，同时存在着理智与混乱。";
            reportSuggestion.textContent = "在做出重要决定前，不妨先喝口水冷静一下。另外，离井盖远一点。";
        } else if (score > 40) {
            reportSummary.textContent = "偶有闪光，尚在人间。你的大部分行为符合社会预期，但内心深处依然住着一个喜欢踩水坑的小孩。你试图融入正常人的世界，但偶尔会暴露本性。";
            reportSuggestion.textContent = "继续伪装，你做得很好。在分享此报告前，请三思。";
        } else {
            reportSummary.textContent = "过于正常，索然无味。你的行为逻辑清晰，决策理性，几乎没有任何“唐氏”倾向。你可能是这个测试的“天敌”。";
            reportSuggestion.textContent = "生活不止眼前的苟且，还有诗和远方的……西瓜皮。试着做点出格的事吧，比如用左手吃饭。";
        }
    }
});
