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
const uploadButton = document.getElementById('upload-button')!;
const errorMessage = document.getElementById('error-message')!;
const personList = document.getElementById('person-list')!;
const backButton = document.getElementById('back-button')!;
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

    // Draw connections first (so they appear behind nodes)
    const connections: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

    // Parents above
    const parentY = centerY - 150;
    const parentSpacing = 120;
    const parentStartX = centerX - ((surroundings.parents.length - 1) * parentSpacing) / 2;
    surroundings.parents.forEach((parent, i) => {
        const x = parentStartX + i * parentSpacing;
        connections.push({ x1: centerX, y1: centerY - 40, x2: x, y2: parentY + 40 });
    });

    // Children below
    const childY = centerY + 150;
    const childSpacing = 100;
    const childStartX = centerX - ((surroundings.children.length - 1) * childSpacing) / 2;
    surroundings.children.forEach((child, i) => {
        const x = childStartX + i * childSpacing;
        connections.push({ x1: centerX, y1: centerY + 40, x2: x, y2: childY - 40 });
    });

    // Siblings to the sides
    const siblingY = centerY;
    const siblingLeftX = centerX - 200;
    const siblingRightX = centerX + 200;
    surroundings.siblings.forEach((sibling, i) => {
        const x = i % 2 === 0 ? siblingLeftX : siblingRightX;
        const offsetY = Math.floor(i / 2) * 80 - 40;
        connections.push({ x1: centerX - 40, y1: centerY, x2: x + 40, y2: siblingY + offsetY });
    });

    // Draw all connection lines
    connections.forEach((conn) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'connection-line');
        line.setAttribute('x1', conn.x1.toString());
        line.setAttribute('y1', conn.y1.toString());
        line.setAttribute('x2', conn.x2.toString());
        line.setAttribute('y2', conn.y2.toString());
        svg.appendChild(line);
    });

    // Draw nodes
    // Center person
    createPersonNode(svg, centerX, centerY, person.name || 'Unknown', person.id, true);

    // Parents
    surroundings.parents.forEach((parent, i) => {
        const x = parentStartX + i * parentSpacing;
        createPersonNode(svg, x, parentY, parent.name, parent.id, false);
    });

    // Children
    surroundings.children.forEach((child, i) => {
        const x = childStartX + i * childSpacing;
        createPersonNode(svg, x, childY, child.name, child.id, false);
    });

    // Siblings
    surroundings.siblings.forEach((sibling, i) => {
        const x = i % 2 === 0 ? siblingLeftX : siblingRightX;
        const offsetY = Math.floor(i / 2) * 80 - 40;
        createPersonNode(svg, x, siblingY + offsetY, sibling.name, sibling.id, false);
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
