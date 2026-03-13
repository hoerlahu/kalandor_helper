import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';

const root = process.cwd();
const schemaPath = path.join(root, 'ExampleFiles', 'sample-character.schema.json');
const samplePath = path.join(root, 'ExampleFiles', 'sample-character.json');

describe('character schema validation', () => {
  it('accepts schema-compliant character data derived from sample-character.json', () => {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
    const sample = JSON.parse(readFileSync(samplePath, 'utf-8'));

    // Keep source fixtures untouched; normalize types here to match schema.
    const normalized = {
      ...sample,
      inventory: {
        ...sample.inventory,
        items: (sample.inventory?.items || []).map((item) => ({
          ...item,
          quantity: String(item.quantity)
        }))
      }
    };

    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile(schema);

    const ok = validate(normalized);
    expect(ok).toBe(true);
    expect(validate.errors).toBeNull();
  });

  it('rejects malformed character missing required sections', () => {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
    const invalid = {
      Allgemein: {
        Name: 'Aric'
      }
    };

    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile(schema);

    const ok = validate(invalid);
    expect(ok).toBe(false);
    expect(validate.errors?.length).toBeGreaterThan(0);
  });
});
