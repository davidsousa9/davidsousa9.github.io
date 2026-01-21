// js/main.js
// Inicia menus horizontais e ligação entre botões <-> panels
// Usa tabulação para identação.

document.addEventListener('DOMContentLoaded', () => {
	// Inicializa todos os menus horizontais da página
	[...document.querySelectorAll('.hmenu')].forEach((hmenu) => {
		const buttons = [...hmenu.querySelectorAll('button[data-panel]')];
		const panels = [...document.querySelectorAll('.panel')];

		// Função para ativar um painel
		const activate = (targetBtn) => {
			const target = targetBtn.getAttribute('data-panel');

			// atualizar botões
			buttons.forEach((b) => {
				const isActive = b === targetBtn;
				b.classList.toggle('active', isActive);
				b.setAttribute('aria-selected', isActive ? 'true' : 'false');
			});

			// atualizar painéis
			panels.forEach((p) => {
				p.classList.toggle('active', p.id === target);
			});

			// guardar última tab por página (namespace por pathname)
			const pageKey = `eaep.lastSubPanel::${location.pathname}`;
			try {
				localStorage.setItem(pageKey, target);
			} catch (e) {
				/* ignore localStorage errors */
			}
		};

		// ligar eventos
		buttons.forEach((btn, idx) => {
			btn.tabIndex = 0;
			btn.addEventListener('click', () => activate(btn));
			btn.addEventListener('keydown', (e) => {
				if (e.key === 'ArrowRight') {
					e.preventDefault();
					const next = buttons[(idx + 1) % buttons.length];
					next.focus();
					next.click();
				} else if (e.key === 'ArrowLeft') {
					e.preventDefault();
					const prev = buttons[(idx - 1 + buttons.length) % buttons.length];
					prev.focus();
					prev.click();
				}
			});
		});

		// restaurar ultimo painel se existir
		const pageKey = `eaep.lastSubPanel::${location.pathname}`;
		let last = null;
		try {
			last = localStorage.getItem(pageKey);
		} catch (e) {
			last = null;
		}
		if (last) {
			const btn = hmenu.querySelector(`button[data-panel="${last}"]`);
			if (btn) {
				activate(btn);
				return;
			}
		}

		// se nenhum, ativa o primeiro botão (ou o que tiver .active)
		const initial = hmenu.querySelector('button.active') || buttons[0];
		if (initial) activate(initial);
	});
});

// Table generator + search + filter + sort + row click
// Adicionar no final de js/main.js ou em novo ficheiro incluído na página.

(function(){
	// Data settings (order required)
	const counts = [
		{division: 'Alcateia', count: 5, className:'row-alcateia'},
		{division: 'Tribo de Escoteiros', count: 5, className:'row-tribo-escoteiros'},
		{division: 'Tribo de Exploradores', count: 5, className:'row-tribo-exploradores'},
		{division: 'Clã', count: 5, className:'row-cla'},
		{division: 'Chefia', count: 3, className:'row-chefia'}
	];

	// sample names (first + last) to compose random realistic names
	const firstNames = ['João','Miguel','Sofia','Ana','Pedro','Tiago','Carolina','Rui','Marta','Nuno','Beatriz','Ricardo','Inês','Luís','Mariana','Hugo','Paulo','Rafael','Helena','Gabriel'];
	const lastNames = ['Pereira','Silva','Costa','Fernandes','Martins','Santos','Oliveira','Rodrigues','Gomes','Carvalho','Almeida','Mendes','Dias','Pinto','Ferreira'];

	// helpers
	const $ = (sel, ctx=document) => ctx.querySelector(sel);
	const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

	// generate rows in required order
	function generateRows(){
		const rows = [];
		let counter = 10001;
		counts.forEach(group=>{
			for(let i=0;i<group.count;i++){
				const fn = firstNames[(counter + i) % firstNames.length];
				const ln = lastNames[(counter + i*3) % lastNames.length];
				const name = `${fn} ${ln}`;
				const num = `${counter.toString().padStart(5,'0')}`;
				rows.push({
					division: group.division,
					name,
					num,
					className: group.className
				});
				counter++;
			}
		});
		return rows;
	}

	// render rows to tbody (rows: array of objects)
	function renderRows(rows){
		const tbody_aux = document.querySelector('#peopleTable tbody');
		if (!tbody_aux) return; // sai do script se não existe

		const tbody = $('#peopleTable tbody');
		tbody.innerHTML = '';
		
		const fragment = document.createDocumentFragment();
		rows.forEach(r=>{
			const tr = document.createElement('tr');
			tr.className = `${r.className} row-link`;
			tr.dataset.href = '../pages/utilizador.html'; // target page
			// Division cell
			const tdDiv = document.createElement('td');
			tdDiv.textContent = r.division;
			tr.appendChild(tdDiv);
			// Name cell
			const tdName = document.createElement('td');
			tdName.textContent = r.name;
			tr.appendChild(tdName);
			// Number cell
			const tdNum = document.createElement('td');
			tdNum.textContent = r.num;
			tr.appendChild(tdNum);

			fragment.appendChild(tr);
		});
		tbody.appendChild(fragment);
	}

	// initial data
	const allRows = generateRows();
	renderRows(allRows);

	// ---- filter ----
	const divisionFilter_aux = document.querySelector('#divisionFilter');
	if (divisionFilter_aux){
		$('#divisionFilter').addEventListener('change', (e)=>{
			applyFiltersAndSearch();
		});
	}

	// ---- search ----
	const tableSearch_aux = document.querySelector('#tableSearch');
	if (tableSearch_aux){
		$('#tableSearch').addEventListener('input', (e)=>{
			applyFiltersAndSearch();
		});
	}

	// reset
	const resetTable_aux = document.querySelector('#resetTable');
	if (resetTable_aux){
		$('#resetTable').addEventListener('click', ()=>{
			$('#divisionFilter').value = 'all';
			$('#tableSearch').value = '';
			renderRows(allRows);
		});
	}

	// combined filter + search
	function applyFiltersAndSearch(){
		const filter = $('#divisionFilter').value;
		const q = $('#tableSearch').value.trim().toLowerCase();
		let filtered = allRows.slice();
		if(filter !== 'all'){
			filtered = filtered.filter(r => r.division === filter);
		}
		if(q){
			filtered = filtered.filter(r => (r.name.toLowerCase().includes(q) || r.num.toLowerCase().includes(q)));
		}
		renderRows(filtered);
	}

	// ---- row click: navigate ----
	const peopleTable_aux = document.querySelector('#peopleTable');
	if (peopleTable_aux){
		$('#peopleTable tbody').addEventListener('click', (e)=>{
			let tr = e.target.closest('tr');
			if(!tr) return;
			const href = tr.dataset.href || '../pages/utilizador.html';
			// navigate top window (works inside iframe contexts)
			window.top.location.href = href;
		});
	}

	// ---- sorting (toggle asc/desc) ----
	let sortState = {key: null, asc: true};
	$$('#peopleTable thead th.sortable').forEach(th=>{
		th.style.cursor = 'pointer';
		th.addEventListener('click', ()=>{
			const key = th.dataset.key;
			if(!key) return;
			sortState.asc = (sortState.key === key) ? !sortState.asc : true;
			sortState.key = key;
			sortTableBy(key, sortState.asc);
			// update header arrows
			$$('#peopleTable thead th.sortable').forEach(h=>h.textContent = h.textContent.replace(/ ▾| ▴/g,'') + ' ▾');
			th.textContent = th.textContent.replace(/ ▾| ▴/g,'') + (sortState.asc ? ' ▴' : ' ▾');
		});
	});

	function sortTableBy(key, asc){
		const currentRows = $$('#peopleTable tbody tr').map(tr=>{
			return {
				division: tr.children[0].textContent,
				name: tr.children[1].textContent,
				num: tr.children[2].textContent,
				className: tr.className
			};
		});
		currentRows.sort((a,b)=>{
			let va = a[key] || '';
			let vb = b[key] || '';
			// numeric compare for num if format AEP-xxxxx
			if(key === 'num'){
				va = va.replace(/\D/g,'') || '0';
				vb = vb.replace(/\D/g,'') || '0';
				return (asc ? (Number(va)-Number(vb)) : (Number(vb)-Number(va)));
			}
			va = va.toLowerCase();
			vb = vb.toLowerCase();
			if(va < vb) return asc ? -1 : 1;
			if(va > vb) return asc ? 1 : -1;
			return 0;
		});
		renderRows(currentRows);
	}
})();

