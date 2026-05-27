import { loadHeaderFooter, HF_main, setText } from "./HeaderFooter.js";
import { loadBranch } from "./OpenJsons.js";
import { renderHome } from "./RenderHome.js";


async function main(){
	await loadHeaderFooter();
	const { settings } = await HF_main();
	const indexData = await loadBranch("Index");

	renderHome(indexData, settings);

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
