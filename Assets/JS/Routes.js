import { loadHeaderFooter, HF_main } from "./HeaderFooter.js";
import { loadBranch } from "./OpenJsons.js";

let allRoutes = [];
let zipCenter = null;
let routesConfig = {};
const ROUTES_PAGE_VERSION = "20260527-merged-search-zip";
console.info("Routes page loaded", ROUTES_PAGE_VERSION);

function normalizeText(value){
	return String(value || "").trim();
}

function normalizeSearch(value){
	return normalizeText(value).toLowerCase();
}

function getZipFromSearch(value){
	const cleanValue = normalizeText(value).replace(/\D/g, "");

	return cleanValue.length === 5 ? cleanValue : "";
}

function getFirstValue(object, keys){
	if(!object){
		return "";
	}

	for(const key of keys){
		const value = normalizeText(object[key]);

		if(value){
			return value;
		}
	}

	const normalizedLookup = {};
	Object.keys(object).forEach(key => {
		normalizedLookup[normalizeObjectKey(key)] = object[key];
	});

	for(const key of keys){
		const value = normalizeText(normalizedLookup[normalizeObjectKey(key)]);

		if(value){
			return value;
		}
	}

	return "";
}

function normalizeObjectKey(key){
	return String(key || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getRouteType(route){
	return getFirstValue(route, ["routeType", "RouteType", "route_type", "type", "Type"]);
}

function getDifficulty(route){
	return getFirstValue(route, ["difficulty", "Difficulty", "difficultyLevel", "DifficultyLevel", "Difficulty Level"]);
}

function getAverageMinutes(route){
	return getFirstValue(route, ["averageMinutes", "AverageMinutes", "averageTime", "AverageTime", "estimatedMinutes", "EstimatedMinutes"]);
}

function getUniqueRouteValues(routes, getter){
	return [...new Set(routes.map(route => getter(route)).filter(Boolean))]
		.sort((a, b) => a.localeCompare(b));
}

function getRouteLocationText(route){
	const pieces = [];
	const locations = [route.startLocation, route.endLocation, ...(route.points || [])];

	locations.forEach(location => {
		if(!location) return;
		pieces.push(location.name, location.address, location.latLon, location.zip);
	});

	return pieces.filter(Boolean).join(" ");
}

function getRouteSearchText(route){
	return [
		route.name,
		route.activity,
		getRouteType(route),
		getDifficulty(route),
		route.distance,
		route.distanceUnit,
		getAverageMinutes(route),
		getRouteLocationText(route)
	].filter(Boolean).join(" ");
}

function parseLatLon(value){
	const text = normalizeText(value);

	if(!text.includes(",")){
		return null;
	}

	const parts = text.split(",").map(part => Number(part.trim()));

	if(parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])){
		return null;
	}

	return {
		lat: parts[0],
		lon: parts[1]
	};
}

