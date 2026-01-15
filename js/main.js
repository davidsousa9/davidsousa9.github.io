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
