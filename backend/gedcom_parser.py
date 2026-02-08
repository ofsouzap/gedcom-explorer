from gedcom.element.element import Element
from gedcom.element.individual import IndividualElement
from gedcom.parser import Parser
import tempfile
import os

from models import GedcomData, ParseResponse


def parse_gedcom_data(gedcom_data: str) -> ParseResponse:
    """Parse GEDCOM data and return a structured representation"""
    gedcom_parser = Parser()

    # Write to temporary file since parser expects a file path
    with tempfile.NamedTemporaryFile(mode="w", suffix=".ged", delete=False) as tmp_file:
        tmp_file.write(gedcom_data)
        tmp_path = tmp_file.name

    try:
        gedcom_parser.parse_file(tmp_path)
    finally:
        # Clean up temporary file
        os.unlink(tmp_path)

    individuals = {}
    for element in gedcom_parser.get_root_child_elements():
        if isinstance(element, IndividualElement):
            person_id = element.get_pointer()
            # Get name as tuple (given_name, surname)
            given_name, surname = element.get_name()
            full_name = (
                f"{given_name} {surname}" if given_name or surname else "Unknown"
            )

            individuals[person_id] = {
                "id": person_id,
                "name": full_name.strip(),
                "birth_date": None,
                "death_date": None,
                "parent_families": [],
                "spouse_families": [],
            }

            # Birth date
            birth = element.get_birth_data()
            if birth:
                individuals[person_id]["birth_date"] = birth[0] if birth[0] else None

            # Death date
            death = element.get_death_data()
            if death:
                individuals[person_id]["death_date"] = death[0] if death[0] else None

            # Parent families (FAMC tags) and Spouse families (FAMS tags)
            for child_element in element.get_child_elements():
                if child_element.get_tag() == "FAMC":
                    individuals[person_id]["parent_families"].append(
                        child_element.get_value()
                    )
                elif child_element.get_tag() == "FAMS":
                    individuals[person_id]["spouse_families"].append(
                        child_element.get_value()
                    )

    families = {}
    for element in gedcom_parser.get_root_child_elements():
        element: Element
        if element.get_tag() == "FAM":
            family_id = element.get_pointer()
            families[family_id] = {
                "id": family_id,
                "husband": None,
                "wife": None,
                "children": [],
            }

            # Get husband, wife, and children by iterating through child elements
            for child_element in element.get_child_elements():
                tag = child_element.get_tag()
                if tag == "HUSB":
                    families[family_id]["husband"] = child_element.get_value()
                elif tag == "WIFE":
                    families[family_id]["wife"] = child_element.get_value()
                elif tag == "CHIL":
                    families[family_id]["children"].append(child_element.get_value())

    gedcom_data_obj = GedcomData(individuals=individuals, families=families)
    return ParseResponse(success=True, data=gedcom_data_obj)