function distanceMiles(a, b){
	const earthRadiusMiles = 3958.8;
	const toRadians = degrees => degrees * Math.PI / 180;
	const dLat = toRadians(b.lat - a.lat);
	const dLon = toRadians(b.lon - a.lon);
	const lat1 = toRadians(a.lat);
	const lat2 = toRadians(b.lat);

	const h = Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

	return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function getRouteCoordinates(route){
	const locations = [route.startLocation, route.endLocation, ...(route.points || [])];

	return locations
		.map(location => parseLatLon(location?.latLon))
		.filter(Boolean);
}

function routeIsWithinRadius(route, center, radius){
	if(!center){
		return true;
	}

	const coordinates = getRouteCoordinates(route);

	if(coordinates.length === 0){
		return false;
	}

	return coordinates.some(point => distanceMiles(center, point) <= radius);
}

function getUniqueValues(routes, key){
	return [...new Set(routes.map(route => normalizeText(route[key])).filter(Boolean))]
		.sort((a, b) => a.localeCompare(b));
}

function fillSelect(select, values, firstLabel){
	if(!select){
		return;
	}

	select.innerHTML = "";

	const first = document.createElement("option");
	first.value = "";
	first.textContent = firstLabel;
	select.appendChild(first);

	values.forEach(value => {
		const option = document.createElement("option");
		option.value = value;
		option.textContent = value;
		select.appendChild(option);
	});
}

function createTag(text){
	const tag = document.createElement("span");
	tag.className = "route-tag";
	tag.textContent = text;
	return tag;
}

function createField(label, value){
	const field = document.createElement("div");
	field.className = "route-field";

	const labelEl = document.createElement("b");
	labelEl.textContent = label;

	const valueEl = document.createElement("span");
	valueEl.textContent = normalizeText(value) || "Not listed";

	field.append(labelEl, valueEl);
	return field;
}

function formatDistance(route){
	const distance = normalizeText(route.distance);
	const unit = normalizeText(route.distanceUnit);

	if(!distance){
		return "Not listed";
	}

	return unit ? `${distance} ${unit}` : distance;
}

function getAverageTimeValue(route){
	return getAverageMinutes(route);
}

function formatAverageTime(route){
	const rawValue = getAverageTimeValue(route);

	if(!rawValue){
		return "Unknown";
	}

	const value = Number(rawValue);

	if(Number.isNaN(value) || value <= 0){
		return rawValue;
	}

	if(value < 60){
		return `~${value} min`;
	}

	const hours = Math.floor(value / 60);
	const remainingMinutes = value % 60;

	if(remainingMinutes === 0){
		return `~${hours} hr`;
	}

	return `~${hours} hr ${remainingMinutes} min`;
}

function formatLocation(location){
	if(!location){
		return "Not listed";
	}

	const name = normalizeText(location.name);
	const address = normalizeText(location.address);
	const zip = normalizeText(location.zip);

	return [name, address, zip].filter(Boolean).join(" • ") || "Not listed";
}

function renderRouteCard(route){
	const card = document.createElement("article");
	card.className = "route-card";

	const title = document.createElement("h2");
	title.textContent = normalizeText(route.name) || "Unnamed route";

	const tags = document.createElement("div");
	tags.className = "route-tags";

	const routeType = getRouteType(route);
	const difficulty = getDifficulty(route);

	if(route.activity) tags.appendChild(createTag(route.activity));
	if(routeType) tags.appendChild(createTag(routeType));
	if(difficulty) tags.appendChild(createTag(difficulty));
	if(route.distance) tags.appendChild(createTag(formatDistance(route)));
	tags.appendChild(createTag(formatAverageTime(route)));

	const summary = document.createElement("div");
	summary.className = "route-summary";
	summary.appendChild(createField("Start", formatLocation(route.startLocation)));
	summary.appendChild(createField("End", formatLocation(route.endLocation)));

	card.append(title, tags, summary);

	const points = route.points || [];

	if(points.length > 0){
		const details = document.createElement("details");
		details.className = "route-points-dropdown";

		const pointsTitle = document.createElement("summary");
		pointsTitle.className = "route-points-title";
		pointsTitle.textContent = `Route points (${points.length})`;

		const pointList = document.createElement("ol");
		pointList.className = "route-points";

		points.forEach((point, index) => {
			const item = document.createElement("li");
			item.className = "route-point";

			const number = document.createElement("strong");
			number.textContent = `${index + 1}.`;

			const text = document.createElement("div");
			text.textContent = normalizeText(point.name) || "Unnamed location";

			if(point.latLon){
				const small = document.createElement("small");
				small.textContent = point.latLon;
				text.appendChild(small);
			}

			item.append(number, text);
			pointList.appendChild(item);
		});

		details.append(pointsTitle, pointList);
		card.append(details);
	}

	return card;
}

function getFilters(){
	const searchValue = document.querySelector("[data-route-search]")?.value;
	const zipSearch = getZipFromSearch(searchValue);

	return {
		search: zipSearch ? "" : normalizeSearch(searchValue),
		zipSearch: zipSearch,
		activity: normalizeText(document.querySelector("[data-activity-filter]")?.value),
		routeType: normalizeText(document.querySelector("[data-route-type-filter]")?.value),
		difficulty: normalizeText(document.querySelector("[data-difficulty-filter]")?.value),
		radius: Number(document.querySelector("[data-radius-filter]")?.value || routesConfig.defaultRadiusMiles || 10)
	};
}

function applyFilters(){
	const filters = getFilters();

	return allRoutes.filter(route => {
		const searchText = normalizeSearch(getRouteSearchText(route));
		const matchesSearch = !filters.search || searchText.includes(filters.search);
		const matchesActivity = !filters.activity || normalizeText(route.activity) === filters.activity;
		const matchesRouteType = !filters.routeType || getRouteType(route) === filters.routeType;
		const matchesDifficulty = !filters.difficulty || getDifficulty(route) === filters.difficulty;
		const matchesRadius = routeIsWithinRadius(route, zipCenter, filters.radius);

		return matchesSearch && matchesActivity && matchesRouteType && matchesDifficulty && matchesRadius;
	});
}

function renderRoutes(){
	const list = document.querySelector("[data-routes-list]");
	const status = document.querySelector("[data-routes-status]");

	if(!list || !status){
		return;
	}

	const filteredRoutes = applyFilters();
	list.innerHTML = "";

	if(filteredRoutes.length === 0){
		const empty = document.createElement("div");
		empty.className = "empty-state";
		empty.textContent = "No routes match the current filters.";
		list.appendChild(empty);
		status.textContent = `Showing 0 of ${allRoutes.length} routes`;
		return;
	}

	filteredRoutes.forEach(route => list.appendChild(renderRouteCard(route)));
	status.textContent = `Showing ${filteredRoutes.length} of ${allRoutes.length} routes`;
}

async function fetchZipCenter(zip){
	const cleanZip = normalizeText(zip).replace(/\D/g, "");

	if(cleanZip.length !== 5){
		zipCenter = null;
		renderRoutes();
		return;
	}

	const status = document.querySelector("[data-routes-status]");
	if(status){
		status.textContent = `Checking ZIP ${cleanZip}...`;
	}

	const urlTemplate = routesConfig.zipApiUrl || "https://api.zippopotam.us/us/{zip}";
	const response = await fetch(urlTemplate.replace("{zip}", cleanZip));

	if(!response.ok){
		zipCenter = null;
		if(status){
			status.textContent = `Could not find ZIP ${cleanZip}. Showing all matching routes instead.`;
		}
		renderRoutes();
		return;
	}

	const data = await response.json();
	const place = data.places?.[0];

	if(!place){
		zipCenter = null;
		renderRoutes();
		return;
	}

	zipCenter = {
		lat: Number(place.latitude),
		lon: Number(place.longitude)
	};

	renderRoutes();
}

function debounce(fn, delay){
	let timer = null;

	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delay);
	};
}

