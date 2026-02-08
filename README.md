# GEDCOM Explorer

A web application for exploring GEDCOM genealogy files with an interactive family tree interface.

Project generated with a lot of vibe coding (even this file) :)

## Project Structure

```
gedcom-explorer/
├── backend/          # Python Flask backend
│   ├── app.py       # Main Flask application
│   └── pyproject.toml
└── frontend/         # TypeScript frontend
    ├── src/
    │   ├── main.ts      # Main application logic
    │   ├── api.ts       # API client
    │   └── styles.css   # Styles
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Linux/Mac
   ```

3. Install dependencies:
   ```bash
   pip install -e .
   ```

4. Run the backend server:
   ```bash
   python app.py
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

## Usage

1. Open your browser to `http://localhost:3000`
2. Upload a GEDCOM file (.ged or .gedcom)
3. Select a person from the list to explore
4. View the person's details and family connections
5. Click on connected family members (parents, children, siblings) to navigate the tree

## Features

- **File Upload**: Upload and parse GEDCOM files
- **Person Selection**: Browse all individuals in the GEDCOM file
- **Interactive Family Tree**: Visual representation with:
  - Selected person in the center
  - Parents above
  - Children below
  - Siblings to the sides
- **Person Details**: View multiple names (with labels), birth dates, and death dates
- **Navigation**: Click on any family member to explore their connections

## API Endpoints

- `POST /api/parse` - Parse a GEDCOM file
- `POST /api/person/<person_id>` - Get detailed information about a person
- `POST /api/person/<person_id>/surroundings` - Get parents, children, and siblings

## Technologies Used

### Backend
- Flask (Python web framework)
- python-gedcom (GEDCOM parser)
- Flask-CORS (Cross-origin resource sharing)

### Frontend
- TypeScript
- Vite (Build tool)
- Axios (HTTP client)
- Vanilla JavaScript with SVG for visualization
