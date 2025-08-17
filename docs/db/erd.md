# Entity Relationship Diagram

```mermaid
erDiagram
    users {
        uuid id PK
        text auth0_sub UK
        text email
        text name
        text picture
        boolean is_in_db
        boolean is_first_login
        timestamptz created_at
        timestamptz updated_at
    }

    accounts {
        uuid id PK
        text name
        uuid owner_user_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    account_members {
        uuid account_id PK,FK
        uuid user_id PK,FK
        text role
        uuid invited_by FK
        timestamptz created_at
    }

    holidays {
        uuid id PK
        uuid account_id FK
        text holiday_type
        text name
        text description
        date start_date
        date end_date
        text color_light
        text color_dark
        boolean is_custom
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    contacts {
        uuid id PK
        uuid account_id FK
        text name
        text email
        text phone
        text street_address
        text city
        text state
        text postal_code
        text relationship
        text notes
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    tasks {
        uuid id PK
        uuid holiday_id FK
        text title
        text description
        text priority
        text category
        boolean is_completed
        timestamptz completed_date
        date due_date
        uuid assigned_to FK
        uuid created_by FK
        uuid share_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    task_assignees {
        uuid task_id PK,FK
        uuid user_id PK,FK
        timestamptz assigned_at
        uuid assigned_by FK
    }

    gifts {
        uuid id PK
        uuid holiday_id FK
        uuid contact_id FK
        text name
        text description
        numeric price
        numeric actual_price
        text store
        text product_link
        text notes
        boolean is_completed
        timestamptz completed_date
        uuid created_by FK
        uuid share_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    cards {
        uuid id PK
        uuid holiday_id FK
        uuid contact_id FK
        text recipient
        text address
        text message
        boolean is_completed
        timestamptz sent_date
        uuid created_by FK
        uuid share_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    budgets {
        uuid id PK
        uuid holiday_id FK
        text name
        numeric total_budget
        numeric spent_amount
        numeric remaining_amount
        text currency
        date start_date
        date end_date
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    budget_transactions {
        uuid id PK
        uuid budget_id FK
        text name
        text description
        numeric amount
        text category
        date transaction_date
        boolean is_expense
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    shares {
        uuid id PK
        uuid holiday_id FK
        uuid owner_user_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    share_members {
        uuid share_id PK,FK
        uuid user_id PK,FK
        timestamptz joined_at
        uuid invited_by FK
    }

    invites {
        uuid id PK
        uuid share_id FK
        uuid from_user_id FK
        uuid to_user_id FK
        text to_email
        text holiday_key
        text status
        text message
        timestamptz responded_at
        timestamptz created_at
    }

    kwanzaa_principles {
        uuid id PK
        uuid holiday_id FK
        integer day_number
        text name
        text description
        boolean is_completed
        timestamptz completed_at
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    guest_lists {
        uuid id PK
        uuid holiday_id FK
        uuid contact_id FK
        text rsvp_status
        timestamptz rsvp_date
        text notes
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    audit_log {
        uuid id PK
        uuid account_id FK
        uuid user_id FK
        text action
        text entity_type
        uuid entity_id
        jsonb details
        inet ip_address
        text user_agent
        timestamptz created_at
    }

    %% User relationships
    users ||--o{ accounts : "owns"
    users ||--o{ account_members : "belongs_to"
    users ||--o{ holidays : "creates"
    users ||--o{ contacts : "creates"
    users ||--o{ tasks : "creates"
    users ||--o{ tasks : "assigned_to"
    users ||--o{ task_assignees : "assigned_to"
    users ||--o{ task_assignees : "assigned_by"
    users ||--o{ gifts : "creates"
    users ||--o{ cards : "creates"
    users ||--o{ budgets : "creates"
    users ||--o{ budget_transactions : "creates"
    users ||--o{ shares : "owns"
    users ||--o{ share_members : "member_of"
    users ||--o{ invites : "sends"
    users ||--o{ invites : "receives"
    users ||--o{ guest_lists : "creates"
    users ||--o{ audit_log : "performs"

    %% Account relationships
    accounts ||--o{ account_members : "has_members"
    accounts ||--o{ holidays : "contains"
    accounts ||--o{ contacts : "contains"
    accounts ||--o{ audit_log : "tracks"

    %% Holiday relationships
    holidays ||--o{ tasks : "has_tasks"
    holidays ||--o{ gifts : "has_gifts"
    holidays ||--o{ cards : "has_cards"
    holidays ||--o{ budgets : "has_budgets"
    holidays ||--o{ shares : "shared_via"
    holidays ||--o{ kwanzaa_principles : "has_principles"
    holidays ||--o{ guest_lists : "has_guests"

    %% Contact relationships
    contacts ||--o{ gifts : "receives"
    contacts ||--o{ cards : "receives"
    contacts ||--o{ guest_lists : "invited_to"

    %% Task relationships
    tasks ||--o{ task_assignees : "assigned_to"

    %% Budget relationships
    budgets ||--o{ budget_transactions : "has_transactions"

    %% Share relationships
    shares ||--o{ share_members : "has_members"
    shares ||--o{ invites : "has_invites"
    shares ||--o{ tasks : "shared_tasks"
    shares ||--o{ gifts : "shared_gifts"
    shares ||--o{ cards : "shared_cards"

    %% Invite relationships
    invites ||--o{ share_members : "creates_membership"
```

## Key Relationships

1. **Multi-tenant Architecture**: All data is scoped to `accounts` through foreign key relationships
2. **User Collaboration**: Users can belong to multiple accounts and collaborate on holidays
3. **Holiday-Centric Design**: All planning entities (tasks, gifts, cards, budgets) are linked to holidays
4. **Contact Management**: Centralized contacts used across gifts, cards, and guest lists
5. **Sharing System**: Shares enable collaboration on specific holidays with invitation workflow
6. **Audit Trail**: Comprehensive logging of all user actions for security and debugging

## Notes

- All primary keys are UUIDs for security and scalability
- Foreign keys use `ON DELETE CASCADE` where child records shouldn't outlive parents
- Timestamps use `timestamptz` for timezone awareness
- Money fields use `numeric(12,2)` for precision
- The schema supports both individual and collaborative holiday planning
- Auth0 integration is handled through the `auth0_sub` field in users table
