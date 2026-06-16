import { loadHeaderFooter, HF_main } from "./HeaderFooter.js";
import { loadBranch } from "./OpenJsons.js";

let allEvents = [];
let eventsConfig = {};
const EVENTS_PAGE_VERSION = "20260616-exact-events-json-shape";
console.info("Events page loaded", EVENTS_PAGE_VERSION);

function normalizeText(value){
	return String(value ?? "").trim();
}

function normalizeSearch(value){
	return normalizeText(value).toLowerCase();
}

function normalizeObjectKey(key){
	return String(key || "").toLowerCase().replace(/[^a-z0-9]/g, "");
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

function applyPageText(){
	const title = document.querySelector("[data-events-title]");
	const description = document.querySelector("[data-events-description]");
	const search = document.querySelector("[data-event-search]");

	if(title){
		title.textContent = normalizeText(eventsConfig.pageTitle) || "Events";
	}

	if(description){
		description.innerHTML = "";

		const lines = Array.isArray(eventsConfig.pageDescription)
			? eventsConfig.pageDescription
			: [];

		lines.forEach(line => {
			if(!normalizeText(line)){
				const spacer = document.createElement("div");
				spacer.style.height = "12px";
				description.appendChild(spacer);
				return;
			}

			const p = document.createElement("p");
			p.textContent = line;
			description.appendChild(p);
		});
	}

	if(search){
		search.placeholder = normalizeText(eventsConfig.searchPlaceholder) ||
			"Search events, routes, locations, parking, or meeting points...";
	}
}

function createTag(text){
	const tagText = normalizeText(text);
	if(!tagText){
		return null;
	}

	const tag = document.createElement("span");
	tag.className = "event-tag";
	tag.textContent = tagText;
	return tag;
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

function createMapLink(latLon){
	const coordinates = parseLatLon(latLon);
	if(!coordinates){
		return null;
	}

	const link = document.createElement("a");
	link.className = "event-map-link";
	link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${coordinates.lat},${coordinates.lon}`)}`;
	link.target = "_blank";
	link.rel = "noopener noreferrer";
	link.textContent = "Open map";
	return link;
}

function createField(label, value, location){
	const field = document.createElement("div");
	field.className = "event-field";

	const labelEl = document.createElement("b");
	labelEl.textContent = label;

	const valueEl = document.createElement("span");
	valueEl.textContent = normalizeText(value) || "Not listed";

	field.append(labelEl, valueEl);

	if(location){
		const address = normalizeText(location.address);
		const latLon = normalizeText(location.latLon);

		if(address){
			const addressEl = document.createElement("small");
			addressEl.textContent = address;
			field.appendChild(addressEl);
		}

		if(latLon){
			const latLonEl = document.createElement("small");
			latLonEl.textContent = latLon;
			field.appendChild(latLonEl);

			const mapLink = createMapLink(latLon);
			if(mapLink){
				field.appendChild(mapLink);
			}
		}
	}

	return field;
}

function getLocationName(location){
	return normalizeText(location?.name);
}

function getDifficulty(event){
	return getFirstValue(event, ["difficulty", "Difficulty", "difficultyLevel", "DifficultyLevel", "Difficulty Level"]);
}

function getDuration(event){
	return getFirstValue(event, ["duration", "Duration", "averageDuration", "AverageDuration"]) || "Unknown duration";
}

function getEventSearchText(event){
	return [
		event.name,
		event.activity,
		getDifficulty(event),
		getDuration(event),
		event.route,
		event.location?.name,
		event.location?.address,
		event.location?.latLon,
		event.parkingLocation?.name,
		event.parkingLocation?.address,
		event.parkingLocation?.latLon,
		event.meetingLocation?.name,
		event.meetingLocation?.address,
		event.meetingLocation?.latLon
	].filter(Boolean).join(" ");
}

function getUniqueValues(events, getter){
	return [...new Set(events.map(event => normalizeText(getter(event))).filter(Boolean))]
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

function renderRouteLocationSection(card, event){
	const mainInfo = document.createElement("div");
	mainInfo.className = "event-main-info";

	const route = normalizeText(event.route);
	const locationName = getLocationName(event.location);

	if(route){
		mainInfo.appendChild(createField("Route", route));

		if(locationName){
			mainInfo.appendChild(createField("Location", locationName, event.location));
		}
	}else if(locationName){
		mainInfo.appendChild(createField("Location", locationName, event.location));
	}else{
		mainInfo.appendChild(createField("Route / Location", "Not listed"));
	}

	card.appendChild(mainInfo);
}

function renderEventCard(event){
	const card = document.createElement("article");
	card.className = "event-card";

	const title = document.createElement("h2");
	title.textContent = normalizeText(event.name) || "Unnamed event";

	const tags = document.createElement("div");
	tags.className = "event-tags";
	[
		event.activity,
		getDifficulty(event),
		getDuration(event)
	].forEach(value => {
		const tag = createTag(value);
		if(tag){
			tags.appendChild(tag);
		}
	});

	card.append(title, tags);
	renderRouteLocationSection(card, event);

	const bottomInfo = document.createElement("div");
	bottomInfo.className = "event-bottom-info";
	bottomInfo.appendChild(createField(
		"Parking",
		getLocationName(event.parkingLocation) || "No recommended parking",
		event.parkingLocation
	));
	bottomInfo.appendChild(createField(
		"Meeting",
		getLocationName(event.meetingLocation) || "Meeting location will be provided",
		event.meetingLocation
	));

	card.appendChild(bottomInfo);
	return card;
}

function getFilters(){
	return {
		search: normalizeSearch(document.querySelector("[data-event-search]")?.value),
		activity: normalizeText(document.querySelector("[data-activity-filter]")?.value),
		difficulty: normalizeText(document.querySelector("[data-difficulty-filter]")?.value)
	};
}

function applyFilters(){
	const filters = getFilters();

	return allEvents.filter(event => {
		const searchText = normalizeSearch(getEventSearchText(event));
		const matchesSearch = !filters.search || searchText.includes(filters.search);
		const matchesActivity = !filters.activity || normalizeText(event.activity) === filters.activity;
		const matchesDifficulty = !filters.difficulty || getDifficulty(event) === filters.difficulty;

		return matchesSearch && matchesActivity && matchesDifficulty;
	});
}

function renderEvents(){
	const list = document.querySelector("[data-events-list]");
	const status = document.querySelector("[data-events-status]");

	if(!list || !status){
		return;
	}

	const filteredEvents = applyFilters();
	list.innerHTML = "";

	if(filteredEvents.length === 0){
		const empty = document.createElement("div");
		empty.className = "empty-state";
		empty.textContent = "No events match the current filters.";
		list.appendChild(empty);
		status.textContent = `Showing 0 of ${allEvents.length} events`;
		return;
	}

	filteredEvents.forEach(event => list.appendChild(renderEventCard(event)));
	status.textContent = `Showing ${filteredEvents.length} of ${allEvents.length} events`;
}

function setupFilters(){
	const search = document.querySelector("[data-event-search]");
	const activity = document.querySelector("[data-activity-filter]");
	const difficulty = document.querySelector("[data-difficulty-filter]");
	const clear = document.querySelector("[data-clear-filters]");

	fillSelect(activity, getUniqueValues(allEvents, event => event.activity), "All activities");
	fillSelect(difficulty, getUniqueValues(allEvents, getDifficulty), "All difficulties");

	search?.addEventListener("input", renderEvents);
	activity?.addEventListener("change", renderEvents);
	difficulty?.addEventListener("change", renderEvents);

	clear?.addEventListener("click", () => {
		if(search) search.value = "";
		if(activity) activity.value = "";
		if(difficulty) difficulty.value = "";
		renderEvents();
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

function loadEventsJsonp(url){
	return new Promise((resolve, reject) => {
		const callbackName = "EventDataCallback_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
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
			reject(new Error("Failed to load event data."));
		};

		document.body.appendChild(script);
	});
}

function getEventsSourceUrl(){
	const url = eventsConfig.appsScriptUrl ||
		eventsConfig.eventsApiUrl ||
		eventsConfig.eventsJsonUrl ||
		eventsConfig.googleDriveJsonUrl ||
		eventsConfig.jsonUrl;

	return resolveDriveJsonUrl(url);
}

function shouldUseJsonp(url){
	const text = normalizeText(url).toLowerCase();
	return text.includes("script.google.com/macros/");
}

function normalizeEventsPayload(data){
	if(Array.isArray(data)){
		return data;
	}

	if(Array.isArray(data?.events)){
		return data.events;
	}

	if(Array.isArray(data?.Events)){
		return data.Events;
	}

	return [];
}

async function loadEvents(){
	const status = document.querySelector("[data-events-status]");
	const eventsUrl = getEventsSourceUrl();

	if(!eventsUrl || eventsUrl.includes("PASTE_YOUR")){
		throw new Error("Paste your event data URL into Assets/Json/Events.json first.");
	}

	if(status){
		status.textContent = "Loading events...";
	}

	let data = null;

	if(shouldUseJsonp(eventsUrl)){
		data = await loadEventsJsonp(eventsUrl);
	}else{
		const response = await fetch(eventsUrl, { cache: "no-store" });

		if(!response.ok){
			throw new Error(`Could not load event JSON. Status: ${response.status}`);
		}

		data = await response.json();
	}

	allEvents = normalizeEventsPayload(data);
}

async function main(){
	await loadHeaderFooter();
	await HF_main();

	eventsConfig = await loadBranch("Events");
	applyPageText();

	await loadEvents();
	setupFilters();
	renderEvents();
}

main().catch(err => {
	console.error(err);
	const status = document.querySelector("[data-events-status]");
	const list = document.querySelector("[data-events-list]");

	if(status){
		status.textContent = err.message;
	}

	if(list){
		list.innerHTML = `<div class="empty-state">${err.message}</div>`;
	}
});