function setupFilters(){
	const search = document.querySelector("[data-route-search]");
	const activity = document.querySelector("[data-activity-filter]");
	const routeType = document.querySelector("[data-route-type-filter]");
	const difficulty = document.querySelector("[data-difficulty-filter]");
	const radius = document.querySelector("[data-radius-filter]");
	const clear = document.querySelector("[data-clear-filters]");

	const routeTypeValues = getUniqueRouteValues(allRoutes, getRouteType);
	const difficultyValues = getUniqueRouteValues(allRoutes, getDifficulty);

	console.info("Route type filter values", routeTypeValues);
	console.info("Difficulty filter values", difficultyValues);

	fillSelect(activity, getUniqueValues(allRoutes, "activity"), "All activities");
	fillSelect(routeType, routeTypeValues, "All route types");
	fillSelect(difficulty, difficultyValues, "All difficulties");

	const rerender = () => renderRoutes();
	const updateZipFromSearch = debounce(() => {
		const zipSearch = getZipFromSearch(search?.value);

		if(zipSearch){
			fetchZipCenter(zipSearch);
			return;
		}

		zipCenter = null;
		renderRoutes();
	}, 500);

	search?.addEventListener("input", updateZipFromSearch);
	activity?.addEventListener("change", rerender);
	routeType?.addEventListener("change", rerender);
	difficulty?.addEventListener("change", rerender);
	radius?.addEventListener("change", rerender);

	clear?.addEventListener("click", () => {
		if(search) search.value = "";
		if(activity) activity.value = "";
		if(routeType) routeType.value = "";
		if(difficulty) difficulty.value = "";
		if(radius) radius.value = String(routesConfig.defaultRadiusMiles || 10);
		zipCenter = null;
		renderRoutes();
	});
}

function resolveDriveJsonUrl(url){
	const text = normalizeText(url);

	if(!text){
		return "";
	}

	const fileMatch = text.match(/\/file\/d\/([^/]+)/);
	if(fileMatch && fileMatch[1]){
		return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
	}

	const openMatch = text.match(/[?&]id=([^&]+)/);
	if(text.includes("drive.google.com") && openMatch && openMatch[1]){
		return `https://drive.google.com/uc?export=download&id=${openMatch[1]}`;
	}

	return text;
}


function loadRoutesJsonp(url){
	return new Promise((resolve, reject) => {
		const callbackName = "RouteDataCallback_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
		const separator = url.includes("?") ? "&" : "?";
		const script = document.createElement("script");

		window[callbackName] = data => {
			delete window[callbackName];
			script.remove();
			resolve(data);
		};

		script.src = `${url}${separator}callback=${callbackName}`;
		script.onerror = () => {
			delete window[callbackName];
			script.remove();
			reject(new Error("Failed to load route data."));
		};

		document.body.appendChild(script);
	});
}

function getRoutesSourceUrl(){
	const url = routesConfig.appsScriptUrl ||
		routesConfig.routesApiUrl ||
		routesConfig.routesJsonUrl ||
		routesConfig.googleDriveJsonUrl ||
		routesConfig.jsonUrl;

	return resolveDriveJsonUrl(url);
}

function shouldUseJsonp(url){
	const text = normalizeText(url).toLowerCase();

	return text.includes("script.google.com/macros/");
}


async function loadRoutes(){
	const status = document.querySelector("[data-routes-status]");
	const routesUrl = getRoutesSourceUrl();

	if(!routesUrl || routesUrl.includes("PASTE_YOUR")){
		throw new Error("Paste your route data URL into Assets/Json/Routes.json first.");
	}

	if(status){
		status.textContent = "Loading routes...";
	}

	let data = null;

	if(shouldUseJsonp(routesUrl)){
		data = await loadRoutesJsonp(routesUrl);
	}else{
		const response = await fetch(routesUrl, { cache: "no-store" });

		if(!response.ok){
			throw new Error(`Could not load route JSON. Status: ${response.status}`);
		}

		data = await response.json();
	}

	allRoutes = Array.isArray(data.routes) ? data.routes : [];
}

async function main(){
	await loadHeaderFooter();
	await HF_main();

	routesConfig = await loadBranch("Routes");
	await loadRoutes();
	setupFilters();
	renderRoutes();
}

main().catch(err => {
	console.error(err);
	const status = document.querySelector("[data-routes-status]");
	const list = document.querySelector("[data-routes-list]");

	if(status){
		status.textContent = err.message;
	}

	if(list){
		list.innerHTML = `<div class="empty-state">${err.message}</div>`;
	}
});
