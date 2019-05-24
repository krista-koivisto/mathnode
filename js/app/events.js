const footerInfo = document.getElementById("footer-info");
const errorBox = document.getElementById("error-notifier");
const errorBoxText = document.getElementById("error-box-text");
const searchBar = document.getElementById("search");
const searchResults = document.getElementById("search-results");

var activeError = null;
var debugLog = [];
var debug = 1;

function handleError(err) {
    if (debug) {
        // Log the full error message
        console.log(err);
    }

    activeError = err.message;
    displayError(activeError);
}

function displayError(error) {
    if (error) {
        debugLog.push(error);
        errorBoxText.innerText = error;
        errorBox.classList.remove('hidden');

        setTimeout(() => { errorBox.classList.add('show'); }, 5);
        setTimeout(() => {
            errorBox.classList.remove('show');
            setTimeout(() => { errorBox.classList.add('hidden'); }, 500);
        }, 4500);
    }
}

function onInput(e) {
    activeError = '';
}

async function onChange(e) {
    if (!activeError || activeError === '') {
        await updateNodeDetails(this);
    }

    displayError(activeError);
    activeError = '';

    await updateSidebar();
}

function onConnect(e) {
    setTimeout(() => { displayError(activeError); }, 50);
}

// @TODO: Move this to its own thing under app/interface
function keyHandler(e) {
    let preventDefault = true;
    let key = (e.ctrlKey ? 'ctrl+' : '') +
              (e.shiftKey ? 'shift+' : '') +
              (e.altKey ? 'alt+' : '') + e.key.toLowerCase();

    switch(key) {
        case 'ctrl+s':
            MathNode.Interface.package.save(MathNode.Interface.tabs.active.graph.savedAs);
            break;
        case 'ctrl+shift+s':
            MathNode.Interface.package.saveAs();
            break;
        default:
            preventDefault = false;
            break;
    }

    if (preventDefault) {
        e.preventDefault();
    }

    // Make sure the graph retains focus
    MathNode.Interface.tabs.active.graph.element.focus();
}

async function onNodeSelect(e) {
    await updateSidebar();
    if (this.settings.processOnSelect) this.trigger("process");
}

async function onNodeDeselect(e) {
    await updateSidebar();
}

function onUpdate(e) {
    // Map values to array first in case there are multiple outputs to display
    const value = Object.keys(this.outputs).map(out => this.outputs[out].value).toString();
}

searchBar.addEventListener('input', (e) => {
    MathNode.Interface.menu.search.perform();
});

searchBar.addEventListener('focus', (e) => {
    MathNode.Interface.menu.search.perform();
});

searchBar.addEventListener('blur', (e) => {
    if (!e.relatedTarget.classList.contains('search-result')) {
        MathNode.Interface.menu.search.hide();
    }
});