// Finance sections selector (picklist -> show section)
document.addEventListener('DOMContentLoaded', () => {
	const select = document.getElementById('financeSelect');
	if (!select) return;

	const sections = Array.from(document.querySelectorAll('.finance-section'));

	function showKey(key){
		sections.forEach(s => s.classList.toggle('active', s.dataset.key === key));
	}

	// default: first option
	showKey(select.value);

	select.addEventListener('change', (e) => {
		showKey(e.target.value);
		// optional: remember last choice
		try { localStorage.setItem('eaep.lastFinance', e.target.value); } catch (e){}
	});

	// restore last
	try {
		const last = localStorage.getItem('eaep.lastFinance');
		if (last) {
			select.value = last;
			showKey(last);
		}
	} catch (e){}
});

document.addEventListener('DOMContentLoaded', () => {
	const select = document.getElementById('activitiesSelect');
	if (!select) return;

	const sections = Array.from(document.querySelectorAll('.activity-section'));

	function showKey(key){
		sections.forEach(s => s.classList.toggle('active', s.dataset.key === key));
	}

	// default: first option (or saved)
	const saved = (function(){
		try{ return localStorage.getItem('eaep.lastActivity'); }catch(e){ return null; }
	})();
	if(saved && [...select.options].some(o=>o.value===saved)){
		select.value = saved;
	}
	showKey(select.value);

	select.addEventListener('change', (e) => {
		showKey(e.target.value);
		try{ localStorage.setItem('eaep.lastActivity', e.target.value); }catch(e){}
	});
});

// Divisions / subgroups table generator (multi-page safe)
document.addEventListener('DOMContentLoaded', () => {
	const container = document.getElementById('divisions-section');
	if (!container) return;

	const divisionSelect = document.getElementById('divisionSelect');
	const subgroupWrapper = document.getElementById('subgroupWrapper');
	const subgroupSelect = document.getElementById('subgroupSelect');
	const divisionSearch = document.getElementById('divisionSearch');
	const resetBtn = document.getElementById('resetDivisions');
	const table = document.getElementById('divisionTable');
	const tbody = table && table.querySelector('tbody');

	if (!table || !tbody) return;

	// definitions and desired counts
	const config = [
		{
			division: 'Alcateia',
			className: 'row-alcateia',
			subgroups: [
				{ name: 'Castanho', count: 6 },
				{ name: 'Branco', count: 6 }
			]
		},
		{
			division: 'Tribo de Escoteiros',
			className: 'row-tribo-escoteiros',
			subgroups: [
				{ name: 'Lobo', count: 6 },
				{ name: 'Lince', count: 6 }
			]
		},
		{
			division: 'Tribo de Exploradores',
			className: 'row-tribo-exploradores',
			subgroups: [
				{ name: 'Guarda-Rios', count: 6 },
				{ name: 'Raposa', count: 6 }
			]
		},
		{
			division: 'Clã',
			className: 'row-cla',
			subgroups: [
				{ name: 'Clã', count: 5 } // treated as single subgroup
			]
		},
		{
			division: 'Chefia',
			className: 'row-chefia',
			subgroups: [
				{ name: 'Alcateia', count: 2 },
				{ name: 'Tribo de Escoteiros', count: 2 },
				{ name: 'Tribo de Exploradores', count: 2 },
				{ name: 'Clã', count: 1 },
				{ name: 'Grupo', count: 3 }
			]
		}
	];

	// name pools
	const firstNames = ['João','Miguel','Sofia','Ana','Pedro','Tiago','Carolina','Rui','Marta','Nuno','Beatriz','Ricardo','Inês','Luís','Mariana','Hugo','Paulo','Rafael','Helena','Gabriel','Sérgio','Catarina','Bruno','Duarte','Filipa'];
	const lastNames = ['Pereira','Silva','Costa','Fernandes','Martins','Santos','Oliveira','Rodrigues','Gomes','Carvalho','Almeida','Mendes','Dias','Pinto','Ferreira','Monteiro','Teixeira','Nóbrega'];

	// generate all rows in the exact order requested
	const allRows = [];
	let seq = 10001;
	config.forEach(group => {
		group.subgroups.forEach(sg => {
			for (let i=0;i<sg.count;i++){
				const fn = firstNames[(seq + i) % firstNames.length];
				const ln = lastNames[(seq*2 + i*3) % lastNames.length];
				allRows.push({
					division: group.division,
					subgroup: sg.name,
					name: `${fn} ${ln}`,
					num: `${(seq+i).toString().padStart(5,'0')}`,
					className: group.className
				});
			}
			seq += sg.count;
		});
	});

	// utilities
	const $ = (sel, ctx=document) => ctx.querySelector(sel);
	const $$ = (sel, ctx=document) => Array.from((ctx||document).querySelectorAll(sel));

	// populate subgroup select for a division
	function populateSubgroups(divisionValue){
		const cfg = config.find(c=>c.division === divisionValue);
		if(!cfg) return;

		// CLÃ → sem sub-grupo
		if(cfg.division === 'Clã'){
			subgroupWrapper.style.display = 'none';
			subgroupSelect.innerHTML = '';
			return;
		}

		// CHEFIA → picklist genérico
		if(cfg.division === 'Chefia'){
			subgroupWrapper.style.display = '';
			const options = ['Todos','Alcateia','Tribo de Escoteiros','Tribo de Exploradores','Clã','Chefia'];
			subgroupSelect.innerHTML = options.map(o=>`<option value="${o}">${o}</option>`).join('');
			subgroupSelect.value = 'Todos';
			return;
		}

		// Alcateia e Tribos → normal subgroups
		if(cfg.subgroups.length === 1 && cfg.subgroups[0].name === cfg.division){
			subgroupWrapper.style.display = 'none';
			subgroupSelect.innerHTML = '';
			return;
		}

		subgroupWrapper.style.display = '';
		subgroupSelect.innerHTML = '<option value="Todos">Todos</option>' +
			cfg.subgroups.map(sg => `<option value="${sg.name}">${sg.name}</option>`).join('');
		subgroupSelect.value = 'Todos';
	}

	// render rows (optionally filtered)
	function renderRows(rows, divisionValue){
		tbody.innerHTML = '';
		const frag = document.createDocumentFragment();

		// montar cabeçalho
		const thead = table.querySelector('thead');
		thead.innerHTML = ''; // limpar
		const trHead = document.createElement('tr');
		trHead.innerHTML = `<th scope="col">Divisão</th>` +
			((divisionValue !== 'Clã') ? `<th scope="col">Sub-grupo</th>` : '') +
			`<th scope="col">Nome</th><th scope="col">Número Associativo</th>`;
		thead.appendChild(trHead);

		// montar corpo
		rows.forEach(r=>{
			const tr = document.createElement('tr');
			tr.className = `${r.className} row-link`;
			tr.dataset.href = '../pages/utilizador.html';

			const subgroupCell = (divisionValue === 'Clã') ? '' : `<td>${r.subgroup}</td>`;

			tr.innerHTML = `
				<td>${r.division}</td>
				${subgroupCell}
				<td>${r.name}</td>
				<td>${r.num}</td>
			`;

			frag.appendChild(tr);
		});

		tbody.appendChild(frag);
	}

	// initial view: show first division, populate subgroup and render its first subgroup
	const initialDivision = divisionSelect.value || config[0].division;
	populateSubgroups(initialDivision);

	// by default, select first subgroup (if present) and show members of that subgroup
	const defaultSub = subgroupSelect.options.length ? subgroupSelect.options[0].value : null;
	applyFilters();

	// event handlers
	divisionSelect.addEventListener('change', (e) => {
		populateSubgroups(e.target.value);
		// pick first subgroup if exists
		if(subgroupSelect.options.length) subgroupSelect.selectedIndex = 0;
		divisionSearch.value = '';
		applyFilters();
	});

	subgroupSelect.addEventListener('change', () => {
		divisionSearch.value = '';
		applyFilters();
	});

	divisionSearch.addEventListener('input', () => {
		applyFilters();
	});

	resetBtn.addEventListener('click', () => {
		divisionSelect.value = config[0].division;
		populateSubgroups(divisionSelect.value);
		if(subgroupSelect.options.length) subgroupSelect.selectedIndex = 0;
		divisionSearch.value = '';
		applyFilters();
	});

	// filter by division -> subgroup -> search
	function applyFilters(){
		const div = divisionSelect.value;
		let rows = allRows.filter(r => r.division === div);

		// se o subgrupo estiver visível e não for "Todos", filtra
		if(subgroupWrapper.style.display !== 'none' && subgroupSelect.value && subgroupSelect.value !== 'Todos'){
			rows = rows.filter(r => r.subgroup === subgroupSelect.value);
		}

		const q = divisionSearch.value.trim().toLowerCase();
		if(q){
			rows = rows.filter(r => (r.name.toLowerCase().includes(q) || r.num.toLowerCase().includes(q)));
		}

		renderRows(rows, div);
	}

	// clicking a row -> navigate to utilador page (top level)
	tbody.addEventListener('click', (e) => {
		const tr = e.target.closest('tr');
		if(!tr) return;
		const href = tr.dataset.href || '../pages/utilizador.html';
		window.top.location.href = href;
	});
});

