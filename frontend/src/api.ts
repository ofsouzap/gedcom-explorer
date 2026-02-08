import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export interface GedcomPerson {
    id: string;
    name: string;
    birth_date: string | null;
    death_date: string | null;
    parent_families: string[];
    spouse_families: string[];
}

export interface GedcomFamily {
    id: string;
    husband: string | null;
    wife: string | null;
    children: string[];
}

export interface GedcomData {
    individuals: { [key: string]: GedcomPerson };
    families: { [key: string]: GedcomFamily };
}

export interface PersonSummary {
    id: string;
    name: string;
}

export interface PersonSurroundings {
    parents: PersonSummary[];
    siblings: PersonSummary[];
    spouses: PersonSummary[];
    children: PersonSummary[];
}

export async function parseGedcomFile(file: File): Promise<GedcomData> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE_URL}/parse`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
}

export async function getPerson(personId: string, gedcomData: GedcomData): Promise<GedcomPerson> {
    const response = await axios.post(`${API_BASE_URL}/person/${personId}`, {
        gedcom_data: gedcomData,
    });

    return response.data;
}

export async function getPersonSurroundings(
    personId: string,
    gedcomData: GedcomData
): Promise<PersonSurroundings> {
    const response = await axios.post(`${API_BASE_URL}/person/${personId}/surroundings`, {
        gedcom_data: gedcomData,
    });

    return response.data;
}
