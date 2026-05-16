let questions = [];

let currentIndex = -1;
let currentTaskIndex = 0;

let selectedTokens = [];

let divideResults = [];
let divideWrongCounts = [];

let partsUserInput = [];
let partsDetail = [];

let fullUserInput = '';

let divideFeedback = '';

let embedder = null;

// =========================
// AI模型初始化
// =========================

async function initAI(){

  try{

    embedder = await window.pipeline(
      'feature-extraction',
      'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
    );

    document.getElementById('loadingBox').innerHTML =
      '✅ AI语义模型加载完成';

  }catch(err){

    document.getElementById('loadingBox').innerHTML =
      '❌ AI模型加载失败';

    console.error(err);
  }
}

// =========================
// HTML安全
// =========================

function escapeHtml(str){

  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

// =========================
// 分词
// =========================

function tokenize(sentence){

  const regex = /([A-Za-z]+(?:[-'][A-Za-z]+)*|\d+|[.,!?;:()—-])|(\s+)/g;

  const tokens = [];

  let match;

  while((match = regex.exec(sentence)) !== null){

    if(match[1]){

      tokens.push({
        text:match[1],
        isWord:true,
        index:tokens.length
      });

    }else if(match[2]){

      tokens.push({
        text:match[2],
        isWord:false,
        index:tokens.length
      });
    }
  }

  return tokens;
}

function arraysEqual(a,b){
  return JSON.stringify(a) === JSON.stringify(b);
}

// =========================
// AI语义相似度
// =========================

async function semanticSimilarity(a,b){

  if(!embedder){
    return basicSimilarity(a,b);
  }

  try{

    const output1 = await embedder(a,{ pooling:'mean', normalize:true });

    const output2 = await embedder(b,{ pooling:'mean', normalize:true });

    const vec1 = output1.data;
    const vec2 = output2.data;

    let dot = 0;

    for(let i=0;i<vec1.length;i++){
      dot += vec1[i] * vec2[i];
    }

    return Math.max(0,Math.min(1,dot));

  }catch(err){

    console.error(err);

    return basicSimilarity(a,b);
  }
}

// =========================
// 基础字符相似度（备用）
// =========================

function basicSimilarity(a,b){

  a = normalizeChinese(a);
  b = normalizeChinese(b);

  if(!a || !b) return 0;

  if(a === b) return 1;

  let hit = 0;

  for(const ch of a){
    if(b.includes(ch)){
      hit++;
    }
  }

  return hit / Math.max(a.length,b.length);
}

// =========================
// 中文规范化
// =========================

function normalizeChinese(str){

  return str
    .replace(/[，。！？、“”‘’：；\s]/g,'')
    .replace(/中美/g,'美国和中国')
    .replace(/美中/g,'美国和中国')
    .replace(/第一份/g,'首份')
    .replace(/强调/g,'指出')
    .replace(/引导/g,'引领');
}

// =========================
// 中文自然度评分
// =========================

function fluencyScore(text){

  let score = 100;

  const rules = [
    {
      pattern:'它的第一份',
      penalty:8,
      message:'“它的第一份”建议改为“其首份”更自然'
    },
    {
      pattern:'引导数字经济',
      penalty:5,
      message:'“引导数字经济”建议改为“引领数字经济”'
    },
    {
      pattern:'中美正在引领',
      penalty:0,
      message:''
    }
  ];

  const comments = [];

  rules.forEach(rule=>{

    if(text.includes(rule.pattern)){

      score -= rule.penalty;

      if(rule.message){
        comments.push(rule.message);
      }
    }
  });

  score = Math.max(60,score);

  return {
    score,
    comments
  };
}

// =========================
// AI点评生成
// =========================

function generateComment(finalScore, fluencyComments){

  let text = '';

  if(finalScore >= 90){

    text += '整体翻译质量非常高，句子结构理解准确，语义表达完整。';

  }else if(finalScore >= 80){

    text += '整体翻译较好，核心语义正确，仅有部分表达不够自然。';

  }else if(finalScore >= 60){

    text += '句子主干基本正确，但部分词义和表达仍需优化。';

  }else{

    text += '翻译存在较明显问题，建议重新分析句子结构。';
  }

  if(fluencyComments.length){

    text += '<br><br>优化建议：<br>';

    fluencyComments.forEach(item=>{
      text += `• ${item}<br>`;
    });
  }

  return text;
}

// =========================
// 加载题库
// =========================

async function loadQuestions(){

  try{

    const resp = await fetch('./questions.json');

    questions = await resp.json();

    renderQuestionList();

  }catch(err){

    document.getElementById('mainView').innerHTML =
      '<div class="card">❌ questions.json加载失败</div>';
  }
}

// =========================
// 题库列表
// =========================

function renderQuestionList(){

  let html = '';

  questions.forEach((q,i)=>{

    html += `
      <div class="list-item" onclick="startQuestion(${i})">

        <div class="list-title">
          ${escapeHtml(q.sentence)}
        </div>

        <div class="list-sub">
          共 ${q.tasks.length} 个结构成分
        </div>

      </div>
    `;
  });

  document.getElementById('mainView').innerHTML = html;
}

// =========================
// 开始题目
// =========================

window.startQuestion = function(index){

  currentIndex = index;

  currentTaskIndex = 0;

  selectedTokens = [];

  divideResults = new Array(questions[index].tasks.length).fill(null);

  divideWrongCounts = new Array(questions[index].tasks.length).fill(0);

  partsUserInput = new Array(questions[index].tasks.length).fill('');

  partsDetail = [];

  fullUserInput = '';

  divideFeedback = '';

  renderDivide();
};

// =========================
// 划分页面
// =========================

function renderDivide(){

  const q = questions[currentIndex];

  const task = q.tasks[currentTaskIndex];

  const tokens = tokenize(q.sentence);

  const wrongCount = divideWrongCounts[currentTaskIndex];

  const remaining = Math.max(0,3 - wrongCount);

  const showCorrect =
    divideResults[currentTaskIndex] === false &&
    remaining === 0;

  let html = `
    <div class="card">

      <div class="task-title">
        第 ${currentTaskIndex + 1} 题：请选择【${task.title}】
      </div>

      <div>
        剩余机会：${remaining} / 3
      </div>

      <div class="sentence-box">
  `;

  tokens.forEach((tok,idx)=>{

    if(tok.isWord){

      let cls = 'token word';

      if(showCorrect && task.indices.includes(idx)){
        cls += ' correct-highlight';
      }
      else if(selectedTokens.includes(idx)){
        cls += ' selected';
      }

      html += `
        <span class="${cls}" onclick="toggleToken(${idx})">
          ${escapeHtml(tok.text)}
        </span>
      `;

    }else{
      html += tok.text;
    }
  });

  html += `
      </div>

      <div class="controls">

        <button onclick="submitDivide()">
          提交答案
        </button>

        <button class="secondary" onclick="renderQuestionList()">
          返回列表
        </button>

      </div>

      <div class="feedback">
        ${divideFeedback}
      </div>

    </div>
  `;

  document.getElementById('mainView').innerHTML = html;
}

window.toggleToken = function(idx){

  const pos = selectedTokens.indexOf(idx);

  if(pos >= 0){
    selectedTokens.splice(pos,1);
  }else{
    selectedTokens.push(idx);
  }

  renderDivide();
};

window.submitDivide = function(){

  const q = questions[currentIndex];

  const task = q.tasks[currentTaskIndex];

  const correct = [...task.indices].sort((a,b)=>a-b);

  const user = [...selectedTokens].sort((a,b)=>a-b);

  const ok = arraysEqual(correct,user);

  if(ok){

    divideResults[currentTaskIndex] = true;

    divideFeedback = '✅ 正确';

    renderDivide();

    setTimeout(()=>{

      currentTaskIndex++;

      selectedTokens = [];

      divideFeedback = '';

      if(currentTaskIndex >= q.tasks.length){
        renderParts();
      }else{
        renderDivide();
      }

    },700);

  }else{

    divideWrongCounts[currentTaskIndex]++;

    divideFeedback = '❌ 错误';

    renderDivide();
  }
};

// =========================
// 成分翻译
// =========================

function renderParts(){

  const q = questions[currentIndex];

  const tokens = tokenize(q.sentence);

  let html = `
    <div class="card">

      <div class="task-title">
        🔤 请翻译各个成分
      </div>
  `;

  q.tasks.forEach((task,idx)=>{

    const englishPart =
      task.indices
        .map(i=>tokens[i]?.text || '')
        .join(' ');

    html += `
      <div style="margin-bottom:22px;">

        <div style="font-weight:800; margin-bottom:8px;">
          ${task.title}
        </div>

        <div class="sentence-box">
          ${escapeHtml(englishPart)}
        </div>

        <textarea
          id="partInput-${idx}"
          placeholder="请输入中文翻译"
        >${escapeHtml(partsUserInput[idx])}</textarea>

      </div>
    `;
  });

  html += `

    <div class="controls">

      <button onclick="submitParts()">
        提交成分翻译
      </button>

      <button class="secondary" onclick="renderQuestionList()">
        返回列表
      </button>

    </div>

    </div>
  `;

  document.getElementById('mainView').innerHTML = html;

  q.tasks.forEach((task,idx)=>{

    document
      .getElementById(`partInput-${idx}`)
      .addEventListener('input',e=>{

        partsUserInput[idx] = e.target.value;
      });
  });
}

window.submitParts = async function(){

  const q = questions[currentIndex];

  let correctCount = 0;

  partsDetail = [];

  for(let idx=0; idx<q.tasks.length; idx++){

    const task = q.tasks[idx];

    const user = partsUserInput[idx].trim();

    const std = task.translation;

    const sim = await semanticSimilarity(user,std);

    const ok = sim >= 0.75;

    if(ok){
      correctCount++;
    }

    partsDetail.push({
      ok,
      similarity:Math.round(sim * 100)
    });
  }

  setTimeout(()=>{
    renderFull();
  },500);
};

// =========================
// 整句翻译
// =========================

function renderFull(){

  const q = questions[currentIndex];

  let html = `
    <div class="card">

      <div class="task-title">
        📝 请翻译整句
      </div>

      <div class="sentence-box">
        ${escapeHtml(q.sentence)}
      </div>

      <textarea
        id="fullTranslationInput"
        placeholder="请输入整句翻译"
      >${escapeHtml(fullUserInput)}</textarea>

      <div class="controls">

        <button onclick="submitFull()">
          提交整句翻译
        </button>

        <button class="secondary" onclick="renderQuestionList()">
          返回列表
        </button>

      </div>

      <div id="fullFeedback"></div>

    </div>
  `;

  document.getElementById('mainView').innerHTML = html;

  document
    .getElementById('fullTranslationInput')
    .addEventListener('input',e=>{

      fullUserInput = e.target.value;
    });
}

// =========================
// 最终AI评分
// =========================

window.submitFull = async function(){

  const q = questions[currentIndex];

  const input = fullUserInput.trim();

  const standard = q.fullTranslation;

  const fb = document.getElementById('fullFeedback');

  if(!input){

    fb.innerHTML = '请输入整句翻译';

    return;
  }

  fb.innerHTML = '⏳ AI正在分析翻译质量...';

  // =========================
  // 结构分
  // =========================

  const divideCorrect =
    divideResults.filter(x=>x===true).length;

  const structureScore =
    Math.round(divideCorrect / q.tasks.length * 100);

  // =========================
  // 成分语义分
  // =========================

  const partScore =
    Math.round(
      partsDetail.reduce((sum,x)=>sum+x.similarity,0)
      / partsDetail.length
    );

  // =========================
  // 整句AI语义分
  // =========================

  const semantic = await semanticSimilarity(input,standard);

  const semanticScore = Math.round(semantic * 100);

  // =========================
  // 中文自然度
  // =========================

  const fluency = fluencyScore(input);

  // =========================
  // 最终融合评分
  // =========================

  const finalScore = Math.round(
    structureScore * 0.3 +
    partScore * 0.25 +
    semanticScore * 0.35 +
    fluency.score * 0.1
  );

  // =========================
  // 等级
  // =========================

  let level = '';

  if(finalScore >= 90){
    level = '🌟 非常优秀';
  }
  else if(finalScore >= 80){
    level = '✅ 良好';
  }
  else if(finalScore >= 60){
    level = '⚠️ 基本正确';
  }
  else{
    level = '❌ 需改进';
  }

  // =========================
  // AI点评
  // =========================

  const comment = generateComment(
    finalScore,
    fluency.comments
  );

  // =========================
  // 详细表格
  // =========================

  let tableHtml = `
    <table class="detail-table">

      <tr>
        <th>成分</th>
        <th>你的翻译</th>
        <th>参考答案</th>
        <th>AI语义</th>
      </tr>
  `;

  q.tasks.forEach((task,idx)=>{

    tableHtml += `
      <tr>

        <td>${task.title}</td>

        <td>${escapeHtml(partsUserInput[idx])}</td>

        <td>${escapeHtml(task.translation)}</td>

        <td class="${partsDetail[idx].ok ? 'pass':'fail'}">
          ${partsDetail[idx].similarity}%
        </td>

      </tr>
    `;
  });

  tableHtml += '</table>';

  // =========================
  // 显示结果
  // =========================

  fb.innerHTML = `

    <div class="result">

      <div class="score">
        综合得分：${finalScore}% (${level})
      </div>

      <div class="score-line">
        📘 结构理解：${structureScore}%
      </div>

      <div class="score-line">
        🔤 成分语义：${partScore}%
      </div>

      <div class="score-line">
        🧠 AI语义：${semanticScore}%
      </div>

      <div class="score-line">
        ✨ 中文自然度：${fluency.score}%
      </div>

      <div style="margin-top:20px; line-height:2;">
        <strong>标准译文：</strong><br>
        ${escapeHtml(standard)}
      </div>

      <div style="margin-top:18px; line-height:2;">
        <strong>你的译文：</strong><br>
        ${escapeHtml(input)}
      </div>

      ${tableHtml}

      <div class="ai-comment">

        <strong>🤖 AI点评：</strong><br><br>

        ${comment}

      </div>

      <div class="controls">

        <button onclick="renderQuestionList()">
          返回题库
        </button>

        <button onclick="startQuestion(${currentIndex})">
          重新练习
        </button>

      </div>

    </div>
  `;
};

// =========================
// 初始化
// =========================

initAI();
loadQuestions();