document.addEventListener('DOMContentLoaded', () => {
	const select = document.getElementById('statisticsSelect');
	if (!select) return;
	const sections = Array.from(document.querySelectorAll('.stats-section'));

	function showKey(key){
		sections.forEach(s => s.classList.toggle('active', s.dataset.key === key));
	}

	// default or saved
	try{
		const last = localStorage.getItem('eaep.lastStatistics');
		if(last && [...select.options].some(o=>o.value===last)) select.value = last;
	} catch(e){}

	showKey(select.value);

	select.addEventListener('change', (e) => {
		showKey(e.target.value);
		try{ localStorage.setItem('eaep.lastStatistics', e.target.value); }catch(e){}
	});
});

// Groups list: generate rows, search, sort, reset, row click
document.addEventListener('DOMContentLoaded', () => {
	const section = document.getElementById('groups-section');
	if (!section) return;

	const table = document.getElementById('groupsTable');
	const tbody = table && table.querySelector('tbody');
	const search = document.getElementById('groupsSearch');
	const reset = document.getElementById('resetGroups');
	if(!table || !tbody) return;

	// sample data (fictício)
	const groups = [
		{ id:'ABC', name:'Grupo ABC', elements:69, alcateia:20, tribo_esc:18, tribo_exp:15, cla:8, chefia:8, quotas:'85%' },
		{ id:'DEF', name:'Grupo DEF', elements:52, alcateia:15, tribo_esc:12, tribo_exp:10, cla:7, chefia:8, quotas:'90%' },
		{ id:'GHI', name:'Grupo GHI', elements:40, alcateia:10, tribo_esc:10, tribo_exp:8, cla:6, chefia:6, quotas:'78%' },
		{ id:'JKL', name:'Grupo JKL', elements:83, alcateia:25, tribo_esc:20, tribo_exp:18, cla:10, chefia:10, quotas:'92%' },
		{ id:'MNO', name:'Grupo MNO', elements:33, alcateia:9, tribo_esc:8, tribo_exp:5, cla:3, chefia:8, quotas:'60%' }
	];

	// render helper
	function renderRows(rows){
		tbody.innerHTML = '';
		const frag = document.createDocumentFragment();
		rows.forEach(g=>{
			const tr = document.createElement('tr');
			tr.className = 'row-link';
			tr.dataset.href = `../pages/grupo.html?id=${encodeURIComponent(g.id)}`;
			tr.innerHTML = `
				<td>${g.name}</td>
				<td>${g.elements}</td>
				<td>${g.alcateia}</td>
				<td>${g.tribo_esc}</td>
				<td>${g.tribo_exp}</td>
				<td>${g.cla}</td>
				<td>${g.chefia}</td>
				<td>${g.quotas}</td>
			`;
			frag.appendChild(tr);
		});
		tbody.appendChild(frag);
	}

	// initial render
	renderRows(groups);

	// search
	search.addEventListener('input', () => {
		const q = (search.value || '').trim().toLowerCase();
		const filtered = q ? groups.filter(g => g.name.toLowerCase().includes(q) || g.id.toLowerCase().includes(q)) : groups.slice();
		renderRows(filtered);
	});

	// reset
	reset.addEventListener('click', () => {
		search.value = '';
		renderRows(groups);
	});

	// row click -> navigate
	tbody.addEventListener('click', (e) => {
		const tr = e.target.closest('tr');
		if(!tr) return;
		const href = tr.dataset.href || '../pages/grupo.html';
		window.top.location.href = href;
	});

	// sorting (toggle asc/desc)
	let sortState = {key:null, asc:true};
	Array.from(table.querySelectorAll('th.sortable')).forEach(th => {
		th.style.cursor = 'pointer';
		th.addEventListener('click', () => {
			const key = th.dataset.key;
			if(!key) return;
			sortState.asc = (sortState.key === key) ? !sortState.asc : true;
			sortState.key = key;
			sortBy(key, sortState.asc);
			// update header arrows
			Array.from(table.querySelectorAll('th.sortable')).forEach(h=>{
				h.textContent = h.textContent.replace(/\s*[▾▴]/g,'') + ' ▾';
			});
			th.textContent = th.textContent.replace(/\s*[▾▴]/g,'') + (sortState.asc ? ' ▴' : ' ▾');
		});
	});

	function sortBy(key, asc){
		const current = Array.from(tbody.querySelectorAll('tr')).map(tr=>{
			const cells = tr.children;
			return {
				rowHtml: tr.innerHTML,
				name: cells[0].textContent.trim(),
				elements: Number(cells[1].textContent.trim()) || 0,
				alcateia: Number(cells[2].textContent.trim()) || 0,
				tribo_esc: Number(cells[3].textContent.trim()) || 0,
				tribo_exp: Number(cells[4].textContent.trim()) || 0,
				cla: Number(cells[5].textContent.trim()) || 0,
				chefia: Number(cells[6].textContent.trim()) || 0,
				quotas: cells[7].textContent.trim()
			};
		});

		current.sort((a,b) => {
			let va = a[key], vb = b[key];
			// try numeric compare
			if(typeof va === 'number' && typeof vb === 'number') return asc ? va - vb : vb - va;
			// quotas percent -> numeric
			if(key === 'quotas'){
				const na = parseFloat(va) || 0;
				const nb = parseFloat(vb) || 0;
				return asc ? na - nb : nb - na;
			}
			va = (''+va).toLowerCase(); vb = (''+vb).toLowerCase();
			if(va < vb) return asc ? -1 : 1;
			if(va > vb) return asc ? 1 : -1;
			return 0;
		});

		// rebuild rows
		tbody.innerHTML = '';
		const frag = document.createDocumentFragment();
		current.forEach(c => {
			const tr = document.createElement('tr');
			tr.className = 'row-link';
			// find id from groups array by name (simple)
			const g = groups.find(x => x.name === c.name) || groups[0];
			tr.dataset.href = `../pages/grupo.html?id=${encodeURIComponent(g.id)}`;
			tr.innerHTML = `
				<td>${c.name}</td>
				<td>${c.elements}</td>
				<td>${c.alcateia}</td>
				<td>${c.tribo_esc}</td>
				<td>${c.tribo_exp}</td>
				<td>${c.cla}</td>
				<td>${c.chefia}</td>
				<td>${c.quotas}</td>
			`;
			frag.appendChild(tr);
		});
		tbody.appendChild(frag);
	}
});

