# API Requirement: Get Levels for Selection

To allow Educators to easily select a level when creating a Quiz, we need an API that returns the list of available levels with their names and IDs.

### GET `/api/v1/educator/levels`

**Description:** Retrieves a list of levels that the educator can assign to a quiz.

**Response (JSON):**
```json
{
    "status": "success",
    "data": [
        {
            "id": "uuid-1",
            "name": "Level 1: Basic Pronunciation",
            "dialectId": "north-uuid"
        },
        {
            "id": "uuid-2",
            "name": "Level 2: Intermediate Phonemes",
            "dialectId": "north-uuid"
        }
    ]
}
```

---

## Technical Justification
Currently, the `QuizManagementPage.tsx` requires users to manually enter a `levelId` (UUID), which is error-prone and poor UX. With this API, the Frontend will implement a **Searchable Select** (Dropdown) that displays the level names while submitting the corresponding IDs behind the scenes.
