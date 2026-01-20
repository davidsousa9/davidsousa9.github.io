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