document.addEventListener('DOMContentLoaded', () => {
	const select = document.getElementById('adminSelect');
	if (!select) return;
	const sections = Array.from(document.querySelectorAll('.admin-section'));

	function showKey(key){
		sections.forEach(s => s.classList.toggle('active', s.dataset.key === key));
	}

	// restore last option if exists
	try{
		const last = localStorage.getItem('eaep.lastAdmin');
		if(last && [...select.options].some(o=>o.value===last)) select.value = last;
	} catch(e){}

	showKey(select.value);

	select.addEventListener('change', (e) => {
		showKey(e.target.value);
		try{ localStorage.setItem('eaep.lastAdmin', e.target.value); }catch(e){}
	});
});

document.addEventListener('DOMContentLoaded', () => {
	const sel = document.getElementById('statsRegionSelect');
	if (!sel) return;
	const sections = Array.from(document.querySelectorAll('.stats-region-section'));

	function showKey(key){
		sections.forEach(s => s.classList.toggle('active', s.dataset.key === key));
	}

	// restore last used
	try{
		const last = localStorage.getItem('eaep.lastStatsRegion');
		if(last && [...sel.options].some(o=>o.value===last)) sel.value = last;
	} catch(e){}

	showKey(sel.value);

	sel.addEventListener('change', (e) => {
		showKey(e.target.value);
		try{ localStorage.setItem('eaep.lastStatsRegion', e.target.value); }catch(e){}
	});
});

document.addEventListener('DOMContentLoaded', () => {

	/* =========================
	   STOCK / BALANÇO SWITCH
	========================= */

	const sel = document.getElementById('stockBalSelect');
	const sections = document.querySelectorAll('.stats-region-section');

	if(sel && sections.length){
		function showSection(key){
			sections.forEach(s =>
				s.classList.toggle('active', s.dataset.key === key)
			);
		}

		// restore last
		try{
			const last = localStorage.getItem('eaep.lastStockView');
			if(last && [...sel.options].some(o => o.value === last)){
				sel.value = last;
			}
		}catch(e){}

		showSection(sel.value);

		sel.addEventListener('change', e => {
			showSection(e.target.value);
			try{
				localStorage.setItem('eaep.lastStockView', e.target.value);
			}catch(e){}
		});
	}

	/* =========================
	   STOCK TABLE
	========================= */

	const stockTable = document.getElementById('stockTable');
	if(!stockTable) return;

	const stockTbody = stockTable.querySelector('tbody');
	const catFilter = document.getElementById('stockCategory');
	const stockSearch = document.getElementById('stockSearch');
	const stockReset = document.getElementById('stockReset');

	const stockItems = [
		{category:'Campismo', name:'Tenda 4P', price:85.00, qty:10},
		{category:'Campismo', name:'Colchão Isolante', price:18.50, qty:30},
		{category:'Cozinha', name:'Fogareiro Portátil', price:39.90, qty:6},
		{category:'Iluminação', name:'Lanterna LED', price:12.00, qty:20},
		{category:'Escalada', name:'Corda 9mm (10m)', price:59.00, qty:8},
		{category:'Uniformes', name:'Camisa Escoteiros', price:22.00, qty:45},
		{category:'Uniformes', name:'Gorro Oficial', price:9.50, qty:25},
		{category:'Distintivos', name:'Distintivo Alcateia', price:1.20, qty:200},
		{category:'Publicações', name:'Caderno de Progresso', price:3.50, qty:120},
		{category:'Promocional', name:'Caneca Escoteiros', price:7.00, qty:40},
		{category:'Orientação', name:'Bússola Básica', price:6.80, qty:50}
	];

	function formatCurrency(v){
		return v.toLocaleString('pt-PT', {style:'currency', currency:'EUR'});
	}

	function renderStock(rows){
		stockTbody.innerHTML = '';
		rows.forEach(it => {
			const tr = document.createElement('tr');
			tr.innerHTML = `
				<td>${it.category}</td>
				<td>${it.name}</td>
				<td>${formatCurrency(it.price)}</td>
				<td>${it.qty}</td>
			`;
			stockTbody.appendChild(tr);
		});
	}

	renderStock(stockItems);

	function applyFilters(){
		let rows = [...stockItems];
		const cat = catFilter?.value || 'all';
		const q = stockSearch?.value.toLowerCase().trim() || '';

		if(cat !== 'all'){
			rows = rows.filter(r => r.category === cat);
		}
		if(q){
			rows = rows.filter(r =>
				r.name.toLowerCase().includes(q) ||
				formatCurrency(r.price).toLowerCase().includes(q)
			);
		}
		renderStock(rows);
	}

	catFilter?.addEventListener('change', applyFilters);
	stockSearch?.addEventListener('input', applyFilters);
	stockReset?.addEventListener('click', () => {
		catFilter.value = 'all';
		stockSearch.value = '';
		renderStock(stockItems);
	});

	/* =========================
	   SORTING
	========================= */

	let sort = {key:null, asc:true};

	stockTable.querySelectorAll('th.sortable').forEach(th => {
		th.addEventListener('click', () => {
			const key = th.dataset.key;
			sort.asc = (sort.key === key) ? !sort.asc : true;
			sort.key = key;

			let rows = [...stockItems];
			if(catFilter?.value !== 'all'){
				rows = rows.filter(r => r.category === catFilter.value);
			}

			rows.sort((a,b) => {
				if(typeof a[key] === 'number'){
					return sort.asc ? a[key]-b[key] : b[key]-a[key];
				}
				return sort.asc
					? a[key].localeCompare(b[key])
					: b[key].localeCompare(a[key]);
			});

			renderStock(rows);
		});
	});

});

