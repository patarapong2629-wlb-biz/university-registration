# university-registration

Generate test data for unvidersity registration process.

## How to run

1. To start MySQL database:

   ```sh
   make university_db
   ```

2. To stop MySQL database:

   ```sh
   make down
   ```

3. To generate new set of test data:

   Parameters:

   - TOTAL_FACULTIES (max 22 faculties)
   - TOTAL_STUDENTS
   - REGISTRATION_SEMESTER (1 or 2)

   ```sh
   make seed_university_data
   ```

   After generated new test data run `make down` and `make university_db` to restart database.

## Database diagram

```mermaid
erDiagram
    faculties {
        int id PK
        varchar(255) name
        text description
        timestamp created
        timestamp updated
    }

    departments {
        int id PK
        varchar(255) name
        text description
        int faculty_id FK
        timestamp created
        timestamp updated
    }

    students {
        int id PK
        varchar(255) first_name
        varchar(255) last_name
        int faculty_id FK
        int department_id FK
        tinyint academic_year
        timestamp created
        timestamp updated
    }

    courses {
        int id PK
        varchar(16) code UK
        varchar(255) name
        tinyint credits
        timestamp created
        timestamp updated
    }

    pre_registrations {
        int id PK
        int student_id FK
        varchar(16) course_code FK
        int year
        int semester
        timestamp created
        timestamp updated
    }

    registrations {
        int id PK
        int student_id FK
        varchar(16) course_code FK
        enum registration_type
        int year
        int semester
        enum status
        timestamp created
        timestamp updated
    }

    faculties ||--o{ departments : "has"
    faculties ||--o{ students : "enrolls"
    departments ||--o{ students : "belongs to"
    students ||--o{ pre_registrations : "makes"
    students ||--o{ registrations : "makes"
    courses }o--|| pre_registrations : "is for"
    courses }o--|| registrations : "is for"
```

## Generate test data flow chart

```mermaid
flowchart TD
 subgraph G[" "]
        G2{"Loop through selected faculties"}
        G1["Shuffle & select faculties"]
        G3["Append faculty SQL"]
        G4["Store its departments in a temp array"]
  end
 subgraph H[" "]
        H2["Append department SQL with correct faculty_id"]
        H1{"Loop through temp departments array"}
  end
 subgraph I[" "]
        I2{"Loop through each department"}
        I1["Calculate students per department"]
        I3["Generate students for the department"]
        I4["Append student SQL"]
        I5@{ label: "Store student info in 'students' array" }
  end
 subgraph J[" "]
        J2["Append course SQL"]
        J1{"Loop through mock courses"}
  end
 subgraph K[" "]
        K2{"For each student, loop past semesters"}
        K1@{ label: "Loop through 'students' array" }
        K3["Find study plan & generate registration SQL"]
  end
    A["Start"] --> B{"Initialize & Read ENV Vars"}
    B --> C{"Validate Faculty Count"}
    C -- Yes > Limit --> D["Throw Error & Exit"]
    C -- "No &lt;= Limit" --> E{"Ensure Output Directory Exists"}
    E --> F["Begin Building SQL String"]
    F --> G
    G1 --> G2
    G2 --> G3
    G3 --> G4
    G4 --> G2
    G --> H
    H1 --> H2
    H --> I
    I1 --> I2
    I2 --> I3
    I3 --> I4
    I4 --> I5
    I5 --> I2
    I --> J
    J1 --> J2
    J --> K
    K1 --> K2
    K2 --> K3
    K3 --> K2
    K --> L{"Write Final SQL to File"}
    L -- Success --> M["End"]
    L -- Failure --> N["Throw Error & Exit"]

    I5@{ shape: rect}
    K1@{ shape: diamond}
```
