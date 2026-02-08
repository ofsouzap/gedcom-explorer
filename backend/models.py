from pydantic import BaseModel
from typing import Optional, List, Dict


class GedcomPerson(BaseModel):
    id: str
    name: str
    birth_date: Optional[str]
    death_date: Optional[str]
    parent_families: List[str]
    spouse_families: List[str]


class GedcomFamily(BaseModel):
    id: str
    husband: Optional[str]
    wife: Optional[str]
    children: List[str]


class GedcomData(BaseModel):
    individuals: Dict[str, GedcomPerson]
    families: Dict[str, GedcomFamily]


class ParseResponse(BaseModel):
    success: bool
    data: GedcomData


class PersonResponse(BaseModel):
    success: bool
    person: GedcomPerson


class PersonSummary(BaseModel):
    id: str
    name: str


class PersonSurroundings(BaseModel):
    parents: List[PersonSummary]
    siblings: List[PersonSummary]
    children: List[PersonSummary]


class SurroundingsResponse(BaseModel):
    success: bool
    surroundings: PersonSurroundings