// Gestão SMU (scoped) — inclui Stock SMU funcional (ids prefixados com gestao_)
document.addEventListener('DOMContentLoaded', () => {
	const root = document.getElementById('gestao-smu-section');
	if(!root) return;

	// picklist to switch sub-sections
	const sel = root.querySelector('#gestaoSelect');
	const sections = Array.from(root.querySelectorAll('.gestao-section'));
	function show(key){
		sections.forEach(s => s.classList.toggle('active', s.dataset.key === key));
	}
	// initial
	if(sel){
		try{
			const last = localStorage.getItem('eaep.lastGestaoSMU');
			if(last && [...sel.options].some(o=>o.value===last)) sel.value = last;
		}catch(e){}
		show(sel.value);
		sel.addEventListener('change', (e) => {
			show(e.target.value);
			try{ localStorage.setItem('eaep.lastGestaoSMU', e.target.value); }catch(e){}
		});
	}

	/* ===== Stock (scoped to gestao_) ===== */
	const stockTable = root.querySelector('#gestao_stockTable');
	if(!stockTable) return;

	const stockTbody = stockTable.querySelector('tbody');
	const catFilter = root.querySelector('#gestao_stockCategory');
	const stockSearch = root.querySelector('#gestao_stockSearch');
	const stockReset = root.querySelector('#gestao_stockReset');

	const stockItems = [
		{category:'Campismo', name:'Tenda 4P', price:85.00, qty:10},
		{category:'Campismo', name:'Colchão Isolante', price:18.50, qty:30},
		{category:'Cozinha', name:'Fogareiro Portátil', price:39.90, qty:6},
		{category:'Iluminação', name:'Lanterna LED', price:12.00, qty:20},
		{category:'Escalada', name:'Corda 9mm (10m)', price:59.00, qty:8},
		{category:'Uniformes', name:'Camisa Escoteiros', price:22.00, qty:45},
		{category:'Uniformes', name:'Gorro Oficial', price:9.50, qty:25},
		{category:'Distintivos', name:'Distintivo Alcateia', price:1.20, qty:200},
		{category:'Publicações', name:'Caderno de Progresso', price:3.50, qty:120},
		{category:'Promocional', name:'Caneca Escoteiros', price:7.00, qty:40},
		{category:'Orientação', name:'Bússola Básica', price:6.80, qty:50}
	];

	function formatCurrency(v){
		return v.toLocaleString('pt-PT', {style:'currency', currency:'EUR'});
	}

	function renderStock(rows){
		stockTbody.innerHTML = '';
		const frag = document.createDocumentFragment();
		rows.forEach(it => {
			const tr = document.createElement('tr');
			tr.className = 'row-link';
			tr.innerHTML = `
				<td>${it.category}</td>
				<td>${it.name}</td>
				<td>${formatCurrency(it.price)}</td>
				<td>${it.qty}</td>
			`;
			frag.appendChild(tr);
		});
		stockTbody.appendChild(frag);
	}

	// initial render
	renderStock(stockItems);

	function applyStockFilters(){
		let rows = stockItems.slice();
		const cat = (catFilter?.value || 'all');
		const q = (stockSearch?.value || '').trim().toLowerCase();

		if(cat !== 'all'){
			rows = rows.filter(r => r.category === cat);
		}
		if(q){
			rows = rows.filter(r => (r.name.toLowerCase().includes(q) || formatCurrency(r.price).toLowerCase().includes(q)));
		}
		renderStock(rows);
	}

	catFilter?.addEventListener('change', applyStockFilters);
	stockSearch?.addEventListener('input', applyStockFilters);
	stockReset?.addEventListener('click', () => {
		if(catFilter) catFilter.value = 'all';
		if(stockSearch) stockSearch.value = '';
		renderStock(stockItems);
	});

	// sorting (columns with .sortable)
	let sortState = {key:null, asc:true};
	Array.from(stockTable.querySelectorAll('th.sortable')).forEach(th => {
		th.style.cursor = 'pointer';
		th.addEventListener('click', () => {
			const key = th.dataset.key;
			if(!key) return;
			sortState.asc = (sortState.key === key) ? !sortState.asc : true;
			sortState.key = key;

			// get filtered rows before sorting
			let rows = stockItems.slice();
			const cat = (catFilter?.value || 'all');
			const q = (stockSearch?.value || '').trim().toLowerCase();
			if(cat !== 'all') rows = rows.filter(r => r.category === cat);
			if(q) rows = rows.filter(r => (r.name.toLowerCase().includes(q) || formatCurrency(r.price).toLowerCase().includes(q)));

			rows.sort((a,b) => {
				let va = a[key], vb = b[key];
				if(key === 'price' || key === 'qty'){
					return sortState.asc ? (va - vb) : (vb - va);
				}
				va = (''+va).toLowerCase(); vb = (''+vb).toLowerCase();
				if(va < vb) return sortState.asc ? -1 : 1;
				if(va > vb) return sortState.asc ? 1 : -1;
				return 0;
			});

			// update headers arrows (visual)
			Array.from(stockTable.querySelectorAll('th.sortable')).forEach(h=>{
				h.textContent = h.textContent.replace(/\s*[▾▴]/g,'') + ' ▾';
			});
			th.textContent = th.textContent.replace(/\s*[▾▴]/g,'') + (sortState.asc ? ' ▴' : ' ▾');

			renderStock(rows);
		});
	});
});

