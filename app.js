const GATE_PASSCODE = "schaffhouse99";
const GATE_KEY = "schaffhouse-unlocked";

if (localStorage.getItem(GATE_KEY) === "yes") {
  document.body.classList.remove("is-locked");
}

document.querySelector("#gate-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#gate-input");
  const error = document.querySelector("#gate-error");
  if (input.value.trim().toLowerCase() === GATE_PASSCODE) {
    localStorage.setItem(GATE_KEY, "yes");
    document.body.classList.remove("is-locked");
  } else {
    error.textContent = "Not quite, try again.";
    input.value = "";
    input.focus();
  }
});

const NOTES_KEY = "schaffhouse-card-notes";

const state = {
  filter: "all",
  search: "",
  activeCardId: null
};

const cardList = document.querySelector("#card-list");
const searchInput = document.querySelector("#card-search");
const filterButtons = Array.from(document.querySelectorAll(".filter-button"));
const detailPanel = document.querySelector("#detail-panel");
const detailHint = document.querySelector(".detail-hint");
const detailBody = document.querySelector("#detail-body");
const detailNumeral = document.querySelector("#detail-numeral");
const detailName = document.querySelector("#detail-name");
const detailFrench = document.querySelector("#detail-french");
const detailSuit = document.querySelector("#detail-suit");
const detailKeywords = document.querySelector("#detail-keywords");
const detailMeaning = document.querySelector("#detail-meaning");
const notesField = document.querySelector("#detail-notes");
const notesStatus = document.querySelector("#notes-status");
const aboutBody = document.querySelector("#about-body");

function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function saveNote(cardId, text) {
  const notes = loadNotes();
  if (text.trim()) {
    notes[cardId] = text;
  } else {
    delete notes[cardId];
  }
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function matchesFilter(card) {
  if (state.filter === "all") {
    return true;
  }
  return card.group === state.filter;
}

function matchesSearch(card) {
  if (!state.search) {
    return true;
  }
  const query = state.search.toLowerCase();
  return (
    card.name.toLowerCase().includes(query) ||
    card.numeral.toLowerCase().includes(query) ||
    (card.french || "").toLowerCase().includes(query) ||
    card.keywords.toLowerCase().includes(query)
  );
}

function renderList() {
  const notes = loadNotes();
  const visible = CARDS.filter((card) => matchesFilter(card) && matchesSearch(card));
  cardList.innerHTML = "";

  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "no-results";
    empty.textContent = "No cards match that search.";
    cardList.appendChild(empty);
    return;
  }

  visible.forEach((card) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card-button";
    if (card.id === state.activeCardId) {
      button.classList.add("is-active");
    }
    if (notes[card.id]) {
      button.classList.add("has-note");
    }

    const numeral = document.createElement("span");
    numeral.className = "numeral";
    numeral.textContent = card.group === "major" ? "Majeurs · " + card.numeral : card.group;

    const name = document.createElement("span");
    name.textContent = card.name;

    button.appendChild(numeral);
    button.appendChild(name);
    button.addEventListener("click", () => selectCard(card.id));
    cardList.appendChild(button);
  });
}

function selectCard(cardId) {
  const card = CARDS.find((entry) => entry.id === cardId);
  if (!card) {
    return;
  }

  state.activeCardId = cardId;
  detailPanel.classList.remove("is-empty");
  detailHint.hidden = true;
  detailBody.hidden = false;

  detailNumeral.textContent = card.group === "major" ? "Card " + card.numeral + " · Major Arcana" : "Minor Arcana";
  detailName.textContent = card.name;
  detailFrench.textContent = card.french ? "French: " + card.french : "";
  detailFrench.hidden = !card.french;

  if (card.group !== "major") {
    const suit = SUITS[card.group];
    detailSuit.textContent = suit.french + " · " + suit.element + " · " + suit.domain;
    detailSuit.hidden = false;
  } else {
    detailSuit.hidden = true;
  }

  detailKeywords.textContent = card.keywords;
  detailMeaning.textContent = card.meaning;

  notesField.value = loadNotes()[card.id] || "";
  notesStatus.textContent = "Notes save automatically on this device.";

  renderList();
  if (window.matchMedia("(max-width: 699px)").matches) {
    detailPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

notesField.addEventListener("input", () => {
  if (!state.activeCardId) {
    return;
  }
  saveNote(state.activeCardId, notesField.value);
  notesStatus.textContent = "Saved on this device.";
  renderList();
});

searchInput.addEventListener("input", () => {
  state.search = searchInput.value.trim();
  renderList();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    filterButtons.forEach((other) => {
      const active = other === button;
      other.classList.toggle("is-active", active);
      other.setAttribute("aria-pressed", String(active));
    });
    renderList();
  });
});

DECK_INFO.about.forEach((paragraph) => {
  const node = document.createElement("p");
  node.textContent = paragraph;
  aboutBody.appendChild(node);
});

renderList();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}
