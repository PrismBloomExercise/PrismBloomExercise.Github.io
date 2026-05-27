# Prism Bloom Exercise Website

This project is a lightweight, modular website for **Prism Bloom Exercise**, an outdoor activity and community event group.

The site is designed to provide a clean public home for route information, event links, community resources, and social platforms while keeping the structure simple enough to maintain through JSON-driven content.

---

## Purpose

This site serves as:

* A public information hub for Prism Bloom Exercise
* A route and activity reference for walking, biking, hiking, kayaking, and other outdoor meetups
* A central place for Discord, calendar, and social links
* A lightweight GitHub Pages website that can grow with the community

---

## Structure

The site follows a modular, component-based layout:

```text
/
├── index.html
├── Links/
│   └── index.html
├── Routes/
│   └── index.html
└── Assets/
    ├── CSS/
    ├── JS/
    ├── Json/
    └── HTML/
```

### Key Components

* **index.html**
  Main landing page for Prism Bloom Exercise.

* **Links/**
  Organized list of community links, social platforms, Discord, and calendar resources.

* **Routes/**
  Route listing page with searchable and filterable route information.

* **Assets/JS/**
  Handles page behavior, JSON loading, filtering, and dynamic rendering.

* **Assets/Json/**
  Stores editable content and route configuration data.

* **Assets/HTML/**
  Shared page components such as header/footer where used.

---

## Design Philosophy

This project is built around a few core principles:

* **Community First**
  The site should make it easy for people to understand what Prism Bloom Exercise is and how to get involved.

* **Simple Maintenance**
  Content is kept in structured files where possible so updates do not require rebuilding the whole site.

* **Lightweight and Static**
  The website is designed to work well on GitHub Pages without a heavy framework or server backend.

* **Flexible Growth**
  Pages and JSON files can be expanded as new locations, activities, routes, and community tools are added.

---

## Route Data

The route page is designed to display route records from structured JSON.

Route records may include:

* Route name
* Activity
* Route type
* Difficulty
* Start location
* End location
* Distance and distance unit
* Estimated or average time
* Route points

This allows Prism Bloom Exercise to manage route information separately from the page layout.

---

## Customization

To modify content:

```text
Assets/Json/
```

To modify layout or behavior:

```text
Assets/JS/
Assets/CSS/
```

To modify shared UI elements:

```text
Assets/HTML/
```

---

## Local Testing

From the project root, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

---

## Deployment

This site is designed to work with static hosting platforms such as:

* GitHub Pages
* Netlify
* Any static web server

---

## Notes

* Paths are case-sensitive when deployed, especially on GitHub Pages.
* Image assets should be placed in the appropriate asset directories and referenced consistently.
* Route data should stay structured so the route page can filter and display it reliably.
* The project avoids unnecessary external dependencies for simplicity and control.

---

## Project

**Prism Bloom Exercise**

A community-focused outdoor activity group using Discord as the primary event and discussion hub, with calendar and social platforms supporting updates, schedules, and shared photos.
