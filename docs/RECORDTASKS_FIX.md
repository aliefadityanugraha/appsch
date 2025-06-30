# 🛠️ RecordTasks Table Fix

## 📝 Problem

When migrating to Objection.js, a discrepancy was found in the table name for the many-to-many relationship between `Records` and `Tasks`.

1.  **Expected Name**: Objection.js, following its conventions, looks for a table named `RecordTasks`.
2.  **Actual Name**: The existing database schema used a table named `_RecordTasks` (with a leading underscore).

This mismatch caused errors when trying to fetch relations.

## ✅ Solution

The issue was resolved by explicitly defining the junction table name in the model relations.

### In `Records.js` Model:

```javascript
// ...
relationMappings: {
    tasks: {
        relation: Model.ManyToManyRelation,
        modelClass: Task,
        join: {
            from: 'Records.id',
            through: {
                from: '_RecordTasks.A', // Explicitly define table and column
                to: '_RecordTasks.B'
            },
            to: 'Task.id'
        }
    }
}
// ...
```

By specifying `through: { from: '_RecordTasks.A', to: '_RecordTasks.B' }`, we tell Objection.js to use the correct table `_RecordTasks` and its columns `A` and `B` for the join, resolving the issue without needing to rename the database table.

## Penyebab
1. **Nama tabel tidak sesuai**: Objection.js mencari tabel `