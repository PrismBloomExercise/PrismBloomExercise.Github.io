function getSiteBase(){
	const path = window.location.pathname;
	const marker = "/PrismBloomExercise/";
	const index = path.indexOf(marker);

	if(index >= 0){
		return path.slice(0, index + marker.length - 1);
	}

	return "";
}

async function loadJson(path){
	const res = await fetch(path, { cache: "no-store" });
	console.log("Loaded Status:", res.status, path);

	if(!res.ok){
		throw new Error(`Failed to load ${path} (${res.status})`);
	}

	return await res.json();
}

export async function loadBranch(json){
	let fileName = String(json || "").trim();

	if(!fileName){
		throw new Error("No json file name was provided.");
	}

	if(!fileName.toLowerCase().endsWith(".json")){
		fileName += ".json";
	}

	const base = getSiteBase();
	const paths = [
		`${base}/Assets/Json/${fileName}`,
		`/PrismBloomExercise/Assets/Json/${fileName}`,
		`/Assets/Json/${fileName}`,
		`/assets/json/${fileName}`
	];

	let lastError = null;

	for(const path of [...new Set(paths)]){
		try{
			return await loadJson(path);
		}catch(err){
			lastError = err;
		}
	}

	throw lastError;
}
