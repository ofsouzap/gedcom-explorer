from models import (
    GedcomData,
    GedcomPerson,
    PersonSummary,
    PersonSurroundings,
)


def get_person_details(person_id: str, gedcom_data: GedcomData) -> GedcomPerson:
    """Get detailed information about a specific person"""
    individuals = gedcom_data.individuals

    if person_id not in individuals:
        raise ValueError("Person not found")

    return individuals[person_id]


def get_person_surroundings_data(
    person_id: str, gedcom_data: GedcomData
) -> PersonSurroundings:
    """Get parents, children, and siblings for a person"""
    individuals = gedcom_data.individuals
    families = gedcom_data.families

    if person_id not in individuals:
        raise ValueError("Person not found")

    person = individuals[person_id]

    parents = []
    siblings = []
    children = []

    # Get parents and siblings from parent families
    for family_id in person.parent_families:
        if family_id in families:
            family = families[family_id]

            # Parents
            if family.husband and family.husband in individuals:
                parent = individuals[family.husband]
                parents.append(
                    PersonSummary(
                        id=parent.id,
                        name=parent.name,
                    )
                )

            if family.wife and family.wife in individuals:
                parent = individuals[family.wife]
                parents.append(
                    PersonSummary(
                        id=parent.id,
                        name=parent.name,
                    )
                )

            # Siblings
            for child_id in family.children:
                if child_id != person_id and child_id in individuals:
                    sibling = individuals[child_id]
                    siblings.append(
                        PersonSummary(
                            id=sibling.id,
                            name=sibling.name,
                        )
                    )

    # Get children from spouse families
    for family_id in person.spouse_families:
        if family_id in families:
            family = families[family_id]
            for child_id in family.children:
                if child_id in individuals:
                    child = individuals[child_id]
                    children.append(
                        PersonSummary(
                            id=child.id,
                            name=child.name,
                        )
                    )

    return PersonSurroundings(
        parents=parents,
        siblings=siblings,
        children=children,
    )
