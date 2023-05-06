const rebrickKey = "3ae977e22655ff1212ccb6254507ae41";

// Constantly needed elements.
const details = document.querySelector("#details");
const search = document.querySelector("#lego-search");

const dImgSrc = "img/8014-1.png";
const notFound = "Not found.";

// Maps to prevent excessive API calls.
// Since these will only exist through a single session, we don't need to check for API updates
// after initial caching.
const idMap = new Map();
const nameMap = new Map();

// Most recently accessed data.
let recentJson = null;
// Get default set.
fetchSet("8014-1");

/**
 * Handle a search attempt.
 * 
 * Steps:
 * 1. Listen for someone searching by name
 * 2. When they search by name, get how many entries are in the agify API
 * 3. Parse this entry count into a reasonable Lego ID
 * 4. Try to get the Rebrickable API to give a Lego set.
 * 5. If they give one, slap it on the screen with details.
 * 6. If the ID was invalid, put up the default set (2009 Clone Trooper Battlepack)
 * 7. Cache data to reduce future API calls.
 * 
 * @param {*} ev Search click event.
 */
search.onsubmit = (ev) => {
    ev.preventDefault();

    const pname = new FormData(ev.target).get("query");
    fetchSum(pname)
    .then(fetchSet)
    .then((json) => {
        recentJson = json; // Using a global variable for RecentJson for event listeners.

        // Clear out previous images.
        while (details.firstChild) {
            details.removeChild(details.firstChild);
        }

        // Prepare attributes that will be needed in all cases.
        const header = document.createElement("h2");
        const caption = document.createElement("p");
        const button = document.createElement("button");

        header.setAttribute("class", "content heading");
        caption.setAttribute("class", "content");
        button.setAttribute("class", "content");
        button.setAttribute("id", "details-button");

        button.innerText = "Show Details";
        button.addEventListener("click", () => {
            toggleButton();
        });

        details.appendChild(header);
        details.appendChild(caption);
        details.appendChild(button);
            
        // if json not found, go for all defaults.
        if (recentJson.detail == notFound) {
            recentJson = idMap.get("8014-1");
            header.textContent = "No set found!";
            caption.textContent = "You don't have a unique set. Here's the 2009 Clone Trooper Battlepack.";
        } else {
            header.textContent = "Your set!";
            caption.textContent = `Your set is: ${recentJson.name}`;
        }
    });
}

/**
 * Fetches the number of entries in the  web database associated with this name.
 * 
 * @param {String} name Name of user to grab total.
 * @return the number of entries associated with this name.
 */
function fetchSum(name) {
    // Since case doesn't matter for API, don't cause extraneous calls for case.
    name = name.toLowerCase();

    if (!nameMap.has(name)) {
        console.log("Fetching");
        nameMap.set(name, 
        fetch(`https://api.agify.io?name=${name}`)
        .then((resp) => {
            return resp.json();
        })
        .then((json) => {
            return json.count;
        })
        .then((sum) => {
            return sum % 10000 + "-1";
        }));
    }

    return nameMap.get(name);
}

/**
 * Gets the image for the lego set associated with this id.
 * 
 * @param {int} id id for this lego set
 * @return the set associated with this id.
 */
async function fetchSet(id) {
    console.log(id);
    if (!idMap.has(id)) {
        console.log("Fetching");
        const json = await fetch(`https://rebrickable.com/api/v3/lego/sets/${id}/?key=${rebrickKey}`)
            .then((resp) => {
                return resp.json();
            });
        idMap.set(id, json);
    }

    return idMap.get(id);
}

/* Details button handlers */

/**
 * Toggle the button:
 * -- Show details if it's off.
 * -- Hide details if it's on.
 */
function toggleButton() {
    const button = document.querySelector("#details-button");

    // Check if button is pressed.
    if (button.innerText === "Show Details") {
        button.innerText = "Hide Details";
        placeDetails();
    } else {
        button.innerText = "Show Details";
        hideDetails();
    }
}

/**
 * Place details for the most recently accessed set down.
 */
function placeDetails() {
    const list = document.createElement("ul");
    const name = document.createElement("li");
    const num = document.createElement("li");
    const year = document.createElement("li");
    const pieces = document.createElement("li");
    const image = document.createElement("img");

    list.appendChild(name);
    list.appendChild(num);
    list.appendChild(year);
    list.appendChild(pieces);
    list.appendChild(image);

    name.setAttribute("class", "content");
    num.setAttribute("class", "content");
    year.setAttribute("class", "content");
    pieces.setAttribute("class", "content");
    image.setAttribute("class", "content");

    image.setAttribute("src", recentJson.set_img_url);

    name.innerText = `Set Name: ${recentJson.name}`;
    num.innerText = `Set Num: ${recentJson.set_num}`;
    year.innerText = `Year Released: ${recentJson.year}`;
    pieces.innerText = `Pieces: ${recentJson.num_parts}`;
    
    details.appendChild(list);
}

/**
 * "Hide" details by removing all children of details, except the button.
 */
function hideDetails() {
    const details = document.querySelector("#details");

    while (details.lastChild != null && details.lastChild.nodeName != "BUTTON") {
        details.removeChild(details.lastChild);
    }
}