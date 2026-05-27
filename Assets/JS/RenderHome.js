import { setText } from "./HeaderFooter.js";

function setupHeadshotModal(src){
	const modal = document.querySelector("[data-img-modal]");
	const modalImg = document.querySelector("[data-img-modal-content]");
	const closeBtn = document.querySelector("[data-img-modal-close]");
	const trigger = document.querySelector("[data-hero-headshot-link]");

	if(!modal || !modalImg || !closeBtn || !trigger){
		return;
	}

	trigger.addEventListener("click", ()=>{
		modalImg.src = src;
		modal.hidden = false;
	});

	closeBtn.addEventListener("click", ()=>{
		modal.hidden = true;
		modalImg.src = "";
	});

	modal.addEventListener("click", (e)=>{
		if(e.target === modal){
			modal.hidden = true;
			modalImg.src = "";
		}
	});
}

function renderHeroHeadshot(settings){
	const headshotImg = document.querySelector("[data-hero-headshot]");
	const headshotSrc = settings.brand?.logo || "";

	if(!headshotImg || !headshotSrc){
		return;
	}

	headshotImg.src = headshotSrc;
	headshotImg.alt = `${settings.brand?.title || "Profile"} headshot`;

	setupHeadshotModal(headshotSrc);
}


export function renderHome(indexData, settings){
	const page = indexData || {};
	const heroBg = document.querySelector("[data-hero-bg]");
	if(heroBg && settings.brand?.background){
		heroBg.style.backgroundImage = `url("${settings.brand.background}")`;
	}
	
	renderHeroHeadshot(settings);
	
	setText(document.querySelector("[data-hero-headline]"), page.hero?.headline || "");
	const heroBody = document.querySelector("[data-hero-body]");
	if(heroBody){
		heroBody.innerHTML = "";
		for(const p of (page.hero?.body || [])){
			if(!p.trim()){
				const spacer = document.createElement("div");
				spacer.style.height = "12px";
				heroBody.appendChild(spacer);
				continue;
			}

			const el = document.createElement("p");
			el.textContent = p;
			heroBody.appendChild(el);
		}
	}

	const dynamicSections = document.querySelector("[data-dynamic-sections]");
	if(dynamicSections){
		dynamicSections.innerHTML = "";

		for(const section of (page.sections || [])){
			const card = document.createElement("div");
			card.className = "card";

			if(section.id){
				card.id = section.id;
			}

			const title = document.createElement("h2");
			title.textContent = section.title || "";
			card.appendChild(title);

			const body = document.createElement("div");

			for(const p of (section.body || [])){
				if(!p.trim()){
					const spacer = document.createElement("div");
					spacer.style.height = "12px";
					body.appendChild(spacer);
					continue;
				}

				const el = document.createElement("p");
				el.textContent = p;
				body.appendChild(el);
			}

			card.appendChild(body);
			dynamicSections.appendChild(card);
		}
	}

}
