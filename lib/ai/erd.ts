import { z } from "zod";
import type { ERDDocument } from "./types";

export const erdColumnTypeSchema = z.enum([
  "uuid",
  "integer",
  "bigint",
  "decimal",
  "boolean",
  "text",
  "varchar",
  "date",
  "time",
  "timestamp",
  "timestamptz",
  "jsonb",
  "enum",
]);

export const erdColumnSchema = z.object({
  name: z.string().min(1),
  type: erdColumnTypeSchema,
  nullable: z.boolean(),
  primary_key: z.boolean(),
  unique: z.boolean(),
  default_value: z.string().nullable().optional(),
  references: z
    .object({
      entity: z.string().min(1),
      column: z.string().min(1),
    })
    .nullable()
    .optional(),
  description: z.string().min(1),
});

export const erdEntitySchema = z.object({
  name: z.string().min(1),
  table_name: z.string().min(1),
  description: z.string().min(1),
  columns: z.array(erdColumnSchema),
});

export const erdRelationshipCardinalitySchema = z.enum([
  "1:1",
  "1:N",
  "N:1",
  "N:M",
]);

export const erdRelationshipSchema = z.object({
  id: z.string().min(1),
  from_entity: z.string().min(1),
  to_entity: z.string().min(1),
  cardinality: erdRelationshipCardinalitySchema,
  foreign_key: z
    .object({
      entity: z.string().min(1),
      column: z.string().min(1),
    })
    .nullable()
    .optional(),
  description: z.string().min(1),
});

export const erdIndexSchema = z.object({
  name: z.string().min(1),
  entity: z.string().min(1),
  columns: z.array(z.string().min(1)),
  unique: z.boolean(),
  reason: z.string().min(1),
});

export const erdConstraintSchema = z.object({
  id: z.string().min(1),
  entity: z.string().min(1),
  type: z.enum(["primary_key", "foreign_key", "unique", "check", "not_null"]),
  description: z.string().min(1),
});

export const erdAssumptionSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  reason: z.string().min(1),
});

export const erdDocumentSchema = z.object({
  version: z.number(),
  database: z.literal("postgresql"),
  summary: z.string().min(1),
  entities: z.array(erdEntitySchema),
  relationships: z.array(erdRelationshipSchema),
  indexes: z.array(erdIndexSchema),
  constraints: z.array(erdConstraintSchema),
  assumptions: z.array(erdAssumptionSchema),
});

export const erdReviewIssueKindSchema = z.enum([
  "normalization_issue",
  "missing_foreign_key",
  "invalid_relationship",
  "missing_constraint",
  "missing_index",
  "redundant_entity",
  "redundant_column",
  "inappropriate_data_type",
  "inappropriate_jsonb",
  "primary_key_issue",
  "business_rule_issue",
  "historical_data_issue",
  "security_model_issue",
  "naming_issue",
  "traceability_issue",
  "complexity_issue",
  "recommended_improvement",
]);

export const erdReviewSeveritySchema = z.enum(["important", "minor"]);

export const erdReviewIssueSchema = z.object({
  id: z.string().min(1),
  severity: erdReviewSeveritySchema,
  kind: erdReviewIssueKindSchema,
  entity: z.string().optional(),
  column: z.string().optional(),
  relationship: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  evidence: z.string().min(1),
  recommendation: z.string().min(1),
  requires_user_decision: z.boolean(),
});

export const erdReviewSchema = z.object({
  summary: z.string().min(1),
  issues: z.array(erdReviewIssueSchema),
  ready_for_approval: z.boolean(),
});

export function validateERDDocument(doc: ERDDocument): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const entityNames = new Set<string>();
  const tableNames = new Set<string>();
  const entityColumnsMap = new Map<string, Set<string>>();

  // Check entities
  for (const entity of doc.entities) {
    if (entityNames.has(entity.name)) {
      errors.push(`Duplicate entity name: ${entity.name}`);
    }
    entityNames.add(entity.name);

    if (tableNames.has(entity.table_name)) {
      errors.push(`Duplicate table name: ${entity.table_name}`);
    }
    tableNames.add(entity.table_name);

    const columnNames = new Set<string>();
    let pkCount = 0;

    for (const col of entity.columns) {
      if (columnNames.has(col.name)) {
        errors.push(`Duplicate column name '${col.name}' in entity '${entity.name}'`);
      }
      columnNames.add(col.name);

      if (col.primary_key) pkCount++;

      // Check column references
      if (col.references) {
        if (!entityNames.has(col.references.entity)) {
          // Can't strictly check column yet since it might be forward referenced,
          // but we can check if it exists in the document.
          const refEntity = doc.entities.find((e) => e.name === col.references!.entity);
          if (!refEntity) {
            errors.push(
              `Column '${col.name}' in '${entity.name}' references non-existent entity '${col.references.entity}'`,
            );
          } else {
            const refCol = refEntity.columns.find((c) => c.name === col.references!.column);
            if (!refCol) {
              errors.push(
                `Column '${col.name}' in '${entity.name}' references non-existent column '${col.references.column}' in entity '${col.references.entity}'`,
              );
            }
          }
        }
      }
    }

    if (pkCount !== 1) {
      errors.push(`Entity '${entity.name}' must have exactly one primary key column, found ${pkCount}`);
    }

    entityColumnsMap.set(entity.name, columnNames);
  }

  // Check relationships
  for (const rel of doc.relationships) {
    if (!entityNames.has(rel.from_entity)) {
      errors.push(`Relationship '${rel.id}' references non-existent from_entity '${rel.from_entity}'`);
    }
    if (!entityNames.has(rel.to_entity)) {
      errors.push(`Relationship '${rel.id}' references non-existent to_entity '${rel.to_entity}'`);
    }

    if (rel.foreign_key) {
      const fkEntity = doc.entities.find((e) => e.name === rel.foreign_key!.entity);
      if (!fkEntity) {
        errors.push(`Relationship '${rel.id}' foreign_key references non-existent entity '${rel.foreign_key.entity}'`);
      } else {
        const fkCol = fkEntity.columns.find((c) => c.name === rel.foreign_key!.column);
        if (!fkCol) {
          errors.push(`Relationship '${rel.id}' foreign_key references non-existent column '${rel.foreign_key.column}' in '${rel.foreign_key.entity}'`);
        }
      }
    }
  }

  // Check indexes
  for (const idx of doc.indexes) {
    if (!entityNames.has(idx.entity)) {
      errors.push(`Index '${idx.name}' references non-existent entity '${idx.entity}'`);
    } else {
      const cols = entityColumnsMap.get(idx.entity);
      for (const c of idx.columns) {
        if (cols && !cols.has(c)) {
          errors.push(`Index '${idx.name}' references non-existent column '${c}' in entity '${idx.entity}'`);
        }
      }
    }
  }

  // Check constraints
  for (const cst of doc.constraints) {
    if (!entityNames.has(cst.entity)) {
      errors.push(`Constraint '${cst.id}' references non-existent entity '${cst.entity}'`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
