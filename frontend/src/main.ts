import {
    parseGedcomFile,
    getPerson,
    getPersonSurroundings,
    GedcomData,
    GedcomPerson,
    PersonSurroundings,
} from './api';

let gedcomData: GedcomData | null = null;
let currentPersonId: string | null = null;

// DOM elements
const uploadSection = document.getElementById('upload-section')!;
const personSelectorSection = document.getElementById('person-selector-section')!;
const explorerSection = document.getElementById('explorer-section')!;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const uploadButton = document.getElementById('upload-button')! as HTMLButtonElement;
const errorMessage = document.getElementById('error-message')!;
const personList = document.getElementById('person-list')!;
const backButton = document.getElementById('back-button')! as HTMLButtonElement;
const familyTreeSvg = document.getElementById('family-tree-svg')!;
const personDetails = document.getElementById('person-details')!;

// Event listeners
uploadButton.addEventListener('click', handleFileUpload);
backButton.addEventListener('click', showPersonSelector);

async function handleFileUpload() {
    const file = fileInput.files?.[0];
    if (!file) {
        errorMessage.textContent = 'Please select a file';
        return;
    }

    errorMessage.textContent = '';
    uploadButton.textContent = 'Parsing...';
    uploadButton.disabled = true;

    try {
        gedcomData = await parseGedcomFile(file);
        showPersonSelector();
    } catch (error: any) {
        errorMessage.textContent = `Error: ${error.message || 'Failed to parse GEDCOM file'}`;
    } finally {
        uploadButton.textContent = 'Upload GEDCOM File';
        uploadButton.disabled = false;
    }
}

function showPersonSelector() {
    if (!gedcomData) return;

    uploadSection.style.display = 'none';
    explorerSection.style.display = 'none';
    personSelectorSection.style.display = 'block';

    personList.innerHTML = '';

    const individuals = Object.values(gedcomData.individuals);
    individuals.forEach((person) => {
        const card = document.createElement('div');
        card.className = 'person-card';

        const name = person.name || 'Unknown';
        const birthDate = person.birth_date || 'Unknown';
        const deathDate = person.death_date || 'N/A';

        card.innerHTML = `
      <h3>${name}</h3>
      <p><strong>Born:</strong> ${birthDate}</p>
      <p><strong>Died:</strong> ${deathDate}</p>
    `;

        card.addEventListener('click', () => showPersonExplorer(person.id));
        personList.appendChild(card);
    });
}

async function showPersonExplorer(personId: string) {
    if (!gedcomData) return;

    currentPersonId = personId;
    personSelectorSection.style.display = 'none';
    explorerSection.style.display = 'block';

    try {
        const person = await getPerson(personId, gedcomData);
        const surroundings = await getPersonSurroundings(personId, gedcomData);

        renderPersonDetails(person);
        renderFamilyTree(person, surroundings);
    } catch (error: any) {
        console.error('Error loading person:', error);
        alert(`Error: ${error.message || 'Failed to load person data'}`);
    }
}

function renderPersonDetails(person: GedcomPerson) {
    const personName = person.name || 'Unknown';
    const birthDate = person.birth_date || 'Unknown';
    const deathDate = person.death_date || 'N/A';

    personDetails.innerHTML = `
    <h3>Person Details</h3>
    <div class="name-list">
      <div class="name-item"><strong>Name:</strong> ${personName}</div>
    </div>
    <div class="dates">
      <div class="date-item">
        <strong>Birth Date</strong>
        ${birthDate}
      </div>
      <div class="date-item">
        <strong>Death Date</strong>
        ${deathDate}
      </div>
    </div>
  `;
}