// Censos (Nacional) — tabela gerada, filtro, pesquisa, sort, rows clicáveis
document.addEventListener('DOMContentLoaded', () => {
	const root = document.getElementById('censos-section');
	if(!root) return;

	const table = root.querySelector('#censosTable');
	const tbody = table.querySelector('tbody');
	const regionFilter = root.querySelector('#censosRegion');
	const search = root.querySelector('#censosSearch');
	const reset = root.querySelector('#censosReset');

	// config / dados fictícios
	const QUOTA = 20.00; // valor por elemento (exemplo)
	const groups = [
		{id:'ABC', name:'Grupo ABC', region:'Lisboa e Vale do Tejo', elements:69, paidPercent: 85},
		{id:'DEF', name:'Grupo DEF', region:'Norte', elements:52, paidPercent: 90},
		{id:'GHI', name:'Grupo GHI', region:'Centro', elements:40, paidPercent: 78},
		{id:'JKL', name:'Grupo JKL', region:'Além do Tejo', elements:83, paidPercent: 92},
		{id:'MNO', name:'Grupo MNO', region:'Algarve', elements:33, paidPercent: 60},
		{id:'PQR', name:'Grupo PQR', region:'Açores Oriental', elements:28, paidPercent: 72},
		{id:'STU', name:'Grupo STU', region:'Madeira', elements:24, paidPercent: 66},
		{id:'VWX', name:'Grupo VWX', region:'Norte', elements:47, paidPercent: 88},
		{id:'YZA', name:'Grupo YZA', region:'Lisboa e Vale do Tejo', elements:55, paidPercent: 81},
		{id:'BCD', name:'Grupo BCD', region:'Outros', elements:38, paidPercent: 74}
	];

	// helper: compute due count and totals
	function compute(g){
		const paid = Number(g.paidPercent) || 0;
		const due = Math.round(g.elements * (1 - paid/100));
		const totalExpected = Number((g.elements * QUOTA).toFixed(2));
		return Object.assign({}, g, {due, total: totalExpected});
	}

	const data = groups.map(compute);

	function formatCurrency(v){
		return v.toLocaleString('pt-PT', {style:'currency', currency:'EUR'});
	}

	// render rows
	function render(rows){
		tbody.innerHTML = '';
		const frag = document.createDocumentFragment();
		rows.forEach(r => {
			const tr = document.createElement('tr');
			tr.className = 'row-link';
			tr.dataset.href = `../pages/grupo.html?id=${encodeURIComponent(r.id)}`;

			// paid percent with small bar
			const paidHtml = `
				<div class="paid-wrap">
					<div class="paid-bar" aria-hidden>
						<div class="paid-fill" style="width:${Math.min(100,Math.max(0,r.paidPercent))}%;"></div>
					</div>
					<div class="small">${r.paidPercent}%</div>
				</div>
			`;

			tr.innerHTML = `
				<td>${r.name}</td>
				<td>${r.region}</td>
				<td>${paidHtml}</td>
				<td data-type="num">${r.elements}</td>
				<td data-type="num">${r.due}</td>
				<td data-type="currency">${formatCurrency(r.total)}</td>
			`;
			frag.appendChild(tr);
		});
		tbody.appendChild(frag);
	}

	// initial render
	render(data);

	// filter + search
	function applyFilters(){
		let rows = data.slice();
		const region = regionFilter.value || 'all';
		const q = (search.value || '').trim().toLowerCase();

		if(region !== 'all'){
			rows = rows.filter(r => r.region === region);
		}
		if(q){
			rows = rows.filter(r =>
				r.name.toLowerCase().includes(q) ||
				r.region.toLowerCase().includes(q) ||
				(String(r.elements)).includes(q)
			);
		}
		render(rows);
	}

	regionFilter.addEventListener('change', applyFilters);
	search.addEventListener('input', applyFilters);
	reset.addEventListener('click', () => {
		regionFilter.value = 'all';
		search.value = '';
		render(data);
	});

	// sorting
	let sortState = {key:null, asc:true};
	Array.from(table.querySelectorAll('th.sortable')).forEach(th => {
		th.style.cursor = 'pointer';
		th.addEventListener('click', () => {
			const key = th.dataset.key;
			if(!key) return;

			sortState.asc = (sortState.key === key) ? !sortState.asc : true;
			sortState.key = key;

			const currentRows = Array.from(tbody.querySelectorAll('tr')).map(tr => {
				const cells = tr.children;
				return {
					html: tr.innerHTML,
					name: cells[0].textContent.trim(),
					region: cells[1].textContent.trim(),
					paidPercent: parseFloat(cells[2].querySelector('.small')?.textContent || '0'),
					elements: parseInt(cells[3].textContent.trim()) || 0,
					due: parseInt(cells[4].textContent.trim()) || 0,
					total: parseFloat(cells[5].textContent.replace(/[^\d,-]/g,'').replace(',','.')) || 0
				};
			});

			currentRows.sort((a,b) => {
				let va = a[key], vb = b[key];
				// numeric comparisons
				if(typeof va === 'number' && typeof vb === 'number') return sortState.asc ? va - vb : vb - va;
				va = (''+va).toLowerCase(); vb = (''+vb).toLowerCase();
				if(va < vb) return sortState.asc ? -1 : 1;
				if(va > vb) return sortState.asc ? 1 : -1;
				return 0;
			});

			// re-render sorted
			tbody.innerHTML = '';
			const frag = document.createDocumentFragment();
			currentRows.forEach(c => {
				const tr = document.createElement('tr');
				tr.className = 'row-link';
				// find original id by name
				const orig = data.find(d => d.name === c.name) || data[0];
				tr.dataset.href = `../pages/grupo.html?id=${encodeURIComponent(orig.id)}`;

				tr.innerHTML = `
					<td>${c.name}</td>
					<td>${c.region}</td>
					<td>
						<div class="paid-wrap">
							<div class="paid-bar"><div class="paid-fill" style="width:${c.paidPercent}%;"></div></div>
							<div class="small">${c.paidPercent}%</div>
						</div>
					</td>
					<td data-type="num">${c.elements}</td>
					<td data-type="num">${c.due}</td>
					<td data-type="currency">${formatCurrency(c.total)}</td>
				`;
				frag.appendChild(tr);
			});
			tbody.appendChild(frag);

			// update header arrows
			Array.from(table.querySelectorAll('th.sortable')).forEach(h=>{
				h.textContent = h.textContent.replace(/\s*[▾▴]/g,'') + ' ▾';
			});
			th.textContent = th.textContent.replace(/\s*[▾▴]/g,'') + (sortState.asc ? ' ▴' : ' ▾');
		});
	});

	// row click -> navigate
	tbody.addEventListener('click', (e) => {
		const tr = e.target.closest('tr');
		if(!tr) return;
		const href = tr.dataset.href || '../pages/grupo.html';
		window.top.location.href = href;
	});
});

