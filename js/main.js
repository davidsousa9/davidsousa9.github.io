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
			tr.dataset.href = 'pages/utilizador.html';

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
		const href = tr.dataset.href || 'pages/utilizador.html';
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
