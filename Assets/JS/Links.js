import { loadHeaderFooter, HF_main, setText } from "./HeaderFooter.js";
import { loadBranch } from "./OpenJsons.js";

const normalizeText = (value) => String(value || "").trim();

function renderLinks(linksData){
	const page = linksData || {};
	setText(document.querySelector("[data-links-title]"), page.title || "Links");
	const host = document.querySelector("[data-links-sections]");
	if(!host) return;
	host.innerHTML = "";

	for(const sec of (page.sections || [])){
		const card = document.createElement("div");
		card.className = "card";
		const h2 = document.createElement("h2");
		h2.className = "links-section-title";
		h2.textContent = sec.title || "";
		card.appendChild(h2);

		const list = document.createElement("div");
		list.className = "list";
		const sortedLinks = [...(sec.links || [])].sort((a,b)=>{
			const nameA = normalizeText(a?.label).toLowerCase();
			const nameB = normalizeText(b?.label).toLowerCase();

			const aComingSoon = nameA.includes("coming soon");
			const bComingSoon = nameB.includes("coming soon");

			if(aComingSoon && !bComingSoon) return 1;
			if(!aComingSoon && bComingSoon) return -1;

			return nameA.localeCompare(nameB);
		});

		for(const l of sortedLinks){
			const labelText = normalizeText(l?.label);
			const isComingSoon = labelText.toLowerCase().includes("coming soon");
			const a = document.createElement("a");

			a.textContent = `- ${labelText}`;
			a.href = l.href || "#";

			if(isComingSoon){
				a.className = "links-item links-item-coming-soon";
				a.removeAttribute("href");
			}else{
				a.className = "links-item";
				if(l.href){
					a.target = "_blank";
					a.rel = "noopener";
				}
			}

			list.appendChild(a);
		}
		card.appendChild(list);
		host.appendChild(card);
	}
}

async function main() {
	await loadHeaderFooter();
	await HF_main();

	const linksData = await loadBranch("Links");

	renderLinks(linksData);

	if (window.location.hash) {
		const target = document.querySelector(window.location.hash);
		if (target) {
			target.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}
}

main().catch(err=>{
	console.error(err);
	document.body.innerHTML = `<div class="container"><h1>Site failed to load</h1><p>${err.message}</p></div>`;
});