function renderFamilyTree(person: GedcomPerson, surroundings: PersonSurroundings) {
    const svg = familyTreeSvg as unknown as SVGSVGElement;
    svg.innerHTML = '';

    const width = svg.clientWidth || 1000;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;

    // Position calculations
    const nodeRadius = 35;
    const centerNodeRadius = 40;
    const levelSpacing = 120;

    // Parent level (top)
    const parentY = centerY - levelSpacing - 30;
    const parentSpacing = 100;
    const parentCount = surroundings.parents.length;
    const parentStartX = centerX - ((parentCount - 1) * parentSpacing) / 2;

    // Selected person level (middle)
    const personY = centerY;

    // Spouse position (next to selected person)
    const spouseX = centerX + 80;
    const spouse = surroundings.spouses.length > 0 ? surroundings.spouses[0] : null;

    // Children level (bottom)
    const childY = centerY + levelSpacing + 30;
    const childSpacing = 80;
    const childCount = surroundings.children.length;
    const marriageX = spouse ? (centerX + spouseX) / 2 : centerX;
    const childStartX = marriageX - ((childCount - 1) * childSpacing) / 2;

    // Sibling positions (same level as person, to the left)
    const siblingSpacing = 80;
    const siblingStartX = centerX - 150 - (surroundings.siblings.length - 1) * siblingSpacing;

    // Draw connections using paths for better tree structure
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'connections');

    // Parents to selected person
    if (parentCount > 0) {
        // Horizontal line connecting parents
        if (parentCount === 2) {
            const parent1X = parentStartX;
            const parent2X = parentStartX + parentSpacing;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'connection-line');
            path.setAttribute('d', `M ${parent1X} ${parentY} L ${parent2X} ${parentY}`);
            g.appendChild(path);
        }

        // Vertical line from parents' midpoint down
        const parentMidX = parentCount === 2 ?
            (parentStartX + parentStartX + parentSpacing) / 2 :
            parentStartX;

        // Line down from parents
        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path1.setAttribute('class', 'connection-line');
        path1.setAttribute('d', `M ${parentMidX} ${parentY + nodeRadius} L ${parentMidX} ${personY - 50}`);
        g.appendChild(path1);

        // Horizontal line for siblings and selected person
        const siblingEndX = surroundings.siblings.length > 0 ?
            siblingStartX - siblingSpacing / 2 :
            centerX;
        const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path2.setAttribute('class', 'connection-line');
        path2.setAttribute('d', `M ${siblingEndX} ${personY - 50} L ${centerX} ${personY - 50}`);
        g.appendChild(path2);

        // Vertical lines down to each sibling and selected person
        surroundings.siblings.forEach((sibling, i) => {
            const x = siblingStartX + i * siblingSpacing;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'connection-line');
            path.setAttribute('d', `M ${x} ${personY - 50} L ${x} ${personY - nodeRadius}`);
            g.appendChild(path);
        });

        // Line to selected person
        const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path3.setAttribute('class', 'connection-line');
        path3.setAttribute('d', `M ${centerX} ${personY - 50} L ${centerX} ${personY - centerNodeRadius}`);
        g.appendChild(path3);
    }

    // Selected person to spouse (horizontal line)
    if (spouse) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'connection-line');
        path.setAttribute('d', `M ${centerX + centerNodeRadius} ${personY} L ${spouseX - nodeRadius} ${personY}`);
        g.appendChild(path);
    }

    // Marriage point to children
    if (childCount > 0) {
        // Vertical line down from marriage point
        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path1.setAttribute('class', 'connection-line');
        path1.setAttribute('d', `M ${marriageX} ${personY + centerNodeRadius} L ${marriageX} ${childY - 50}`);
        g.appendChild(path1);

        // Horizontal line connecting all children
        if (childCount > 1) {
            const firstChildX = childStartX;
            const lastChildX = childStartX + (childCount - 1) * childSpacing;
            const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path2.setAttribute('class', 'connection-line');
            path2.setAttribute('d', `M ${firstChildX} ${childY - 50} L ${lastChildX} ${childY - 50}`);
            g.appendChild(path2);
        }

        // Vertical lines down to each child
        surroundings.children.forEach((child, i) => {
            const x = childStartX + i * childSpacing;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'connection-line');
            path.setAttribute('d', `M ${x} ${childY - 50} L ${x} ${childY - nodeRadius}`);
            g.appendChild(path);
        });
    }

    svg.appendChild(g);

    // Draw nodes
    // Parents
    surroundings.parents.forEach((parent, i) => {
        const x = parentStartX + i * parentSpacing;
        createPersonNode(svg, x, parentY, parent.name, parent.id, false);
    });

    // Siblings
    surroundings.siblings.forEach((sibling, i) => {
        const x = siblingStartX + i * siblingSpacing;
        createPersonNode(svg, x, personY, sibling.name, sibling.id, false);
    });

    // Center person (selected)
    createPersonNode(svg, centerX, personY, person.name || 'Unknown', person.id, true);

    // Spouse
    if (spouse) {
        createPersonNode(svg, spouseX, personY, spouse.name, spouse.id, false);
    }

    // Children
    surroundings.children.forEach((child, i) => {
        const x = childStartX + i * childSpacing;
        createPersonNode(svg, x, childY, child.name, child.id, false);
    });
}

function createPersonNode(
    svg: SVGSVGElement,
    x: number,
    y: number,
    name: string,
    personId: string,
    isCenter: boolean
) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', `person-node ${isCenter ? 'center' : ''}`);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x.toString());
    circle.setAttribute('cy', y.toString());
    circle.setAttribute('r', isCenter ? '40' : '35');
    group.appendChild(circle);

    // Split name into lines if too long
    const maxLength = 12;
    const nameParts = name.split(' ');
    let lines: string[] = [];
    let currentLine = '';

    nameParts.forEach((part) => {
        if ((currentLine + ' ' + part).trim().length <= maxLength) {
            currentLine += (currentLine ? ' ' : '') + part;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = part;
        }
    });
    if (currentLine) lines.push(currentLine);

    lines = lines.slice(0, 2); // Max 2 lines

    lines.forEach((line, i) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x.toString());
        text.setAttribute('y', (y + (lines.length === 1 ? 5 : -5 + i * 12)).toString());
        text.textContent = line;
        group.appendChild(text);
    });

    if (!isCenter) {
        group.style.cursor = 'pointer';
        group.addEventListener('click', () => showPersonExplorer(personId));
    }

    svg.appendChild(group);
}