// Censos (por grupo) — sem região, filtrar por divisão, três painéis
document.addEventListener('DOMContentLoaded', () => {
	const root = document.getElementById('group-censos-root');
	if(!root) return;

	/* ---------- tabs ---------- */
	root.querySelectorAll('.hmenu .hbtn').forEach(btn => {
		btn.addEventListener('click', () => {
			// activate button
			root.querySelectorAll('.hmenu .hbtn').forEach(b=>b.classList.remove('active'));
			btn.classList.add('active');
			// panels
			const panel = btn.dataset.panel;
			root.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === panel));
		});
	});

	/* ---------- sample data (fictício) ---------- */
	// master sample for panel A
	const sample = [
		{division:'Alcateia', name:'Miguel Rocha', num:'10001', paid:true, regc:''},
		{division:'Alcateia', name:'Mariana Alves', num:'10002', paid:false, regc:''},
		{division:'Alcateia', name:'Tiago Costa', num:'10003', paid:true, regc:''},
		{division:'Alcateia', name:'Beatriz Lima', num:'10015', paid:false, regc:''},
		{division:'Tribo de Escoteiros', name:'Sofia Ferreira', num:'10004', paid:true, regc:''},
		{division:'Tribo de Escoteiros', name:'Rui Mendes', num:'10005', paid:false, regc:''},
		{division:'Tribo de Escoteiros', name:'Inês Teixeira', num:'10006', paid:true, regc:''},
		{division:'Tribo de Escoteiros', name:'Duarte Faria', num:'10016', paid:true, regc:''},
		{division:'Tribo de Exploradores', name:'Pedro Gomes', num:'10007', paid:true, regc:''},
		{division:'Tribo de Exploradores', name:'Ana Pereira', num:'10008', paid:false, regc:''},
		{division:'Tribo de Exploradores', name:'Bruno Costa', num:'10009', paid:true, regc:''},
		{division:'Clã', name:'Helena Sousa', num:'10010', paid:true, regc:false},
		{division:'Clã', name:'Carlos Nunes', num:'10011', paid:false, regc:false},
		{division:'Chefia', name:'João Silva', num:'10012', paid:true, regc:true},
		{division:'Chefia', name:'Ana Martins', num:'10013', paid:false, regc:false},
		{division:'Chefia', name:'Paulo Ribeiro', num:'10014', paid:true, regc:true}
	];

	// panel B: elements from last year (some already enrolled)
	const lastYear = sample.slice(0,12).map((s,i) => {
		return Object.assign({}, s, {paid:true, enrolled: (i % 3 === 0)}); // some enrolled true
	});

	// panel C: inactive (paid false, all not enrolled)
	const inactive = sample.slice(4,14).map(s => Object.assign({}, s, {paid:false, enrolled:false}));

	/* ---------- controls ---------- */
	const divisionSelect = root.querySelector('#gc_divisionFilter');
	const searchInput = root.querySelector('#gc_search');
	const resetBtn = root.querySelector('#gc_reset');

	/* ---------- helpers ---------- */
	function rowClassFor(div){
		switch(div){
			case 'Alcateia': return 'row-alcateia';
			case 'Tribo de Escoteiros': return 'row-tribo-escoteiros';
			case 'Tribo de Exploradores': return 'row-tribo-exploradores';
			case 'Clã': return 'row-cla';
			case 'Chefia': return 'row-chefia';
			default: return '';
		}
	}

	function applyTextFilter(rows){
		const q = (searchInput.value || '').trim().toLowerCase();
		if(!q) return rows;
		return rows.filter(r => r.name.toLowerCase().includes(q) || r.num.toLowerCase().includes(q));
	}

	function filterByDivision(rows){
		const div = divisionSelect.value || 'all';
		if(div === 'all') return rows.slice();
		return rows.filter(r => r.division === div);
	}

	/* ---------- renderers ---------- */
	function renderTableA(rows){
		const tbody = root.querySelector('#gc_table_a tbody');
		tbody.innerHTML = '';
		const frag = document.createDocumentFragment();
		rows.forEach(r => {
			const tr = document.createElement('tr');
			tr.className = rowClassFor(r.division) + ' row-link';
			// paid pill
			const paidCell = r.paid ? '<span class="pill-yes">Sim</span>' : '<span class="pill-no">Não</span>';
			// registo criminal only for Chefia
			const regc = (r.division === 'Chefia') ? (r.regc ? 'Sim' : 'Não') : '';
			tr.innerHTML = `
				<td>${r.division}</td>
				<td>${r.name}</td>
				<td>${r.num}</td>
				<td>${paidCell}</td>
				<td>${regc}</td>
			`;
			frag.appendChild(tr);
		});
		tbody.appendChild(frag);
	}

	function renderTableB(rows){
		const tbody = root.querySelector('#gc_table_b tbody');
		tbody.innerHTML = '';
		const frag = document.createDocumentFragment();
		rows.forEach(r => {
			const tr = document.createElement('tr');
			tr.className = rowClassFor(r.division) + ' row-link';
			const btn = r.enrolled
				? `<button class="gc-btn disabled" disabled>Inscrito</button>`
				: `<button class="gc-btn primary" data-action="inscrever">Inscrever</button>`;
			const paidCell = r.paid ? '<span class="pill-yes">Sim</span>' : '<span class="pill-no">Não</span>';
			tr.innerHTML = `
				<td>${r.division}</td>
				<td>${r.name}</td>
				<td>${r.num}</td>
				<td>${paidCell}</td>
				<td>${btn}</td>
			`;
			frag.appendChild(tr);
		});
		tbody.appendChild(frag);
	}

	function renderTableC(rows){
		const tbody = root.querySelector('#gc_table_c tbody');
		tbody.innerHTML = '';
		const frag = document.createDocumentFragment();
		rows.forEach(r => {
			const tr = document.createElement('tr');
			tr.className = rowClassFor(r.division) + ' row-link';
			const btn = `<button class="gc-btn primary" data-action="inscrever">Inscrever</button>`;
			const paidCell = r.paid ? '<span class="pill-yes">Sim</span>' : '<span class="pill-no">Não</span>';
			tr.innerHTML = `
				<td>${r.division}</td>
				<td>${r.name}</td>
				<td>${r.num}</td>
				<td>${paidCell}</td>
				<td>${btn}</td>
			`;
			frag.appendChild(tr);
		});
		tbody.appendChild(frag);
	}

	/* ---------- filtering + sorting ---------- */
	// sort state per panel
	let sortStateA = {key:null, asc:true};
	let sortStateB = {key:null, asc:true};
	let sortStateC = {key:null, asc:true};

	function sortRows(rows, key, asc){
		if(!key) return rows;
		return rows.slice().sort((a,b) => {
			let va = a[key], vb = b[key];
			if(key === 'paid'){
				va = a.paid ? 1 : 0;
				vb = b.paid ? 1 : 0;
				return asc ? va - vb : vb - va;
			}
			// numeric-like for num: compare as string safe
			if(typeof va === 'number' && typeof vb === 'number') return asc ? va - vb : vb - va;
			va = (''+va).toLowerCase();
			vb = (''+vb).toLowerCase();
			if(va < vb) return asc ? -1 : 1;
			if(va > vb) return asc ? 1 : -1;
			return 0;
		});
	}

	function applyA(){
		let rows = filterByDivision(sample);
		rows = applyTextFilter(rows);
		rows = sortRows(rows, sortStateA.key, sortStateA.asc);
		renderTableA(rows);
	}
	function applyB(){
		let rows = filterByDivision(lastYear);
		rows = applyTextFilter(rows);
		rows = sortRows(rows, sortStateB.key, sortStateB.asc);
		renderTableB(rows);
	}
	function applyC(){
		let rows = filterByDivision(inactive);
		rows = applyTextFilter(rows);
		rows = sortRows(rows, sortStateC.key, sortStateC.asc);
		renderTableC(rows);
	}

	// initial render
	applyA(); applyB(); applyC();

	// controls
	divisionSelect.addEventListener('change', () => { applyA(); applyB(); applyC(); });
	searchInput.addEventListener('input', () => { applyA(); applyB(); applyC(); });
	resetBtn.addEventListener('click', () => {
		divisionSelect.value = 'all';
		searchInput.value = '';
		applyA(); applyB(); applyC();
	});

	// attach sorting for each table
	function attachSorting(tableSelector, sortStateRef, applyFn){
		const tableEl = root.querySelector(tableSelector);
		if(!tableEl) return;
		Array.from(tableEl.querySelectorAll('th.sortable')).forEach(th => {
			th.style.cursor = 'pointer';
			th.addEventListener('click', () => {
				const key = th.dataset.key;
				if(!key) return;
				sortStateRef.asc = (sortStateRef.key === key) ? !sortStateRef.asc : true;
				sortStateRef.key = key;

				// reset arrows for this table only
				Array.from(tableEl.querySelectorAll('th.sortable')).forEach(h => {
					h.textContent = h.textContent.replace(/\s*[▾▴]/g,'') + ' ▾';
				});
				th.textContent = th.textContent.replace(/\s*[▾▴]/g,'') + (sortStateRef.asc ? ' ▴' : ' ▾');

				applyFn();
			});
		});
	}
	attachSorting('#gc_table_a', sortStateA, applyA);
	attachSorting('#gc_table_b', sortStateB, applyB);
	attachSorting('#gc_table_c', sortStateC, applyC);

	/* ---------- Inscrever button actions (delegated) ---------- */
	// panel B and C
	[root.querySelector('#gc_table_b tbody'), root.querySelector('#gc_table_c tbody')].forEach(tbodyEl => {
		if(!tbodyEl) return;
		tbodyEl.addEventListener('click', (e) => {
			const btn = e.target.closest('button[data-action="inscrever"]');
			if(!btn) return;
			// disable and show Inscrito
			btn.textContent = 'Inscrito';
			btn.classList.remove('primary');
			btn.classList.add('disabled');
			btn.disabled = true;
			// update underlying arrays where relevant
			const tr = btn.closest('tr');
			const num = tr.children[2]?.textContent?.trim();
			if(num){
				[lastYear, inactive].forEach(arr => {
					const item = arr.find(x => x.num === num);
					if(item) item.enrolled = true;
				});
			}
		});
	});

	// If you want clicking a row to go to the user page, uncomment the lines below:
	[root.querySelector('#gc_table_a tbody'), root.querySelector('#gc_table_b tbody'), root.querySelector('#gc_table_c tbody')].forEach(tb => {
		if(!tb) return;
		tb.addEventListener('click', (e) => {
			const tr = e.target.closest('tr');
			if(!tr) return;
			if(e.target.closest('button')) return;
			window.top.location.href = '../pages/utilizador.html';
		});
	});
});

