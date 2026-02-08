from typing import Dict, Any
from models import (
    GedcomPerson,
    PersonResponse,
    PersonSummary,
    PersonSurroundings,
    SurroundingsResponse,
)


def get_person_details(person_id: str, gedcom_data: Dict[str, Any]) -> PersonResponse:
    """Get detailed information about a specific person"""
    individuals = gedcom_data.get("individuals", {})

    if person_id not in individuals:
        raise ValueError("Person not found")

    response = PersonResponse(
        success=True, person=GedcomPerson(**individuals[person_id])
    )
    return response


def get_person_surroundings_data(
    person_id: str, gedcom_data: Dict[str, Any]
) -> SurroundingsResponse:
    """Get parents, children, and siblings for a person"""
    individuals = gedcom_data.get("individuals", {})
    families = gedcom_data.get("families", {})

    if person_id not in individuals:
        raise ValueError("Person not found")

    person = individuals[person_id]

    parents = []
    siblings = []
    children = []

    # Get parents and siblings from parent families
    for family_id in person["parent_families"]:
        if family_id in families:
            family = families[family_id]

            # Parents
            if family["husband"] and family["husband"] in individuals:
                parent = individuals[family["husband"]]
                parents.append(
                    {
                        "id": parent["id"],
                        "name": parent["name"],
                    }
                )

            if family["wife"] and family["wife"] in individuals:
                parent = individuals[family["wife"]]
                parents.append(
                    {
                        "id": parent["id"],
                        "name": parent["name"],
                    }
                )

            # Siblings
            for child_id in family["children"]:
                if child_id != person_id and child_id in individuals:
                    sibling = individuals[child_id]
                    siblings.append(
                        {
                            "id": sibling["id"],
                            "name": sibling["name"],
                        }
                    )

    # Get children from spouse families
    for family_id in person["spouse_families"]:
        if family_id in families:
            family = families[family_id]
            for child_id in family["children"]:
                if child_id in individuals:
                    child = individuals[child_id]
                    children.append(
                        {
                            "id": child["id"],
                            "name": child["name"],
                        }
                    )

    surroundings = PersonSurroundings(
        parents=[PersonSummary(**p) for p in parents],
        siblings=[PersonSummary(**s) for s in siblings],
        children=[PersonSummary(**c) for c in children],
    )
    return SurroundingsResponse(success=True, surroundings=surroundings)
