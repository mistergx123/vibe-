// ─── Detecta modo urgente e estado de sessão ───────────────────────────────────
(function initPage() {
    const params = new URLSearchParams(window.location.search);
    const isUrgente = params.get('urgente') === '1';
  
    if (isUrgente) {
      document.getElementById('urgente-banner').classList.remove('hidden');
      document.getElementById('urgente-flag').classList.remove('hidden');
    }
  
    
    let user = null;
    try {
      user = JSON.parse(sessionStorage.getItem('medicheck_user') || 'null');
    } catch (e) {}
  
    if (user) {
      document.getElementById('topbar-dashboard').style.display = 'inline-flex';
      document.getElementById('topbar-login').style.display = 'none';
      document.getElementById('btn-ver-historico').style.display = 'inline-flex';
  
      if (user.nascimento) {
        const idade = calcIdade(user.nascimento);
        document.getElementById('field-idade').value = idade;
      }
    } else {
      document.getElementById('topbar-login').style.display = 'inline-flex';
      document.getElementById('topbar-dashboard').style.display = 'none';
    }
  })();
  
  // ─── Seleção de região no boneco ───────────────────────────────────────────────
  function selectPart(el) {
    const region = el.dataset.region;
    const jaSelected = el.classList.contains('selected');
  
    document.querySelectorAll('.body-part').forEach(p => p.classList.remove('selected'));
    document.querySelectorAll('.rchip').forEach(c => c.classList.remove('active'));
  
    if (jaSelected) { clearRegion(); return; }
  
    document.querySelectorAll(`.body-part[data-region="${region}"]`).forEach(p => p.classList.add('selected'));
    document.querySelectorAll(`.rchip[data-region="${region}"]`).forEach(c => c.classList.add('active'));
    setRegion(region);
  }
  
  // ─── Seleção via chip ──────────────────────────────────────────────────────────
  function selectChip(el, region) {
    const jaActive = el.classList.contains('active');
  
    document.querySelectorAll('.rchip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.body-part').forEach(p => p.classList.remove('selected'));
  
    if (jaActive) { clearRegion(); return; }
  
    el.classList.add('active');
  
    if (region === 'Corpo todo') {
      document.querySelectorAll('.body-part').forEach(p => p.classList.add('selected'));
      document.querySelectorAll('.rchip').forEach(c => c.classList.add('active'));
    } else {
      document.querySelectorAll(`.body-part[data-region="${region}"]`).forEach(p => p.classList.add('selected'));
    }
  
    setRegion(region);
  }
  
  // ─── Atualiza display de região ────────────────────────────────────────────────
  function setRegion(region) {
    document.getElementById('region-input').value = region;
    document.getElementById('region-text').textContent = region;
    document.getElementById('region-text').classList.add('active');
    document.getElementById('region-dot').classList.add('active');
  }
  
  function clearRegion() {
    document.getElementById('region-input').value = '';
    document.getElementById('region-text').textContent = 'Nenhuma região selecionada';
    document.getElementById('region-text').classList.remove('active');
    document.getElementById('region-dot').classList.remove('active');
  }
  
  // ─── Toggle febre ──────────────────────────────────────────────────────────────
  function setFebre(val) {
    document.getElementById('febre-input').value = val;
    document.getElementById('ft-sim').className = 'ftoggle' + (val === 'sim' ? ' yes' : '');
    document.getElementById('ft-nao').className = 'ftoggle' + (val === 'nao' ? ' no' : '');
  }
  
  // ─── Submit do formulário ──────────────────────────────────────────────────────
  document.getElementById('triagem-form').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const regiao  = document.getElementById('region-input').value;
    const febre   = document.getElementById('febre-input').value;
    const idade   = this.querySelector('[name="idade"]').value;
    const tempo   = this.querySelector('[name="tempo"]').value;
    const sintoma = this.querySelector('[name="sintoma"]').value;
  
    if (!sintoma.trim()) {
      alert('Por favor, descreva seus sintomas.');
      return;
    }
  
    const btn = document.getElementById('btn-submit');
    btn.classList.add('loading');
  
    try {
      
      const formData = new FormData(this);
     const response = await fetch('/api/triagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regiao, febre, idade, tempo, sintoma })
      });
  
      if (response.status === 419) {
        
        alert('Sessão expirada. Recarregue a página e tente novamente.');
        btn.classList.remove('loading');
        return;
      }
  
      if (!response.ok) {
        throw new Error('Erro ao processar triagem.');
      }
  
      const data = await response.json();
      showResult(data);
  
    } catch (err) {
      alert('Não foi possível concluir a triagem. Tente novamente.');
      console.error(err);
    }
  
    btn.classList.remove('loading');
  });
  
  // ─── Renderiza resultado ───────────────────────────────────────────────────────
  function showResult(data) {
    const panel  = document.getElementById('result-panel');
    const header = document.getElementById('result-urgency-header');
  
    header.className = 'urgency-header ' + (data.urgencia === 'alta' ? 'red' : data.urgencia === 'media' ? 'yellow' : 'green');
    document.getElementById('result-emoji').textContent     = data.emoji;
    document.getElementById('result-titulo').textContent    = data.titulo;
    document.getElementById('result-descricao').textContent = data.descricao;
    document.getElementById('result-causa').textContent     = data.causa;
    document.getElementById('result-prazo').textContent     = data.prazo;
  
    document.getElementById('steps-list').innerHTML = data.passos.map((p, i) =>
      `<div class="step-row"><div class="step-n">${i + 1}</div><p>${p}</p></div>`
    ).join('');
  
    panel.classList.add('show');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  // ─── Nova triagem ──────────────────────────────────────────────────────────────
  function novaTriagem() {
    document.getElementById('result-panel').classList.remove('show');
    document.getElementById('triagem-form').reset();
    clearRegion();
    document.querySelectorAll('.body-part').forEach(p => p.classList.remove('selected'));
    document.querySelectorAll('.rchip').forEach(c => c.classList.remove('active'));
    document.getElementById('ft-sim').className = 'ftoggle';
    document.getElementById('ft-nao').className = 'ftoggle';
    document.getElementById('febre-input').value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // ─── Helper ────────────────────────────────────────────────────────────────────
  function calcIdade(nascimento) {
    const hoje = new Date();
    const nasc = new Date(nascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  }