// Campos Escotistas — tabs + small UX for forms (multi-page safe)
document.addEventListener('DOMContentLoaded', () => {
	const root = document.getElementById('campos-escotistas-root');
	if(!root) return;

	// tabs
	root.querySelectorAll('.hmenu .hbtn').forEach(btn => {
		btn.addEventListener('click', () => {
			root.querySelectorAll('.hmenu .hbtn').forEach(b=>b.classList.remove('active'));
			btn.classList.add('active');
			const panel = btn.dataset.panel;
			root.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === panel));
		});
	});

	// reserva: calculate total participants
	const formReservar = root.querySelector('#form-reservar');
	if(formReservar){
		const inputs = ['p_lobitos','p_escoteiros','p_exploradores','p_caminheiros','p_adultos'];
		function updateTotal(){
			let total = 0;
			inputs.forEach(name => {
				const el = formReservar.querySelector(`[name="${name}"]`);
				if(el) total += Number(el.value || 0);
			});
			const totalEl = formReservar.querySelector('#p_total');
			if(totalEl) totalEl.value = total;
		}
		inputs.forEach(name => {
			const el = formReservar.querySelector(`[name="${name}"]`);
			if(el) el.addEventListener('input', updateTotal);
		});
		formReservar.addEventListener('submit', (e) => {
			e.preventDefault();
			const data = new FormData(formReservar);
			const summary = {};
			for(const [k,v] of data.entries()) summary[k] = v;
			console.log('Reserva submetida (mock):', summary);
			alert('Reserva submetida (mock). Ver consola para dados.');
			formReservar.reset();
			updateTotal();
		});
	}

	// inscrever form
	const formInscrever = root.querySelector('#form-inscrever');
	if(formInscrever){
		formInscrever.addEventListener('submit', (e) => {
			e.preventDefault();
			const data = Object.fromEntries(new FormData(formInscrever).entries());
			console.log('Inscrição submetida (mock):', data);
			alert('Inscrição submetida (mock). Ver consola para dados.');
			formInscrever.reset();
		});
	}

	// optional: make menu anchors no-op but smooth scroll to panel area
	root.querySelectorAll('a[href^="#"]').forEach(a => {
		a.addEventListener('click', (e) => {
			e.preventDefault();
			const id = a.getAttribute('href').slice(1);
			// open a small fragment in the panel (placeholder behaviour)
			alert('Menu: ' + a.textContent + ' (conteúdo será adicionado)');
		});
	});
});

document.addEventListener('DOMContentLoaded', () => {

	function bindPicklist(selectId, sectionClass){
		const sel = document.getElementById(selectId);
		if(!sel) return;

		const sections = document.querySelectorAll(`.${sectionClass}`);

		function show(key){
			sections.forEach(s =>
				s.classList.toggle('active', s.dataset.key === key)
			);
		}

		show(sel.value);
		sel.addEventListener('change', e => show(e.target.value));
	}

	bindPicklist('parqueSelect', 'parque-section');
	bindPicklist('camposSelect', 'campos-section');

});

