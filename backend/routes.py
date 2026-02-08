from flask import Blueprint, request, jsonify
import traceback

from gedcom_parser import parse_gedcom_data
from services import get_person_details, get_person_surroundings_data
from models import GedcomData

api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.route("/parse", methods=["POST"])
def parse_gedcom():
    """Parse uploaded GEDCOM file"""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        content = file.read().decode("utf-8")
        response = parse_gedcom_data(content)
        return jsonify(response.model_dump())
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@api_bp.route("/person/<person_id>", methods=["POST"])
def get_person(person_id):
    """Get detailed information about a specific person"""
    try:
        data = request.json
        gedcom_data_dict = data.get("gedcom_data")

        if not gedcom_data_dict:
            return jsonify({"error": "No GEDCOM data provided"}), 400

        gedcom_data = GedcomData(**gedcom_data_dict)
        response = get_person_details(person_id, gedcom_data)
        return jsonify(response.model_dump())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@api_bp.route("/person/<person_id>/surroundings", methods=["POST"])
def get_person_surroundings(person_id):
    """Get parents, children, and siblings for a person"""
    try:
        data = request.json
        gedcom_data_dict = data.get("gedcom_data")

        if not gedcom_data_dict:
            return jsonify({"error": "No GEDCOM data provided"}), 400

        gedcom_data = GedcomData(**gedcom_data_dict)
        response = get_person_surroundings_data(person_id, gedcom_data)
        return jsonify(response.model_dump())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
