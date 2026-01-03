#!/usr/bin/env python3
"""
Fix subjects data - add missing Slovak subjects
"""

import requests
import json

# Login and get token
login_data = {
    "email": "admin@pocketbuddy.sk",
    "password": "admin123"
}

response = requests.post("https://buddy-ucitel.preview.emergentagent.com/api/auth/login", json=login_data)
token = response.json()["token"]

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# List of missing subjects
missing_subjects = [
    {"name": "Slovenský jazyk a literatúra", "description": "Gramatika, sloh, literatúra"},
    {"name": "Anglický jazyk", "description": "Angličtina pre stredné školy"},
    {"name": "Nemecký jazyk", "description": "Nemčina pre stredné školy"},
    {"name": "Francúzsky jazyk", "description": "Francúzština pre stredné školy"},
    {"name": "Ruský jazyk", "description": "Ruština pre stredné školy"},
    {"name": "Biológia", "description": "Botanika, zoológia, anatómia, genetika"},
    {"name": "Geografia", "description": "Fyzická a humánna geografia"},
    {"name": "Dejepis", "description": "Svetové a slovenské dejiny"},
    {"name": "Občianska náuka", "description": "Právo, politológia, sociológia"},
    {"name": "Ekonomika", "description": "Základy ekonómie a podnikania"},
    {"name": "Účtovníctvo", "description": "Finančné a manažérske účtovníctvo"},
    {"name": "Telesná výchova", "description": "Šport a zdravý životný štýl"},
    {"name": "Výtvarná výchova", "description": "Kresba, maľba, dejiny umenia"},
    {"name": "Hudobná výchova", "description": "Hudba, spev, dejiny hudby"},
    {"name": "Etická výchova", "description": "Morálka, etika, hodnoty"},
    {"name": "Náboženská výchova", "description": "Náboženstvo a duchovné hodnoty"},
    {"name": "Psychológia", "description": "Základy psychológie"},
    {"name": "Filozofia", "description": "Dejiny filozofie, logika"},
    {"name": "Technická výchova", "description": "Technické kreslenie, práca s materiálmi"},
    {"name": "Administratíva a korešpondencia", "description": "Písomná komunikácia, kancelárska práca"},
]

print(f"Adding {len(missing_subjects)} missing subjects...")

for subject in missing_subjects:
    try:
        response = requests.post(
            "https://buddy-ucitel.preview.emergentagent.com/api/subjects",
            json=subject,
            headers=headers
        )
        if response.status_code == 200:
            print(f"✅ Added: {subject['name']}")
        else:
            print(f"❌ Failed to add: {subject['name']} - {response.status_code}")
    except Exception as e:
        print(f"❌ Error adding {subject['name']}: {str(e)}")

# Check final count
response = requests.get("https://buddy-ucitel.preview.emergentagent.com/api/subjects", headers=headers)
subjects = response.json()
print(f"\n📊 Total subjects now: {len(subjects)}")